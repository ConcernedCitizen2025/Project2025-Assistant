// merge_events.js
const fs    = require('fs');
const path  = require('path');
const fetch = require('node-fetch');

// helper to read JSON
const readJSON = file =>
  JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf8'));

// geocode any event with a location string but no coords
async function geocodeMissing(list) {
  const toGeo = list.filter(ev =>
    (ev.lat == null || ev.lng == null) && ev.location
  );
  console.log(`🔍 Geocoding ${toGeo.length} missing-coord events…`);
  for (const ev of toGeo) {
    try {
      const url = 'https://nominatim.openstreetmap.org/search?format=json&q=' +
                  encodeURIComponent(ev.location);
      const res = await fetch(url, { headers: { 'User-Agent': 'Project2025Assistant/1.0' } });
      const js  = await res.json();
      if (js[0]) {
        ev.lat = parseFloat(js[0].lat);
        ev.lng = parseFloat(js[0].lon);
      }
    } catch (err) {
      console.warn('Geocode failed:', ev.location, err.message);
    }
    await new Promise(r => setTimeout(r, 1000)); // throttle 1/sec
  }
}

;(async () => {
  // 1) load raw
  const mRaw = readJSON('assets/data/mobilize_protests.json').events   || [];
  const zRaw = readJSON('assets/data/mobilizon_events.json').data      || [];
  const pRaw = readJSON('assets/data/protest_events.json').data
              ?.searchEvents?.elements || [];

  // 2) normalize into common shape
  const norm1 = ev => ({
    title:    ev.title,
    begin:    ev.date,
    end:      ev.date,
    lat:      ev.lat,
    lng:      ev.lng,
    location: ev.location,
    links:    [{ title: ev.title, href: ev.link }]
  });
  const norm2 = ev => {
    const d = (ev.beginsOn || '').split('T')[0];
    return {
      title:    ev.title,
      begin:    d,
      end:      d,
      lat:      ev.lat,
      lng:      ev.lng,
      location: ev.location,
      links:    [{ title: ev.title, href: ev.link }]
    };
  };
  const norm3 = ev => ({
    title:    ev.title,
    begin:    ev.date,
    end:      ev.date,
    lat:      ev.lat  ?? ev.latitude,
    lng:      ev.lng  ?? ev.longitude,
    location: ev.location,
    links:    [{ title: ev.title, href: ev.link }]
  });

  const all = [
    ...mRaw.map(norm1),
    ...zRaw.map(norm2),
    ...pRaw.map(norm3),
  ];

  // 3) geocode any missing coords (city, state, etc.)
  await geocodeMissing(all);

  // PST today for filtering
  const today = new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Los_Angeles',
    year:    'numeric',
    month:   '2-digit',
    day:     '2-digit'
  });

  // 4) split geo-coded vs virtual-only upcoming
  const geo = all.filter(ev =>
    ev.lat != null &&
    ev.lng != null &&
    ev.end >= today
  );
  const virtual = all.filter(ev =>
    (ev.lat == null || ev.lng == null) &&
    ev.end >= today
  ).sort((a, b) => a.begin.localeCompare(b.begin));

  // 5) write out both JSONs
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

  console.log(`✅ Wrote ${geo.length} geo-events and ${virtual.length} virtual-events`);
})();
