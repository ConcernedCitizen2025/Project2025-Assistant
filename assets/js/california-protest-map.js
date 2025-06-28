// assets/js/california-protest-map.js

document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("california-map");
  if (!container) {
    console.error("Map container not found!");
    return;
  }

  // 1) Initialize the map once (no hard-coded center/zoom)
  if (!window.map) {
    window.map = L.map(container);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(window.map);

    // never-collapsed geocoder
    if (L.Control && L.Control.geocoder) {
      L.Control.geocoder({
        collapsed:   false,
        placeholder: "Search by address, city…",
      })
      .on("markgeocode", function(e) {
        window.map.fitBounds(e.geocode.bbox);
      })
      .addTo(window.map);
    }
  }
  const map = window.map;

  // ── Lock initial view to continental US bounds ──
  const US_BOUNDS = [
    [24.396308, -124.848974],  // southwest
    [49.384358,  -66.885444]   // northeast
  ];
  map.fitBounds(US_BOUNDS, { padding: [40, 40] });

  // PST “today” string for filtering
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
    year:   "numeric",
    month:  "2-digit",
    day:    "2-digit"
  });

  // 2) Plot geo-coded events, clustered by state
  fetch(`/assets/data/merged_events.json?v=${Date.now()}`)
    .then(r => r.ok ? r.json() : Promise.reject(r))
    .then(json => {
      const cluster = L.markerClusterGroup({
        // only cluster points within 40 pixels of each other
        maxClusterRadius: 40
      });

      (json.data || [])
        .filter(ev => ev.lat != null && ev.lng != null && ev.end >= today)
        .forEach(ev => {
          const st = (ev.state || "OTHER").toUpperCase();
          if (!clusters[st]) {
            clusters[st] = L.markerClusterGroup({ 
              // you can tweak options here if you like 
            });
          }

          const dateLabel = ev.begin === ev.end
            ? ev.begin
            : `${ev.begin} – ${ev.end}`;
          const links = (ev.links || [])
            .map(l => `<li><a href="${l.href}" target="_blank">${l.title}</a></li>`)
            .join("");

          const popup = `
            <strong>${ev.title || ev.location}</strong><br>
            <em>${ev.location}</em><br>
            <em>${dateLabel}</em>
            <ul style="padding-left:16px;margin:8px 0;">${links}</ul>
          `;

          L.marker([ev.lat, ev.lng])
            .bindPopup(popup)
            .addTo(clusters[st]);
        });

      // finally add each state‐cluster to the map
      Object.values(clusters).forEach(cluster => map.addLayer(cluster));
    })
    .catch(err => console.error("Error loading merged_events.json:", err));


  // 3) Virtual events toggle (also cache-busted)
  fetch(`/assets/data/virtual_events.json?v=${Date.now()}`)
    .then(res => res.ok ? res.json() : Promise.reject(res))
    .then(json => {
      const virtual = (json.data||[])
        .filter(ev=>ev.title && ev.links?.length && ev.end>=today)
        .sort((a,b)=>a.begin.localeCompare(b.begin));
      if (!virtual.length) return;

      if (document.getElementById("virtual-toggle-btn")) return;

      const btn = document.createElement("button");
      btn.id = "virtual-toggle-btn";
      btn.textContent = "Show Virtual Events";
      Object.assign(btn.style, {
        display: "block",
        margin:  "12px auto",
        padding: "12px 24px",
        backgroundColor: "#0073e6",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        fontSize: "1em",
        cursor: "pointer"
      });

      const list = document.createElement("ul");
      list.id = "virtual-events-list";
      Object.assign(list.style, {
        display: "none",
        maxWidth: "800px",
        margin: "8px auto",
        padding: "0 1em",
        listStyle: "none"
      });

      virtual.forEach(ev => {
        const li = document.createElement("li");
        const dateLabel = ev.begin === ev.end
          ? ev.begin
          : `${ev.begin} – ${ev.end}`;
        const href = ev.links[0].href || "#";
        li.innerHTML = `<strong>${dateLabel}</strong> — <a href="${href}" target="_blank">${ev.title}</a>`
                     + (ev.location ? ` (<em>${ev.location}</em>)` : "");
        li.style.padding = "6px 0";
        list.appendChild(li);
      });

      container.parentNode.insertBefore(btn, container.nextSibling);
      container.parentNode.insertBefore(list, btn.nextSibling);

      btn.addEventListener("click", () => {
        const showing = list.style.display === "block";
        list.style.display = showing ? "none" : "block";
        btn.textContent   = showing ? "Show Virtual Events" : "Hide Virtual Events";
      });
    })
    .catch(err => console.error("Error loading virtual_events.json:", err));

  // 4) Load and display “lastUpdated” from your meta JSON
  fetch(`/assets/data/events_meta.json?v=${Date.now()}`)
    .then(res => res.ok ? res.json() : Promise.reject(res))
    .then(data => {
      const el = document.getElementById("map-last-updated");
      if (el) {
        el.innerHTML = `<strong>Last updated:</strong> ${data.lastUpdated}`;
      }
    })
    .catch(err => {
      console.error("Couldn't load last-updated timestamp:", err);
      // optionally: hide if missing
      // document.getElementById("map-last-updated").style.display = "none";
    });

}); // end DOMContentLoaded
