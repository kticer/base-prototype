/**
 * Simple bar chart for similarity distribution
 * Uses basic HTML/CSS instead of a charting library
 */

import React from 'react';
import { useSimilarityDistribution } from '../../hooks/useCourseAnalytics';

export const SimilarityDistributionChart: React.FC = () => {
  const distribution = useSimilarityDistribution();

  if (distribution.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No distribution data available
      </div>
    );
  }

  const maxCount = Math.max(...distribution.map((d) => d.count));

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Similarity Score Distribution
      </h3>
      <div className="space-y-3">
        {distribution.map((item) => {
          const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
          const widthPercent = Math.max(percentage, 5); // Min 5% for visibility

          return (
            <div key={item.range} className="flex items-center">
              <div className="w-20 text-sm text-gray-600 font-medium">
                {item.range}
              </div>
              <div className="flex-1 ml-4">
                <div className="relative">
                  <div
                    className="bg-blue-500 h-8 rounded flex items-center justify-end pr-2 transition-all duration-300"
                    style={{ width: `${widthPercent}%` }}
                  >
                    <span className="text-xs font-semibold text-white">
                      {item.count}
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-16 text-right text-sm text-gray-500 ml-4">
                {item.percentage.toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
