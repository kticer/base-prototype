import { useState, useCallback, useEffect } from 'react';

interface StrikethroughDeleteState {
  elementId: string;
  position: { x: number; y: number };
  element: HTMLElement;
}

export function useStrikethroughDeletion() {
  const [deleteState, setDeleteState] = useState<StrikethroughDeleteState | null>(null);

  /**
   * Handle clicks on strikethrough elements
   */
  const handleStrikethroughClick = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    
    // Check if the clicked element is a strikethrough
    if (target.getAttribute('data-annotation-type') === 'strikethrough') {
      event.preventDefault();
      event.stopPropagation();
      
      const elementId = target.getAttribute('data-comment-id') || '';
      const rect = target.getBoundingClientRect();
      
      setDeleteState({
        elementId,
        position: {
          x: event.clientX,
          y: event.clientY - 40, // Position above the mouse cursor
        },
        element: target,
      });
    }
  }, []);

  /**
   * Remove a strikethrough element
   */
  const removeStrikethrough = useCallback((element: HTMLElement) => {
    try {
      // Get the text content
      const textContent = element.textContent || '';
      
      // Create a text node to replace the strikethrough element
      const textNode = document.createTextNode(textContent);
      
      // Replace the strikethrough element with plain text
      element.parentNode?.replaceChild(textNode, element);
      
      // Clear the delete state
      setDeleteState(null);
      
      console.log('Strikethrough removed successfully');
    } catch (error) {
      console.warn('Could not remove strikethrough:', error);
    }
  }, []);

  /**
   * Cancel the deletion
   */
  const cancelDeletion = useCallback(() => {
    setDeleteState(null);
  }, []);

  /**
   * Handle deletion button click
   */
  const handleDelete = useCallback(() => {
    if (deleteState?.element) {
      removeStrikethrough(deleteState.element);
    }
  }, [deleteState, removeStrikethrough]);

  // Add global click listener for strikethrough elements
  useEffect(() => {
    document.addEventListener('click', handleStrikethroughClick, true);
    
    return () => {
      document.removeEventListener('click', handleStrikethroughClick, true);
    };
  }, [handleStrikethroughClick]);

  // Close delete popup when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // If we're not clicking on a strikethrough element or the delete button, close the popup
      if (deleteState && 
          target.getAttribute('data-annotation-type') !== 'strikethrough' &&
          !target.closest('[data-testid="strikethrough-delete-popup"]')) {
        setDeleteState(null);
      }
    };

    if (deleteState) {
      // Add a small delay to prevent immediate closing
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 100);
      
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [deleteState]);

  return {
    deleteState,
    handleDelete,
    cancelDeletion,
  };
}