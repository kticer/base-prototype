import React, { useState } from 'react';
import { useStudentInterventions } from '../../hooks/useCourseAnalytics';
import type { StudentPattern } from '../../types/courseAnalytics';

type SortField = 'name' | 'similarity' | 'issues' | 'citation' | 'date';
type SortDirection = 'asc' | 'desc';

export function StudentComparisonTable() {
  const { patterns } = useStudentInterventions();
  const [sortField, setSortField] = useState<SortField>('similarity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterRisk, setFilterRisk] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Add mock grade data
  const studentsWithGrades = patterns.map(p => ({
    ...p,
    grade: p.integrityIssuesCount === 0 ? 75 + Math.random() * 25 : 50 + Math.random() * 30
  }));

  // Filter students
  const filtered = studentsWithGrades.filter(s => {
    if (filterRisk === 'all') return true;
    if (filterRisk === 'high') return s.similarity >= 40 || s.integrityIssuesCount > 0;
    if (filterRisk === 'medium') return s.similarity >= 20 && s.similarity < 40 && s.integrityIssuesCount === 0;
    return s.similarity < 20;
  });

  // Sort students
  const sorted = [...filtered].sort((a, b) => {
    let compareValue = 0;

    switch (sortField) {
      case 'name':
        compareValue = a.studentName.localeCompare(b.studentName);
        break;
      case 'similarity':
        compareValue = a.similarity - b.similarity;
        break;
      case 'issues':
        compareValue = a.integrityIssuesCount - b.integrityIssuesCount;
        break;
      case 'citation':
        const citationScore = (p: StudentPattern) =>
          p.citationQuality === 'good' ? 3 : p.citationQuality === 'needs_improvement' ? 2 : 1;
        compareValue = citationScore(a) - citationScore(b);
        break;
      case 'date':
        compareValue = new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
        break;
    }

    return sortDirection === 'asc' ? compareValue : -compareValue;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-gray-400">⇅</span>;
    }
    return <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Student Comparison Table</h3>
          <p className="text-sm text-gray-600 mt-1">
            Detailed metrics for all students with sortable columns
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterRisk('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterRisk === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({studentsWithGrades.length})
          </button>
          <button
            onClick={() => setFilterRisk('high')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterRisk === 'high'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            High Risk
          </button>
          <button
            onClick={() => setFilterRisk('medium')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterRisk === 'medium'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Medium Risk
          </button>
          <button
            onClick={() => setFilterRisk('low')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterRisk === 'low'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Low Risk
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    Student <SortIcon field="name" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Submission
                </th>
                <th
                  onClick={() => handleSort('similarity')}
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center justify-center gap-2">
                    Similarity <SortIcon field="similarity" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('issues')}
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center justify-center gap-2">
                    Issues <SortIcon field="issues" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('citation')}
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center justify-center gap-2">
                    Citations <SortIcon field="citation" />
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Grade
                </th>
                <th
                  onClick={() => handleSort('date')}
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center justify-center gap-2">
                    Submitted <SortIcon field="date" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sorted.map((student, idx) => {
                const riskColor = student.similarity >= 40 || student.integrityIssuesCount > 0 ? 'text-red-700' :
                                 student.similarity >= 20 ? 'text-yellow-700' : 'text-green-700';

                const citationBadge = student.citationQuality === 'good' ? 'bg-green-100 text-green-800' :
                                     student.citationQuality === 'needs_improvement' ? 'bg-yellow-100 text-yellow-800' :
                                     'bg-red-100 text-red-800';

                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {student.studentName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {student.submissionTitle}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${riskColor}`}>
                        {student.similarity}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {student.integrityIssuesCount > 0 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {student.integrityIssuesCount}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${citationBadge}`}>
                        {student.citationQuality === 'good' ? 'Good' :
                         student.citationQuality === 'needs_improvement' ? 'Needs Work' : 'Concerning'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                      {Math.round(student.grade)}%
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-600">
                      {new Date(student.dateAdded).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No students match the selected filter.
        </div>
      )}
    </div>
  );
}
