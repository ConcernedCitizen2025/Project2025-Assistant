// assets/js/california-protest-map.js
document.addEventListener("DOMContentLoaded", async function () {
  const container = document.getElementById("california-map");
  if (!container) {
    console.error("Map container not found!");
    return;
  }

  // Initialize Leaflet map once
  if (!window.map) {
    window.map = L.map(container).setView([36.7783, -119.4179], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(window.map);
  }
  const map = window.map;

  // Today in PST, YYYY-MM-DD
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
    year:    "numeric",
    month:   "2-digit",
    day:     "2-digit",
  });

  try {
    // Fetch merged + manual in parallel
    const [mResp, pResp] = await Promise.all([
      fetch("/assets/data/merged_events.json"),
      fetch("/assets/data/protest_events.json"),
    ]);
    if (!mResp.ok || !pResp.ok) throw new Error("Failed to fetch data files");

    const { data: merged = [] } = await mResp.json();
    const pJson = await pResp.json();
    const manualRaw = pJson.data?.searchEvents?.elements || [];

    // Normalize manual entries
    const manual = manualRaw
      .map(ev => ({
        begin: ev.date,
        end:   ev.date,
        lat:   ev.lat ?? ev.latitude,
        lng:   ev.lng ?? ev.longitude,
        location: ev.location,
        links: [{ title: ev.title, href: ev.link }],
      }))
      // require coords and future
      .filter(ev => ev.lat != null && ev.end >= today);

    // Combine + filter by end date
    const all = merged
      .concat(manual)
      .filter(ev => ev.lat != null && ev.lng != null && ev.end >= today)
      .sort((a, b) => a.begin.localeCompare(b.begin));

    // Cluster and add
    const cluster = L.markerClusterGroup();
    all.forEach(ev => {
      const dateLabel = ev.begin === ev.end
        ? ev.begin
        : `${ev.begin} – ${ev.end}`;
      const links = ev.links
        .map(l => `<li><a href="${l.href}" target="_blank">${l.title}</a></li>`)
        .join("");
      const popup = `
        <strong>${ev.location || "Unknown"}</strong><br>
        <em>${dateLabel}</em>
        <ul style="margin:8px 0 0 16px;">${links}</ul>
      `;
      cluster.addLayer(L.marker([ev.lat, ev.lng]).bindPopup(popup));
    });
    map.addLayer(cluster);

    console.log(`✅ Rendered ${all.length} markers (incl. series & manual)`);
  } catch (err) {
    console.error("Error loading events:", err);
  }
});
