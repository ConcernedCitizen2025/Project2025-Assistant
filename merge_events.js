const DEBUG = false;


// merge_events.js — clean header (NO duplicates above this line)
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch'); // v2.x

// ---- geocode cache (place right after requires)
const CACHE_PATH = path.join(__dirname, 'assets/data/geocode_cache.json');

let GEO_CACHE = {};
try {
  if (fs.existsSync(CACHE_PATH)) {
    GEO_CACHE = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
    console.log(`🗂️  Geocode cache loaded: ${Object.keys(GEO_CACHE).length} entries`);
  }
} catch (e) {
  console.warn('⚠️ Could not load geocode cache:', e.message);
  GEO_CACHE = {};
}

function saveCache() {
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(GEO_CACHE, null, 2), 'utf8');
  } catch (e) {
    console.warn('⚠️ Failed to write geocode cache:', e.message);
  }
}

// ---- helpers you already have (keep ONE copy)
const readJSON = (file) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf8'));

const normalizeQuotes = (str) =>
  str ? str.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"') : '';

// Load raw feeds
const mRaw = readJSON('assets/data/mobilize_protests.json').events || [];
const zRaw = readJSON('assets/data/mobilizon_events.json').data || [];
const pRaw =
  readJSON('assets/data/protest_events.json').data?.searchEvents?.elements || [];

// Mobilize normalizer — supports both RAW and LEGACY-MAPPED shapes
function toPTDateStrFromEpoch(sec) {
  if (!sec) return null;
  return new Date(sec * 1000).toLocaleDateString('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit'
  });
}

const norm1 = (ev) => {
  // Heuristic: RAW has timeslots OR browser_url OR nested coords; legacy doesn’t.
  const looksRaw =
    Array.isArray(ev.timeslots) ||
    !!ev.browser_url ||
    !!(ev.location && ev.location.location);

  if (looksRaw) {
    const slots = Array.isArray(ev.timeslots) ? ev.timeslots : [];
    let minStart = null, maxEnd = null;
    for (const s of slots) {
      if (typeof s.start_date === 'number') {
        minStart = (minStart == null) ? s.start_date : Math.min(minStart, s.start_date);
        const end = (typeof s.end_date === 'number') ? s.end_date : s.start_date;
        maxEnd = (maxEnd == null) ? end : Math.max(maxEnd, end);
      }
    }
    const begin = toPTDateStrFromEpoch(minStart);
    const end   = toPTDateStrFromEpoch(maxEnd);

    const loc = ev.location || {};
    const coords = loc.location || {};
    const address = [
      ...(loc.address_lines || []),
      loc.locality,
      loc.region,
    ].filter(Boolean).join(', ');

    return {
      title: normalizeQuotes(ev.title || ''),
      begin,
      end,
      lat: (coords.latitude != null) ? Number(coords.latitude) : null,
      lng: (coords.longitude != null) ? Number(coords.longitude) : null,
      location: normalizeQuotes(address || ''),
      links: [{ title: normalizeQuotes(ev.title || ''), href: normalizeQuotes(ev.browser_url || '') }],
    };
  }

  // LEGACY-MAPPED shape fallback: {title,date,location,lat,lng,link}
  return {
    title: normalizeQuotes(ev.title || ''),
    begin: ev.date ? String(ev.date).slice(0,10) : null,
    end:   ev.date ? String(ev.date).slice(0,10) : null,
    lat: (ev.lat != null) ? Number(ev.lat) : null,
    lng: (ev.lng != null) ? Number(ev.lng) : null,
    location: normalizeQuotes(ev.location || ''),
    links: [{ title: normalizeQuotes(ev.title || ''), href: normalizeQuotes(ev.link || '') }],
  };
};



// Mobilizon → unified shape (accepts several possible date fields)
const norm2 = (ev) => {
  // prefer explicit "date", else look for "beginsOn"/"start"/"start_date"
  const rawDate =
    ev.date ||
    ev.beginsOn ||
    ev.start ||
    ev.start_date ||
    '';

  // YYYY-MM-DD (handles full ISO too)
  const d = String(rawDate).split('T')[0];

  return {
    title: normalizeQuotes(ev.title),
    begin: d || null,
    end: d || null,
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
// After const all = [...mRaw.map(norm1), ...zRaw.map(norm2), ...pRaw.map(norm3)];
const zMissing = zRaw
  .map(norm2)
  .filter(e => !e.begin);
if (zMissing.length) {
  console.warn('⚠️ Mobilizon items missing date after normalize:', zMissing.slice(0,5));
}


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
  // Build the set needing geocode (no coords but has a location string)
  const toGeo = list.filter(ev => (ev.lat == null || ev.lng == null) && ev.location && String(ev.location).trim().length);
  const total = toGeo.length;
  if (!total) {
    console.log('🔍 Geocoding: nothing to do (all events have coords)');
    return;
  }

  console.log(`🔍 Geocoding ${total} events… (using cache + 1 req/s throttle)`);

  let done = 0;
  let cacheHits = 0;
  let networkHits = 0;
  const PROGRESS_EVERY = 25;   // log progress every N items
  const FLUSH_EVERY = 100;     // write cache to disk every N network hits

  // helper: fetch with timeout
  async function fetchWithTimeout(url, ms = 12000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Project2025Assistant/1.0' }, signal: ctrl.signal });
      return res;
    } finally {
      clearTimeout(t);
    }
  }

  for (const ev of toGeo) {
    const q = String(ev.location).trim();

    // 1) cache hit?
    if (GEO_CACHE[q]) {
      const { lat, lng } = GEO_CACHE[q];
      ev.lat = lat;
      ev.lng = lng;
      cacheHits++;
      done++;
    } else {
      // 2) network request with simple retry
      const url = 'https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&q=' + encodeURIComponent(q);
      let ok = false;
      for (let attempt = 1; attempt <= 2 && !ok; attempt++) {
        try {
          const res = await fetchWithTimeout(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const js = await res.json();
          if (js[0]) {
            ev.lat = parseFloat(js[0].lat);
            ev.lng = parseFloat(js[0].lon);
            GEO_CACHE[q] = { lat: ev.lat, lng: ev.lng };
          } else {
            // leave as missing; cache negative result to avoid re-hitting
            GEO_CACHE[q] = { lat: null, lng: null };
          }
          ok = true;
        } catch (e) {
          console.warn(`⚠️ Geocode attempt ${attempt} failed for "${q}": ${e.message}`);
          // brief backoff before retry
          await new Promise(r => setTimeout(r, 800));
        }
      }

      networkHits++;
      done++;

      // throttle to ~1/sec to be polite
      await new Promise(r => setTimeout(r, 1000));

      // periodic flush
      if (networkHits % FLUSH_EVERY === 0) {
        saveCache();
      }
    }

    // progress log
    if (done % PROGRESS_EVERY === 0 || done === total) {
      const pct = Math.round((done / total) * 100);
      const barWidth = 20;
      const filled = Math.round((pct / 100) * barWidth);
      const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);
      console.log(`⏳ [${bar}] ${pct}% — ${done}/${total} | cache:${cacheHits} net:${networkHits}`);
    }
  }

  // final flush
  saveCache();
  console.log(`✅ Geocoding complete — processed ${total} (cache hits: ${cacheHits}, network: ${networkHits})`);
}


(async () => {
  await geocodeMissing(all);

  // --- Cutoff: keep yesterday + upcoming (Pacific Time, DST aware)
  const ONE_DAY = 86_400_000;

  // ✅ DST-safe PT midnight (fixed)
  function ptMidnightToday() {
    const now = new Date();
    const f = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
    const [y, m, d] = f.format(now).split('-').map(Number);
    // IMPORTANT: month is 0-based for Date.UTC → use (m - 1)
    return new Date(Date.UTC(y, m - 1, d, 8, 0, 0));
  }



  const todayPT = ptMidnightToday();
  const yesterdayPT = new Date(todayPT.getTime() - ONE_DAY);
  const cutoffStr = yesterdayPT.toISOString().slice(0, 10);

  function beginEndStr(ev) {
    const b = ev.begin ? String(ev.begin).slice(0, 10) : null;
    const e = ev.end   ? String(ev.end).slice(0, 10)   : b;
    return { b, e };
  }

  function isRecentOrUpcoming(ev) {
    const { b, e } = beginEndStr(ev);
    // If both dates missing, KEEP it (we'll let the frontend filter)
    if (!b && !e) return true;
    return (e || b) >= cutoffStr; // safe YYYY-MM-DD string compare
  }


  const geo = all.filter(ev =>
    ev.lat != null &&
    ev.lng != null &&
    isRecentOrUpcoming(ev)
  );

  const virtual = all
    .filter(ev =>
      (ev.lat == null || ev.lng == null) &&
      isRecentOrUpcoming(ev)
    )
    .sort((a, b) => {
      const { b: ab, e: ae } = beginEndStr(a);
      const { b: bb, e: be } = beginEndStr(b);
      return (ab || ae || '').localeCompare(bb || be || '');
    });

  console.log(`📊 Summary — cutoff >= ${cutoffStr} — Total: ${all.length}, Geo kept: ${geo.length}, Virtual kept: ${virtual.length}`);

  // Add state code
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

  // -------------------- DEBUG COUNTS (paste above the writes) --------------------
  (function debugCounts() {
    const src = { mobilize: mRaw, mobilizon: zRaw, protestapi: pRaw };

    function beginEndStr(ev) {
      const b = ev.begin ? String(ev.begin).slice(0, 10) : null;
      const e = ev.end   ? String(ev.end).slice(0, 10)   : b;
      return { b, e };
    }
    function isRecentOrUpcoming(ev) {
      const { b, e } = beginEndStr(ev);
      if (!b && !e) return false;
      return (e || b) >= cutoffStr; // YYYY-MM-DD compare
    }

    const buckets = {};
    for (const [name, rawArr] of Object.entries(src)) {
      // Re-normalize exactly as used to build `all`
      let normed;
      if (name === 'mobilize') normed = mRaw.map(norm1);
      else if (name === 'mobilizon') normed = zRaw.map(norm2);
      else normed = pRaw.map(norm3);

      const total = normed.length;
      const recent = normed.filter(isRecentOrUpcoming);
      const withCoords = normed.filter(e => e.lat != null && e.lng != null);
      const keptGeo = normed.filter(e => (e.lat != null && e.lng != null) && isRecentOrUpcoming(e));
      const keptVirt = normed.filter(e => (e.lat == null || e.lng == null) && isRecentOrUpcoming(e));

      buckets[name] = {
        total,
        recent: recent.length,
        withCoords: withCoords.length,
        keptGeo: keptGeo.length,
        keptVirt: keptVirt.length,
        sampleDroppedByDate: normed.filter(e => !isRecentOrUpcoming(e)).slice(0, 3),
        sampleDroppedByCoords: normed.filter(e => isRecentOrUpcoming(e) && (e.lat == null || e.lng == null)).slice(0, 3),
      };
    }

    const summary = {
      cutoffStr,
      totals: {
        all: all.length,
        geoKept: geo.length,
        virtKept: virtual.length,
      },
      perSource: buckets,
    };

    if (DEBUG) console.log('🧪 merge debug:', JSON.stringify(summary, null, 2));
    try {
      fs.writeFileSync(
        path.join(__dirname, 'assets/data/merge_debug.json'),
        JSON.stringify(summary, null, 2),
        'utf8'
      );
      console.log('🧪 Wrote assets/data/merge_debug.json for inspection');
    } catch (e) {
      console.warn('Could not write merge_debug.json:', e.message);
    }
  })();


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

  // Metadata
  const lastUpdated =
    new Date().toLocaleDateString('en-US', {
      timeZone: 'America/Los_Angeles',
      month: 'long', day: 'numeric', year: 'numeric',
    }) + ' at ' +
    new Date().toLocaleTimeString('en-US', {
      timeZone: 'America/Los_Angeles',
      hour12: true, hour: '2-digit', minute: '2-digit',
    });

  fs.writeFileSync(
    path.join(__dirname, 'assets/data/events_meta.json'),
    JSON.stringify({ lastUpdated }, null, 2),
    'utf8'
  );

  console.log(`✅ Wrote ${geo.length} geo-events and ${virtual.length} virtual-events`);
})();

