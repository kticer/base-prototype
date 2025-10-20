const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '../public/data/documents');
const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.json'));

const results = [];

files.forEach(file => {
  try {
    const content = fs.readFileSync(path.join(docsDir, file), 'utf8');
    const doc = JSON.parse(content);

    let similarity = null;
    if (doc.similarity !== undefined) {
      similarity = doc.similarity;
    } else if (doc.matchCards && doc.matchCards.length > 0) {
      similarity = doc.matchCards.reduce((sum, card) => sum + (card.similarityPercent || 0), 0);
    }

    results.push({
      id: doc.id || file.replace('.json', ''),
      file,
      title: doc.title || 'Unknown',
      author: doc.author || 'Unknown',
      similarity
    });
  } catch (e) {
    console.error(`Error processing ${file}:`, e.message);
  }
});

console.log('\n=== Document Similarity Scores ===\n');
results.forEach(r => {
  console.log(`${r.id}`);
  console.log(`  Title: ${r.title}`);
  console.log(`  Author: ${r.author}`);
  console.log(`  Similarity: ${r.similarity !== null ? r.similarity + '%' : 'N/A'}`);
  console.log('');
});

console.log(`Total documents: ${results.length}`);
