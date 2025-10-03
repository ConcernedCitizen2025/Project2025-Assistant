// analyze_filtered_mobilizon.js
const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'assets/data/mobilizon_events_raw.json'); // we'll save raw before filtering
const filteredFile = path.join(__dirname, 'assets/data/mobilizon_events.json');

if (!fs.existsSync(rawFile) || !fs.existsSync(filteredFile)) {
  console.error('❌ Missing raw or filtered JSON. Ensure you saved raw data during fetch.');
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(rawFile, 'utf8')).data || [];
const filtered = JSON.parse(fs.readFileSync(filteredFile, 'utf8')).data || [];

const filteredSet = new Set(filtered.map(ev => `${ev.title}|${ev.date}`));

// Events excluded by keyword filter
const excluded = raw.filter(ev => !filteredSet.has(`${ev.title}|${ev.date}`));

console.log(`🔍 Total raw: ${raw.length}`);
console.log(`✅ Filtered: ${filtered.length}`);
console.log(`❌ Excluded: ${excluded.length}`);
console.log('--- Titles of excluded events ---');
excluded.forEach(ev => {
  console.log(`• ${ev.title} (${ev.date})`);
});
