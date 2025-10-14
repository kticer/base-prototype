import { SparklesIcon } from '@heroicons/react/24/outline';
import { useStore } from '../../store';
import type { ScreenContext } from '../../store';

interface ChatButtonProps {
  screen: ScreenContext;
  className?: string;
}

export function ChatButton({ screen, className = '' }: ChatButtonProps) {
  const { toggleChat } = useStore();

  return (
    <button
      onClick={() => toggleChat(screen)}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors ${className}`}
      title="Open AI Chat"
    >
      <SparklesIcon className="w-5 h-5" />
      <span className="hidden sm:inline">Chat</span>
    </button>
  );
}
