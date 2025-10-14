import { useEffect } from "react";
import { PencilIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { useStore } from "../../store";

export function GradingPanel() {
  // Get grading data from store
  const rubricScore = useStore((state) => state.rubricScore);
  const gradingCriteria = useStore((state) => state.gradingCriteria);
  const updateRubricScore = useStore((state) => state.updateRubricScore);
  const updateGradingCriterion = useStore((state) => state.updateGradingCriterion);
  const resetGradingScores = useStore((state) => state.resetGradingScores);
  const saveUserState = useStore((state) => state.saveUserState);

  // Calculate max score from criteria
  const maxScore = gradingCriteria.reduce((sum, criterion) => sum + criterion.maxScore, 0);

  const updateCriterionScore = (id: number, newScore: number) => {
    // Update the specific criterion
    updateGradingCriterion(id, { score: newScore });
  };

  // Automatically update total rubric score when criteria change
  useEffect(() => {
    const newTotal = gradingCriteria.reduce((sum, criterion) => sum + criterion.score, 0);
    updateRubricScore(newTotal);
  }, [gradingCriteria, updateRubricScore]);

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getSliderColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return "accent-green-500";
    if (percentage >= 60) return "accent-yellow-500";
    return "accent-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Rubric Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Custom Rubric Name</h3>
          <InformationCircleIcon className="w-5 h-5 text-blue-600" />
        </div>
        <button className="p-1 text-gray-500 hover:text-gray-700">
          <PencilIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Overall Score */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="text-2xl font-bold">
          {rubricScore.toFixed(2)} / {maxScore}
        </div>
        <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
          Apply to Grade
        </button>
      </div>

      {/* Criteria List */}
      <div className="space-y-4">
        {gradingCriteria.map((criterion) => (
          <div key={criterion.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-900">{criterion.name}</h4>
                <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  <InformationCircleIcon className="w-3 h-3" />
                  <span>3</span>
                </div>
              </div>
              <div className={`font-semibold ${getScoreColor(criterion.score, criterion.maxScore)}`}>
                {criterion.score} / {criterion.maxScore}
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-3">
              {criterion.description}
            </div>

            {/* Score Slider */}
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max={criterion.maxScore}
                step="1"
                value={criterion.score}
                onChange={(e) => updateCriterionScore(criterion.id, parseInt(e.target.value))}
                className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider ${getSliderColor(criterion.score, criterion.maxScore)}`}
              />
              
              {/* Slider Labels */}
              <div className="flex justify-between text-xs text-gray-500">
                <span>0</span>
                <span>{Math.floor(criterion.maxScore * 0.2)}</span>
                <span>{Math.floor(criterion.maxScore * 0.4)}</span>
                <span>{Math.floor(criterion.maxScore * 0.6)}</span>
                <span>{Math.floor(criterion.maxScore * 0.8)}</span>
                <span>{criterion.maxScore}</span>
              </div>
            </div>

            {/* Score Input */}
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min="0"
                max={criterion.maxScore}
                value={criterion.score}
                onChange={(e) => updateCriterionScore(criterion.id, parseInt(e.target.value) || 0)}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">pts</span>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Controls */}
      <div className="flex gap-2">
        <button 
          onClick={resetGradingScores}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Reset Scores
        </button>
        <button 
          onClick={saveUserState}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Save Rubric
        </button>
      </div>
    </div>
  );
}