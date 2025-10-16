import { renderHook, act } from '@testing-library/react';
import { useNavigation, useHighlightSelection } from '../../hooks/useNavigation';
import { useStore } from '../../store';

describe('useNavigation Hook', () => {
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
      matchCards: [],
    });
  });

  it('should return current navigation state', () => {
    const { result } = renderHook(() => useNavigation());
    
    expect(result.current.selectedSourceId).toBe(null);
    expect(result.current.selectedMatchIndex).toBe(0);
    expect(result.current.selectedHighlightId).toBe(null);
    expect(result.current.navigationSource).toBe(null);
  });

  it('should provide navigation actions', () => {
    const { result } = renderHook(() => useNavigation());
    
    expect(typeof result.current.goToMatch).toBe('function');
    expect(typeof result.current.clearMatch).toBe('function');
    expect(typeof result.current.selectHighlight).toBe('function');
    expect(typeof result.current.isSelected).toBe('function');
  });

  it('should update navigation through goToMatch', () => {
    const { result } = renderHook(() => useNavigation());
    
    act(() => {
      result.current.goToMatch('test-source', 2, 'card');
    });

    expect(result.current.selectedSourceId).toBe('test-source');
    expect(result.current.selectedMatchIndex).toBe(2);
    expect(result.current.navigationSource).toBe('card');
  });

  it('should select match with proper highlight resolution', () => {
    const { result } = renderHook(() => useNavigation());
    
    // Setup test match cards in store
    act(() => {
      useStore.setState({
        matchCards: [
          { 
            id: 'mc1', 
            matches: [
              { highlightId: 'h1' }, 
              { highlightId: 'h2' },
              { highlightId: 'h3' }
            ] 
          },
          { 
            id: 'mc2', 
            matches: [
              { highlightId: 'h4' }
            ] 
          }
        ]
      });
    });

    act(() => {
      result.current.selectHighlight('mc1', 1);
    });

    expect(result.current.selectedSourceId).toBe('mc1');
    expect(result.current.selectedMatchIndex).toBe(1);
    expect(result.current.selectedHighlightId).toBe('h2');
    expect(result.current.navigationSource).toBe('highlight');
  });

  it('should handle match selection with invalid index', () => {
    const { result } = renderHook(() => useNavigation());
    
    // Setup test match cards in store
    act(() => {
      useStore.setState({
        matchCards: [
          { 
            id: 'mc1', 
            matches: [
              { highlightId: 'h1' }, 
              { highlightId: 'h2' }
            ] 
          }
        ]
      });
    });

    // Try to select index that doesn't exist
    act(() => {
      result.current.goToMatch('mc1', 5, 'card');
    });

    expect(result.current.selectedSourceId).toBe('mc1');
    expect(result.current.selectedMatchIndex).toBe(5);
    expect(result.current.selectedHighlightId).toBe(null); // Should be null for invalid index
  });

  it('should handle match selection with non-existent card', () => {
    const { result } = renderHook(() => useNavigation());
    
    // Setup test match cards in store (no mc-nonexistent)
    act(() => {
      useStore.setState({
        matchCards: [
          { 
            id: 'mc1', 
            matches: [{ highlightId: 'h1' }] 
          }
        ]
      });
    });

    act(() => {
      result.current.goToMatch('mc-nonexistent', 0, 'card');
    });

    expect(result.current.selectedSourceId).toBe('mc-nonexistent');
    expect(result.current.selectedMatchIndex).toBe(0);
    expect(result.current.selectedHighlightId).toBe(null);
  });

  it('should clear selection properly', () => {
    const { result } = renderHook(() => useNavigation());
    
    // First set some selection
    act(() => {
      result.current.goToMatch('test-source', 3, 'card');
    });

    // Verify it's set
    expect(result.current.selectedSourceId).toBe('test-source');
    expect(result.current.selectedMatchIndex).toBe(3);

    // Clear selection
    act(() => {
      result.current.clearMatch();
    });

    expect(result.current.selectedSourceId).toBe(null);
    expect(result.current.selectedMatchIndex).toBe(0);
    expect(result.current.selectedHighlightId).toBe(null);
    expect(result.current.navigationSource).toBe(null);
  });

  it('should maintain reference stability for actions', () => {
    const { result, rerender } = renderHook(() => useNavigation());
    
    const initialGoToMatch = result.current.goToMatch;
    const initialSelectHighlight = result.current.selectHighlight;
    const initialClearMatch = result.current.clearMatch;

    // Re-render the hook
    rerender();

    // Actions should be the same reference (stable)
    expect(result.current.goToMatch).toBe(initialGoToMatch);
    expect(result.current.selectHighlight).toBe(initialSelectHighlight);
    expect(result.current.clearMatch).toBe(initialClearMatch);
  });

  it('should react to external store changes', () => {
    const { result } = renderHook(() => useNavigation());
    
    // Change store state externally
    act(() => {
      useStore.getState().setNavigation({
        selectedSourceId: 'external-change',
        selectedMatchIndex: 4,
        navigationSource: 'highlight'
      });
    });

    // Hook should reflect the change
    expect(result.current.selectedSourceId).toBe('external-change');
    expect(result.current.selectedMatchIndex).toBe(4);
    expect(result.current.navigationSource).toBe('highlight');
  });
});

describe('useHighlightSelection Hook', () => {
  beforeEach(() => {
    // Reset store state before each test
    useStore.getState().clearSelection();
  });

  it('should return selection state and click handler', () => {
    const { result } = renderHook(() => useHighlightSelection('mc1', 0));
    
    expect(typeof result.current.isSelected).toBe('boolean');
    expect(typeof result.current.onClick).toBe('function');
  });

  it('should return false when not selected', () => {
    const { result } = renderHook(() => useHighlightSelection('mc1', 0));
    
    expect(result.current.isSelected).toBe(false);
  });

  it('should return true when selected', () => {
    // Set up selection
    act(() => {
      useStore.getState().selectMatch('mc1', 2, 'highlight');
    });

    const { result } = renderHook(() => useHighlightSelection('mc1', 2));
    
    expect(result.current.isSelected).toBe(true);
  });

  it('should handle click to select highlight', () => {
    const { result } = renderHook(() => useHighlightSelection('mc1', 1));
    
    act(() => {
      result.current.onClick();
    });

    const navigation = useStore.getState().navigation;
    expect(navigation.selectedSourceId).toBe('mc1');
    expect(navigation.selectedMatchIndex).toBe(1);
    expect(navigation.navigationSource).toBe('highlight');
  });

  it('should maintain stable onClick reference', () => {
    const { result, rerender } = renderHook(() => useHighlightSelection('mc1', 1));
    
    const initialOnClick = result.current.onClick;
    rerender();
    
    expect(result.current.onClick).toBe(initialOnClick);
  });
});