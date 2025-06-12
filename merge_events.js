// merge_events.js
const fs   = require('fs');
const path = require('path');

// 1) Load & normalize the full Mobilize feed
const mobilizeRawJson = JSON.parse(
  fs.readFileSync(path.join(__dirname,'assets/data/mobilize_protests.json'),'utf8')
);

// mobilizeRawJson.events is where your 48K events live
const mobilizeRaw = Array.isArray(mobilizeRawJson.events)
  ? mobilizeRawJson.events
  : [];

console.log(`➤ Loaded ${mobilizeRaw.length} Mobilize events`);

const mobilize = mobilizeRaw.map(ev => ({
  beginsOn: ev.date,        // "YYYY-MM-DD"
  lat:       ev.lat,
  lng:       ev.lng,
  location:  ev.location,
  title:     ev.title,
  link:      ev.link,
  source:    'mobilize'
}));



// — 2) Load & normalize Mobilizon feed —
const mobilizonRawJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'assets/data/mobilizon_events.json'), 'utf8')
);
const mobilizonRaw = mobilizonRawJson.data || [];
console.log(`➤ Loaded ${mobilizonRaw.length} Mobilizon events`);

const mobilizon = mobilizonRaw.map(ev => ({
  beginsOn: ev.date,        // "YYYY-MM-DD"
  lat:       ev.lat,
  lng:       ev.lng,
  location:  ev.location,
  title:     ev.title,
  link:      ev.link,
  source:    'mobilizon'
}));

// — 3) Combine them —
const all = [...mobilize, ...mobilizon];
console.log(`➤ Total combined events: ${all.length}`);

// — 4) Group by exact date + lat + lng (keep everything without coords separate) —
const groups = new Map();
all.forEach(ev => {
  let key;
  if (ev.lat != null && ev.lng != null) {
    key = `${ev.beginsOn}|${ev.lat}|${ev.lng}`;
  } else {
    key = `no-coord|${ev.source}|${ev.link}`;
  }
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(ev);
});

// diagnostics
const totalGroups     = groups.size;
const duplicateGroups = Array.from(groups.values()).filter(g => g.length > 1).length;
console.log(`➤ Unique keys (markers): ${totalGroups}`);
console.log(`➤ Keys with >1 event (merged duplicates): ${duplicateGroups}`);

// — 5) Build merged array —
const merged = [];
for (let evs of groups.values()) {
  const { beginsOn, lat, lng, location } = evs[0];
  const links = evs.map(e => ({ title: e.title, href: e.link }));
  merged.push({ beginsOn, lat, lng, location, links });
}

// — 6) Write out —
const outPath = path.join(__dirname, 'assets/data/merged_events.json');
fs.writeFileSync(outPath, JSON.stringify({ data: merged }, null, 2), 'utf8');
console.log(`✅ Wrote ${merged.length} markers to ${outPath}`);
