/**
 * Export buttons for course analytics and interventions
 */

import React from 'react';
import { useCourseAnalytics, useStudentInterventions } from '../../hooks/useCourseAnalytics';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export const ExportButtons: React.FC = () => {
  const { exportCSV: exportAnalyticsCSV, analytics } = useCourseAnalytics(false);
  const { exportCSV: exportInterventionsCSV, recommendations } = useStudentInterventions();

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAnalytics = () => {
    const csv = exportAnalyticsCSV();
    if (csv) {
      const timestamp = new Date().toISOString().split('T')[0];
      downloadCSV(csv, `course-analytics-${timestamp}.csv`);
    }
  };

  const handleExportInterventions = () => {
    const csv = exportInterventionsCSV();
    if (csv) {
      const timestamp = new Date().toISOString().split('T')[0];
      downloadCSV(csv, `student-interventions-${timestamp}.csv`);
    }
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={handleExportAnalytics}
        disabled={!analytics}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
        Export Analytics
      </button>
      <button
        onClick={handleExportInterventions}
        disabled={recommendations.length === 0}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
        Export Interventions
      </button>
    </div>
  );
};
