#!/usr/bin/env node
/**
 * Quick test script to verify course analytics data loading
 * Run with: node scripts/test-course-analytics.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Testing Course Analytics Data Loading...\n');

// Load folder structure
const folderPath = path.join(__dirname, '../public/data/folder_structure.json');
const folderData = JSON.parse(fs.readFileSync(folderPath, 'utf8'));

// Extract documents
function extractDocs(items) {
  const docs = [];
  for (const item of items) {
    if (item.type === 'document') {
      docs.push(item);
    } else if (item.type === 'folder' && item.children) {
      docs.push(...extractDocs(item.children));
    }
  }
  return docs;
}

const documents = extractDocs(folderData);
console.log(`✅ Found ${documents.length} documents in folder structure\n`);

// Load each document and check for match cards
let totalMatchCards = 0;
let totalHighlights = 0;
let documentsWithIntegrityIssues = 0;
let documentsHighRisk = 0;

documents.forEach((doc) => {
  const docPath = path.join(__dirname, `../public/data/documents/${doc.id}.json`);

  if (!fs.existsSync(docPath)) {
    console.log(`⚠️  Missing document file: ${doc.id}`);
    return;
  }

  try {
    const docData = JSON.parse(fs.readFileSync(docPath, 'utf8'));
    const matchCards = docData.matchCards || [];
    const highlights = docData.highlights || [];

    totalMatchCards += matchCards.length;
    totalHighlights += highlights.length;

    const hasIntegrityIssues = matchCards.some((mc) => mc.academicIntegrityIssue);
    if (hasIntegrityIssues) documentsWithIntegrityIssues++;

    if (doc.similarity > 40) documentsHighRisk++;

    console.log(`📄 ${doc.title}`);
    console.log(`   Author: ${doc.author}`);
    console.log(`   Similarity: ${doc.similarity}%`);
    console.log(`   Match Cards: ${matchCards.length}`);
    console.log(`   Highlights: ${highlights.length}`);
    if (hasIntegrityIssues) {
      console.log(`   ⚠️  Has integrity issues`);
    }
    console.log('');
  } catch (error) {
    console.log(`❌ Error loading ${doc.id}: ${error.message}\n`);
  }
});

console.log('📊 Course Summary:');
console.log(`   Total Documents: ${documents.length}`);
console.log(`   Total Match Cards: ${totalMatchCards}`);
console.log(`   Total Highlights: ${totalHighlights}`);
console.log(`   High Risk (>40%): ${documentsHighRisk}`);
console.log(`   With Integrity Issues: ${documentsWithIntegrityIssues}`);
console.log('');

// Calculate analytics preview
const avgSimilarity = documents.reduce((sum, d) => sum + d.similarity, 0) / documents.length;
console.log('🎯 Expected Analytics:');
console.log(`   Average Similarity: ${avgSimilarity.toFixed(1)}%`);
console.log(`   High Risk Count: ${documentsHighRisk}`);
console.log('');

console.log('✅ Data verification complete!');
console.log('\n💡 Next step: Run `npm run dev` and visit http://localhost:5173/insights');
