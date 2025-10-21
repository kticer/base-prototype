// Minimal Express proxy for Gemini API (ESM, quickstart-aligned)
// NOTE: Do NOT commit real API keys. Set GEMINI_API_KEY in your environment.
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { randomUUID } from 'node:crypto';
import logger from './logger.js';

// Optional: install @google/generative-ai and uncomment below when ready
// import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(express.json({ limit: '1mb' }));

// Logger scoped to this service
const log = logger.child({ svc: 'chat-proxy' });

// Warn once if running in mock mode
if (!process.env.GEMINI_API_KEY) {
  log.warn('GEMINI_API_KEY not set, running in MOCK mode');
}

// Allow overriding model via env; default to a candidate we will verify via ListModels
const PREFERRED_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';
const REQUIRE_FLASH = (process.env.GEMINI_REQUIRE_FLASH ?? 'true').toLowerCase() === 'true';
log.info('config:model', { preferred: PREFERRED_MODEL, requireFlash: REQUIRE_FLASH, mock: !process.env.GEMINI_API_KEY });

let resolvedModelId = null;
async function resolveModelId() {
  if (resolvedModelId) return resolvedModelId;
  const key = process.env.GEMINI_API_KEY;
  // If no key, we are in mock mode; just return preferred as a placeholder
  if (!key) { resolvedModelId = PREFERRED_MODEL; return resolvedModelId; }
  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`);
    if (!resp.ok) throw new Error(`ListModels failed: ${resp.status} ${resp.statusText}`);
    const data = await resp.json();
    const models = Array.isArray(data.models) ? data.models : [];
    const names = models.map(m => ({
      id: String(m.name || '').replace(/^models\//, ''),
      canStream: Array.isArray(m.supportedGenerationMethods) ? m.supportedGenerationMethods.includes('generateContent') : true,
      raw: m,
    }));
    // Scoring helper to prioritize flash 2.5 first, then 2.0, then 1.5
    const rank = (id) => {
      const lower = String(id).toLowerCase();
      if (/preview|exp/.test(lower)) return -1; // avoid previews on free tier
      if (/flash/.test(lower)) {
        if (/2\.5/.test(lower)) return 100;
        if (/2\.0/.test(lower)) return 90;
        if (/1\.5.*latest/.test(lower)) return 80;
        if (/1\.5.*002/.test(lower)) return 75;
        if (/1\.5/.test(lower)) return 70;
        return 60; // other flash variants
      }
      // Not flash
      if (REQUIRE_FLASH) return -2; // exclude when flash required
      if (/pro/.test(lower)) return 20;
      return 10;
    };

    // Prefer flash models, highest rank first
    const flashFirst = names
      .filter(n => n.canStream)
      .sort((a, b) => {
        const da = rank(a.id);
        const db = rank(b.id);
        if (db !== da) return db - da;
        return b.id.localeCompare(a.id);
      })
      .filter(n => rank(n.id) >= 60); // keep only flash when required
    if (flashFirst.length) {
      resolvedModelId = flashFirst[0].id;
      log.info('model:resolved', { model: resolvedModelId, via: 'list_flash' });
      return resolvedModelId;
    }
    if (!REQUIRE_FLASH) {
      // If flash not required, pick any model that supports generateContent (avoid pro-preview if possible)
      const nonPreview = names.filter(n => !/preview|exp/i.test(n.id) && !/vision/i.test(n.id) && n.canStream);
      if (nonPreview.length) {
        resolvedModelId = nonPreview[0].id;
        log.info('model:resolved', { model: resolvedModelId, via: 'list_any_nonpreview' });
        return resolvedModelId;
      }
      const any = names.find(n => n.canStream);
      if (any) {
        resolvedModelId = any.id;
        log.info('model:resolved', { model: resolvedModelId, via: 'list_any' });
        return resolvedModelId;
      }
    }
    // If we require flash and none found, we will operate in mock or still try preferred
    log.warn('model:no_flash_available', { requireFlash: REQUIRE_FLASH, preferred: PREFERRED_MODEL });
    resolvedModelId = PREFERRED_MODEL;
    return resolvedModelId;
    // Last resort: keep preferred
    resolvedModelId = PREFERRED_MODEL;
    log.warn('model:resolution_failed_using_preferred', { preferred: PREFERRED_MODEL });
    return resolvedModelId;
  } catch (e) {
    log.warn('model:list_failed_using_preferred', { error: e instanceof Error ? { message: e.message } : e, preferred: PREFERRED_MODEL });
    resolvedModelId = PREFERRED_MODEL;
    return resolvedModelId;
  }
}

// Basic request/response logging with latency
app.use((req, res, next) => {
  try {
    const id = String(req.headers['x-request-id'] || randomUUID());
    req.id = id;
    res.setHeader('x-request-id', id);
  } catch (_) {}
  const start = process.hrtime.bigint();
  log.info('request:start', { id: req.id, method: req.method, url: req.originalUrl });
  res.on('finish', () => {
    const durMs = Number(process.hrtime.bigint() - start) / 1e6;
    log.info('request:finish', { id: req.id, method: req.method, url: req.originalUrl, status: res.statusCode, durationMs: Math.round(durMs) });
  });
  next();
});

app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, context } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      log.warn('chat:bad_request', { id: req.id, reason: 'Missing prompt' });
      return res.status(400).json({ error: 'Missing prompt' });
    }

    const useMock = !process.env.GEMINI_API_KEY;
    if (useMock) {
      // Structured mock to match client expectations
      log.debug('chat:mock_response', { id: req.id, promptLen: String(prompt).length });
      return res.json({ text: `MOCK: ${prompt.slice(0, 200)}` });
    }

    // Real call
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelId = await resolveModelId();
    const model = genAI.getGenerativeModel({ model: modelId });

    // Build context-aware system prompt
    const screenType = context?.screen || 'document-viewer';
    const baseInstructions = [
      'You are an AI assistant for Turnitin, helping instructors evaluate student submissions.',
      'IMPORTANT: The user is an instructor/teacher grading student work, NOT a student writing an essay.',
      'Never suggest actions for the student or assume the user wrote the paper being reviewed.',
      'Focus on helping the instructor assess academic integrity, provide feedback, and grade submissions.',
      'Be concise, helpful, and actionable in your responses.',
    ];

    const screenInstructions = {
      'document-viewer': [
        'You help instructors analyze student papers for academic integrity and provide grading feedback.',
        'The instructor is reviewing a student submission - offer assessment guidance, not writing advice.',
        'Use pre-computed metrics (metrics.totalMatches, metrics.uncitedMatches, etc.) instead of calculating.',
        'Include action buttons: [ACTION:draft_comment|Label], [ACTION:add_comment|Label|text|highlightId|page], [ACTION:show_source|Label|matchCardId].',
        'When adding comments about specific text, include the highlightId from visibleHighlights and page number for proper positioning.',
        'Use SourceNameToIdMap to get correct source IDs. Explain scores plainly, identify largest source, note integrity concerns.',
      ],
      'inbox': [
        'Help instructors manage their student submissions inbox.',
        'Use pre-computed metrics (metrics.total, metrics.ungraded, metrics.highSimilarity, etc.).',
        ''Use provided triageWeights and submissions.priorityScore/priorityRank to determine review order. Do not recompute from scratch.',
        'You may also use topPriorityIds for quick ordering.',
        'Prioritize by flags', AI writing risk, similarity, ungraded status, and recency as reflected in priorityScore. Use priorityRank when listing.',
        'For "show submissions" queries, generate table artifacts with type:"table". Do not generate rubrics for inbox.',
      ],
      'settings': [
        'You are helping an instructor configure assignment settings for their students.',
        'Explain configuration options and recommend best practices for similarity thresholds and AI detection.',
      ],
      'insights': [
        'Analyze course-wide statistics and trends from student submissions.',
        'Use pre-computed metrics (metrics.totalSubmissions, metrics.avgSimilarity, metrics.highRiskCount, metrics.citationQuality, etc.).',
      ],
    };

    const artifactInstructions = [
      'When creating structured documents, emit a single JSON artifact inside a ```json code block only when structure is explicitly helpful.',
      'Never generate a RUBRIC unless the user explicitly asks for a rubric or grading criteria.',
      'RUBRIC: type:"rubric", layout:"grid"|"linear", criteria with name/description/points/levels.',
      'FEEDBACK PLAN: type:"feedback-plan", title, sections:[{heading, content}].',
      'REPORT: type:"report", title, sections:[{heading, content, items?}]. Prefer REPORT for summaries/analyses.',
      'TABLE: type:"table", title, headers:[...], rows:[...]. Use for lists in Inbox/Insights.',
      'Choose the type based on the request; when ambiguous, prefer a concise, well-formatted Markdown answer over forcing an artifact.',
    ];

    // Join with space - Gemini systemInstruction must be a simple text string
    const sys = [
      ...baseInstructions,
      ...(screenInstructions[screenType] || screenInstructions['document-viewer']),
      ...artifactInstructions,
    ].join(' ');

    const light = lighten(context);
    const ctxText = [
      `Doc: ${JSON.stringify(light.doc)}`,
      `Word Count: ${light.wordCount || 'unknown'}`,
      `Similarity Score: ${light.similarityScore !== undefined ? light.similarityScore + '%' : 'unknown'}`,
      `Selection: ${light.selection ? JSON.stringify(light.selection) : 'none'}`,
      `FocusText: ${JSON.stringify(light.focusText)}`,
      `Highlights: ${JSON.stringify(light.visibleHighlights)}`,
      `TopSources: ${JSON.stringify(light.matchCards)}`,
      Object.keys(light.sourceIdMap).length > 0 ? `SourceNameToIdMap: ${JSON.stringify(light.sourceIdMap)}` : '',
      `Primary Tab: ${context?.primaryTab || 'Similarity'}`,
      `Current Page: ${context?.currentPage || 1}`,
      // Page content for better analysis
      light.pages?.current ? `\nCurrent Page Content (Page ${light.pages.current.pageNumber}):\n${light.pages.current.content}` : '',
      light.pages?.first && light.pages.first.pageNumber !== light.pages.current?.pageNumber ? `\nFirst Page Content (Page ${light.pages.first.pageNumber}):\n${light.pages.first.content}` : '',
      light.pages?.last && light.pages.last.pageNumber !== light.pages.current?.pageNumber && light.pages.last.pageNumber !== light.pages.first?.pageNumber ? `\nLast Page Content (Page ${light.pages.last.pageNumber}):\n${light.pages.last.content}` : '',
      // Inbox-specific context with computed metrics
      light.metrics ? `Metrics: ${JSON.stringify(light.metrics)}` : '',
      light.submissions?.length > 0 ? `Submissions: ${JSON.stringify(light.submissions)}` : '',
      light.totalSubmissions !== undefined ? `Total Submissions: ${light.totalSubmissions}` : '',
      light.avgSimilarity !== undefined ? `Avg Similarity: ${light.avgSimilarity}%` : '',
    ].filter(Boolean).join('\n');

    // Build conversation history for multi-turn chat
    const conversationHistory = context?.conversationHistory || [];
    const chatHistory = conversationHistory
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    log.debug('chat:invoke_model', { id: req.id, historyLen: chatHistory.length, systemLen: sys.length, contextLen: ctxText.length });

    // Use Gemini's chat interface with history
    // systemInstruction must be a Content object with parts array
    const chat = model.startChat({
      history: chatHistory,
      systemInstruction: {
        role: 'system',
        parts: [{ text: sys }],
      },
    });

    // Prepend context to the user's prompt
    const promptWithContext = ctxText ? `${ctxText}\n\nUser Query: ${prompt}` : prompt;
    const result = await chat.sendMessage(promptWithContext);
    const text = result?.response?.text?.() ?? '';
    log.info('chat:success', { id: req.id, textLen: text.length });
    return res.json({ text });
  } catch (e) {
    log.error('chat:error', { id: req.id, error: e instanceof Error ? { message: e.message, stack: e.stack } : e });
    return res.status(500).json({ error: 'Server error' });
  }
});

// Streaming endpoint using chunked transfer
app.post('/api/chat/stream', async (req, res) => {
  try {
    const { prompt, context } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).end('Missing prompt');
      log.warn('chat_stream:bad_request', { id: req.id, reason: 'Missing prompt' });
      return;
    }
    const useMock = !process.env.GEMINI_API_KEY;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');

    if (useMock) {
      const text = `MOCK STREAM: ${String(prompt).slice(0, 160)}`;
      log.debug('chat_stream:mock_start', { id: req.id, promptLen: String(prompt).length });
      for (const chunk of text.match(/.{1,24}/g) || []) {
        res.write(chunk);
        await new Promise(r => setTimeout(r, 40));
      }
      log.info('chat_stream:mock_end', { id: req.id });
      res.end();
      return;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelId = await resolveModelId();
    const model = genAI.getGenerativeModel({ model: modelId });

    // Build context-aware system prompt (same as non-streaming)
    const screenType = context?.screen || 'document-viewer';
    const baseInstructions = [
      'You are an AI assistant for Turnitin, helping instructors evaluate student submissions.',
      'IMPORTANT: The user is an instructor/teacher grading student work, NOT a student writing an essay.',
      'Never suggest actions for the student or assume the user wrote the paper being reviewed.',
      'Focus on helping the instructor assess academic integrity, provide feedback, and grade submissions.',
      'Be concise, helpful, and actionable in your responses.',
    ];

    const screenInstructions = {
      'document-viewer': [
        'You help instructors analyze student papers for academic integrity and provide grading feedback.',
        'The instructor is reviewing a student submission - offer assessment guidance, not writing advice.',
        'Use pre-computed metrics (metrics.totalMatches, metrics.uncitedMatches, etc.) instead of calculating.',
        'Include action buttons: [ACTION:draft_comment|Label], [ACTION:add_comment|Label|text|highlightId|page], [ACTION:show_source|Label|matchCardId].',
        'When adding comments about specific text, include the highlightId from visibleHighlights and page number for proper positioning.',
        'Use SourceNameToIdMap to get correct source IDs. Explain scores plainly, identify largest source, note integrity concerns.',
      ],
      'inbox': [
        'Help instructors manage their student submissions inbox.',
        'Use pre-computed metrics (metrics.total, metrics.ungraded, metrics.highSimilarity, etc.).',
        'For "show submissions" queries, generate table artifacts with type:"table". Do not generate rubrics for inbox.',
      ],
      'settings': [
        'You are helping an instructor configure assignment settings for their students.',
        'Explain configuration options and recommend best practices for similarity thresholds and AI detection.',
      ],
      'insights': [
        'Analyze course-wide statistics and trends from student submissions.',
        'Use pre-computed metrics (metrics.totalSubmissions, metrics.avgSimilarity, metrics.highRiskCount, metrics.citationQuality, etc.).',
      ],
    };

    const artifactInstructions = [
      'When creating structured documents, emit a single JSON artifact inside a ```json code block only when structure is explicitly helpful.',
      'Never generate a RUBRIC unless the user explicitly asks for a rubric or grading criteria.',
      'RUBRIC: type:"rubric", layout:"grid"|"linear", criteria with name/description/points/levels.',
      'FEEDBACK PLAN: type:"feedback-plan", title, sections:[{heading, content}].',
      'REPORT: type:"report", title, sections:[{heading, content, items?}]. Prefer REPORT for summaries/analyses.',
      'TABLE: type:"table", title, headers:[...], rows:[...]. Use for lists in Inbox/Insights.',
      'Choose the type based on the request; when ambiguous, prefer a concise, well-formatted Markdown answer over forcing an artifact.',
    ];

    // Join with space - Gemini systemInstruction must be a simple text string
    const sys = [
      ...baseInstructions,
      ...(screenInstructions[screenType] || screenInstructions['document-viewer']),
      ...artifactInstructions,
    ].join(' ');

    const light = lighten(context);
    const ctxText = [
      `Doc: ${JSON.stringify(light.doc)}`,
      `Word Count: ${light.wordCount || 'unknown'}`,
      `Similarity Score: ${light.similarityScore !== undefined ? light.similarityScore + '%' : 'unknown'}`,
      `Selection: ${light.selection ? JSON.stringify(light.selection) : 'none'}`,
      `FocusText: ${JSON.stringify(light.focusText)}`,
      `Highlights: ${JSON.stringify(light.visibleHighlights)}`,
      `TopSources: ${JSON.stringify(light.matchCards)}`,
      Object.keys(light.sourceIdMap).length > 0 ? `SourceNameToIdMap: ${JSON.stringify(light.sourceIdMap)}` : '',
      `Primary Tab: ${context?.primaryTab || 'Similarity'}`,
      `Current Page: ${context?.currentPage || 1}`,
      // Page content for better analysis
      light.pages?.current ? `\nCurrent Page Content (Page ${light.pages.current.pageNumber}):\n${light.pages.current.content}` : '',
      light.pages?.first && light.pages.first.pageNumber !== light.pages.current?.pageNumber ? `\nFirst Page Content (Page ${light.pages.first.pageNumber}):\n${light.pages.first.content}` : '',
      light.pages?.last && light.pages.last.pageNumber !== light.pages.current?.pageNumber && light.pages.last.pageNumber !== light.pages.first?.pageNumber ? `\nLast Page Content (Page ${light.pages.last.pageNumber}):\n${light.pages.last.content}` : '',
      // Inbox-specific context with computed metrics
      light.metrics ? `Metrics: ${JSON.stringify(light.metrics)}` : '',
      light.submissions?.length > 0 ? `Submissions: ${JSON.stringify(light.submissions)}` : '',
      light.totalSubmissions !== undefined ? `Total Submissions: ${light.totalSubmissions}` : '',
      light.avgSimilarity !== undefined ? `Avg Similarity: ${light.avgSimilarity}%` : '',
    ].filter(Boolean).join('\n');

    // Build conversation history for multi-turn chat
    const conversationHistory = context?.conversationHistory || [];
    const chatHistory = conversationHistory
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    log.debug('chat_stream:invoke_model', { id: req.id, historyLen: chatHistory.length, systemLen: sys.length, contextLen: ctxText.length });

    // Prepend context to the user's prompt
    const promptWithContext = ctxText ? `${ctxText}\n\nUser Query: ${prompt}` : prompt;

    try {
      // Use Gemini's chat interface with history for streaming
      // systemInstruction must be a Content object with parts array
      const chat = model.startChat({
        history: chatHistory,
        systemInstruction: {
          role: 'system',
          parts: [{ text: sys }],
        },
      });

      const result = await chat.sendMessageStream(promptWithContext);
      for await (const chunk of result.stream) {
        const t = chunk.text();
        if (t) res.write(t);
      }
      log.info('chat_stream:success', { id: req.id });
      res.end();
    } catch (err) {
      // If streaming isn't supported for this model, fall back to non-streaming with history
      log.warn('chat_stream:fallback_to_nonstream', { id: req.id, error: err instanceof Error ? { message: err.message } : err });
      const chat = model.startChat({
        history: chatHistory,
        systemInstruction: {
          role: 'system',
          parts: [{ text: sys }],
        },
      });
      const nonstream = await chat.sendMessage(promptWithContext);
      const text = nonstream?.response?.text?.() ?? '';
      res.write(text || '\n[Chat server] No content returned from Gemini.');
      res.end();
    }
  } catch (e) {
    log.error('chat_stream:error', { id: req.id, error: e instanceof Error ? { message: e.message, stack: e.stack } : e });
    try {
      // Send a friendly error message so the UI shows something useful
      res.write('\n[Chat server error] Unable to get a response from Gemini.');
      if (process.env.LOG_LEVEL === 'debug') {
        const msg = (e && e.message) ? String(e.message) : '';
        if (msg) res.write(`\nReason: ${msg}`);
      }
      res.end();
    } catch {}
  }
});

const PORT = Number(process.env.PORT || 8787);
const server = app.listen(PORT, () => {
  const addr = server.address();
  const actualPort = typeof addr === 'object' && addr ? addr.port : PORT;
  log.info('server:listening', { url: `http://localhost:${actualPort}` });
});

// Health endpoint for quick checks
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', mock: !process.env.GEMINI_API_KEY });
});

// Server lifecycle visibility
server.on('close', () => {
  log.warn('server:closed');
});
server.on('error', (err) => {
  const code = err && err.code;
  if (code === 'EADDRINUSE') {
    log.error('server:port_in_use', { port: PORT, hint: 'Another process is listening on this port.' });
    log.info('server:resolution', { step: "Find process", cmd: `lsof -nP -iTCP:${PORT} -sTCP:LISTEN` });
    log.info('server:resolution', { step: "Kill process", cmd: `kill -TERM <PID>` });
    log.info('server:resolution', { step: "Retry start", cmd: `LOG_LEVEL=debug npm run chat-api` });
    log.info('server:note', { viteProxy: `Vite dev proxy targets http://localhost:${PORT}` });
    // Exit with failure so caller knows startup failed
    setImmediate(() => process.exit(1));
    return;
  }
  log.error('server:error', { error: { message: err?.message, code: err?.code, stack: err?.stack } });
});

// Global error visibility
process.on('unhandledRejection', (reason) => {
  log.error('unhandledRejection', { reason });
});
process.on('uncaughtException', (err) => {
  log.error('uncaughtException', { error: { message: err?.message, stack: err?.stack } });
});
process.on('SIGINT', () => {
  log.warn('signal:SIGINT');
});
process.on('SIGTERM', () => {
  log.warn('signal:SIGTERM');
});

function lighten(ctx) {
  if (!ctx) return {};
  const { doc, wordCount, similarityScore, matchCards, settings, submissions, totalSubmissions, avgSimilarity, metrics, pages, sourceIdMap } = ctx;
  return {
    doc: doc ? { id: doc.id, title: doc.title, author: doc.author } : null,
    wordCount,
    similarityScore,
    matchCards: Array.isArray(matchCards)
      ? matchCards.slice(0, 5).map((m) => ({
          id: m.id,
          sourceName: m.sourceName,
          similarityPercent: m.similarityPercent,
          isCited: m.isCited,
          academicIntegrityIssue: m.academicIntegrityIssue,
          matchCount: m.matchCount,
        }))
      : [],
    sourceIdMap: sourceIdMap || {},
    // Include page content for better analysis
    pages: pages ? {
      current: pages.current ? {
        pageNumber: pages.current.pageNumber,
        content: String(pages.current.content || '').slice(0, 8000), // Current page up to 8000 chars
      } : null,
      first: pages.first ? {
        pageNumber: pages.first.pageNumber,
        content: String(pages.first.content || '').slice(0, 4000), // First page (intro/thesis) up to 4000 chars
      } : null,
      last: pages.last ? {
        pageNumber: pages.last.pageNumber,
        content: String(pages.last.content || '').slice(0, 4000), // Last page (conclusion/works cited) up to 4000 chars
      } : null,
      total: pages.total,
    } : null,
    // Inbox context
    metrics: metrics || undefined, // Computed metrics for instant answers
    submissions: Array.isArray(submissions)
      ? submissions.slice(0, 30).map(s => ({
          id: s.id,
          title: String(s.title || '').slice(0, 100),
          author: String(s.author || '').slice(0, 50),
          similarity: s.similarity,
          grade: s.grade,
        }))
      : [],
    totalSubmissions,
    avgSimilarity,
    selection: settings?.selection ? { text: String(settings.selection.text || '').slice(0, 800), page: settings.selection.page } : undefined,
    focusText: Array.isArray(settings?.focusText)
      ? settings.focusText.slice(0, 3).map(p => ({ page: p.page, content: String(p.content || '').slice(0, 4000) }))
      : [],
    visibleHighlights: Array.isArray(settings?.visibleHighlights)
      ? settings.visibleHighlights.slice(0, 20).map(h => ({ id: h.id, page: h.page, startOffset: h.startOffset, endOffset: h.endOffset, text: String(h.text || '').slice(0, 300) }))
      : [],
  };
}
