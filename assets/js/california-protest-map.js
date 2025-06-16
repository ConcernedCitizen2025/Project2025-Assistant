document.addEventListener("DOMContentLoaded", function () {
  const mapContainer = document.getElementById("california-map");
  const mergedUrl    = "/assets/data/merged_events.json";
  const manualUrl    = "/assets/data/protest_events.json";

  if (!mapContainer) {
    console.error("Map container not found!");
    return;
  }

  if (!window.map) {
    window.map = L.map(mapContainer).setView([36.7783, -119.4179], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(window.map);
  }

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
    year:     "numeric",
    month:    "2-digit",
    day:      "2-digit"
  });

  function extractCity(location) {
    if (!location) return "Unknown";
    const parts = location.split(",");
    return parts.length >= 2
      ? parts[parts.length - 2].trim()
      : parts[0].trim();
  }

  Promise.all([
    fetch(mergedUrl).then(r => r.ok ? r.json() : Promise.reject(r)),
    fetch(manualUrl).then(r => r.ok ? r.json() : Promise.reject(r)),
  ])
  .then(([autoJ, manualJ]) => {
    const autoEvents   = autoJ.data || [];
    const manualRaw    = manualJ.data?.searchEvents?.elements || [];
    const manualEvents = manualRaw.map(ev => ({
      date:     ev.date,
      endDate:  ev.date,
      lat:      ev.lat  ?? ev.latitude,
      lng:      ev.lng  ?? ev.longitude,
      location: ev.location,
      title:    ev.title,
      links:    [{ title: ev.title, href: ev.link }]
    }));

    const all = [...autoEvents, ...manualEvents];

    const upcoming = all
      .filter(ev =>
        ev.lat      != null &&
        ev.lng      != null &&
        (ev.endDate || ev.date) >= today
      )
      .sort((a, b) => {
        const c = extractCity(a.location)
                  .localeCompare(extractCity(b.location));
        return c || (a.date || "").localeCompare(b.date || "");
      });

    const markers = L.markerClusterGroup();
    upcoming.forEach(ev => {
      const list = ev.links
        .map(l => `<li><a href="${l.href}" target="_blank">${l.title}</a></li>`)
        .join("");
      const dateRange = ev.endDate && ev.endDate !== ev.date
        ? `${ev.date} – ${ev.endDate}`
        : ev.date;
      const popup = `
        <strong>${ev.title || extractCity(ev.location)}</strong><br>
        <em>${ev.location}</em><br>
        Dates: ${dateRange}<br>
        <ul style="padding-left:16px; margin:8px 0;">${list}</ul>
      `;
      L.marker([ev.lat, ev.lng])
        .bindPopup(popup)
        .addTo(markers);
    });
    window.map.addLayer(markers);
  })
  .catch(err => console.error("Error loading events:", err));
});
