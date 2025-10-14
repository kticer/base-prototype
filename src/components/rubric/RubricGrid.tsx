import { useStore } from "../../store";
import { RubricCell } from "./RubricCell";
import { RubricControls } from "./RubricControls";

export function RubricGrid() {
  const {
    currentRubric,
    selectedCell,
    selectCell,
    addCriterion,
    addScale,
    removeCriterion,
    removeScale,
    duplicateCriterion,
    duplicateScale,
    moveCriterion,
    moveScale,
  } = useStore();

  if (!currentRubric) {
    return null;
  }

  const { criteria = [], scales = [], type = 'weighted' } = currentRubric;
  const isGradingForm = type === 'grading-form';

  // Defensive check for incomplete rubrics
  if (!Array.isArray(criteria) || !Array.isArray(scales)) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center text-red-600">
          <p>Error: Invalid rubric data structure</p>
          <p className="text-sm text-gray-600 mt-2">This rubric appears to be corrupted. Please create a new one.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Grid Header */}
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-medium text-gray-900">
          {isGradingForm ? 'Grading Form' : 'Rubric Grid'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {isGradingForm 
            ? 'Check criteria as met or not met. Click to edit criterion titles.'
            : 'Click any cell to edit its content. Use the controls to add or remove rows and columns.'
          }
        </p>
      </div>

      {/* Grid Container */}
      <div className="p-6">
        <div className="relative">
          {/* Scale Controls Row - only for matrix rubrics */}
          {!isGradingForm && (
            <div className="flex">
              {/* Empty corner cell */}
              <div className="w-64 h-12 border-r border-gray-200"></div>
              
              {/* Scale headers with controls */}
              {scales.map((scale, scaleIndex) => (
                <div key={scale.id} className="relative flex-1 min-w-48">
                  <RubricControls
                    type="column"
                    index={scaleIndex}
                    onAdd={() => addScale(scaleIndex + 1)}
                    onRemove={() => removeScale(scaleIndex)}
                    onDuplicate={() => duplicateScale(scaleIndex)}
                    onMoveLeft={scaleIndex > 0 ? () => moveScale(scaleIndex, scaleIndex - 1) : undefined}
                    onMoveRight={scaleIndex < scales.length - 1 ? () => moveScale(scaleIndex, scaleIndex + 1) : undefined}
                    canRemove={scales.length > 1}
                  />
                  
                  <div className="border-r border-gray-200 h-12 flex items-center justify-center bg-gray-50">
                    <RubricCell
                      content={scale.title}
                      isSelected={selectedCell?.type === 'scale-title' && selectedCell.index === scaleIndex}
                      onClick={() => selectCell({ type: 'scale-title', index: scaleIndex })}
                      onChange={(value) => {
                        // Handle scale title change
                        const updateScale = useStore.getState().updateScale;
                        updateScale(scaleIndex, { title: value });
                      }}
                      placeholder="Scale Title"
                      className="font-medium text-center"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Grading Form Header */}
          {isGradingForm && (
            <div className="flex mb-4">
              <div className="w-64 h-12 border-r border-gray-200 bg-gray-50 flex items-center justify-center">
                <span className="font-medium text-gray-700">Criteria</span>
              </div>
              <div className="flex-1 h-12 border-r border-gray-200 bg-gray-50 flex items-center justify-center">
                <span className="font-medium text-gray-700">Met</span>
              </div>
              {scales.length > 1 && (
                <div className="flex items-center justify-center ml-4">
                  <button
                    onClick={() => addScale(scales.length)}
                    className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-1 px-3 py-1 rounded hover:bg-teal-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Column
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Criteria rows */}
          {criteria.map((criterion, criterionIndex) => (
            <div key={criterion.id} className="flex items-stretch">
              {/* Criterion header with controls */}
              <div className="relative w-64 flex flex-col">
                <RubricControls
                  type="row"
                  index={criterionIndex}
                  onAdd={() => addCriterion(criterionIndex + 1)}
                  onRemove={() => removeCriterion(criterionIndex)}
                  onDuplicate={() => duplicateCriterion(criterionIndex)}
                  onMoveUp={criterionIndex > 0 ? () => moveCriterion(criterionIndex, criterionIndex - 1) : undefined}
                  onMoveDown={criterionIndex < criteria.length - 1 ? () => moveCriterion(criterionIndex, criterionIndex + 1) : undefined}
                  canRemove={criteria.length > 1}
                />
                
                <div className="border-r border-b border-gray-200 min-h-24 p-3 bg-gray-50 flex flex-1">
                  <RubricCell
                    content={criterion.title}
                    isSelected={selectedCell?.type === 'criterion-title' && selectedCell.index === criterionIndex}
                    onClick={() => selectCell({ type: 'criterion-title', index: criterionIndex })}
                    onChange={(value) => {
                      // Handle criterion title change
                      const updateCriterion = useStore.getState().updateCriterion;
                      updateCriterion(criterionIndex, { title: value });
                    }}
                    placeholder="Criterion Name"
                    className="font-medium"
                    multiline
                  />
                </div>
              </div>

              {/* Criterion scale cells - different for grading forms */}
              {isGradingForm ? (
                // Grading form: simple checkbox for Met/Not Met
                <div className="flex-1 min-w-48 flex flex-col">
                  <div className="border-r border-b border-gray-200 min-h-24 p-3 flex flex-1 items-center justify-center">
                    <input
                      type="checkbox"
                      className="w-6 h-6 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                      onChange={() => {
                        // Handle checkbox state
                        // This could be stored in a separate field for grading forms
                      }}
                    />
                  </div>
                </div>
              ) : (
                // Matrix rubrics: description cells
                scales.map((scale, scaleIndex) => (
                  <div key={`${criterion.id}-${scale.id}`} className="flex-1 min-w-48 flex flex-col">
                    <div className="border-r border-b border-gray-200 min-h-24 p-3 flex flex-1">
                      <RubricCell
                        content={criterion.descriptions?.[scaleIndex] || ''}
                        isSelected={
                          selectedCell?.type === 'description' && 
                          selectedCell.criterionIndex === criterionIndex && 
                          selectedCell.scaleIndex === scaleIndex
                        }
                        onClick={() => selectCell({ 
                          type: 'description', 
                          criterionIndex, 
                          scaleIndex 
                        })}
                        onChange={(value) => {
                          // Handle description change
                          const updateCriterionDescription = useStore.getState().updateCriterionDescription;
                          const trimmed = (value || '').slice(0, 500);
                          updateCriterionDescription(criterionIndex, scaleIndex, trimmed);
                        }}
                        placeholder="Enter description..."
                        multiline
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}

          {/* Add row button */}
          <div className="flex">
            <div className="w-64 border-r border-gray-200 h-12 flex items-center justify-center">
              <button
                onClick={() => addCriterion(criteria.length)}
                className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-1 px-3 py-1 rounded hover:bg-teal-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Row
              </button>
            </div>
            
            {/* Add column button */}
            <div className="flex-1 border-gray-200 h-12 flex items-center justify-center">
              <button
                onClick={() => addScale(scales.length)}
                className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-1 px-3 py-1 rounded hover:bg-teal-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Column
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Info */}
      <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {criteria.length} criteria × {scales.length} scales = {criteria.length * scales.length} cells
          </span>
          <span>
            Click any cell to edit • Use keyboard arrows to navigate
          </span>
        </div>
      </div>
    </div>
  );
}
