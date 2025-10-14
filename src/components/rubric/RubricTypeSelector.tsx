import { useState } from "react";

interface RubricCreationConfig {
  type: 'weighted' | 'qualitative' | 'custom' | 'grading-form';
  rows: number;
  columns: number;
  options: {
    enableRangedScoring: boolean;
    enableEqualWeights: boolean;
  };
}

interface RubricTypeSelectorProps {
  onTypeSelect: (config: RubricCreationConfig) => void;
  onCancel: () => void;
}

export function RubricTypeSelector({ onTypeSelect, onCancel }: RubricTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<'weighted' | 'qualitative' | 'custom' | 'grading-form'>('weighted');
  const [criterionRows, setCriterionRows] = useState(4);
  const [scaleColumns, setScaleColumns] = useState(4);
  const [enableRangedScoring, setEnableRangedScoring] = useState(true);
  const [enableEqualWeights, setEnableEqualWeights] = useState(true);

  const rubricTypes = [
    {
      id: 'weighted',
      title: 'Weighted Rubric',
      description: 'A matrix-style rubric with weighted criteria for balanced grading.',
      icon: '⚖️'
    },
    {
      id: 'qualitative',
      title: 'Qualitative Rubric', 
      description: 'A matrix-style rubric without numeric scoring that works well for formative assessments.',
      icon: '📝'
    },
    {
      id: 'custom',
      title: 'Custom Rubric',
      description: 'A matrix-style rubric where the values in each criterion scale box are customizable.',
      icon: '🔧'
    },
    {
      id: 'grading-form',
      title: 'Grading Form',
      description: 'A grading list with simple scoring and reusable comments for faster grading.',
      icon: '📋'
    }
  ] as const;

  const handleNext = () => {
    // Pass configuration along with type selection
    const config = {
      type: selectedType,
      rows: criterionRows,
      columns: selectedType === 'grading-form' ? 1 : scaleColumns,
      options: {
        enableRangedScoring,
        enableEqualWeights
      }
    };
    
    onTypeSelect(config);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Create New Rubric</h1>
            <p className="text-sm text-gray-600 mt-1">Choose a rubric type to get started</p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-700 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="w-full p-8">
        {/* Rubric Type Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Choose rubric type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rubricTypes.map((type) => (
              <label key={type.id} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="rubricType"
                  value={type.id}
                  checked={selectedType === type.id}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="sr-only"
                />
                <div className={`p-6 rounded-lg border-2 transition-colors ${
                  selectedType === type.id
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{type.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          selectedType === type.id
                            ? 'border-teal-500 bg-teal-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedType === type.id && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                          )}
                        </div>
                        <h3 className="font-medium text-gray-900">{type.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{type.description}</p>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Rubric Options */}
        {(selectedType === 'weighted' || selectedType === 'qualitative' || selectedType === 'custom') && (
          <div className="mb-8">
            <h3 className="text-base font-medium text-gray-900 mb-4">Rubric Options</h3>
            
            {/* Dimensions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Enter rubric dimensions</h4>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    No of criterion rows <span className="text-gray-400">Optional</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={criterionRows}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 4;
                      setCriterionRows(Math.min(50, Math.max(1, value)));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum rows: 50</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    No of scale columns <span className="text-gray-400">Optional</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={scaleColumns}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 4;
                      setScaleColumns(Math.min(7, Math.max(1, value)));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum columns: 7</p>
                </div>
              </div>
            </div>

            {/* Scoring Options - show for weighted rubrics */}
            {selectedType === 'weighted' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Rubric scoring</h4>
                
                <div className="space-y-4">
                  <label className="flex items-start gap-3">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked={enableRangedScoring}
                        onChange={(e) => setEnableRangedScoring(e.target.checked)}
                        className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">Enable ranged scoring</span>
                      <p className="text-sm text-gray-600">Select a score on a continuum for each criterion</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked={enableEqualWeights}
                        onChange={(e) => setEnableEqualWeights(e.target.checked)}
                        className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">Enable equal criterion weights</span>
                      <p className="text-sm text-gray-600">Distributes weight equally for each criterion</p>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Grading Form Options */}
        {selectedType === 'grading-form' && (
          <div className="mb-8">
            <h3 className="text-base font-medium text-gray-900 mb-4">Grading Form Options</h3>
            
            {/* Dimensions for grading form */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Enter form dimensions</h4>
              <div className="grid grid-cols-1 gap-6 max-w-sm">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Number of criteria <span className="text-gray-400">Optional</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={criterionRows}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 4;
                      setCriterionRows(Math.min(50, Math.max(1, value)));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum criteria: 50</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Grading forms are simple lists where each criterion can be marked as met or not met. 
                  You can add additional columns later if needed.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
