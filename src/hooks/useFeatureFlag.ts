import { useStore } from '../store';
import type { FeatureFlagId } from '../types/featureFlags';

/**
 * Hook for checking if a feature flag is enabled
 * 
 * @param flagId - The ID of the feature flag to check
 * @returns Boolean indicating if the feature is enabled
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isReusableCommentsEnabled = useFeatureFlag('reusableComments');
 *   
 *   return (
 *     <div>
 *       {isReusableCommentsEnabled && <ReusableCommentsPanel />}
 *       <RegularCommentForm />
 *     </div>
 *   );
 * }
 * ```
 */
export function useFeatureFlag(flagId: FeatureFlagId): boolean {
  return useStore((state) => state.isFeatureEnabled(flagId));
}

/**
 * Hook for accessing multiple feature flags at once
 * 
 * @param flagIds - Array of feature flag IDs to check
 * @returns Object with flag IDs as keys and enabled status as values
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const flags = useFeatureFlags(['reusableComments', 'darkMode']);
 *   
 *   return (
 *     <div className={flags.darkMode ? 'dark' : 'light'}>
 *       {flags.reusableComments && <ReusableCommentsPanel />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFeatureFlags(flagIds: FeatureFlagId[]): Record<FeatureFlagId, boolean> {
  return useStore((state) => {
    const result: Record<FeatureFlagId, boolean> = {} as Record<FeatureFlagId, boolean>;
    flagIds.forEach(flagId => {
      result[flagId] = state.isFeatureEnabled(flagId);
    });
    return result;
  });
}

/**
 * Hook for accessing feature flag management actions
 * 
 * @returns Object with feature flag management functions
 * 
 * @example
 * ```tsx
 * function FeatureFlagSettings() {
 *   const { toggleFeatureFlag, resetFeatureFlags, allFlags } = useFeatureFlagManager();
 *   
 *   return (
 *     <div>
 *       {Object.entries(allFlags).map(([id, flag]) => (
 *         <label key={id}>
 *           <input
 *             type="checkbox"
 *             checked={flag.enabled}
 *             onChange={() => toggleFeatureFlag(id as FeatureFlagId)}
 *           />
 *           {flag.name}
 *         </label>
 *       ))}
 *       <button onClick={resetFeatureFlags}>Reset All</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFeatureFlagManager() {
  const allFlags = useStore((state) => state.featureFlags.flags);
  const toggleFeatureFlag = useStore((state) => state.toggleFeatureFlag);
  const updateFeatureFlag = useStore((state) => state.updateFeatureFlag);
  const resetFeatureFlags = useStore((state) => state.resetFeatureFlags);
  const saveFeatureFlags = useStore((state) => state.saveFeatureFlags);
  const loadFeatureFlags = useStore((state) => state.loadFeatureFlags);
  const isFeatureEnabled = useStore((state) => state.isFeatureEnabled);
  
  return {
    allFlags,
    toggleFeatureFlag,
    updateFeatureFlag,
    resetFeatureFlags,
    saveFeatureFlags,
    loadFeatureFlags,
    isFeatureEnabled,
  };
}