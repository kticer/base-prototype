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
        'You are an AI assistant helping educators analyze student papers for academic integrity.',
        'Be clear, factual, and supportive. Help educators understand similarity scores and make informed decisions.',
        '',
        '**CRITICAL: You MUST include action buttons in your responses using this exact syntax:**',
        '[ACTION:action_type|Button Label|optional_payload]',
        '',
        '**Understanding Similarity Scores:**',
        '- Explain scores in plain language (e.g., "35% similarity means about one-third of this paper matches other sources")',
        '- Identify the primary driver (the largest source contributing to the score)',
        '- Distinguish between cited and uncited matches',
        '- Note academic integrity concerns when uncited sources make up significant portions',
        '- ALWAYS end your similarity analysis with at least one action button',
        '',
        '**Available Action Buttons (USE THESE FREQUENTLY):**',
        '- [ACTION:draft_comment|Help me draft a comment] - Use when you identify an issue',
        '- [ACTION:highlight_text|Show me the issue|matchCardId] - Use to navigate to a specific match',
        '- [ACTION:add_comment|Add this inline comment|text] - Use to add an inline comment to a specific passage',
        '- [ACTION:add_summary_comment|Add this summary comment|text] - Use to add an overall summary comment for the entire essay',
        '- [ACTION:navigate|Go to Grading tab|Grading] - Use when discussing grading',
        '- [ACTION:show_source|View this source|matchCardId] - Use when referencing a source',
        '',
        '**IMPORTANT: Two Types of Comments:**',
        '1. INLINE COMMENTS - For specific passages/issues in the paper',
        '   - Use [ACTION:add_comment|...] for these',
        '   - Examples: "This paragraph lacks a clear topic sentence", "Cite this source", "This evidence doesn\'t support your claim"',
        '   - These appear next to the relevant text in the document',
        '',
        '2. SUMMARY COMMENTS - For overall feedback on the entire essay',
        '   - Use [ACTION:add_summary_comment|...] for these',
        '   - Examples: "Strong thesis and well-organized argument", "Good use of evidence but needs stronger conclusion", "Excellent analysis overall"',
        '   - These go in the Summary tab of the Feedback panel',
        '   - Use for holistic/overall feedback, not specific passages',
        '',
        '**CRITICAL: When using action buttons with matchCardId:**',
        '- The context includes a SourceNameToIdMap object that maps source names directly to their IDs',
        '- Example: {"The Kitchn": "mc3", "Bon Appetit": "mc1", "Climate.gov NOAA": "mc2"}',
        '- To reference a source, look up its name in SourceNameToIdMap to get the correct ID',
        '- If discussing "The Kitchn", look up SourceNameToIdMap["The Kitchn"] to get "mc3", then use [ACTION:show_source|View The Kitchn|mc3]',
        '- You can also check the TopSources list where each source has an "id" field',
        '- NEVER guess or use a different source\'s ID - always look up the exact match',
        '',
        '**Example Response Pattern (FOLLOW THIS):**',
        'This paper has a 35% similarity score. The primary driver is a 22% match to a NOAA Climate.gov article that is not cited in the Works Cited. This represents a significant academic integrity concern that needs to be addressed.',
        '',
        'Would you like me to help you address this issue? [ACTION:draft_comment|Help me draft a comment]',
        '',
        '**REMEMBER:** Every response should include at least one action button where appropriate. When you identify an issue, ALWAYS offer a [ACTION:draft_comment|...] button.',
      ],
      'inbox': [
        'You are helping manage the submissions inbox.',
        'You have access to submission statistics, similarity scores, and document lists.',
        'Help analyze trends, identify high-similarity submissions, and provide grading insights.',
        '',
        '**CRITICAL: Use the Metrics object for instant, accurate answers:**',
        'The context includes a Metrics object with pre-computed statistics:',
        '- metrics.total: total number of submissions',
        '- metrics.graded: number of submissions that have been graded',
        '- metrics.ungraded: number of submissions that still need grading',
        '- metrics.highSimilarity: count of submissions with >40% similarity',
        '- metrics.mediumSimilarity: count of submissions with 20-40% similarity',
        '- metrics.lowSimilarity: count of submissions with <20% similarity',
        '- metrics.recentSubmissions: count of submissions from last 7 days',
        '- metrics.avgSimilarity: average similarity across all submissions',
        '',
        'ALWAYS use these pre-computed metrics instead of counting the submissions array yourself.',
        'Example: When asked "how many need grading?", answer with metrics.ungraded.',
        '',
        '**IMPORTANT: For inbox queries about submissions, generate data tables as artifacts:**',
        'When asked to "show submissions" or "list documents" with certain criteria (high similarity, missing grades, etc.), generate a structured table artifact:',
        '```json',
        '{',
        '  "type": "table",',
        '  "title": "High Similarity Submissions",',
        '  "columns": ["Student", "Title", "Similarity", "Grade Status"],',
        '  "rows": [',
        '    ["Student Name", "Paper Title", "45%", "Not Graded"],',
        '    ["Student Name 2", "Paper Title 2", "38%", "Graded"]',
        '  ]',
        '}',
        '```',
        'DO NOT generate rubrics for inbox queries - only generate tables/reports with submission data.',
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

    // Few-shot example showing proper action button usage
    const fewShotExample = screenType === 'document-viewer' ? `

Example conversation showing proper action button format:

User: Explain this similarity score
Assistant: This paper has a 35% similarity score, meaning about one-third of the text matches other sources. The primary driver is a 22% match to a Climate.gov NOAA article that appears to be uncited in the Works Cited section. This is a significant academic integrity concern.

Would you like me to help you address this? [ACTION:draft_comment|Help me draft a comment]

You can also: [ACTION:highlight_text|Show me the issue|mc1]

---

Now respond to the actual user query below, making sure to include action buttons in your response:
` : '';

    // Build conversation history for multi-turn chat
    const conversationHistory = context?.conversationHistory || [];
    const chatHistory = conversationHistory
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    // Create system message with context
    const systemPrompt = [sys, '', ctxText, fewShotExample].join('\n');

    log.debug('chat:invoke_model', { id: req.id, historyLen: chatHistory.length, systemPromptLen: systemPrompt.length });

    // Use Gemini's chat interface with history
    const chat = model.startChat({
      history: chatHistory,
      systemInstruction: systemPrompt,
    });

    const result = await chat.sendMessage(prompt);
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
        'You are an AI assistant helping educators analyze student papers for academic integrity.',
        'Be clear, factual, and supportive. Help educators understand similarity scores and make informed decisions.',
        '',
        '**CRITICAL: You MUST include action buttons in your responses using this exact syntax:**',
        '[ACTION:action_type|Button Label|optional_payload]',
        '',
        '**Understanding Similarity Scores:**',
        '- Explain scores in plain language (e.g., "35% similarity means about one-third of this paper matches other sources")',
        '- Identify the primary driver (the largest source contributing to the score)',
        '- Distinguish between cited and uncited matches',
        '- Note academic integrity concerns when uncited sources make up significant portions',
        '- ALWAYS end your similarity analysis with at least one action button',
        '',
        '**Available Action Buttons (USE THESE FREQUENTLY):**',
        '- [ACTION:draft_comment|Help me draft a comment] - Use when you identify an issue',
        '- [ACTION:highlight_text|Show me the issue|matchCardId] - Use to navigate to a specific match',
        '- [ACTION:add_comment|Add this inline comment|text] - Use to add an inline comment to a specific passage',
        '- [ACTION:add_summary_comment|Add this summary comment|text] - Use to add an overall summary comment for the entire essay',
        '- [ACTION:navigate|Go to Grading tab|Grading] - Use when discussing grading',
        '- [ACTION:show_source|View this source|matchCardId] - Use when referencing a source',
        '',
        '**IMPORTANT: Two Types of Comments:**',
        '1. INLINE COMMENTS - For specific passages/issues in the paper',
        '   - Use [ACTION:add_comment|...] for these',
        '   - Examples: "This paragraph lacks a clear topic sentence", "Cite this source", "This evidence doesn\'t support your claim"',
        '   - These appear next to the relevant text in the document',
        '',
        '2. SUMMARY COMMENTS - For overall feedback on the entire essay',
        '   - Use [ACTION:add_summary_comment|...] for these',
        '   - Examples: "Strong thesis and well-organized argument", "Good use of evidence but needs stronger conclusion", "Excellent analysis overall"',
        '   - These go in the Summary tab of the Feedback panel',
        '   - Use for holistic/overall feedback, not specific passages',
        '',
        '**CRITICAL: When using action buttons with matchCardId:**',
        '- The context includes a SourceNameToIdMap object that maps source names directly to their IDs',
        '- Example: {"The Kitchn": "mc3", "Bon Appetit": "mc1", "Climate.gov NOAA": "mc2"}',
        '- To reference a source, look up its name in SourceNameToIdMap to get the correct ID',
        '- If discussing "The Kitchn", look up SourceNameToIdMap["The Kitchn"] to get "mc3", then use [ACTION:show_source|View The Kitchn|mc3]',
        '- You can also check the TopSources list where each source has an "id" field',
        '- NEVER guess or use a different source\'s ID - always look up the exact match',
        '',
        '**Example Response Pattern (FOLLOW THIS):**',
        'This paper has a 35% similarity score. The primary driver is a 22% match to a NOAA Climate.gov article that is not cited in the Works Cited. This represents a significant academic integrity concern that needs to be addressed.',
        '',
        'Would you like me to help you address this issue? [ACTION:draft_comment|Help me draft a comment]',
        '',
        '**REMEMBER:** Every response should include at least one action button where appropriate. When you identify an issue, ALWAYS offer a [ACTION:draft_comment|...] button.',
      ],
      'inbox': [
        'You are helping manage the submissions inbox.',
        'You have access to submission statistics, similarity scores, and document lists.',
        'Help analyze trends, identify high-similarity submissions, and provide grading insights.',
        '',
        '**CRITICAL: Use the Metrics object for instant, accurate answers:**',
        'The context includes a Metrics object with pre-computed statistics:',
        '- metrics.total: total number of submissions',
        '- metrics.graded: number of submissions that have been graded',
        '- metrics.ungraded: number of submissions that still need grading',
        '- metrics.highSimilarity: count of submissions with >40% similarity',
        '- metrics.mediumSimilarity: count of submissions with 20-40% similarity',
        '- metrics.lowSimilarity: count of submissions with <20% similarity',
        '- metrics.recentSubmissions: count of submissions from last 7 days',
        '- metrics.avgSimilarity: average similarity across all submissions',
        '',
        'ALWAYS use these pre-computed metrics instead of counting the submissions array yourself.',
        'Example: When asked "how many need grading?", answer with metrics.ungraded.',
        '',
        '**IMPORTANT: For inbox queries about submissions, generate data tables as artifacts:**',
        'When asked to "show submissions" or "list documents" with certain criteria (high similarity, missing grades, etc.), generate a structured table artifact:',
        '```json',
        '{',
        '  "type": "table",',
        '  "title": "High Similarity Submissions",',
        '  "columns": ["Student", "Title", "Similarity", "Grade Status"],',
        '  "rows": [',
        '    ["Student Name", "Paper Title", "45%", "Not Graded"],',
        '    ["Student Name 2", "Paper Title 2", "38%", "Graded"]',
        '  ]',
        '}',
        '```',
        'DO NOT generate rubrics for inbox queries - only generate tables/reports with submission data.',
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

    // Few-shot example showing proper action button usage
    const fewShotExample = screenType === 'document-viewer' ? `

Example conversation showing proper action button format:

User: Explain this similarity score
Assistant: This paper has a 35% similarity score, meaning about one-third of the text matches other sources. The primary driver is a 22% match to a Climate.gov NOAA article that appears to be uncited in the Works Cited section. This is a significant academic integrity concern.

Would you like me to help you address this? [ACTION:draft_comment|Help me draft a comment]

You can also: [ACTION:highlight_text|Show me the issue|mc1]

---

Now respond to the actual user query below, making sure to include action buttons in your response:
` : '';

    // Build conversation history for multi-turn chat
    const conversationHistory = context?.conversationHistory || [];
    const chatHistory = conversationHistory
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    // Create system message with context
    const systemPrompt = [sys, '', ctxText, fewShotExample].join('\n');

    log.debug('chat_stream:invoke_model', { id: req.id, historyLen: chatHistory.length, systemPromptLen: systemPrompt.length });
    try {
      // Use Gemini's chat interface with history for streaming
      const chat = model.startChat({
        history: chatHistory,
        systemInstruction: systemPrompt,
      });

      const result = await chat.sendMessageStream(prompt);
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
        systemInstruction: systemPrompt,
      });
      const nonstream = await chat.sendMessage(prompt);
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
