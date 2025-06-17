// assets/js/california-protest-map.js
document.addEventListener("DOMContentLoaded", function () {
  const mapContainer = document.getElementById("california-map");
  const mergedUrl    = "/assets/data/merged_events.json";
  const manualUrl    = "/assets/data/protest_events.json";
  const virtualUrl   = "/assets/data/virtual_events.json";

  if (!mapContainer) {
    console.error("Map container not found!");
    return;
  }

  // 1) init map (or reuse)
  if (!window.map) {
    window.map = L.map(mapContainer).setView([36.7783, -119.4179], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(window.map);
  }

  // 2) helper fn’s
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles", year:"numeric", month:"2-digit", day:"2-digit"
  });
  function extractCity(loc="") {
    const parts = loc.split(",");
    return parts.length>1 
      ? parts[parts.length-2].trim() 
      : parts[0].trim() || "Unknown";
  }

  // 3) load & render geo + manual events
  Promise.all([
    fetch(mergedUrl).then(r=>r.ok?r.json():Promise.reject(r)),
    fetch(manualUrl).then(r=>r.ok?r.json():Promise.reject(r))
  ])
  .then(([geoJ, manualJ]) => {
    const autoEvents = geoJ.data||[];
    const manualRaw  = manualJ.data?.searchEvents?.elements||[];
    const manualEvs  = manualRaw.map(ev=>({
      beginsOn: ev.date, lat:ev.lat||ev.latitude, lng:ev.lng||ev.longitude,
      location:ev.location, title:ev.title, links:[{title:ev.title,href:ev.link}]
    }));
    const allEvs = [...autoEvents, ...manualEvs];

    // filter upcoming geo events
    const upcoming = allEvs
      .filter(ev=>ev.lat!=null && ev.lng!=null && ev.beginsOn>=today)
      .sort((a,b)=>{
        const c = extractCity(a.location).localeCompare(extractCity(b.location));
        return c||a.beginsOn.localeCompare(b.beginsOn);
      });

    const markers = L.markerClusterGroup();
    upcoming.forEach(ev=>{
      const links = ev.links.map(l=>`<li><a href="${l.href}" target="_blank">${l.title}</a></li>`).join("");
      const popup = `
        <strong>${ev.title||extractCity(ev.location)}</strong><br>
        <em>${ev.location}</em><br>
        Date: ${ev.beginsOn}<br>
        <ul style="padding-left:16px;margin:8px 0;">${links}</ul>
      `;
      L.marker([ev.lat,ev.lng]).bindPopup(popup).addTo(markers);
    });
    window.map.addLayer(markers);

    // 4) build virtual UI
    const btn = document.createElement("button");
    btn.id = "virtual-toggle";
    btn.textContent = "Show Virtual Events";
    btn.className = "virtual-btn";
    mapContainer.parentNode.insertBefore(btn, mapContainer.nextSibling);

    const listEl = document.createElement("ul");
    listEl.id = "virtual-events-list";
    listEl.style.display = "none";
    listEl.style.margin = "10px 0 20px";
    btn.insertAdjacentElement("afterend", listEl);

    btn.addEventListener("click", ()=>{
      const show = listEl.style.display==="none";
      listEl.style.display = show?"block":"none";
      btn.textContent = show?"Hide Virtual Events":"Show Virtual Events";
    });

    // 5) fetch & populate virtual list
    fetch(virtualUrl)
      .then(r=>r.ok?r.json():Promise.reject(r))
      .then(json=>{
        (json.data||[])
          .filter(ev=>
            ev.title && ev.links?.length &&
            !/^virtual\b/i.test((ev.location||""))
          )
          .sort((a,b)=>a.begin.localeCompare(b.begin))
          .forEach(ev=>{
            const dateStr = ev.begin===ev.end
              ? ev.begin
              : `${ev.begin} – ${ev.end}`;
            const href = ev.links[0].href;
            const li = document.createElement("li");
            li.innerHTML = `
              <strong>${dateStr}</strong> — 
              <a href="${href}" target="_blank">${ev.title}</a>
              ${ev.location?` (<em>${ev.location}</em>)`:``}
            `;
            listEl.appendChild(li);
          });
        if (!listEl.children.length) btn.style.display="none";
      })
      .catch(err=>console.error("Error loading virtual events:",err));
  })
  .catch(err=>console.error("Error loading geo/manual events:",err));
});
