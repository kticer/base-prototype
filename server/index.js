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
      'You are an AI assistant for iThenticate, a plagiarism detection and essay review platform for teachers.',
      'Be concise, helpful, and actionable in your responses.',
    ];

    const screenInstructions = {
      'document-viewer': [
        'You are helping review a specific document.',
        'You can see document details, similarity scores, and match sources.',
        'When asked to navigate, use: {"command": "navigate", "args": {"target": "Similarity|AI Writing|Flags|Feedback|Grading"}}',
      ],
      'inbox': [
        'You are helping manage the submissions inbox.',
        'You have access to submission statistics, similarity scores, and document lists.',
        'Help analyze trends, identify high-similarity submissions, and provide grading insights.',
      ],
      'settings': [
        'You are helping configure assignment settings.',
        'Explain configuration options and recommend best practices for similarity thresholds and AI detection.',
      ],
      'insights': [
        'You are helping analyze submission statistics and trends.',
        'Provide insights about similarity distributions, common sources, and patterns.',
      ],
    };

    const artifactInstructions = [
      '\n**Creating Artifacts:**',
      'When the user requests a rubric, grading criteria, or structured content, generate it as a JSON artifact.',
      'Use this exact format:',
      '```json',
      '{',
      '  "type": "rubric",',
      '  "title": "Rubric Title",',
      '  "layout": "grid",',
      '  "criteria": [',
      '    {',
      '      "name": "Criterion Name",',
      '      "description": "What to evaluate",',
      '      "points": 10,',
      '      "levels": [',
      '        {"name": "Excellent", "points": 10, "description": "Exceeds expectations"},',
      '        {"name": "Good", "points": 7, "description": "Meets expectations"},',
      '        {"name": "Fair", "points": 5, "description": "Needs improvement"},',
      '        {"name": "Poor", "points": 0, "description": "Does not meet expectations"}',
      '      ]',
      '    }',
      '  ]',
      '}',
      '```',
      'For linear rubrics, use "layout": "linear" and omit the levels array.',
      'Generate 3-5 relevant criteria based on the document context or assignment type.',
    ];

    const sys = [
      ...baseInstructions,
      ...(screenInstructions[screenType] || screenInstructions['document-viewer']),
      ...artifactInstructions,
    ].join(' ');

    const light = lighten(context);
    const ctxText = [
      `Doc: ${JSON.stringify(light.doc)}`,
      `Selection: ${light.selection ? JSON.stringify(light.selection) : 'none'}`,
      `FocusText: ${JSON.stringify(light.focusText)}`,
      `Highlights: ${JSON.stringify(light.visibleHighlights)}`,
      `TopSources: ${JSON.stringify(light.matchCards)}`,
    ].join('\n');

    const fullPrompt = [sys, '', ctxText, '', `User: ${prompt}`].join('\n');

    log.debug('chat:invoke_model', { id: req.id, promptLen: fullPrompt.length });
    const result = await model.generateContent(fullPrompt);
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
      'You are an AI assistant for iThenticate, a plagiarism detection and essay review platform for teachers.',
      'Be concise, helpful, and actionable in your responses.',
    ];

    const screenInstructions = {
      'document-viewer': [
        'You are helping review a specific document.',
        'You can see document details, similarity scores, and match sources.',
        'When asked to navigate, use: {"command": "navigate", "args": {"target": "Similarity|AI Writing|Flags|Feedback|Grading"}}',
      ],
      'inbox': [
        'You are helping manage the submissions inbox.',
        'You have access to submission statistics, similarity scores, and document lists.',
        'Help analyze trends, identify high-similarity submissions, and provide grading insights.',
      ],
      'settings': [
        'You are helping configure assignment settings.',
        'Explain configuration options and recommend best practices for similarity thresholds and AI detection.',
      ],
      'insights': [
        'You are helping analyze submission statistics and trends.',
        'Provide insights about similarity distributions, common sources, and patterns.',
      ],
    };

    const artifactInstructions = [
      '\n**Creating Artifacts:**',
      'When the user requests a rubric, grading criteria, or structured content, generate it as a JSON artifact.',
      'Use this exact format:',
      '```json',
      '{',
      '  "type": "rubric",',
      '  "title": "Rubric Title",',
      '  "layout": "grid",',
      '  "criteria": [',
      '    {',
      '      "name": "Criterion Name",',
      '      "description": "What to evaluate",',
      '      "points": 10,',
      '      "levels": [',
      '        {"name": "Excellent", "points": 10, "description": "Exceeds expectations"},',
      '        {"name": "Good", "points": 7, "description": "Meets expectations"},',
      '        {"name": "Fair", "points": 5, "description": "Needs improvement"},',
      '        {"name": "Poor", "points": 0, "description": "Does not meet expectations"}',
      '      ]',
      '    }',
      '  ]',
      '}',
      '```',
      'For linear rubrics, use "layout": "linear" and omit the levels array.',
      'Generate 3-5 relevant criteria based on the document context or assignment type.',
    ];

    const sys = [
      ...baseInstructions,
      ...(screenInstructions[screenType] || screenInstructions['document-viewer']),
      ...artifactInstructions,
    ].join(' ');

    const light = lighten(context);
    const ctxText = [
      `Doc: ${JSON.stringify(light.doc)}`,
      `Selection: ${light.selection ? JSON.stringify(light.selection) : 'none'}`,
      `FocusText: ${JSON.stringify(light.focusText)}`,
      `Highlights: ${JSON.stringify(light.visibleHighlights)}`,
      `TopSources: ${JSON.stringify(light.matchCards)}`,
    ].join('\n');
    const fullPrompt = [sys, '', ctxText, '', `User: ${prompt}`].join('\n');

    log.debug('chat_stream:invoke_model', { id: req.id });
    try {
      const result = await model.generateContentStream(fullPrompt);
      for await (const chunk of result.stream) {
        const t = chunk.text();
        if (t) res.write(t);
      }
      log.info('chat_stream:success', { id: req.id });
      res.end();
    } catch (err) {
      // If streaming isn't supported for this model, fall back to non-streaming
      log.warn('chat_stream:fallback_to_nonstream', { id: req.id, error: err instanceof Error ? { message: err.message } : err });
      const nonstream = await model.generateContent(fullPrompt);
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
  const { doc, wordCount, similarityScore, matchCards, settings } = ctx;
  return {
    doc: doc ? { id: doc.id, title: doc.title, author: doc.author } : null,
    wordCount,
    similarityScore,
    matchCards: Array.isArray(matchCards)
      ? matchCards.slice(0, 3).map((m) => ({ id: m.id, sourceName: m.sourceName, similarityPercent: m.similarityPercent }))
      : [],
    selection: settings?.selection ? { text: String(settings.selection.text || '').slice(0, 800), page: settings.selection.page } : undefined,
    focusText: Array.isArray(settings?.focusText)
      ? settings.focusText.slice(0, 3).map(p => ({ page: p.page, content: String(p.content || '').slice(0, 4000) }))
      : [],
    visibleHighlights: Array.isArray(settings?.visibleHighlights)
      ? settings.visibleHighlights.slice(0, 20).map(h => ({ id: h.id, page: h.page, startOffset: h.startOffset, endOffset: h.endOffset, text: String(h.text || '').slice(0, 300) }))
      : [],
  };
}
