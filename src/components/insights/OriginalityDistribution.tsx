import React from 'react';
import { useSimilarityDistribution } from '../../hooks/useCourseAnalytics';

export function OriginalityDistribution() {
  const distribution = useSimilarityDistribution();

  if (!distribution || distribution.length === 0) return null;

  const maxCount = Math.max(...distribution.map(d => d.count));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Originality Score Distribution</h3>
        <p className="text-sm text-gray-600 mt-1">
          How students compare on originality (lower similarity = higher originality)
        </p>
      </div>

      <div className="space-y-3">
        {distribution.map((bucket, idx) => {
          const barWidth = (bucket.count / maxCount) * 100;
          const barColor = bucket.range.includes('0-') || bucket.range.includes('1-24') ? 'bg-green-500' :
                          bucket.range.includes('25-') ? 'bg-yellow-500' :
                          bucket.range.includes('50-') ? 'bg-orange-500' : 'bg-red-500';

          return (
            <div key={idx}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{bucket.range} similarity</span>
                <span className="text-sm text-gray-600">{bucket.count} students ({bucket.percentage.toFixed(0)}%)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-8 relative overflow-hidden">
                <div
                  className={`${barColor} h-full rounded-full transition-all duration-300`}
                  style={{ width: `${barWidth}%` }}
                />
                <div className="absolute inset-0 flex items-center px-3">
                  <span className="text-xs font-medium text-gray-900">
                    {bucket.count}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Highly original</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Needs review</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>High concern</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
