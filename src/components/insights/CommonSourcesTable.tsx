/**
 * Table displaying common sources across submissions
 */

import React from 'react';
import { useCommonSources } from '../../hooks/useCourseAnalytics';

export const CommonSourcesTable: React.FC = () => {
  const sources = useCommonSources();

  if (sources.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Common Sources Across Course
        </h3>
        <div className="text-sm text-gray-500">
          No common sources found (sources appearing in multiple submissions)
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Common Sources Across Course
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Sources that appear in multiple student submissions
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Students
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg Similarity
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Citation
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sources.map((source, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">
                  {source.sourceName}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                      source.sourceType === 'Internet'
                        ? 'bg-blue-100 text-blue-800'
                        : source.sourceType === 'Publication'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {source.sourceType}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-center font-medium">
                  {source.occurrenceCount}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-center">
                  {source.averageSimilarity.toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                      source.typicallyCited
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {source.typicallyCited ? 'Usually Cited' : 'Often Uncited'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
