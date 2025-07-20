// fetch_mobilize_protests.js

const fetch = require("node-fetch");
const fs    = require("fs");
const path  = require("path");

// 1) Your keyword list (all lower-cased for matching)
const KEYWORDS = [
  "politics", "political", "federal politics", "state politics", "local politics",
  "climate change", "canvass", "defend reproductive rights", "gun violence prevention",
  "voting rights", "protest", "protests", "protesting", "rally", "rallies", "rallying",
  "trump", "musk", "ice", "immigration", "detention", "fight", "law", "kick out the clowns",
  "not a king", "no kings", "dems", "democrat", "democratic", "palestine", "genocide",
  "checks and balances", "50501", "505001", "peaceful", "defend", "rights",
  "accountability", "activism", "activist", "authoritarianism", "ban", "banned",
  "campaign", "campaigns", "canvassing", "civil", "clown", "clowns", "democracy",
  "demonstration", "demonstrations", "dictatorship", "door", "doors", "election",
  "elections", "equality", "fascism", "freedom", "freedoms", "gotv", "human",
  "impeach", "impeachment", "indivisible", "justice", "knock", "knocking", "labor",
  "liberty", "lgbtq", "lgbtqia", "march", "mobilization", "mobilize", "movement",
  "nocrownfortheclown", "nokings", "oligarchy", "organize", "organizer", "organizing",
  "petition", "petitioning", "phonebank", "phonebanking", "pride", "progressive",
  "progressives", "register", "registration", "resistance", "resist", "resists",
  "resisttrump", "resisting", "solidarity", "townhall", "trans", "tyranny", "united",
  "union", "voter", "voters", "voting", "vote", "womens", "abortion", "reproductive"
].map(s => s.toLowerCase());

// Helper for today’s date
const todayStr = new Date().toISOString().slice(0,10);
function isStale(dateStr) {
  if (!dateStr) return false;  // keep ongoing events
  return dateStr < todayStr;
}

// 2) Start with only future timeslots, 100 per page
let url = "https://api.mobilize.us/v1/events?" +
          new URLSearchParams({
            timeslot_start: "gte_now",
            per_page:       "100"
          }).toString();

// 3) Fetch all pages
async function fetchAll() {
  const all = []
  let next = url
  // retry parameters
  const MAX_RETRIES = 5
  const BASE_DELAY  = 2000  // ms

  while (next) {
    let attempt = 0
    let success = false

    while (attempt < MAX_RETRIES && !success) {
      try {
        console.log(`Fetching (attempt ${attempt+1}): ${next}`)
        const res = await fetch(next)
        if (!res.ok) {
          if (res.status >= 500 && res.status < 600) {
            throw new Error(`Server error ${res.status}`)
          }
          throw new Error(`Mobilize API error ${res.status}`)
        }
        const js = await res.json()
        all.push(...(js.data || js.events || []))
        next = js.next || null
        success = true
      } catch (err) {
        attempt++
        if (attempt < MAX_RETRIES && /Server error/.test(err.message)) {
          const delay = BASE_DELAY * attempt
          console.warn(`⚠️  Fetch failed: ${err.message}. Retrying in ${delay}ms...`)
          await new Promise(r => setTimeout(r, delay))
        } else {
          console.error(`❌  Giving up on ${next}: ${err.message}`)
          if (!success && all.length === 0) throw err
          next = null
          success = true
        }
      }
    }
  }
  return all
}

async function main() {
  const raw = await fetchAll();
  console.log(`⚡️ Fetched ${raw.length} events total`);

  // 4) Map + prune stale
  const mapped = raw
    .map(evt => {
      const slot = evt.timeslots?.[0] || {};
      const date = slot.start_date
        ? new Date(slot.start_date * 1000).toISOString().slice(0,10)
        : null;
      const loc    = evt.location || {};
      const coords = loc.location || {};
      const address = [
        ...(loc.address_lines||[]),
        loc.locality,
        loc.region
      ].filter(Boolean).join(", ");
      const text = (evt.title + " " + (evt.description || "")).toLowerCase();

      const matchesKeyword = KEYWORDS.some(kw => text.includes(kw));

      return {
        key:    `${evt.title}|${date}|${coords.latitude}|${coords.longitude}|${evt.browser_url}`,
        title:  evt.title,
        date,
        location: address,
        lat:    coords.latitude,
        lng:    coords.longitude,
        link:   evt.browser_url,
        matchesKeyword,
        keep:   !isStale(date) // ← only filter out old events now
      };
    })
    .filter(e => e.keep);

  console.log(`⚡️ ${mapped.length} after pruning stale`);

  // 5) Deduplicate
  const seen = new Set();
  const unique = mapped.filter(e => {
    if (seen.has(e.key)) return false;
    seen.add(e.key);
    return true;
  });
  console.log(`⚡️ ${unique.length} after dedupe`);

  // 6) Final slim & write JSON
  const out = unique.map(({ key, keep, ...rest }) => rest);
  const outPath = path.join(__dirname, "assets/data/mobilize_protests.json");
  fs.writeFileSync(outPath, JSON.stringify({ events: out }, null, 2), "utf8");

  const sizeKB = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`✅ Written ${out.length} events (${sizeKB} KB) → ${outPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
