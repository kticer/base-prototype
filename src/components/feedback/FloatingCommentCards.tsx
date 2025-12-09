import { useEffect, useState, useRef, useMemo } from "react";
import { useStore } from "../../store";
import { CommentCard } from "./CommentCard";

interface CommentPosition {
  id: string;
  top: number;
  height: number;
}

export function FloatingCommentCards() {
  const comments = useStore((state) => state.comments);
  const selectedCommentId = useStore((state) => state.selectedCommentId);
  const selectComment = useStore((state) => state.selectComment);
  const updateComment = useStore((state) => state.updateComment);
  const deleteComment = useStore((state) => state.deleteComment);
  const showSimilarityHighlights = useStore((state) => state.tabState.showSimilarityHighlights);
  const [commentPositions, setCommentPositions] = useState<CommentPosition[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Show all comments on all tabs for universal comment visibility
  const relevantComments = useMemo(() => comments, [comments]);

  // Calculate positions based on text offsets - independent of DOM highlights
  useEffect(() => {
    const calculatePositions = () => {
      const positions: CommentPosition[] = [];

      // Get the document content container instead of the FloatingCommentCards container
      const documentContent = document.querySelector('.max-w-\\[872px\\].w-full.relative') as HTMLElement;

      relevantComments.forEach((comment) => {
        // First try to find the existing DOM highlight element
        const highlightElement = document.querySelector(`span[data-comment-id="${comment.id}"]`);
        let top = 0;

        if (highlightElement && documentContent) {
          // Use offsetTop for scroll-independent positioning
          // Calculate the position of the highlight relative to the document content container
          let element = highlightElement as HTMLElement;
          let offsetTop = 0;

          console.log(`💬 Starting position calc for ${comment.id}:`, {
            highlightTag: highlightElement.tagName,
            highlightOffsetTop: (highlightElement as HTMLElement).offsetTop,
            highlightOffsetParent: (highlightElement as HTMLElement).offsetParent?.nodeName,
            documentContentTag: documentContent.tagName
          });

          // Walk up the DOM tree to calculate total offset relative to documentContent
          while (element && element !== documentContent) {
            console.log(`  Adding ${element.offsetTop}px from ${element.tagName}, total: ${offsetTop + element.offsetTop}`);
            offsetTop += element.offsetTop;
            element = element.offsetParent as HTMLElement;
          }

          top = Math.round(offsetTop);
          console.log(`💬 FloatingCommentCards positioning ${comment.id}:`, {
            calculatedTop: top,
            commentOffsets: `${comment.startOffset}-${comment.endOffset}`
          });
        } else {
          console.log(`💬 FloatingCommentCards: highlight not found for ${comment.id}, using fallback calculation`);
          // Fallback: calculate position based on text offset and page
          // Find the page element for this comment
          const pageElement = document.querySelector(`[data-page-number="${comment.page}"]`);

          if (pageElement && documentContent) {
            const pageRect = pageElement.getBoundingClientRect();
            const contentRect = documentContent.getBoundingClientRect();
            
            // Try to find specific paragraphs within the page to get more accurate positioning
            const paragraphs = pageElement.querySelectorAll('p');
            let accumulatedOffset = 0;
            let targetParagraph = null;
            let offsetInParagraph = comment.startOffset;
            
            // Find which paragraph contains this text offset
            for (const paragraph of paragraphs) {
              const paragraphText = paragraph.textContent || '';
              const paragraphLength = paragraphText.length;
              
              if (accumulatedOffset + paragraphLength >= comment.startOffset) {
                targetParagraph = paragraph;
                offsetInParagraph = comment.startOffset - accumulatedOffset;
                break;
              }
              
              accumulatedOffset += paragraphLength + 2; // +2 for paragraph breaks
            }
            
            if (targetParagraph) {
              // Use the paragraph's position as a more accurate base
              const paragraphRect = targetParagraph.getBoundingClientRect();
              const paragraphTopInContent = paragraphRect.top - contentRect.top;

              // Add a small offset based on position within the paragraph
              const lineHeight = 20; // More conservative line height
              const charsPerLine = 100; // More characters per line for modern displays
              const lineOffset = Math.floor(offsetInParagraph / charsPerLine) * lineHeight;

              top = Math.round(paragraphTopInContent + lineOffset);
            } else {
              // Final fallback: use page-level estimation
              const pageTopInContent = pageRect.top - contentRect.top;
              const lineHeight = 24;
              const charsPerLine = 80;
              const estimatedLine = Math.floor(comment.startOffset / charsPerLine);

              top = Math.round(pageTopInContent + (estimatedLine * lineHeight));
            }
          }
        }
        
        if (top >= 0) {
          // Try to get actual measured height from rendered card
          const cardElement = cardRefs.current.get(comment.id);
          const actualHeight = cardElement ? cardElement.offsetHeight : 120;

          positions.push({
            id: comment.id,
            top: top,
            height: actualHeight,
          });
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

    if (relevantComments.length > 0) {
      // Debounce to prevent constant re-calculations
      // Increased timeout to ensure DOM highlights are fully rendered
      const timeoutId = setTimeout(calculatePositions, 250);
      return () => clearTimeout(timeoutId);
    } else {
      setCommentPositions([]);
    }
  }, [relevantComments, showSimilarityHighlights]); // Recalculate when similarity highlights are toggled

  // Watch for card height changes and recalculate positions
  useEffect(() => {
    if (relevantComments.length === 0) return;

    const resizeObserver = new ResizeObserver(() => {
      // Recalculate positions when card heights change
      const positions: CommentPosition[] = [];
      const documentContent = document.querySelector('.max-w-\\[872px\\].w-full.relative') as HTMLElement;

      relevantComments.forEach((comment) => {
        const highlightElement = document.querySelector(`[data-comment-id="${comment.id}"]`);
        let top = 0;

        if (highlightElement && documentContent) {
          // Use offsetTop for scroll-independent positioning
          let element = highlightElement as HTMLElement;
          let offsetTop = 0;
          while (element && element !== documentContent) {
            offsetTop += element.offsetTop;
            element = element.offsetParent as HTMLElement;
          }
          top = Math.round(offsetTop);
        } else {
          const pageElement = document.querySelector(`[data-page-number="${comment.page}"]`);

          if (pageElement && documentContent) {
            const pageRect = pageElement.getBoundingClientRect();
            const contentRect = documentContent.getBoundingClientRect();
            const paragraphs = pageElement.querySelectorAll('p');
            let accumulatedOffset = 0;
            let targetParagraph = null;
            let offsetInParagraph = comment.startOffset;

            for (const paragraph of paragraphs) {
              const paragraphText = paragraph.textContent || '';
              const paragraphLength = paragraphText.length;

              if (accumulatedOffset + paragraphLength >= comment.startOffset) {
                targetParagraph = paragraph;
                offsetInParagraph = comment.startOffset - accumulatedOffset;
                break;
              }

              accumulatedOffset += paragraphLength + 2;
            }

            if (targetParagraph) {
              const paragraphRect = targetParagraph.getBoundingClientRect();
              const paragraphTopInContent = paragraphRect.top - contentRect.top;
              const lineHeight = 20;
              const charsPerLine = 100;
              const lineOffset = Math.floor(offsetInParagraph / charsPerLine) * lineHeight;

              top = Math.round(paragraphTopInContent + lineOffset);
            } else {
              const pageTopInContent = pageRect.top - contentRect.top;
              const lineHeight = 24;
              const charsPerLine = 80;
              const estimatedLine = Math.floor(comment.startOffset / charsPerLine);

              top = Math.round(pageTopInContent + (estimatedLine * lineHeight));
            }
          }
        }

        if (top >= 0) {
          const cardElement = cardRefs.current.get(comment.id);
          const actualHeight = cardElement ? cardElement.offsetHeight : 120;

          positions.push({
            id: comment.id,
            top: top,
            height: actualHeight,
          });
        }
      });

      // Sort and resolve collisions
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

    // Observe all card elements
    cardRefs.current.forEach((cardElement) => {
      resizeObserver.observe(cardElement);
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [relevantComments]);

  // Watch for new comment highlights being added to the DOM
  useEffect(() => {
    if (relevantComments.length === 0) return;

    const observer = new MutationObserver((mutations) => {
      // Check if any new comment highlights were added
      const hasNewCommentHighlight = mutations.some((mutation) =>
        Array.from(mutation.addedNodes).some(
          (node) =>
            node instanceof HTMLElement &&
            node.getAttribute('data-comment-id') !== null
        )
      );

      if (hasNewCommentHighlight) {
        // Recalculate positions when new highlights are added
        const positions: CommentPosition[] = [];
        const documentContent = document.querySelector('.max-w-\\[872px\\].w-full.relative') as HTMLElement;

        relevantComments.forEach((comment) => {
          const highlightElement = document.querySelector(`[data-comment-id="${comment.id}"]`);
          let top = 0;

          if (highlightElement && documentContent) {
            // Use offsetTop for scroll-independent positioning
            let element = highlightElement as HTMLElement;
            let offsetTop = 0;
            while (element && element !== documentContent) {
              offsetTop += element.offsetTop;
              element = element.offsetParent as HTMLElement;
            }
            top = Math.round(offsetTop);
          }

          if (top >= 0) {
            const cardElement = cardRefs.current.get(comment.id);
            const actualHeight = cardElement ? cardElement.offsetHeight : 120;

            positions.push({
              id: comment.id,
              top: top,
              height: actualHeight,
            });
          }
        });

        // Sort and resolve collisions
        positions.sort((a, b) => a.top - b.top);
        for (let i = 1; i < positions.length; i++) {
          const prev = positions[i - 1];
          const current = positions[i];
          if (current.top < prev.top + prev.height + 12) {
            current.top = prev.top + prev.height + 12;
          }
        }

        setCommentPositions(positions);
      }
    });

    // Observe the document content area for new comment highlights
    const documentContent = document.querySelector('.max-w-\\[872px\\].w-full.relative');
    if (documentContent) {
      observer.observe(documentContent, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      observer.disconnect();
    };
  }, [relevantComments]);

  // Add scroll listener with debounce for position updates
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        // Only recalculate if we have comments and positions
        if (relevantComments.length > 0 && commentPositions.length > 0) {
          const positions: CommentPosition[] = [];
          const documentContent = document.querySelector('.max-w-\\[872px\\].w-full.relative') as HTMLElement;

          relevantComments.forEach((comment) => {
            // First try to find the existing DOM highlight element
            const highlightElement = document.querySelector(`[data-comment-id="${comment.id}"]`);
            let top = 0;

            if (highlightElement && documentContent) {
              // Use offsetTop for scroll-independent positioning
              let element = highlightElement as HTMLElement;
              let offsetTop = 0;
              while (element && element !== documentContent) {
                offsetTop += element.offsetTop;
                element = element.offsetParent as HTMLElement;
              }
              top = Math.round(offsetTop);
            } else {
              // Fallback: calculate position based on text offset and page
              const pageElement = document.querySelector(`[data-page-number="${comment.page}"]`);

              if (pageElement && documentContent) {
                const pageRect = pageElement.getBoundingClientRect();
                const contentRect = documentContent.getBoundingClientRect();
                
                // Try to find specific paragraphs within the page
                const paragraphs = pageElement.querySelectorAll('p');
                let accumulatedOffset = 0;
                let targetParagraph = null;
                let offsetInParagraph = comment.startOffset;
                
                for (const paragraph of paragraphs) {
                  const paragraphText = paragraph.textContent || '';
                  const paragraphLength = paragraphText.length;
                  
                  if (accumulatedOffset + paragraphLength >= comment.startOffset) {
                    targetParagraph = paragraph;
                    offsetInParagraph = comment.startOffset - accumulatedOffset;
                    break;
                  }
                  
                  accumulatedOffset += paragraphLength + 2;
                }
                
                if (targetParagraph) {
                  const paragraphRect = targetParagraph.getBoundingClientRect();
                  const paragraphTopInContent = paragraphRect.top - contentRect.top;
                  const lineHeight = 20;
                  const charsPerLine = 100;
                  const lineOffset = Math.floor(offsetInParagraph / charsPerLine) * lineHeight;

                  top = Math.round(paragraphTopInContent + lineOffset);
                } else {
                  const pageTopInContent = pageRect.top - contentRect.top;
                  const lineHeight = 24;
                  const charsPerLine = 80;
                  const estimatedLine = Math.floor(comment.startOffset / charsPerLine);

                  top = Math.round(pageTopInContent + (estimatedLine * lineHeight));
                }
              }
            }
            
            if (top >= 0) {
              // Try to get actual measured height from rendered card
              const cardElement = cardRefs.current.get(comment.id);
              const actualHeight = cardElement ? cardElement.offsetHeight : 120;

              positions.push({
                id: comment.id,
                top: top,
                height: actualHeight,
              });
            }
          });

          // Sort and resolve collisions with 12px spacing
          positions.sort((a, b) => a.top - b.top);
          for (let i = 1; i < positions.length; i++) {
            const prev = positions[i - 1];
            const current = positions[i];
            if (current.top < prev.top + prev.height + 12) {
              current.top = prev.top + prev.height + 12;
            }
          }

          setCommentPositions(positions);
        }
      }, 150); // Longer debounce for scroll events
    };

    // Only add scroll listener if we have comments
    if (relevantComments.length > 0) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [relevantComments, commentPositions.length]);

  if (!relevantComments.length) {
    return null;
  }

  // Remove excessive logging to reduce console spam
  // console.log('💬 FloatingCommentCards render:', {
  //   primaryTab,
  //   commentsCount: relevantComments.length,
  // });

  return (
    <div 
      ref={containerRef}
      className="absolute top-0 w-80 pointer-events-none z-10"
      style={{ 
        left: 'calc(min(816px, 100%) + 8px)',
      }}
    >
      {relevantComments.map((comment) => {
        const position = commentPositions.find(p => p.id === comment.id);
        // Higher cards (lower top position) should have higher z-index
        // Use 1000 - top position to ensure higher cards have higher z-index
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
              isUserCreated={true} // All comments in prototype are user-created
              commentId={comment.id}
              source={comment.source}
            />
          </div>
        );
      })}
    </div>
  );
}