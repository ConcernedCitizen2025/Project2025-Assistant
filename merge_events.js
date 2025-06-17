// merge_events.js
const fs   = require('fs');
const path = require('path');

// helper to read JSON files
function readJSON(relPath) {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, relPath), 'utf8')
  );
}

// 1) Load raw feeds
const mRaw = readJSON('assets/data/mobilize_protests.json').events || [];
const zRaw = readJSON('assets/data/mobilizon_events.json').data    || [];
const pRaw = readJSON('assets/data/protest_events.json').data
            ?.searchEvents?.elements || [];

// 2) Normalize all events into a common shape
const all = [
  // Mobilize.us events
  ...mRaw.map(ev => ({
    title:    ev.title,
    begin:    ev.date,
    end:      ev.date,
    lat:      ev.lat,
    lng:      ev.lng,
    location: ev.location,
    links:    [{ title: ev.title, href: ev.link }],
  })),

  // Mobilizon events (use beginsOn if present)
  ...zRaw
    .filter(ev => ev.beginsOn || ev.date)
    .map(ev => {
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

  // Manual events
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

// 3) Compute "today" in PST for filtering
const today = new Date().toLocaleDateString('en-CA', {
  timeZone: 'America/Los_Angeles',
  year:     'numeric',
  month:    '2-digit',
  day:      '2-digit'
});

// 4) Split into geo‐coded vs. virtual only
const geoEvents = all.filter(ev =>
  ev.lat  != null &&
  ev.lng  != null &&
  ev.end  >= today
);

const virtualEvents = all
  .filter(ev =>
    (ev.lat == null || ev.lng == null) &&
    ev.end >= today
  )
  // drop any with no valid link
  .filter(ev =>
    ev.links.some(l => typeof l.href === 'string' && l.href.trim())
  )
  .sort((a, b) => a.begin.localeCompare(b.begin));

// 5) Write out both JSON files
fs.writeFileSync(
  path.join(__dirname, 'assets/data/merged_events.json'),
  JSON.stringify({ data: geoEvents }, null, 2),
  'utf8'
);
fs.writeFileSync(
  path.join(__dirname, 'assets/data/virtual_events.json'),
  JSON.stringify({ data: virtualEvents }, null, 2),
  'utf8'
);
console.log(`✅ ${geoEvents.length} geo and ${virtualEvents.length} virtual events written`);

