// merge_events.js
const fs    = require('fs');
const path  = require('path');
const fetch = require('node-fetch');

// helper to read JSON
function readJSON(rel) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, rel), 'utf8'));
}

// 1) load raw feeds
const mRaw = readJSON('assets/data/mobilize_protests.json').events || [];
const zRaw = readJSON('assets/data/mobilizon_events.json').data    || [];
const pRaw = readJSON('assets/data/protest_events.json').data
            ?.searchEvents?.elements || [];

// 2) normalize into a single list
const all = [
  ...mRaw.map(ev => ({
    title:    ev.title,
    begin:    ev.date,
    end:      ev.date,
    lat:      ev.lat,
    lng:      ev.lng,
    location: ev.location,
    links:    [{ title: ev.title, href: ev.link }],
  })),
  // ← UPDATED: only map items with beginsOn (or date) present
  ...zRaw
    .filter(ev => ev.beginsOn || ev.date)
    .map(ev => {
      // use beginsOn if available, otherwise date
      const ts = ev.beginsOn || ev.date;
      const d  = ts.split('T')[0];
      return {
        title:    ev.title,
        begin:    d,
        end:      d,
        lat:      ev.lat,
        lng:      ev.lng,
        location: ev.location,
        links:    [{ title: ev.title, href: ev.link }],
      };
    }),
  ...pRaw.map(ev => ({
    title:    ev.title,
    begin:    ev.date,
    end:      ev.date,
    lat:      ev.lat  ?? ev.latitude,
    lng:      ev.lng  ?? ev.longitude,
    location: ev.location,
    links:    [{ title: ev.title, href: ev.link }],
  }))
];


// compute "today" in PST
const today = new Date().toLocaleDateString('en-CA', {
  timeZone: 'America/Los_Angeles',
  year:    'numeric',
  month:   '2-digit',
  day:     '2-digit'
});

// 3) split into geo-coded vs. virtual‐only
const geo = all.filter(ev =>
  ev.lat != null && ev.lng != null && ev.end >= today
);

const virtual = all
  .filter(ev =>
    (ev.lat == null || ev.lng == null) && ev.end >= today
  )
  .sort((a, b) => a.begin.localeCompare(b.begin));

// 4) write out both JSONs
fs.writeFileSync(
  path.join(__dirname,'assets/data/merged_events.json'),
  JSON.stringify({ data: geo }, null, 2),
  'utf8'
);
fs.writeFileSync(
  path.join(__dirname,'assets/data/virtual_events.json'),
  JSON.stringify({ data: virtual }, null, 2),
  'utf8'
);

console.log(`✅ Wrote ${geo.length} geo-events + ${virtual.length} virtual events`);
