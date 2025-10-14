/**
 * Reusable Comments System Types
 */

export interface ReusableComment {
  /** Unique identifier */
  id: string;
  /** The comment text content */
  content: string;
  /** Comment type (Grading, Comment, etc.) */
  type: string;
  /** How many times this comment has been used */
  usageCount: number;
  /** When this comment was first created */
  createdAt: string;
  /** When this comment was last used */
  lastUsedAt: string;
  /** Categories/tags for organization */
  tags: string[];
  /** Whether this is a system-provided comment or user-created */
  source: 'system' | 'user';
}

export interface ReusableCommentsState {
  /** All available reusable comments */
  comments: ReusableComment[];
  /** Whether the system has been initialized */
  initialized: boolean;
  /** Last time the bank was updated */
  lastModified: string;
}

/** Predefined comment bank for prototype */
export const DEFAULT_COMMENT_BANK: ReusableComment[] = [
  // Grammar and Writing Style
  {
    id: 'grammar-1',
    content: 'Check your subject-verb agreement in this sentence.',
    type: 'Comment',
    usageCount: 0,
    createdAt: '2024-01-15T00:00:00Z',
    lastUsedAt: '2024-01-15T00:00:00Z',
    tags: ['grammar', 'writing'],
    source: 'system'
  },
  {
    id: 'grammar-2',
    content: 'This sentence is a run-on. Consider breaking it into smaller sentences.',
    type: 'Comment',
    usageCount: 0,
    createdAt: '2024-01-15T00:00:00Z',
    lastUsedAt: '2024-01-15T00:00:00Z',
    tags: ['grammar', 'sentence structure'],
    source: 'system'
  },
  {
    id: 'writing-1',
    content: 'This paragraph would benefit from a stronger topic sentence.',
    type: 'Comment',
    usageCount: 0,
    createdAt: '2024-01-15T00:00:00Z',
    lastUsedAt: '2024-01-15T00:00:00Z',
    tags: ['writing', 'structure'],
    source: 'system'
  },
  {
    id: 'writing-2',
    content: 'Consider providing more specific examples to support your argument.',
    type: 'Comment',
    usageCount: 0,
    createdAt: '2024-01-15T00:00:00Z',
    lastUsedAt: '2024-01-15T00:00:00Z',
    tags: ['writing', 'evidence', 'support'],
    source: 'system'
  },
  {
    id: 'writing-3',
    content: 'The transition between these paragraphs could be smoother.',
    type: 'Comment',
    usageCount: 0,
    createdAt: '2024-01-15T00:00:00Z',
    lastUsedAt: '2024-01-15T00:00:00Z',
    tags: ['writing', 'transitions', 'flow'],
    source: 'system'
  },

  // Citations and Research
  {
    id: 'citation-1',
    content: 'This statement needs a citation to support the claim.',
    type: 'Comment',
    usageCount: 0,
    createdAt: '2024-01-15T00:00:00Z',
    lastUsedAt: '2024-01-15T00:00:00Z',
    tags: ['citations', 'research'],
    source: 'system'
  },
  {
    id: 'citation-2',
    content: 'Check your citation format according to the style guide.',
    type: 'Comment',
    usageCount: 0,
    createdAt: '2024-01-15T00:00:00Z',
    lastUsedAt: '2024-01-15T00:00:00Z',
    tags: ['citations', 'formatting'],
    source: 'system'
  },
  {
    id: 'research-1',
    content: 'Consider incorporating more recent sources to strengthen your argument.',
    type: 'Comment',
    usageCount: 0,
    createdAt: '2024-01-15T00:00:00Z',
    lastUsedAt: '2024-01-15T00:00:00Z',
    tags: ['research', 'sources', 'currency'],
    source: 'system'
  },

  // Grading Comments
  {
    id: 'grade-excellent',
    content: 'Excellent work! Your analysis demonstrates deep understanding of the topic.',
    type: 'Grading',
    usageCount: 0,
    createdAt: '2024-01-15T00:00:00Z',
    lastUsedAt: '2024-01-15T00:00:00Z',
    tags: ['grading', 'excellent', 'analysis'],
    source: 'system'
  },
  {
    id: 'grade-good',
    content: 'Good effort. Your main points are clear, but consider expanding on your analysis.',
    type: 'Grading',
    usageCount: 0,
    createdAt: '2024-01-15T00:00:00Z',
    lastUsedAt: '2024-01-15T00:00:00Z',
    tags: ['grading', 'good', 'development'],
    source: 'system'
  },
  {
    id: 'grade-needs-work',
    content: 'This section needs more development. Please provide more detailed analysis.',
    type: 'Grading',
    usageCount: 0,
    createdAt: '2024-01-15T00:00:00Z',
    lastUsedAt: '2024-01-15T00:00:00Z',
    tags: ['grading', 'development', 'analysis'],
    source: 'system'
  },

  // Critical Thinking
  {
    id: 'critical-1',
    content: 'Consider the counterarguments to this position.',
    type: 'Comment',
    usageCount: 0,
    createdAt: '2024-01-15T00:00:00Z',
    lastUsedAt: '2024-01-15T00:00:00Z',
    tags: ['critical thinking', 'counterarguments'],
    source: 'system'
  },
  {
    id: 'critical-2',
    content: 'What evidence supports this conclusion? Be more specific.',
    type: 'Comment',
    usageCount: 0,
    createdAt: '2024-01-15T00:00:00Z',
    lastUsedAt: '2024-01-15T00:00:00Z',
    tags: ['critical thinking', 'evidence', 'specificity'],
    source: 'system'
  },

  // Organization and Structure
  {
    id: 'organization-1',
    content: 'Consider reorganizing this section for better logical flow.',
    type: 'Comment',
    usageCount: 0,
    createdAt: '2024-01-15T00:00:00Z',
    lastUsedAt: '2024-01-15T00:00:00Z',
    tags: ['organization', 'structure', 'flow'],
    source: 'system'
  },
  {
    id: 'organization-2',
    content: 'Your conclusion effectively summarizes your main arguments.',
    type: 'Grading',
    usageCount: 0,
    createdAt: '2024-01-15T00:00:00Z',
    lastUsedAt: '2024-01-15T00:00:00Z',
    tags: ['organization', 'conclusion', 'positive'],
    source: 'system'
  },

  // Clarity and Style
  {
    id: 'clarity-1',
    content: 'This point could be expressed more clearly. Consider revising for clarity.',
    type: 'Comment',
    usageCount: 0,
    createdAt: '2024-01-15T00:00:00Z',
    lastUsedAt: '2024-01-15T00:00:00Z',
    tags: ['clarity', 'revision'],
    source: 'system'
  },
  {
    id: 'style-1',
    content: 'Avoid using first person in academic writing.',
    type: 'Comment',
    usageCount: 0,
    createdAt: '2024-01-15T00:00:00Z',
    lastUsedAt: '2024-01-15T00:00:00Z',
    tags: ['style', 'academic writing', 'voice'],
    source: 'system'
  },

  // Quick Positive Feedback
  {
    id: 'positive-1',
    content: 'Well done!',
    type: 'Grading',
    usageCount: 0,
    createdAt: '2024-01-15T00:00:00Z',
    lastUsedAt: '2024-01-15T00:00:00Z',
    tags: ['positive', 'brief'],
    source: 'system'
  },
  {
    id: 'positive-2',
    content: 'Great insight here.',
    type: 'Comment',
    usageCount: 0,
    createdAt: '2024-01-15T00:00:00Z',
    lastUsedAt: '2024-01-15T00:00:00Z',
    tags: ['positive', 'insight'],
    source: 'system'
  },
  {
    id: 'positive-3',
    content: 'This demonstrates excellent critical thinking.',
    type: 'Grading',
    usageCount: 0,
    createdAt: '2024-01-15T00:00:00Z',
    lastUsedAt: '2024-01-15T00:00:00Z',
    tags: ['positive', 'critical thinking'],
    source: 'system'
  }
];

/** Helper to search for similar comments */
export function findSimilarComments(
  searchText: string, 
  commentBank: ReusableComment[], 
  limit: number = 5
): ReusableComment[] {
  if (!searchText.trim()) return [];
  
  const searchWords = searchText.toLowerCase().split(/\s+/);
  
  // Score each comment based on similarity
  const scoredComments = commentBank.map(comment => {
    const commentWords = comment.content.toLowerCase().split(/\s+/);
    let score = 0;
    
    // Exact text match gets highest score
    if (comment.content.toLowerCase().includes(searchText.toLowerCase())) {
      score += 100;
    }
    
    // Word overlap scoring
    searchWords.forEach(searchWord => {
      commentWords.forEach(commentWord => {
        if (commentWord.includes(searchWord) || searchWord.includes(commentWord)) {
          score += 10;
        }
      });
    });
    
    // Tag matching
    searchWords.forEach(searchWord => {
      comment.tags.forEach(tag => {
        if (tag.toLowerCase().includes(searchWord) || searchWord.includes(tag.toLowerCase())) {
          score += 5;
        }
      });
    });
    
    // Boost score based on usage count (popular comments)
    score += comment.usageCount * 2;
    
    return { comment, score };
  });
  
  // Sort by score and return top matches
  return scoredComments
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.comment);
}

/** Helper to create a reusable comment from user input */
export function createReusableComment(
  content: string,
  type: string,
  tags: string[] = []
): ReusableComment {
  return {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    content,
    type,
    usageCount: 1, // First use
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
    tags,
    source: 'user'
  };
}