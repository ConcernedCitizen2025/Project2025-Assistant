// merge_events.js
const fs   = require('fs');
const path = require('path');

// safe JSON loader
function readJSON(file) {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, file), 'utf8')
  );
}

// load and normalize
const mRaw = readJSON('assets/data/mobilize_protests.json').events || [];
const zRaw = readJSON('assets/data/mobilizon_events.json').data || [];
const pRaw = readJSON('assets/data/protest_events.json').data
            ?.searchEvents?.elements || [];

// helper to stringify ISO‐dates to YYYY-MM-DD
const toDate = d => d.split('T')[0];

// build unified list
const all = [
  ...mRaw.map(ev => ({
    url:   ev.link,
    date:  ev.date,
    lat:   ev.lat,
    lng:   ev.lng,
    location: ev.location,
    title: ev.title
  })),
  ...zRaw.map(ev => ({
    url:   ev.link,
    date:  toDate(ev.beginsOn),
    lat:   ev.lat,
    lng:   ev.lng,
    location: ev.location,
    title: ev.title
  })),
  ...pRaw.map(ev => ({
    url:   ev.link,
    date:  ev.date,
    lat:   ev.lat  ?? ev.latitude,
    lng:   ev.lng  ?? ev.longitude,
    location: ev.location,
    title: ev.title
  }))
];

// group by URL
const series = new Map();
all.forEach(ev => {
  if (!series.has(ev.url)) series.set(ev.url, []);
  series.get(ev.url).push(ev);
});

// collapse groups
const merged = Array.from(series.values()).map(events => {
  // sort ascending
  events.sort((a,b)=>a.date.localeCompare(b.date));
  const begin = events[0].date;
  const end   = events.length > 1
    ? events[events.length-1].date
    : begin;

  return {
    begin,      // first date
    end,        // last date (same for single)
    lat: events[0].lat,
    lng: events[0].lng,
    location: events[0].location,
    title: events[0].title,
    links: events.map(e=>({ title: e.title, href: e.url }))
  };
});

// today in PST
const today = new Date().toLocaleDateString('en-CA', {
  timeZone:'America/Los_Angeles', year:'numeric', month:'2-digit', day:'2-digit'
});

// keep only still‐upcoming
const final = merged.filter(ev => ev.end >= today);

console.log(`✅ ${final.length} markers (collapsed series)`);
fs.writeFileSync(
  path.join(__dirname,'assets/data/merged_events.json'),
  JSON.stringify({ data: final },null,2),
  'utf8'
);
