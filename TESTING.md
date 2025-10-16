# Testing Guide for iThenticate Prototype

## Quick Verification

Run the data verification script to ensure all course analytics data loads correctly:

```bash
node scripts/test-course-analytics.js
```

Expected output:
- ✅ 8 documents found
- ✅ 70 match cards total
- ✅ 195 highlights total
- ✅ Average similarity: 28.8%
- ✅ 1 high-risk submission (>40%)

---

## Manual Testing in Browser

### 1. Start Development Servers

**Terminal 1 - Frontend:**
```bash
npm run dev
```
This starts the Vite dev server at `http://localhost:5173`

**Terminal 2 - Backend (for chat features):**
```bash
export GEMINI_API_KEY=your_api_key_here  # Or use mock mode without this
npm run chat-api
```
This starts the Express server at `http://localhost:8787`

### 2. Test Phase 1 Features (Story 1: First to Insight)

**Navigate to any document:**
- Go to `http://localhost:5173/data/documents/doc-story1-test`

**Test Action Buttons:**
1. Open chat panel (button in top right)
2. Ask: "Explain this paper's similarity score"
3. Click the action buttons that appear (e.g., "Show Source", "Highlight Text")
4. Verify highlights pulse/glow when chat references them

**Test Comment Drafting:**
1. In chat, click "Draft a comment" button for a specific source
2. Verify AI generates a professional comment
3. Click "Add this comment" to add it to the document
4. Check that comment appears in the document

**Test Highlight Navigation:**
1. Click a highlight in the document
2. Verify chat shows contextual actions
3. Verify the corresponding match card scrolls into view

---

### 3. Test Phase 2 Features (Story 2: Hero's Journey)

**Navigate to InsightsPage:**
- Go to `http://localhost:5173/insights`

**Verify Course Analytics Load:**
- ✅ Stats cards show: 8 submissions, 28.8% avg similarity, 1 high risk, citation rate
- ✅ Similarity distribution chart displays bars for different ranges
- ✅ Common sources table shows sources appearing in multiple submissions
- ✅ Student interventions table shows students needing support

**Test Interventions Table:**
1. Look for students with priority badges (High/Medium/Low)
2. Click on a student row
3. Verify it navigates to their document (`/data/documents/[id]`)

**Test CSV Export:**
1. Click "Export Analytics" button
2. Verify file downloads: `course-analytics-YYYY-MM-DD.csv`
3. Open the CSV and verify it contains:
   - Course summary stats
   - Common sources list
   - Citation patterns
   - Similarity distribution
4. Click "Export Interventions" button
5. Verify file downloads: `student-interventions-YYYY-MM-DD.csv`
6. Open the CSV and verify it contains:
   - Student names
   - Priority levels
   - Suggested actions
   - Rationale

**Test Chat with Course Context:**
1. Open chat panel on InsightsPage
2. Try these prompts:
   - "Summarize the course similarity insights"
   - "Which students need intervention?"
   - "What are the most common sources?"
   - "How can I improve citation rates?"
3. Verify AI responses reference course-wide data

---

## Automated Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Store tests
npm test -- store.test.ts

# Course analytics tests
npm test -- courseAnalytics.test.ts

# Hook tests
npm test -- useNavigation.test.ts
npm test -- useMatchInteraction.test.ts
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```
This re-runs tests automatically when you save files.

---

## Expected Test Results

All tests should pass:
- ✅ 18 tests in store.test.ts
- ✅ 11 tests in courseAnalytics.test.ts
- ✅ Tests in useNavigation.test.ts
- ✅ Tests in useMatchInteraction.test.ts

---

## Troubleshooting

### Frontend won't start
- Check if port 5173 is already in use: `lsof -i :5173`
- Kill existing process: `kill $(lsof -t -i:5173)`

### Backend won't start (chat API)
- Check if port 8787 is already in use: `lsof -i :8787`
- Kill existing process: `kill $(lsof -t -i:8787)`

### Chat shows mock responses
- Ensure `GEMINI_API_KEY` is set in Terminal 2
- Verify the API key is valid
- Check server logs for errors

### Course analytics don't load
- Run verification script: `node scripts/test-course-analytics.js`
- Check browser console for errors
- Verify all document JSON files exist in `public/data/documents/`

### Highlights don't appear
- Check browser console for rendering errors
- Verify document has `highlights` array in JSON
- Verify highlight offsets match page content length

---

## Testing Checklist

### Phase 1 (Story 1)
- [ ] Chat action buttons render correctly
- [ ] "Show Source" navigates to match card
- [ ] "Highlight Text" highlights and scrolls to text
- [ ] Highlights pulse when chat references them
- [ ] AI comment drafting works (or fallback)
- [ ] Comments can be added to document
- [ ] Clicking highlights shows contextual actions

### Phase 2 (Story 2)
- [ ] Course analytics load on InsightsPage
- [ ] Stats cards show correct numbers
- [ ] Similarity distribution chart displays
- [ ] Common sources table populates
- [ ] Interventions table shows flagged students
- [ ] Clicking student navigates to document
- [ ] Export Analytics downloads CSV
- [ ] Export Interventions downloads CSV
- [ ] Chat understands course-level context

---

## Performance Notes

- Initial analytics load: ~500ms for 8 documents
- Export operations: instant (client-side)
- Chat responses: 1-3s (depends on API/mock)
- Page navigation: instant

---

## Known Issues

- Some pre-existing TypeScript warnings (not critical)
- Mock mode for chat when API key not set (expected)
- Markdown rendering warnings in console (cosmetic)
