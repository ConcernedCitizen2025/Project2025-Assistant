// assets/js/california-protest-map.js
document.addEventListener("DOMContentLoaded", async function () {
  const mapContainer = document.getElementById("california-map");
  if (!mapContainer) return console.error("Map container not found!");

  // 1) init map
  window.map = window.map || L.map(mapContainer).setView([36.7783, -119.4179], 6);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  // 2) helper to fetch & normalize
  async function loadJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    return res.json();
  }

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  try {
    // 3) fetch both feeds
    const [{ data: merged }, rawManual] = await Promise.all([
      loadJson("/assets/data/merged_events.json"),
      loadJson("/assets/data/protest_events.json"),
    ]);

    // 4) pull out manual elements
    const manual = rawManual.data?.searchEvents?.elements
      .map(ev => ({
        beginsOn: ev.date,
        lat: ev.lat  ?? ev.latitude,
        lng: ev.lng  ?? ev.longitude,
        location: ev.location,
        links: [{ title: ev.title, href: ev.link }],
      }))
      .filter(ev => ev.lat != null && ev.lng != null && ev.beginsOn >= today) 
      || [];

    const all = merged.concat(manual)
      .filter(ev => ev.beginsOn >= today)
      .sort((a,b)=>a.beginsOn.localeCompare(b.beginsOn));

    console.log(`📍 Plotting ${all.length} events (merged:${merged.length}, manual:${manual.length})`);

    // 5) add to map
    const markers = L.markerClusterGroup();
    all.forEach(ev => {
      const links = ev.links.map(l=>`<li><a href="${l.href}" target="_blank">${l.title}</a></li>`).join("");
      const popup = `
        <strong>${ev.location||"Unknown"}</strong><br>
        ${ev.beginsOn}<br>
        <ul>${links}</ul>
      `;
      markers.addLayer(L.marker([ev.lat, ev.lng]).bindPopup(popup));
    });
    map.addLayer(markers);

  } catch (err) {
    console.error(err);
  }
});
