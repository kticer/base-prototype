import React, { useMemo, useState } from 'react';
import { useCourseAnalytics } from '../../hooks/useCourseAnalytics';

interface TimelineDataPoint {
  date: string;
  count: number;
  avgSimilarity: number;
}

export function SubmissionTimeline() {
  const { analytics } = useCourseAnalytics(false);

  if (!analytics) return null;

  // Build a simple 7-day timeline (mocked from totals/avg for prototype)
  const timelineData: TimelineDataPoint[] = useMemo(() => {
    const out: TimelineDataPoint[] = [];
    const today = new Date();
    const base = Math.max(1, Math.floor(analytics.totalSubmissions / 7));
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const jitter = (i % 3) - 1; // -1,0,1 pattern for small variation
      const count = Math.max(0, base + jitter);
      const avgSim = Math.max(0, Math.min(100, analytics.averageSimilarity + (i % 2 === 0 ? 3 : -2)));
      out.push({ date: dateStr, count, avgSimilarity: avgSim });
    }
    return out;
  }, [analytics]);

  const maxCount = Math.max(...timelineData.map(d => d.count), 1);

  // Chart geometry
  const width = 600;
  const height = 240;
  const margin = { top: 16, right: 20, bottom: 36, left: 44 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const xAt = (i: number) => (timelineData.length > 1 ? (i / (timelineData.length - 1)) * innerW : innerW / 2) + margin.left;
  const yAt = (count: number) => margin.top + (1 - count / maxCount) * innerH;

  // Build line path for submission counts
  const pathD = timelineData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(2)} ${yAt(d.count).toFixed(2)}`).join(' ');

  // Y-axis ticks (nice 0..maxCount with ~4 steps)
  const yTicks = useMemo(() => {
    const steps = 4;
    const step = Math.max(1, Math.ceil(maxCount / steps));
    const vals: number[] = [];
    for (let v = 0; v <= maxCount; v += step) vals.push(v);
    if (vals[vals.length - 1] !== maxCount) vals.push(maxCount);
    // ensure unique and sorted
    return Array.from(new Set(vals)).sort((a, b) => a - b);
  }, [maxCount]);

  // Tooltip state (index of hovered point)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Submission Timeline</h3>
        <p className="text-sm text-gray-600 mt-1">Daily submission volume (last 7 days)</p>
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[240px] min-w-[520px]">
          {/* Axes */}
          <line x1={margin.left} y1={height - margin.bottom} x2={width - margin.right} y2={height - margin.bottom} stroke="#D1D5DB" strokeWidth={1} />
          <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} stroke="#E5E7EB" strokeWidth={1} />

          {/* X-axis ticks/labels */}
          {timelineData.map((d, i) => (
            <g key={i} transform={`translate(${xAt(i)}, ${height - margin.bottom})`}>
              <line y2="6" stroke="#9CA3AF" />
              <text y="18" textAnchor="middle" fontSize="10" fill="#6B7280">{d.date}</text>
            </g>
          ))}

          {/* Y-axis ticks/labels and light grid lines */}
          {yTicks.map((v, idx) => {
            const y = yAt(v);
            return (
              <g key={idx}>
                <line x1={margin.left - 4} x2={margin.left} y1={y} y2={y} stroke="#9CA3AF" />
                <text x={margin.left - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#6B7280">{v}</text>
                {/* grid line */}
                <line x1={margin.left} x2={width - margin.right} y1={y} y2={y} stroke="#F3F4F6" />
              </g>
            );
          })}

          {/* Y-axis label */}
          <text x={margin.left - 36} y={margin.top + innerH / 2} transform={`rotate(-90 ${margin.left - 36} ${margin.top + innerH / 2})`} fontSize="11" fill="#6B7280">Submissions</text>

          {/* Line path */}
          <path d={pathD} fill="none" stroke="#3B82F6" strokeWidth={2} />

          {/* Data points */}
          {timelineData.map((d, i) => (
            <g key={i}>
              <circle
                cx={xAt(i)}
                cy={yAt(d.count)}
                r={3.5}
                fill="#3B82F6"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            </g>
          ))}

          {/* Tooltip near hovered point */}
          {hoveredIdx !== null && (() => {
            const d = timelineData[hoveredIdx];
            const px = xAt(hoveredIdx);
            const py = yAt(d.count);
            const rectW = 150;
            const rectH = 40;
            const pad = 8;
            let tx = px + 8;
            let ty = py - 8 - rectH / 2;
            // Clamp to chart area
            tx = Math.min(width - margin.right - rectW, Math.max(margin.left, tx));
            ty = Math.min(height - margin.bottom - rectH, Math.max(margin.top, ty));
            return (
              <g>
                <rect x={tx} y={ty} width={rectW} height={rectH} rx={6} ry={6} fill="#FFFFFF" stroke="#E5E7EB" />
                <text x={tx + pad} y={ty + 16} fontSize="11" fill="#111827">{d.count} submissions</text>
                <text x={tx + pad} y={ty + 30} fontSize="10" fill="#6B7280">Avg similarity: {d.avgSimilarity.toFixed(0)}%</text>
              </g>
            );
          })()}
        </svg>
      </div>

      <div className="mt-3 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3B82F6' }}></div>
          <span>Submission volume</span>
        </div>
      </div>
    </div>
  );
}
