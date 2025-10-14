import { useFeatureFlagManager } from '../../hooks/useFeatureFlag';
import { groupFeaturesByCategory } from '../../types/featureFlags';
import { useStore } from '../../store';

/**
 * Feature Flags Panel Component
 * 
 * Provides a user interface for managing experimental features.
 * Features are organized by category with toggle switches and descriptions.
 */
export function FeatureFlagsPanel() {
  const { allFlags, toggleFeatureFlag, resetFeatureFlags } = useFeatureFlagManager();
  const reusableComments = useStore((state) => state.reusableComments);
  
  const groupedFlags = groupFeaturesByCategory(allFlags);
  const categories = Object.keys(groupedFlags).sort();

  const showReusableCommentsDebug = () => {
    const userComments = reusableComments.comments.filter(c => c.source === 'user');
    const systemComments = reusableComments.comments.filter(c => c.source === 'system');
    console.log('🔍 REUSABLE COMMENTS DEBUG:');
    console.log(`Total: ${reusableComments.comments.length}, User: ${userComments.length}, System: ${systemComments.length}`);
    console.log('User comments:', userComments);
    console.log('System comments (first 5):', systemComments.slice(0, 5));
    alert(`Reusable Comments: ${reusableComments.comments.length} total (${userComments.length} user, ${systemComments.length} system). Check console for details.`);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'alpha': return 'bg-red-100 text-red-800';
      case 'beta': return 'bg-yellow-100 text-yellow-800';
      case 'stable': return 'bg-green-100 text-green-800';
      case 'deprecated': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'comments': return '💬';
      case 'grading': return '📝';
      case 'ui': return '🎨';
      case 'navigation': return '🧭';
      case 'experimental': return '🧪';
      default: return '⚙️';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Feature Flags</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage experimental features and toggle functionality for testing
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={showReusableCommentsDebug}
            className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 transition-colors"
          >
            Debug Comments
          </button>
          <button
            onClick={resetFeatureFlags}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
          >
            Reset All
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {categories.map(category => (
          <div key={category} className="border-l-4 border-gray-200 pl-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">{getCategoryIcon(category)}</span>
              <h3 className="text-lg font-medium text-gray-900 capitalize">
                {category}
              </h3>
              <span className="text-sm text-gray-500">
                ({groupedFlags[category].length} feature{groupedFlags[category].length !== 1 ? 's' : ''})
              </span>
            </div>
            
            <div className="space-y-4">
              {groupedFlags[category].map(flag => (
                <div
                  key={flag.id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-base font-medium text-gray-900">
                        {flag.name}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(flag.status)}`}>
                        {flag.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {flag.description}
                    </p>
                    
                    {flag.notes && (
                      <p className="text-xs text-gray-500 italic">
                        Note: {flag.notes}
                      </p>
                    )}
                    
                    <div className="mt-2 text-xs text-gray-400">
                      Added: {new Date(flag.addedDate).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="ml-4 flex-shrink-0">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={flag.enabled}
                        onChange={() => toggleFeatureFlag(flag.id as any)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ml-3 text-sm text-gray-700 font-medium">
                        {flag.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          <p className="mb-2">
            <strong>Status Levels:</strong>
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                alpha
              </span>
              <span className="text-xs">Early development</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                beta
              </span>
              <span className="text-xs">Testing phase</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                stable
              </span>
              <span className="text-xs">Production ready</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                deprecated
              </span>
              <span className="text-xs">Being removed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}