import { useState, useCallback } from 'react';

/**
 * Configuration for a toast notification
 */
interface ToastData {
  /** Unique identifier for the toast */
  id: string;
  /** Message to display in the toast */
  message: string;
  /** Visual type of the toast */
  type: 'success' | 'error' | 'info';
  /** Optional duration in milliseconds (defaults to auto-hide timing) */
  duration?: number;
}

/**
 * Hook for managing toast notifications
 * 
 * Provides functionality to show, hide, and manage toast notifications
 * with different types (success, error, info) and auto-hide behavior.
 * 
 * @returns Object containing toast state and management functions
 * @example
 * ```tsx
 * const { toasts, showToast, hideToast } = useToast();
 * 
 * const handleSuccess = () => {
 *   showToast('Operation completed successfully!', 'success');
 * };
 * 
 * const handleError = () => {
 *   showToast('An error occurred', 'error', 5000);
 * };
 * 
 * return (
 *   <div>
 *     {toasts.map(toast => (
 *       <Toast key={toast.id} {...toast} onClose={() => hideToast(toast.id)} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  /**
   * Shows a new toast notification
   * @param message - The message to display
   * @param type - The type of toast (success, error, info)
   * @param duration - Optional duration in milliseconds
   * @returns The ID of the created toast
   */
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info', duration?: number) => {
    const id = Date.now().toString();
    const toast: ToastData = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);
    
    return id;
  }, []);

  /**
   * Hides a specific toast notification
   * @param id - The ID of the toast to hide
   */
  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  /**
   * Clears all toast notifications
   */
  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    /** Array of current toast notifications */
    toasts,
    /** Function to show a new toast notification */
    showToast,
    /** Function to hide a specific toast */
    hideToast,
    /** Function to clear all toasts */
    clearAllToasts,
  };
}