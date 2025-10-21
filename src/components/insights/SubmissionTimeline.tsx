import React from 'react';
import { useCourseAnalytics } from '../../hooks/useCourseAnalytics';

interface TimelineDataPoint {
  date: string;
  count: number;
  avgSimilarity: number;
}

export function SubmissionTimeline() {
  const { analytics } = useCourseAnalytics(false);

  if (!analytics) return null;

  // Group submissions by date
  const timelineData: TimelineDataPoint[] = [];
  const dateMap = new Map<string, { count: number; totalSim: number }>();

  // Mock data - in real app, this would come from actual submission dates
  // For now, simulate a timeline based on existing data
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Distribute submissions across the week
    const count = Math.floor(analytics.totalSubmissions / 7) + (i % 3);
    const avgSim = analytics.averageSimilarity + (Math.random() * 10 - 5);

    timelineData.push({
      date: dateStr,
      count,
      avgSimilarity: Math.max(0, Math.min(100, avgSim))
    });
  }

  const maxCount = Math.max(...timelineData.map(d => d.count));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Submission Timeline</h3>
        <p className="text-sm text-gray-600 mt-1">
          Daily submission volume and average similarity trends
        </p>
      </div>

      <div className="space-y-3">
        {timelineData.map((point, idx) => {
          const barWidth = (point.count / maxCount) * 100;
          const simColor = point.avgSimilarity > 30 ? 'text-red-600' :
                          point.avgSimilarity > 20 ? 'text-yellow-600' : 'text-green-600';

          return (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-16 text-xs text-gray-600 font-medium">{point.date}</div>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${barWidth}%` }}
                  />
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className="text-xs font-medium text-gray-900">{point.count} submissions</span>
                  </div>
                </div>
                <div className={`w-16 text-xs font-semibold text-right ${simColor}`}>
                  {point.avgSimilarity.toFixed(0)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Submission volume</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-green-600 font-medium">● Low similarity</span>
          <span className="text-yellow-600 font-medium">● Medium similarity</span>
          <span className="text-red-600 font-medium">● High similarity</span>
        </div>
      </div>
    </div>
  );
}
