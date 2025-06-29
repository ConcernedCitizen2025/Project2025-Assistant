// assets/js/california-protest-map.js

document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("california-map");
  if (!container) {
    console.error("Map container not found!");
    return;
  }

  // 1) Initialize the map once
  if (!window.map) {
    window.map = L.map(container);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(window.map);

    if (L.Control && L.Control.geocoder) {
      L.Control.geocoder({
        collapsed: false,
        placeholder: "Search by address, city…",
      })
        .on("markgeocode", function (e) {
          window.map.fitBounds(e.geocode.bbox);
        })
        .addTo(window.map);
    }
  }
  const map = window.map;

  const US_BOUNDS = [
    [24.396308, -124.848974],
    [49.384358, -66.885444],
  ];
  map.fitBounds(US_BOUNDS, { padding: [40, 40] });

  // Set date filter: allow yesterday through future
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const threshold = date.toISOString().slice(0, 10); // YYYY-MM-DD

  // 2) Plot geo-coded events
  fetch(`/assets/data/merged_events.json?v=${Date.now()}`)
    .then((res) => (res.ok ? res.json() : Promise.reject(res)))
    .then((json) => {
      console.log("🔎 First 3 events after fetch:", json.data.slice(0, 3));

      const cluster = L.markerClusterGroup({ maxClusterRadius: 40 });
      let skippedTooOld = 0;
      let skippedMissingCoords = 0;

      const filtered = (json.data || []).filter((ev) => {
        const validDate = ev.end >= threshold;
        const hasCoords = ev.lat != null && ev.lng != null;

        if (!validDate || !hasCoords) {
          if (!validDate) skippedTooOld++;
          if (!hasCoords) skippedMissingCoords++;
          console.warn("🛑 Skipped:", ev.title, {
            reason: !validDate ? "Too old" : "Missing coordinates",
            lat: ev.lat,
            lng: ev.lng,
            end: ev.end,
            threshold,
          });
        }

        return validDate && hasCoords;
      });

      filtered.forEach((ev) => {
        const dateLabel =
          ev.begin === ev.end ? ev.begin : `${ev.begin} – ${ev.end}`;
        const links = (ev.links || [])
          .map((l) => `<li><a href="${l.href}" target="_blank">${l.title}</a></li>`)
          .join("");
        const popup = `
          <strong>${ev.title || ev.location}</strong><br>
          <em>${ev.location}</em><br>
          <em>${dateLabel}</em>
          <ul style="padding-left:16px;margin:8px 0;">${links}</ul>
        `;
        cluster.addLayer(L.marker([ev.lat, ev.lng]).bindPopup(popup));
      });

      console.log("✅ Final filtered marker count:", filtered.length);
      console.log("❌ Skipped due to age:", skippedTooOld);
      console.log("❌ Skipped due to missing coordinates:", skippedMissingCoords);

      map.addLayer(cluster);
      console.log(`✅ Plotted ${cluster.getLayers().length} markers`);
    })
    .catch((err) => console.error("Error loading merged_events.json:", err));

  // 3) Virtual events toggle
  fetch(`/assets/data/virtual_events.json?v=${Date.now()}`)
    .then((res) => (res.ok ? res.json() : Promise.reject(res)))
    .then((json) => {
      console.log("🔎 First 3 virtual events:", json.data?.slice(0, 3));

      const virtual = (json.data || [])
        .filter((ev) => ev.title && ev.links?.length && ev.end >= threshold)
        .sort((a, b) => a.begin.localeCompare(b.begin));

      if (!virtual.length) return;
      if (document.getElementById("virtual-toggle-btn")) return;

      const btn = document.createElement("button");
      btn.id = "virtual-toggle-btn";
      btn.textContent = "Show Virtual Events";
      Object.assign(btn.style, {
        display: "block",
        margin: "12px auto",
        padding: "12px 24px",
        backgroundColor: "#0073e6",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        fontSize: "1em",
        cursor: "pointer",
      });

      const list = document.createElement("ul");
      list.id = "virtual-events-list";
      Object.assign(list.style, {
        display: "none",
        maxWidth: "800px",
        margin: "8px auto",
        padding: "0 1em",
        listStyle: "none",
      });

      virtual.forEach((ev) => {
        const li = document.createElement("li");
        const dateLabel =
          ev.begin === ev.end ? ev.begin : `${ev.begin} – ${ev.end}`;
        const href = ev.links[0].href || "#";
        li.innerHTML = `<strong>${dateLabel}</strong> — <a href="${href}" target="_blank">${ev.title}</a>` +
          (ev.location ? ` (<em>${ev.location}</em>)` : "");
        li.style.padding = "6px 0";
        list.appendChild(li);
      });

      container.parentNode.insertBefore(btn, container.nextSibling);
      container.parentNode.insertBefore(list, btn.nextSibling);

      btn.addEventListener("click", () => {
        const showing = list.style.display === "block";
        list.style.display = showing ? "none" : "block";
        btn.textContent = showing ? "Show Virtual Events" : "Hide Virtual Events";
      });
    })
    .catch((err) => console.error("Error loading virtual_events.json:", err));

  // 4) Load timestamp metadata
  fetch(`/assets/data/events_meta.json?v=${Date.now()}`)
    .then((res) => (res.ok ? res.json() : Promise.reject("Could not fetch events_meta.json")))
    .then((data) => {
      const el = document.getElementById("map-last-updated");
      if (el) {
        el.textContent = `Map last updated: ${data.lastUpdated}`;
      }
    })
    .catch((err) => console.error("Error loading metadata:", err));
});
