// fetch_mobilize_protests.js
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

// Keywords for filtering
const KEYWORDS = [
  "politics", "political", "democracy", "election", "elections", "vote", "voter", "voting",
  "protest", "protests", "rally", "rallies", "march", "marching", "demonstration", "resist",
  "freedom", "justice", "rights", "activism", "activist", "union", "labor", "organize", "movement",
  "climate", "climate change", "environment", "gun", "healthcare", "reproductive", "abortion",
  "immigration", "ice", "deportation", "accountability", "authoritarian", "tyranny", "fascism",
  "working families", "project 2025", "insurrection"
].map(s => s.toLowerCase());

const todayStr = new Date().toISOString().slice(0, 10);
function isStale(dateStr) {
  return dateStr && dateStr < todayStr;
}

let url = "https://api.mobilize.us/v1/events?" +
  new URLSearchParams({ timeslot_start: "gte_now", per_page: "100" }).toString();

async function fetchAll() {
  const all = [];
  let page = 1;
  const MAX_PAGES = 200; // safety cap
  const BASE_URL = "https://api.mobilize.us/v1/events";

  while (page <= MAX_PAGES) {
    const url = `${BASE_URL}?${new URLSearchParams({
      timeslot_start: "gte_now",
      per_page: "100",
      page: page.toString(),
    })}`;

    console.log(`Fetching page ${page}: ${url}`);

    const res = await fetch(url);

    if (res.status === 404) {
      console.log(`✅ No more pages after ${page - 1}. Total pages: ${page - 1}`);
      break;
    }

    if (!res.ok) throw new Error(`API error ${res.status}`);

    const js = await res.json();
    const events = js.data || js.events || [];

    if (!events.length) {
      console.log(`✅ No more events, stopping at page ${page}.`);
      break;
    }

    console.log(`➡️ Page ${page} returned ${events.length} events`);
    all.push(...events);

    page++;
  }

  return all;
}



async function main() {
  const raw = await fetchAll();
  console.log(`⚡️ Fetched ${raw.length} events total`);

  const mapped = raw
    .map(evt => {
      const slot = evt.timeslots?.[0] || {};
      const date = slot.start_date
        ? new Date(slot.start_date * 1000).toISOString().slice(0, 10)
        : null;
      const loc = evt.location || {};
      const coords = loc.location || {};
      const address = [
        ...(loc.address_lines || []),
        loc.locality,
        loc.region
      ].filter(Boolean).join(", ");
      const text = (evt.title + " " + (evt.description || "")).toLowerCase();
      const isRecurring = (evt.timeslots?.length || 0) > 1;

      return {
        key: `${evt.title}|${date}|${coords.latitude}|${coords.longitude}|${evt.browser_url}`,
        title: evt.title,
        date,
        location: address,
        lat: coords.latitude,
        lng: coords.longitude,
        link: evt.browser_url,
        keep: (isRecurring || !isStale(date)) && KEYWORDS.some(kw => text.includes(kw))
      };
    })
    .filter(e => e.keep);

  console.log(`⚡️ ${mapped.length} after pruning stale`);

  const seen = new Set();
  const unique = mapped.filter(e => {
    if (seen.has(e.key)) return false;
    seen.add(e.key);
    return true;
  });

  console.log(`⚡️ ${unique.length} after dedupe`);

  const out = unique.map(({ key, keep, ...rest }) => rest);
  const outPath = path.join(__dirname, "assets/data/mobilize_protests.json");
  fs.writeFileSync(outPath, JSON.stringify({ events: out }, null, 2), "utf8");

  console.log(`✅ Written ${out.length} events to ${outPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
