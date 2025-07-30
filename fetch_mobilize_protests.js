// fetch_mobilize_protests.js

const fetch = require("node-fetch");
const fs    = require("fs");
const path  = require("path");

// 1) Your keyword list (all lower-cased for matching)
const KEYWORDS = [
  // Core civic terms
  "politics", "political", "federal politics", "state politics", "local politics",
  "constitution", "constitutional", "checks and balances", "democracy", "dictatorship",
  "authoritarianism", "tyranny", "oligarchy", "autocracy", "freedom", "liberty",

  // Elections & voting
  "vote", "voter", "voters", "voting", "election", "elections", "register", "registration",
  "ballot", "ballots", "referendum", "initiative", "recall", "campaign", "campaigns", "canvass",
  "canvassing", "gotv", "knock", "knocking", "door", "doors", "phonebank", "phonebanking",

  // Activism terms
  "protest", "protests", "protesting", "rally", "rallies", "rallying",
  "march", "marching", "demonstration", "demonstrations", "sit-in", "die-in", "direct action",
  "petition", "petitioning", "solidarity", "mutual aid", "organize", "organizer", "organizing",
  "movement", "mobilization", "mobilize", "activism", "activist",

  // Rights & justice
  "human rights", "civil rights", "equal rights", "justice", "accountability",
  "abortion", "pro-choice", "pro life", "reproductive", "bodily autonomy",
  "lgbtq", "lgbtqia", "pride", "trans rights", "gay rights", "queer rights", "womens rights",
  "labor", "union", "workers rights", "working families", "economic justice",

  // Social & cultural flashpoints
  "book ban", "drag ban", "censorship", "school board", "education", "curriculum", "library",
  "racism", "antiracist", "diversity", "equity", "inclusion", "DEI",

  // Anti-authoritarian slogans
  "resist", "resistance", "resisting", "resisttrump", "nocrownfortheclown", "nokings",
  "not a king", "no kings", "kick out the clowns", "orange clown", "trump", "maga",

  // Public policy & crisis terms
  "gun", "gun violence", "gun reform", "gun violence prevention", "school shooting",
  "health", "healthcare", "mental health", "medicare", "medicaid", "insurance",
  "environment", "environmental", "climate", "climate change", "green energy", "renewable",
  "big oil", "pharma", "pharmaceutical", "coal", "pollution", "polluting",

  // Hot-button issues
  "immigration", "deportation", "detention", "ice", "border", "sanctuary",
  "police reform", "defund police", "criminal justice", "mass incarceration",

  // Popular hashtags/phrases
  "#vote", "#resist", "#bansoffourbodies", "#protecttranskids", "#climateaction", "#defenddemocracy",

  // Misc trending topics
  "supreme court", "scotus", "gerrymandering", "voter suppression", "fake electors",
  "project 2025", "insurrection", "coup", "authoritarian"
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

      const isRecurring = (evt.timeslots?.length || 0) > 1;

      return {
        key:    `${evt.title}|${date}|${coords.latitude}|${coords.longitude}|${evt.browser_url}`,
        title:  evt.title,
        date,
        location: address,
        lat:    coords.latitude,
        lng:    coords.longitude,
        link:   evt.browser_url,
        keep:   (isRecurring || !isStale(date)) && KEYWORDS.some(kw => text.includes(kw))
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
