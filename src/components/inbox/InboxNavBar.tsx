import React from 'react';
import { ChatButton } from '../chatbot/ChatButton';
import type { ScreenContext } from '../../store';

type InboxNavBarProps = {
  title: 'My Files' | 'Shared with Me' | 'Trash' | 'Settings' | 'Submissions';
  onSearchChange?: (value: string) => void;
  screen?: ScreenContext;
};

export const InboxNavBar: React.FC<InboxNavBarProps> = ({ title, onSearchChange, screen = 'inbox' }) => {
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between w-full h-16 px-6 border-b border-gray-200 bg-white">
      {/* Title */}
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>

      {/* Right Side: Chat + Search + Help */}
      <div className="flex items-center gap-4">
        {/* AI Chat Button */}
        <ChatButton screen={screen} />

        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by title or author"
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>

        {/* Help */}
        <button className="flex items-center gap-1 text-sm text-gray-700 hover:text-blue-600">
          <span className="text-lg">❓</span>
          <span>Help</span>
        </button>
      </div>
    </div>
  );
};
