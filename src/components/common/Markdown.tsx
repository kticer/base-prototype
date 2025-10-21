import React, { useState } from 'react';

type MarkdownProps = {
  text: string;
  /** Optional match cards for citation detection */
  matchCards?: any[];
  /** Callback when a citation is clicked */
  onCitationClick?: (sourceId: string) => void;
};

// Very small, safe-ish Markdown renderer for chat content.
// Supports: paragraphs, headings (#..######), bold, italics, inline code, fenced code blocks,
// links [text](url), unordered/ordered lists, source citations. Avoids dangerouslySetInnerHTML.
// Not a full Markdown implementation; intentionally conservative for safety.
export default function Markdown({ text, matchCards, onCitationClick }: MarkdownProps) {
  const blocks = splitIntoBlocks(text || '');
  return (
    <div className="prose prose-sm max-w-none prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded space-y-3">
      {blocks.map((b, i) => (
        <Block key={i} block={b} matchCards={matchCards} onCitationClick={onCitationClick} />
      ))}
    </div>
  );
}

type TextBlock =
  | { type: 'code'; language?: string; content: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'paragraph'; content: string };

function splitIntoBlocks(text: string): TextBlock[] {
  const out: TextBlock[] = [];
  const lines = text.replace(/\r\n?/g, '\n').split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block ```lang
    const fence = line.match(/^\s*```\s*([a-zA-Z0-9_+-]*)\s*$/);
    if (fence) {
      const lang = fence[1] || undefined;
      i++;
      const buf: string[] = [];
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      // Skip closing fence
      if (i < lines.length && /^\s*```\s*$/.test(lines[i])) i++;
      out.push({ type: 'code', language: lang, content: buf.join('\n') });
      continue;
    }

    // List (unordered or ordered)
    if (/^\s*([-*])\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items: string[] = [];
      while (i < lines.length && ( /^\s*([-*])\s+/.test(lines[i]) || /^\s*\d+\.\s+/.test(lines[i]) )) {
        const m = lines[i].replace(/^\s*([-*]|\d+\.)\s+/, '');
        items.push(m);
        i++;
      }
      out.push({ type: 'list', ordered, items });
      continue;
    }

    // Accumulate paragraph until blank line
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() !== '' && !/^\s*```/.test(lines[i])) {
      buf.push(lines[i]);
      i++;
    }
    // Skip blank line
    while (i < lines.length && lines[i].trim() === '') i++;
    const content = buf.join('\n');
    if (content) out.push({ type: 'paragraph', content });
  }

  return out.length ? out : [{ type: 'paragraph', content: '' }];
}

function Block({ block, matchCards, onCitationClick }: { block: TextBlock; matchCards?: any[]; onCitationClick?: (sourceId: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);

  switch (block.type) {
    case 'code':
      const isJson = block.language === 'json';
      const shouldCollapse = isJson && block.content.length > 300; // Collapse long JSON blocks

      if (shouldCollapse) {
        return (
          <div className="rounded bg-gray-900 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
              <span className="text-xs text-gray-400 font-mono">
                {block.language || 'code'}
              </span>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                {isExpanded ? (
                  <>
                    <span>▼</span>
                    <span>Collapse</span>
                  </>
                ) : (
                  <>
                    <span>▶</span>
                    <span>Expand</span>
                  </>
                )}
              </button>
            </div>
            {isExpanded && (
              <pre className="text-gray-100 p-3 overflow-auto max-h-96">
                <code>{block.content}</code>
              </pre>
            )}
          </div>
        );
      }

      return (
        <pre className="rounded bg-gray-900 text-gray-100 p-3 overflow-auto">
          <code>{block.content}</code>
        </pre>
      );
    case 'list':
      if (block.ordered) {
        return (
          <ol className="list-decimal pl-5 space-y-2">
            {block.items.map((it, i) => {
              // Clean up orphaned ** markers
              const cleanedText = it.replace(/^\*\*\s*$/, '').trim();
              if (!cleanedText) return null;
              return <li key={i}><Inline text={cleanedText} matchCards={matchCards} onCitationClick={onCitationClick} /></li>;
            })}
          </ol>
        );
      }
      return (
        <ul className="list-disc pl-5 space-y-2">
          {block.items.map((it, i) => {
            // Clean up orphaned ** markers
            const cleanedText = it.replace(/^\*\*\s*$/, '').trim();
            if (!cleanedText) return null;
            return <li key={i}><Inline text={cleanedText} matchCards={matchCards} onCitationClick={onCitationClick} /></li>;
          })}
        </ul>
      );
    case 'paragraph':
    default:
      // Heading detection at paragraph start
      const h = block.content.match(/^\s*(#{1,6})\s+(.+)$/);
      if (h) {
        const level = Math.min(6, h[1].length);
        const Tag = (`h${level}` as unknown) as keyof JSX.IntrinsicElements;
        return <Tag className="font-semibold"><Inline text={h[2]} matchCards={matchCards} onCitationClick={onCitationClick} /></Tag>;
      }
      return <p><Inline text={block.content} matchCards={matchCards} onCitationClick={onCitationClick} /></p>;
  }
}

function Inline({ text, matchCards, onCitationClick }: { text: string; matchCards?: any[]; onCitationClick?: (sourceId: string) => void }) {
  // Process inline code, strong, em, links, and source citations.
  // We split by backticks for inline code first to avoid formatting inside code spans.
  const parts = text.split(/(`[^`]*`)/g);
  return (
    <>
      {parts.map((part, i) => {
        const code = part.match(/^`([^`]*)`$/);
        if (code) return <code key={i} className="bg-gray-100 rounded px-1 py-0.5">{code[1]}</code>;
        // Links [text](url)
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const chunks: React.ReactNode[] = [];
        let lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = linkRegex.exec(part)) !== null) {
          if (m.index > lastIndex) chunks.push(formatTextWithCitations(part.slice(lastIndex, m.index), `${i}-t-${lastIndex}`, matchCards, onCitationClick));
          const url = sanitizeUrl(m[2]);
          const label = m[1];
          if (url) {
            chunks.push(<a key={`${i}-a-${m.index}`} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{label}</a>);
          } else {
            chunks.push(formatTextWithCitations(m[0], `${i}-a-${m.index}-txt`, matchCards, onCitationClick));
          }
          lastIndex = m.index + m[0].length;
        }
        if (lastIndex < part.length) chunks.push(formatTextWithCitations(part.slice(lastIndex), `${i}-t-end`, matchCards, onCitationClick));
        return <React.Fragment key={i}>{chunks}</React.Fragment>;
      })}
    </>
  );
}

function formatTextWithCitations(text: string, key: string, matchCards?: any[], onCitationClick?: (sourceId: string) => void) {
  // If no match cards or click handler, just format emphasis normally
  if (!matchCards || !onCitationClick) {
    return formatEmphasis(text, key);
  }

  // Detect source names in quotes (e.g., "The Kitchn" or "Wikipedia")
  const sourcePattern = /["']([^"']+)["']/g;
  const chunks: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = sourcePattern.exec(text)) !== null) {
    const sourceName = match[1];
    const matchCard = matchCards.find((mc: any) =>
      mc.sourceName?.toLowerCase() === sourceName.toLowerCase()
    );

    // Add text before the match
    if (match.index > lastIndex) {
      chunks.push(formatEmphasis(text.slice(lastIndex, match.index), `${key}-pre-${match.index}`));
    }

    // If we found a matching source, make it clickable with enhanced styling
    if (matchCard) {
      const percent = matchCard.similarityPercent || 0;
      const isIntegrityIssue = matchCard.academicIntegrityIssue;
      const isCited = matchCard.isCited;

      // Color coding based on percentage
      const percentColor = percent >= 15 ? 'bg-red-100 text-red-800 border-red-300' :
                           percent >= 8 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                           'bg-gray-100 text-gray-700 border-gray-300';

      chunks.push(
        <span key={`${key}-cite-${match.index}`} className="inline-flex items-center gap-1.5 flex-wrap">
          <button
            onClick={(e) => {
              e.preventDefault();
              onCitationClick(matchCard.id);
            }}
            className="text-blue-600 hover:text-blue-800 underline font-medium cursor-pointer"
          >
            "{sourceName}"
          </button>
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-semibold rounded border ${percentColor}`}>
            {percent}%
          </span>
          {isIntegrityIssue && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Uncited
            </span>
          )}
          {!isIntegrityIssue && isCited && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Cited
            </span>
          )}
        </span>
      );
    } else {
      // Not a recognized source, just format normally
      chunks.push(formatEmphasis(match[0], `${key}-${match.index}`));
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    chunks.push(formatEmphasis(text.slice(lastIndex), `${key}-end`));
  }

  return chunks.length > 0 ? <>{chunks}</> : formatEmphasis(text, key);
}

function formatEmphasis(text: string, key: string) {
  // Bold: **text**, Italic: *text* or _text_
  // Process bold first, then italic.
  // Handle edge case: "**:" becomes just ":"
  const cleanedText = text.replace(/\*\*:/g, ':');

  const boldSplit = cleanedText.split(/(\*\*[^*]+\*\*)/g);
  const out: React.ReactNode[] = [];
  boldSplit.forEach((seg, idx) => {
    const b = seg.match(/^\*\*([^*]+)\*\*$/);
    if (b) {
      out.push(<strong key={`${key}-b-${idx}`}>{b[1]}</strong>);
      return;
    }
    const italicSplit = seg.split(/(\*[^*]+\*|_[^_]+_)/g);
    italicSplit.forEach((s, j) => {
      const i1 = s.match(/^\*([^*]+)\*$/);
      const i2 = s.match(/^_([^_]+)_$/);
      if (i1) out.push(<em key={`${key}-i1-${j}`}>{i1[1]}</em>);
      else if (i2) out.push(<em key={`${key}-i2-${j}`}>{i2[1]}</em>);
      else if (s) out.push(<span key={`${key}-t-${j}`}>{s}</span>);
    });
  });
  return <>{out}</>;
}

function sanitizeUrl(url: string): string | null {
  try {
    const u = new URL(url, 'http://x');
    const proto = (u.protocol || '').toLowerCase();
    if (proto === 'http:' || proto === 'https:') return u.href.replace('http://x', '');
    return null;
  } catch {
    return null;
  }
}

