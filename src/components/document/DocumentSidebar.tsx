import ReportHeader from './ReportHeader';
import ReportContainer from './ReportContainer';
import { FeedbackPanel } from '../feedback/FeedbackPanel';
import { GradingPanel } from '../feedback/GradingPanel';
import { AIWritingPanel } from './AIWritingPanel';
import type { MatchCard, DocumentData } from '../../types';
import ChatbotPanel from '../chatbot/ChatbotPanel';
import { useStore } from '../../store';
import { getPageElement, createRangeFromPageOffsets, wrapRangeWithSpan, findOffsetsByText } from '../../utils/highlightDom';

interface DocumentSidebarProps {
  sidebarVisible: boolean;
  similarityScore: number;
  activeTab: string;
  onActiveTabChange: (tab: string) => void;
  primaryTab: string;
  matchCards: MatchCard[];
  doc: DocumentData;
  onNavigate?: (target: 'Similarity' | 'AI Writing' | 'Flags' | 'Feedback' | 'Grading') => void;
  currentPage?: number;
  selection?: { text: string; page: number } | null;
}

export function DocumentSidebar({
  sidebarVisible,
  similarityScore,
  activeTab,
  onActiveTabChange,
  primaryTab,
  matchCards,
  doc,
  onNavigate,
  currentPage,
  selection,
}: DocumentSidebarProps) {
  const addCommentFromTool = (args: { page?: number; startOffset?: number; endOffset?: number; content: string; type?: 'Feedback' | 'Grading'; text?: string }) => {
    const store = useStore.getState();
    const pageNum = args.page || currentPage || 1;
    const pageEl = getPageElement(pageNum);
    if (!pageEl) return;
    let s = args.startOffset ?? NaN;
    let e = args.endOffset ?? NaN;
    if (!Number.isFinite(s) || !Number.isFinite(e)) {
      const basis = args.text || selection?.text || '';
      const found = basis ? findOffsetsByText(pageEl, basis.slice(0, 200)) : null;
      if (found) { s = found.startOffset; e = found.endOffset; }
    }
    if (!Number.isFinite(s) || !Number.isFinite(e)) return;
    const range = createRangeFromPageOffsets(pageEl, Number(s), Number(e));
    if (!range) return;

    const commentId = `comment-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const span = wrapRangeWithSpan(range, { 'data-annotation-type': 'comment', 'data-comment-id': commentId }, {
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderTop: '2px solid rgba(59, 130, 246, 0.8)',
      borderRadius: '2px',
      transition: 'background-color 550ms ease, border-color 150ms ease',
    });
    const selectedText = span?.textContent || '';
    store.addComment({
      id: commentId,
      type: args.type || 'Feedback',
      content: args.content || 'Comment',
      text: selectedText,
      position: Math.floor(Number(s) / 80),
      page: pageNum,
      startOffset: Number(s),
      endOffset: Number(e),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    store.selectComment(commentId);
  };

  const addHighlightFromTool = (args: { page?: number; startOffset?: number; endOffset?: number; color?: string; note?: string; text?: string }) => {
    const store = useStore.getState();
    const pageNum = args.page || currentPage || 1;
    const pageEl = getPageElement(pageNum);
    if (!pageEl) return;
    let s = args.startOffset ?? NaN;
    let e = args.endOffset ?? NaN;
    if (!Number.isFinite(s) || !Number.isFinite(e)) {
      const basis = args.text || selection?.text || '';
      const found = basis ? findOffsetsByText(pageEl, basis.slice(0, 200)) : null;
      if (found) { s = found.startOffset; e = found.endOffset; }
    }
    if (!Number.isFinite(s) || !Number.isFinite(e)) return;
    const range = createRangeFromPageOffsets(pageEl, Number(s), Number(e));
    if (!range) return;
    const highlightId = `custom-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const span = wrapRangeWithSpan(range, { 'data-annotation-type': 'comment', 'data-comment-id': highlightId }, {
      backgroundColor: args.color || 'rgba(107, 114, 128, 0.2)',
      borderTop: '2px solid rgba(107, 114, 128, 0.8)',
      borderRadius: '2px',
      transition: 'background-color 550ms ease, border-color 150ms ease',
    });
    const selectedText = span?.textContent || '';
    store.addCustomHighlight({
      id: highlightId,
      type: 'custom',
      text: selectedText,
      page: pageNum,
      startOffset: Number(s),
      endOffset: Number(e),
      color: args.color,
      note: args.note,
    });
  };
  if (!sidebarVisible) {
    return null;
  }

  return (
    <aside className="w-96 lg:w-80 xl:w-96 border-l bg-white flex flex-col transition-all duration-300 ease-in-out">
      {primaryTab !== "AI Writing" && (
        <div className="sticky top-0 z-10 bg-white shadow-sm">
          <ReportHeader
            similarityPercent={similarityScore}
            activeTab={activeTab}
            setActiveTab={onActiveTabChange}
            primaryTab={primaryTab}
          />
        </div>
      )}
      <div className={`flex-1 overflow-auto ${primaryTab === "AI Writing" ? '' : 'p-4 space-y-4'}`}>
        {primaryTab === "Similarity" && (
          <ReportContainer matchCards={matchCards} />
        )}
        {primaryTab === "Feedback" && (
          <FeedbackPanel activeTab={activeTab} />
        )}
        {primaryTab === "Grading" && (
          <GradingPanel />
        )}
        {primaryTab === "Chat" && (
          <div className="h-[calc(100vh-12rem)] -m-4">
            <ChatbotPanel
              doc={doc}
              similarityScore={similarityScore}
              onNavigate={onNavigate}
              currentPage={currentPage}
              selection={selection || undefined}
              onAddComment={addCommentFromTool}
              onAddHighlight={addHighlightFromTool}
            />
          </div>
        )}
        {primaryTab === "AI Writing" && (
          <AIWritingPanel
            overallPercentage={24}
            totalPages={doc.pages?.length || 3}
            aiGeneratedOnly={{
              count: 5,
              percentage: 24,
            }}
            aiParaphrased={{
              count: 0,
              percentage: 0,
            }}
            pageBreakdown={doc.pages?.map((_, idx) => ({
              page: idx + 1,
              // Mock: varied AI percentages across pages
              aiPercentage: idx === 0 ? 60 : idx === 1 ? 20 : 5,
            }))}
          />
        )}
        {primaryTab === "Flags" && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">Flags content will appear here</div>
          </div>
        )}
      </div>
    </aside>
  );
}
