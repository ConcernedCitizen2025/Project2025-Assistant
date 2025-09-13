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
  document.addEventListener("DOMContentLoaded", () => {
    /* ---------------------------------------------------------------- 1. DOM refs */
    const mapEl = document.getElementById("california-map");
    if (!mapEl) return console.error("Map container #california-map not found!");

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

    /* ---------------------------------------------------------------- 5. Data fetch */
    let raw=[]; let cluster; let nkCluster;

    const nkIcon = L.icon({
      iconUrl: '/assets/images/no_kings_logo.png',
      iconSize: [36, 36],       // ← shrunk a smidge from 48 → 36
      iconAnchor: [18, 18],
      popupAnchor: [0, -12],
      className: 'nk-pin'
    });



    fetch(`/assets/data/merged_events.json?v=${Date.now()}`)
      .then(r => r.json())
      .then(js => {
        raw = js.data || [];
        initFilter();               // ⬅ re-enable the filter bar
      })
      .catch(e => console.error("merged_events.json fetch", e));



    /* ---------------------------------------------------------------- 6. Filtering */
    const labelOf = d=> d==="all"?"All Dates":d===1?"Today":d==="custom"?"Custom":`Next ${d} Days`;

    function render(list, lbl) {
      // clear old layers
      if (cluster)   map.removeLayer(cluster);
      if (nkCluster) map.removeLayer(nkCluster);

      // normal (non–No Kings) clustered layer
      cluster = L.markerClusterGroup({ maxClusterRadius: 40 });

      // No Kings clustered layer (separate group, custom cluster icon)
      nkCluster = L.markerClusterGroup({
        maxClusterRadius: 50,
        iconCreateFunction: function (c) {
          const count = c.getChildCount();
          // a divIcon that uses the NK logo as the background with a tiny count badge
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
    }






    function applyPreset(days) {
      const todayStr = fmt(today); // YYYY-MM-DD in PT

      if (days === "all") {
        // Show all upcoming/ongoing with coords (no past)
        const filtered = raw.filter(ev =>
          ev.lat != null && ev.lng != null &&
          ((ev.end || ev.begin) >= todayStr)
        );
        return render(filtered, "All (upcoming)");
      }

      // Numeric presets: starts within window AND not past
      const cutoffStr = fmt(new Date(today.getTime() + (days - 1) * ONE_DAY));
      const filtered = raw.filter(ev => {
        if (ev.lat == null || ev.lng == null) return false;
        const b = ev.begin;                  // "YYYY-MM-DD"
        const e = ev.end || ev.begin;        // "YYYY-MM-DD"
        if (!b && !e) return false;
        return e >= todayStr && b <= cutoffStr;
      });

      render(filtered, labelOf(days));
    }

    function openCustom() {
      const wrap = document.createElement("div");
      Object.assign(wrap.style, {
        position: "fixed", inset: 0, background: "rgba(0,0,0,.4)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
      });
      wrap.innerHTML = `<div style="background:#fff;padding:20px;border-radius:8px;text-align:center">
        <h3 style="margin-top:0">Custom Range</h3>
        <label>Start:<br><input type="date" id="start"></label><br><br>
        <label>End:<br><input type="date" id="end"></label><br><br>
        <button id="apply">Apply</button> <button id="cancel">Cancel</button>
      </div>`;
      document.body.appendChild(wrap);

      // Default both inputs to today (PT)
      wrap.querySelector("#start").value = fmt(today);
      wrap.querySelector("#end").value = fmt(today);

      wrap.querySelector("#apply").onclick = () => {
        const startStr = wrap.querySelector("#start").value; // YYYY-MM-DD
        const endStr   = wrap.querySelector("#end").value;   // YYYY-MM-DD

        const list = raw.filter(ev => {
          if (ev.lat == null || ev.lng == null) return false;
          const b = ev.begin;
          const e = ev.end || ev.begin;
          if (!b && !e) return false;
          // overlap test using safe string comparisons
          return e >= startStr && b <= endStr;
        });

        render(list, `${new Date(startStr).toLocaleDateString()} – ${new Date(endStr).toLocaleDateString()}`);
        localStorage.setItem("p25a-date-range", "custom");
        wrap.remove();
      };

      wrap.querySelector("#cancel").onclick = () => wrap.remove();
    }

    function initFilter() {
      // Always default to ALL on load so we don’t silently shrink due to old localStorage
      localStorage.setItem("p25a-date-range", "all");
      applyPreset("all");

      // Wire buttons
      uiBar.querySelectorAll("button").forEach(btn => {
        btn.onclick = () => {
          const v = btn.dataset.days;
          if (v === "custom") return openCustom();
          localStorage.setItem("p25a-date-range", v);
          applyPreset(v === "all" ? "all" : parseInt(v, 10));
        };
      });
    }


    /* ---------------------------------------------------------------- 7. Virtual Events Toggle */
    fetch(`/assets/data/virtual_events.json?v=${Date.now()}`)
      .then(r=>r.json())
      .then(js=>{
        let virtual=js.data||[];
        virtual = virtual.filter(ev => (ev.end || ev.begin) >= yesterdayStr);
        if(!virtual.length) return;
        const btn=document.createElement("button");
        btn.textContent="Show Virtual Events";
        Object.assign(btn.style,{display:"block",margin:"12px auto",padding:"12px 24px",backgroundColor:"#0073e6",color:"#fff",border:"none",borderRadius:"6px",fontSize:"1em",cursor:"pointer"});
        const list=document.createElement("ul");
        list.style.cssText="display:none;max-width:800px;margin:8px auto;padding:0 1em;list-style:none";
        virtual.sort((a,b)=>a.begin.localeCompare(b.begin)).forEach(ev=>{
          const li=document.createElement("li");
          const dateLabel=ev.begin===ev.end?ev.begin:`${ev.begin} – ${ev.end}`;
          const href=ev.links?.[0]?.href||"#";
          li.innerHTML=`<strong>${dateLabel}</strong> — <a href="${href}" target="_blank">${ev.title}</a>`+
            (ev.location?` (<em>${ev.location}</em>)`:" ");
          li.style.padding="6px 0";
          list.appendChild(li);
        });
        mapEl.parentNode.insertBefore(btn, mapEl.nextSibling);
        mapEl.parentNode.insertBefore(list, btn.nextSibling);
        btn.onclick=()=>{
          const showing=list.style.display==="block";
          list.style.display=showing?"none":"block";
          btn.textContent=showing?"Show Virtual Events":"Hide Virtual Events";
        };
      });

    /* ---------------------------------------------------------------- 8. Metadata timestamp */
    fetch(`/assets/data/events_meta.json?v=${Date.now()}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        const wrap = document.getElementById('map-last-updated');
        if (!wrap) return;
        // Prefer the existing <em>…</em> slot; fall back to setting whole text if not found
        const slot = wrap.querySelector('em');
        if (slot) slot.textContent = d.lastUpdated;
        else wrap.textContent = `Last updated: ${d.lastUpdated}`;
      })
      .catch(() => {});
  });
}
