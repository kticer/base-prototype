import { renderHook, act } from '@testing-library/react';
import { useHighlightColor, useAssignColors, useSimilarityScore } from '../../hooks/useMatchInteraction';
import { useStore } from '../../store';

describe('useMatchInteraction Hooks', () => {
  beforeEach(() => {
    // Reset store state before each test
    useStore.setState({
      navigation: {
        selectedSourceId: null,
        selectedMatchIndex: 0,
        selectedHighlightId: null,
        navigationSource: null,
      },
      highlightColors: {},
      excludedSourceIds: new Set(),
      matchCards: [],
    });
  });

  describe('useHighlightColor', () => {
    it('should return color for match card', () => {
      // Setup colors in store
      act(() => {
        useStore.setState({
          highlightColors: {
            'mc1': '#CC1476',
            'mc2': '#225EC7',
          }
        });
      });

      const { result } = renderHook(() => useHighlightColor('mc1'));
      expect(result.current).toBe('#CC1476');
    });

    it('should return fallback color for unknown match card', () => {
      const { result } = renderHook(() => useHighlightColor('unknown'));
      expect(result.current).toBe('#CCCCCC'); // Fallback color
    });

    it('should update when colors change', () => {
      const { result, rerender } = renderHook(() => useHighlightColor('mc1'));
      
      expect(result.current).toBe('#CCCCCC'); // Initial fallback

      // Add color
      act(() => {
        useStore.setState({
          highlightColors: { 'mc1': '#CC1476' }
        });
      });

      rerender();
      expect(result.current).toBe('#CC1476');
    });
  });


  describe('useAssignColors', () => {
    it('should return a function', () => {
      const { result } = renderHook(() => useAssignColors());
      expect(typeof result.current).toBe('function');
    });

    it('should assign colors to match card IDs', () => {
      const { result } = renderHook(() => useAssignColors());
      
      act(() => {
        result.current(['mc1', 'mc2', 'mc3']);
      });

      const colors = useStore.getState().highlightColors;
      expect(Object.keys(colors)).toHaveLength(3);
      expect(colors['mc1']).toBeDefined();
      expect(colors['mc2']).toBeDefined();
      expect(colors['mc3']).toBeDefined();
    });

    it('should use predefined color palette', () => {
      const { result } = renderHook(() => useAssignColors());
      
      act(() => {
        result.current(['mc1', 'mc2']);
      });

      const colors = useStore.getState().highlightColors;
      // Colors should be valid hex codes
      expect(colors['mc1']).toMatch(/^#[0-9A-F]{6}$/i);
      expect(colors['mc2']).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('should cycle through colors for many cards', () => {
      const { result } = renderHook(() => useAssignColors());
      
      act(() => {
        result.current(['mc1', 'mc2', 'mc3', 'mc4', 'mc5', 'mc6']);
      });

      const colors = useStore.getState().highlightColors;
      // First and sixth should have same color (cycling)
      expect(colors['mc1']).toBe(colors['mc6']);
    });

    it('should maintain stable reference', () => {
      const { result, rerender } = renderHook(() => useAssignColors());
      
      const initialFunction = result.current;
      rerender();
      
      expect(result.current).toBe(initialFunction);
    });
  });

  describe('useSimilarityScore', () => {
    const mockMatchCards = [
      { id: 'mc1', similarityPercent: 25, matchedWordCount: 100, sourceType: 'Internet' as const, sourceName: 'Source 1', matches: [] },
      { id: 'mc2', similarityPercent: 15, matchedWordCount: 60, sourceType: 'Publication' as const, sourceName: 'Source 2', matches: [] },
      { id: 'mc3', similarityPercent: 10, matchedWordCount: 40, sourceType: 'Submitted Works' as const, sourceName: 'Source 3', matches: [] },
    ];

    it('should calculate total similarity score', () => {
      const { result } = renderHook(() => useSimilarityScore(mockMatchCards));
      expect(result.current).toBe(50); // 25 + 15 + 10
    });

    it('should exclude cards that are in excludedSourceIds', () => {
      // Exclude mc2
      act(() => {
        useStore.setState({
          excludedSourceIds: new Set(['mc2'])
        });
      });

      const { result } = renderHook(() => useSimilarityScore(mockMatchCards));
      expect(result.current).toBe(35); // 25 + 10 (mc2 excluded)
    });

    it('should return 0 for empty match cards', () => {
      const { result } = renderHook(() => useSimilarityScore([]));
      expect(result.current).toBe(0);
    });

    it('should return 0 when all cards are excluded', () => {
      act(() => {
        useStore.setState({
          excludedSourceIds: new Set(['mc1', 'mc2', 'mc3'])
        });
      });

      const { result } = renderHook(() => useSimilarityScore(mockMatchCards));
      expect(result.current).toBe(0);
    });

    it('should update when exclusions change', () => {
      const { result, rerender } = renderHook(() => useSimilarityScore(mockMatchCards));
      
      expect(result.current).toBe(50);

      // Exclude one card
      act(() => {
        useStore.setState({
          excludedSourceIds: new Set(['mc1'])
        });
      });

      rerender();
      expect(result.current).toBe(25); // 15 + 10
    });

    it('should memoize result for same input', () => {
      const { result, rerender } = renderHook(() => useSimilarityScore(mockMatchCards));
      
      const initialResult = result.current;
      rerender();
      
      // Should be the same reference due to memoization
      expect(result.current).toBe(initialResult);
    });
  });
});