// assets/js/california-protest-map.js
document.addEventListener("DOMContentLoaded", function() {
  const container = document.getElementById("california-map");
  if (!container) {
    console.error("Map container not found!");
    return;
  }

  // initialize map once
  if (!window.map) {
    window.map = L.map(container).setView([36.7783, -119.4179], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(window.map);
  }
  const map = window.map;

  // today in PST
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
    year:    "numeric",
    month:   "2-digit",
    day:     "2-digit"
  });

  fetch("/assets/data/merged_events.json")
    .then(res => {
      if (!res.ok) throw new Error("Failed to fetch merged_events.json");
      return res.json();
    })
    .then(json => {
      const events = json.data || [];

      // keep only those with coords and end-date ≥ today
      const upcoming = events.filter(ev => {
        const end = ev.end || ev.begin;
        return ev.lat != null && ev.lng != null && end >= today;
      });

      const markers = L.markerClusterGroup();

      upcoming.forEach(ev => {
        // single vs range label
        const end = ev.end || ev.begin;
        const dateLabel = ev.begin === end
          ? ev.begin
          : `${ev.begin} – ${end}`;

        // build popup links
        const links = (ev.links || [])
          .map(l => `<li><a href="${l.href}" target="_blank">${l.title}</a></li>`)
          .join("");

        const popup = `
          <strong>${ev.location || "Unknown location"}</strong><br/>
          <em>${dateLabel}</em>
          <ul style="margin:8px 0 0 16px;">${links}</ul>
        `;

        markers.addLayer(
          L.marker([ev.lat, ev.lng]).bindPopup(popup)
        );
      });

      map.addLayer(markers);
      console.log(`✅ Plotted ${upcoming.length} events`);
    })
    .catch(err => console.error("Error loading events:", err));
});
