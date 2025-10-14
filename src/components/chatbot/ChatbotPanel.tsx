import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { DocumentData } from '../../types';
import { askGemini, askGeminiStream } from '../../services/geminiClient';
import Markdown from '../common/Markdown';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  engine?: 'gemini' | 'mock';
};

type ChatbotPanelProps = {
  doc: DocumentData;
  similarityScore?: number;
  onNavigate?: (target: 'Similarity' | 'AI Writing' | 'Flags' | 'Feedback' | 'Grading') => void;
  onAddHighlight?: (args: { page: number; startOffset: number; endOffset: number; color?: string; note?: string }) => void;
  onAddComment?: (args: { page: number; startOffset: number; endOffset: number; content: string; type?: 'Feedback' | 'Grading' }) => void;
  currentPage?: number;
  selection?: { text: string; page: number };
};

export default function ChatbotPanel({ doc, similarityScore, onNavigate, onAddHighlight, onAddComment, currentPage = 1, selection }: ChatbotPanelProps) {
  const storageKey = `ith_chat_${doc.id}`;
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as ChatMessage[];
      }
    } catch {}
    return [
      {
        id: 'system-1',
        role: 'assistant',
        content: `Hi! I can help with "${doc.title}" — ask for a summary, feedback, or details about similarity and sources.`,
      },
    ];
  });
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = useMemo(() => {
    try {
      return doc.pages.reduce((acc, p) => acc + p.content.split(/\s+/).filter(Boolean).length, 0);
    } catch { return 0; }
  }, [doc]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages]);

  // Auto-resize input as the user types
  const autoResize = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const max = 144; // ~9 lines at 16px line-height
    el.style.height = Math.min(el.scrollHeight, max) + 'px';
  };
  useEffect(() => { autoResize(); }, []);
  useEffect(() => { autoResize(); }, [input]);

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {}
  }, [messages, storageKey]);

  const send = async () => {
    const prompt = input.trim();
    if (!prompt || busy) return;
    setInput('');
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: prompt };
    setMessages((m) => [...m, userMsg]);
    setBusy(true);
    try {
      // Build focused context: current page ±1 and visible highlights
      const focusPages = Array.from(new Set([
        Math.max(1, currentPage - 1),
        currentPage,
        Math.min(doc.pages.length, currentPage + 1),
      ])).sort((a,b) => a-b);

      const focusText = focusPages.map((p) => ({
        page: p,
        content: (doc.pages.find(pg => pg.number === p)?.content || '').slice(0, 4000),
      }));

      const visibleHighlights = doc.highlights
        .filter(h => focusPages.includes(h.page))
        .slice(0, 20)
        .map(h => ({ id: h.id, page: h.page, startOffset: h.startOffset, endOffset: h.endOffset, text: h.text.slice(0, 300) }));

      // Insert a streaming placeholder assistant message
      const msgId = `a-${Date.now()}`;
      setMessages((m) => [...m, { id: msgId, role: 'assistant', content: '', engine: 'gemini' }]);

      const reply = await askGeminiStream(prompt, {
        doc,
        wordCount,
        similarityScore,
        matchCards: doc.matchCards,
        settings: {
          selection: selection ? { text: selection.text.slice(0, 800), page: selection.page } : undefined,
          focusText,
          visibleHighlights,
        },
      }, (chunk) => {
        setMessages((m) => m.map(x => x.id === msgId ? { ...x, content: x.content + chunk } : x));
      });
      // finalize engine label and ensure content present if no chunks arrived
      setMessages((m) => m.map(x => x.id === msgId ? { ...x, engine: reply.isReal ? 'gemini' : 'mock', content: x.content && x.content.length ? x.content : reply.text } : x));
      // Try to detect tool command in reply
      const tool = parseToolCommand(reply.text);
      if (tool) {
        if (tool.command === 'navigate' && onNavigate) {
          const t = tool.args?.target as any;
          if (t) onNavigate(t);
          setMessages((m) => [...m, { id: `sys-${Date.now()}`, role: 'system', content: `Navigated to ${t}.` }]);
        }
        if (tool.command === 'add_comment' && onAddComment) {
          try {
            onAddComment(tool.args || {});
            setMessages((m) => [...m, { id: `sys-${Date.now()}`, role: 'system', content: 'Comment added.' }]);
          } catch {
            setMessages((m) => [...m, { id: `sys-${Date.now()}`, role: 'system', content: 'Could not add comment.' }]);
          }
        }
        if (tool.command === 'add_highlight' && onAddHighlight) {
          try {
            onAddHighlight(tool.args || {});
            setMessages((m) => [...m, { id: `sys-${Date.now()}`, role: 'system', content: 'Highlight added.' }]);
          } catch {
            setMessages((m) => [...m, { id: `sys-${Date.now()}`, role: 'system', content: 'Could not add highlight.' }]);
          }
        }
      }
    } catch (e) {
      setMessages((m) => [...m, { id: `e-${Date.now()}`, role: 'assistant', content: 'Sorry, I could not process that request in the prototype.' }]);
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearChat = () => {
    const ok = window.confirm('Clear the chat history for this document?');
    if (!ok) return;
    const greeting = {
      id: `sys-${Date.now()}`,
      role: 'assistant' as const,
      content: `Hi! I can help with "${doc.title}" — ask for a summary, feedback, or details about similarity and sources.`,
    };
    setMessages([greeting]);
    try { sessionStorage.setItem(storageKey, JSON.stringify([greeting])); } catch {}
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={scroller} className="flex-1 overflow-auto p-3 space-y-3 bg-gray-50">
        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div className={
              'max-w-[80%] rounded px-3 py-2 text-sm ' +
              (m.role === 'user' ? 'bg-blue-600 text-white whitespace-pre-wrap' : 'bg-white border')
            }>
              {m.role === 'assistant' && m.engine === 'gemini' && (
                <div className="text-[10px] text-gray-400 mb-1">Gemini</div>
              )}
              {m.role === 'user' ? (
                m.content
              ) : (
                <Markdown text={m.content} />
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t p-2 flex gap-2 items-end">
        <textarea
          ref={inputRef}
          className="flex-1 border rounded px-3 py-2 text-sm resize-none overflow-auto max-h-36"
          placeholder="Ask about this essay... (Shift+Enter for newline)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          disabled={busy}
          rows={1}
        />
        <button
          className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          onClick={send}
          disabled={busy}
        >
          Send
        </button>
        <button
          className="px-3 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          onClick={clearChat}
          disabled={busy || messages.length === 0}
          title="Clear chat history"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

function handleTool(this: any, tool: { command: string; args: any }) {
  const { onNavigate, onAddHighlight, onAddComment, setMessages } = (this as unknown as any) || {};
}

function parseToolCommand(text: string): { command: string; args: any } | null {
  // Look for a JSON block in the message
  const codeBlockMatch = text.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
  const candidate = codeBlockMatch ? codeBlockMatch[1] : text;
  try {
    const obj = JSON.parse(candidate);
    if (obj && typeof obj.command === 'string') return { command: obj.command, args: obj.args ?? {} };
  } catch {}
  return null;
}
