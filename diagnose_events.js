// diagnose_events.js
const fs = require("fs");
const path = require("path");

// Create diagnostics folder if needed
const diagDir = path.join(__dirname, "diagnostics");
if (!fs.existsSync(diagDir)) fs.mkdirSync(diagDir);

// Load JSON helper
const readJSON = (file) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, file), "utf8"));

// Normalize smart quotes
const normalizeQuotes = (str) =>
  (str || "").replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');

// Load raw feeds
const mRaw = readJSON("assets/data/mobilize_protests.json").events || [];
const zRaw = readJSON("assets/data/mobilizon_events.json").data || [];
const pRaw =
  readJSON("assets/data/protest_events.json").data?.searchEvents?.elements ||
  [];

// Normalize events (like merge_events.js)
const norm1 = (ev) => ({
  source: "mobilize",
  title: normalizeQuotes(ev.title),
  begin: ev.date,
  end: ev.date,
  lat: ev.lat,
  lng: ev.lng,
  location: normalizeQuotes(ev.location),
  links: [{ title: normalizeQuotes(ev.title), href: normalizeQuotes(ev.link) }],
});

const norm2 = (ev) => {
  const d = (ev.beginsOn || "").split("T")[0];
  return {
    source: "mobilizon",
    title: normalizeQuotes(ev.title),
    begin: d,
    end: d,
    lat: ev.lat,
    lng: ev.lng,
    location: normalizeQuotes(ev.location),
    links: [{ title: normalizeQuotes(ev.title), href: normalizeQuotes(ev.link) }],
  };
};

const norm3 = (ev) => ({
  source: "protestapi",
  title: normalizeQuotes(ev.title),
  begin: ev.date,
  end: ev.date,
  lat: ev.lat ?? ev.latitude,
  lng: ev.lng ?? ev.longitude,
  location: normalizeQuotes(ev.location),
  links: [{ title: normalizeQuotes(ev.title), href: normalizeQuotes(ev.link) }],
});

// Merge all events
const all = [
  ...mRaw.map(norm1),
  ...zRaw.map(norm2),
  ...pRaw.map(norm3),
];

const ONE_DAY = 86_400_000;
const PST_OFFSET = 420; // PDT in minutes
const now = new Date();
const utc = now.getTime() + now.getTimezoneOffset() * 60000;
const today = new Date(utc - PST_OFFSET * 60000);
today.setHours(0, 0, 0, 0);
const todayStr = today.toISOString().slice(0, 10);

// Diagnostic counters
let missingCoords = 0;
let missingLocation = 0;
let pastEvents = 0;
let missingLinks = 0;

const problemEvents = [];

// Check each event
all.forEach((ev) => {
  const problems = [];

  if (ev.lat == null || ev.lng == null) {
    problems.push("Missing coordinates");
    missingCoords++;
  }

  if (!ev.location || ev.location.trim() === "") {
    problems.push("Missing location");
    missingLocation++;
  }

  if (ev.end < todayStr) {
    problems.push(`Past event (end: ${ev.end}, today: ${todayStr})`);
    pastEvents++;
  }

  if (!ev.links || !ev.links.length || !ev.links[0].href) {
    problems.push("Missing link");
    missingLinks++;
  }

  if (problems.length) {
    problemEvents.push({
      title: ev.title,
      begin: ev.begin,
      end: ev.end,
      lat: ev.lat,
      lng: ev.lng,
      location: ev.location,
      links: ev.links,
      source: ev.source,
      problems,
    });
  }
});

// Summary
console.log("📊 Diagnostic Summary:");
console.log(`Total events:        ${all.length}`);
console.log(`❌ Missing coords:    ${missingCoords}`);
console.log(`❌ Missing location:  ${missingLocation}`);
console.log(`❌ Past events:       ${pastEvents}`);
console.log(`❌ Missing links:     ${missingLinks}`);
console.log(`⚠️ Problem events:    ${problemEvents.length}`);

// Write output
const outPath = path.join(diagDir, "problem_events.json");
fs.writeFileSync(outPath, JSON.stringify(problemEvents, null, 2), "utf8");

console.log(`\n🔍 Detailed problems saved to: ${outPath}`);
