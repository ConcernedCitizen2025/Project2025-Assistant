// scripts/smoke_norm.js
const raw = (require('../assets/data/mobilize_protests.json').events) || [];
const want = [867978, 869819, 869820];

const toPT = s => new Date(s * 1000).toLocaleDateString('en-CA', {
  timeZone: 'America/Los_Angeles'
});
const getById = (id) => raw.find(e => String(e.browser_url || e.url || '').includes('/event/' + id));

function normalizeMobilize(ev) {
  const slots = Array.isArray(ev?.timeslots) ? ev.timeslots : [];
  let min = null, max = null;
  for (const s of slots) {
    if (typeof s.start_date === 'number') {
      min = (min == null) ? s.start_date : Math.min(min, s.start_date);
      const end = (typeof s.end_date === 'number') ? s.end_date : s.start_date;
      max = (max == null) ? end : Math.max(max, end);
    }
  }
  const begin = min ? toPT(min) : null;
  const end   = max ? toPT(max) : begin;

  const loc = ev?.location || {};
  const coords = loc.location || {};

  const href =
    (typeof ev.browser_url === 'string' && ev.browser_url) ||
    (typeof ev.url        === 'string' && ev.url) ||
    (Array.isArray(ev.links) && ev.links[0] && ev.links[0].href) ||
    (typeof ev.link       === 'string' && ev.link) ||
    '';

  const m = /\/event\/(\d+)/.exec(href);
  const _id = m ? Number(m[1]) : null;

  return {
    _id,
    title: ev.title,
    begin,
    end,
    lat: (Number.isFinite(coords.latitude) ? coords.latitude : null),
    lng: (Number.isFinite(coords.longitude) ? coords.longitude : null),
    href
  };
}

const cutoff = '2025-11-13';
const keep = ev => {
  const b = (ev.begin || '').slice(0,10);
  const e = (ev.end   || ev.begin || '').slice(0,10);
  return !!(e || b) && ((e || b) >= cutoff);
};

for (const id of want) {
  const rawEv = getById(id);
  if (!rawEv) { console.log(id, 'MISSING RAW'); continue; }
  const n = normalizeMobilize(rawEv);
  console.log(id, n, '=> keep?', keep(n));
}
