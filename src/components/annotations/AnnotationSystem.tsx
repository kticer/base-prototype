import React, { useRef, useCallback } from 'react';
import { useStore } from '../../store';
import type { AnnotationPosition } from '../../store';
import { FloatingActionBar, type ActionItem } from '../ui/FloatingActionBar';
import { LocatorDot } from './LocatorDot';
import { TextAnnotation } from './TextAnnotation';
import { ConnectorLine } from './ConnectorLine';

interface AnnotationSystemProps {
  children: React.ReactNode;
  pageNumber: number;
}

export const AnnotationSystem: React.FC<AnnotationSystemProps> = ({
  children,
  pageNumber,
}) => {
  const {
    annotationState,
    pointAnnotations,
    setActiveAnnotationPoint,
    addPointAnnotation,
    clearAnnotationState,
    addComment,
    selectComment,
    selectedCommentId,
  } = useStore();

  const containerRef = useRef<HTMLDivElement>(null);

  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't activate if clicking on existing annotations or text
      const target = e.target as HTMLElement;
      const hasAnnotation = target.closest('[data-annotation]');
      const hasInput = target.closest('input');
      const hasButton = target.closest('button');

      if (hasAnnotation || hasInput || hasButton) {
        return;
      }

      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      const position: AnnotationPosition = { x, y, page: pageNumber };
      const actionBarPosition = { x: e.clientX, y: e.clientY };

      // Stop event propagation to prevent document click handler from clearing the state
      e.stopPropagation();

      setActiveAnnotationPoint(position, actionBarPosition);
    },
    [pageNumber, setActiveAnnotationPoint],
  );

  const handleDocumentClick = useCallback(
    (e: MouseEvent) => {
      // Clear annotation state if clicking outside the container
      if (!containerRef.current?.contains(e.target as Node)) {
        clearAnnotationState();
      }
    },
    [clearAnnotationState],
  );

  React.useEffect(() => {
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [handleDocumentClick]);

  const handleQuickMark = () => {
    if (!annotationState.activePoint) return;

    addPointAnnotation({
      type: 'quickmark',
      position: annotationState.activePoint,
      content: 'QuickMark',
    });
    clearAnnotationState();
  };

  const handleComment = () => {
    if (!annotationState.activePoint) return;

    // Create a comment annotation that will link to the actual comment
    const commentId = `comment-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    addPointAnnotation({
      type: 'comment',
      position: annotationState.activePoint,
      content: 'Comment',
      commentId: commentId,
    });

    // Add the actual comment to the comment system
    addComment({
      id: commentId,
      type: 'Feedback',
      content: 'Click to add your comment...',
      text: '', // No text selection for point comments
      position: 0, // Will be calculated by the comment system
      page: annotationState.activePoint.page,
      startOffset: 0,
      endOffset: 0,
    });

    clearAnnotationState();
  };

  const handleText = () => {
    if (!annotationState.activePoint) return;

    addPointAnnotation({
      type: 'text',
      position: annotationState.activePoint,
      content: 'some text',
      textSize: 'medium',
      textColor: '#3B82F6',
    });
    clearAnnotationState();
  };

  const annotationActions: ActionItem[] = [
    {
      id: 'quickmark',
      label: 'QuickMark',
      icon: (
        <svg
          className="w-5 h-5 text-gray-700"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
            clipRule="evenodd"
          />
        </svg>
      ),
      onClick: handleQuickMark,
    },
    {
      id: 'comment',
      label: 'Comment',
      icon: (
        <svg
          className="w-5 h-5 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h7"
          />
        </svg>
      ),
      onClick: handleComment,
    },
    {
      id: 'text',
      label: 'Text',
      icon: (
        <svg
          className="w-5 h-5 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 8V6a2 2 0 012-2h10a2 2 0 012 2v2M5 8h14M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h8M8 16h8"
          />
        </svg>
      ),
      onClick: handleText,
    },
  ];

  // Filter annotations for current page
  const pageAnnotations = pointAnnotations.filter(
    (annotation) => annotation.position.page === pageNumber,
  );

  // Get comment annotations with valid comment IDs
  const commentAnnotations = pageAnnotations.filter(
    (annotation) => annotation.type === 'comment' && annotation.commentId,
  );

  return (
    <div
      ref={containerRef}
      className="relative"
      onClick={handleContainerClick}
      style={{}}
    >
      {children}

      {/* Render existing annotations */}
      {pageAnnotations.map((annotation) => {
        if (annotation.type === 'text') {
          return (
            <TextAnnotation
              key={annotation.id}
              annotation={annotation}
              containerRef={containerRef}
            />
          );
        } else if (annotation.type === 'comment') {
          // Render a clickable comment indicator dot
          const left =
            (annotation.position.x / 100) *
            (containerRef.current?.offsetWidth || 0);
          const top =
            (annotation.position.y / 100) *
            (containerRef.current?.offsetHeight || 0);
          const isSelected = selectedCommentId === annotation.commentId;

          return (
            <div
              key={annotation.id}
              data-annotation="comment-dot"
              className="absolute z-30 pointer-events-auto cursor-pointer hover:scale-125 transition-all duration-200"
              style={{
                left: `${left}px`,
                top: `${top}px`,
                transform: 'translate(-50%, -50%)',
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (annotation.commentId) {
                  selectComment(annotation.commentId);
                }
                const actionBarPosition = { x: left, y: top };
                setActiveAnnotationPoint(
                  annotation.position,
                  actionBarPosition,
                );
              }}
              title="Click to view comment connection"
            >
              <div
                className={`rounded-full border-2 border-white shadow-md transition-all duration-200 ${
                  isSelected
                    ? 'w-4 h-4 bg-blue-600 animate-pulse'
                    : 'w-3 h-3 bg-blue-500 hover:bg-blue-600'
                }`}
              />
              {/* Add a subtle outer ring when selected */}
              {isSelected && (
                <div
                  className="absolute inset-0 w-6 h-6 rounded-full border-2 border-blue-400 opacity-50 animate-ping"
                  style={{ transform: 'translate(-25%, -25%)' }}
                />
              )}
            </div>
          );
        }
        return null; // QuickMark annotations
      })}

      {/* Render connector lines for comment annotations - only show for selected comments */}
      {commentAnnotations.map((annotation) => {
        // Only show connector line if this comment is selected
        const isSelected = selectedCommentId === annotation.commentId;
        if (!isSelected) return null;

        // Find the corresponding comment in the DOM
        const commentElement = document.querySelector(
          `[data-comment-id="${annotation.commentId}"]`,
        );
        if (!commentElement) return null;

        if (!containerRef.current) return null;
        const commentRect = commentElement.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const endPosition = {
          x: commentRect.left - containerRect.left - 8, // Connect slightly to the left of the comment card edge
          y: commentRect.top - containerRect.top + commentRect.height / 2, // Middle of the comment card vertically
        };

        return (
          <ConnectorLine
            key={`connector-${annotation.id}`}
            startPosition={annotation.position}
            endPosition={endPosition}
            containerRef={containerRef}
          />
        );
      })}

      {/* Show active annotation point */}
      {annotationState.activePoint &&
        annotationState.activePoint.page === pageNumber && (
          <LocatorDot
            position={annotationState.activePoint}
            containerRef={containerRef}
          />
        )}

      {/* Show floating action bar */}
      {annotationState.activePoint &&
        annotationState.actionBarPosition &&
        annotationState.activePoint.page === pageNumber && (
          <FloatingActionBar
            position={annotationState.actionBarPosition}
            actions={annotationActions}
            onDismiss={clearAnnotationState}
          />
        )}
    </div>
  );
};
