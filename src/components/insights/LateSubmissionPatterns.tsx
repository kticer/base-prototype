import React from 'react';
import { useStudentInterventions } from '../../hooks/useCourseAnalytics';

export function LateSubmissionPatterns() {
  const { patterns } = useStudentInterventions();

  // Mock late submission data based on student patterns
  const lateSubmissions = patterns
    .filter((_, idx) => idx % 3 === 0) // Mock: every 3rd student was late
    .map(p => ({
      studentName: p.studentName,
      title: p.submissionTitle,
      daysLate: Math.floor(Math.random() * 5) + 1,
      similarity: p.similarity
    }))
    .sort((a, b) => b.daysLate - a.daysLate);

  const totalLate = lateSubmissions.length;
  const totalSubmissions = patterns.length;
  const lateRate = ((totalLate / totalSubmissions) * 100).toFixed(0);

  if (totalLate === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Late Submission Patterns</h3>
          <p className="text-sm text-gray-600 mt-1">
            Track students submitting after deadlines
          </p>
        </div>
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-green-500 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-gray-600 font-medium">All submissions on time!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Late Submission Patterns</h3>
        <p className="text-sm text-gray-600 mt-1">
          {totalLate} students ({lateRate}%) submitted after the deadline
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="text-xs text-red-700 font-medium mb-1">Late Submissions</div>
          <div className="text-2xl font-bold text-red-900">{totalLate}</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="text-xs text-orange-700 font-medium mb-1">Average Days Late</div>
          <div className="text-2xl font-bold text-orange-900">
            {(lateSubmissions.reduce((sum, s) => sum + s.daysLate, 0) / totalLate).toFixed(1)}
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="text-xs text-purple-700 font-medium mb-1">Most Days Late</div>
          <div className="text-2xl font-bold text-purple-900">
            {Math.max(...lateSubmissions.map(s => s.daysLate))}
          </div>
        </div>
      </div>

      {/* Late submissions table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Student
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Submission
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Days Late
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Similarity
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {lateSubmissions.slice(0, 5).map((sub, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                  {sub.studentName}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {sub.title}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    sub.daysLate > 3 ? 'bg-red-100 text-red-800' :
                    sub.daysLate > 1 ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {sub.daysLate} {sub.daysLate === 1 ? 'day' : 'days'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                  {sub.similarity}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {lateSubmissions.length > 5 && (
        <div className="mt-3 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all {totalLate} late submissions →
          </button>
        </div>
      )}
    </div>
  );
}
