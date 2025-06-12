document.addEventListener("DOMContentLoaded", function () {
  const mapContainer = document.getElementById("california-map");
  const dataUrl      = "/assets/data/merged_events.json";  // ← here

  if (!mapContainer) {
    console.error("Map container not found!");
    return;
  }

  // initialize map if needed
  if (!window.map) {
    window.map = L.map(mapContainer).setView([36.7783, -119.4179], 6);
  }

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  const today = new Date().toISOString().split("T")[0];

  fetch(dataUrl)
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch merged events");
      return res.json();
    })
    .then((json) => {
      const events = json.data || [];

      // only future events with coords
      const upcoming = events
        .filter(
          (ev) =>
            ev.lat != null &&
            ev.lng != null &&
            ev.beginsOn >= today
        )
        .sort((a, b) => a.beginsOn.localeCompare(b.beginsOn));

      const markers = L.markerClusterGroup();

      upcoming.forEach((ev) => {
        // build a list of links
        const linksHtml = ev.links
          .map(
            (l) =>
              `<li><a href="${l.href}" target="_blank">${l.title}</a></li>`
          )
          .join("");

        const popupContent = `
          <strong>${ev.location || "Unknown location"}</strong><br>
          <em>${ev.beginsOn}</em><br>
          <ul style="padding-left:16px; margin:8px 0;">${linksHtml}</ul>
        `;

        const marker = L.marker([ev.lat, ev.lng]).bindPopup(popupContent);
        markers.addLayer(marker);
      });

      map.addLayer(markers);
    })
    .catch((err) => {
      console.error("Error loading merged events:", err);
    });
});
