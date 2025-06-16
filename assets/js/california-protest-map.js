document.addEventListener("DOMContentLoaded", function () {
  const mapContainer = document.getElementById("california-map");
  const dataUrl      = "/assets/data/merged_events.json";

  if (!mapContainer) {
    console.error("Map container not found!");
    return;
  }

  if (!window.map) {
    window.map = L.map(mapContainer).setView([36.7783, -119.4179], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
  }

  // PST today in YYYY-MM-DD
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
    year:    "numeric",
    month:   "2-digit",
    day:     "2-digit"
  });

  fetch(dataUrl)
    .then(res => {
      if (!res.ok) throw new Error("Failed to fetch merged events");
      return res.json();
    })
    .then(obj => {
      const events = obj.data || [];

      // upcoming (by end date) & with coords
      const upcoming = events
        .filter(ev =>
          ev.lat != null &&
          ev.lng != null &&
          ev.end >= today
        )
        .sort((a, b) => a.begin.localeCompare(b.begin));

      const markers = L.markerClusterGroup();

      upcoming.forEach(ev => {
        // date label: single vs range
        const dateLabel = ev.begin === ev.end
          ? ev.begin
          : `${ev.begin} – ${ev.end}`;

        // build links list
        const linksHtml = ev.links
          .map(l => `<li><a href="${l.href}" target="_blank">${l.title}</a></li>`)
          .join("");

        const popup = `
          <strong>${ev.location || "Unknown location"}</strong><br>
          <em>${dateLabel}</em><br>
          <ul style="padding-left:16px; margin:8px 0;">${linksHtml}</ul>
        `;

        L.marker([ev.lat, ev.lng])
         .bindPopup(popup)
         .addTo(markers);
      });

      map.addLayer(markers);
    })
    .catch(err => console.error("Error loading merged events:", err));
});
