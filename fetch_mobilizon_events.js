// fetch_mobilizon_events.js
const fetch = require('node-fetch'); // npm install node-fetch@2
const fs = require('fs');
const path = require('path');

const API_URL = 'https://events.pol-rev.com/api';

// GraphQL query to get events starting from now
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
    console.log("Fetching Mobilizon events...");
    const today = new Date().toISOString();

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: QUERY,
        variables: { beginsOn: today, limit: 1000 },
      }),
    });

    const { data, errors } = await res.json();
    if (errors) {
      console.error('❌ GraphQL errors:', errors);
      return;
    }

    let events = data.searchEvents.elements || [];
    console.log(`⚡️ Fetched ${events.length} raw Mobilizon events`);

    // Keep only future events
    const now = new Date();
    events = events.filter(ev => ev.beginsOn && new Date(ev.beginsOn) >= now);

    console.log(`⚡️ After removing past events: ${events.length}`);

    // Dedupe by id|beginsOn|geom
    const seen = new Set();
    events = events.filter(ev => {
      const geom = ev.physicalAddress?.geom || '';
      const key = `${ev.id}|${ev.beginsOn}|${geom}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    console.log(`⚡️ After dedupe: ${events.length}`);

    // Transform into your desired output shape
    const output = events.map(ev => {
      let lat = null, lng = null;
      if (ev.physicalAddress?.geom) {
        const [lngStr, latStr] = ev.physicalAddress.geom.split(';');
        lng = parseFloat(lngStr);
        lat = parseFloat(latStr);
      }

      const locationParts = [];
      if (ev.physicalAddress?.description) locationParts.push(ev.physicalAddress.description);
      if (ev.physicalAddress?.locality) locationParts.push(ev.physicalAddress.locality);
      const location = locationParts.join(', ');

      const link = ev.url
        ? ev.url
        : `https://events.pol-rev.com/events/${ev.uuid}`;

      return {
        title: ev.title,
        date: ev.beginsOn.slice(0, 10),
        location,
        lat,
        lng,
        link
      };
    });

    // Write final JSON
    const outPath = path.join(__dirname, 'assets/data/mobilizon_events.json');
    fs.writeFileSync(outPath, JSON.stringify({ data: output }, null, 2), 'utf8');

    console.log(`✅ Wrote ${output.length} Mobilizon events → ${outPath}`);
  } catch (err) {
    console.error('❌ Error fetching Mobilizon events:', err);
  }
}

fetchMobilizon();
