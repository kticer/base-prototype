import { useStore } from '../store';
import { act, renderHook } from '@testing-library/react';

describe('Zustand Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useStore.getState().clearSelection();
    useStore.setState({
      navigation: {
        selectedSourceId: null,
        selectedMatchIndex: 0,
        selectedHighlightId: null,
        navigationSource: null,
        chatReferencedHighlightId: null,
      },
      tabState: {
        primaryTab: "Similarity",
        secondaryTab: "Match Groups",
        showSimilarityHighlights: true,
      },
      hoveredHighlightId: null,
      excludedSourceIds: new Set(),
      highlightColors: {},
      selectedCommentId: null,
      sidebarVisible: true,
      matchCards: [],
      comments: [],
    });
  });

  describe('Navigation State', () => {
    it('should initialize with default navigation state', () => {
      const { result } = renderHook(() => useStore());
      
      expect(result.current.navigation.selectedSourceId).toBe(null);
      expect(result.current.navigation.selectedMatchIndex).toBe(0);
      expect(result.current.navigation.selectedHighlightId).toBe(null);
      expect(result.current.navigation.navigationSource).toBe(null);
    });

    it('should update navigation state with setNavigation', () => {
      const { result } = renderHook(() => useStore());
      
      act(() => {
        result.current.setNavigation({
          selectedSourceId: 'test-source',
          selectedMatchIndex: 1,
          navigationSource: 'card'
        });
      });

      expect(result.current.navigation.selectedSourceId).toBe('test-source');
      expect(result.current.navigation.selectedMatchIndex).toBe(1);
      expect(result.current.navigation.navigationSource).toBe('card');
    });

    it('should select match with selectMatch action', () => {
      const { result } = renderHook(() => useStore());
      
      // Setup test data
      act(() => {
        result.current.matchCards = [
          { id: 'mc1', matches: [{ highlightId: 'h1' }, { highlightId: 'h2' }] },
          { id: 'mc2', matches: [{ highlightId: 'h3' }] }
        ];
      });

      act(() => {
        result.current.selectMatch('mc1', 1, 'highlight');
      });

      expect(result.current.navigation.selectedSourceId).toBe('mc1');
      expect(result.current.navigation.selectedMatchIndex).toBe(1);
      expect(result.current.navigation.selectedHighlightId).toBe('h2');
      expect(result.current.navigation.navigationSource).toBe('highlight');
    });

    it('should clear selection with clearSelection action', () => {
      const { result } = renderHook(() => useStore());
      
      // First set some selection
      act(() => {
        result.current.setNavigation({
          selectedSourceId: 'test-source',
          selectedMatchIndex: 2,
          navigationSource: 'card'
        });
      });

      // Then clear it
      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.navigation.selectedSourceId).toBe(null);
      expect(result.current.navigation.selectedMatchIndex).toBe(0);
      expect(result.current.navigation.selectedHighlightId).toBe(null);
      expect(result.current.navigation.navigationSource).toBe(null);
    });
  });

  describe('Tab State', () => {
    it('should initialize with default tab state', () => {
      const { result } = renderHook(() => useStore());
      
      expect(result.current.tabState.primaryTab).toBe('Similarity');
      expect(result.current.tabState.secondaryTab).toBe('Match Groups');
      expect(result.current.tabState.showSimilarityHighlights).toBe(true);
    });

    it('should update tab state with setTabState', () => {
      const { result } = renderHook(() => useStore());
      
      act(() => {
        result.current.setTabState({
          primaryTab: 'Feedback',
          secondaryTab: 'QuickMarks',
          showSimilarityHighlights: false
        });
      });

      expect(result.current.tabState.primaryTab).toBe('Feedback');
      expect(result.current.tabState.secondaryTab).toBe('QuickMarks');
      expect(result.current.tabState.showSimilarityHighlights).toBe(false);
    });
  });

  describe('Source Inclusion/Exclusion', () => {
    it('should toggle source inclusion', () => {
      const { result } = renderHook(() => useStore());
      
      // Initially no sources are excluded
      expect(result.current.excludedSourceIds.size).toBe(0);

      // Exclude a source
      act(() => {
        result.current.toggleSourceInclusion('source1');
      });

      expect(result.current.excludedSourceIds.has('source1')).toBe(true);
      expect(result.current.excludedSourceIds.size).toBe(1);

      // Include it back
      act(() => {
        result.current.toggleSourceInclusion('source1');
      });

      expect(result.current.excludedSourceIds.has('source1')).toBe(false);
      expect(result.current.excludedSourceIds.size).toBe(0);
    });

    it('should handle multiple excluded sources', () => {
      const { result } = renderHook(() => useStore());
      
      act(() => {
        result.current.toggleSourceInclusion('source1');
        result.current.toggleSourceInclusion('source2');
        result.current.toggleSourceInclusion('source3');
      });

      expect(result.current.excludedSourceIds.size).toBe(3);
      expect(result.current.excludedSourceIds.has('source1')).toBe(true);
      expect(result.current.excludedSourceIds.has('source2')).toBe(true);
      expect(result.current.excludedSourceIds.has('source3')).toBe(true);
    });
  });

  describe('Color Assignment', () => {
    it('should assign colors to match card IDs', () => {
      const { result } = renderHook(() => useStore());
      
      const cardIds = ['mc1', 'mc2', 'mc3'];
      
      act(() => {
        result.current.assignColors(cardIds);
      });

      expect(Object.keys(result.current.highlightColors)).toHaveLength(3);
      expect(result.current.highlightColors['mc1']).toBeDefined();
      expect(result.current.highlightColors['mc2']).toBeDefined();
      expect(result.current.highlightColors['mc3']).toBeDefined();
      
      // Colors should be from the predefined COLORS array
      const assignedColors = Object.values(result.current.highlightColors);
      assignedColors.forEach(color => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    it('should cycle through colors for many cards', () => {
      const { result } = renderHook(() => useStore());
      
      const cardIds = ['mc1', 'mc2', 'mc3', 'mc4', 'mc5', 'mc6', 'mc7'];
      
      act(() => {
        result.current.assignColors(cardIds);
      });

      expect(Object.keys(result.current.highlightColors)).toHaveLength(7);
      
      // First and sixth cards should have the same color (cycling)
      expect(result.current.highlightColors['mc1']).toBe(result.current.highlightColors['mc6']);
    });
  });

  describe('Hover State', () => {
    it('should set and clear hover state', () => {
      const { result } = renderHook(() => useStore());
      
      expect(result.current.hoveredHighlightId).toBe(null);

      act(() => {
        result.current.hoverHighlight('h1');
      });

      expect(result.current.hoveredHighlightId).toBe('h1');

      act(() => {
        result.current.hoverHighlight(null);
      });

      expect(result.current.hoveredHighlightId).toBe(null);
    });
  });

  describe('Comment Management', () => {
    it('should add a comment', () => {
      const { result } = renderHook(() => useStore());
      
      const newComment = {
        id: 'comment-1',
        type: 'Feedback',
        content: 'Test comment',
        text: 'selected text',
        position: 100,
        page: 1,
        startOffset: 0,
        endOffset: 10,
      };

      act(() => {
        result.current.addComment(newComment);
      });

      expect(result.current.comments).toHaveLength(1);
      expect(result.current.comments[0]).toMatchObject(newComment);
      expect(result.current.comments[0].createdAt).toBeDefined();
      expect(result.current.comments[0].updatedAt).toBeDefined();
    });

    it('should generate ID for comment if not provided', () => {
      const { result } = renderHook(() => useStore());
      
      const newComment = {
        type: 'Feedback',
        content: 'Test comment',
        text: 'selected text',
        position: 100,
        page: 1,
        startOffset: 0,
        endOffset: 10,
      };

      act(() => {
        result.current.addComment(newComment as Parameters<typeof result.current.addComment>[0]);
      });

      expect(result.current.comments[0].id).toBeDefined();
      expect(result.current.comments[0].id).not.toBe('');
    });

    it('should update a comment', async () => {
      const { result } = renderHook(() => useStore());
      
      // Add a comment first
      act(() => {
        result.current.addComment({
          id: 'comment-1',
          type: 'Feedback',
          content: 'Original content',
          text: 'selected text',
          position: 100,
          page: 1,
          startOffset: 0,
          endOffset: 10,
        });
      });

      const originalUpdatedAt = result.current.comments[0].updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Update the comment
      act(() => {
        result.current.updateComment('comment-1', {
          content: 'Updated content'
        });
      });

      expect(result.current.comments[0].content).toBe('Updated content');
      expect(result.current.comments[0].updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should delete a comment', () => {
      const { result } = renderHook(() => useStore());
      
      // Add comments
      act(() => {
        result.current.addComment({
          id: 'comment-1',
          type: 'Feedback',
          content: 'Comment 1',
          text: 'selected text',
          position: 100,
          page: 1,
          startOffset: 0,
          endOffset: 10,
        });
        result.current.addComment({
          id: 'comment-2',
          type: 'Feedback',
          content: 'Comment 2',
          text: 'selected text',
          position: 200,
          page: 1,
          startOffset: 20,
          endOffset: 30,
        });
      });

      expect(result.current.comments).toHaveLength(2);

      // Delete one comment
      act(() => {
        result.current.deleteComment('comment-1');
      });

      expect(result.current.comments).toHaveLength(1);
      expect(result.current.comments[0].id).toBe('comment-2');
    });

    it('should clear selected comment when deleting it', () => {
      const { result } = renderHook(() => useStore());
      
      // Add and select a comment
      act(() => {
        result.current.addComment({
          id: 'comment-1',
          type: 'Feedback',
          content: 'Comment 1',
          text: 'selected text',
          position: 100,
          page: 1,
          startOffset: 0,
          endOffset: 10,
        });
        result.current.selectComment('comment-1');
      });

      expect(result.current.selectedCommentId).toBe('comment-1');

      // Delete the selected comment
      act(() => {
        result.current.deleteComment('comment-1');
      });

      expect(result.current.selectedCommentId).toBe(null);
    });
  });

  describe('Sidebar State', () => {
    it('should toggle sidebar visibility', () => {
      const { result } = renderHook(() => useStore());
      
      expect(result.current.sidebarVisible).toBe(true);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.sidebarVisible).toBe(false);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.sidebarVisible).toBe(true);
    });

    it('should set sidebar visibility directly', () => {
      const { result } = renderHook(() => useStore());
      
      act(() => {
        result.current.setSidebarVisible(false);
      });

      expect(result.current.sidebarVisible).toBe(false);

      act(() => {
        result.current.setSidebarVisible(true);
      });

      expect(result.current.sidebarVisible).toBe(true);
    });
  });
});