import { useStore } from '../store';
import { act } from '@testing-library/react';

describe('Chat Action Handlers', () => {
  beforeEach(() => {
    // Reset store state before each test
    useStore.setState({
      navigation: {
        selectedSourceId: null,
        selectedMatchIndex: 0,
        selectedHighlightId: null,
        navigationSource: null,
        chatReferencedHighlightId: null,
      },
      tabState: {
        primaryTab: 'Similarity',
        secondaryTab: 'Match Groups',
        showSimilarityHighlights: true,
      },
      matchCards: [
        {
          id: 'mc1',
          matches: [
            { highlightId: '1-h1' },
            { highlightId: '1-h2' },
          ],
        },
        {
          id: 'mc2',
          matches: [
            { highlightId: '2-h1' },
          ],
        },
      ],
      comments: [],
      summaryComment: '',
    });
  });

  // Note: handleDraftCommentAction requires full document data to test properly,
  // so we skip those tests in this unit test suite.

  describe('handleAddCommentAction', () => {
    it('should add a comment with text only', () => {
      const store = useStore.getState();

      act(() => {
        store.handleAddCommentAction({
          text: 'This is a test comment',
        });
      });

      const comments = useStore.getState().comments;
      expect(comments).toHaveLength(1);
      expect(comments[0].content).toBe('This is a test comment');
      expect(comments[0].page).toBe(1);
      expect(comments[0].position).toBe(100);
      expect(comments[0].source).toBe('chat');
    });

    it('should add a comment with page number', () => {
      const store = useStore.getState();

      act(() => {
        store.handleAddCommentAction({
          text: 'Comment on page 2',
          page: 2,
        });
      });

      const comments = useStore.getState().comments;
      expect(comments).toHaveLength(1);
      expect(comments[0].page).toBe(2);
    });

    it('should add a comment with highlightId', () => {
      const store = useStore.getState();

      act(() => {
        store.handleAddCommentAction({
          text: 'Comment on highlighted text',
          highlightId: '1-h1',
        });
      });

      const comments = useStore.getState().comments;
      expect(comments).toHaveLength(1);
      expect(comments[0].content).toBe('Comment on highlighted text');
    });

    it('should throw error when text is empty', () => {
      const store = useStore.getState();

      expect(() => {
        store.handleAddCommentAction({
          text: '',
        });
      }).toThrow('Comment text is required');
    });

    it('should throw error when text is not a string', () => {
      const store = useStore.getState();

      expect(() => {
        store.handleAddCommentAction({
          text: 123 as any,
        });
      }).toThrow('Comment text is required');
    });
  });

  describe('handleAddSummaryCommentAction', () => {
    it('should add a new summary comment', () => {
      const store = useStore.getState();

      act(() => {
        store.handleAddSummaryCommentAction({
          text: 'This is a summary comment',
        });
      });

      const summaryComment = useStore.getState().summaryComment;
      expect(summaryComment).toBe('This is a summary comment');
    });

    it('should append to existing summary comment', () => {
      useStore.setState({ summaryComment: 'Existing comment' });
      const store = useStore.getState();

      act(() => {
        store.handleAddSummaryCommentAction({
          text: 'Additional comment',
        });
      });

      const summaryComment = useStore.getState().summaryComment;
      expect(summaryComment).toBe('Existing comment\n\nAdditional comment');
    });

    it('should navigate to Feedback tab and Summary subtab', () => {
      const store = useStore.getState();

      act(() => {
        store.handleAddSummaryCommentAction({
          text: 'Test summary',
        });
      });

      const state = useStore.getState();
      expect(state.tabState.primaryTab).toBe('Feedback');
      expect(state.tabState.secondaryTab).toBe('Summary');
    });

    it('should throw error when text is empty', () => {
      const store = useStore.getState();

      expect(() => {
        store.handleAddSummaryCommentAction({
          text: '',
        });
      }).toThrow('Summary comment text is required');
    });

    it('should throw error when text is not a string', () => {
      const store = useStore.getState();

      expect(() => {
        store.handleAddSummaryCommentAction({
          text: null as any,
        });
      }).toThrow('Summary comment text is required');
    });
  });

  describe('handleHighlightTextAction', () => {
    it('should navigate to a match card highlight', () => {
      const store = useStore.getState();

      act(() => {
        store.handleHighlightTextAction({
          matchCardId: 'mc1',
          matchIndex: 0,
        });
      });

      const navigation = useStore.getState().navigation;
      expect(navigation.selectedSourceId).toBe('mc1');
      expect(navigation.selectedMatchIndex).toBe(0);
    });

    it('should navigate to second match in a card', () => {
      const store = useStore.getState();

      act(() => {
        store.handleHighlightTextAction({
          matchCardId: 'mc1',
          matchIndex: 1,
        });
      });

      const navigation = useStore.getState().navigation;
      expect(navigation.selectedSourceId).toBe('mc1');
      expect(navigation.selectedMatchIndex).toBe(1);
    });

    it('should default to matchIndex 0 when not provided', () => {
      const store = useStore.getState();

      act(() => {
        store.handleHighlightTextAction({
          matchCardId: 'mc2',
        });
      });

      const navigation = useStore.getState().navigation;
      expect(navigation.selectedSourceId).toBe('mc2');
      expect(navigation.selectedMatchIndex).toBe(0);
    });

    it('should throw error when matchCardId is missing', () => {
      const store = useStore.getState();

      expect(() => {
        store.handleHighlightTextAction({} as any);
      }).toThrow('Match card ID is required');
    });

    it('should throw error for non-existent match card', () => {
      const store = useStore.getState();

      expect(() => {
        store.handleHighlightTextAction({
          matchCardId: 'non-existent',
        });
      }).toThrow('not found');
    });

    it('should throw error for invalid match index', () => {
      const store = useStore.getState();

      expect(() => {
        store.handleHighlightTextAction({
          matchCardId: 'mc1',
          matchIndex: 10,
        });
      }).toThrow('Invalid match index');
    });

    it('should throw error for negative match index', () => {
      const store = useStore.getState();

      expect(() => {
        store.handleHighlightTextAction({
          matchCardId: 'mc1',
          matchIndex: -1,
        });
      }).toThrow('Invalid match index');
    });
  });

  describe('handleShowSourceAction', () => {
    it('should navigate to and expand a match card', () => {
      const store = useStore.getState();

      act(() => {
        store.handleShowSourceAction({
          matchCardId: 'mc1',
        });
      });

      const navigation = useStore.getState().navigation;
      expect(navigation.selectedSourceId).toBe('mc1');
      expect(navigation.selectedMatchIndex).toBe(0);
    });

    it('should throw error when matchCardId is missing', () => {
      const store = useStore.getState();

      expect(() => {
        store.handleShowSourceAction({} as any);
      }).toThrow('Match card ID is required');
    });

    it('should throw error for non-existent match card', () => {
      const store = useStore.getState();

      expect(() => {
        store.handleShowSourceAction({
          matchCardId: 'non-existent',
        });
      }).toThrow('not found');
    });
  });

  describe('Type coercion and validation', () => {
    it('should handle numeric strings for page numbers', () => {
      const store = useStore.getState();

      act(() => {
        store.handleAddCommentAction({
          text: 'Test comment',
          page: '3' as any, // Passing string instead of number
        });
      });

      const comments = useStore.getState().comments;
      expect(comments[0].page).toBe(3);
      expect(typeof comments[0].page).toBe('number');
    });

    it('should handle various falsy values for optional parameters', () => {
      const store = useStore.getState();

      act(() => {
        store.handleAddCommentAction({
          text: 'Test comment',
          page: undefined,
          highlightId: undefined,
        });
      });

      const comments = useStore.getState().comments;
      expect(comments[0].page).toBe(1); // Should default to 1
    });
  });

  describe('Edge cases', () => {
    it('should trim whitespace from comment text', () => {
      const store = useStore.getState();

      act(() => {
        store.handleAddCommentAction({
          text: '  Comment with whitespace  ',
        });
      });

      const comments = useStore.getState().comments;
      expect(comments[0].content).toBe('Comment with whitespace');
    });

    it('should trim whitespace from summary comment', () => {
      const store = useStore.getState();

      act(() => {
        store.handleAddSummaryCommentAction({
          text: '  Summary with whitespace  ',
        });
      });

      const summaryComment = useStore.getState().summaryComment;
      expect(summaryComment).toBe('Summary with whitespace');
    });

    it('should handle match card with no matches', () => {
      useStore.setState({
        matchCards: [
          {
            id: 'mc-empty',
            matches: [],
          },
        ],
      });

      const store = useStore.getState();

      expect(() => {
        store.handleHighlightTextAction({
          matchCardId: 'mc-empty',
          matchIndex: 0,
        });
      }).toThrow('Invalid match index');
    });
  });
});
