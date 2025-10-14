# Rubric JSON Import Guide

This guide explains how to import rubrics into the system using JSON files.

## Quick Start

1. **Load Sample Data**: Click "Load Samples" button to import 3 pre-built rubrics
2. **Import Custom JSON**: Click "Import JSON" to upload your own rubric files
3. **Create from Template**: Use the sample JSON as a template for creating new rubrics

## Sample Rubrics Included

The system includes 3 sample rubrics in `/public/sample-rubrics.json`:

1. **Academic Essay Writing Rubric** (4x4 weighted)
   - Thesis & Argument (25%)
   - Organization & Structure (25%) 
   - Use of Evidence (25%)
   - Language & Style (25%)

2. **Oral Presentation Rubric** (4x4 weighted)
   - Content Knowledge (30%)
   - Delivery & Speaking (25%)
   - Visual Aids (20%)
   - Audience Engagement (25%)

3. **Collaborative Group Project Rubric** (3x3 qualitative)
   - Collaboration (33%)
   - Individual Responsibility (33%)
   - Communication (34%)

## JSON Format

### Complete Rubric Structure
```json
{
  "rubrics": [
    {
      "id": "unique-rubric-id",
      "title": "Rubric Title",
      "type": "weighted|qualitative|custom|grading-form",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "lastModified": "2024-01-15T10:30:00.000Z",
      "criteria": [...],
      "scales": [...],
      "metadata": {...}
    }
  ]
}
```

### Criterion Object
```json
{
  "id": "criterion-unique-id",
  "title": "Criterion Name", 
  "description": "Criterion description",
  "weight": 25,
  "descriptions": [
    "Level 1 description",
    "Level 2 description", 
    "Level 3 description",
    "Level 4 description"
  ],
  "scales": {
    "scale-1": "Legacy format (optional)",
    "scale-2": "Legacy format (optional)"
  }
}
```

### Scale Object
```json
{
  "id": "scale-unique-id",
  "title": "Scale Level Title",
  "pointRange": "1-2 pts",
  "description": "Scale description", 
  "points": 2
}
```

### Metadata Object
```json
{
  "totalPoints": 28,
  "enableRangedScoring": true,
  "enableEqualWeights": true,
  "rows": 4,
  "columns": 4
}
```

## Import Options

### File Formats Supported

1. **Multiple Rubrics**: `{ "rubrics": [...] }`
2. **Array of Rubrics**: `[{rubric1}, {rubric2}]`
3. **Single Rubric**: `{id: "...", title: "...", ...}`

### Data Migration

The import system automatically:
- ✅ Generates new unique IDs to prevent conflicts
- ✅ Migrates legacy rubrics without `descriptions` arrays
- ✅ Validates required fields (id, title, criteria, scales)
- ✅ Sets current timestamp for `lastModified`
- ✅ Ensures `descriptions` array matches scale count

### Error Handling

Common import errors and solutions:

- **"Invalid JSON format"**: Check JSON syntax with a validator
- **"Missing required fields"**: Ensure rubric has id, title, criteria, scales
- **"Invalid rubric data structure"**: Verify arrays are properly formatted

## Creating Custom Rubrics

### Step 1: Start with Template
Copy the sample JSON structure and modify:

```json
{
  "rubrics": [
    {
      "id": "my-custom-rubric",
      "title": "My Custom Rubric",
      "type": "weighted",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "lastModified": "2024-01-15T10:30:00.000Z",
      "criteria": [
        {
          "id": "criterion-1", 
          "title": "My Criterion",
          "description": "What this criterion measures",
          "weight": 50,
          "descriptions": [
            "Poor performance description",
            "Good performance description"
          ]
        }
      ],
      "scales": [
        {
          "id": "scale-1",
          "title": "Needs Work", 
          "pointRange": "0-2 pts",
          "description": "Below expectations",
          "points": 2
        },
        {
          "id": "scale-2",
          "title": "Excellent",
          "pointRange": "3-5 pts", 
          "description": "Exceeds expectations",
          "points": 5
        }
      ],
      "metadata": {
        "totalPoints": 10,
        "enableRangedScoring": true,
        "enableEqualWeights": false,
        "rows": 1,
        "columns": 2
      }
    }
  ]
}
```

### Step 2: Customize Content
- **Title**: Give your rubric a descriptive name
- **Type**: Choose weighted, qualitative, custom, or grading-form
- **Criteria**: Add rows for what you're evaluating
- **Scales**: Add columns for performance levels
- **Descriptions**: Write specific descriptions for each cell
- **Weights**: Assign percentage weights (must total 100% for weighted rubrics)

### Step 3: Validate and Import
- Use a JSON validator to check syntax
- Import via "Import JSON" button
- Test by editing the imported rubric

## Tips for Success

### Content Writing
- **Be Specific**: Write clear, actionable descriptions
- **Use Observable Behaviors**: Focus on what can be seen/measured
- **Maintain Consistency**: Use similar language across levels
- **Consider Your Audience**: Write for both instructors and students

### Technical Best Practices
- **Unique IDs**: Use descriptive, unique identifiers
- **Balanced Grids**: Consider 3x3, 4x4, or 5x4 layouts
- **Weight Distribution**: Ensure weights reflect importance
- **Point Ranges**: Use logical point progressions

### Common Patterns

**3-Point Scale**: Needs Work → Developing → Proficient
**4-Point Scale**: Poor → Fair → Good → Excellent  
**5-Point Scale**: Inadequate → Developing → Proficient → Advanced → Exemplary

## Troubleshooting

### Import Issues
1. **Check JSON syntax** with online validator
2. **Verify required fields** are present
3. **Ensure arrays match** (descriptions length = scales length)
4. **Use absolute paths** for any file references

### Data Issues
1. **IDs are auto-generated** on import to prevent conflicts
2. **Descriptions arrays** are auto-created if missing
3. **Weights** don't need to total 100% (system handles normalization)
4. **Legacy formats** are automatically migrated

### Performance
- Large JSON files (>100 rubrics) may take a moment to import
- Browser localStorage has limits (~5-10MB typical)
- Consider breaking very large sets into multiple files

## Support

For issues or questions about rubric import:
1. Check browser console for detailed error messages
2. Validate JSON syntax before importing
3. Use sample rubrics as working examples
4. Start with simple 2x2 or 3x3 rubrics for testing