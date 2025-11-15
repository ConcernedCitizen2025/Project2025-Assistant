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

async function writeFileWithRetry(filePath, content, encoding = 'utf8', tries = 6, delayMs = 300) {
  for (let i = 0; i < tries; i++) {
    try {
      const tmp = filePath + '.tmp';
      fs.writeFileSync(tmp, content, { encoding });
      try { fs.renameSync(tmp, filePath); } catch {}
      return;
    } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise(r => setTimeout(r, delayMs * Math.pow(2, i)));
    }
  }
}



/* ----------------------------- DROP ACCOUNTING ----------------------------- */
const dropStats = {
  totalDropped: 0,                       // actual discarded (not recent/upcoming)
  reasons: { OUT_OF_WINDOW: 0, INVALID_DATE: 0 },
  kept:    { GEO: 0, VIRTUAL: 0, NO_DATE: 0 }, // not "dropped" but useful counts
  perSource: {},                         // { mobilize:{...}, mobilizon:{...}, protestapi:{...} }
};

function markSrc(src){
  if (!dropStats.perSource[src]) {
    dropStats.perSource[src] = {
      OUT_OF_WINDOW: 0, INVALID_DATE: 0,
      GEO: 0, VIRTUAL: 0, NO_DATE: 0
    };
  }
}
const ISO_DATE = d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);


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
console.log(`📥 Loaded feeds — mobilize:${mRaw.length} mobilizon:${zRaw.length} protestapi:${pRaw.length}`);


// Mobilize normalizer — supports both RAW and LEGACY-MAPPED shapes
function toPTDateStrFromEpoch(sec) {
  if (!sec) return null;
  return new Date(sec * 1000).toLocaleDateString('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit'
  });
}

// Mobilize normalizer — supports RAW/legacy and string-or-number timeslot epochs
const norm1 = (ev) => {
  const looksRaw =
    Array.isArray(ev.timeslots) ||
    !!ev.browser_url ||
    !!(ev.location && ev.location.location);

  if (looksRaw) {
    // 1) collapse timeslots (accept number or numeric string)
    const slots = Array.isArray(ev.timeslots) ? ev.timeslots : [];
    let minStart = null, maxEnd = null;
    for (const s of slots) {
      const start = Number(s?.start_date);
      const end   = Number(s?.end_date ?? s?.start_date);
      if (Number.isFinite(start)) minStart = (minStart == null) ? start : Math.min(minStart, start);
      if (Number.isFinite(end))   maxEnd   = (maxEnd   == null) ? end   : Math.max(maxEnd, end);
    }
    const begin = Number.isFinite(minStart) ? toPTDateStrFromEpoch(minStart) : null;
    const end   = Number.isFinite(maxEnd)   ? toPTDateStrFromEpoch(maxEnd)   : begin;

    // 2) coords + address
    const loc = ev.location || {};
    const coords = (loc.location && typeof loc.location === 'object') ? loc.location : {};
    const address = [...(loc.address_lines || []), loc.locality, loc.region].filter(Boolean).join(', ');

    // 3) best link + stable Mobilize id
    const href =
      (typeof ev.browser_url === 'string' && ev.browser_url) ||
      (typeof ev.url        === 'string' && ev.url) ||
      (Array.isArray(ev.links) && ev.links[0] && ev.links[0].href) ||
      (typeof ev.link       === 'string' && ev.link) || '';
    const m = /\/event\/(\d+)/.exec(href);
    const _id = m ? Number(m[1]) : null;

    return {
      _id,                        // used for dedupe
      mobilize_id: _id || null,   // <-- add this
      canonical_mobilize_url: _id ? `https://www.mobilize.us/event/${_id}/` : null, // <-- add this
      title: normalizeQuotes(ev.title || ''),
      begin,
      end,
      lat: Number.isFinite(Number(coords.latitude))  ? Number(coords.latitude)  : null,
      lng: Number.isFinite(Number(coords.longitude)) ? Number(coords.longitude) : null,
      location: normalizeQuotes(address || ''),
      links: [{ title: normalizeQuotes(ev.title || ''), href: normalizeQuotes(href) }],
      _src: 'mobilize',
    };

  }

  // LEGACY fallback (unchanged)
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

const all = [
  ...mRaw.map(ev => ({ ...norm1(ev), _src: 'mobilize' })),
  ...zRaw.map(ev => ({ ...norm2(ev), _src: 'mobilizon' })),
  ...pRaw.map(ev => ({ ...norm3(ev), _src: 'protestapi' })),
];

// --- Mobilize ID-based dedupe (keep the most recent by end/begin)
const byId = new Map();
for (const ev of all) {
  if (ev._src === 'mobilize' && ev._id != null) {
    const prev = byId.get(ev._id);
    const curKey  = (ev.end || ev.begin || '').slice(0,10);
    if (!prev) byId.set(ev._id, ev);
    else {
      const prevKey = (prev.end || prev.begin || '').slice(0,10);
      if (curKey > prevKey) byId.set(ev._id, ev);
    }
  }
}
const mobilizeDeduped = Array.from(byId.values());
const others = all.filter(ev => ev._src !== 'mobilize' || ev._id == null);
const allDeduped = [...mobilizeDeduped, ...others];



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

  console.log(`🔍 Geocoding check: candidates=${total}`);

  if (!total) {
    console.log('🔍 Geocoding: nothing to do (all events have coords)');
    return;
  }

  console.log(`🔍 Geocoding ${total} events… (using cache + 1 req/s throttle)`);
  // ... (rest of function unchanged)


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
  try {
    await geocodeMissing(allDeduped);

    // --- Cutoff: keep recent + upcoming (Pacific Time, DST aware)
    // Configure with env LOOKBACK_DAYS (default 30)
    // Example (Windows CMD):  set LOOKBACK_DAYS=45 && node merge_events.js
    const ONE_DAY = 86_400_000;
    const LOOKBACK_DAYS = Math.max(0, parseInt(process.env.LOOKBACK_DAYS || '30', 10) || 30);

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
    // Look back N days (default 30, overridable by env LOOKBACK_DAYS)
    const cutoffDate = new Date(todayPT.getTime() - LOOKBACK_DAYS * ONE_DAY);
    const cutoffStr = cutoffDate.toISOString().slice(0, 10);


    // Timestamp for reports (available early so writers can use it)
    const runTimestampPT =
      new Date().toLocaleDateString('en-US', {
        timeZone: 'America/Los_Angeles',
        month: 'long', day: 'numeric', year: 'numeric',
      }) + ' at ' +
      new Date().toLocaleTimeString('en-US', {
        timeZone: 'America/Los_Angeles',
        hour12: true, hour: '2-digit', minute: '2-digit',
      });

    function beginEndStr(ev) {
      const b = ev.begin ? String(ev.begin).slice(0, 10) : null;
      const e = ev.end   ? String(ev.end).slice(0, 10)   : b;
      return { b, e };
    }

    function isRecentOrUpcoming(ev) {
      const { b, e } = beginEndStr(ev);
      if (!b && !e) return true;
      return (e || b) >= cutoffStr;
    }



    const geo = allDeduped.filter(ev =>
      ev.lat != null &&
      ev.lng != null &&
      isRecentOrUpcoming(ev)
    );

    const virtual = allDeduped.filter(ev =>
      (ev.lat == null || ev.lng == null) &&
      isRecentOrUpcoming(ev)
    )
    .sort((a, b) => {
      const { b: ab, e: ae } = beginEndStr(a);
      const { b: bb, e: be } = beginEndStr(b);
      return (ab || ae || '').localeCompare(bb || be || '');
    });

    console.log(`📊 Summary — cutoff >= ${cutoffStr} — Total: ${allDeduped.length}, Geo kept: ${geo.length}, Virtual kept: ${virtual.length}`);

    (function presenceCheck() {
      const idFrom = (u) => {
        const m = String(u||'').match(/mobilize\.us\/(?:[^\/]+\/)?events?\/(\d+)/);
        return m ? +m[1] : null;
      };
      const idsInMerged = new Set(
        geo.concat(virtual).flatMap(e => (e.links||[]).map(l => idFrom(l.href)).filter(Boolean))
      );
      const want = [867978, 869819, 869820];
      console.log('🔎 presence in merged:', want.map(id => [id, idsInMerged.has(id)]));
    })();



    // -------- Write metadata for the frontend --------
    const meta = {
      lastUpdated: runTimestampPT,   // e.g., "November 14, 2025 at 10:52 AM"
      lookbackDays: LOOKBACK_DAYS,   // numeric
      cutoff: cutoffStr              // ✅ "YYYY-MM-DD" (PT “yesterday” if LOOKBACK_DAYS=1)
    };

    await writeFileWithRetry(path.join(__dirname, 'assets/data/merged_events.json'),
      JSON.stringify({ data: geo }, null, 2), 'utf8');

    await writeFileWithRetry(path.join(__dirname, 'assets/data/virtual_events.json'),
      JSON.stringify({ data: virtual }, null, 2), 'utf8');

    await writeFileWithRetry(
      path.join(__dirname, 'assets/data/events_meta.json'),
      JSON.stringify(meta, null, 2),
      'utf8'
    );


    // Add state code
    allDeduped.forEach((ev) => {
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
    {
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

      // Build per-source buckets exactly like before
      const buckets = {};
      for (const [name, rawArr] of Object.entries(src)) {
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

      // Now write merge_debug.json asynchronously
      (async function debugCounts() {
        const summary = {
          cutoffStr,
          lookbackDays: Math.max(0, parseInt(process.env.LOOKBACK_DAYS || '30', 10) || 30),
          totals: {
            all: all.length,
            geoKept: geo.length,
            virtKept: virtual.length,
          },
          perSource: buckets,
        };

        if (DEBUG) console.log('🧪 merge debug:', JSON.stringify(summary, null, 2));

        try {
          await writeFileWithRetry(
            path.join(__dirname, 'assets/data/merge_debug.json'),
            JSON.stringify(summary, null, 2),
            'utf8'
          );
          console.log('🧪 Wrote assets/data/merge_debug.json for inspection');
        } catch (e) {
          console.warn('Could not write merge_debug.json:', e.message);
        }
      })();
    }
    // -------------------- end DEBUG COUNTS --------------------


    /* -------------------- DISCARD REPORT (JSON + CSV) -------------------- */
    (async function writeDiscardReport() {
      // Helpers
      function beginEndStr(ev) {
        const b = ev.begin ? String(ev.begin).slice(0,10) : null;
        const e = ev.end   ? String(ev.end).slice(0,10)   : b;
        return { b, e };
      }
      function isRecentOrUpcoming(ev) {
        const { b, e } = beginEndStr(ev);
        if (!b && !e) return false;
        return (e || b) >= cutoffStr; // YYYY-MM-DD compare
      }

      // Normalized sources
      const mobilizeN  = mRaw.map(norm1);
      const mobilizonN = zRaw.map(norm2);
      const protestN   = pRaw.map(norm3);

      function perSourceStats(normed) {
        const keptGeo  = normed.filter(e => (e.lat != null && e.lng != null) && isRecentOrUpcoming(e)).length;
        const keptVirt = normed.filter(e => (e.lat == null || e.lng == null) && isRecentOrUpcoming(e)).length;
        const recent   = keptGeo + keptVirt;
        return {
          OUT_OF_WINDOW: normed.length - recent,
          INVALID_DATE: 0,
          GEO: keptGeo,
          VIRTUAL: keptVirt,
          NO_DATE: 0
        };
      }

      const perSource = {
        mobilize:  perSourceStats(mobilizeN),
        mobilizon: perSourceStats(mobilizonN),
        protestapi: perSourceStats(protestN),
      };

      const fetched = {
        mobilize: mRaw.length,
        mobilizon: zRaw.length,
        protestapi: pRaw.length,
        total: mRaw.length + zRaw.length + pRaw.length
      };

      const kept = { geo: geo.length, virtual: virtual.length, noDate: 0 };

      const droppedAgg = Object.values(perSource).reduce((acc, s) => {
        acc.OUT_OF_WINDOW += s.OUT_OF_WINDOW || 0;
        acc.INVALID_DATE  += s.INVALID_DATE  || 0;
        return acc;
      }, { OUT_OF_WINDOW: 0, INVALID_DATE: 0 });

      const dropped = {
        total: droppedAgg.OUT_OF_WINDOW + droppedAgg.INVALID_DATE,
        OUT_OF_WINDOW: droppedAgg.OUT_OF_WINDOW,
        INVALID_DATE: droppedAgg.INVALID_DATE
      };

      const payload = {
        lastUpdated: runTimestampPT,
        cutoffStr,
        lookbackDays: Math.max(0, parseInt(process.env.LOOKBACK_DAYS || '30', 10) || 30),
        fetched, kept, dropped, perSource
      };

      // CSV sampling of OUT_OF_WINDOW
      const rows = ['status,reason,source,title,begin,end,lat,lng,link'];
      function pushDroppedSample(sourceName, normed) {
        for (const ev of normed) {
          const { b, e } = beginEndStr(ev);
          const inWindow = (b || e) && ((e || b) >= cutoffStr);
          if (!inWindow) {
            const link = ev.links && ev.links[0] ? (ev.links[0].href || '') : '';
            rows.push(
              `"DROPPED","OUT_OF_WINDOW","${sourceName.replace(/"/g,'""')}",` +
              `"${(ev.title||'').replace(/"/g,'""')}","${b||''}","${e||''}",` +
              `"${ev.lat ?? ''}","${ev.lng ?? ''}","${link.replace(/"/g,'""')}"`,
            );
          }
        }
      }
      pushDroppedSample('mobilize',  mobilizeN.slice(0, 2000));
      pushDroppedSample('mobilizon', mobilizonN.slice(0, 200));
      pushDroppedSample('protestapi', protestN.slice(0, 200));

      // Write with retry to dodge OneDrive/Excel locks
      const csvPath = path.join(__dirname, 'assets/data/discard_rows.csv');
      const tmpPath = csvPath + '.tmp';

      try {
        await writeFileWithRetry(
          path.join(__dirname, 'assets/data/discard_report.json'),
          JSON.stringify(payload, null, 2),
          'utf8'
        );
        await writeFileWithRetry(tmpPath, rows.join('\n'), 'utf8');
        try { fs.renameSync(tmpPath, csvPath); } catch {}
        console.log('🧾 Wrote assets/data/discard_report.json and discard_rows.csv');
      } catch (e) {
        console.warn('Could not write discard report files:', e.message);
      }
    })(); // <-- close writeDiscardReport IIFE

  } catch (e) {
    console.error('❌ merge_events.js failed:', e);
  }
})(); // <-- close outer async () => IIFE
