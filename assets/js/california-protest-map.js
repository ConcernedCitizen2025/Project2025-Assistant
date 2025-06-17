document.addEventListener("DOMContentLoaded", function () {
  const mapContainer = document.getElementById("california-map");
  const mergedUrl    = "/assets/data/merged_events.json";
  const manualUrl    = "/assets/data/protest_events.json";
  const virtualUrl   = "/assets/data/virtual_events.json";

  if (!mapContainer) return console.error("Map container not found!");

  // — Initialize or reuse the map —
  if (!window.map) {
    window.map = L.map(mapContainer).setView([36.7783, -119.4179], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(window.map);
  }

  // PST “today” for filtering
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
    year:    "numeric",
    month:   "2-digit",
    day:     "2-digit"
  });

  // Helper to pull city out of “A, B, C”
  function extractCity(loc) {
    if (!loc) return "Unknown";
    const p = loc.split(",");
    return p.length >= 2 ? p[p.length-2].trim() : p[0].trim();
  }

  // 1) Load and render geo-coded events (merged + manual)
  Promise.all([
    fetch(mergedUrl).then(r => r.ok ? r.json() : Promise.reject(r)),
    fetch(manualUrl).then(r => r.ok ? r.json() : Promise.reject(r)),
  ])
  .then(([geoJ, manualJ]) => {
    const autoEvents = geoJ.data || [];
    const manualRaw  = manualJ.data?.searchEvents?.elements || [];
    const manualEvents = manualRaw.map(ev => ({
      beginsOn: ev.date,
      lat:       ev.lat  ?? ev.latitude,
      lng:       ev.lng  ?? ev.longitude,
      location:  ev.location,
      title:     ev.title,
      links:     [{ title: ev.title, href: ev.link }]
    }));

    const all = [...autoEvents, ...manualEvents];
    const upcoming = all
      .filter(ev => ev.lat!=null && ev.lng!=null && ev.beginsOn >= today)
      .sort((a,b) => {
        const c = extractCity(a.location).localeCompare(extractCity(b.location));
        return c || a.beginsOn.localeCompare(b.beginsOn);
      });

    const markers = L.markerClusterGroup();
    upcoming.forEach(ev => {
      const list = ev.links.map(l =>
        `<li><a href="${l.href}" target="_blank">${l.title}</a></li>`
      ).join("");
      const popup = `
        <strong>${ev.title || extractCity(ev.location)}</strong><br>
        <em>${ev.location}</em><br>
        Date: ${ev.beginsOn}<br>
        <ul style="margin:8px 0;padding-left:16px;">${list}</ul>
      `;
      L.marker([ev.lat, ev.lng]).bindPopup(popup).addTo(markers);
    });
    window.map.addLayer(markers);

    // 2) Inject **one** virtual-events toggle right below the map
    if (!document.getElementById("toggle-virtual")) {
      const btn    = document.createElement("button");
      const listEl = document.createElement("ul");
      btn.id       = "toggle-virtual";
      btn.textContent = "Show Virtual Events";
      btn.className   = "virtual-toggle-btn";
      listEl.id       = "virtual-events";
      listEl.style.display = "none";

      // insert under the map
      mapContainer.parentNode.insertBefore(btn, mapContainer.nextSibling);
      btn.insertAdjacentElement("afterend", listEl);

      btn.addEventListener("click", () => {
        const show = listEl.style.display === "none";
        listEl.style.display = show ? "block" : "none";
        btn.textContent = show ? "Hide Virtual Events" : "Show Virtual Events";
      });

      // 3) Load & populate virtual list, dropping entries without title/links or generic virtual-only items
      fetch(virtualUrl)
        .then(r => r.ok ? r.json() : Promise.reject(r))
        .then(json => {
          (json.data || []).forEach(ev => {
            // 1) must have a title and at least one link
            if (!ev.title || !ev.links?.length) return;

            // 2) skip truly generic “Virtual…” entries
            const loc = (ev.location || '').trim();
            if (/^virtual\b/i.test(loc)) return;

            // 3) build date (single or range)
            const dateStr = ev.begin === ev.end
              ? ev.begin
              : `${ev.begin} – ${ev.end}`;

            // 4) first link
            const href = ev.links[0].href;

            // 5) render list item
            const li = document.createElement("li");
            li.innerHTML = `
              <strong>${dateStr}</strong> — 
              <a href="${href}" target="_blank">${ev.title}</a>
              ${loc ? ` (<em>${loc}</em>)` : ''}
            `;
            listEl.appendChild(li);
          });

          // hide the button if nothing made it into the list
          if (!listEl.children.length) {
            btn.style.display = 'none';
          }
        })
        .catch(err => console.error("Error loading virtual events:", err));

    }
  })
  .catch(err => console.error("Error loading geo/manual events:", err));
});
