document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("california-map");
  if (!container) {
    console.error("Map container not found!");
    return;
  }

  // init map only once
  if (!window.map) {
    window.map = L.map(container).setView([36.7783, -119.4179], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(window.map);
  }
  const map = window.map;

  // PST today in YYYY-MM-DD
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric", month: "2-digit", day: "2-digit"
  });

  fetch("/assets/data/merged_events.json")
    .then(res => {
      if (!res.ok) throw new Error("Fetch failed: " + res.status);
      return res.json();
    })
    .then(json => {
      const events = json.data || [];
      const cluster = L.markerClusterGroup();

      events
        .filter(ev => ev.lat != null && ev.lng != null && ev.end >= today)
        .forEach(ev => {
          const dateLabel = ev.begin === ev.end ? ev.begin : `${ev.begin} – ${ev.end}`;
          const links = (ev.links || [])
            .map(l => `<li><a href="${l.href}" target="_blank">${l.title}</a></li>`)
            .join("");
          const popup = `
            <strong>${ev.title || ev.location}</strong><br>
            <em>${ev.location}</em><br>
            <em>${dateLabel}</em>
            <ul style="padding-left:16px;margin:8px 0;">${links}</ul>
          `;
          cluster.addLayer(L.marker([ev.lat, ev.lng]).bindPopup(popup));
        });

      map.addLayer(cluster);
      console.log(`✅ Plotted ${cluster.getLayers().length} markers`);
    })
    .catch(err => console.error("Error loading merged_events.json:", err));
});
