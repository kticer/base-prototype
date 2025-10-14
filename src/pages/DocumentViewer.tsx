import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useStore } from '../store';
import { useParams, useSearchParams } from 'react-router-dom';
import type { DocumentData } from '../types';
import { AnnotationSpan } from '../components/document/AnnotationSpan';
import { DocumentHeader } from '../components/document/DocumentHeader';
import {
  PrimaryTabNavigation,
} from '../components/document/PrimaryTabNavigation';
import { DocumentContent } from '../components/document/DocumentContent';
import { DocumentSidebar } from '../components/document/DocumentSidebar';
import {
  SidebarToggleButton,
} from '../components/document/SidebarToggleButton';
import { FeatureFlagsModal } from '../components/settings/FeatureFlagsModal';
import { useSimilarityScore } from '../hooks/useMatchInteraction';
import { usePageTitle } from '../hooks/usePageTitle';
import { useNavigation } from '../hooks/useNavigation';
import { useTextSelection } from '../hooks/useTextSelection';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/ui/Toast';
import { useStrikethroughDeletion } from '../hooks/useStrikethroughDeletion';
import {
  StrikethroughDeletePopup,
} from '../components/feedback/StrikethroughDeletePopup';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useCommentHighlights } from '../hooks/useCommentHighlights';
import { useAutoSave } from '../hooks/useAutoSave';
import {
  validateDocumentData,
  validateDocumentId,
} from '../utils/validation';
import type { Highlight } from '../types';
import {
  FloatingActionBar,
  type ActionItem,
} from '../components/ui/FloatingActionBar';
import {
  ChatBubbleBottomCenterTextIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import GlobalChatPanel from '../components/chatbot/GlobalChatPanel';

type SimilarityAnnotation = Highlight & { type: 'similarity' };
type CommentAnnotation = {
  commentId: string;
  startOffset: number;
  endOffset: number;
  type: 'comment';
};
type GradingAnnotation = {
  commentId: string;
  startOffset: number;
  endOffset: number;
  type: 'grading';
};
// Union type for different annotation types
// type Annotation = SimilarityAnnotation | CommentAnnotation | GradingAnnotation;

export default function DocumentViewer() {
  const assignColors = useStore((s) => s.assignColors);
  const { id } = useParams();
  const [doc, setDoc] = useState<DocumentData | null>(null);
  usePageTitle(doc ? `${doc.title} – iThenticate Prototype` : 'Loading...');
  const [loading, setLoading] = useState(true);
  const [useSerifFont, setUseSerifFont] = useState(true);

  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialPrimary = tabParam && tabParam.toLowerCase() === 'grading' ? 'Grading' : 'Similarity';
  const [activeTab, setActiveTab] = useState('Match Groups');
  const [primaryTab, setPrimaryTab] = useState(initialPrimary);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);

  // Layered data management
  const storeLoadDocument = useStore((state) => state.loadDocument);
  // const saveUserState = useStore((state) => state.saveUserState); // Will be used for manual save
  // const resetToDefault = useStore((state) => state.resetToDefault); // Will be used for reset button

  const { selectedSourceId, selectedMatchIndex } = useNavigation();
  const similarityScore = useSimilarityScore(doc?.matchCards ?? []);
  const { tabState, setTabState, selectedCommentId, sidebarVisible, toggleSidebar, chat } =
    useStore();
  const { toasts, showToast, hideToast } = useToast();
  const { deleteState, handleDelete, cancelDeletion } =
    useStrikethroughDeletion();

  // Calculate responsive layout - always show comment column for universal commenting
  const showCommentColumn = true; // Enable comments on all tabs
  const { paperOffset, showComments } = useResponsiveLayout(
    showCommentColumn,
    sidebarVisible,
  );

  // Handle comment highlight cleanup when comments are deleted
  useCommentHighlights();

  // Auto-save user-generated content
  const { saveNow } = useAutoSave(id, {
    onSave: (documentId) => console.log(`Auto-saved document: ${documentId}`),
    onError: (error) => showToast(`Auto-save failed: ${error.message}`, 'error'),
  });

  // Use saveNow for manual save operations (prevent unused variable warning)
  console.log('Manual save available:', typeof saveNow === 'function');

  // Update activeTab default when primaryTab changes
  useEffect(() => {
    if (primaryTab === 'Similarity') {
      setActiveTab('Match Groups');
      // Always show similarity highlights in Similarity tab
      setTabState({
        primaryTab,
        secondaryTab: 'Match Groups',
        showSimilarityHighlights: true,
      });
    } else if (primaryTab === 'Feedback') {
      setActiveTab('QuickMarks');
      setTabState({ primaryTab, secondaryTab: 'QuickMarks' });
    } else if (primaryTab === 'Grading') {
      setActiveTab(''); // Grading doesn't have sub-tabs
      setTabState({ primaryTab, secondaryTab: '' });
    }
  }, [primaryTab, setTabState]);

  // Initialize text selection for feedback/grading modes
  const {
    selectionState,
    handleComment: originalHandleComment,
    handleStrikethrough: originalHandleStrikethrough,
    handleQuickMark,
    dismissSelection,
  } = useTextSelection();

  // Wrap handlers to include toast notifications
  const handleComment = useCallback(() => {
    originalHandleComment();
    showToast('Comment added successfully!', 'success');
  }, [originalHandleComment, showToast]);

  const handleStrikethrough = useCallback(() => {
    originalHandleStrikethrough();
    showToast('Strikethrough applied!', 'success');
  }, [originalHandleStrikethrough, showToast]);

  const selectionActions: ActionItem[] = [
    {
      id: 'quickmark',
      label: 'QuickMark',
      icon: <PencilIcon className="w-4 h-4 text-gray-600" />,
      onClick: handleQuickMark,
    },
    {
      id: 'comment',
      label: 'Add Comment',
      icon: <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-gray-600" />,
      onClick: handleComment,
    },
    {
      id: 'strikethrough',
      label: 'Strikethrough',
      icon:
        (<span className="w-4 h-4 text-gray-600 flex items-center justify-center text-sm font-bold">
          S̶
        </span>),
      onClick: handleStrikethrough,
    },
  ];

  // Component-specific handlers
  const handleToggleSerifFont = useCallback(() => {
    setUseSerifFont((prev) => {
      const next = !prev;
      localStorage.setItem('useSerifFont', String(next));
      return next;
    });
  }, []);

  const handleZoomIn = useCallback(
    () => setZoom((z) => Math.min(z + 10, 200)),
    [],
  );
  const handleZoomOut = useCallback(
    () => setZoom((z) => Math.max(z - 10, 50)),
    [],
  );
  const handleZoomReset = useCallback(() => setZoom(100), []);

  // Update comment highlight styles when selected comment changes
  useEffect(() => {
    const allCommentHighlights =
      document.querySelectorAll('.comment-highlight');

    allCommentHighlights.forEach((highlight) => {
      const commentId = highlight.getAttribute('data-comment-id');
      const isSelected = selectedCommentId === commentId;

      // Use consistent blue colors for all comments
      const baseColor = 'rgba(59, 130, 246, 0.2)'; // Blue background
      const selectedColor = 'rgba(59, 130, 246, 0.7)'; // Blue selected
      const backgroundColor = isSelected ? selectedColor : baseColor;

      (highlight as HTMLElement).style.backgroundColor = backgroundColor;
      (highlight as HTMLElement).style.borderTop =
        '2px solid rgba(59, 130, 246, 0.8)'; // Blue top border

      // Scroll to selected highlight
      if (isSelected) {
        highlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (highlight as HTMLElement).focus?.();
      }
    });
  }, [selectedCommentId]);

  // Keyboard shortcut for sidebar toggle
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'b' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  // DOM ref management removed from global state for better separation of concerns

  useEffect(() => {
    try {
      const saved = localStorage.getItem('useSerifFont');
      if (saved !== null) {
        setUseSerifFont(saved === 'true');
      }
    } catch (error) {
      console.warn('Failed to load font preference from localStorage:', error);
      // Continue with default value
    }
  }, []);

  useEffect(() => {
    if (!id) return;

    const loadDocumentWithUserData = async () => {
      try {
        const validatedId = validateDocumentId(id);
        const res = await fetch(`/data/documents/${validatedId}.json`);

        if (!res.ok) {
          throw new Error(
            `Failed to load document: ${res.status} ${res.statusText}`,
          );
        }

        const rawData = await res.json();
        const validatedData = validateDocumentData(rawData);

        // Set the base document in local state
        setDoc(validatedData);

        // Load document into layered data system
        await storeLoadDocument(validatedId, validatedData);

        setLoading(false);

        console.log(
          `📄 Document loaded with layered data system: ${validatedId}`,
        );
      } catch (err) {
        console.error('Error loading document:', err);
        showToast(
          err instanceof Error ? err.message : 'Failed to load document',
          'error',
        );
        setLoading(false);
      }
    };

    loadDocumentWithUserData();
  }, [id, showToast, storeLoadDocument]);

  useEffect(() => {
    if (doc) {
      const matchCardIds = doc.matchCards.map((c) => c.id);
      assignColors(matchCardIds);
      console.log('[DocumentViewer] Assigned highlight colors to:', matchCardIds);
    }
  }, [doc, assignColors]);

  // Load feature flags and reusable comments on component mount
  useEffect(() => {
    const store = useStore.getState();
    store.loadFeatureFlags();
    store.loadReusableComments();
  }, []);

  // Removed custom event handling - components now interact directly through store

  // Removed duplicate scroll effect - consolidated below

  // Compute pages with useMemo, but always render similarity highlights - just control visibility with CSS
  const { pages, wordCount } = useMemo(() => {
    if (!doc) return { pages: [], wordCount: 0 };
    let totalWords = 0;
    const computedPages = doc.pages.map((page) => {
      totalWords += page.content.split(/\s+/).length;
      const rendered = renderDocumentWithHighlights(
        page.content
          .split('\n\n')
          .map((para) => `<p>${para.trim()}</p>`)
          .join('\n'),
        doc.highlights.filter((hl) => hl.page === page.number),
        doc,
        true, // Always render similarity highlights, control visibility with CSS
      );
      return rendered;
    });
    return { pages: computedPages, wordCount: totalWords };
  }, [doc]); // Remove tabState.showSimilarityHighlights from dependencies

  // Removed DOM ref registration - components now handle their own scrolling behavior

  // Scroll to highlight when navigation changes
  useEffect(() => {
    if (!doc || !selectedSourceId) return;

    const card = doc.matchCards.find((c) => c.id === selectedSourceId);
    const match = card?.matches[selectedMatchIndex];
    if (!match?.highlightId) return;

    // Scroll the corresponding highlight into view
    const el = document.querySelector(
      `[data-highlight-id="${match.highlightId}"]`,
    );
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (el as HTMLElement).focus?.();
    }
  }, [selectedSourceId, selectedMatchIndex, doc]);

  // Context data for chat (after pages is computed)
  const chatContext = doc ? {
    screen: 'document-viewer' as const,
    doc: {
      id: doc.id,
      title: doc.title,
      author: doc.author,
    },
    similarityScore,
    wordCount,
    matchCards: doc.matchCards?.slice(0, 5).map(card => ({
      id: card.id,
      sourceName: card.sourceName,
      similarityPercent: card.similarityPercent,
    })),
    currentPage,
    primaryTab,
  } : null;

  const promptSuggestions = [
    "Summarize this document",
    "What are the top similarity sources?",
    "Navigate to the Grading tab",
  ];

  if (loading) return <div className="p-6">Loading document...</div>;
  if (!doc) return <div className="p-6">Document not found</div>;

  return (
    <div className="flex flex-col w-screen h-screen">
      {/* Dynamic CSS to control similarity highlight visibility */}
      <style>{`
        ${
          !tabState.showSimilarityHighlights
            ? `
          [data-annotation-type="similarity"] {
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
          }
        `
            : ''
        }
      `}</style>

      <DocumentHeader
        doc={doc}
        useSerifFont={useSerifFont}
        onToggleSerifFont={handleToggleSerifFont}
      />

      <PrimaryTabNavigation
        primaryTab={primaryTab}
        onPrimaryTabChange={setPrimaryTab}
      />

      {/* Main Content Container - Flex row when chat is in shrink mode */}
      <div className={`flex flex-1 overflow-hidden ${chat.isOpen && chat.displayMode === 'shrink' ? 'flex-row' : 'flex-col'}`}>
        {/* Document Content Area */}
        <div className="flex flex-1 overflow-hidden relative">
        <DocumentContent
          doc={doc}
          pages={pages}
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
          currentPage={currentPage}
          onCurrentPageChange={setCurrentPage}
          wordCount={wordCount}
          paperOffset={paperOffset}
          showComments={showComments}
        />

        {selectionState && (
          <FloatingActionBar
            position={selectionState.position}
            actions={selectionActions}
            onDismiss={dismissSelection}
          />
        )}

        <DocumentSidebar
          sidebarVisible={sidebarVisible}
          similarityScore={similarityScore}
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
          primaryTab={primaryTab}
          matchCards={doc.matchCards}
          doc={doc}
          onNavigate={(target) => setPrimaryTab(target)}
          currentPage={currentPage}
          selection={selectionState ? { text: selectionState.text, page: selectionState.pageNumber } : null}
        />

        <SidebarToggleButton
          sidebarVisible={sidebarVisible}
          onToggle={toggleSidebar}
        />
        </div>
        {/* End of Document Content Area */}

        {/* Global Chat Panel - Inside flex container for shrink mode */}
        {chatContext && (
          <GlobalChatPanel
            contextData={chatContext}
            promptSuggestions={promptSuggestions}
            onNavigate={(target) => {
              // Handle navigation commands from chat
              if (target === 'Similarity' || target === 'AI Writing' || target === 'Flags' || target === 'Feedback' || target === 'Grading') {
                setPrimaryTab(target);
              }
            }}
          />
        )}
      </div>
      {/* End of Main Content Container */}

      {/* Toast notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => hideToast(toast.id)}
        />
      ))}

      {/* Feature Flags Modal */}
      <FeatureFlagsModal />

      {/* Strikethrough Delete Popup */}
      {deleteState && (
        <StrikethroughDeletePopup
          position={deleteState.position}
          onDelete={handleDelete}
          onCancel={cancelDeletion}
        />
      )}
    </div>
  );
}

function renderDocumentWithHighlights(
  html: string,
  highlights: DocumentData['highlights'],
  doc: DocumentData,
  // _primaryTab: string = "Similarity", // Currently unused - comment annotations handled separately
  showSimilarityHighlights: boolean = true,
): React.ReactNode[] {
  const paragraphs = html.split(/<\/p>\s*/i).filter(Boolean);

  return paragraphs.map((paraHtml, paraIdx) => {
    const rawText = paraHtml.replace(/<\/?p>/gi, '').trim();
    const paraHighlights = highlights
      .filter((hl) => {
        const paraStart = paraHtml.indexOf(rawText);
        return (
          paraStart !== -1 &&
          hl.startOffset >= 0 &&
          hl.endOffset <= rawText.length
        );
      })
      .sort((a, b) => a.startOffset - b.startOffset);

    // For now, don't render comment annotations via React to avoid conflicts
    // with DOM-based comment highlights created by useTextSelection
    const feedbackAnnotations: Array <{
      startOffset: number;
      endOffset: number;
      type: string;
    }> = [];
    const gradingAnnotations: Array <{
      startOffset: number;
      endOffset: number;
      type: string;
    }> = [];

    // Combine all annotations and sort by start offset
    const allAnnotations = [
      // Only include similarity highlights if enabled
      ...( 
        showSimilarityHighlights
          ? paraHighlights.map((hl) => ({ ...hl, type: 'similarity' as const }))
          : []
      ),
      ...feedbackAnnotations.map((ann) => ({ ...ann, type: 'comment' as const })),
      ...gradingAnnotations.map((ann) => ({ ...ann, type: 'grading' as const })),
    ].sort((a, b) => a.startOffset - b.startOffset);

    const parts: React.ReactNode[] = [];
    let cursor = 0;

    allAnnotations.forEach((annotation, i) => {
      const before = rawText.slice(cursor, annotation.startOffset);
      const match = rawText.slice(annotation.startOffset, annotation.endOffset);
      cursor = annotation.endOffset;

      if (before) parts.push(before);

      if (annotation.type === 'similarity') {
        const similarityAnnotation = annotation as SimilarityAnnotation;
        const matchCard = doc.matchCards.find(
          (c) => c.id === similarityAnnotation.matchCardId,
        );
        const matchIndex =
          matchCard?.matches.findIndex(
            (m) => m.highlightId === similarityAnnotation.id,
          ) ?? 0;

        parts.push(
          <AnnotationSpan
            key={`similarity-${similarityAnnotation.id}-${i}`}
            highlightId={similarityAnnotation.id}
            matchCardId={similarityAnnotation.matchCardId}
            matchIndex={matchIndex}
            annotationType="similarity"
          >
            {match}
          </AnnotationSpan>,
        );
      } else if (annotation.type === 'comment') {
        const commentAnnotation = annotation as CommentAnnotation;
        parts.push(
          <AnnotationSpan
            key={`comment-${commentAnnotation.commentId}-${i}`}
            commentId={commentAnnotation.commentId}
            annotationType="comment"
          >
            {match}
          </AnnotationSpan>,
        );
      } else if (annotation.type === 'grading') {
        const gradingAnnotation = annotation as GradingAnnotation;
        parts.push(
          <AnnotationSpan
            key={`grading-${gradingAnnotation.commentId}-${i}`}
            commentId={gradingAnnotation.commentId}
            annotationType="grading"
          >
            {match}
          </AnnotationSpan>,
        );
      }
    });

    const after = rawText.slice(cursor);
    if (after) parts.push(after);

    return (
      <p key={paraIdx} className="mb-4">
        {parts}
      </p>
    );
  });
}
