// merge_events.js
const fs   = require('fs');
const path = require('path');

// safe JSON loader
function readJSON(rel) {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, rel), 'utf8')
  );
}

// 1) load all three sources
const mRaw = readJSON('assets/data/mobilize_protests.json').events    || [];
const zRaw = readJSON('assets/data/mobilizon_events.json').data       || [];
const pRaw = readJSON('assets/data/protest_events.json').data
            ?.searchEvents?.elements                                  || [];

// 2) normalize into a flat array with url, date, coords, location, title
const all = [
  ...mRaw.map(ev => ({
    url:      ev.link,
    date:     ev.date,
    lat:      ev.lat,
    lng:      ev.lng,
    location: ev.location,
    title:    ev.title
  })),
  ...zRaw.map(ev => ({
    url:      ev.link,
    date:     ev.date,
    lat:      ev.lat,
    lng:      ev.lng,
    location: ev.location,
    title:    ev.title
  })),
  ...pRaw.map(ev => ({
    url:      ev.link,
    date:     ev.date,
    lat:      ev.lat  ?? ev.latitude,
    lng:      ev.lng  ?? ev.longitude,
    location: ev.location,
    title:    ev.title
  }))
];

// 3) group by url+coords
const groups = new Map();
all.forEach(ev => {
  const key = `${ev.url}|${ev.lat}|${ev.lng}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(ev);
});

// 4) collapse each group into one marker {date, endDate, coords, …}
const merged = Array.from(groups.values()).map(events => {
  events.sort((a,b) => a.date.localeCompare(b.date));
  return {
    date:     events[0].date,
    endDate:  events[events.length - 1].date,
    lat:      events[0].lat,
    lng:      events[0].lng,
    location: events[0].location,
    title:    events[0].title,
    links:    // unique URLs
      [...new Set(events.map(e => e.url))]
        .map(url => {
          const e = events.find(x => x.url === url);
          return { title: e.title, href: url };
        })
  };
});

// 5) filter out anything whose endDate is < today (PST)
const today = new Date().toLocaleDateString('en-CA', {
  timeZone: 'America/Los_Angeles',
  year:     'numeric',
  month:    '2-digit',
  day:      '2-digit'
});
const final = merged.filter(ev => ev.endDate >= today);

console.log(`✅ ${final.length} merged markers`);
fs.writeFileSync(
  path.join(__dirname, 'assets/data/merged_events.json'),
  JSON.stringify({ data: final }, null, 2),
  'utf8'
);
console.log('→ assets/data/merged_events.json written');
