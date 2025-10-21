import React, { useState } from 'react';
import { useCommonSources } from '../../hooks/useCourseAnalytics';
import { useStudentInterventions } from '../../hooks/useCourseAnalytics';

export function SourceNetworkDiagram() {
  const commonSources = useCommonSources();
  const { patterns } = useStudentInterventions();
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  // Get top 5 most common sources
  const topSources = commonSources
    .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
    .slice(0, 5);

  if (topSources.length === 0) {
    return null;
  }

  const selectedSourceData = selectedSource
    ? topSources.find(s => s.sourceName === selectedSource)
    : null;

  const affectedStudents = selectedSourceData
    ? patterns.filter(p => selectedSourceData.affectedSubmissions.includes(p.documentId))
    : [];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Source Network Analysis</h3>
        <p className="text-sm text-gray-600 mt-1">
          Visualize which students are using the same sources
        </p>
      </div>

      {/* Network visualization */}
      <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8 mb-6" style={{ height: '300px' }}>
        {/* Center: Sources */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="flex flex-wrap gap-3 justify-center max-w-md">
            {topSources.map((source, idx) => {
              const isSelected = selectedSource === source.sourceName;
              const sizeClass = source.occurrenceCount > 4 ? 'w-20 h-20' :
                               source.occurrenceCount > 2 ? 'w-16 h-16' : 'w-12 h-12';
              const bgColor = source.typicallyCited ? 'bg-green-500' : 'bg-red-500';

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedSource(isSelected ? null : source.sourceName)}
                  className={`${sizeClass} ${bgColor} rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg hover:scale-110 transition-transform ${
                    isSelected ? 'ring-4 ring-blue-400' : ''
                  }`}
                  title={source.sourceName}
                >
                  {source.occurrenceCount}
                </button>
              );
            })}
          </div>
        </div>

        {/* Connection lines (decorative) */}
        {selectedSourceData && (
          <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
            {affectedStudents.slice(0, 8).map((_, idx) => (
              <line
                key={idx}
                x1="50%"
                y1="50%"
                x2={`${20 + (idx % 4) * 20}%`}
                y2={`${idx < 4 ? '10%' : '90%'}`}
                stroke="#3B82F6"
                strokeWidth="2"
                strokeOpacity="0.3"
                strokeDasharray="4,4"
              />
            ))}
          </svg>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mb-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          <span>Cited sources</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span>Uncited sources</span>
        </div>
        <div className="text-gray-500">
          Larger circles = more students
        </div>
      </div>

      {/* Selected source details */}
      {selectedSourceData && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="font-semibold text-blue-900 mb-2">{selectedSourceData.sourceName}</div>
          <div className="grid grid-cols-3 gap-4 text-sm mb-3">
            <div>
              <div className="text-blue-700 font-medium">{selectedSourceData.occurrenceCount} students</div>
              <div className="text-blue-600 text-xs">used this source</div>
            </div>
            <div>
              <div className="text-blue-700 font-medium">{selectedSourceData.averageSimilarity.toFixed(1)}%</div>
              <div className="text-blue-600 text-xs">avg similarity</div>
            </div>
            <div>
              <div className={`font-medium ${selectedSourceData.typicallyCited ? 'text-green-700' : 'text-red-700'}`}>
                {selectedSourceData.typicallyCited ? 'Cited' : 'Uncited'}
              </div>
              <div className="text-blue-600 text-xs">citation status</div>
            </div>
          </div>
          <div className="text-xs text-blue-700">
            <span className="font-medium">Students:</span>{' '}
            {affectedStudents.slice(0, 5).map(s => s.studentName).join(', ')}
            {affectedStudents.length > 5 && ` and ${affectedStudents.length - 5} more`}
          </div>
        </div>
      )}

      {/* Top sources list */}
      {!selectedSourceData && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 mb-2">Top Shared Sources (click to explore):</div>
          {topSources.map((source, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedSource(source.sourceName)}
              className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{source.sourceName}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {source.occurrenceCount} students · {source.averageSimilarity.toFixed(1)}% avg · {source.sourceType}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  source.typicallyCited ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {source.typicallyCited ? 'Cited' : 'Uncited'}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
