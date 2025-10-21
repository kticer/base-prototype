import type { DocumentData, MatchCard } from '../types';

export type InboxMetrics = {
  total: number;
  graded: number;
  ungraded: number;
  highSimilarity: number;
  mediumSimilarity: number;
  lowSimilarity: number;
  recentSubmissions: number;
  avgSimilarity: number;
};

export type DocumentMetrics = {
  totalMatches: number;
  citedMatches: number;
  uncitedMatches: number;
  integrityIssues: number;
  largestMatchPercent: number;
  largestMatchSource: string;
  avgMatchSize: number;
  citedVsUncited: {
    cited: number;
    uncited: number;
    citedPercent: number;
  } | null;
  sourceTypes: Record<string, number>;
};

export type InsightsMetrics = {
  totalSubmissions: number;
  avgSimilarity: number;
  medianSimilarity: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  integrityIssuesCount: number;
  highPriorityInterventions: number;
  totalInterventionsNeeded: number;
  topSourcesBreakdown: {
    internet: number;
    publications: number;
    studentWork: number;
    total: number;
  };
  mostProblematicSource: {
    name: string;
    affectedStudents: number;
    avgSimilarity: number;
  } | null;
  citationQuality: {
    rate: number;
    rating: 'good' | 'fair' | 'poor';
    properlyCited: number;
    uncited: number;
    improperlyCited: number;
  };
  similarityRange: {
    min: number;
    max: number;
    spread: number;
  };
};

export type GeminiContext = {
  screen?: string;
  doc?: DocumentData;
  wordCount?: number;
  similarityScore?: number;
  matchCards?: MatchCard[];
  settings?: Record<string, unknown>;
  // Inbox-specific context
  totalSubmissions?: number;
  selectedCount?: number;
  avgSimilarity?: number;
  metrics?: InboxMetrics | DocumentMetrics | InsightsMetrics; // Computed metrics for instant answers
  submissions?: Array<{
    id: string;
    title: string;
    author: string;
    similarity: number;
    aiWriting?: number | number[] | null;
    flags?: number;
    priorityScore?: number;
    priorityRank?: number;
    grade: any;
    submittedAt: string;
  }>;
  triageWeights?: {
    flagWeight: number;
    aiHighBonus: number;
    aiFactor: number;
    simFactor: number;
    simHighBonusThreshold: number;
    simHighBonus: number;
    ungradedBonus: number;
    recencyMaxBonus: number;
    recencyHalfLifeDays: number;
  };
  // Insights-specific context
  courseAnalytics?: any;
  totalDocuments?: number;
  highRiskCount?: number;
  commonSources?: any[];
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
  const { screen, doc, wordCount = 0, similarityScore, matchCards = [], totalSubmissions, avgSimilarity, metrics } = ctx;
  const topSources = matchCards.slice(0, 3).map((m) => `${m.sourceName} (${m.similarityPercent}%)`).join(', ');
  const p = prompt.toLowerCase();

  // Inbox-specific responses
  if (screen === 'inbox' && metrics) {
    // AI writing awareness (mock)
    if (p.includes('ai writing') || p.includes('ai-generated') || p.includes('ai generated') || p.includes('ai detection') || p.includes('detect ai')) {
      const subs = ctx.submissions || [];
      const toScalar = (v: number | number[] | null | undefined) => v == null ? null : (Array.isArray(v) ? Math.max(...v) : Number(v));
      const withAi = subs
        .map(s => ({ id: s.id, title: s.title, author: s.author, ai: toScalar(s.aiWriting) }))
        .filter(s => typeof s.ai === 'number') as Array<{id:string;title:string;author:string;ai:number}>;
      if (withAi.length > 0) {
        const avg = Math.round((withAi.reduce((sum, s) => sum + s.ai, 0) / withAi.length) * 10) / 10;
        const veryHigh = withAi.filter(s => s.ai >= 90).length;
        const examples = withAi
          .sort((a, b) => b.ai - a.ai)
          .slice(0, 3)
          .map(s => `${s.title} by ${s.author} — ${s.ai}%`)
          .join('; ');
        return { text: `AI writing indicators are available for ${withAi.length} submissions. Average indicator: ${avg}%. ${veryHigh} submission${veryHigh === 1 ? '' : 's'} at or above 90% (very high). Top examples: ${examples}.`, isReal: false };
      }
      return { text: `No AI writing indicators are present in the current inbox context.`, isReal: false };
    }
    if (p.includes('average') || p.includes('avg')) {
      return { text: `The average similarity score across ${metrics.total} submissions is ${metrics.avgSimilarity}%.`, isReal: false };
    }
    if (p.includes('high similarity') || p.includes('submissions with high')) {
      return { text: `I found ${metrics.highSimilarity} submissions with high similarity (>40%). The average similarity across all ${metrics.total} submissions is ${metrics.avgSimilarity}%. Would you like me to show you these high similarity submissions?`, isReal: false };
    }
    if (p.includes('grading') || p.includes('need grading') || p.includes('not graded') || p.includes('ungraded')) {
      return { text: `Out of ${metrics.total} total submissions, ${metrics.ungraded} still need grading and ${metrics.graded} have been graded. Would you like to see the ungraded submissions?`, isReal: false };
    }
    if (p.includes('recent') || p.includes('last week')) {
      return { text: `${metrics.recentSubmissions} submissions were received in the last 7 days out of ${metrics.total} total submissions.`, isReal: false };
    }
    if (p.includes('medium similarity')) {
      return { text: `${metrics.mediumSimilarity} submissions have medium similarity (20-40%).`, isReal: false };
    }
    if (p.includes('low similarity')) {
      return { text: `${metrics.lowSimilarity} submissions have low similarity (<20%).`, isReal: false };
    }
    return { text: `You have ${metrics.total} submissions: ${metrics.graded} graded, ${metrics.ungraded} ungraded. ${metrics.highSimilarity} have high similarity (>40%). Average similarity: ${metrics.avgSimilarity}%. How can I help?`, isReal: false };
  }

  // Document viewer responses
  if (doc) {
    if (p.includes('grading') || p.includes('go to grading') || p.includes('grade')) {
      return { text: `Okay, switching to the Grading tab.\n\n\`\`\`json\n{\n  \"command\": \"navigate\",\n  \"args\": { \"target\": \"Grading\" }\n}\n\`\`\`\n`, isReal: false };
    }
    if (p.includes('summary') || p.includes('summarize')) {
      return { text: `Here's a brief summary of "${doc.title}" by ${doc.author}.
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
    return { text: `I'm here to help with "${doc.title}" by ${doc.author}. Ask for a summary, feedback, or to navigate (e.g., "Go to grading").`, isReal: false };
  }

  // Generic fallback
  return { text: `I'm here to help you with the ${screen || 'current'} page. What would you like to know?`, isReal: false };
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
