interface RubricErrorsProps {
  errors: string[];
}

export function RubricErrors({ errors }: RubricErrorsProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="text-red-800 font-medium mb-2">Please fix the following issues:</div>
      <ul className="list-disc pl-5 space-y-1 text-sm text-red-700">
        {errors.map((e, idx) => (
          <li key={idx}>{e}</li>
        ))}
      </ul>
    </div>
  );
}

export function validateRubricForErrors(rubric: any): string[] {
  const errs: string[] = [];
  if (!rubric) return errs;

  // Limit: max 7 scales per criterion (interpreted as max columns for grid)
  const columns = rubric?.metadata?.columns ?? rubric?.scales?.length ?? 0;
  if (columns > 7) {
    errs.push(`Too many scales: ${columns}. Maximum allowed per criterion is 7.`);
  }

  // Character limit per cell description
  (rubric.criteria || []).forEach((c: any, ci: number) => {
    const descriptions = c?.descriptions || [];
    descriptions.forEach((d: string, si: number) => {
      if (typeof d === 'string' && d.length > 500) {
        errs.push(`Criterion ${ci + 1}, Scale ${si + 1} exceeds 500 characters.`);
      }
    });
  });

  // Weighted vs Qualitative display hints (not errors): ensure points valid if provided
  if (rubric.type === 'weighted') {
    (rubric.scales || []).forEach((s: any, si: number) => {
      if (s?.points != null && typeof s.points !== 'number') {
        errs.push(`Scale ${si + 1} has invalid numeric score.`);
      }
    });
  }

  return errs;
}
