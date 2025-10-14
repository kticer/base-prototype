import type { PointAnnotation } from '../types';

/**
 * Core interfaces for user-generated content and layered data persistence
 *
 * This file defines the data structures for the layered data system:
 * - Base Layer: System-generated content (JSON files)
 * - User Layer: User-generated content (localStorage)
 * - Runtime Layer: Merged view (Zustand store)
 */

/**
 * Universal text coordinate system for mapping all content types
 * to the same conception of the document text
 */
export interface TextPosition {
  /** Page number (1-based) */
  page: number;
  /** Character offset from start of page */
  startOffset: number;
  /** Character offset from start of page */
  endOffset: number;
  /** Optional paragraph reference for more precise positioning */
  paragraphId?: string;
}

/**
 * User-generated comment data that maps to text positions
 */
export interface UserComment extends TextPosition {
  /** Unique identifier for the comment */
  id: string;
  /** Type of comment */
  type: 'Feedback' | 'Grading';
  /** Comment text content */
  content: string;
  /** Selected text that the comment refers to */
  text: string;
  /** ISO timestamp when comment was created */
  createdAt: string;
  /** ISO timestamp when comment was last updated */
  updatedAt: string;
}

/**
 * Textual notes that don't map to specific text positions
 */
export interface TextNote {
  /** Unique identifier for the note */
  id: string;
  /** Note content */
  content: string;
  /** Note category */
  category: 'general' | 'feedback' | 'grading' | 'research';
  /** ISO timestamp when note was created */
  createdAt: string;
  /** ISO timestamp when note was last updated */
  updatedAt: string;
}

/**
 * Rubric scoring for grading
 */
export interface RubricScore {
  /** Rubric criteria identifier */
  criteriaId: string;
  /** Criteria name/description */
  criteriaName: string;
  /** Score value */
  score: number;
  /** Maximum possible score */
  maxScore: number;
  /** Optional comment for this criteria */
  comment?: string;
}

/**
 * Individual grading criteria assessment
 */
export interface CriteriaGrade {
  /** Criteria identifier */
  id: string;
  /** Criteria name */
  name: string;
  /** Grade/score */
  grade: number;
  /** Maximum possible grade */
  maxGrade: number;
  /** Feedback comment */
  feedback?: string;
  /** Weight in overall grade calculation */
  weight: number;
}

/**
 * Custom highlight created by user
 */
export interface CustomHighlight extends TextPosition {
  /** Unique identifier for the highlight */
  id: string;
  /** Custom highlight type */
  type: 'important' | 'question' | 'error' | 'suggestion' | 'custom';
  /** Highlighted text */
  text: string;
  /** Optional color override */
  color?: string;
  /** Optional note/comment */
  note?: string;
  /** ISO timestamp when highlight was created */
  createdAt: string;
}

/**
 * Complete user-generated state for a document
 */
export interface UserState {
  /** Document ID this user state belongs to */
  documentId: string;
  /** App version when this state was created */
  version: string;
  /** Hash of base document for validation */
  documentHash?: string;

  /** User comments and annotations */
  comments: UserComment[];

  /** Point annotations */
  pointAnnotations: PointAnnotation[];

  /** Textual content that doesn't map to specific positions */
  textualContent: {
    /** Overall feedback summary */
    feedbackSummary?: string;
    /** Overall grading summary */
    gradingSummary?: string;
    /** General notes */
    notes: TextNote[];
  };

  /** Grading and assessment data */
  grading: {
    /** Overall grade/score */
    overallGrade?: number;
    /** Maximum possible overall grade */
    maxGrade?: number;
    /** Rubric-based scores */
    rubricScores: RubricScore[];
    /** Individual criteria grades */
    gradingCriteria: CriteriaGrade[];
  };

  /** Custom highlights for future extensibility */
  customHighlights: CustomHighlight[];

  /** Arbitrary metadata for extensibility */
  metadata: Record<string, unknown>;

  /** Timestamps */
  createdAt: string;
  lastModified: string;
}

/**
 * Merged content combining base and user data
 */
export interface MergedContent {
  /** All highlights (base similarity + user comments + custom) */
  allHighlights: Array<{
    id: string;
    type: 'similarity' | 'comment' | 'custom';
    position: TextPosition;
    data: any; // Specific data based on type
  }>;

  /** All textual content */
  textualContent: UserState['textualContent'];

  /** All grading information */
  grading: UserState['grading'];
}

/**
 * Configuration for the persistence system
 */
export interface PersistenceConfig {
  /** Storage key prefix */
  storagePrefix: string;
  /** Auto-save interval in milliseconds */
  autoSaveInterval: number;
  /** Maximum number of document states to keep */
  maxStoredDocuments: number;
  /** Enable compression for stored data */
  enableCompression: boolean;
}
