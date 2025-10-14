import React from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';

interface StrikethroughDeletePopupProps {
  position: { x: number; y: number };
  onDelete: () => void;
  onCancel: () => void;
}

export function StrikethroughDeletePopup({ position, onDelete, onCancel }: StrikethroughDeletePopupProps) {
  return (
    <div
      data-testid="strikethrough-delete-popup"
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2"
      style={{
        left: `${position.x - 20}px`, // Center the popup horizontally
        top: `${position.y}px`,
      }}
    >
      <button
        onClick={onDelete}
        className="flex items-center justify-center w-8 h-8 text-red-600 hover:bg-red-50 rounded transition-colors"
        title="Remove strikethrough"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  );
}