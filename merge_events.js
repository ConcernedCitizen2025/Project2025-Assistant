// merge_events.js
const fs    = require('fs');
const path  = require('path');
const fetch = require('node-fetch');

// safe JSON loader
const readJSON = rel => JSON.parse(fs.readFileSync(path.join(__dirname, rel), 'utf8'));

// 1) load raw
const mRaw = readJSON('assets/data/mobilize_protests.json').events || [];
const zRaw = readJSON('assets/data/mobilizon_events.json').data   || [];
const pRaw = readJSON('assets/data/protest_events.json').data
            ?.searchEvents?.elements || [];

// 2) normalize into common shape
const norm1 = ev => ({
  url:      ev.link,
  title:    ev.title,
  begin:    ev.date,
  end:      ev.date,
  lat:      ev.lat,
  lng:      ev.lng,
  location: ev.location
});
const norm2 = ev => {
  const d = ev.beginsOn?.split('T')[0] || '';
  return { url: ev.link, title: ev.title, begin: d, end: d,
           lat: ev.lat, lng: ev.lng, location: ev.location };
};
const norm3 = ev => ({
  url:      ev.link,
  title:    ev.title,
  begin:    ev.date,
  end:      ev.date,
  lat:      ev.lat  ?? ev.latitude,
  lng:      ev.lng  ?? ev.longitude,
  location: ev.location
});

const all = [
  ...mRaw.map(norm1),
  ...zRaw.map(norm2),
  ...pRaw.map(norm3),
];

// 3) group by URL and collapse into a series with first/last date
const series = new Map();
all.forEach(ev => {
  if (!series.has(ev.url)) series.set(ev.url, []);
  series.get(ev.url).push(ev);
});

const merged = Array.from(series.values()).map(arr => {
  arr.sort((a,b)=> a.begin.localeCompare(b.begin));
  return {
    title:    arr[0].title,
    begin:    arr[0].begin,
    end:      arr.length>1 ? arr[arr.length-1].end : arr[0].end,
    lat:      arr[0].lat,
    lng:      arr[0].lng,
    location: arr[0].location,
    links:    arr.map(e=>({ title: e.title, href: e.url }))
  };
});

// 4) geocode missing coords (OSM Nominatim, 1req/sec)
async function geocodeMissing(list) {
  const toGeo = list.filter(e=> (e.lat==null || e.lng==null) && e.location);
  for (const ev of toGeo) {
    try {
      const url = 'https://nominatim.openstreetmap.org/search?format=json&q=' +
                  encodeURIComponent(ev.location);
      const res = await fetch(url, { headers:{ 'User-Agent': 'Project2025Assistant/1.0' }});
      const js  = await res.json();
      if (js[0]) {
        ev.lat = parseFloat(js[0].lat);
        ev.lng = parseFloat(js[0].lon);
      }
    } catch(e){
      console.warn("Geocode failed:", ev.location, e.message);
    }
    await new Promise(r=>setTimeout(r,1000));
  }
}

;(async()=>{
  await geocodeMissing(merged);

  // 5) filter out old & missing
  const today = new Date().toLocaleDateString('en-CA',{
    timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'
  });
  const final = merged.filter(ev =>
    ev.lat!=null && ev.lng!=null && ev.end >= today
  );

  // 6) write out
  fs.writeFileSync(
    path.join(__dirname,'assets/data/merged_events.json'),
    JSON.stringify({ data: final },null,2),
    'utf8'
  );
  console.log(`✅ Written ${final.length} merged events`);
})();
