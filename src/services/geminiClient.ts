import type { DocumentData, MatchCard } from '../types';

export type GeminiContext = {
  doc: DocumentData;
  wordCount?: number;
  similarityScore?: number;
  matchCards?: MatchCard[];
  settings?: Record<string, unknown>;
};

/**
 * askGemini: mock adapter that simulates a Gemini response.
 * In production, replace with a real API call.
 */
export async function askGemini(prompt: string, ctx: GeminiContext): Promise<{ text: string; isReal: boolean }> {
  const useReal = import.meta.env?.VITE_USE_REAL_GEMINI === 'true';
  if (useReal) {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context: ctx }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && typeof data.text === 'string') return { text: data.text as string, isReal: !String(data.text).startsWith('MOCK:') };
        const text = await res.text();
        if (text) return { text, isReal: !String(text).startsWith('MOCK:') };
      }
      console.warn('Real Gemini call failed, falling back to mock.', res.status, res.statusText);
    } catch (e) {
      console.warn('Real Gemini call error, falling back to mock.', e);
    }
  }

  // MOCK FALLBACK: keep deterministic, prompt-aware responses
  await new Promise((r) => setTimeout(r, 300));
  const { doc, wordCount = 0, similarityScore, matchCards = [] } = ctx;
  const topSources = matchCards.slice(0, 3).map((m) => `${m.sourceName} (${m.similarityPercent}%)`).join(', ');
  const p = prompt.toLowerCase();
  if (p.includes('grading') || p.includes('go to grading') || p.includes('grade')) {
    return { text: `Okay, switching to the Grading tab.\n\n\`\`\`json\n{\n  \"command\": \"navigate\",\n  \"args\": { \"target\": \"Grading\" }\n}\n\`\`\`\n`, isReal: false };
  }
  if (p.includes('summary') || p.includes('summarize')) {
    return { text: `Here’s a brief summary of "${doc.title}" by ${doc.author}.
- Word count: ~${wordCount}
- Similarity: ${similarityScore ?? 'n/a'}%
- Top sources: ${topSources || 'n/a'}
`, isReal: false };
  }
  if (p.includes('plagiarism') || p.includes('similarity') || p.includes('sources')) {
    return { text: `The current similarity is ${similarityScore ?? 'n/a'}%. Notable overlaps include: ${topSources || 'no major overlaps listed in this mock'}.`, isReal: false };
  }
  if (p.includes('feedback') || p.includes('improve')) {
    return { text: `Suggested feedback for "${doc.title}": 1) Clarify the thesis. 2) Strengthen transitions. 3) Add citations.`, isReal: false };
  }
  return { text: `I’m here to help with "${doc.title}" by ${doc.author}. Ask for a summary, feedback, or to navigate (e.g., "Go to grading").`, isReal: false };
}

export async function askGeminiStream(
  prompt: string,
  ctx: GeminiContext,
  onChunk: (chunk: string) => void,
): Promise<{ text: string; isReal: boolean }> {
  const useReal = import.meta.env?.VITE_USE_REAL_GEMINI === 'true';
  if (useReal) {
    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context: ctx }),
      });
      if (!res.ok || !res.body) throw new Error(`Bad status ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let all = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        all += text;
        onChunk(text);
      }
      return { text: all, isReal: !all.startsWith('MOCK') };
    } catch (e) {
      console.warn('Streaming failed, falling back to non-stream', e);
      const resp = await askGemini(prompt, ctx);
      // Push a single chunk so UI gets content
      try { onChunk(resp.text); } catch {}
      return resp;
    }
  }
  // mock fallback
  const { text, isReal } = await askGemini(prompt, ctx);
  // simulate chunks
  for (const part of text.match(/.{1,28}/g) || []) {
    onChunk(part);
    await new Promise(r => setTimeout(r, 30));
  }
  return { text, isReal };
}
