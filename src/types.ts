import type { AnnotationPosition } from './store';

// ---------- Shared ----------
export type ItemType = 'folder' | 'document';

export interface BaseItem {
  id: string;
  type: ItemType;
  title: string;
  dateAdded: string;
}

// ---------- Inbox (Folder & Document Tree) ----------

export interface FolderItem extends BaseItem {
  type: 'folder';
  children?: FolderOrDocument[];
}

export interface DocumentItem extends BaseItem {
  type: 'document';
  author: string;
  similarity: number;
}

export type FolderOrDocument = FolderItem | DocumentItem;

// ---------- Document Viewer ----------

export interface Page {
  number: number;
  content: string;
}

export interface DocumentData {
  id: string;
  title: string;
  author: string;
  pages: Page[];
  highlights: Highlight[];
  matchCards: MatchCard[];
}

export interface Highlight {
  id: string;
  matchCardId: string;
  startOffset: number;
  endOffset: number;
  text: string;
  isExcluded: boolean;
  page: number;
}

export type MatchSourceType = 'Internet' | 'Submitted Works' | 'Publication';

export interface MatchCard {
  id: string;
  sourceType: MatchSourceType;
  sourceName: string;
  sourceUrl?: string;
  similarityPercent: number;
  matchedWordCount: number;
  matches: MatchInstance[];
}

export interface MatchInstance {
  highlightId: string;
  contextBefore: string;
  matchedText: string;
  contextAfter: string;
}

/**
 * Represents a point annotation on the document.
 */
export interface PointAnnotation {
  id: string;
  type: 'quickmark' | 'comment' | 'text';
  position: AnnotationPosition;
  content: string;
  commentId?: string;
  textSize?: 'small' | 'medium' | 'large';
  textColor?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents the currently selected match state
 */
export interface SelectedMatch {
  /** ID of the selected highlight, or null if none selected */
  highlightId: string | null;
  /** ID of the selected match card, or null if none selected */
  cardId: string | null;
  /** Index of the selected match within the card's matches array */
  matchIndex: number;
}

// ---------- Store Types (for Zustand store) ----------

/**
 * Zustand store state interface (partial - extends with additional fields)
 * @deprecated This interface is outdated and may not reflect current store structure
 */
export interface StoreState {
  // ...other state fields...
  /** Registry of DOM references for highlight elements */
  highlightRefs: Record<string, HTMLSpanElement | null>;
  /** Registry of DOM references for match card elements */
  matchCardRefs: Record<string, HTMLDivElement | null>;
  /** Function to register a highlight DOM reference */
  registerHighlightRef: (id: string, ref: HTMLSpanElement | null) => void;
  /** Function to register a match card DOM reference */
  registerMatchCardRef: (id: string, ref: HTMLDivElement | null) => void;
  /** Currently selected match state */
  selectedMatch: SelectedMatch;
  /** Function to update the selected match */
  setSelectedMatch: (match: SelectedMatch) => void;
}
