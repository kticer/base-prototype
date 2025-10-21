import React from 'react';
import { useStudentInterventions } from '../../hooks/useCourseAnalytics';

export function CitationQualityHeatmap() {
  const { patterns } = useStudentInterventions();

  // Group students by similarity ranges and citation quality
  const ranges = [
    { label: '0-10%', min: 0, max: 10 },
    { label: '10-20%', min: 10, max: 20 },
    { label: '20-30%', min: 20, max: 30 },
    { label: '30-40%', min: 30, max: 40 },
    { label: '40%+', min: 40, max: 100 }
  ];

  const qualities: Array<'good' | 'needs_improvement' | 'concerning'> = ['good', 'needs_improvement', 'concerning'];

  const heatmapData = ranges.map(range => {
    const studentsInRange = patterns.filter(p => p.similarity >= range.min && p.similarity < range.max);
    return {
      range: range.label,
      good: studentsInRange.filter(s => s.citationQuality === 'good').length,
      needs_improvement: studentsInRange.filter(s => s.citationQuality === 'needs_improvement').length,
      concerning: studentsInRange.filter(s => s.citationQuality === 'concerning').length,
      total: studentsInRange.length
    };
  });

  const maxCount = Math.max(...heatmapData.flatMap(d => [d.good, d.needs_improvement, d.concerning]));

  const getHeatColor = (count: number) => {
    if (count === 0) return 'bg-gray-50';
    const intensity = Math.min((count / maxCount) * 100, 100);
    if (intensity > 75) return 'bg-red-500 text-white';
    if (intensity > 50) return 'bg-orange-400 text-white';
    if (intensity > 25) return 'bg-yellow-300 text-gray-900';
    return 'bg-green-200 text-gray-900';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Citation Quality Heatmap</h3>
        <p className="text-sm text-gray-600 mt-1">
          Student distribution by similarity range and citation quality
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b-2 border-gray-300">
                Similarity
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 border-b-2 border-gray-300">
                Good Citations
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 border-b-2 border-gray-300">
                Needs Improvement
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 border-b-2 border-gray-300">
                Concerning
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 border-b-2 border-gray-300">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {heatmapData.map((row, idx) => (
              <tr key={idx} className="border-b border-gray-200">
                <td className="px-3 py-3 text-sm font-medium text-gray-900">
                  {row.range}
                </td>
                <td className="px-3 py-3 text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded font-bold text-sm ${getHeatColor(row.good)}`}>
                    {row.good}
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded font-bold text-sm ${getHeatColor(row.needs_improvement)}`}>
                    {row.needs_improvement}
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded font-bold text-sm ${getHeatColor(row.concerning)}`}>
                    {row.concerning}
                  </div>
                </td>
                <td className="px-3 py-3 text-center text-sm font-semibold text-gray-700">
                  {row.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-600">
        <span>Color intensity shows student count</span>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-200 rounded"></div>
          <span>Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-yellow-300 rounded"></div>
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-orange-400 rounded"></div>
          <span>High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-red-500 rounded"></div>
          <span>Very High</span>
        </div>
      </div>
    </div>
  );
}
