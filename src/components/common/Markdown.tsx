import React from 'react';

type MarkdownProps = {
  text: string;
};

// Very small, safe-ish Markdown renderer for chat content.
// Supports: paragraphs, headings (#..######), bold, italics, inline code, fenced code blocks,
// links [text](url), unordered/ordered lists. Avoids dangerouslySetInnerHTML.
// Not a full Markdown implementation; intentionally conservative for safety.
export default function Markdown({ text }: MarkdownProps) {
  const blocks = splitIntoBlocks(text || '');
  return (
    <div className="prose prose-sm max-w-none prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
      {blocks.map((b, i) => (
        <Block key={i} block={b} />
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

function Block({ block }: { block: TextBlock }) {
  switch (block.type) {
    case 'code':
      return (
        <pre className="rounded bg-gray-900 text-gray-100 p-3 overflow-auto">
          <code>{block.content}</code>
        </pre>
      );
    case 'list':
      if (block.ordered) {
        return (
          <ol className="list-decimal pl-5">
            {block.items.map((it, i) => (
              <li key={i}><Inline text={it} /></li>
            ))}
          </ol>
        );
      }
      return (
        <ul className="list-disc pl-5">
          {block.items.map((it, i) => (
            <li key={i}><Inline text={it} /></li>
          ))}
        </ul>
      );
    case 'paragraph':
    default:
      // Heading detection at paragraph start
      const h = block.content.match(/^\s*(#{1,6})\s+(.+)$/);
      if (h) {
        const level = Math.min(6, h[1].length);
        const Tag = (`h${level}` as unknown) as keyof JSX.IntrinsicElements;
        return <Tag className="font-semibold"><Inline text={h[2]} /></Tag>;
      }
      return <p><Inline text={block.content} /></p>;
  }
}

function Inline({ text }: { text: string }) {
  // Process inline code, strong, em, and links.
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
          if (m.index > lastIndex) chunks.push(formatEmphasis(part.slice(lastIndex, m.index), `${i}-t-${lastIndex}`));
          const url = sanitizeUrl(m[2]);
          const label = m[1];
          if (url) {
            chunks.push(<a key={`${i}-a-${m.index}`} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{label}</a>);
          } else {
            chunks.push(formatEmphasis(m[0], `${i}-a-${m.index}-txt`));
          }
          lastIndex = m.index + m[0].length;
        }
        if (lastIndex < part.length) chunks.push(formatEmphasis(part.slice(lastIndex), `${i}-t-end`));
        return <React.Fragment key={i}>{chunks}</React.Fragment>;
      })}
    </>
  );
}

function formatEmphasis(text: string, key: string) {
  // Bold: **text**, Italic: *text* or _text_
  // Process bold first, then italic.
  const boldSplit = text.split(/(\*\*[^*]+\*\*)/g);
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

