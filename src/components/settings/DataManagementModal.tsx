import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { StateManagementPanel } from '../feedback/StateManagementPanel';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DataManagementModal({ isOpen, onClose }: DataManagementModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Manage Data</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          {/* Content */}
          <div className="px-6 py-4 max-h-[calc(90vh-120px)] overflow-y-auto">
            <StateManagementPanel />
          </div>
        </div>
      </div>
    </div>
  );
}