document.addEventListener("DOMContentLoaded", function () {
  const mapContainer = document.getElementById("california-map");
  const mergedUrl    = "/assets/data/merged_events.json";
  const manualUrl    = "/assets/data/protest_events.json";
  const virtualUrl   = "/assets/data/virtual_events.json";

  if (!mapContainer) {
    console.error("Map container not found!");
    return;
  }

  // initialize map
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

  // helper to extract city from "A, B, C"
  function extractCity(loc) {
    if (!loc) return "Unknown";
    const parts = loc.split(",");
    return parts.length >= 2
      ? parts[parts.length - 2].trim()
      : parts[0].trim();
  }

  // load merged geo + manual then render markers
  Promise.all([
    fetch(mergedUrl).then(r => r.ok ? r.json() : Promise.reject(r)),
    fetch(manualUrl).then(r => r.ok ? r.json() : Promise.reject(r)),
  ])
  .then(([geoJ, manualJ]) => {
    const autoEvents   = geoJ.data || [];
    const manualRaw    = manualJ.data?.searchEvents?.elements || [];
    const manualEvents = manualRaw.map(ev => ({
      beginsOn: ev.date,
      lat:      ev.lat  ?? ev.latitude,
      lng:      ev.lng  ?? ev.longitude,
      location: ev.location,
      title:    ev.title,
      links:    [{ title: ev.title, href: ev.link }]
    }));

    const all = [...autoEvents, ...manualEvents];
    const upcoming = all
      .filter(ev => ev.lat != null && ev.lng != null && ev.beginsOn >= today)
      .sort((a,b) => {
        const c = extractCity(a.location).localeCompare(extractCity(b.location));
        return c || a.beginsOn.localeCompare(b.beginsOn);
      });

    const markers = L.markerClusterGroup();
    upcoming.forEach(ev => {
      const list = ev.links
        .map(l => `<li><a href="${l.href}" target="_blank">${l.title}</a></li>`)
        .join("");
      const popup = `
        <strong>${ev.title || extractCity(ev.location)}</strong><br>
        <em>${ev.location}</em><br>
        Date: ${ev.beginsOn}<br>
        <ul style="margin:8px 0;padding-left:16px;">${list}</ul>
      `;
      L.marker([ev.lat, ev.lng]).bindPopup(popup).addTo(markers);
    });
    window.map.addLayer(markers);

    // —— Virtual events toggle UI ——
    const wrapper = mapContainer.parentNode;
    const btn     = document.createElement("button");
    btn.id        = "toggle-virtual";
    btn.textContent = "Show Virtual Events";
    btn.style.display = "block";
    btn.style.margin  = "10px auto";
    wrapper.appendChild(btn);

    const listEl = document.createElement("ul");
    listEl.id    = "virtual-events";
    listEl.style.display     = "none";
    listEl.style.paddingLeft = "1em";
    wrapper.appendChild(listEl);

    btn.addEventListener("click", () => {
      const hidden = listEl.style.display === "none";
      listEl.style.display = hidden ? "block" : "none";
      btn.textContent = hidden ? "Hide Virtual Events" : "Show Virtual Events";
    });

    // fetch & populate virtual list
    fetch(virtualUrl)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(json => {
        const evs = json.data || [];
        evs.forEach(ev => {
          // skip entries with no title or no links
          if (!(ev.title || ev.links?.length)) return;
          const dateStr = ev.begin === ev.end
            ? ev.begin
            : `${ev.begin} – ${ev.end}`;
          const href = ev.links[0]?.href || "#";
          const li = document.createElement("li");
          li.innerHTML = `<strong>${dateStr}</strong> — <a href="${href}" target="_blank">${ev.title}</a>`
            + (ev.location ? ` (<em>${ev.location}</em>)` : "");
          listEl.appendChild(li);
        });
        // hide button if no virtual events
        if (!listEl.children.length) btn.style.display = "none";
      })
      .catch(err => console.error("Error loading virtual events:", err));

  })
  .catch(err => {
    console.error("Error loading geo/manual events:", err);
  });
});
