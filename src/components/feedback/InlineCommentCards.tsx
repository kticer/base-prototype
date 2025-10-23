import { useEffect, useState, useRef } from 'react';
import { useStore } from '../../store';
import { CommentCard } from './CommentCard';

interface CommentPosition {
  id: string;
  top: number;
  height: number;
}

/**
 * InlineCommentCards - Renders comment cards in a right margin column aligned with their highlights
 *
 * This component uses a CSS-based positioning approach:
 * 1. Finds each comment highlight span in the DOM
 * 2. Gets the highlight's vertical position using offsetTop (scroll-independent)
 * 3. Renders comment cards in a fixed right-side column aligned with highlights
 * 4. Handles collision detection to stack overlapping comments
 *
 * Benefits over previous approach:
 * - Uses offsetTop for scroll-independent positioning
 * - Much simpler than getBoundingClientRect calculations
 * - Comments appear in a clean vertical column in the right margin
 * - Automatically handles comment card height and collision detection
 */
export function InlineCommentCards() {
  const comments = useStore((state) => state.comments);
  const selectedCommentId = useStore((state) => state.selectedCommentId);
  const selectComment = useStore((state) => state.selectComment);
  const updateComment = useStore((state) => state.updateComment);
  const deleteComment = useStore((state) => state.deleteComment);

  const [commentPositions, setCommentPositions] = useState<CommentPosition[]>([]);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Calculate positions based on highlight positions using offsetTop
  useEffect(() => {
    const calculatePositions = () => {
      const positions: CommentPosition[] = [];
      const documentContent = document.querySelector('.max-w-\\[872px\\].w-full.relative') as HTMLElement;

      if (!documentContent) {
        console.error('❌ Document content container not found!');
        return;
      }

      console.log('📄 Document content found:', {
        tagName: documentContent.tagName,
        className: documentContent.className,
        offsetTop: documentContent.offsetTop,
        offsetParent: documentContent.offsetParent?.nodeName
      });

      comments.forEach((comment) => {
        // Find the span element with data-comment-id
        // (can be created by useTextSelection or rendered via AnnotationSpan component)
        const highlightElement = document.querySelector(
          `span[data-comment-id="${comment.id}"]`
        ) as HTMLElement;

        if (highlightElement) {
          // Use offsetTop for scroll-independent positioning
          let element = highlightElement;
          let offsetTop = 0;

          console.log(`📍 Calculating position for comment ${comment.id}:`, {
            highlightElement: highlightElement.tagName,
            highlightClass: highlightElement.className,
            startingOffsetTop: highlightElement.offsetTop,
            offsetParent: highlightElement.offsetParent?.nodeName
          });

          // Walk up the DOM tree to calculate total offset relative to documentContent
          while (element && element !== documentContent) {
            offsetTop += element.offsetTop;
            console.log(`  - Adding ${element.offsetTop}px from ${element.tagName}, total: ${offsetTop}`);
            element = element.offsetParent as HTMLElement;
          }

          // Get actual card height
          const cardElement = cardRefs.current.get(comment.id);
          const actualHeight = cardElement ? cardElement.offsetHeight : 120;

          console.log(`✅ Final position for ${comment.id}: ${offsetTop}px (height: ${actualHeight}px)`);

          positions.push({
            id: comment.id,
            top: Math.round(offsetTop),
            height: actualHeight,
          });
        } else {
          console.warn(`❌ No highlight element found for comment ${comment.id}`);
        }
      });

      // Sort by position and resolve collisions with 12px spacing
      positions.sort((a, b) => a.top - b.top);

      for (let i = 1; i < positions.length; i++) {
        const prev = positions[i - 1];
        const current = positions[i];

        // Ensure current card is positioned below previous card with spacing
        if (current.top < prev.top + prev.height + 12) {
          current.top = prev.top + prev.height + 12;
        }
      }

      setCommentPositions(positions);
    };

    if (comments.length > 0) {
      // Debounce to allow DOM to stabilize and highlights to be created
      const timeoutId = setTimeout(calculatePositions, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setCommentPositions([]);
    }
  }, [comments]);

  // Watch for card height changes
  useEffect(() => {
    if (comments.length === 0) return;

    const resizeObserver = new ResizeObserver(() => {
      // Recalculate when card heights change
      const positions: CommentPosition[] = [];
      const documentContent = document.querySelector('.max-w-\\[872px\\].w-full.relative') as HTMLElement;

      if (!documentContent) return;

      comments.forEach((comment) => {
        // Find the span element with data-comment-id
        const highlightElement = document.querySelector(
          `span[data-comment-id="${comment.id}"]`
        ) as HTMLElement;

        if (highlightElement) {
          let element = highlightElement;
          let offsetTop = 0;

          while (element && element !== documentContent) {
            offsetTop += element.offsetTop;
            element = element.offsetParent as HTMLElement;
          }

          const cardElement = cardRefs.current.get(comment.id);
          const actualHeight = cardElement ? cardElement.offsetHeight : 120;

          positions.push({
            id: comment.id,
            top: Math.round(offsetTop),
            height: actualHeight,
          });
        }
      });

      positions.sort((a, b) => a.top - b.top);
      for (let i = 1; i < positions.length; i++) {
        const prev = positions[i - 1];
        const current = positions[i];
        if (current.top < prev.top + prev.height + 12) {
          current.top = prev.top + prev.height + 12;
        }
      }

      setCommentPositions(positions);
    });

    cardRefs.current.forEach((cardElement) => {
      resizeObserver.observe(cardElement);
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [comments]);

  if (!comments.length) {
    return null;
  }

  return (
    <div
      className="absolute top-0 w-80 pointer-events-none z-10"
      style={{
        left: 'calc(min(816px, 100%) + 8px)',
      }}
    >
      {comments.map((comment) => {
        const position = commentPositions.find(p => p.id === comment.id);
        const baseZIndex = 10;
        const zIndex = position ? baseZIndex + Math.max(0, 1000 - Math.floor(position.top / 10)) : baseZIndex;

        return (
          <div
            key={comment.id}
            ref={(el) => {
              if (el) {
                cardRefs.current.set(comment.id, el);
              } else {
                cardRefs.current.delete(comment.id);
              }
            }}
            className="absolute pointer-events-auto transition-all duration-200"
            style={{
              top: position ? `${position.top}px` : '0px',
              opacity: position ? 1 : 0,
              zIndex: zIndex,
            }}
          >
            <CommentCard
              type={comment.type}
              content={comment.content}
              position={comment.position}
              isActive={selectedCommentId === comment.id}
              onSelect={() => selectComment(comment.id)}
              onContentChange={(newContent) => updateComment(comment.id, { content: newContent })}
              onDelete={() => deleteComment(comment.id)}
              createdAt={comment.createdAt}
              isUserCreated={true}
              commentId={comment.id}
              source={comment.source}
            />
          </div>
        );
      })}
    </div>
  );
}
