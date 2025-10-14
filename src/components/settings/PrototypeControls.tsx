import { useStore } from '../../store';

interface PrototypeControlsProps {
  /** Additional controls specific to the page */
  children?: React.ReactNode;
  /** Position class override */
  className?: string;
}

export function PrototypeControls({ children, className = 'absolute top-2 right-4' }: PrototypeControlsProps) {
  const { toggleFeatureFlagsPanel, chat, setChatDisplayMode } = useStore();

  return (
    <div className={`${className} z-50 text-xs`}>
      <details className="relative group">
        <summary className="cursor-pointer underline text-gray-800 bg-white px-2 py-1 rounded border border-gray-300 shadow hover:bg-gray-100">
          Prototype Controls
        </summary>
        <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-300 rounded shadow-lg p-2 space-y-1">
          {/* Chat display mode toggle */}
          <button
            onClick={() => setChatDisplayMode(chat.displayMode === 'overlay' ? 'shrink' : 'overlay')}
            className="block w-full text-left text-sm px-2 py-1 rounded bg-purple-600 text-white hover:bg-purple-700"
          >
            Chat: {chat.displayMode === 'overlay' ? 'Overlay' : 'Shrink Content'}
          </button>

          {/* Feature flags */}
          <button
            onClick={toggleFeatureFlagsPanel}
            className="block w-full text-left text-sm px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            🏴 Feature Flags
          </button>

          {/* Additional page-specific controls */}
          {children}
        </div>
      </details>
    </div>
  );
}
