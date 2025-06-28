// fetch_mobilizon_events.js
const fetch = require('node-fetch');    // npm install node-fetch@2
const fs    = require('fs');
const path  = require('path');

// your protest-related keywords (lowercase)
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
];


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

