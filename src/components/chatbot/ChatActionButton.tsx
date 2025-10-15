import type { ChatAction } from '../../utils/chatActions';

interface ChatActionButtonProps {
  action: ChatAction;
  onAction: (action: ChatAction) => void;
  disabled?: boolean;
}

export function ChatActionButton({ action, onAction, disabled = false }: ChatActionButtonProps) {
  const handleClick = () => {
    onAction(action);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded border border-blue-200 hover:border-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title={action.label}
    >
      {action.label}
      <svg
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
  );
}
