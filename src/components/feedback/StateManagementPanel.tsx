import { useState, useRef } from "react";
import { 
  ArrowDownTrayIcon, 
  ArrowUpTrayIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";
import { useStore } from "../../store";

export function StateManagementPanel() {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showToast, setShowToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const currentDocumentId = useStore((state) => state.currentDocumentId);
  const exportUserState = useStore((state) => state.exportUserState);
  const importUserState = useStore((state) => state.importUserState);
  const resetToDefault = useStore((state) => state.resetToDefault);
  const comments = useStore((state) => state.comments);
  const customHighlights = useStore((state) => state.customHighlights);
  const summaryComment = useStore((state) => state.summaryComment);
  const gradingCriteria = useStore((state) => state.gradingCriteria);

  // Calculate if there's any user content to manage
  const hasUserContent = comments.length > 0 || 
                         customHighlights.length > 0 || 
                         summaryComment.trim().length > 0 ||
                         gradingCriteria.some(c => c.score > 0);

  const showToastMessage = (type: 'success' | 'error' | 'info', message: string) => {
    setShowToast({ type, message });
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleExport = () => {
    try {
      const exportData = exportUserState();
      if (!exportData) {
        showToastMessage('info', 'No user data to export');
        return;
      }

      // Create and download file
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentDocumentId || 'document'}-user-data.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToastMessage('success', 'User data exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      showToastMessage('error', 'Failed to export user data');
    }
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string;
        if (!jsonData) {
          showToastMessage('error', 'Failed to read file');
          return;
        }

        importUserState(jsonData);
        showToastMessage('success', 'User data imported successfully');
      } catch (error) {
        console.error('Import failed:', error);
        showToastMessage('error', 'Failed to import user data - invalid file format');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  };

  const handleReset = () => {
    if (!currentDocumentId) {
      showToastMessage('error', 'No document loaded');
      return;
    }

    try {
      resetToDefault(currentDocumentId);
      setShowResetConfirm(false);
      showToastMessage('success', 'Document reset to pristine state');
    } catch (error) {
      console.error('Reset failed:', error);
      showToastMessage('error', 'Failed to reset document');
    }
  };

  const getContentSummary = () => {
    const items = [];
    if (comments.length > 0) items.push(`${comments.length} comment${comments.length === 1 ? '' : 's'}`);
    if (customHighlights.length > 0) items.push(`${customHighlights.length} highlight${customHighlights.length === 1 ? '' : 's'}`);
    if (summaryComment.trim().length > 0) items.push('summary feedback');
    if (gradingCriteria.some(c => c.score > 0)) items.push('grading scores');
    
    return items.length > 0 ? items.join(', ') : 'No user content';
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-gray-700 px-3">Document State</div>
      
      {/* Content Summary */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <InformationCircleIcon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Current Content</div>
            <div className="text-xs text-gray-600">{getContentSummary()}</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleExport}
          disabled={!hasUserContent}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          Export User Data
        </button>

        <button
          onClick={handleImport}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowUpTrayIcon className="w-4 h-4" />
          Import User Data
        </button>

        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={!hasUserContent}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Reset to Pristine State
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Confirm Reset</span>
            </div>
            <p className="text-xs text-red-700 mb-3">
              This will permanently delete all your comments, highlights, summary feedback, and grading scores. This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Toast notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
            showToast.type === 'success' ? 'bg-green-600 text-white' :
            showToast.type === 'error' ? 'bg-red-600 text-white' :
            'bg-blue-600 text-white'
          }`}>
            {showToast.type === 'success' && <CheckCircleIcon className="w-5 h-5" />}
            {showToast.type === 'error' && <ExclamationTriangleIcon className="w-5 h-5" />}
            {showToast.type === 'info' && <InformationCircleIcon className="w-5 h-5" />}
            <span className="text-sm font-medium">{showToast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}