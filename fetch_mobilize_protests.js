// fetch_mobilize_protests.js — robust global pull since “yesterday” (PT)
// - full pagination with cursor
// - retries on 429/5xx with exponential backoff (and jitter)
// - outputs RAW events to assets/data/mobilize_protests.json

const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const DEBUG = false;

// Add this helper near the top (below constants)
function buildBaseUrlSince(sinceEpoch) {
  const p = new URLSearchParams();
  p.set("per_page", "200");
  p.set("timeslot_start", `gte_${sinceEpoch}`);
  return `${BASE}?${p.toString()}`;
}

// Helper: figure out the next URL from Mobilize response
function determineNextUrl(json, sinceEpoch) {
  const next = json?.next ?? json?.links?.next ?? null;
  const nextCursor =
    json?.next_cursor ?? json?.links?.next_cursor ?? null;

  if (typeof next === "string" && next.length) {
    // Sometimes Mobilize returns a FULL URL here — use it as-is.
    if (/^https?:\/\//i.test(next)) return next;

    // Sometimes it returns a plain cursor token here
    const base = buildBaseUrlSince(sinceEpoch);
    return `${base}&cursor=${encodeURIComponent(next)}`;
  }

  if (typeof nextCursor === "string" && nextCursor.length) {
    const base = buildBaseUrlSince(sinceEpoch);
    return `${base}&cursor=${encodeURIComponent(nextCursor)}`;
  }

  return null; // no more pages
}

function extractIdFromAny(ev) {
  if (typeof ev?.id === 'number') return ev.id;
  const u = ev?.browser_url || ev?.url || ev?.link || '';
  const m = /\/event\/(\d+)/.exec(u);
  return m ? Number(m[1]) : null;
}

async function fetchEventById(id) {
  const url = `https://api.mobilize.us/v1/events/${id}`;
  for (let tries = 0; tries < 4; tries++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Project2025Assistant/1.0' } });
      if (res.ok) {
        const js = await res.json();
        const ev = js?.data;
        if (ev && (ev.visibility === 'PUBLIC' || !ev.visibility)) return ev;
        return null; // not public or missing
      }
      if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
        await new Promise(r => setTimeout(r, 2000 * (tries + 1)));
        continue;
      }
      console.warn(`hydrate: ${id} → HTTP ${res.status}`);
      return null;
    } catch (e) {
      await new Promise(r => setTimeout(r, 1500 * (tries + 1)));
    }
  }
  return null;
}

async function hydrateSpecificIds(ids, arr) {
  const have = new Set(arr.map(extractIdFromAny).filter(Boolean));
  const added = [];
  for (const id of ids) {
    if (have.has(id)) continue;
    const ev = await fetchEventById(id);
    if (ev) {
      arr.push(ev);
      added.push(id);
      have.add(id);
      // be a little polite
      await new Promise(r => setTimeout(r, 250));
    } else {
      console.warn(`hydrate: ${id} not retrievable or not public`);
    }
  }
  if (added.length) console.log(`🔧 hydrated missing IDs: ${added.join(', ')}`);
}


// PT “yesterday” at 00:00:00 → epoch seconds
function ptMidnightYesterdayEpoch() {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const now = new Date();
  const [y, m, d] = f.format(now).split("-").map(Number);
  // Create PT midnight today by using UTC with +08:00 offset (PST) / +07:00 (PDT)
  // We don’t need to perfectly compute DST here—yesterday window is plenty lenient.
  // Easiest is to just construct today PT date and subtract one day in ms:
  const todayPT = new Date(Date.UTC(y, m - 1, d, 8, 0, 0));
  const yestPT = new Date(todayPT.getTime() - 24 * 60 * 60 * 1000);
  return Math.floor(yestPT.getTime() / 1000);
}

const BASE = "https://api.mobilize.us/v1/events";
const PER_PAGE = 200;

// polite jittered sleep
const sleep = (ms) =>
  new Promise((r) => setTimeout(r, ms + Math.floor(Math.random() * 250)));

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Project2025Assistant/1.0" },
  });
  return { ok: res.ok, status: res.status, json: res.ok ? await res.json() : null };
}

// REPLACE your mobilizePager with this one
async function mobilizePager({ sinceEpoch }) {
  console.log(`⏱️  Mobilize cutoff (PT “yesterday”): epoch ${sinceEpoch}`);
  console.log("📥 Fetching ALL orgs since cutoff (global feed) …");

  let nextUrl = buildBaseUrlSince(sinceEpoch); // start at page 1
  let tries = 0;
  let page = 0;
  let total = 0;
  const out = [];

  while (nextUrl) {
    page++;

    const res = await fetch(nextUrl, {
      headers: { "User-Agent": "Project2025Assistant/1.0" },
    }).catch((e) => ({ ok: false, status: 0, _err: e }));

    if (!res.ok) {
      const status = res.status || 0;
      if (status === 429 || (status >= 500 && status <= 599) || status === 0) {
        // backoff (longer for 429)
        const base = status === 429 ? 20000 : 3000;
        const wait = Math.min(base * Math.pow(1.8, tries), 120000);
        console.warn(
          `⚠️ Mobilize ${status || "net"} on page ${page}. Retrying same URL in ~${Math.round(
            wait / 1000
          )}s …`
        );
        tries++;
        await new Promise((r) => setTimeout(r, wait + Math.floor(Math.random() * 250)));
        page--; // retry same page
        continue;
      }
      throw new Error(`Mobilize error ${status} for ${nextUrl}`);
    }

    const json = await res.json();
    tries = 0;

    const data = json?.data || json?.events || [];
    total += data.length;
    out.push(...data);
    console.log(`  page ${page}: +${data.length} (total ${total})`);

    // figure out the next URL (full URL or rebuilt with cursor)
    nextUrl = determineNextUrl(json, sinceEpoch);

    // polite pacing
    await new Promise((r) => setTimeout(r, 350 + Math.floor(Math.random() * 200)));
  }

  return out;
}

async function main() {
  const sinceEpoch = ptMidnightYesterdayEpoch();

  const raw = await mobilizePager({ sinceEpoch });

  const MUST_HAVE = [867978, 869819, 869820];
  await hydrateSpecificIds(MUST_HAVE, raw); // <-- hydrate INTO raw

  // …then write mobilize_protests.json as you already do



  console.log(`✅ Completed fetch: ${raw.length} raw Mobilize events`);

  const outPath = path.join(__dirname, "assets/data/mobilize_protests.json");
  fs.writeFileSync(outPath, JSON.stringify({ events: raw }, null, 2), "utf8");
  const sizeKB = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`✅ Written RAW Mobilize feed (${raw.length} items, ${sizeKB} KB) → ${outPath}`);

  // sanity: show max event id we captured
  const getUrl = (e) => e.browser_url || e.url || e.link || "";
  const ids = raw
    .map((e) => {
      const m = /\/event\/(\d+)/.exec(getUrl(e));
      return m ? +m[1] : NaN;
    })
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);
  const maxId = ids.length ? ids[ids.length - 1] : null;
  console.log("ℹ️  max event id:", maxId);

  // quick presence check for a few known IDs (NoKings examples you gave)
  const wanted = [867978, 869819, 869820];
  const present = new Set(
    raw
      .map((e) => /\/event\/(\d+)/.exec(getUrl(e)))
      .filter(Boolean)
      .map((m) => +m[1])
  );
  wanted.forEach((id) =>
    console.log(present.has(id) ? `✅ ${id} present` : `⚠️ ${id} not present in raw`)
  );
}

main().catch((e) => {
  console.error("💥 fetch_mobilize_protests failed:", e);
  process.exit(1);
});
