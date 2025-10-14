import type { DocumentData } from '../../types';
import { useStore } from '../../store';
import { useState } from 'react';
import { DataManagementModal } from '../settings/DataManagementModal';
import { ChatButton } from '../chatbot/ChatButton';
import { PrototypeControls } from '../settings/PrototypeControls';

interface DocumentHeaderProps {
  doc: DocumentData;
  useSerifFont: boolean;
  onToggleSerifFont: () => void;
}

export function DocumentHeader({ doc, useSerifFont, onToggleSerifFont }: DocumentHeaderProps) {
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  return (
    <>
      {/* Top Header Bar */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between relative">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src="/logo.svg"
            alt="iThenticate"
            className="h-9 w-auto select-none"
            draggable={false}
          />
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
          <div className="font-semibold text-sm text-gray-900">{doc.author}</div>
          <div className="text-xs text-gray-600">{doc.title}</div>
        </div>
        <div className="flex items-center gap-4 text-gray-500">
          <ChatButton screen="document-viewer" />
          <button title="Download" className="hover:text-gray-700">⬇️</button>
          <button title="Details" className="hover:text-gray-700">ℹ️</button>
          <button title="Help" className="hover:text-gray-700">❓</button>
        </div>
      </div>

      {/* Prototype Controls */}
      <PrototypeControls>
        {/* Document-specific controls */}
        <button
          onClick={onToggleSerifFont}
          className="block w-full text-left text-sm px-2 py-1 rounded bg-gray-800 text-white hover:bg-gray-700"
        >
          Font: {useSerifFont ? "Serif" : "Sans Serif"}
        </button>
        <button
          onClick={() => setIsDataModalOpen(true)}
          className="block w-full text-left text-sm px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700"
        >
          📊 Manage Data...
        </button>
      </PrototypeControls>
      
      {/* Data Management Modal */}
      <DataManagementModal 
        isOpen={isDataModalOpen} 
        onClose={() => setIsDataModalOpen(false)} 
      />
    </>
  );
}
