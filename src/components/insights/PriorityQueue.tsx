import React, { useState } from 'react';
import { useStudentInterventions } from '../../hooks/useCourseAnalytics';

export function PriorityQueue() {
  const { recommendations } = useStudentInterventions();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Sort by priority: high > medium > low
  const sorted = [...recommendations].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  const highPriority = sorted.filter(r => r.priority === 'high');
  const mediumPriority = sorted.filter(r => r.priority === 'medium');
  const lowPriority = sorted.filter(r => r.priority === 'low');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-gray-900">Priority Intervention Queue</h3>
        <p className="text-xs text-gray-600 mt-0.5">
          Students ranked by urgency
        </p>
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-red-50 rounded p-2 border border-red-200">
          <div className="text-xs text-red-700 font-medium">High</div>
          <div className="text-xl font-bold text-red-900">{highPriority.length}</div>
        </div>
        <div className="bg-yellow-50 rounded p-2 border border-yellow-200">
          <div className="text-xs text-yellow-700 font-medium">Medium</div>
          <div className="text-xl font-bold text-yellow-900">{mediumPriority.length}</div>
        </div>
        <div className="bg-blue-50 rounded p-2 border border-blue-200">
          <div className="text-xs text-blue-700 font-medium">Low</div>
          <div className="text-xl font-bold text-blue-900">{lowPriority.length}</div>
        </div>
      </div>

      {/* Queue list */}
      <div className="space-y-1.5 max-h-80 overflow-y-auto">
        {sorted.map((rec, idx) => {
          const isExpanded = expandedId === rec.student.documentId;
          const priorityStyles = {
            high: 'bg-red-50 border-red-200 hover:bg-red-100',
            medium: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
            low: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
          };

          const priorityBadge = {
            high: 'bg-red-100 text-red-800',
            medium: 'bg-yellow-100 text-yellow-800',
            low: 'bg-blue-100 text-blue-800'
          };

          return (
            <div
              key={idx}
              className={`border rounded p-2.5 cursor-pointer transition-colors ${priorityStyles[rec.priority]}`}
              onClick={() => setExpandedId(isExpanded ? null : rec.student.documentId)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-gray-900 truncate">
                      #{idx + 1} {rec.student.studentName}
                    </span>
                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${priorityBadge[rec.priority]}`}>
                      {rec.priority[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mb-1 truncate">
                    {rec.student.similarity}% similarity
                  </div>
                  <div className="text-xs text-gray-900">{rec.action}</div>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ml-2 ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {isExpanded && (
                <div className="mt-2 pt-2 border-t border-gray-300">
                  <div className="text-xs text-gray-700 mb-2">{rec.rationale}</div>
                  {rec.student.issues.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {rec.student.issues.map((issue, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs text-gray-700">
                          {issue}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No interventions needed - all students are performing well!
        </div>
      )}
    </div>
  );
}
