import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store";

export default function RubricListPage() {
  const navigate = useNavigate();
  const { rubrics, loadRubrics, deleteRubric, importRubrics } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadRubrics();
  }, [loadRubrics]);

  const handleCreateRubric = () => {
    navigate('/rubrics/create');
  };

  const handleEditRubric = (id: string) => {
    navigate(`/rubrics/edit/${id}`);
  };

  const handleDeleteRubric = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteRubric(id);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const count = importRubrics(text);
      alert(`Successfully imported ${count} rubric(s)!`);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLoadSampleData = async () => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}sample-rubrics.json`);
      if (!response.ok) {
        throw new Error('Failed to load sample data');
      }
      const text = await response.text();
      const count = importRubrics(text);
      alert(`Successfully imported ${count} sample rubric(s)!`);
    } catch (error) {
      console.error('Failed to load sample data:', error);
      alert(`Failed to load sample data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExport = () => {
    try {
      const blob = new Blob([JSON.stringify({ rubrics }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rubrics.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Failed to export rubrics.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRubricTypeLabel = (type: string) => {
    switch (type) {
      case 'weighted':
        return 'Weighted Range Rubric';
      case 'qualitative':
        return 'Qualitative Rubric';
      case 'custom':
        return 'Custom Rubric';
      case 'grading-form':
        return 'Grading Form';
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-teal-600 hover:text-teal-700 text-sm"
            >
              ← Back to iThenticate
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Rubric Management</h1>
              <p className="text-sm text-gray-600">Create and manage rubrics for grading</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleImportClick}
              className="text-gray-600 hover:text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Import JSON
            </button>
            <button
              onClick={handleExport}
              className="text-gray-600 hover:text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Export JSON
            </button>
            <button
              onClick={handleLoadSampleData}
              className="text-teal-600 hover:text-teal-700 px-4 py-2 rounded-lg text-sm font-medium border border-teal-300 hover:bg-teal-50 transition-colors"
            >
              Load Samples
            </button>
            <button
              onClick={handleCreateRubric}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              Create Rubric
            </button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
          />
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-6 py-6">
        <div className="w-full">
        {rubrics.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rubrics yet</h3>
            <p className="text-gray-600 mb-6">Create your first rubric or import existing ones to get started with structured grading</p>
            <div className="flex items-center gap-3 justify-center">
              <button
                onClick={handleLoadSampleData}
                className="text-teal-600 hover:text-teal-700 px-6 py-2 rounded-lg text-sm font-medium border border-teal-300 hover:bg-teal-50 transition-colors"
              >
                Load Sample Rubrics
              </button>
              <button
                onClick={handleCreateRubric}
                className="bg-teal-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
              >
                Create Your First Rubric
              </button>
            </div>
          </div>
        ) : (
          /* Rubric List */
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">My Rubrics</h2>
              <p className="text-sm text-gray-600 mt-1">{rubrics.length} rubric{rubrics.length !== 1 ? 's' : ''}</p>
            </div>
            
            <div className="divide-y divide-gray-200">
              {rubrics.map((rubric) => (
                <div key={rubric.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-medium text-gray-900 truncate">
                          {rubric.title}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                          {getRubricTypeLabel(rubric.type)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                        <span>{rubric.criteria.length} criteria</span>
                        <span>{rubric.scales.length} scale levels</span>
                        <span>Created {formatDate(rubric.createdAt)}</span>
                        {rubric.lastModified !== rubric.createdAt && (
                          <span>Modified {formatDate(rubric.lastModified)}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEditRubric(rubric.id)}
                        className="text-teal-600 hover:text-teal-700 text-sm font-medium px-3 py-1 rounded hover:bg-teal-50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRubric(rubric.id, rubric.title)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Help Information */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Import Rubrics from JSON</h3>
          <div className="space-y-3 text-sm text-blue-800">
            <p>
              <strong>Quick Start:</strong> Click "Load Samples" to import 3 pre-built rubrics for essays, presentations, and group projects.
            </p>
            <p>
              <strong>Custom Import:</strong> Click "Import JSON" to upload your own rubric files. 
              <a 
                href="/simple-rubric-template.json" 
                download
                className="ml-1 underline hover:text-blue-600"
              >
                Download template →
              </a>
            </p>
            <p>
              <strong>Supported Formats:</strong> Single rubric, array of rubrics, or {`{ "rubrics": [...] }`} wrapper format.
            </p>
          </div>
        </div>

        {/* Debug Information */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-gray-100 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Info</h3>
            <p className="text-xs text-gray-600">
              Rubrics in localStorage: {rubrics.length}
            </p>
            <details className="mt-2">
              <summary className="text-xs text-gray-600 cursor-pointer">View Raw Data</summary>
              <pre className="mt-2 text-xs text-gray-500 overflow-auto max-h-40">
                {JSON.stringify(rubrics, null, 2)}
              </pre>
            </details>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
