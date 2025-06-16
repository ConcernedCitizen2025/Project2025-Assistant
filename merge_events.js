// merge_events.js
const fs    = require('fs');
const path  = require('path');
const fetch = require('node-fetch');

// helper to read JSON
function readJSON(relPath) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, relPath), 'utf8'));
}

// 1) Mobilize feed
const mRaw = readJSON('assets/data/mobilize_protests.json').events || [];
console.log(`➤ Loaded ${mRaw.length} Mobilize events`);
const mobilize = mRaw.map(ev => ({
  beginsOn: ev.date,
  lat:       ev.lat,
  lng:       ev.lng,
  location:  ev.location || "",
  links:     [{ title: ev.title, href: ev.link }],
}));

// 2) Mobilizon feed
const zRaw = readJSON('assets/data/mobilizon_events.json').data || [];
console.log(`➤ Loaded ${zRaw.length} Mobilizon events`);
const mobilizon = zRaw.map(ev => ({
  beginsOn: ev.date,
  lat:       ev.lat,
  lng:       ev.lng,
  location:  ev.location || "",
  links:     [{ title: ev.title, href: ev.link }],
}));

// 3) Merge by exact date+coords
const combinedRaw = [...mobilize, ...mobilizon];
const groups = new Map();
combinedRaw.forEach(ev => {
  const key = ev.lat!=null && ev.lng!=null
    ? `${ev.beginsOn}|${ev.lat}|${ev.lng}`
    : `${ev.beginsOn}||no-coord`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(ev);
});
const merged = Array.from(groups.values()).map(bucket => {
  const { beginsOn, lat, lng, location } = bucket[0];
  return { beginsOn, lat, lng, location, links: bucket.flatMap(e=>e.links) };
});
console.log(`➤ After merging Mobilize+Mobilizon: ${merged.length} markers`);

// 4) Manual file
const pRaw = readJSON('assets/data/protest_events.json')
  .data?.searchEvents?.elements || [];
console.log(`➤ Loaded ${pRaw.length} manual events`);

// PST cutoff for manual
const todayPST = new Date().toLocaleDateString("en-CA", {
  timeZone: "America/Los_Angeles", year:"numeric", month:"2-digit", day:"2-digit"
});
console.log(`➤ PST cutoff date: ${todayPST}`);

const manual = pRaw
  .filter(ev => ev.date >= todayPST)
  .map(ev => ({
    beginsOn: ev.date,
    lat:       ev.lat  ?? ev.latitude,
    lng:       ev.lng  ?? ev.longitude,
    location:  ev.location || "",
    links:     [{ title: ev.title, href: ev.link }],
  }));
console.log(`➤ After filtering manual → ${manual.length} to include`);

// 5) Combine merged + manual
const initial = merged.concat(manual);

// 6) Geocode missing coords using OSM Nominatim (1 req/sec)
async function geocodeAll(arr) {
  const toGeo = arr.filter(e => (e.lat==null||e.lng==null) && e.location);
  console.log(`🔍 Geocoding ${toGeo.length} missing-coord events…`);
  for (const ev of toGeo) {
    try {
      const url = "https://nominatim.openstreetmap.org/search?" +
        `q=${encodeURIComponent(ev.location)}&format=json&limit=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent':'Project2025Assistant/1.0 (github.com/ConcernedCitizen2025)' }
      });
      const hits = await res.json();
      if (hits[0]) {
        ev.lat = parseFloat(hits[0].lat);
        ev.lng = parseFloat(hits[0].lon);
      }
    } catch (err) {
      console.warn("⚠️  Geocode failed for", ev.location, err.message);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}

(async () => {
  await geocodeAll(initial);

  // 7) Final filter: only events with valid coords
  const final = initial.filter(ev => ev.lat!=null && ev.lng!=null);
  console.log(`✅ Final markers (incl. geocoded & manual): ${final.length}`);

  // 8) Write out for your map
  fs.writeFileSync(
    path.join(__dirname,'assets/data/merged_events.json'),
    JSON.stringify({ data: final }, null, 2),
    'utf8'
  );
  console.log("→ Written assets/data/merged_events.json");
})();
