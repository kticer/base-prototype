import { useEffect } from 'react';
import { useStore } from '../store';

/**
 * Custom hook to handle DOM cleanup for comment highlights
 * when comments are deleted from the store.
 * 
 * This hook listens for changes to the comments array and cleans up
 * any orphaned highlight elements that no longer have corresponding comments.
 * 
 * @example
 * ```tsx
 * function DocumentViewer() {
 *   useCommentHighlights(); // Automatically cleans up deleted comment highlights
 *   // ... rest of component
 * }
 * ```
 */
export function useCommentHighlights() {
  const comments = useStore((state) => state.comments);
  
  useEffect(() => {
    // Only run cleanup when comments actually change
    const timeoutId = setTimeout(() => {
      // Get all comment highlight elements in the DOM
      const highlightElements = document.querySelectorAll('[data-comment-id]');
      
      // Create a set of existing comment IDs for efficient lookup
      const existingCommentIds = new Set(comments.map(comment => comment.id));
      
      // Clean up highlight elements that no longer have corresponding comments
      highlightElements.forEach((highlightElement) => {
        const commentId = highlightElement.getAttribute('data-comment-id');
        
        if (commentId && !existingCommentIds.has(commentId)) {
          // Comment was deleted, remove the highlight and restore plain text
          // Multiple safety checks to prevent DOM manipulation errors
          try {
            if (highlightElement.parentNode && highlightElement.isConnected) {
              const textContent = highlightElement.textContent || '';
              const textNode = document.createTextNode(textContent);
              highlightElement.parentNode.replaceChild(textNode, highlightElement);
            }
          } catch (error) {
            // Silently handle DOM manipulation errors during re-renders
            console.warn('Comment highlight cleanup failed (safely handled):', error);
          }
        }
      });
    }, 250); // Longer delay to allow DOM to stabilize after re-renders
    
    return () => clearTimeout(timeoutId);
  }, [comments]);
}