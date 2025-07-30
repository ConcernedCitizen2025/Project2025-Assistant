// fetch_mobilize_protests.js
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

// Helper for today’s date
const todayStr = new Date().toISOString().slice(0, 10);
function isStale(dateStr) {
  if (!dateStr) return false; // keep if no date (ongoing)
  return dateStr < todayStr;
}

// Base URL for Mobilize API
const BASE_URL = "https://api.mobilize.us/v1/events";

// Build initial query (page 1)
function buildUrl(page = 1) {
  return (
    BASE_URL +
    "?" +
    new URLSearchParams({
      timeslot_start: "gte_now",
      per_page: "100",
      page: page.toString(),
    }).toString()
  );
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
  const mapped = raw
    .map((evt) => {
      const slot = evt.timeslots?.[0] || {};
      const date = slot.start_date
        ? new Date(slot.start_date * 1000).toISOString().slice(0, 10)
        : null;
      const loc = evt.location || {};
      const coords = loc.location || {};
      const address = [
        ...(loc.address_lines || []),
        loc.locality,
        loc.region,
      ]
        .filter(Boolean)
        .join(", ");

      return {
        title: evt.title,
        date,
        location: address,
        lat: coords.latitude,
        lng: coords.longitude,
        link: evt.browser_url,
      };
    })
    .filter((e) => !isStale(e.date)); // keep only future or ongoing

  console.log(`⚡️ ${mapped.length} events after removing past dates`);

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
