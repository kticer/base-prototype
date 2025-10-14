/**
 * Auto-save hook for user-generated content
 * 
 * Automatically saves user state to localStorage with debouncing
 * to prevent excessive writes while ensuring data persistence.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';
import { userDataPersistence } from '../services/userDataPersistence';
import type { UserState } from '../types/userContent';

/**
 * Configuration for auto-save behavior
 */
interface AutoSaveConfig {
  /** Debounce delay in milliseconds */
  debounceMs: number;
  /** Whether to enable auto-save */
  enabled: boolean;
  /** Callback when save completes */
  onSave?: (documentId: string) => void;
  /** Callback when save fails */
  onError?: (error: Error) => void;
}

/**
 * Default auto-save configuration
 */
const DEFAULT_CONFIG: AutoSaveConfig = {
  debounceMs: 2000, // 2 seconds
  enabled: true,
};

/**
 * Hook for automatic saving of user-generated content
 * 
 * @param documentId - Current document ID
 * @param config - Auto-save configuration options
 * 
 * @returns Object with manual save function and save status
 * 
 * @example
 * ```tsx
 * function DocumentViewer() {
 *   const { id: documentId } = useParams();
 *   const { saveNow, isSaving, lastSaved } = useAutoSave(documentId, {
 *     onSave: () => console.log('Data saved!'),
 *     onError: (error) => console.error('Save failed:', error)
 *   });
 *   
 *   return (
 *     <div>
 *       <button onClick={saveNow}>Save Now</button>
 *       {isSaving && <span>Saving...</span>}
 *       {lastSaved && <span>Last saved: {lastSaved.toLocaleTimeString()}</span>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAutoSave(
  documentId: string | undefined,
  config: Partial<AutoSaveConfig> = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Get user state from store (using shallow comparison to prevent infinite renders)
  const comments = useStore((state) => state.comments);
  const summaryComment = useStore((state) => state.summaryComment);
  const rubricScore = useStore((state) => state.rubricScore);
  const gradingCriteria = useStore((state) => state.gradingCriteria);
  const customHighlights = useStore((state) => state.customHighlights);
  
  const pointAnnotations = useStore((state) => state.pointAnnotations);

  // Note: getStore access removed as we use the userState directly from the hook

  // Refs for managing save state
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastSaveDataRef = useRef<string>('');
  const isSavingRef = useRef<boolean>(false);
  const lastSavedRef = useRef<Date | null>(null);

  /**
   * Convert store state to UserState format
   */
  const convertToUserState = useCallback((): UserState => {
    const timestamp = new Date().toISOString();

    return {
      documentId: documentId || 'unknown',
      version: '1.0.0',
      comments: comments.map(comment => ({
        id: comment.id,
        type: comment.type as "Feedback" | "Grading",
        content: comment.content,
        text: comment.text,
        page: comment.page,
        startOffset: comment.startOffset,
        endOffset: comment.endOffset,
        createdAt: comment.createdAt || timestamp,
        updatedAt: comment.updatedAt || timestamp,
      })),
      pointAnnotations: pointAnnotations,
      textualContent: {
        notes: [{
          id: 'summary-comment',
          category: 'feedback' as const,
          content: summaryComment,
          createdAt: timestamp,
          updatedAt: timestamp,
        }],
      },
      grading: {
        rubricScores: gradingCriteria.map(criterion => ({
          criteriaId: criterion.id.toString(),
          criteriaName: criterion.name,
          score: criterion.score,
          maxScore: criterion.maxScore,
          comment: criterion.description,
        })),
        gradingCriteria: gradingCriteria.map(criterion => ({
          id: criterion.id.toString(),
          name: criterion.name,
          grade: criterion.score,
          maxGrade: criterion.maxScore,
          feedback: criterion.description,
          weight: 1,
        })),
      },
      customHighlights: customHighlights.map(highlight => ({
        id: highlight.id,
        type: highlight.type,
        text: highlight.text,
        page: highlight.page,
        startOffset: highlight.startOffset,
        endOffset: highlight.endOffset,
        color: highlight.color,
        note: highlight.note,
        createdAt: highlight.createdAt,
      })),
      metadata: {},
      createdAt: timestamp,
      lastModified: timestamp,
    };
  }, [documentId, comments, summaryComment, rubricScore, gradingCriteria, customHighlights]);
  
  /**
   * Perform the actual save operation
   */
  const performSave = useCallback(async () => {
    if (!documentId || !finalConfig.enabled) return;
    
    try {
      isSavingRef.current = true;
      
      const userStateToSave = convertToUserState();
      const serialized = JSON.stringify(userStateToSave);
      
      // Skip save if data hasn't changed
      if (serialized === lastSaveDataRef.current) {
        return;
      }
      
      userDataPersistence.saveUserState(documentId, userStateToSave);
      
      lastSaveDataRef.current = serialized;
      lastSavedRef.current = new Date();
      
      finalConfig.onSave?.(documentId);
    } catch (error) {
      const saveError = error instanceof Error ? error : new Error('Unknown save error');
      console.error('Auto-save failed:', saveError);
      finalConfig.onError?.(saveError);
    } finally {
      isSavingRef.current = false;
    }
  }, [documentId, convertToUserState, finalConfig]);
  
  /**
   * Manual save function
   */
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    performSave();
  }, [performSave]);
  
  /**
   * Debounced auto-save effect
   */
  useEffect(() => {
    if (!documentId || !finalConfig.enabled) return;
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(performSave, finalConfig.debounceMs);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [comments, summaryComment, rubricScore, gradingCriteria, customHighlights, documentId, finalConfig.enabled, finalConfig.debounceMs, performSave]);
  
  /**
   * Cleanup effect
   */
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return {
    /** Manually trigger a save */
    saveNow,
    /** Whether a save operation is currently in progress */
    isSaving: isSavingRef.current,
    /** Date when last save completed successfully */
    lastSaved: lastSavedRef.current,
    /** Whether auto-save is enabled */
    enabled: finalConfig.enabled,
  };
}