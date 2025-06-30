/* assets/js/california-protest-map.js
   ──────────────────────────────────────────────────────────────────
   Adds:
     • Date-range filter buttons (+ custom calendar)
     • Live event count badge
     • localStorage persistence
*/

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("california-map");
  if (!container) return console.error("Map container not found!");

  /* ───────────────────────── 0. Helpers ───────────────────────── */
  const fmtDate = (d) => d.toISOString().slice(0, 10);            // YYYY-MM-DD
  const today    = new Date();               // midnight local
  today.setHours(0, 0, 0, 0);
  const ONE_DAY  = 24 * 60 * 60 * 1000;

  /* ───────────────────────── 1. Map bootstrap ─────────────────── */
  if (!window.map) {
    window.map = L.map(container);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(window.map);

    if (L.Control && L.Control.geocoder) {
      L.Control.geocoder({ collapsed: false, placeholder: "Search…" })
        .on("markgeocode", (e) => window.map.fitBounds(e.geocode.bbox))
        .addTo(window.map);
    }
  }
  const map = window.map;
  map.fitBounds(
    [[24.396308, -124.848974], [49.384358, -66.885444]],
    { padding: [40, 40] }
  );

  /* ───────────────────────── 2. UI Elements ───────────────────── */
  const uiBar = document.createElement("div");
  uiBar.id = "date-filter-bar";
  uiBar.style.cssText =
    "display:flex;flex-wrap:wrap;gap:8px;justify-content:center;" +
    "margin:12px auto;max-width:900px";
  container.parentNode.insertBefore(uiBar, container);

  const badge = document.createElement("span");
  badge.id  = "event-badge";
  badge.style.cssText =
    "margin-left:8px;font-weight:600;font-size:.9em;" +
    "background:#eee;padding:4px 8px;border-radius:6px";

  const makeBtn = (label, days) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    Object.assign(btn.style, {
      padding: "6px 10px",
      border: "1px solid #888",
      borderRadius: "4px",
      background: "#fafafa",
      cursor: "pointer"
    });
    btn.dataset.days = days;
    return btn;
  };

  const ranges = [
    ["All", "all"],
    ["30 Days", 30],
    ["15 Days", 15],
    ["7 Days",  7],
    ["3 Days",  3],
    ["Today",   1]
  ];

  ranges.forEach(([lbl, days]) => uiBar.appendChild(makeBtn(lbl, days)));

  // "Custom Range…" calendar
  const customBtn = makeBtn("Custom Range…", "custom");
  uiBar.appendChild(customBtn);
  uiBar.appendChild(badge);

  /* ───────────────────────── 3. Data fetch ────────────────────── */
  let rawEvents   = [];                 // full JSON cache
  let cluster;                          // Leaflet markerClusterGroup

  fetch(`/assets/data/merged_events.json?v=${Date.now()}`)
    .then((r) => r.json())
    .then((json) => {
      rawEvents = json.data || [];
      initFilter();                     // set up buttons after data arrives
    })
    .catch((e) => console.error("merged_events fetch error", e));

  /* ───────────────────────── 4. Filtering logic ───────────────── */
  function applyFilter(days) {
    if (cluster) map.removeLayer(cluster);   // clear previous markers
    cluster = L.markerClusterGroup({ maxClusterRadius: 40 });

    const threshold = days === "all"
      ? null
      : new Date(today.getTime() - (days - 1) * ONE_DAY);

    const filtered = rawEvents.filter((ev) => {
      if (ev.lat == null || ev.lng == null) return false;
      if (!threshold) return true;
      return new Date(ev.end) >= threshold;
    });

    filtered.forEach((ev) => {
      const dateLabel = ev.begin === ev.end ? ev.begin : `${ev.begin} – ${ev.end}`;
      const links = (ev.links || [])
        .map((l) => `<li><a href="${l.href}" target="_blank">${l.title}</a></li>`)
        .join("");
      const popup = `<strong>${ev.title}</strong><br><em>${ev.location}</em><br><em>${dateLabel}</em>
                     <ul style="padding-left:16px;margin:8px 0;">${links}</ul>`;
      cluster.addLayer(L.marker([ev.lat, ev.lng]).bindPopup(popup));
    });

    map.addLayer(cluster);
    badge.textContent =
      `Showing: ${formatLabel(days)} — ${filtered.length} event${filtered.length !== 1 ? "s" : ""}`;
  }

  const formatLabel = (d) => {
    if (d === "all")   return "All Dates";
    if (d === "custom")return "Custom Range";
    if (d === 1)       return "Today";
    return `Next ${d} Days`;
  };

  /* ───────────────────────── 5. Button wiring ─────────────────── */
  function initFilter() {
    const saved = localStorage.getItem("p25a-date-range") || "all";
    [...uiBar.querySelectorAll("button")].forEach((b) => {
      b.onclick = () => {
        const sel = b.dataset.days;
        if (sel === "custom") return openCustomPicker();
        localStorage.setItem("p25a-date-range", sel);
        applyFilter(sel === "all" ? "all" : parseInt(sel, 10));
      };
    });
    // default load
    applyFilter(saved === "all" ? "all" : parseInt(saved, 10));
  }

  /* ───────────────────────── 6. Custom range picker ───────────── */
  function openCustomPicker() {
    const wrapper = document.createElement("div");
    Object.assign(wrapper.style, {
      position: "fixed", inset: "0", background: "rgba(0,0,0,.4)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
    });
    wrapper.innerHTML = `
      <div style="background:#fff;padding:20px;border-radius:8px;max-width:280px;text-align:center">
        <h3 style="margin-top:0">Custom Range</h3>
        <label>Start:<br><input type="date" id="startDate" style="width:100%"></label><br><br>
        <label>End:<br><input type="date" id="endDate" style="width:100%"></label><br><br>
        <button id="applyRange" style="margin-right:8px">Apply</button>
        <button id="cancelRange">Cancel</button>
      </div>`;
    document.body.appendChild(wrapper);

    const todayStr = fmtDate(new Date());
    wrapper.querySelector("#startDate").value = todayStr;
    wrapper.querySelector("#endDate").value = todayStr;

    wrapper.querySelector("#applyRange").onclick = () => {
      const s = new Date(wrapper.querySelector("#startDate").value);
      const e = new Date(wrapper.querySelector("#endDate").value);
      if (e < s) [s, e] = [e, s]; // ensure s ≤ e
      localStorage.setItem("p25a-date-range", "custom");
      applyCustomRange(s, e);
      wrapper.remove();
    };
    wrapper.querySelector("#cancelRange").onclick = () => wrapper.remove();
  }

  function applyCustomRange(start, end) {
    if (cluster) map.removeLayer(cluster);
    cluster = L.markerClusterGroup({ maxClusterRadius: 40 });

    const filtered = rawEvents.filter((ev) => {
      if (ev.lat == null || ev.lng == null) return false;
      const evDate = new Date(ev.begin);
      return evDate >= start && evDate <= end;
    });

    filtered.forEach((ev) => {
      const dateLabel = ev.begin === ev.end ? ev.begin : `${ev.begin} – ${ev.end}`;
      const links = (ev.links || [])
        .map((l) => `<li><a href="${l.href}" target="_blank">${l.title}</a></li>`)
        .join("");
      const popup = `<strong>${ev.title}</strong><br><em>${ev.location}</em><br><em>${dateLabel}</em>
                     <ul style="padding-left:16px;margin:8px 0;">${links}</ul>`;
      cluster.addLayer(L.marker([ev.lat, ev.lng]).bindPopup(popup));
    });

    map.addLayer(cluster);
    badge.textContent =
      `Showing: ${start.toLocaleDateString()} – ${end.toLocaleDateString()} — ${filtered.length} events`;
  }

  /* ───────────────────────── 7. Metadata timestamp ────────────── */
  fetch(`/assets/data/events_meta.json?v=${Date.now()}`)
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((d) => {
      const el = document.getElementById("map-last-updated");
      if (el) el.textContent = `Map last updated: ${d.lastUpdated}`;
    });
});
