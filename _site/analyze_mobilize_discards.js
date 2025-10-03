// analyze_mobilize_discards.js
const fs = require('fs');
const path = require('path');

// Load raw Mobilize data (before filtering)
const inputPath = path.join(__dirname, 'assets/data/mobilize_protests.json');
const rawData = JSON.parse(fs.readFileSync(inputPath, 'utf8')).events || [];

console.log(`🔍 Loaded ${rawData.length} events from mobilize_protests.json`);

// Keyword list (same as fetch script)
const KEYWORDS = [
  "politics", "political", "constitution", "constitutional", "checks and balances",
  "democracy", "dictatorship", "authoritarianism", "tyranny", "oligarchy",
  "autocracy", "freedom", "liberty", "vote", "voter", "voting", "election",
  "elections", "register", "registration", "ballot", "ballots", "referendum",
  "initiative", "recall", "campaign", "canvass", "gotv", "knock", "phonebank",
  "protest", "protests", "rally", "march", "demonstration", "petition",
  "solidarity", "mutual aid", "organize", "movement", "mobilization", "activism",
  "human rights", "civil rights", "equal rights", "justice", "accountability",
  "abortion", "pro-choice", "reproductive", "lgbtq", "pride", "trans rights",
  "womens rights", "labor", "union", "workers rights", "economic justice",
  "resist", "resistance", "nocrownfortheclown", "trump", "maga", "gun",
  "gun violence", "health", "healthcare", "mental health", "environment",
  "climate", "immigration", "deportation", "ice", "border", "sanctuary",
  "police reform", "criminal justice", "supreme court", "project 2025",
  "insurrection", "coup", "authoritarian"
].map(s => s.toLowerCase());

// Determine keyword match
function matchesKeyword(event) {
  const text = (event.title + " " + (event.description || "")).toLowerCase();
  return KEYWORDS.some(kw => text.includes(kw));
}

// Separate matched vs discarded
const matched = [];
const discarded = [];

rawData.forEach(event => {
  if (matchesKeyword(event)) {
    matched.push(event);
  } else {
    discarded.push(event);
  }
});

// Report summary
console.log(`✅ Matched: ${matched.length}`);
console.log(`❌ Discarded: ${discarded.length}`);

// Show discarded event titles
console.log('\n❌ Discarded Event Titles:');
discarded.forEach((ev, i) => {
  console.log(`${i + 1}. ${ev.title} (${ev.date})`);
});

// (Optional) Save discarded list for review
const outPath = path.join(__dirname, 'discarded_events.json');
fs.writeFileSync(outPath, JSON.stringify(discarded, null, 2));
console.log(`\n📄 Full discarded list saved to: ${outPath}`);
