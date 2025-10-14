export function getPageElement(pageNumber: number): HTMLElement | null {
  return document.querySelector(`[data-page-number='${pageNumber}']`) as HTMLElement | null;
}

export function createRangeFromPageOffsets(
  pageEl: HTMLElement,
  startOffset: number,
  endOffset: number,
): Range | null {
  const paragraphs = pageEl.querySelectorAll('p');
  let accumulated = 0;
  let startNode: Node | null = null;
  let endNode: Node | null = null;
  let startNodeOffset = 0;
  let endNodeOffset = 0;

  for (const paragraph of Array.from(paragraphs)) {
    const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
    let node: Node | null = walker.nextNode();
    while (node) {
      const text = node.textContent || '';
      const len = text.length;
      if (!startNode && accumulated + len >= startOffset) {
        startNode = node;
        startNodeOffset = Math.max(0, startOffset - accumulated);
      }
      if (!endNode && accumulated + len >= endOffset) {
        endNode = node;
        endNodeOffset = Math.max(0, endOffset - accumulated);
        break;
      }
      accumulated += len;
      node = walker.nextNode();
    }
    if (endNode) break;
    // account for paragraph breaks (approximate two chars) like in restore code
    accumulated += 2;
  }

  if (!startNode || !endNode) return null;
  const range = document.createRange();
  try {
    range.setStart(startNode, Math.min(startNode.textContent?.length || 0, startNodeOffset));
    range.setEnd(endNode, Math.min(endNode.textContent?.length || 0, endNodeOffset));
    return range;
  } catch {
    return null;
  }
}

export function wrapRangeWithSpan(range: Range, attrs: Record<string, string>, styles: Partial<CSSStyleDeclaration>) {
  const span = document.createElement('span');
  span.className = 'cursor-pointer focus:outline focus:outline-2 focus:outline-offset-1 hover:brightness-125 comment-highlight';
  Object.entries(attrs).forEach(([k, v]) => span.setAttribute(k, v));
  Object.assign(span.style, styles);

  try {
    try {
      range.surroundContents(span);
    } catch {
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
    }
    return span;
  } catch {
    return null;
  }
}

export function findOffsetsByText(pageEl: HTMLElement, snippet: string): { startOffset: number; endOffset: number } | null {
  if (!snippet) return null;
  const paragraphs = pageEl.querySelectorAll('p');
  let accumulated = 0;
  for (const paragraph of Array.from(paragraphs)) {
    const text = paragraph.textContent || '';
    const idx = text.indexOf(snippet);
    if (idx !== -1) {
      const start = accumulated + idx;
      const end = start + snippet.length;
      return { startOffset: start, endOffset: end };
    }
    accumulated += text.length + 2; // maintain parity with paragraph break assumption
  }
  return null;
}
