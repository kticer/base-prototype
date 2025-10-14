import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

export interface ActionItem {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

interface FloatingActionBarProps {
  position: { x: number; y: number };
  actions: ActionItem[];
  onDismiss: () => void;
}

export function FloatingActionBar({
  position,
  actions,
  onDismiss,
}: FloatingActionBarProps) {
  const actionBarRef = useRef<HTMLDivElement>(null);

  // Handle click outside to dismiss
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        actionBarRef.current &&
        !actionBarRef.current.contains(event.target as Node)
      ) {
        onDismiss();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onDismiss]);

  return (
    <div
      ref={actionBarRef}
      className="absolute z-50 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center p-1"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 48}px`, // Position above the selected text
      }}
    >
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={action.onClick}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={action.label}
          disabled={action.disabled}
        >
          {action.icon}
        </button>
      ))}
    </div>
  );
}