document.addEventListener("DOMContentLoaded", function() {
  const container = document.getElementById("california-map");
  if (!container) {
    console.error("Map container not found!");
    return;
  }

  // init map once
  if (!window.map) {
    window.map = L.map(container).setView([36.7783, -119.4179], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(window.map);
  }
  const map = window.map;

  // PST today for filtering
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
    year:     "numeric",
    month:    "2-digit",
    day:      "2-digit"
  });

  fetch("assets/data/merged_events.json")
    .then(res => {
      if (!res.ok) throw new Error("Failed to fetch merged events");
      return res.json();
    })
    .then(json => {
      const events = json.data || [];
      const markers = L.markerClusterGroup();

      events
        .filter(ev => ev.lat!=null && ev.lng!=null && ev.end >= today)
        .forEach(ev => {
          const start = ev.begin;
          const end   = ev.end;
          const dateLabel = start === end ? start : `${start} – ${end}`;
          const linksHtml = (ev.links||[])
            .map(l=>`<li><a href="${l.href}" target="_blank">${l.title}</a></li>`)
            .join("");

          const popup = `
            <strong>${ev.title || ev.location}</strong><br/>
            <em>${ev.location}</em><br/>
            <em>${dateLabel}</em>
            <ul style="margin:8px 0 0 16px;">${linksHtml}</ul>
          `;

          markers.addLayer(
            L.marker([ev.lat, ev.lng]).bindPopup(popup)
          );
        });

      map.addLayer(markers);
      console.log(`✅ Plotted ${markers.getLayers().length} markers`);
    })
    .catch(err => console.error("Error loading merged events:", err));
});
