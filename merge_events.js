const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Helper to read JSON files
const readJSON = (file) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf8'));

// Normalize smart quotes → ASCII
const normalizeQuotes = (str) =>
  str ? str.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"') : '';

// Load raw feeds
const mRaw = readJSON('assets/data/mobilize_protests.json').events || [];
const zRaw = readJSON('assets/data/mobilizon_events.json').data || [];
const pRaw =
  readJSON('assets/data/protest_events.json').data?.searchEvents?.elements || [];

// Normalize into a consistent shape
const norm1 = (ev) => ({
  title: normalizeQuotes(ev.title),
  begin: ev.date,
  end: ev.date,
  lat: ev.lat,
  lng: ev.lng,
  location: normalizeQuotes(ev.location),
  links: [{ title: normalizeQuotes(ev.title), href: normalizeQuotes(ev.link) }],
});

const norm2 = (ev) => {
  const d = (ev.beginsOn || '').split('T')[0];
  return {
    title: normalizeQuotes(ev.title),
    begin: d,
    end: d,
    lat: ev.lat,
    lng: ev.lng,
    location: normalizeQuotes(ev.location),
    links: [{ title: normalizeQuotes(ev.title), href: normalizeQuotes(ev.link) }],
  };
};

const norm3 = (ev) => ({
  title: normalizeQuotes(ev.title),
  begin: ev.date,
  end: ev.date,
  lat: ev.lat ?? ev.latitude,
  lng: ev.lng ?? ev.longitude,
  location: normalizeQuotes(ev.location),
  links: [{ title: normalizeQuotes(ev.title), href: normalizeQuotes(ev.link) }],
});

const all = [...mRaw.map(norm1), ...zRaw.map(norm2), ...pRaw.map(norm3)];

// Collapse "address is private" to City, ST
all.forEach((ev) => {
  if (
    typeof ev.location === 'string' &&
    ev.location.toLowerCase().includes('address is private')
  ) {
    const parts = ev.location.split(',').map((s) => s.trim());
    if (parts.length >= 2) {
      ev.location = parts.slice(-2).join(', ');
    }
  }
});

// Geocode missing coords
async function geocodeMissing(list) {
  const toGeo = list.filter((ev) => (ev.lat == null || ev.lng == null) && ev.location);
  console.log(`🔍 Geocoding ${toGeo.length} missing-coord events…`);
  for (const ev of toGeo) {
    try {
      const url =
        'https://nominatim.openstreetmap.org/search?format=json' +
        '&countrycodes=us' +
        '&q=' +
        encodeURIComponent(ev.location);
      const res = await fetch(url, { headers: { 'User-Agent': 'Project2025Assistant/1.0' } });
      const js = await res.json();
      if (js[0]) {
        ev.lat = parseFloat(js[0].lat);
        ev.lng = parseFloat(js[0].lon);
      }
    } catch (err) {
      console.warn('⚠️ Geocode failed for', ev.location, err.message);
    }
    await new Promise((r) => setTimeout(r, 1000)); // throttle
  }
}

(async () => {
  await geocodeMissing(all);

// --- Cutoff: keep events whose end/begin is on/after TWO DAYS AGO (Pacific time)
const ONE_DAY = 86_400_000;
const nowUtc = new Date();
const utcMillis = nowUtc.getTime() + nowUtc.getTimezoneOffset() * 60000;
// PDT offset ~420 min (ok for current season)
const PT_OFFSET_MIN = 420;
const todayPT = new Date(utcMillis - PT_OFFSET_MIN * 60000);
todayPT.setHours(0, 0, 0, 0);
const cutoffDate = new Date(todayPT.getTime() - 2 * ONE_DAY);
const cutoffStr = cutoffDate.toISOString().slice(0, 10);

// Split into geo-coded vs virtual-only, ONLY applying the 2-day date rule
const geo = all.filter(ev =>
  ev.lat != null &&
  ev.lng != null &&
  ((ev.end || ev.begin || '') >= cutoffStr)
);

const virtual = all
  .filter(ev =>
    (ev.lat == null || ev.lng == null) &&
    ((ev.end || ev.begin || '') >= cutoffStr)
  )
  .sort((a, b) => a.begin.localeCompare(b.begin));

console.log(`📊 Summary — Total: ${all.length}, Geo: ${geo.length}, Virtual: ${virtual.length}`);

// Add state code for convenience (propagates because objects are shared)
all.forEach((ev) => {
  if (typeof ev.location === 'string') {
    const parts = ev.location.split(',');
    const last = parts[parts.length - 1].trim();
    const st = last.split(' ').pop().toUpperCase();
    ev.state = st.length === 2 ? st : 'OTHER';
  } else {
    ev.state = 'OTHER';
  }
});

// Write merged files
fs.writeFileSync(
  path.join(__dirname, 'assets/data/merged_events.json'),
  JSON.stringify({ data: geo }, null, 2),
  'utf8'
);

fs.writeFileSync(
  path.join(__dirname, 'assets/data/virtual_events.json'),
  JSON.stringify({ data: virtual }, null, 2),
  'utf8'
);

// Metadata (rename var to avoid 'now' name clash elsewhere)
const nowPTLabel =
  new Date().toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }) +
  ' at ' +
  new Date().toLocaleTimeString('en-US', {
    timeZone: 'America/Los_Angeles',
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
  });

fs.writeFileSync(
  path.join(__dirname, 'assets/data/events_meta.json'),
  JSON.stringify({ lastUpdated: nowPTLabel }, null, 2),
  'utf8'
);

console.log(`✅ Wrote ${geo.length} geo-events and ${virtual.length} virtual-events`);
})(); // ← close the IIFE you opened earlier
