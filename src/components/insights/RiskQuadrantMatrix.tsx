import React, { useMemo, useState } from 'react';
import { useStudentInterventions } from '../../hooks/useCourseAnalytics';

interface QuadrantPoint {
  studentName: string;
  similarity: number;
  grade: number;
  x: number; // percentage from left
  y: number; // percentage from top
}

export function RiskQuadrantMatrix() {
  const { patterns } = useStudentInterventions();
  const [hovered, setHovered] = useState<QuadrantPoint | null>(null);

  // Deterministic hash to keep mock grades stable across renders
  const hashToUnit = (s: string): number => {
    let h = 2166136261; // FNV-1a base
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    // Convert to 0..1
    return ((h >>> 0) % 10000) / 10000;
  };

  // Create quadrant points
  const points: QuadrantPoint[] = useMemo(() => (
    patterns.map(p => {
      const u = hashToUnit(p.studentName + '|' + p.documentId);
      const grade = p.integrityIssuesCount === 0
        ? 75 + u * 25 // 75–100 for students without integrity issues
        : 50 + u * 30; // 50–80 otherwise
      const g = Math.round(grade);
      return {
        studentName: p.studentName,
        similarity: p.similarity,
        grade: g,
        x: p.similarity,        // 0–100 similarity maps to 0–100% position
        y: 100 - g,             // invert so high grades are near the top
      } as QuadrantPoint;
    })
  ), [patterns]);

  // Categorize students by quadrant
  const quadrants = {
    highSimHighGrade: points.filter(p => p.similarity >= 30 && p.grade >= 70),
    highSimLowGrade: points.filter(p => p.similarity >= 30 && p.grade < 70),
    lowSimHighGrade: points.filter(p => p.similarity < 30 && p.grade >= 70),
    lowSimLowGrade: points.filter(p => p.similarity < 30 && p.grade < 70)
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Risk Quadrant Analysis</h3>
        <p className="text-sm text-gray-600 mt-1">
          Student positioning by similarity and grade performance
        </p>
      </div>

      {/* Quadrant grid */}
      <div className="relative bg-gray-50 border-2 border-gray-300 rounded-lg" style={{ height: '400px' }}>
        {/* Quadrant labels */}
        <div className="absolute top-2 left-2 text-xs font-semibold text-gray-600 bg-white px-2 py-1 rounded border border-gray-300 z-10">
          Good Citations
          <div className="text-[10px] font-normal text-gray-500">Low Sim · High Grade</div>
        </div>
        <div className="absolute top-2 right-2 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-300 z-10">
          Needs Citation Help
          <div className="text-[10px] font-normal text-amber-600">High Sim · High Grade</div>
        </div>
        <div className="absolute bottom-2 left-2 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-300 z-10">
          Needs Content Help
          <div className="text-[10px] font-normal text-blue-600">Low Sim · Low Grade</div>
        </div>
        <div className="absolute bottom-2 right-2 text-xs font-semibold text-red-700 bg-red-50 px-2 py-1 rounded border border-red-300 z-10">
          High Priority
          <div className="text-[10px] font-normal text-red-600">High Sim · Low Grade</div>
        </div>

        {/* Grid lines */}
        <div className="absolute inset-0">
          {/* Vertical line at 30% similarity */}
          <div className="absolute left-[30%] top-0 bottom-0 border-l-2 border-gray-300 border-dashed"></div>
          {/* Horizontal line at 70% grade (inverted) */}
          <div className="absolute left-0 right-0 top-[30%] border-t-2 border-gray-300 border-dashed"></div>
        </div>

        {/* Student dots */}
        <div className="absolute inset-0 overflow-hidden">
          {points.map((point, idx) => {
            const color = point.similarity >= 30 && point.grade < 70 ? 'bg-red-500' :
                         point.similarity >= 30 && point.grade >= 70 ? 'bg-amber-500' :
                         point.similarity < 30 && point.grade < 70 ? 'bg-blue-500' :
                         'bg-green-500';

            const isHovered = hovered?.studentName === point.studentName;

            return (
              <div
                key={idx}
                className={`absolute w-3 h-3 rounded-full ${color} cursor-pointer transition-transform duration-150 ${
                  isHovered ? 'scale-150 ring-4 ring-white shadow-lg z-20' : 'hover:scale-125'
                }`}
                style={{
                  left: `calc(${point.x}% - 6px)`,
                  top: `calc(${point.y}% - 6px)`
                }}
                onMouseEnter={() => setHovered(point)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}

          {/* Tooltip for hovered point */}
          {hovered && (
            <div
              className="absolute z-30"
              style={{ left: `calc(${hovered.x}% + 8px)`, top: `calc(${hovered.y}% - 8px)` }}
            >
              <div className="bg-white border border-gray-200 rounded shadow-md px-3 py-2 text-xs text-gray-800">
                <div className="font-semibold text-gray-900">{hovered.studentName}</div>
                <div className="mt-0.5 text-gray-600">Similarity: {hovered.similarity}%</div>
                <div className="text-gray-600">Grade: {hovered.grade}%</div>
              </div>
            </div>
          )}
        </div>

        {/* Axes labels */}
        <div className="absolute -bottom-6 left-0 right-0 text-center text-xs text-gray-600 font-medium">
          Similarity Score →
        </div>
        <div
          className="absolute -left-6 top-0 bottom-0 flex items-center justify-center text-xs text-gray-600 font-medium"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          Grade →
        </div>
      </div>

      {/* Removed below-the-chart hover info in favor of tooltip */}

      {/* Summary */}
      <div className="mt-6 grid grid-cols-4 gap-3">
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="text-xs text-green-700 font-medium mb-1">Good Citations</div>
          <div className="text-lg font-bold text-green-900">{quadrants.lowSimHighGrade.length}</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
          <div className="text-xs text-amber-700 font-medium mb-1">Citation Help</div>
          <div className="text-lg font-bold text-amber-900">{quadrants.highSimHighGrade.length}</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="text-xs text-blue-700 font-medium mb-1">Content Help</div>
          <div className="text-lg font-bold text-blue-900">{quadrants.lowSimLowGrade.length}</div>
        </div>
        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
          <div className="text-xs text-red-700 font-medium mb-1">High Priority</div>
          <div className="text-lg font-bold text-red-900">{quadrants.highSimLowGrade.length}</div>
        </div>
      </div>
    </div>
  );
}
