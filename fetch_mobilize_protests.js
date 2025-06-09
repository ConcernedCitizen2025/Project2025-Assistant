// fetch_mobilize_protests.js

const fetch = require("node-fetch");
const fs    = require("fs");
const path  = require("path");

// 1) Your keyword list (all lower-cased for matching)
const KEYWORDS = [
  "politics","political","federal politics","state politics","local politics",
  "climate change","canvass","defend reproductive rights","gun violence prevention",
  "voting rights","protest","protests","protesting","rally","rallies","rallying",
  "trump","musk","ice","immigration","detention","fight","law","kick out the clowns",
  "not a king","no kings","dems","democrat","democratic","palestine","genocide",
  "checks and balances","50501","505001","peaceful","defend","rights"
].map(s => s.toLowerCase());

// 2) Start with only future events, 100 per page
let url = "https://api.mobilize.us/v1/events?" +
          new URLSearchParams({
            timeslot_start: "gte_now",
            per_page:       "100"
          }).toString();

// 3) Page through everything
async function fetchAllEvents() {
  const all = [];
  while (url) {
    console.log(`Fetching: ${url}`);
    const res  = await fetch(url);
    if (!res.ok) throw new Error(`Mobilize API error ${res.status}`);
    const json = await res.json();
    all.push(...(json.data || []));
    url = json.next;  // will be null at end
  }
  return all;
}

async function main() {
  const events = await fetchAllEvents();
  console.log(`⚡️ Fetched ${events.length} raw events`);

  // 4) Keyword filter on title + description
  const filtered = events.filter(evt => {
    const text = (evt.title + " " + (evt.description||"")).toLowerCase();
    return KEYWORDS.some(kw => text.includes(kw));
  });
  console.log(`⚡️ ${filtered.length} events after keyword filtering`);

  // 5) Slim down each event to only the fields you need
  const slim = filtered.map(evt => {
    const slot = evt.timeslots?.[0] || {};
    const date = new Date(slot.start_date * 1000).toISOString().slice(0,10);
    const loc  = evt.location || {};
    const coords = loc.location || {};
    const address = [
      ...(loc.address_lines||[]),
      loc.locality,
      loc.region
    ].filter(Boolean).join(", ");
    return {
      title:    evt.title,
      location: address,
      lat:      coords.latitude,
      lng:      coords.longitude,
      date,
      link:     evt.browser_url
    };
  });

  // 6) Write out your filtered + slimmed JSON
  const outPath = path.join(__dirname, "assets/data/mobilize_protests.json");
  fs.writeFileSync(outPath, JSON.stringify({ events: slim }, null, 2), "utf8");
  console.log(`✅ Wrote ${slim.length} events → ${outPath}`);
  console.log(`   File size: ${(fs.statSync(outPath).size/1024).toFixed(1)} KB`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
