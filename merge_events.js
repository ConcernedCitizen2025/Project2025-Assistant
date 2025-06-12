// merge_events.js
const fs   = require('fs');
const path = require('path');

// Helper to read JSON safely
function readJSON(p) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, p), 'utf8'));
}

// 1) Mobilize feed
const mRaw = readJSON('assets/data/mobilize_protests.json').events || [];
console.log(`➤ Loaded ${mRaw.length} Mobilize events`);
const mobilize = mRaw.map(ev => ({
  beginsOn: ev.date,
  lat:       ev.lat,
  lng:       ev.lng,
  location:  ev.location,
  links:     [{ title: ev.title, href: ev.link }],
}));

// 2) Mobilizon feed
const zRaw = readJSON('assets/data/mobilizon_events.json').data || [];
console.log(`➤ Loaded ${zRaw.length} Mobilizon events`);
const mobilizon = zRaw.map(ev => ({
  beginsOn: ev.date,
  lat:       ev.lat,
  lng:       ev.lng,
  location:  ev.location,
  links:     [{ title: ev.title, href: ev.link }],
}));

// 3) Merge Mobilize + Mobilizon
const combinedRaw = [...mobilize, ...mobilizon];
const groups = new Map();

combinedRaw.forEach(ev => {
  let key;
  if (ev.lat != null && ev.lng != null) {
    key = `${ev.beginsOn}|${ev.lat}|${ev.lng}`;
  } else {
    key = `${ev.beginsOn}||no-coord`;
  }

  // ensure the bucket exists
  if (!groups.has(key)) {
    groups.set(key, []);
  }
  // now push into the array
  groups.get(key).push(ev);
});

const merged = Array.from(groups.values()).map(evs => {
  const { beginsOn, lat, lng, location } = evs[0];
  return {
    beginsOn,
    lat,
    lng,
    location,
    links: evs.flatMap(e => e.links),
  };
});

console.log(`➤ After merging Mobilize+Mobilizon: ${merged.length} markers`);


// 4) Load your manual file (no dedupe against merged)
const pRaw = readJSON('assets/data/protest_events.json').data?.searchEvents?.elements || [];
console.log(`➤ Loaded ${pRaw.length} manual events`);
const todayPST = new Date().toLocaleDateString("en-CA", {
  timeZone: "America/Los_Angeles",
  year:    "numeric",
  month:   "2-digit",
  day:     "2-digit"
});
console.log(`➤ Pacific-Time cutoff date: ${todayPST}`);

const manual = pRaw
  .filter(ev => ev.date >= todayPST)   // string compare against PST
  .map(ev => ({
    beginsOn: ev.date,
    lat:       ev.lat  ?? ev.latitude,
    lng:       ev.lng  ?? ev.longitude,
    location:  ev.location,
    links:     [{ title: ev.title, href: ev.link }],
  }));

console.log(`➤ After filtering manual → ${manual.length} to include`);

// 5) Combine merged + manual, then filter out any without coords
const final = merged
  .concat(manual)
  .filter(ev => ev.lat != null && ev.lng != null);
console.log(`✅ Final markers (incl. manual): ${final.length}`);

// 6) Write out
const out = { data: final };
fs.writeFileSync(
  path.join(__dirname,'assets/data/merged_events.json'),
  JSON.stringify(out, null, 2),
  'utf8'
);
console.log(`→ Written assets/data/merged_events.json`);
