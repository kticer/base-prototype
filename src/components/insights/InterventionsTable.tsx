/**
 * Table displaying student intervention recommendations
 */

import React from 'react';
import { useStudentInterventions } from '../../hooks/useCourseAnalytics';
import { useNavigate } from 'react-router-dom';

export const InterventionsTable: React.FC = () => {
  const { recommendations, loading } = useStudentInterventions();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Student Interventions
        </h3>
        <div className="text-sm text-gray-500">Loading interventions...</div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Student Interventions
        </h3>
        <div className="flex items-center justify-center py-8 text-green-600">
          <svg className="w-12 h-12 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-lg font-medium">No students currently need intervention</span>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Student Interventions
        </h3>
        <span className="text-sm text-gray-500">
          {recommendations.length} student{recommendations.length !== 1 ? 's' : ''} flagged
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submission
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Similarity
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Issues
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Suggested Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {recommendations.map((rec) => (
              <tr
                key={rec.student.documentId}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/data/documents/${rec.student.documentId}`)}
              >
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded uppercase ${getPriorityColor(
                      rec.priority
                    )}`}
                  >
                    {rec.priority}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {rec.student.studentName}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                  {rec.student.submissionTitle}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`text-sm font-semibold ${
                      rec.student.similarity > 50
                        ? 'text-red-600'
                        : rec.student.similarity > 40
                        ? 'text-orange-600'
                        : 'text-gray-900'
                    }`}
                  >
                    {rec.student.similarity}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-sm font-medium text-gray-900">
                    {rec.student.integrityIssuesCount}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-md">
                  <div className="line-clamp-2" title={rec.action}>
                    {rec.action}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
