// Converts a published Google Sheet CSV to /assets/data/videos.json
// Usage in CI: node scripts/sheet_to_videos_json.js "$SHEET_CSV_URL"

const fs = require('fs');
const path = require('path');
const https = require('https');

const csvUrl = process.argv[2];
if (!csvUrl) {
  console.error('Missing CSV URL. Usage: node scripts/sheet_to_videos_json.js "https://docs.google.com/spreadsheets/d/e/2PACX-1vRqJZubNqZCg3bPp0Nt_Loc7govw5PA6eC_7NNHuOJMlyYJF7-XaGtqsICVezq5tElKuJVX6Tbkc2xl/pub?gid=0&single=true&output=csv"');
  process.exit(1);
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// minimal CSV parser covering quotes and commas.
function parseCSV(text) {
  const rows = [];
  let i = 0, field = '', row = [], inQuotes = false;
  while (i < text.length) {
    const c = text[i++];
    if (inQuotes) {
      if (c === '"') {
        if (text[i] === '"') { field += '"'; i++; } // escaped quote
        else inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i] === '\n') i++; // CRLF
        row.push(field); field = '';
        if (row.some(col => col !== '')) rows.push(row);
        row = [];
      } else {
        field += c;
      }
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function toJSON(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map(h => h.trim().toLowerCase());
  const idx = (name) => headers.indexOf(name);
  const out = [];
  const seen = new Set();

  for (let r = 1; r < rows.length; r++) {
    const cols = rows[r];
    const get = (name) => {
      const j = idx(name);
      return j >= 0 ? (cols[j] || '').trim() : '';
    };
    const type = get('type').toLowerCase();
    const url = get('url');
    if (!url) continue;
    if (seen.has(url)) continue;
    seen.add(url);

    out.push({
      type,
      url,
      title: get('title') || undefined,
      posted: get('posted') || undefined,
      source: get('source') || undefined,
      // split tags by comma, trim, drop empties
      ...(get('tags') ? { tags: get('tags').split(',').map(s => s.trim()).filter(Boolean) } : {})
    });
  }

  // sort newest first if posted present
  out.sort((a,b) => String(b.posted||'').localeCompare(String(a.posted||'')));
  return out.slice(0, 200); // keep it reasonable
}

(async () => {
  try {
    const csv = await fetchText(csvUrl);
    const rows = parseCSV(csv);
    const items = toJSON(rows);
    const outPath = path.join(__dirname, '..', 'assets', 'data', 'videos.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify({ items }, null, 2), 'utf8');
    console.log(`✅ wrote ${items.length} items → ${outPath}`);
  } catch (err) {
    console.error('❌ sheet_to_videos_json:', err.message);
    process.exit(1);
  }
})();
