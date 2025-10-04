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

  // Map & filter out stale events ONLY
  const mapped = raw.map((evt) => {
    // Pick the earliest FUTURE timeslot; if none, fall back to latest past slot
    const slots = Array.isArray(evt.timeslots) ? evt.timeslots.slice() : [];
    const nowSec = Math.floor(Date.now() / 1000);
    const future = slots.filter(s => typeof s.start_date === 'number' && s.start_date >= nowSec);
    const pick = future.length
      ? future.sort((a, b) => a.start_date - b.start_date)[0]   // earliest future
      : slots.sort((a, b) => b.start_date - a.start_date)[0];   // latest past (fallback)

    const date = pick?.start_date
      ? new Date(pick.start_date * 1000).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
      : null;

    const loc = evt.location || {};
    const coords = loc.location || {};
    const address = [
      ...(loc.address_lines || []),
      loc.locality,
      loc.region,
    ].filter(Boolean).join(", ");

    return {
      id: evt.id, // keep ID to debug specific reports
      title: evt.title,
      date,
      location: address,
      lat: coords.latitude,
      lng: coords.longitude,
      link: evt.browser_url,
    };
  });

  const futureCount = mapped.filter(e => e.date && e.date >= todayStr).length;
  console.log(`ℹ️ Mobilize mapped: total=${mapped.length}, future>=${todayStr}=${futureCount}`);


  // Deduplicate
  const seen = new Set();
  const unique = mapped.filter((e) => {
    const key = `${e.title}|${e.date}|${e.lat}|${e.lng}|${e.link}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  console.log(`⚡️ ${unique.length} events after dedupe`);

  // Write final JSON
  const out = unique;
  const outPath = path.join(__dirname, "assets/data/mobilize_protests.json");
  fs.writeFileSync(outPath, JSON.stringify({ events: out }, null, 2), "utf8");

  const sizeKB = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`✅ Written ${out.length} events (${sizeKB} KB) → ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
