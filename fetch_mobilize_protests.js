// fetch_mobilize_protests.js
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

// Helper for today’s date in PACIFIC time (YYYY-MM-DD)
const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

// (Optional cleanup) we don't filter here anymore; merge/map handles dates
// function isStale(dateStr) { ... }  // ← you can delete the old isStale function


// Base URL for Mobilize API
const BASE_URL = "https://api.mobilize.us/v1/events";

// Build initial query (page 1)
function buildUrl(page = 1) {
  // two days ago (UTC) in epoch seconds
  const twoDaysAgoSec = Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60;

  const params = new URLSearchParams({
    timeslot_start: `gte_${twoDaysAgoSec}`, // ← backticks ensure interpolation
    per_page: '100',
    page: String(page),
  });

  return `${BASE_URL}?${params.toString()}`;
}


// Fetch all pages of events
async function fetchAll() {
  const all = [];
  let page = 1;

  while (true) {
    const url = buildUrl(page);
    console.log(`Fetching page ${page}: ${url}`);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error ${res.status}`);

    const js = await res.json();
    const events = js.data || js.events || [];
    console.log(`➡️ Page ${page} returned ${events.length} events`);

    if (!events.length) break;

    all.push(...events);

    // Stop if fewer than 100 results (last page)
    if (events.length < 100) break;

    page++;
  }

  return all;
}

async function main() {
  const raw = await fetchAll();
  console.log(`⚡️ Fetched ${raw.length} raw Mobilize events`);

  // --- KEEP EVERYTHING RAW: no mapping, no filtering, no dedupe
console.log(`⚡️ Fetched ${raw.length} raw Mobilize events (writing raw)`);

const outPath = path.join(__dirname, "assets/data/mobilize_protests.json");
fs.writeFileSync(outPath, JSON.stringify({ events: raw }, null, 2), "utf8");

const sizeKB = (fs.statSync(outPath).size / 1024).toFixed(1);
console.log(`✅ Written RAW Mobilize feed (${raw.length} items, ${sizeKB} KB) → ${outPath}`);

};
