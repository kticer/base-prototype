import { useStore } from '../../store';

interface PrototypeControlsProps {
  /** Additional controls specific to the page */
  children?: React.ReactNode;
  /** Position class override */
  className?: string;
}

export function PrototypeControls({ children, className = 'fixed top-2 right-4' }: PrototypeControlsProps) {
  const { toggleFeatureFlagsPanel, comments, pointAnnotations } = useStore();

  const clearAnnotations = () => {
    const totalAnnotations = comments.length + pointAnnotations.length;
    if (totalAnnotations === 0) {
      alert('No annotations to clear.');
      return;
    }

    const ok = window.confirm(`Clear all ${totalAnnotations} annotations (${comments.length} comments, ${pointAnnotations.length} point annotations)?`);
    if (ok) {
      useStore.setState({
        comments: [],
        pointAnnotations: [],
      });
    }
  };

  return (
    <div className={`${className} text-xs`} style={{ zIndex: 1001 }}>
      <details className="relative group">
        <summary className="cursor-pointer underline text-gray-800 bg-white px-2 py-1 rounded border border-gray-300 shadow hover:bg-gray-100">
          Prototype Controls
        </summary>
        <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-300 rounded shadow-lg p-2 space-y-1" style={{ zIndex: 1002 }}>
          {/* Feature flags */}
          <button
            onClick={toggleFeatureFlagsPanel}
            className="block w-full text-left text-sm px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            🏴 Feature Flags
          </button>

          {/* Clear annotations */}
          <button
            onClick={clearAnnotations}
            className="block w-full text-left text-sm px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
          >
            🗑️ Clear Annotations
          </button>

          {/* Additional page-specific controls */}
          {children}
        </div>
      </details>
    </div>
  );
}
