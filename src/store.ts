import { create } from 'zustand';
import { isString, isNonNegativeNumber, isPositiveNumber } from './utils/validation';
import type { UserState, MergedContent } from './types/userContent';
import { userDataPersistence } from './services/userDataPersistence';
import type { Rubric, CellPosition, RubricCriterion, RubricScale } from './types/rubric';
import { createDefaultRubric } from './types/rubric';
import type { FeatureFlagState, FeatureFlag, FeatureFlagId } from './types/featureFlags';
import { DEFAULT_FEATURE_FLAGS } from './types/featureFlags';
import type { ReusableCommentsState, ReusableComment } from './types/reusableComments';
import { DEFAULT_COMMENT_BANK, findSimilarComments, createReusableComment } from './types/reusableComments';
import type { PointAnnotation } from './types';

/** Unique identifier for match cards */
export type MatchCardId = string;

/** Unique identifier for highlights */
export type HighlightId = string;

/** 
 * Represents a selected match with associated highlight and card information
 * @deprecated Use NavigationState instead
 */
export type SelectedMatch = {
  cardId: MatchCardId | null;
  highlightId: HighlightId | null;
  matchIndex: number;
};

/**
 * Navigation state for tracking selected matches and highlights
 * Manages the currently selected source, match index, and navigation context
 */
export interface NavigationState {
  /** ID of the currently selected match card source */
  selectedSourceId: MatchCardId | null;
  /** Index of the selected match within the card's matches array */
  selectedMatchIndex: number;
  /** ID of the currently selected highlight */
  selectedHighlightId: HighlightId | null;
  /** Source that initiated the navigation (card click vs highlight click) */
  navigationSource: "card" | "highlight" | null;
  /** Highlight ID that chat is currently referencing (for visual feedback) */
  chatReferencedHighlightId: HighlightId | null;
}

/**
 * Data structure for user comments on document text
 * Comments are associated with specific text ranges and pages
 */
export interface CommentData {
  /** Unique identifier for the comment */
  id: string;
  /** Type of comment (e.g., 'Feedback', 'Grading') */
  type: string;
  /** Comment text content */
  content: string;
  /** The selected text that the comment refers to */
  text: string;
  /** Position within the page for display purposes */
  position: number;
  /** Page number where the comment is located */
  page: number;
  /** Start offset of the commented text range */
  startOffset: number;
  /** End offset of the commented text range */
  endOffset: number;
  /** ISO timestamp when comment was created */
  createdAt: string;
  /** ISO timestamp when comment was last updated */
  updatedAt: string;
  /** Source of the comment (manual, chat, ai-suggestion) */
  source?: 'manual' | 'chat' | 'ai-suggestion';
}

/**
 * Position coordinates for point-based annotations
 */
export interface AnnotationPosition {
  /** X coordinate as percentage of document width */
  x: number;
  /** Y coordinate as percentage of document height */
  y: number;
  /** Page number where annotation is located */
  page: number;
}



/**
 * Active annotation creation state
 */
export interface AnnotationState {
  /** Currently active annotation point (showing locator dot and action bar) */
  activePoint: AnnotationPosition | null;
  /** Currently editing text annotation */
  editingTextAnnotation: string | null;
  /** Position of floating action bar */
  actionBarPosition: { x: number; y: number } | null;
}

/**
 * State for managing active tabs and tab-specific settings
 */
export interface TabState {
  /** Currently active primary tab */
  primaryTab: "Similarity" | "AI Writing" | "Flags" | "Feedback" | "Grading";
  /** Currently active secondary tab within the primary tab */
  secondaryTab: string;
  /** Whether to show similarity highlights in the document */
  showSimilarityHighlights: boolean;
}

/**
 * Chat message structure
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  engine?: 'gemini' | 'mock';
  timestamp: string;
  /** Reference to artifact if this message generated one */
  artifact?: any;
}

/**
 * Screen context for chat
 */
export type ScreenContext = 'inbox' | 'settings' | 'insights' | 'document-viewer';

/**
 * Chat conversation history per screen
 */
export interface ChatConversation {
  screen: ScreenContext;
  messages: ChatMessage[];
  createdAt: string;
  lastModified: string;
}

/**
 * Global chat state
 */
export interface ChatState {
  /** Whether chat panel is open */
  isOpen: boolean;
  /** Current display mode */
  displayMode: 'overlay' | 'shrink';
  /** Panel width in pixels */
  panelWidth: number;
  /** Current screen context */
  currentScreen: ScreenContext | null;
  /** All conversation histories categorized by screen */
  conversations: Record<ScreenContext, ChatConversation>;
  /** Whether an artifact is currently being generated */
  isGeneratingArtifact: boolean;
  /** Current artifact data (if any) */
  currentArtifact: any | null;
}

/**
 * Main Zustand store state interface
 * Centralizes all application state including navigation, UI, and data
 */
export interface StoreState {
  /** Core navigation state - consolidated */
  navigation: NavigationState;

  /** Tab state */
  tabState: TabState;

  /** Global chat state */
  chat: ChatState;

  /** Feature flag state for experimental features */
  featureFlags: FeatureFlagState;
  
  /** Reusable comments state for comment suggestions */
  reusableComments: ReusableCommentsState;
  
  /** UI state */
  /** ID of the currently hovered highlight */
  hoveredHighlightId: HighlightId | null;
  /** Set of match card IDs that have been excluded from similarity calculation */
  excludedSourceIds: Set<MatchCardId>;
  /** Color assignments for match card highlights */
  highlightColors: Record<MatchCardId, string>;
  /** ID of the currently selected comment */
  selectedCommentId: string | null;
  /** Whether the sidebar is visible */
  sidebarVisible: boolean;
  
  // Data
  matchCards: {
    id: MatchCardId;
    matches: { highlightId: HighlightId }[];
  }[];
  comments: CommentData[];
  
  // Textual Content
  summaryComment: string;
  
  // Grading Data
  rubricScore: number;
  gradingCriteria: Array<{
    id: number;
    name: string;
    description: string;
    score: number;
    maxScore: number;
  }>;
  
  // Custom Highlights
  customHighlights: Array<{
    id: string;
    type: "important" | "question" | "error" | "suggestion" | "custom";
    text: string;
    page: number;
    startOffset: number;
    endOffset: number;
    color?: string;
    note?: string;
    createdAt: string;
  }>;

  // Point Annotations
  pointAnnotations: PointAnnotation[];
  annotationState: AnnotationState;
  
  // Layered Data Management
  /** Current document ID for layered data */
  currentDocumentId: string | null;
  /** Base document data (system-generated from JSON) */
  baseDocument: any | null; // Will be properly typed when document loading is enhanced
  /** User-generated state (from localStorage) */
  userState: UserState | null;
  /** Merged content combining base and user data */
  mergedContent: MergedContent | null;

  // Rubric Management
  /** All saved rubrics */
  rubrics: Rubric[];
  /** Currently editing rubric */
  currentRubric: Rubric | null;
  /** Currently selected cell in rubric grid */
  selectedCell: CellPosition | null;
  /** Whether a cell is being edited */
  isEditingCell: boolean;
  /** Content of the cell being edited */
  editingCellContent: string;

  // Course Analytics (Story 2: Hero's Journey)
  /** Course-wide analytics data */
  courseAnalytics: import('./types/courseAnalytics').CourseAnalytics | null;
  /** Student patterns and intervention needs */
  studentPatterns: import('./types/courseAnalytics').StudentPattern[];
  /** Intervention recommendations */
  interventionRecommendations: import('./types/courseAnalytics').InterventionRecommendation[];
  /** All course submissions with document data */
  courseSubmissions: import('./types/courseAnalytics').CourseSubmission[];
  /** Loading state for course analytics */
  courseAnalyticsLoading: boolean;

  // Actions
  setNavigation: (navigation: Partial<NavigationState>) => void;
  setTabState: (tabState: Partial<TabState>) => void;
  setMatchCards: (matchCards: StoreState['matchCards']) => void;
  hoverHighlight: (id: HighlightId | null) => void;
  toggleSourceInclusion: (id: MatchCardId) => void;
  assignColors: (ids: MatchCardId[]) => void;
  selectComment: (id: string | null) => void;
  toggleSidebar: () => void;
  setSidebarVisible: (visible: boolean) => void;
  
  // Navigation convenience methods
  selectMatch: (sourceId: MatchCardId | null, matchIndex: number, source?: "card" | "highlight") => void;
  clearSelection: () => void;
  
  // Comment actions
  addComment: (comment: Omit<CommentData, 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  updateComment: (id: string, updates: Partial<CommentData>) => void;
  deleteComment: (id: string) => void;
  
  // Textual content actions
  updateSummaryComment: (content: string) => void;
  
  // Grading actions
  updateRubricScore: (score: number) => void;
  updateGradingCriterion: (id: number, updates: Partial<{ name: string; description: string; score: number; maxScore: number }>) => void;
  resetGradingScores: () => void;
  
  // Custom highlight actions
  addCustomHighlight: (highlight: Omit<StoreState['customHighlights'][0], 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  updateCustomHighlight: (id: string, updates: Partial<StoreState['customHighlights'][0]>) => void;
  deleteCustomHighlight: (id: string) => void;

  // Point annotation actions
  setActiveAnnotationPoint: (position: AnnotationPosition | null, actionBarPosition?: { x: number; y: number } | null) => void;
  addPointAnnotation: (annotation: Omit<PointAnnotation, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePointAnnotation: (id: string, updates: Partial<PointAnnotation>) => void;
  deletePointAnnotation: (id: string) => void;
  setEditingTextAnnotation: (id: string | null) => void;
  clearAnnotationState: () => void;

  // Chat Action Handlers
  /** Handle chat action: draft a comment based on highlighted issue */
  handleDraftCommentAction: (payload: { matchCardId?: string; issueDescription?: string }) => Promise<string>;
  /** Handle chat action: add inline comment to document */
  handleAddCommentAction: (payload: { text: string; page?: number; highlightId?: string }) => void;
  /** Handle chat action: add/update summary comment */
  handleAddSummaryCommentAction: (payload: { text: string }) => void;
  /** Handle chat action: navigate to and highlight specific match */
  handleHighlightTextAction: (payload: { matchCardId: string; matchIndex?: number }) => void;
  /** Handle chat action: show source details */
  handleShowSourceAction: (payload: { matchCardId: string }) => void;

  // Layered Data Actions
  /** Load base document and user state for a document */
  loadDocument: (documentId: string, baseDocument?: any) => Promise<void>;
  /** Save current user state to localStorage */
  saveUserState: () => void;
  /** Load user state from localStorage */
  loadUserState: (documentId: string) => void;
  /** Reset document to pristine state */
  resetToDefault: (documentId: string) => void;
  /** Export user state as JSON */
  exportUserState: () => string | null;
  /** Import user state from JSON */
  importUserState: (jsonData: string) => void;
  /** Import rubrics from JSON */
  importRubrics: (jsonData: string) => number;

  // Rubric Actions
  /** Load all rubrics from localStorage */
  loadRubrics: () => void;
  /** Save all rubrics to localStorage */
  saveRubrics: () => void;
  /** Create a new rubric */
  createRubric: (
    type?: 'weighted' | 'qualitative' | 'custom' | 'grading-form',
    rows?: number,
    columns?: number,
    options?: {
      enableRangedScoring?: boolean;
      enableEqualWeights?: boolean;
    }
  ) => void;
  /** Load an existing rubric for editing */
  loadRubric: (id: string) => void;
  /** Save the current rubric */
  saveCurrentRubric: () => void;
  /** Delete a rubric */
  deleteRubric: (id: string) => void;
  /** Reset current rubric to pristine state */
  resetCurrentRubric: () => void;
  /** Update rubric title */
  updateRubricTitle: (title: string) => void;
  /** Select a cell in the rubric grid */
  selectCell: (position: CellPosition | null) => void;
  /** Start editing a cell */
  startEditingCell: (content: string) => void;
  /** Update cell content while editing */
  updateEditingCellContent: (content: string) => void;
  /** Save cell content and stop editing */
  saveCell: () => void;
  /** Cancel cell editing */
  cancelCellEdit: () => void;
  /** Add a new criterion (row) */
  addCriterion: (afterIndex?: number) => void;
  /** Add a new scale (column) */
  addScale: (afterIndex?: number) => void;
  /** Update criterion title */
  updateCriterionTitle: (criterionId: string, title: string) => void;
  /** Update scale title */
  updateScaleTitle: (scaleId: string, title: string) => void;
  /** Update cell description */
  updateCellDescription: (criterionId: string, scaleId: string, description: string) => void;
  /** Stop editing cell */
  stopEditingCell: () => void;
  /** Update criterion by index */
  updateCriterion: (index: number, updates: Partial<RubricCriterion>) => void;
  /** Update scale by index */
  updateScale: (index: number, updates: Partial<RubricScale>) => void;
  /** Update criterion description by indices */
  updateCriterionDescription: (criterionIndex: number, scaleIndex: number, description: string) => void;
  /** Move criterion from one index to another */
  moveCriterion: (fromIndex: number, toIndex: number) => void;
  /** Move scale from one index to another */
  moveScale: (fromIndex: number, toIndex: number) => void;
  /** Remove criterion by index */
  removeCriterion: (index: number) => void;
  /** Remove scale by index */
  removeScale: (index: number) => void;
  /** Duplicate criterion by index */
  duplicateCriterion: (index: number) => void;
  /** Duplicate scale by index */
  duplicateScale: (index: number) => void;

  // Feature Flag Actions
  /** Load feature flags from localStorage */
  loadFeatureFlags: () => void;
  /** Save feature flags to localStorage */
  saveFeatureFlags: () => void;
  /** Toggle a feature flag on/off */
  toggleFeatureFlag: (flagId: FeatureFlagId) => void;
  /** Update a feature flag */
  updateFeatureFlag: (flagId: FeatureFlagId, updates: Partial<FeatureFlag>) => void;
  /** Reset feature flags to defaults */
  resetFeatureFlags: () => void;
  /** Toggle feature flags panel */
  toggleFeatureFlagsPanel: () => void;
  /** Check if a feature is enabled */
  isFeatureEnabled: (flagId: FeatureFlagId) => boolean;

  // Chat Actions
  /** Open chat panel for a specific screen */
  openChat: (screen: ScreenContext) => void;
  /** Close chat panel */
  closeChat: () => void;
  /** Toggle chat panel open/closed */
  toggleChat: (screen?: ScreenContext) => void;
  /** Set chat display mode */
  setChatDisplayMode: (mode: 'overlay' | 'shrink') => void;
  /** Set chat panel width */
  setChatPanelWidth: (width: number) => void;
  /** Add a message to the current conversation */
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  /** Clear chat history for a specific screen */
  clearChatHistory: (screen: ScreenContext) => void;
  /** Load chat history from localStorage */
  loadChatHistory: () => void;
  /** Save chat history to localStorage */
  saveChatHistory: () => void;
  /** Set artifact generation state */
  setGeneratingArtifact: (generating: boolean, artifact?: any) => void;

  // Reusable Comments Actions
  /** Load reusable comments from localStorage */
  loadReusableComments: () => void;
  /** Save reusable comments to localStorage */
  saveReusableComments: () => void;
  /** Add a new reusable comment to the bank */
  addReusableComment: (comment: ReusableComment) => void;
  /** Find similar comments based on search text */
  findSimilarComments: (searchText: string, limit?: number) => ReusableComment[];
  /** Mark a reusable comment as used (increment usage count) */
  useReusableComment: (commentId: string) => void;
  /** Create a reusable comment from user input */
  createReusableCommentFromText: (content: string, type: string, tags?: string[]) => ReusableComment;

  // Course Analytics Actions (Story 2: Hero's Journey)
  /** Load all course submissions and compute analytics */
  loadCourseAnalytics: () => Promise<void>;
  /** Refresh analytics with current data */
  refreshCourseAnalytics: () => void;
  /** Export course analytics as CSV */
  exportCourseAnalyticsCSV: () => string;
  /** Export intervention recommendations as CSV */
  exportInterventionsCSV: () => string;
}

const COLORS = ['#CC1476', '#225EC7', '#007546', '#7533E8', '#006D81'];

export const useStore = create<StoreState>((set, get) => ({
  // Initialize navigation state
  navigation: {
    selectedSourceId: null,
    selectedMatchIndex: 0,
    selectedHighlightId: null,
    navigationSource: null,
    chatReferencedHighlightId: null,
  },
  
  // Initialize tab state
  tabState: {
    primaryTab: "Similarity",
    secondaryTab: "Match Groups",
    showSimilarityHighlights: true,
  },
  
  // Initialize feature flags
  featureFlags: {
    flags: DEFAULT_FEATURE_FLAGS,
    panelOpen: false,
    lastModified: new Date().toISOString(),
  },
  
  // Initialize reusable comments
  reusableComments: {
    comments: [...DEFAULT_COMMENT_BANK],
    initialized: false,
    lastModified: new Date().toISOString(),
  },

  // Initialize chat state
  chat: {
    isOpen: false,
    displayMode: 'overlay',
    panelWidth: 400,
    currentScreen: null,
    conversations: {
      inbox: {
        screen: 'inbox',
        messages: [],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
      settings: {
        screen: 'settings',
        messages: [],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
      insights: {
        screen: 'insights',
        messages: [],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
      'document-viewer': {
        screen: 'document-viewer',
        messages: [],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
    },
    isGeneratingArtifact: false,
    currentArtifact: null,
  },

  // UI state
  hoveredHighlightId: null,
  excludedSourceIds: new Set(),
  highlightColors: {},
  selectedCommentId: null,
  sidebarVisible: true,
  
  // Data
  matchCards: [],
  comments: [],
  
  // Textual Content
  summaryComment: '',
  
  // Grading Data
  rubricScore: 0,
  gradingCriteria: [
    {
      id: 1,
      name: "Custom Criterion 1",
      description: "Proficient",
      score: 8,
      maxScore: 20,
    },
    {
      id: 2,
      name: "Custom Criterion 2", 
      description: "--",
      score: 0,
      maxScore: 50,
    },
    {
      id: 3,
      name: "Custom Criterion 3",
      description: "--", 
      score: 0,
      maxScore: 30,
    },
  ],
  
  // Custom Highlights
  customHighlights: [],

  // Point Annotations
  pointAnnotations: [],
  annotationState: {
    activePoint: null,
    editingTextAnnotation: null,
    actionBarPosition: null,
  },
  
  // Layered Data Management
  currentDocumentId: null,
  baseDocument: null,
  userState: null,
  mergedContent: null,

  // Rubric Management
  rubrics: [],
  currentRubric: null,
  selectedCell: null,
  isEditingCell: false,
  editingCellContent: '',

  // Course Analytics (Story 2: Hero's Journey)
  courseAnalytics: null,
  studentPatterns: [],
  interventionRecommendations: [],
  courseSubmissions: [],
  courseAnalyticsLoading: false,

  // Core navigation action
  setNavigation: (newNavigation) => {
    set((state) => ({
      navigation: { ...state.navigation, ...newNavigation }
    }));
  },

  // Tab state action
  setTabState: (newTabState) => {
    set((state) => ({
      tabState: { ...state.tabState, ...newTabState }
    }));
  },

  // Match cards action
  setMatchCards: (matchCards) => {
    set({ matchCards });
    console.log('[Store] Match cards loaded:', matchCards.length, 'cards');
  },

  // Convenience navigation methods
  selectMatch: (sourceId, matchIndex, source = "card") => {
    const matchCard = get().matchCards.find((c) => c.id === sourceId);
    const highlightId = matchCard?.matches[matchIndex]?.highlightId ?? null;

    get().setNavigation({
      selectedSourceId: sourceId,
      selectedMatchIndex: matchIndex,
      selectedHighlightId: highlightId,
      navigationSource: source,
    });

    // Bidirectional sync: If user clicked a highlight, notify chat with contextual actions
    if (source === 'highlight' && matchCard && get().chat.isOpen) {
      const extendedCard = matchCard as any;
      const isCited = extendedCard.isCited ?? false;
      const hasIntegrityIssue = extendedCard.academicIntegrityIssue ?? false;

      // Build a contextual message with action buttons
      let message = `📍 You selected a ${extendedCard.similarityPercent || 0}% match to **${extendedCard.sourceName || 'Unknown Source'}**`;

      if (hasIntegrityIssue && !isCited) {
        message += ' (uncited source)';
      } else if (isCited) {
        message += ' (cited)';
      }

      message += '\n\nQuick actions: [ACTION:draft_comment|Draft a comment|' + matchCard.id + '] [ACTION:show_source|View source details|' + matchCard.id + ']';

      // Add system message to chat
      const currentScreen = get().chat.currentScreen;
      if (currentScreen) {
        get().addChatMessage({
          role: 'system',
          content: message,
        });
      }
    }
  },

  clearSelection: () => {
    get().setNavigation({
      selectedSourceId: null,
      selectedMatchIndex: 0,
      selectedHighlightId: null,
      navigationSource: null,
    });
  },

  // UI actions
  hoverHighlight: (id) => set({ hoveredHighlightId: id }),

  toggleSourceInclusion: (id) => {
    const updated = new Set(get().excludedSourceIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    set({ excludedSourceIds: updated });
  },

  assignColors: (ids) => {
    const highlightColors: Record<MatchCardId, string> = {};
    ids.forEach((id, i) => {
      highlightColors[id] = COLORS[i % COLORS.length];
    });
    set({ highlightColors });
  },

  // Comment actions
  selectComment: (id) => set({ selectedCommentId: id }),

  // Sidebar actions
  toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),
  setSidebarVisible: (visible) => set({ sidebarVisible: visible }),

  addComment: (comment) => {
    // Validate required fields
    if (!isString(comment.type) || !isString(comment.content)) {
      throw new Error('Comment must have valid type and content');
    }
    if (!isNonNegativeNumber(comment.position) || !isPositiveNumber(comment.page)) {
      throw new Error('Comment must have valid position and page');
    }
    if (!isNonNegativeNumber(comment.startOffset) || !isNonNegativeNumber(comment.endOffset)) {
      throw new Error('Comment must have valid offset values');
    }
    
    const newComment: CommentData = {
      ...comment,
      id: comment.id || Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      comments: [...state.comments, newComment]
    }));
  },

  updateComment: (id, updates) => {
    if (!isString(id)) {
      throw new Error('Comment ID must be a string');
    }
    
    // Validate updates if they contain certain fields
    if (updates.position !== undefined && !isNonNegativeNumber(updates.position)) {
      throw new Error('Position must be a non-negative number');
    }
    if (updates.page !== undefined && !isPositiveNumber(updates.page)) {
      throw new Error('Page must be a positive number');
    }
    
    set((state) => ({
      comments: state.comments.map(comment =>
        comment.id === id
          ? { ...comment, ...updates, updatedAt: new Date().toISOString() }
          : comment
      )
    }));
  },

  deleteComment: (id) => {
    if (!isString(id)) {
      throw new Error('Comment ID must be a string');
    }
    
    set((state) => ({
      comments: state.comments.filter(comment => comment.id !== id),
      selectedCommentId: state.selectedCommentId === id ? null : state.selectedCommentId
    }));
  },

  // Textual content actions
  updateSummaryComment: (content) => {
    if (!isString(content)) {
      throw new Error('Summary comment must be a string');
    }
    set({ summaryComment: content });
  },

  // Grading actions
  updateRubricScore: (score) => {
    if (!isNonNegativeNumber(score)) {
      throw new Error('Rubric score must be a non-negative number');
    }
    set({ rubricScore: score });
  },

  updateGradingCriterion: (id, updates) => {
    if (!Number.isInteger(id)) {
      throw new Error('Criterion ID must be an integer');
    }
    
    set((state) => ({
      gradingCriteria: state.gradingCriteria.map(criterion =>
        criterion.id === id ? { ...criterion, ...updates } : criterion
      )
    }));
  },

  resetGradingScores: () => {
    set((state) => ({
      gradingCriteria: state.gradingCriteria.map(criterion => ({
        ...criterion,
        score: 0
      })),
      rubricScore: 0
    }));
  },

  // Custom highlight actions
  addCustomHighlight: (highlight) => {
    const newHighlight = {
      ...highlight,
      id: highlight.id || `highlight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      customHighlights: [...state.customHighlights, newHighlight]
    }));
  },

  updateCustomHighlight: (id, updates) => {
    if (!isString(id)) {
      throw new Error('Highlight ID must be a string');
    }
    
    set((state) => ({
      customHighlights: state.customHighlights.map(highlight =>
        highlight.id === id
          ? { ...highlight, ...updates }
          : highlight
      )
    }));
  },

  deleteCustomHighlight: (id) => {
    if (!isString(id)) {
      throw new Error('Highlight ID must be a string');
    }
    
    set((state) => ({
      customHighlights: state.customHighlights.filter(highlight => highlight.id !== id)
    }));
  },

  // Layered Data Actions
  
  loadDocument: async (documentId, baseDocument = null) => {
    try {
      console.log(`🔄 Loading document: ${documentId}`);
      
      // Set current document ID
      set({ currentDocumentId: documentId });
      
      // Store base document if provided
      if (baseDocument) {
        set({ baseDocument });
      }
      
      // Load user state from localStorage
      const userState = userDataPersistence.loadUserState(documentId);
      
      if (userState) {
        // Use existing user state
        set({ userState });

        // Merge user data into store
        const summaryNote = userState.textualContent.notes.find(note => note.id === 'summary-comment');
        const totalScore = userState.grading.rubricScores.reduce((sum, rubric) => sum + rubric.score, 0);

        set({
          comments: userState.comments.map(comment => ({
            id: comment.id,
            type: comment.type,
            content: comment.content,
            position: 0, // Will be calculated from text position
            page: comment.page,
            startOffset: comment.startOffset,
            endOffset: comment.endOffset,
            text: comment.text,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
          })),
          pointAnnotations: userState.pointAnnotations || [],
          summaryComment: summaryNote?.content || '',
          rubricScore: totalScore,
          gradingCriteria: userState.grading.gradingCriteria.map(criterion => ({
            id: parseInt(criterion.id),
            name: criterion.name,
            description: criterion.feedback || '',
            score: criterion.grade,
            maxScore: criterion.maxGrade,
          })),
          customHighlights: userState.customHighlights.map(highlight => ({
            id: highlight.id,
            type: highlight.type,
            text: highlight.text,
            page: highlight.page,
            startOffset: highlight.startOffset,
            endOffset: highlight.endOffset,
            color: highlight.color,
            note: highlight.note,
            createdAt: highlight.createdAt,
          }))
        });

        console.log(`✅ Loaded existing user state with ${userState.comments.length} comments, summary: ${summaryNote ? 'yes' : 'no'}, criteria: ${userState.grading.gradingCriteria.length}`);
      } else {
        // Create new empty user state
        const newUserState: UserState = {
          documentId,
          version: '1.0.0',
          comments: [],
          pointAnnotations: [],
          textualContent: { notes: [] },
          grading: { rubricScores: [], gradingCriteria: [] },
          customHighlights: [],
          metadata: {},
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        };

        set({ userState: newUserState });
        userDataPersistence.saveUserState(documentId, newUserState);

        console.log(`✅ Created new user state for document: ${documentId}`);
      }
      
      // TODO: Create merged content when needed
      // This will combine base document highlights with user content
      
      // Import existing comments into reusable comments bank if feature is enabled
      const isReusableCommentsEnabled = get().isFeatureEnabled('reusableComments');
      if (isReusableCommentsEnabled) {
        const currentComments = get().comments;
        console.log(`📄 Importing ${currentComments.length} existing comments into reusable bank`);
        
        currentComments.forEach(comment => {
          if (comment.content && comment.content !== "Click to add your comment...") {
            get().createReusableCommentFromText(comment.content, comment.type || 'Comment');
          }
        });
      }
      
    } catch (error) {
      console.error('Failed to load document:', error);
      throw error;
    }
  },

  saveUserState: () => {
    const state = get();
    if (!state.currentDocumentId || !state.userState) {
      console.warn('Cannot save: no current document or user state');
      return;
    }
    
    try {
      // Update user state with current comments
      const updatedUserState: UserState = {
        ...state.userState,
        comments: state.comments.map(comment => ({
          id: comment.id,
          type: comment.type as "Feedback" | "Grading",
          content: comment.content,
          text: comment.text || '',
          page: comment.page,
          startOffset: comment.startOffset,
          endOffset: comment.endOffset,
          createdAt: comment.createdAt || new Date().toISOString(),
          updatedAt: comment.updatedAt || new Date().toISOString(),
        })),
        pointAnnotations: state.pointAnnotations,
        lastModified: new Date().toISOString(),
      };
      
      userDataPersistence.saveUserState(state.currentDocumentId, updatedUserState);
      set({ userState: updatedUserState });
      
      console.log(`💾 Saved user state for document: ${state.currentDocumentId}`);
    } catch (error) {
      console.error('Failed to save user state:', error);
      throw error;
    }
  },

  loadUserState: (documentId) => {
    try {
      const userState = userDataPersistence.loadUserState(documentId);
      
      if (userState) {
        const summaryNote = userState.textualContent.notes.find(note => note.id === 'summary-comment');
        const totalScore = userState.grading.rubricScores.reduce((sum, rubric) => sum + rubric.score, 0);

        set({
          userState,
          currentDocumentId: documentId,
          comments: userState.comments.map(comment => ({
            id: comment.id,
            type: comment.type,
            content: comment.content,
            position: 0,
            page: comment.page,
            startOffset: comment.startOffset,
            endOffset: comment.endOffset,
            text: comment.text,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
          })),
          pointAnnotations: userState.pointAnnotations || [],
          summaryComment: summaryNote?.content || '',
          rubricScore: totalScore,
          gradingCriteria: userState.grading.gradingCriteria.map(criterion => ({
            id: parseInt(criterion.id),
            name: criterion.name,
            description: criterion.feedback || '',
            score: criterion.grade,
            maxScore: criterion.maxGrade,
          })),
          customHighlights: userState.customHighlights.map(highlight => ({
            id: highlight.id,
            type: highlight.type,
            text: highlight.text,
            page: highlight.page,
            startOffset: highlight.startOffset,
            endOffset: highlight.endOffset,
            color: highlight.color,
            note: highlight.note,
            createdAt: highlight.createdAt,
          }))
        });

        console.log(`📥 Loaded user state for document: ${documentId}`);
      } else {
        console.log(`📄 No user state found for document: ${documentId}`);
      }
    } catch (error) {
      console.error('Failed to load user state:', error);
      throw error;
    }
  },

  resetToDefault: (documentId) => {
    try {
      const emptyUserState = userDataPersistence.resetToDefault(documentId);
      
      set({
        currentDocumentId: documentId,
        userState: emptyUserState,
        comments: [],
        pointAnnotations: [],
        summaryComment: '',
        rubricScore: 0,
        gradingCriteria: [
          {
            id: 1,
            name: "Custom Criterion 1",
            description: "Proficient",
            score: 8,
            maxScore: 20,
          },
          {
            id: 2,
            name: "Custom Criterion 2",
            description: "--",
            score: 0,
            maxScore: 50,
          },
          {
            id: 3,
            name: "Custom Criterion 3",
            description: "--",
            score: 0,
            maxScore: 30,
          },
        ],
        customHighlights: [],
        selectedCommentId: null,
        // Reset other user-specific state
        excludedSourceIds: new Set(),
        navigation: {
          selectedSourceId: null,
          selectedMatchIndex: 0,
          selectedHighlightId: null,
          navigationSource: null,
          chatReferencedHighlightId: null,
        }
      });
      
      console.log(`🔄 Reset document to pristine state: ${documentId}`);
    } catch (error) {
      console.error('Failed to reset document:', error);
      throw error;
    }
  },

  exportUserState: () => {
    const state = get();
    if (!state.currentDocumentId) {
      console.warn('Cannot export: no current document');
      return null;
    }
    
    try {
      return userDataPersistence.exportUserState(state.currentDocumentId);
    } catch (error) {
      console.error('Failed to export user state:', error);
      throw error;
    }
  },

  importUserState: (jsonData) => {
    const state = get();
    if (!state.currentDocumentId) {
      console.warn('Cannot import: no current document');
      return;
    }
    
    try {
      const importedUserState = userDataPersistence.importUserState(state.currentDocumentId, jsonData);
      
      const summaryNote = importedUserState.textualContent.notes.find(note => note.id === 'summary-comment');
      const totalScore = importedUserState.grading.rubricScores.reduce((sum, rubric) => sum + rubric.score, 0);
      
      set({
        userState: importedUserState,
        comments: importedUserState.comments.map(comment => ({
          id: comment.id,
          type: comment.type,
          content: comment.content,
          position: 0,
          page: comment.page,
          startOffset: comment.startOffset,
          endOffset: comment.endOffset,
          text: comment.text,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
        })),
        pointAnnotations: importedUserState.pointAnnotations || [],
        summaryComment: summaryNote?.content || '',
        rubricScore: totalScore,
        gradingCriteria: importedUserState.grading.gradingCriteria.map(criterion => ({
          id: parseInt(criterion.id),
          name: criterion.name,
          description: criterion.feedback || '',
          score: criterion.grade,
          maxScore: criterion.maxGrade,
        }))
      });
      
      console.log(`📥 Imported user state for document: ${state.currentDocumentId}`);
    } catch (error) {
      console.error('Failed to import user state:', error);
      throw error;
    }
  },

  // Rubric Actions
  loadRubrics: () => {
    try {
      const saved = localStorage.getItem('ithenticate-rubrics');
      if (saved) {
        const rubrics: Rubric[] = JSON.parse(saved);
        set({ rubrics });
        console.log(`📋 Loaded ${rubrics.length} rubrics from localStorage`);
      }
    } catch (error) {
      console.error('Failed to load rubrics:', error);
    }
  },

  saveRubrics: () => {
    try {
      const state = get();
      localStorage.setItem('ithenticate-rubrics', JSON.stringify(state.rubrics));
      console.log(`💾 Saved ${state.rubrics.length} rubrics to localStorage`);
    } catch (error) {
      console.error('Failed to save rubrics:', error);
    }
  },

  createRubric: (type = 'weighted', rows = 4, columns = 4, options = {}) => {
    const newRubric = createDefaultRubric(type, rows, columns, options);
    set((state) => ({
      rubrics: [...state.rubrics, newRubric],
      currentRubric: newRubric,
      selectedCell: null,
      isEditingCell: false,
      editingCellContent: '',
    }));
    get().saveRubrics();
    console.log(`📋 Created new ${type} rubric (${rows}x${columns}): ${newRubric.id}`);
  },

  loadRubric: (id) => {
    const state = get();
    const rubric = state.rubrics.find(r => r.id === id);
    if (rubric) {
      // Clone and migrate the rubric if needed
      const migratedRubric = {
        ...rubric,
        criteria: rubric.criteria.map(criterion => ({
          ...criterion,
          // Ensure descriptions array exists and has correct length
          descriptions: criterion.descriptions && Array.isArray(criterion.descriptions) 
            ? criterion.descriptions 
            : new Array(rubric.scales?.length || 4).fill('')
        }))
      };

      set({
        currentRubric: migratedRubric,
        selectedCell: null,
        isEditingCell: false,
        editingCellContent: '',
      });
      console.log(`📋 Loaded rubric for editing: ${rubric.title}`);
    } else {
      console.warn(`Rubric not found: ${id}`);
    }
  },

  saveCurrentRubric: () => {
    const state = get();
    if (!state.currentRubric) return;

    const updatedRubric = {
      ...state.currentRubric,
      lastModified: new Date().toISOString(),
    };

    set((prevState) => ({
      rubrics: prevState.rubrics.map(r => 
        r.id === updatedRubric.id ? updatedRubric : r
      ),
      currentRubric: updatedRubric,
    }));
    
    get().saveRubrics();
    console.log(`💾 Saved rubric: ${updatedRubric.title}`);
  },

  deleteRubric: (id) => {
    set((state) => ({
      rubrics: state.rubrics.filter(r => r.id !== id),
      currentRubric: state.currentRubric?.id === id ? null : state.currentRubric,
    }));
    get().saveRubrics();
    console.log(`🗑️ Deleted rubric: ${id}`);
  },

  resetCurrentRubric: () => {
    const state = get();
    if (!state.currentRubric) return;

    const resetRubric = createDefaultRubric(state.currentRubric.type);
    resetRubric.id = state.currentRubric.id;
    resetRubric.title = state.currentRubric.title;
    resetRubric.createdAt = state.currentRubric.createdAt;

    set({
      currentRubric: resetRubric,
      selectedCell: null,
      isEditingCell: false,
      editingCellContent: '',
    });
    
    console.log(`🔄 Reset rubric to pristine state: ${resetRubric.title}`);
  },

  updateRubricTitle: (title) => {
    set((state) => ({
      currentRubric: state.currentRubric ? {
        ...state.currentRubric,
        title,
        lastModified: new Date().toISOString(),
      } : null,
    }));
  },

  selectCell: (position) => {
    set({
      selectedCell: position,
      isEditingCell: false,
      editingCellContent: '',
    });
  },

  startEditingCell: (content) => {
    set({
      isEditingCell: true,
      editingCellContent: content,
    });
  },

  updateEditingCellContent: (content) => {
    set({ editingCellContent: content });
  },

  saveCell: () => {
    const state = get();
    if (!state.currentRubric || !state.selectedCell || !state.isEditingCell) return;

    // This function is deprecated in favor of the onChange handlers in RubricCell
    set({
      isEditingCell: false,
      editingCellContent: '',
    });
  },

  cancelCellEdit: () => {
    set({
      isEditingCell: false,
      editingCellContent: '',
    });
  },

  addCriterion: (afterIndex) => {
    const state = get();
    if (!state.currentRubric) return;

    const newCriterion = {
      id: `criterion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: 'Criterion title',
      description: 'Criterion description',
      weight: 25,
      descriptions: new Array(state.currentRubric.scales.length).fill(''),
      scaleTitles: new Array(state.currentRubric.scales.length).fill(0).map((_, idx) =>
        state.currentRubric!.scales[idx]?.title || `Scale ${idx + 1}`
      ),
      scales: state.currentRubric.scales.reduce((acc, scale) => ({
        ...acc,
        [scale.id]: 'Scale description'
      }), {} as { [key: string]: string })
    };

    const insertIndex = afterIndex !== undefined ? afterIndex + 1 : state.currentRubric.criteria.length;
    const newCriteria = [...state.currentRubric.criteria];
    newCriteria.splice(insertIndex, 0, newCriterion);

    set((prevState) => ({
      currentRubric: prevState.currentRubric ? {
        ...prevState.currentRubric,
        criteria: newCriteria,
        metadata: {
          ...prevState.currentRubric.metadata,
          rows: newCriteria.length,
        },
        lastModified: new Date().toISOString(),
      } : null,
    }));
  },

  removeCriterion: (index) => {
    set((state) => ({
      currentRubric: state.currentRubric ? {
        ...state.currentRubric,
        criteria: state.currentRubric.criteria.filter((_, i) => i !== index),
        metadata: {
          ...state.currentRubric.metadata,
          rows: state.currentRubric.criteria.length - 1,
        },
        lastModified: new Date().toISOString(),
      } : null,
      selectedCell: state.selectedCell?.criterionIndex === index ? null : state.selectedCell,
    }));
  },

  duplicateCriterion: (index) => {
    const state = get();
    if (!state.currentRubric) return;

    const originalCriterion = state.currentRubric.criteria[index];
    if (!originalCriterion) return;

    const duplicatedCriterion = {
      ...originalCriterion,
      id: `criterion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      descriptions: [...(originalCriterion.descriptions || [])],
      scaleTitles: [...(originalCriterion.scaleTitles || [])],
    };

    const newCriteria = [...state.currentRubric.criteria];
    newCriteria.splice(index + 1, 0, duplicatedCriterion);

    set((prevState) => ({
      currentRubric: prevState.currentRubric ? {
        ...prevState.currentRubric,
        criteria: newCriteria,
        metadata: {
          ...prevState.currentRubric.metadata,
          rows: newCriteria.length,
        },
        lastModified: new Date().toISOString(),
      } : null,
    }));
  },

  addScale: (afterIndex) => {
    const state = get();
    if (!state.currentRubric) return;

    // Enforce max 7 scales
    if ((state.currentRubric.scales?.length || 0) >= 7) {
      console.warn('Maximum of 7 scales reached.');
      return;
    }

    const newScale = {
      id: `scale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: 'Scale Level Title',
      pointRange: '0-1 pts',
      description: 'Scale description',
      points: 1,
    };

    const insertIndex = afterIndex !== undefined ? afterIndex + 1 : state.currentRubric.scales.length;
    const newScales = [...state.currentRubric.scales];
    newScales.splice(insertIndex, 0, newScale);

    // Add the new scale to all criteria
    const updatedCriteria = state.currentRubric.criteria.map(criterion => {
      const newDescriptions = [...(criterion.descriptions || [])];
      newDescriptions.splice(insertIndex, 0, '');
      const newScaleTitles = [...(criterion.scaleTitles || [])];
      newScaleTitles.splice(insertIndex, 0, newScale.title || `Scale ${insertIndex + 1}`);
      return {
        ...criterion,
        descriptions: newDescriptions,
        scaleTitles: newScaleTitles,
        scales: {
          ...criterion.scales,
          [newScale.id]: 'Scale description'
        }
      };
    });

    set((prevState) => ({
      currentRubric: prevState.currentRubric ? {
        ...prevState.currentRubric,
        scales: newScales,
        criteria: updatedCriteria,
        metadata: {
          ...prevState.currentRubric.metadata,
          columns: newScales.length,
        },
        lastModified: new Date().toISOString(),
      } : null,
    }));
  },

  removeScale: (index) => {
    set((state) => ({
      currentRubric: state.currentRubric ? {
        ...state.currentRubric,
        scales: state.currentRubric.scales.filter((_, i) => i !== index),
        criteria: state.currentRubric.criteria.map(criterion => {
          const newDescriptions = [...(criterion.descriptions || [])];
          newDescriptions.splice(index, 1);
          const newScaleTitles = [...(criterion.scaleTitles || [])];
          if (newScaleTitles.length > index) newScaleTitles.splice(index, 1);
          const scaleId = state.currentRubric!.scales[index]?.id;
          const { [scaleId]: removed, ...remainingScales } = criterion.scales;
          return { 
            ...criterion, 
            descriptions: newDescriptions,
            scaleTitles: newScaleTitles,
            scales: remainingScales 
          };
        }),
        metadata: {
          ...state.currentRubric.metadata,
          columns: state.currentRubric.scales.length - 1,
        },
        lastModified: new Date().toISOString(),
      } : null,
      selectedCell: state.selectedCell?.scaleIndex === index ? null : state.selectedCell,
    }));
  },

  duplicateScale: (index) => {
    const state = get();
    if (!state.currentRubric) return;

    const originalScale = state.currentRubric.scales[index];
    if (!originalScale) return;

    // Enforce max 7 scales
    if ((state.currentRubric.scales?.length || 0) >= 7) {
      console.warn('Maximum of 7 scales reached.');
      return;
    }

    const duplicatedScale = {
      ...originalScale,
      id: `scale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    const newScales = [...state.currentRubric.scales];
    newScales.splice(index + 1, 0, duplicatedScale);

    // Add the duplicated scale to all criteria
    const updatedCriteria = state.currentRubric.criteria.map(criterion => {
      const newDescriptions = [...(criterion.descriptions || [])];
      newDescriptions.splice(index + 1, 0, newDescriptions[index] || '');
      const newScaleTitles = [...(criterion.scaleTitles || [])];
      newScaleTitles.splice(index + 1, 0, newScaleTitles[index] || `Scale ${index + 2}`);
      return {
        ...criterion,
        descriptions: newDescriptions,
        scaleTitles: newScaleTitles,
        scales: {
          ...criterion.scales,
          [duplicatedScale.id]: criterion.scales[originalScale.id] || 'Scale description'
        }
      };
    });

    set((prevState) => ({
      currentRubric: prevState.currentRubric ? {
        ...prevState.currentRubric,
        scales: newScales,
        criteria: updatedCriteria,
        metadata: {
          ...prevState.currentRubric.metadata,
          columns: newScales.length,
        },
        lastModified: new Date().toISOString(),
      } : null,
    }));
  },

  updateCriterionTitle: (criterionId, title) => {
    set((state) => ({
      currentRubric: state.currentRubric ? {
        ...state.currentRubric,
        criteria: state.currentRubric.criteria.map(criterion =>
          criterion.id === criterionId ? { ...criterion, title } : criterion
        ),
        lastModified: new Date().toISOString(),
      } : null,
    }));
  },

  updateScaleTitle: (scaleId, title) => {
    set((state) => ({
      currentRubric: state.currentRubric ? {
        ...state.currentRubric,
        scales: state.currentRubric.scales.map(scale =>
          scale.id === scaleId ? { ...scale, title } : scale
        ),
        lastModified: new Date().toISOString(),
      } : null,
    }));
  },

  updateCellDescription: (criterionId, scaleId, description) => {
    set((state) => ({
      currentRubric: state.currentRubric ? {
        ...state.currentRubric,
        criteria: state.currentRubric.criteria.map(criterion =>
          criterion.id === criterionId ? {
            ...criterion,
            scales: {
              ...criterion.scales,
              [scaleId]: description,
            }
          } : criterion
        ),
        lastModified: new Date().toISOString(),
      } : null,
    }));
  },

  // Additional rubric actions for grid interface
  stopEditingCell: () => {
    set({
      isEditingCell: false,
      editingCellContent: '',
    });
  },

  updateCriterion: (index, updates) => {
    set((state) => ({
      currentRubric: state.currentRubric ? {
        ...state.currentRubric,
        criteria: state.currentRubric.criteria.map((criterion, i) =>
          i === index ? { ...criterion, ...updates } : criterion
        ),
        lastModified: new Date().toISOString(),
      } : null,
    }));
  },

  updateScale: (index, updates) => {
    set((state) => ({
      currentRubric: state.currentRubric ? {
        ...state.currentRubric,
        scales: state.currentRubric.scales.map((scale, i) =>
          i === index ? { ...scale, ...updates } : scale
        ),
        lastModified: new Date().toISOString(),
      } : null,
    }));
  },

  updateCriterionDescription: (criterionIndex, scaleIndex, description) => {
    set((state) => ({
      currentRubric: state.currentRubric ? {
        ...state.currentRubric,
        criteria: state.currentRubric.criteria.map((criterion, i) => {
          if (i === criterionIndex) {
            const newDescriptions = [...(criterion.descriptions || [])];
            newDescriptions[scaleIndex] = description;
            return { ...criterion, descriptions: newDescriptions };
          }
          return criterion;
        }),
        lastModified: new Date().toISOString(),
      } : null,
    }));
  },

  moveCriterion: (fromIndex, toIndex) => {
    set((state) => ({
      currentRubric: state.currentRubric ? {
        ...state.currentRubric,
        criteria: (() => {
          const newCriteria = [...state.currentRubric.criteria];
          const [moved] = newCriteria.splice(fromIndex, 1);
          newCriteria.splice(toIndex, 0, moved);
          return newCriteria;
        })(),
        lastModified: new Date().toISOString(),
      } : null,
    }));
  },

  moveScale: (fromIndex, toIndex) => {
    set((state) => ({
      currentRubric: state.currentRubric ? {
        ...state.currentRubric,
        scales: (() => {
          const newScales = [...state.currentRubric.scales];
          const [moved] = newScales.splice(fromIndex, 1);
          newScales.splice(toIndex, 0, moved);
          return newScales;
        })(),
        lastModified: new Date().toISOString(),
      } : null,
    }));
  },

  importRubrics: (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      
      // Support both single rubric and array of rubrics
      let rubricsToImport: Rubric[] = [];
      
      if (data.rubrics && Array.isArray(data.rubrics)) {
        // File with { rubrics: [...] } structure
        rubricsToImport = data.rubrics;
      } else if (Array.isArray(data)) {
        // Direct array of rubrics
        rubricsToImport = data;
      } else if (data.id && data.title) {
        // Single rubric object
        rubricsToImport = [data];
      } else {
        throw new Error('Invalid JSON format. Expected rubric(s) data.');
      }

      // Validate and migrate each rubric
      const validatedRubrics = rubricsToImport.map(rubric => {
        // Ensure all required fields exist
        if (!rubric.id || !rubric.title || !rubric.criteria || !rubric.scales) {
          throw new Error(`Invalid rubric: ${rubric.title || 'Unknown'} is missing required fields.`);
        }

        // Migrate and ensure descriptions array exists
        const migratedRubric = {
          ...rubric,
          criteria: rubric.criteria.map(criterion => ({
            ...criterion,
            descriptions: criterion.descriptions && Array.isArray(criterion.descriptions) 
              ? criterion.descriptions 
              : new Array(rubric.scales.length).fill('')
          })),
          // Generate new IDs to avoid conflicts
          id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          lastModified: new Date().toISOString(),
        };

        return migratedRubric;
      });

      // Add to existing rubrics
      set((state) => ({
        rubrics: [...state.rubrics, ...validatedRubrics]
      }));

      // Save to localStorage
      get().saveRubrics();
      
      console.log(`📥 Imported ${validatedRubrics.length} rubric(s) successfully`);
      return validatedRubrics.length;
      
    } catch (error) {
      console.error('Failed to import rubrics:', error);
      throw error;
    }
  },

  // Feature Flag Actions
  loadFeatureFlags: () => {
    try {
      const saved = localStorage.getItem('ithenticate-feature-flags');
      if (saved) {
        const savedFlags = JSON.parse(saved);
        set((state) => ({
          featureFlags: {
            ...state.featureFlags,
            flags: { ...DEFAULT_FEATURE_FLAGS, ...savedFlags.flags },
            lastModified: savedFlags.lastModified || state.featureFlags.lastModified,
          }
        }));
        console.log('🏴 Loaded feature flags from localStorage');
      }
    } catch (error) {
      console.error('Failed to load feature flags:', error);
    }
  },

  saveFeatureFlags: () => {
    try {
      const state = get();
      const flagsToSave = {
        flags: state.featureFlags.flags,
        lastModified: state.featureFlags.lastModified,
      };
      localStorage.setItem('ithenticate-feature-flags', JSON.stringify(flagsToSave));
      console.log('💾 Saved feature flags to localStorage');
    } catch (error) {
      console.error('Failed to save feature flags:', error);
    }
  },

  toggleFeatureFlag: (flagId) => {
    set((state) => {
      const currentFlag = state.featureFlags.flags[flagId];
      if (!currentFlag) {
        console.warn(`Feature flag ${flagId} not found`);
        return state;
      }

      const updatedFlags = {
        ...state.featureFlags.flags,
        [flagId]: {
          ...currentFlag,
          enabled: !currentFlag.enabled,
        }
      };

      const newState = {
        featureFlags: {
          ...state.featureFlags,
          flags: updatedFlags,
          lastModified: new Date().toISOString(),
        }
      };

      // Auto-save after toggle
      setTimeout(() => get().saveFeatureFlags(), 0);
      
      console.log(`🏴 Toggled feature flag ${flagId}: ${!currentFlag.enabled ? 'enabled' : 'disabled'}`);
      return newState;
    });
  },

  updateFeatureFlag: (flagId, updates) => {
    set((state) => {
      const currentFlag = state.featureFlags.flags[flagId];
      if (!currentFlag) {
        console.warn(`Feature flag ${flagId} not found`);
        return state;
      }

      const updatedFlags = {
        ...state.featureFlags.flags,
        [flagId]: {
          ...currentFlag,
          ...updates,
        }
      };

      const newState = {
        featureFlags: {
          ...state.featureFlags,
          flags: updatedFlags,
          lastModified: new Date().toISOString(),
        }
      };

      // Auto-save after update
      setTimeout(() => get().saveFeatureFlags(), 0);
      
      console.log(`🏴 Updated feature flag ${flagId}:`, updates);
      return newState;
    });
  },

  resetFeatureFlags: () => {
    set((state) => ({
      featureFlags: {
        ...state.featureFlags,
        flags: { ...DEFAULT_FEATURE_FLAGS },
        lastModified: new Date().toISOString(),
      }
    }));
    
    // Auto-save after reset
    setTimeout(() => get().saveFeatureFlags(), 0);
    console.log('🏴 Reset feature flags to defaults');
  },

  toggleFeatureFlagsPanel: () => {
    set((state) => ({
      featureFlags: {
        ...state.featureFlags,
        panelOpen: !state.featureFlags.panelOpen,
      }
    }));
  },

  isFeatureEnabled: (flagId) => {
    const state = get();
    return state.featureFlags.flags[flagId]?.enabled ?? false;
  },

  // Reusable Comments Actions
  loadReusableComments: () => {
    try {
      const saved = localStorage.getItem('ithenticate-reusable-comments');
      if (saved) {
        const savedComments = JSON.parse(saved);
        set((state) => ({
          reusableComments: {
            ...state.reusableComments,
            comments: [...DEFAULT_COMMENT_BANK, ...savedComments.userComments || []],
            initialized: true,
            lastModified: savedComments.lastModified || state.reusableComments.lastModified,
          }
        }));
        console.log('💬 Loaded reusable comments from localStorage');
      } else {
        // First time initialization
        set((state) => ({
          reusableComments: {
            ...state.reusableComments,
            initialized: true,
          }
        }));
        get().saveReusableComments();
      }
    } catch (error) {
      console.error('Failed to load reusable comments:', error);
    }
  },

  saveReusableComments: () => {
    try {
      const state = get();
      // Only save user-created comments to localStorage
      const userComments = state.reusableComments.comments.filter(c => c.source === 'user');
      const dataToSave = {
        userComments,
        lastModified: state.reusableComments.lastModified,
      };
      localStorage.setItem('ithenticate-reusable-comments', JSON.stringify(dataToSave));
      console.log(`💾 Saved ${userComments.length} user reusable comments to localStorage`);
    } catch (error) {
      console.error('Failed to save reusable comments:', error);
    }
  },

  addReusableComment: (comment) => {
    set((state) => {
      // Check if a similar comment already exists (exact match on content)
      const existingComment = state.reusableComments.comments.find(
        existing => existing.content.trim().toLowerCase() === comment.content.trim().toLowerCase()
      );
      
      if (existingComment) {
        console.log(`💬 Skipping duplicate comment: "${comment.content.substring(0, 50)}..." (already exists)`);
        // Just increment usage count of existing comment instead
        return {
          reusableComments: {
            ...state.reusableComments,
            comments: state.reusableComments.comments.map(c => 
              c.id === existingComment.id 
                ? { ...c, usageCount: c.usageCount + 1, lastUsedAt: new Date().toISOString() }
                : c
            ),
            lastModified: new Date().toISOString(),
          }
        };
      }
      
      // Add new comment if no duplicate found
      return {
        reusableComments: {
          ...state.reusableComments,
          comments: [...state.reusableComments.comments, comment],
          lastModified: new Date().toISOString(),
        }
      };
    });
    
    // Auto-save after adding
    setTimeout(() => get().saveReusableComments(), 0);
    console.log(`💬 Added reusable comment: ${comment.content.substring(0, 50)}...`);
  },

  findSimilarComments: (searchText, limit = 5) => {
    const state = get();
    const allComments = state.reusableComments.comments;
    console.log(`🔍 Searching in ${allComments.length} comments (${allComments.filter(c => c.source === 'user').length} user, ${allComments.filter(c => c.source === 'system').length} system) for: "${searchText}"`);
    const results = findSimilarComments(searchText, allComments, limit);
    console.log(`🔍 Found ${results.length} matching comments:`, results.map(r => ({ content: r.content.substring(0, 30), source: r.source })));
    return results;
  },

  useReusableComment: (commentId) => {
    set((state) => ({
      reusableComments: {
        ...state.reusableComments,
        comments: state.reusableComments.comments.map(comment =>
          comment.id === commentId
            ? {
                ...comment,
                usageCount: comment.usageCount + 1,
                lastUsedAt: new Date().toISOString(),
              }
            : comment
        ),
        lastModified: new Date().toISOString(),
      }
    }));
    
    // Auto-save after use
    setTimeout(() => get().saveReusableComments(), 0);
  },

  createReusableCommentFromText: (content, type, tags = []) => {
    const comment = createReusableComment(content, type, tags);
    get().addReusableComment(comment);
    return comment;
  },

  // Course Analytics Actions (Story 2: Hero's Journey)
  loadCourseAnalytics: async () => {
    set({ courseAnalyticsLoading: true });
    console.log('[Course Analytics] Loading course submissions...');

    try {
      // Import utilities dynamically to avoid circular dependencies
      const { loadCourseSubmissions } = await import('./utils/courseDataLoader');
      const {
        computeCourseAnalytics,
        analyzeStudentPatterns,
        generateInterventionRecommendations
      } = await import('./utils/courseAnalytics');

      // Load all submissions with document data
      const submissions = await loadCourseSubmissions();

      // Compute analytics
      const analytics = computeCourseAnalytics(submissions);
      const patterns = analyzeStudentPatterns(submissions);
      const recommendations = generateInterventionRecommendations(patterns);

      set({
        courseSubmissions: submissions,
        courseAnalytics: analytics,
        studentPatterns: patterns,
        interventionRecommendations: recommendations,
        courseAnalyticsLoading: false,
      });

      console.log('[Course Analytics] ✅ Loaded analytics for', submissions.length, 'submissions');
      console.log('[Course Analytics] Found', recommendations.length, 'students needing intervention');
    } catch (error) {
      console.error('[Course Analytics] ❌ Error loading analytics:', error);
      set({ courseAnalyticsLoading: false });
    }
  },

  refreshCourseAnalytics: () => {
    const state = get();
    if (state.courseSubmissions.length === 0) {
      console.warn('[Course Analytics] No submissions loaded, cannot refresh');
      return;
    }

    // Re-compute analytics from existing submissions
    import('./utils/courseAnalytics').then(({
      computeCourseAnalytics,
      analyzeStudentPatterns,
      generateInterventionRecommendations
    }) => {
      const analytics = computeCourseAnalytics(state.courseSubmissions);
      const patterns = analyzeStudentPatterns(state.courseSubmissions);
      const recommendations = generateInterventionRecommendations(patterns);

      set({
        courseAnalytics: analytics,
        studentPatterns: patterns,
        interventionRecommendations: recommendations,
      });

      console.log('[Course Analytics] ✅ Refreshed analytics');
    });
  },

  exportCourseAnalyticsCSV: () => {
    const state = get();
    if (!state.courseAnalytics) {
      console.error('[Course Analytics] No analytics data to export');
      return '';
    }

    // Use dynamic import to avoid bundling issues
    const { exportAnalyticsAsCSV } = require('./utils/courseAnalytics');
    return exportAnalyticsAsCSV(state.courseAnalytics);
  },

  exportInterventionsCSV: () => {
    const state = get();
    if (state.interventionRecommendations.length === 0) {
      console.error('[Course Analytics] No interventions to export');
      return '';
    }

    const { exportInterventionsAsCSV } = require('./utils/courseAnalytics');
    return exportInterventionsAsCSV(state.interventionRecommendations);
  },

  // Point Annotation Actions
  setActiveAnnotationPoint: (position, actionBarPosition = null) => {
    set((state) => ({
      annotationState: {
        ...state.annotationState,
        activePoint: position,
        actionBarPosition: actionBarPosition,
      }
    }));
  },

  addPointAnnotation: (annotation) => {
    const newAnnotation: PointAnnotation = {
      ...annotation,
      id: `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      pointAnnotations: [...state.pointAnnotations, newAnnotation]
    }));
    console.log(`📍 Added point annotation: ${annotation.type} at (${annotation.position.x}, ${annotation.position.y})`);
  },

  updatePointAnnotation: (id, updates) => {
    set((state) => ({
      pointAnnotations: state.pointAnnotations.map(annotation =>
        annotation.id === id
          ? { ...annotation, ...updates, updatedAt: new Date().toISOString() }
          : annotation
      )
    }));
  },

  deletePointAnnotation: (id) => {
    set((state) => ({
      pointAnnotations: state.pointAnnotations.filter(annotation => annotation.id !== id),
      annotationState: {
        ...state.annotationState,
        editingTextAnnotation: state.annotationState.editingTextAnnotation === id ? null : state.annotationState.editingTextAnnotation,
      }
    }));
  },

  setEditingTextAnnotation: (id) => {
    set((state) => ({
      annotationState: {
        ...state.annotationState,
        editingTextAnnotation: id,
      }
    }));
  },

  clearAnnotationState: () => {
    set(() => ({
      annotationState: {
        activePoint: null,
        editingTextAnnotation: null,
        actionBarPosition: null,
      }
    }));
  },

  // Chat Action Handlers
  handleDraftCommentAction: async (payload) => {
    const { matchCardId, issueDescription } = payload;
    const state = get();

    // Find the match card if ID provided
    let matchCard = matchCardId ? state.matchCards.find(mc => mc.id === matchCardId) : null;

    // If no match card found, try to find the most problematic one
    if (!matchCard) {
      // Look for uncited sources with academic integrity issues
      const problematicCards = state.matchCards.filter((mc: any) =>
        mc.academicIntegrityIssue && !mc.isCited
      );

      if (problematicCards.length > 0) {
        // Sort by similarity percentage (highest first)
        matchCard = problematicCards.sort((a: any, b: any) => (b.similarityPercent || 0) - (a.similarityPercent || 0))[0];
      } else if (state.matchCards.length > 0) {
        // Fallback to the largest source
        matchCard = state.matchCards.sort((a: any, b: any) => (b.similarityPercent || 0) - (a.similarityPercent || 0))[0];
      }
    }

    if (!matchCard) {
      return 'Please review the similarity sources and ensure all content is properly cited.';
    }

    // Cast to access extended properties
    const extendedCard = matchCard as any;
    const isCited = extendedCard.isCited ?? false;
    const hasIntegrityIssue = extendedCard.academicIntegrityIssue ?? false;

    // Draft a more detailed comment based on the issue
    let draftText = '';

    if (issueDescription) {
      draftText = `Please review this section. ${issueDescription}`;
    } else if (hasIntegrityIssue && !isCited) {
      draftText = `This section contains a ${extendedCard.similarityPercent || 0}% match to "${extendedCard.sourceName || 'an external source'}" that is not cited in your Works Cited. Please add a proper citation or rework this section to use your own words.`;
    } else if (!isCited) {
      draftText = `This section shows a ${extendedCard.similarityPercent || 0}% match to "${extendedCard.sourceName || 'an external source'}". Please ensure this source is properly cited.`;
    } else {
      draftText = `Please review the citation for "${extendedCard.sourceName || 'this source'}" (${extendedCard.similarityPercent || 0}% match) to ensure it follows the required format.`;
    }

    return draftText;
  },

  handleAddCommentAction: (payload) => {
    try {
      const { text, page = 1, highlightId } = payload;

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        console.error('Cannot add comment: invalid text provided');
        throw new Error('Comment text is required');
      }

      const state = get();

      // Find highlight if provided
      let commentPage = page;
      let position = 100; // default position
      let startOffset = 0;
      let endOffset = 0;
      let selectedText = '';

      if (highlightId) {
        const highlight = state.matchCards
          .flatMap(mc => mc.matches)
          .find((m: any) => m.highlightId === highlightId);

        if (highlight) {
          const extendedHighlight = highlight as any;
          commentPage = extendedHighlight.highlightId ? parseInt(extendedHighlight.highlightId.split('-')[0]) || page : page;
          selectedText = extendedHighlight.matchedText || '';
          // Approximate offsets from matched text length
          startOffset = 0;
          endOffset = selectedText.length;
        } else {
          console.warn(`Highlight ${highlightId} not found, using default position`);
        }
      }

      // Add the comment
      get().addComment({
        id: `comment-${Date.now()}`,
        type: 'Feedback',
        content: text.trim(),
        page: commentPage,
        position,
        text: selectedText,
        startOffset,
        endOffset,
        source: 'chat',
      });

      console.log(`✅ Inline comment added successfully on page ${commentPage}`);
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  handleAddSummaryCommentAction: (payload) => {
    try {
      const { text } = payload;

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        console.error('Cannot add summary comment: invalid text provided');
        throw new Error('Summary comment text is required');
      }

      const state = get();
      const currentSummary = state.summaryComment;

      // If there's existing summary, append with a newline separator
      const newSummary = currentSummary
        ? `${currentSummary}\n\n${text.trim()}`
        : text.trim();

      get().updateSummaryComment(newSummary);

      console.log(`✅ Summary comment ${currentSummary ? 'updated' : 'added'} successfully`);
    } catch (error) {
      console.error('Error adding summary comment:', error);
      throw error;
    }
  },

  handleHighlightTextAction: (payload) => {
    try {
      const { matchCardId, matchIndex = 0 } = payload;

      if (!matchCardId) {
        console.error('Cannot highlight text: matchCardId is required');
        throw new Error('Match card ID is required');
      }

      const state = get();

      // Find the match card
      const matchCard = state.matchCards.find(mc => mc.id === matchCardId);
      if (!matchCard) {
        console.error(`Match card not found: ${matchCardId}`);
        throw new Error(`Match card ${matchCardId} not found`);
      }

      // Validate match index
      if (matchIndex < 0 || matchIndex >= matchCard.matches.length) {
        console.error(`Invalid match index ${matchIndex} for card ${matchCardId} (has ${matchCard.matches.length} matches)`);
        throw new Error('Invalid match index');
      }

      // Navigate to the match
      get().selectMatch(matchCardId, matchIndex, 'card');

      // Scroll to the highlight if it exists
      const match = matchCard.matches[matchIndex];
      if (match?.highlightId) {
        // Set chat-referenced highlight for visual feedback
        get().setNavigation({ chatReferencedHighlightId: match.highlightId });

        setTimeout(() => {
          const element = document.querySelector(`[data-highlight-id="${match.highlightId}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            (element as HTMLElement).focus?.();
            console.log(`✅ Navigated to highlight: ${match.highlightId}`);
          } else {
            console.warn(`Highlight element not found in DOM: ${match.highlightId}`);
          }
        }, 100);

        // Clear the chat reference after animation completes
        setTimeout(() => {
          get().setNavigation({ chatReferencedHighlightId: null });
        }, 2000);
      } else {
        console.warn(`No highlightId for match ${matchIndex} in card ${matchCardId}`);
      }
    } catch (error) {
      console.error('Error highlighting text:', error);
      throw error;
    }
  },

  handleShowSourceAction: (payload) => {
    try {
      const { matchCardId } = payload;

      if (!matchCardId) {
        console.error('Cannot show source: matchCardId is required');
        throw new Error('Match card ID is required');
      }

      const state = get();

      // Find the match card
      const matchCard = state.matchCards.find(mc => mc.id === matchCardId);
      if (!matchCard) {
        console.error(`Match card not found: ${matchCardId}`);
        throw new Error(`Match card ${matchCardId} not found`);
      }

      // Navigate to first match of this source and scroll to match card
      get().selectMatch(matchCardId, 0, 'card');

      // Scroll the match card into view
      setTimeout(() => {
        const cardElement = document.querySelector(`[data-match-card-id="${matchCardId}"]`);
        if (cardElement) {
          cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          console.log(`✅ Showed source card: ${matchCardId}`);
        } else {
          console.warn(`Match card element not found in DOM: ${matchCardId}`);
        }
      }, 100);
    } catch (error) {
      console.error('Error showing source:', error);
      throw error;
    }
  },

  // Chat Actions
  openChat: (screen) => {
    set((state) => ({
      chat: {
        ...state.chat,
        isOpen: true,
        currentScreen: screen,
      }
    }));
    console.log(`💬 Opened chat for screen: ${screen}`);
  },

  closeChat: () => {
    set((state) => ({
      chat: {
        ...state.chat,
        isOpen: false,
      }
    }));
    console.log('💬 Closed chat');
  },

  toggleChat: (screen) => {
    set((state) => {
      const isCurrentlyOpen = state.chat.isOpen;
      const newScreen = screen || state.chat.currentScreen || 'inbox';
      return {
        chat: {
          ...state.chat,
          isOpen: !isCurrentlyOpen,
          currentScreen: !isCurrentlyOpen ? newScreen : state.chat.currentScreen,
        }
      };
    });
  },

  setChatDisplayMode: (mode) => {
    set((state) => ({
      chat: {
        ...state.chat,
        displayMode: mode,
      }
    }));
    console.log(`💬 Set chat display mode: ${mode}`);
  },

  setChatPanelWidth: (width) => {
    set((state) => ({
      chat: {
        ...state.chat,
        panelWidth: Math.max(300, Math.min(800, width)), // Clamp between 300-800px
      }
    }));
  },

  addChatMessage: (message) => {
    const state = get();
    const currentScreen = state.chat.currentScreen;
    if (!currentScreen) {
      console.warn('Cannot add message: no current screen set');
      return;
    }

    const newMessage: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      chat: {
        ...state.chat,
        conversations: {
          ...state.chat.conversations,
          [currentScreen]: {
            ...state.chat.conversations[currentScreen],
            messages: [...state.chat.conversations[currentScreen].messages, newMessage],
            lastModified: new Date().toISOString(),
          }
        }
      }
    }));

    // Auto-save after adding message
    setTimeout(() => get().saveChatHistory(), 0);
  },

  clearChatHistory: (screen) => {
    set((state) => ({
      chat: {
        ...state.chat,
        conversations: {
          ...state.chat.conversations,
          [screen]: {
            screen,
            messages: [],
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
          }
        }
      }
    }));
    console.log(`💬 Cleared chat history for screen: ${screen}`);
    setTimeout(() => get().saveChatHistory(), 0);
  },

  loadChatHistory: () => {
    try {
      const saved = localStorage.getItem('ithenticate-chat-history');
      if (saved) {
        const { conversations, displayMode } = JSON.parse(saved);
        set((state) => ({
          chat: {
            ...state.chat,
            conversations: conversations || state.chat.conversations,
            displayMode: displayMode || state.chat.displayMode,
          }
        }));
        console.log('💬 Loaded chat history from localStorage');
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  },

  saveChatHistory: () => {
    try {
      const state = get();
      const toSave = {
        conversations: state.chat.conversations,
        displayMode: state.chat.displayMode,
      };
      localStorage.setItem('ithenticate-chat-history', JSON.stringify(toSave));
      console.log('💬 Saved chat history to localStorage');
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  },

  setGeneratingArtifact: (generating, artifact = null) => {
    set((state) => ({
      chat: {
        ...state.chat,
        isGeneratingArtifact: generating,
        currentArtifact: artifact,
      }
    }));
  },
}));
