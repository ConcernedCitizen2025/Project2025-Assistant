// fetch_mobilizon_events.js
const fetch = require('node-fetch');    // npm install node-fetch@2
const fs    = require('fs');
const path  = require('path');

// your protest-related keywords (lowercase)
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


// Mobilizon GraphQL endpoint (same as your instance’s /api) :contentReference[oaicite:1]{index=1}
const API_URL = 'https://events.pol-rev.com/api';

// Query: gets the EventSearchResult fields + inline fragment to grab full Event.url
const QUERY = `
  query SearchEvents($beginsOn: DateTime, $limit: Int) {
    searchEvents(beginsOn: $beginsOn, limit: $limit) {
      elements {
        id
        uuid
        title
        beginsOn
        endsOn
        status
        tags { slug title }
        physicalAddress { description geom locality }
        ... on Event {
          url
          onlineAddress
          picture { url }
        }
      }
    }
  }
`;

async function fetchMobilizon() {
  try {
    const today = new Date().toISOString();
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: QUERY,
        variables: { beginsOn: today, limit: 1000 }
      })
    });

    const { data, errors } = await res.json();
    if (errors) {
      console.error('❌ GraphQL errors:', errors);
      return;
    }

    let events = data.searchEvents.elements || [];

    // Keep only future (or ongoing) events
    const now = new Date();
    events = events.filter(ev =>
      ev.beginsOn && new Date(ev.beginsOn) >= now
    );

    // Keyword filter on title + address text
    events = events.filter(ev => {
      const hay = [
        ev.title,
        ev.physicalAddress?.description || '',
        ev.physicalAddress?.locality   || '',
        ev.onlineAddress               || ''
      ].join(' ').toLowerCase();
      return KEYWORDS.some(kw => hay.includes(kw));
    });

    // Dedupe by id|beginsOn|geom
    const seen = new Set();
    events = events.filter(ev => {
      const geom = ev.physicalAddress?.geom || '';
      const key  = `${ev.id}|${ev.beginsOn}|${geom}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Transform into your desired output shape
    const output = events.map(ev => {
      // parse "lng;lat"
      let lat = null, lng = null;
      if (ev.physicalAddress?.geom) {
        const [lngStr, latStr] = ev.physicalAddress.geom.split(';');
        lng = parseFloat(lngStr);
        lat = parseFloat(latStr);
      }

      const locationParts = [];
      if (ev.physicalAddress?.description) locationParts.push(ev.physicalAddress.description);
      if (ev.physicalAddress?.locality)    locationParts.push(ev.physicalAddress.locality);
      const location = locationParts.join(', ');

      const link = ev.url
        ? ev.url
        : `https://events.pol-rev.com/events/${ev.uuid}`;

      return {
        title:    ev.title,
        date:     ev.beginsOn.slice(0,10),  // "YYYY-MM-DD"
        location,
        lat,
        lng,
        link
      };
    });

    // Write out to your data folder
    const outPath = path.join(__dirname, 'assets/data/mobilizon_events.json');
    fs.writeFileSync(outPath, JSON.stringify({ data: output }, null, 2));
    console.log(`✅ Wrote ${output.length} events to ${outPath}`);
  } catch (err) {
    console.error('❌ Error fetching Mobilizon events:', err);
  }
}

fetchMobilizon();

