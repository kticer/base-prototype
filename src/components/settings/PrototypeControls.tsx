import { useStore } from '../../store';

interface PrototypeControlsProps {
  /** Additional controls specific to the page */
  children?: React.ReactNode;
  /** Position class override */
  className?: string;
}

export function PrototypeControls({ children, className = 'fixed top-2 right-4' }: PrototypeControlsProps) {
  const { toggleFeatureFlagsPanel, chat, setChatDisplayMode, comments, pointAnnotations } = useStore();

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

  const clearChat = () => {
    const currentScreen = useStore.getState().chat.currentScreen;
    if (!currentScreen) {
      alert('Chat is not open for any screen.');
      return;
    }
    const messages = useStore.getState().chat.conversations[currentScreen]?.messages || [];
    if (messages.length === 0) {
      alert('No chat history to clear for this screen.');
      return;
    }
    const ok = window.confirm(`Clear chat history for ${currentScreen}?`);
    if (ok) {
      useStore.getState().clearChatHistory(currentScreen);
    }
  };

  return (
    <div className={`${className} text-xs`} style={{ zIndex: 1001 }}>
      <details className="relative group">
        <summary className="cursor-pointer underline text-gray-800 bg-white px-2 py-1 rounded border border-gray-300 shadow hover:bg-gray-100">
          Prototype Controls
        </summary>
        <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-300 rounded shadow-lg p-2 space-y-1" style={{ zIndex: 1002 }}>
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

          {/* Clear annotations */}
          <button
            onClick={clearAnnotations}
            className="block w-full text-left text-sm px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
          >
            🗑️ Clear Annotations
          </button>

          {/* Clear chat history */}
          <button
            onClick={clearChat}
            className="block w-full text-left text-sm px-2 py-1 rounded bg-gray-700 text-white hover:bg-gray-800"
          >
            🧹 Clear Chat History
          </button>

          {/* Additional page-specific controls */}
          {children}
        </div>
      </details>
    </div>
  );
}
