/**
 * Types for the rubric creation and management system
 */

/** Individual scale level in a rubric */
export interface RubricScale {
  id: string;
  title: string;
  pointRange: string; // e.g., "1-2 pts", "3-4 pts"
  description: string;
  points: number; // numeric value for calculations
}

/** Individual criterion (row) in a rubric */
export interface RubricCriterion {
  id: string;
  title: string;
  description: string;
  weight?: number; // percentage weight for weighted rubrics
  descriptions: string[]; // array of descriptions for each scale level
  /** Optional per-criterion titles for jagged list view */
  scaleTitles?: string[];
  scales: { [scaleId: string]: string }; // scale descriptions specific to this criterion (deprecated)
}

/** Different types of rubrics supported */
export type RubricType = 'weighted' | 'qualitative' | 'custom' | 'grading-form';

/** Complete rubric definition */
export interface Rubric {
  id: string;
  title: string;
  type: RubricType;
  createdAt: string;
  lastModified: string;
  criteria: RubricCriterion[];
  scales: RubricScale[];
  metadata: {
    totalPoints?: number;
    enableRangedScoring?: boolean;
    enableEqualWeights?: boolean;
    rows: number; // current grid dimensions
    columns: number;
    maxRows: number; // maximum allowed rows (50)
    maxColumns: number; // maximum allowed columns (20)
  };
}

/** Cell position in the rubric grid */
export interface CellPosition {
  type: 'criterion-title' | 'scale-title' | 'description';
  criterionIndex?: number;
  scaleIndex?: number;
  index?: number; // for title cells
}

/** Rubric creation state */
export interface RubricState {
  rubrics: Rubric[];
  currentRubric: Rubric | null;
  selectedCell: CellPosition | null;
  isEditing: boolean;
  editingCellContent: string;
}

/** Default rubric template */
export const createDefaultRubric = (
  type: RubricType = 'weighted', 
  rows: number = 4, 
  columns: number = 4,
  options: {
    enableRangedScoring?: boolean;
    enableEqualWeights?: boolean;
  } = {}
): Rubric => {
  // For grading forms, only create 1 column (Met/Not Met style)
  const effectiveColumns = type === 'grading-form' ? 1 : Math.min(7, columns);
  
  // Create scales based on type
  const scales: RubricScale[] = [];
  
  if (type === 'grading-form') {
    // Grading forms typically just have Met/Not Met
    scales.push({
      id: 'scale-1',
      title: 'Met',
      pointRange: '1 pt',
      description: 'Criterion met',
      points: 1
    });
  } else {
    // Create scales for matrix rubrics
    for (let i = 0; i < effectiveColumns; i++) {
      scales.push({
        id: `scale-${i + 1}`,
        title: 'Scale Level Title',
        pointRange: `${(i * 2) + 1}-${(i + 1) * 2} pts`,
        description: 'Scale description',
        points: (i + 1) * 2
      });
    }
  }

  // Create criteria
  const criteria: RubricCriterion[] = [];
  const defaultWeight = 100 / rows; // Equal distribution
  
  for (let i = 0; i < rows; i++) {
    criteria.push({
      id: `criterion-${i + 1}`,
      title: type === 'grading-form' ? 'Criterion' : 'Criterion title',
      description: 'Criterion description',
      weight: defaultWeight,
      descriptions: new Array(effectiveColumns).fill(''), // Empty descriptions for each scale
      scaleTitles: new Array(effectiveColumns).fill(0).map((_, idx) =>
        scales[idx]?.title || `Scale ${idx + 1}`
      ),
      scales: scales.reduce((acc, scale) => {
        acc[scale.id] = 'Scale description';
        return acc;
      }, {} as { [scaleId: string]: string })
    });
  }

  return {
    id: `rubric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: 'Untitled Rubric',
    type,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    criteria,
    scales,
    metadata: {
      totalPoints: scales.reduce((sum, scale) => sum + scale.points, 0) * rows,
      enableRangedScoring: options.enableRangedScoring ?? (type === 'weighted'),
      enableEqualWeights: options.enableEqualWeights ?? (type === 'weighted'),
      rows,
      columns: effectiveColumns,
      maxRows: 50,
      maxColumns: 20,
    }
  };
};
