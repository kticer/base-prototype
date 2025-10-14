
import { useEffect } from 'react';

/**
 * Hook for dynamically setting the document title
 * 
 * Updates the browser tab title when the component mounts or when the title changes.
 * Useful for providing context-specific page titles in single-page applications.
 * 
 * @param title - The title to set for the document
 * @example
 * ```tsx
 * function DocumentViewer({ documentId }) {
 *   usePageTitle(`Document ${documentId} - iThenticate`);
 *   return <div>Document content...</div>;
 * }
 * ```
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}