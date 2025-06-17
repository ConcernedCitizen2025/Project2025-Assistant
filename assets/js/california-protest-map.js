document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("california-map");
  if (!container) {
    console.error("Map container not found!");
    return;
  }

  // 1) Initialize the map once
  if (!window.map) {
    window.map = L.map(container).setView([36.7783, -119.4179], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(window.map);
  }
  const map = window.map;

  // PST “today” string for filtering
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric", month: "2-digit", day: "2-digit"
  });

  // Plot geo-coded events from merged_events.json
  fetch("/assets/data/merged_events.json")
    .then(res => res.ok ? res.json() : Promise.reject(res))
    .then(json => {
      const cluster = L.markerClusterGroup();
      (json.data || [])
        .filter(ev => ev.lat != null && ev.lng != null && ev.end >= today)
        .forEach(ev => {
          const dateLabel = ev.begin === ev.end
            ? ev.begin
            : `${ev.begin} – ${ev.end}`;
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

  // 2) Fetch and render “virtual” events toggle (only one button)
  fetch("/assets/data/virtual_events.json")
    .then(res => res.ok ? res.json() : Promise.reject(res))
    .then(json => {
      const virtual = (json.data || [])
        .filter(ev => ev.title && ev.links?.length && ev.end >= today)
        .sort((a, b) => a.begin.localeCompare(b.begin));
      if (!virtual.length) return;  // nothing to show

      // avoid creating a second button
      if (document.getElementById("virtual-toggle-btn")) return;

      // create toggle button
      const btn = document.createElement("button");
      btn.id = "virtual-toggle-btn";
      btn.textContent = "Show Virtual Events";
      Object.assign(btn.style, {
        display: "block",
        margin: "12px auto",
        padding: "12px 24px",
        backgroundColor: "#0073e6",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        fontSize: "1em",
        cursor: "pointer"
      });

      // create hidden list
      const list = document.createElement("ul");
      list.id = "virtual-events-list";
      Object.assign(list.style, {
        display: "none",
        maxWidth: "800px",
        margin: "8px auto",
        padding: "0 1em",
        listStyle: "none"
      });

      // populate list
      virtual.forEach(ev => {
        const li = document.createElement("li");
        const dateLabel = ev.begin === ev.end
          ? ev.begin
          : `${ev.begin} – ${ev.end}`;
        const href = ev.links[0].href || "#";
        li.innerHTML = `<strong>${dateLabel}</strong> — <a href="${href}" target="_blank">${ev.title}</a>`
                     + (ev.location ? ` (<em>${ev.location}</em>)` : "");
        li.style.padding = "6px 0";
        list.appendChild(li);
      });

      // insert right after the map
      container.parentNode.insertBefore(btn, container.nextSibling);
      container.parentNode.insertBefore(list, btn.nextSibling);

      // wire up toggle
      btn.addEventListener("click", () => {
        const showing = list.style.display === "block";
        list.style.display = showing ? "none" : "block";
        btn.textContent = showing ? "Show Virtual Events" : "Hide Virtual Events";
      });
    })
    .catch(err => console.error("Error loading virtual_events.json:", err));
});
