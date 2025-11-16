// assets/js/california-protest-map.js — COMPLETE REWRITE
// --------------------------------------------------------------------
// Adds: date range filter bar (All/30/15/7/3/Today + Custom), live count
// persistence via localStorage, robust duplicate avoidance, and virtual toggle.
// --------------------------------------------------------------------

/** 0) FIRE ONLY ONCE — guard against double injection (duplicate <script> tags) */


if (window.__P25A_MAP_LOADED__) {
  console.debug("california protest map.js: already initialized → skip");
} else {
  window.__P25A_MAP_LOADED__ = true;

  // Declare DEBUG *inside* the guarded block so it never redeclares
  const DEBUG = false; // flip to true when you want verbose logs

  document.addEventListener("DOMContentLoaded", () => {
    /* ---------------------------------------------------------------- 1. DOM refs */
    const mapEl = document.getElementById("california-map");
    if (!mapEl) return console.error("Map container #california-map not found!");
    // ensure the map has height
    if (!mapEl.style.height || mapEl.offsetHeight < 100) {
      mapEl.style.height = '600px';
    }
    // global error tracer
    window.addEventListener('error', e => console.error('[map global error]', e.message, e.error));
    console.log('[map] DOM ready, script alive');


    /* ---------------------------------------------------------------- 2. Helpers */
    const ONE_DAY = 86_400_000;
    const PST_OFFSET = 420; // PST is UTC-8 (480), PDT is UTC-7 (420) in minutes
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const today = new Date(utc - PST_OFFSET * 60000); // Convert to PT
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today.getTime() - ONE_DAY);
    const fmt = (d)=>d.toISOString().slice(0,10);
    const todayStr = fmt(today);
    const yesterdayStr = fmt(yesterday);

    // ---- Load merged data with cache-busting + server cutoff guard
    async function loadEventsSafe() {
      const meta = await fetch('assets/data/events_meta.json?cb=' + Date.now())
        .then(r => r.ok ? r.json() : {})
        .catch(() => ({}));

      const isISO = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

      // Prefer server-provided ISO cutoff; otherwise compute PT "yesterday"
      let cutoffStr = isISO(meta.cutoff) ? meta.cutoff : null;
      if (!cutoffStr) {
        const f = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit'
        });
        const [y, m, d] = f.format(new Date()).split('-').map(Number);
        const todayPT = new Date(Date.UTC(y, m - 1, d, 8, 0, 0)); // PT midnight
        const yest = new Date(todayPT.getTime() - 86_400_000);
        cutoffStr = yest.toISOString().slice(0, 10);
      }

      const cb = meta.lastUpdated ? ('?v=' + encodeURIComponent(meta.lastUpdated)) : ('?v=' + Date.now());

      const [geoJ, virtJ] = await Promise.all([
        fetch('assets/data/merged_events.json'  + cb).then(r => r.json()),
        fetch('assets/data/virtual_events.json' + cb).then(r => r.json()),
      ]);

      const geo  = Array.isArray(geoJ?.data)  ? geoJ.data  : [];
      const virt = Array.isArray(virtJ?.data) ? virtJ.data : [];

      const withinWindow = (ev) => {
        const b = ev.begin ? String(ev.begin).slice(0,10) : null;
        const e = ev.end   ? String(ev.end).slice(0,10)   : b;
        if (!b && !e) return true;
        return (e || b) >= cutoffStr;
      };

      return { meta, cutoffStr, geo: geo.filter(withinWindow), virt: virt.filter(withinWindow) };
    }






    /* ---------------------------------------------------------------- 3. Map bootstrap (singletons) */
    /* ---------------------------------------------------------------- 3. Map bootstrap (singletons) */
    if (!window.p25aMap) {
      window.p25aMap = L.map(mapEl);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:"&copy; OpenStreetMap contributors"
      }).addTo(window.p25aMap);

      // Create a dedicated pane so "No Kings" markers sit ABOVE clusters
      if (!window.p25aMap.getPane('nkPane')) {
        window.p25aMap.createPane('nkPane');
        window.p25aMap.getPane('nkPane').style.zIndex = 800; // ← was 650
      }


      if (L.Control?.geocoder) L.Control.geocoder({collapsed:false})
        .on("markgeocode", e=>window.p25aMap.fitBounds(e.geocode.bbox))
        .addTo(window.p25aMap);

      window.p25aMap.fitBounds([[24.396308,-124.848974],[49.384358,-66.885444]],{padding:[40,40]});
    }
    const map = window.p25aMap;


    /* ---------------------------------------------------------------- 4. UI BAR (build once) */
    let uiBar = document.getElementById("date-filter-bar");
    if (!uiBar) {
      uiBar = document.createElement("div");
      uiBar.id = "date-filter-bar";
      uiBar.style.cssText =
        "display:flex;flex-wrap:wrap;gap:8px;justify-content:center;"+
        "margin:12px auto;max-width:900px";
      mapEl.parentNode.insertBefore(uiBar, mapEl);
    }
    uiBar.innerHTML = "";

    const badge = document.createElement("span");
    badge.id="event-badge";
    badge.style.cssText="margin-left:8px;font-weight:600;font-size:.9em;"+
      "background:#eee;padding:4px 8px;border-radius:6px";

    const presets = [
      ["All",   "all"],
      ["30" ,   30   ],
      ["15" ,   15   ],
      ["7"  ,   7    ],
      ["3"  ,   3    ],
      ["Today",1    ],
    ];
    const makeBtn = (label,val)=>{
      const b=document.createElement("button");
      b.textContent=label;
      b.dataset.days=val;
      Object.assign(b.style,{padding:"6px 10px",border:"1px solid #666",borderRadius:"4px",cursor:"pointer",background:"#fafafa"});
      return b;
    };
    presets.forEach(([l,v])=>uiBar.appendChild(makeBtn(l,v)));
    const customBtn = makeBtn("Custom…","custom");
    uiBar.append(customBtn,badge);

        
    /* ---------------------------------------------------------------- 6. Filtering */
    const labelOf = d=> d==="all"?"All Dates":d===1?"Today":d==="custom"?"Custom":`Next ${d} Days`;

    let raw = [];
    let cluster, nkCluster;

    const nkIcon = L.icon({
      iconUrl: '/assets/images/no_kings_logo.png',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -12],
      className: 'nk-pin'
    });

    // if markercluster is missing, provide a simple fallback
    const hasClusters = typeof L.markerClusterGroup === 'function';
    function makeCluster(opts) {
      return hasClusters ? L.markerClusterGroup(opts) : L.layerGroup();
    }


    function render(list, lbl) {
      // clear old layers
      if (cluster)   map.removeLayer(cluster);
      if (nkCluster) map.removeLayer(nkCluster);

      // old:
      // cluster   = L.markerClusterGroup({ maxClusterRadius: 40 });
      // nkCluster = L.markerClusterGroup({...});

      // new:
      cluster   = makeCluster({ maxClusterRadius: 40 });
      nkCluster = makeCluster({
        maxClusterRadius: 50,
        iconCreateFunction: function (c) {
          const count = c.getChildCount?.() ?? c.getLayers().length;
          return L.divIcon({
            html: `<div class="nk-cluster"><span class="count">${count}</span></div>`,
            className: 'nk-cluster-icon',
            iconSize: [40, 40]
          });
        }
      });


      let nkRendered = 0;

      list.forEach(ev => {
        const dateStr = ev.begin === ev.end ? ev.begin : `${ev.begin} – ${ev.end}`;
        const links = (ev.links || []).map(l =>
          `<li><a href="${l.href}" target="_blank">${l.title}</a></li>`
        ).join("");
        const popup =
          `<strong>${ev.title}</strong><br>` +
          `<em>${ev.location || ''}</em><br>` +
          `<em>${dateStr}</em>` +
          (links ? `<ul style="padding-left:16px;margin:8px 0;">${links}</ul>` : "");

        // robust “No Kings” match (No Kings / No-Kings / NoKings, or /nokings/ URL)
        const t = (ev.title || '').toLowerCase().replace(/\W+/g, '');
        const u = (ev.links?.[0]?.href || '').toLowerCase();
        const isNoKings = t.includes('nokings') || u.includes('/nokings/');

        const marker = L.marker([ev.lat, ev.lng], isNoKings ? { icon: nkIcon } : undefined)
                        .bindPopup(popup);

        if (isNoKings) { nkCluster.addLayer(marker); nkRendered++; }
        else           { cluster.addLayer(marker); }
      });

      // add both clusters to the map (NK clusters render separately from others)
      map.addLayer(cluster);
      map.addLayer(nkCluster);

      console.log('Rendered No Kings markers:', nkRendered);
      badge.textContent = `Showing: ${lbl} — ${list.length} events`; 
      // for "All", lbl currently shows "All (last 1 day + upcoming)" — keep that phrasing

    }

    // --- VERSION MARKER (so we know this file is actually loaded)
DEBUG && console.log('[P25A map] v2025-10-02-ALLRAW');

    function applyPreset(days) {
      // "All" = trust the backend entirely (yesterday + upcoming)
      if (days === "all") {
        DEBUG && console.log("[map] ALL uses backend as-is len=", raw.length);
        return render(raw, "All (last 1 day + upcoming)");
      }

      // Numeric presets (30/15/7/3/1) restrict to a forward window
      const cutoffStr = fmt(new Date(today.getTime() + (parseInt(days, 10) - 1) * ONE_DAY));
      const yStr = fmt(new Date(today.getTime() - ONE_DAY)); // keep items that are ongoing since yesterday

      const filtered = raw.filter(ev => {
        if (ev.lat == null || ev.lng == null) return false;
        const b = ev.begin, e = ev.end || ev.begin;
        if (!b && !e) return false;
        return (e >= yStr) && (b <= cutoffStr);
      });

      render(filtered, labelOf(days));
    }

    function initFilter() {
      uiBar.querySelectorAll("button").forEach(btn => {
        btn.onclick = () => {
          const v = btn.dataset.days;
          if (v === "custom") return openCustom();
          localStorage.setItem("p25a-date-range", v);
          applyPreset(v === "all" ? "all" : parseInt(v, 10));
        };
      });

      // Respect saved preset, default to "all"
      const saved = localStorage.getItem("p25a-date-range") || "all";
      applyPreset(saved === "all" ? "all" : parseInt(saved, 10));
    }





    /* ---------------------------------------------------------------- 5–8. Load, render, virtual list, meta */
    

    function buildVirtualList(virtual, cutoffStr) {
      const existing = document.getElementById('virtual-toggle-btn');
      if (existing) existing.remove();
      const existingList = document.getElementById('virtual-list');
      if (existingList) existingList.remove();

      if (!virtual.length) return;

      const btn = document.createElement("button");
      btn.id = 'virtual-toggle-btn';
      btn.textContent = "Show Virtual Events";
      Object.assign(btn.style,{
        display:"block",margin:"12px auto",padding:"12px 24px",
        backgroundColor:"#0073e6",color:"#fff",border:"none",
        borderRadius:"6px",fontSize:"1em",cursor:"pointer"
      });

      const list = document.createElement("ul");
      list.id = 'virtual-list';
      list.style.cssText = "display:none;max-width:800px;margin:8px auto;padding:0 1em;list-style:none";

      virtual
        .slice()
        .sort((a,b)=> (a.begin||'').localeCompare(b.begin||''))
        .forEach(ev=>{
          const li = document.createElement("li");
          const dateLabel = ev.begin===ev.end? ev.begin : `${ev.begin} – ${ev.end}`;
          const href = ev.links?.[0]?.href || "#";
          li.innerHTML = `<strong>${dateLabel}</strong> — <a href="${href}" target="_blank">${ev.title}</a>` +
                        (ev.location?` (<em>${ev.location}</em>)`:" ");
          li.style.padding="6px 0";
          list.appendChild(li);
        });

      mapEl.parentNode.insertBefore(btn, mapEl.nextSibling);
      mapEl.parentNode.insertBefore(list, btn.nextSibling);

      btn.onclick = ()=>{
        const showing = list.style.display==="block";
        list.style.display = showing ? "none" : "block";
        btn.textContent    = showing ? "Show Virtual Events" : "Hide Virtual Events";
      };
    }

    function setMeta(meta) {
      const wrap = document.getElementById('map-last-updated');
      if (!wrap || !meta?.lastUpdated) return;
      const slot = wrap.querySelector('em');
      if (slot) slot.textContent = meta.lastUpdated;
      else wrap.textContent = `Last updated: ${meta.lastUpdated}`;
    }

    // One unified load & kick-off
    loadEventsSafe()
      .then(({ meta, cutoffStr, geo, virt }) => {
        console.log('[map] loaded', { cutoffStr, geoLen: geo.length, virtLen: virt.length, meta });
        raw = geo;
        initFilter();
        buildVirtualList(virt, cutoffStr);
        setMeta(meta);
      })
      .catch(e => console.error('events load failed:', e));


    });
}

