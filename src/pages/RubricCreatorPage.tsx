import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStore } from "../store";
import { RubricGrid } from "../components/rubric/RubricGrid";
import { RubricToolbar } from "../components/rubric/RubricToolbar";
import { RubricTypeSelector } from "../components/rubric/RubricTypeSelector";
import { LinearRubricEditor } from "../components/rubric/LinearRubricEditor";
import { RubricErrors, validateRubricForErrors } from "../components/rubric/RubricErrors";

export default function RubricCreatorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  
  const {
    currentRubric,
    createRubric,
    loadRubric,
    loadRubrics,
    saveCurrentRubric,
    resetCurrentRubric,
    updateRubricTitle,
  } = useStore();

  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [iframeW, setIframeW] = useState(900);
  const [iframeH, setIframeH] = useState(600);
  const [iframeWText, setIframeWText] = useState<string>(String(900));
  const [iframeHText, setIframeHText] = useState<string>(String(600));
  const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
  const MIN_SIZE = 320;
  const MAX_SIZE = 1600;

  useEffect(() => {
    loadRubrics();
    
    if (isEditing && id) {
      loadRubric(id);
    } else if (!isEditing) {
      // Show type selector for new rubrics
      setShowTypeSelector(true);
    }
  }, [isEditing, id]); // Remove store function dependencies as they're stable

  // Track unsaved changes
  useEffect(() => {
    if (currentRubric) {
      setUnsavedChanges(true);
    }
  }, [currentRubric]);

  // Auto-save rubric with debounce
  useEffect(() => {
    if (!currentRubric) return;
    const t = setTimeout(() => {
      saveCurrentRubric();
      setUnsavedChanges(false);
    }, 1500);
    return () => clearTimeout(t);
  }, [currentRubric, saveCurrentRubric]);

  const handleTypeSelect = (config: {
    type: 'weighted' | 'qualitative' | 'custom' | 'grading-form';
    rows: number;
    columns: number;
    options: {
      enableRangedScoring: boolean;
      enableEqualWeights: boolean;
    };
  }) => {
    // Create rubric with the provided configuration
    createRubric(config.type, config.rows, config.columns, config.options);
    setShowTypeSelector(false);
    setUnsavedChanges(false);
  };

  const handleSave = () => {
    if (currentRubric) {
      saveCurrentRubric();
      setUnsavedChanges(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset this rubric to its original state? All changes will be lost.')) {
      resetCurrentRubric();
      setUnsavedChanges(false);
    }
  };

  const handleCancel = () => {
    if (unsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate('/rubrics');
      }
    } else {
      navigate('/rubrics');
    }
  };

  const handleTitleChange = (title: string) => {
    updateRubricTitle(title);
    setUnsavedChanges(true);
  };

  const handleTypeChange = (type: 'weighted' | 'qualitative' | 'custom' | 'grading-form') => {
    // Update rubric type
    if (currentRubric) {
      // This would need to be implemented in the store
      console.log('Type change to:', type);
      setUnsavedChanges(true);
    }
  };

  const handleRangedScoringChange = (enabled: boolean) => {
    // Update ranged scoring setting
    if (currentRubric) {
      // This would need to be implemented in the store
      console.log('Ranged scoring:', enabled);
      setUnsavedChanges(true);
    }
  };

  const handleEqualWeightsChange = (enabled: boolean) => {
    // Update equal weights setting
    if (currentRubric) {
      // This would need to be implemented in the store
      console.log('Equal weights:', enabled);
      setUnsavedChanges(true);
    }
  };

  const handleBack = () => {
    navigate('/rubrics');
  };

  if (showTypeSelector) {
    return (
      <RubricTypeSelector
        onTypeSelect={handleTypeSelect}
        onCancel={handleBack}
      />
    );
  }

  if (!currentRubric) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600">Loading rubric...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Toolbar */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="text-teal-600 hover:text-teal-700 text-sm font-medium"
              >
                ← Back to Rubrics
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {isEditing ? 'Edit Rubric' : 'Create Rubric'}
                </h1>
                <p className="text-sm text-gray-600">
                  {currentRubric.type === 'weighted' ? 'Weighted Range Rubric' : 
                   currentRubric.type === 'qualitative' ? 'Qualitative Rubric' :
                   currentRubric.type === 'custom' ? 'Custom Rubric' : 'Grading Form'}
                </p>
              </div>
            </div>
            
            {unsavedChanges && (
              <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                Unsaved changes
              </div>
            )}
          </div>

          <RubricToolbar
            title={currentRubric.title}
            type={currentRubric.type}
            enableRangedScoring={currentRubric.metadata?.enableRangedScoring ?? false}
            enableEqualWeights={currentRubric.metadata?.enableEqualWeights ?? false}
            onTitleChange={handleTitleChange}
            onTypeChange={handleTypeChange}
            onRangedScoringChange={handleRangedScoringChange}
            onEqualWeightsChange={handleEqualWeightsChange}
            onSave={handleSave}
            onReset={handleReset}
            onCancel={handleCancel}
            hasUnsavedChanges={unsavedChanges}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-6 py-6">
        {viewMode === 'grid' ? (
          <RubricGrid />
        ) : (
          <LinearRubricEditor type={currentRubric.type} />
        )}

        {/* Error panel */}
        <RubricErrors errors={validateRubricForErrors(currentRubric)} />
      </div>

      {/* Iframe preview controls */}
      <div className="w-full px-6 pb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="font-medium text-gray-900">Embed Preview (iframe)</div>
            <div className="flex items-center gap-3 text-sm">
              <label className="text-gray-700">Width</label>
              <input
                type="text"
                inputMode="numeric"
                className="w-24 border border-gray-300 rounded px-2 py-1"
                value={iframeWText}
                onChange={(e) => {
                  // Allow free typing of digits; strip non-digits
                  const raw = e.target.value;
                  const digits = raw.replace(/[^0-9]/g, '');
                  setIframeWText(digits);
                }}
                onBlur={() => {
                  const parsed = parseInt(iframeWText, 10);
                  const clamped = clamp(isNaN(parsed) ? iframeW : parsed, MIN_SIZE, MAX_SIZE);
                  setIframeW(clamped);
                  setIframeWText(String(clamped));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const parsed = parseInt(iframeWText, 10);
                    const clamped = clamp(isNaN(parsed) ? iframeW : parsed, MIN_SIZE, MAX_SIZE);
                    setIframeW(clamped);
                    setIframeWText(String(clamped));
                  }
                }}
              />
              <span className="text-xs text-gray-500">(320–1600 px)</span>
              <label className="text-gray-700">Height</label>
              <input
                type="text"
                inputMode="numeric"
                className="w-24 border border-gray-300 rounded px-2 py-1"
                value={iframeHText}
                onChange={(e) => {
                  const raw = e.target.value;
                  const digits = raw.replace(/[^0-9]/g, '');
                  setIframeHText(digits);
                }}
                onBlur={() => {
                  const parsed = parseInt(iframeHText, 10);
                  const clamped = clamp(isNaN(parsed) ? iframeH : parsed, MIN_SIZE, MAX_SIZE);
                  setIframeH(clamped);
                  setIframeHText(String(clamped));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const parsed = parseInt(iframeHText, 10);
                    const clamped = clamp(isNaN(parsed) ? iframeH : parsed, MIN_SIZE, MAX_SIZE);
                    setIframeH(clamped);
                    setIframeHText(String(clamped));
                  }
                }}
              />
              <span className="text-xs text-gray-500">(320–1600 px)</span>
            </div>
          </div>
          <div className="mt-3">
            <iframe
              title="Rubric Preview"
              style={{ width: `${iframeW}px`, height: `${iframeH}px`, border: '1px solid #e5e7eb', borderRadius: 8 }}
              src={`/rubrics/preview/${currentRubric.id}?view=${viewMode}`}
            />
          </div>
        </div>
      </div>

      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && (
        <div className="w-full px-6 pb-6">
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Info</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p>Mode: {isEditing ? 'Editing' : 'Creating'}</p>
              <p>Rubric ID: {currentRubric.id}</p>
              <p>Type: {currentRubric.type}</p>
              <p>Criteria: {currentRubric.criteria.length}</p>
              <p>Scales: {currentRubric.scales.length}</p>
              <p>Unsaved Changes: {unsavedChanges ? 'Yes' : 'No'}</p>
            </div>
            <details className="mt-2">
              <summary className="text-xs text-gray-600 cursor-pointer">View Raw Data</summary>
              <pre className="mt-2 text-xs text-gray-500 overflow-auto max-h-40">
                {JSON.stringify(currentRubric, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}
