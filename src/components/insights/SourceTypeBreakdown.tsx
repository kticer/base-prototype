import React from 'react';
import { useCourseAnalytics } from '../../hooks/useCourseAnalytics';

export function SourceTypeBreakdown() {
  const { analytics } = useCourseAnalytics(false);

  if (!analytics) return null;

  const { sourceTypeTrends } = analytics;
  const total = sourceTypeTrends.total;

  const types = [
    { label: 'Internet Sources', count: sourceTypeTrends.internetSources, color: 'bg-blue-500', textColor: 'text-blue-700' },
    { label: 'Publications', count: sourceTypeTrends.publicationSources, color: 'bg-purple-500', textColor: 'text-purple-700' },
    { label: 'Student Work', count: sourceTypeTrends.studentWorkSources, color: 'bg-orange-500', textColor: 'text-orange-700' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Source Type Distribution</h3>
        <p className="text-sm text-gray-600 mt-1">
          Breakdown of source types across all submissions
        </p>
      </div>

      {/* Stacked bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-12 overflow-hidden flex">
          {types.map((type, idx) => {
            const percent = (type.count / total) * 100;
            return percent > 0 ? (
              <div
                key={idx}
                className={`${type.color} h-full flex items-center justify-center text-white text-sm font-medium`}
                style={{ width: `${percent}%` }}
              >
                {percent > 15 && `${percent.toFixed(0)}%`}
              </div>
            ) : null;
          })}
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-3">
        {types.map((type, idx) => {
          const percent = ((type.count / total) * 100).toFixed(1);
          return (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 ${type.color} rounded`}></div>
                <span className="text-sm font-medium text-gray-900">{type.label}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-sm font-semibold ${type.textColor}`}>{type.count} sources</span>
                <span className="text-sm text-gray-600 w-12 text-right">{percent}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
