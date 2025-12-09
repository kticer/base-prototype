import type { DocumentData } from '../../types';
import { useStore } from '../../store';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataManagementModal } from '../settings/DataManagementModal';
import { PrototypeControls } from '../settings/PrototypeControls';
import {
  DownloadIcon,
  SettingsIcon,
  InformationIcon,
  HelpIcon,
  NavigateNextIcon,
  NavigatePreviousIcon,
  ArrowDropDownIcon,
} from './HeaderIcons';

interface DocumentHeaderProps {
  doc: DocumentData;
  useSerifFont: boolean;
  onToggleSerifFont: () => void;
}

export function DocumentHeader({ doc, useSerifFont, onToggleSerifFont }: DocumentHeaderProps) {
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* Top Header Bar - Submission Workspace Header */}
      <div className="bg-surface-variant-1 border-b-2 border-surface-outline px-4 py-2 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center shrink-0">
          <button
            onClick={() => navigate('/')}
            className="hover:opacity-80 transition-opacity"
            title="Go to Inbox"
          >
            <img
              src="/logo.svg"
              alt="iThenticate"
              className="h-10 w-auto select-none"
              draggable={false}
            />
          </button>
        </div>

        {/* Submission Navigation */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Previous Button */}
          <button className="flex items-center justify-center p-2 rounded-lg hover:bg-black/5 transition-colors">
            <NavigatePreviousIcon className="w-6 h-6 text-surface-on-surface" />
          </button>

          {/* Name and Document */}
          <div className="flex flex-col items-center gap-1">
            {/* Name and Dropdown */}
            <div className="flex items-center">
              <div className="flex items-center gap-1 font-sans font-semibold text-body-large text-surface-on-surface whitespace-nowrap">
                <span>1 of 17:</span>
                <span>{doc.author}</span>
              </div>
              <button className="flex items-center justify-center p-2 rounded-lg hover:bg-black/5 transition-colors">
                <ArrowDropDownIcon className="w-6 h-6 text-surface-on-surface" />
              </button>
            </div>
            {/* Document Title */}
            <p className="font-sans text-body-medium text-black whitespace-nowrap max-w-[300px] truncate">
              {doc.title}
            </p>
          </div>

          {/* Next Button */}
          <button className="flex items-center justify-center p-2 rounded-lg hover:bg-black/5 transition-colors">
            <NavigateNextIcon className="w-6 h-6 text-surface-on-surface" />
          </button>
        </div>

        {/* Header Functions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Download */}
          <button className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl hover:bg-black/5 transition-colors">
            <DownloadIcon className="w-5 h-5 text-surface-on-surface-variant-1" />
            <span className="font-sans font-semibold text-label-small text-surface-on-surface-variant-1 leading-4">
              Download
            </span>
          </button>

          {/* Settings */}
          <button
            onClick={() => setIsDataModalOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl hover:bg-black/5 transition-colors"
          >
            <SettingsIcon className="w-5 h-5 text-surface-on-surface-variant-1" />
            <span className="font-sans font-semibold text-label-small text-surface-on-surface-variant-1 leading-4">
              Settings
            </span>
          </button>

          {/* Details */}
          <button className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl hover:bg-black/5 transition-colors">
            <InformationIcon className="w-5 h-5 text-surface-on-surface-variant-1" />
            <span className="font-sans font-semibold text-label-small text-surface-on-surface-variant-1 leading-4">
              Details
            </span>
          </button>

          {/* Help */}
          <button className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl hover:bg-black/5 transition-colors">
            <HelpIcon className="w-5 h-5 text-surface-on-surface-variant-1" />
            <span className="font-sans font-semibold text-label-small text-surface-on-surface-variant-1 leading-4">
              Help
            </span>
          </button>
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
