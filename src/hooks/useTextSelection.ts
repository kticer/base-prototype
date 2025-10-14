import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../store';

/**
 * Represents the state of a text selection in the document
 */
export interface SelectionState {
  /** The DOM Range object representing the selected text */
  range: Range;
  /** The selected text content */
  text: string;
  /** Screen coordinates for positioning floating UI elements */
  position: { x: number; y: number };
  /** The page number where the selection was made */
  pageNumber: number;
}

/**
 * Hook for managing text selection and annotation creation in document pages
 *
 * Provides functionality to:
 * - Track text selections in Feedback and Grading modes
 * - Create comment annotations from selected text
 * - Create strikethrough annotations
 * - Position floating action bars relative to selections
 *
 * @returns Object containing selection state and annotation handlers
 * @example
 * ```tsx
 * const { selectionState, handleComment, dismissSelection } = useTextSelection();
 *
 * if (selectionState) {
 *   // Show floating action bar at selectionState.position
 *   return <FloatingActionBar onComment={handleComment} />;
 * }
 * ```
 */
export function useTextSelection() {
  const [selectionState, setSelectionState] = useState<SelectionState | null>(
    null,
  );
  const comments = useStore((state) => state.comments);

  /**
   * Handles text selection events and updates selection state
   * Processes selections on all tabs for universal comment functionality
   */
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectionState(null);
      return;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText) {
      setSelectionState(null);
      return;
    }

    // Get the range and find the document page element
    const range = selection.getRangeAt(0);
    const pageElement = range.commonAncestorContainer.parentElement?.closest(
      '[data-page-number]',
    );

    if (!pageElement) {
      setSelectionState(null);
      return;
    }

    const pageNumber = parseInt(
      pageElement.getAttribute('data-page-number') || '1',
    );

    // Calculate position for the floating action bar
    const rangeRect = range.getBoundingClientRect();

    // Find the document content area (the max-w-[872px] div that contains the pages)
    const documentContent = document.querySelector(
      '.max-w-\[872px\].w-full.relative',
    ) as HTMLElement;
    const contentRect = documentContent?.getBoundingClientRect();

    const position = {
      x:
        contentRect
          ? rangeRect.left - contentRect.left + rangeRect.width / 2 - 60 // Center relative to content
          : rangeRect.left + rangeRect.width / 2 - 60, // Fallback
      y:
        contentRect
          ? rangeRect.top - contentRect.top // Position relative to content area
          : rangeRect.top, // Fallback
    };

    // Store the selection state
    setSelectionState({
      range: range.cloneRange(),
      text: selectedText,
      position,
      pageNumber,
    });
  }, []);

  /**
   * Calculates the text offset for a given range within a page
   */
  const calculateTextOffset = useCallback(
    (
      range: Range,
      pageElement: Element,
    ): { startOffset: number; endOffset: number } => {
      let startOffset = 0;
      let endOffset = 0;

      try {
        // Get all paragraphs in the page
        const paragraphs = pageElement.querySelectorAll('p');
        let accumulatedOffset = 0;

        // Find which paragraph contains the start of our range
        const startContainer = range.startContainer;
        const endContainer = range.endContainer;

        for (const paragraph of paragraphs) {
          const paragraphText = paragraph.textContent || '';

          // Check if this paragraph contains our range start
          if (paragraph.contains(startContainer) || paragraph === startContainer) {
            // Calculate offset within this paragraph
            let offsetInParagraph = 0;

            if (startContainer.nodeType === Node.TEXT_NODE) {
              // If start container is a text node, we need to find its position within the paragraph
              const walker = document.createTreeWalker(
                paragraph,
                NodeFilter.SHOW_TEXT,
                null,
              );

              let currentNode;
              while ((currentNode = walker.nextNode())) {
                if (currentNode === startContainer) {
                  offsetInParagraph += range.startOffset;
                  break;
                } else {
                  offsetInParagraph += currentNode.textContent?.length || 0;
                }
              }
            } else {
              // If start container is an element, use range.startOffset as character position
              offsetInParagraph = range.startOffset;
            }

            startOffset = accumulatedOffset + offsetInParagraph;

            // Calculate end offset
            if (paragraph.contains(endContainer) || paragraph === endContainer) {
              // End is in the same paragraph
              let endOffsetInParagraph = offsetInParagraph;

              if (
                endContainer.nodeType === Node.TEXT_NODE &&
                endContainer === startContainer
              ) {
                endOffsetInParagraph =
                  offsetInParagraph + (range.endOffset - range.startOffset);
              } else if (endContainer.nodeType === Node.TEXT_NODE) {
                // Different text nodes, need to calculate
                const walker = document.createTreeWalker(
                  paragraph,
                  NodeFilter.SHOW_TEXT,
                  null,
                );

                let currentNode;
                let tempOffset = 0;
                while ((currentNode = walker.nextNode())) {
                  if (currentNode === endContainer) {
                    endOffsetInParagraph = tempOffset + range.endOffset;
                    break;
                  } else {
                    tempOffset += currentNode.textContent?.length || 0;
                  }
                }
              } else {
                endOffsetInParagraph =
                  offsetInParagraph + (range.endOffset - range.startOffset);
              }

              endOffset = accumulatedOffset + endOffsetInParagraph;
              break;
            }
          }

          // If we found the start but not the end, continue looking for end
          if (startOffset > 0 && endOffset === 0) {
            if (paragraph.contains(endContainer) || paragraph === endContainer) {
              let endOffsetInParagraph = 0;

              if (endContainer.nodeType === Node.TEXT_NODE) {
                const walker = document.createTreeWalker(
                  paragraph,
                  NodeFilter.SHOW_TEXT,
                  null,
                );

                let currentNode;
                while ((currentNode = walker.nextNode())) {
                  if (currentNode === endContainer) {
                    endOffsetInParagraph += range.endOffset;
                    break;
                  } else {
                    endOffsetInParagraph += currentNode.textContent?.length || 0;
                  }
                }
              } else {
                endOffsetInParagraph = range.endOffset;
              }

              endOffset = accumulatedOffset + endOffsetInParagraph;
              break;
            }
          }

          // Add this paragraph's length to accumulated offset (+ 2 for paragraph breaks)
          accumulatedOffset += paragraphText.length + 2; // +2 for paragraph breaks
        }

        // Fallback: if we couldn't calculate precise offsets, estimate based on selection position
        if (startOffset === 0 && endOffset === 0) {
          const pageRect = pageElement.getBoundingClientRect();
          const rangeRect = range.getBoundingClientRect();
          const relativeTop = rangeRect.top - pageRect.top;

          // Rough estimation based on position
          const lineHeight = 24;
          const charsPerLine = 80;
          const estimatedLine = Math.floor(relativeTop / lineHeight);

          startOffset = estimatedLine * charsPerLine;
          endOffset = startOffset + (range.toString().length || 0);
        }
      } catch (error) {
        console.warn('Error calculating text offset:', error);
        // Fallback to basic estimation
        const pageRect = pageElement.getBoundingClientRect();
        const rangeRect = range.getBoundingClientRect();
        const relativeTop = rangeRect.top - pageRect.top;

        const lineHeight = 24;
        const charsPerLine = 80;
        const estimatedLine = Math.floor(relativeTop / lineHeight);

        startOffset = estimatedLine * charsPerLine;
        endOffset = startOffset + (range.toString().length || 0);
      }

      return { startOffset, endOffset };
    },
    [],
  );

  /**
   * Creates a comment annotation from the current text selection
   * This is a helper function that can be called with content and type
   */
  const createCommentFromSelection = useCallback(
    (type: 'Grading' | 'Comment', content: string) => {
      if (!selectionState) return;

      const { range, text, pageNumber } = selectionState;

      // Find the page element to calculate text offsets
      const pageElement = range.commonAncestorContainer.parentElement?.closest(
        '[data-page-number]',
      );
      if (!pageElement) {
        console.warn('Could not find page element for offset calculation');
        return;
      }

      // Calculate actual text offsets
      const { startOffset, endOffset } = calculateTextOffset(
        range,
        pageElement,
      );

      // Generate a unique ID for both the comment and the highlight
      const commentId = `comment-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;

      // Create a highlight span
      const span = document.createElement('span');
      span.className =
        'cursor-pointer focus:outline focus:outline-2 focus:outline-offset-1 hover:brightness-125 comment-highlight';
      span.setAttribute('data-annotation-type', 'comment');
      span.setAttribute('data-comment-id', commentId);

      // Set different colors for different comment types
      const isSelected = false; // Will be updated by effect
      const typeColors = {
        Grading: {
          base: 'rgba(59, 130, 246, 0.2)', // Blue background
          selected: 'rgba(59, 130, 246, 0.7)', // Blue selected
          border: '2px solid rgba(59, 130, 246, 0.8)',
        },
        Comment: {
          base: 'rgba(107, 114, 128, 0.2)', // Gray background
          selected: 'rgba(107, 114, 128, 0.7)', // Gray selected
          border: '2px solid rgba(107, 114, 128, 0.8)',
        },
      };

      const colors = typeColors[type];
      span.style.backgroundColor = isSelected ? colors.selected : colors.base;
      span.style.borderTop = colors.border;
      span.style.borderRadius = '2px';
      span.style.transition =
        'background-color 550ms ease, border-color 150ms ease';

      // Add click handler to select the comment
      span.addEventListener('click', () => {
        useStore.getState().selectComment(commentId);
      });

      try {
        // Try surroundContents first (works for simple selections)
        try {
          range.surroundContents(span);
        } catch {
          // Fallback for complex selections that span multiple elements
          const contents = range.extractContents();
          span.appendChild(contents);
          range.insertNode(span);
        }

        // Clear selection after creating highlight
        const selection = window.getSelection();
        selection?.removeAllRanges();

        // Create a new comment with calculated offsets
        const newComment = {
          id: commentId,
          type: type,
          content: content,
          position: Math.floor(startOffset / 80), // Rough position for ordering
          page: pageNumber,
          startOffset: startOffset,
          endOffset: endOffset,
          text: text,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        useStore.getState().addComment(newComment);

        // Auto-select the new comment
        useStore.getState().selectComment(commentId);

        setSelectionState(null);
      } catch (error) {
        console.warn('Could not create highlight:', error);
      }
    },
    [selectionState, calculateTextOffset],
  );

  /**
   * Handler for comment creation
   * Always creates placeholder comment that can be edited with reusable suggestions
   */
  const handleComment = useCallback(() => {
    // Always create placeholder comment - reusable suggestions will appear in the comment card
    createCommentFromSelection('Comment', 'Click to add your comment...');
  }, [createCommentFromSelection]);

  /**
   * Restores comment highlights from persisted data
   * This recreates DOM highlights that were lost on page refresh
   */
  const restoreCommentHighlights = useCallback(() => {
    // Wait for DOM to be ready
    const timeoutId = setTimeout(() => {
      comments.forEach((comment) => {
        // Check if highlight already exists
        const existingHighlight = document.querySelector(
          `[data-comment-id='${'comment.id'}']`,
        );
        if (existingHighlight) return;

        // Find the page element
        const pageElement = document.querySelector(
          `[data-page-number='${'comment.page'}']`,
        );
        if (!pageElement) return;

        try {
          // Get all paragraphs in the page
          const paragraphs = pageElement.querySelectorAll('p');
          let accumulatedOffset = 0;
          let targetParagraph = null;
          let startOffsetInParagraph = 0;
          let endOffsetInParagraph = 0;

          // Find which paragraph contains our text
          for (const paragraph of paragraphs) {
            const paragraphText = paragraph.textContent || '';
            const paragraphLength = paragraphText.length;

            if (accumulatedOffset + paragraphLength >= comment.startOffset) {
              targetParagraph = paragraph;
              startOffsetInParagraph = comment.startOffset - accumulatedOffset;
              endOffsetInParagraph = comment.endOffset - accumulatedOffset;
              break;
            }

            accumulatedOffset += paragraphText.length + 2; // +2 for paragraph breaks
          }

          if (!targetParagraph) return;

          // Create a text range within the paragraph
          const range = document.createRange();
          const walker = document.createTreeWalker(
            targetParagraph,
            NodeFilter.SHOW_TEXT,
            null,
          );

          let currentOffset = 0;
          let startNode = null;
          let endNode = null;
          let startNodeOffset = 0;
          let endNodeOffset = 0;

          let currentNode;
          while ((currentNode = walker.nextNode())) {
            const nodeText = currentNode.textContent || '';
            const nodeLength = nodeText.length;

            // Find start position
            if (!startNode && currentOffset + nodeLength >= startOffsetInParagraph) {
              startNode = currentNode;
              startNodeOffset = startOffsetInParagraph - currentOffset;
            }

            // Find end position
            if (!endNode && currentOffset + nodeLength >= endOffsetInParagraph) {
              endNode = currentNode;
              endNodeOffset = endOffsetInParagraph - currentOffset;
              break;
            }

            currentOffset += nodeLength;
          }

          if (!startNode || !endNode) return;

          // Create the range
          range.setStart(startNode, Math.max(0, startNodeOffset));
          range.setEnd(
            endNode,
            Math.min(endNode.textContent?.length || 0, endNodeOffset),
          );

          // Create highlight span
          const span = document.createElement('span');
          span.className =
            'cursor-pointer focus:outline focus:outline-2 focus:outline-offset-1 hover:brightness-125 comment-highlight';
          span.setAttribute('data-annotation-type', 'comment');
          span.setAttribute('data-comment-id', comment.id);

          // Set consistent blue styling for all comments
          const baseColor = 'rgba(59, 130, 246, 0.2)'; // Blue background

          span.style.backgroundColor = baseColor;
          span.style.borderTop = '2px solid rgba(59, 130, 246, 0.8)'; // Blue top border
          span.style.borderRadius = '2px';
          span.style.transition =
            'background-color 550ms ease, border-color 150ms ease';

          // Add click handler
          span.addEventListener('click', () => {
            useStore.getState().selectComment(comment.id);
          });

          // Insert the highlight
          try {
            range.surroundContents(span);
          } catch {
            // Fallback for complex selections
            const contents = range.extractContents();
            span.appendChild(contents);
            range.insertNode(span);
          }
        } catch (error) {
          console.warn(
            `Could not restore highlight for comment ${'comment.id'}:`,
            error,
          );
        }
      });
    }, 500); // Wait for DOM to stabilize

    return () => clearTimeout(timeoutId);
  }, [comments]);

  // Restore highlights when comments are loaded or updated
  useEffect(() => {
    const cleanup = restoreCommentHighlights();
    return cleanup;
  }, []);

  /**
   * Creates a strikethrough annotation from the current text selection
   * Applies strikethrough styling to the selected text
   */
  const handleStrikethrough = useCallback(() => {
    if (!selectionState) return;

    const { range, text } = selectionState;

    // Generate a unique ID
    const annotationId = `strikethrough-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    // Create a highlight span
    const span = document.createElement('span');
    span.className =
      'cursor-pointer focus:outline focus:outline-2 focus:outline-offset-1 hover:brightness-125';
    span.setAttribute('data-annotation-type', 'strikethrough');
    span.setAttribute('data-comment-id', annotationId);

    span.style.textDecoration = 'line-through';
    span.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
    span.style.borderRadius = '2px';
    span.textContent = text;

    try {
      range.deleteContents();
      range.insertNode(span);

      // Clear selection after creating highlight
      const selection = window.getSelection();
      selection?.removeAllRanges();

      setSelectionState(null);
    } catch (error) {
      console.warn('Could not create strikethrough:', error);
    }
  }, [selectionState]);

  /**
   * Handles quick mark action (placeholder functionality)
   * Currently just dismisses the selection
   */
  const handleQuickMark = useCallback(() => {
    // Just dismiss the selection for now
    setSelectionState(null);
  }, []);

  /**
   * Dismisses the current text selection and clears browser selection
   */
  const dismissSelection = useCallback(() => {
    setSelectionState(null);
    // Clear any existing selection
    const selection = window.getSelection();
    selection?.removeAllRanges();
  }, []);

  useEffect(() => {
    const handleMouseUp = () => {
      // Small delay to ensure selection is complete
      setTimeout(handleTextSelection, 10);
    };

    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleTextSelection]);

  return {
    /** Current selection state, or null if no text is selected */
    selectionState,
    /** Handler to create a comment annotation from the selection */
    handleComment,
    /** Handler to create a comment with specific type and content */
    createCommentFromSelection,
    /** Handler to create a strikethrough annotation from the selection */
    handleStrikethrough,
    /** Handler for quick mark action (placeholder) */
    handleQuickMark,
    /** Handler to dismiss the current selection */
    dismissSelection,
  };
}
