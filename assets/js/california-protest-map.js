// assets/js/california-protest-map.js — COMPLETE REWRITE
// --------------------------------------------------------------------
// Adds: date range filter bar (All/30/15/7/3/Today + Custom), live count
// persistence via localStorage, robust duplicate avoidance, and virtual toggle.
// --------------------------------------------------------------------

/** 0) FIRE ONLY ONCE — guard against double injection (duplicate <script> tags) */
if (window.__P25A_MAP_LOADED__) {
  console.debug("california protest map.js: already initialized → skip");
} else {
  window.__P25A_MAP_LOADED__ = true;
  document.addEventListener("DOMContentLoaded", () => {
    /* ---------------------------------------------------------------- 1. DOM refs */
    const mapEl = document.getElementById("california-map");
    if (!mapEl) return console.error("Map container #california-map not found!");

    /* ---------------------------------------------------------------- 2. Helpers */
    const ONE_DAY = 86_400_000;
    const PST_OFFSET = 420; // PST is UTC-8 (480), PDT is UTC-7 (420) in minutes
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const today = new Date(utc - PST_OFFSET * 60000); // Convert to PT
    today.setHours(0, 0, 0, 0);
    const fmt = (d)=>d.toISOString().slice(0,10);

    /* ---------------------------------------------------------------- 3. Map bootstrap (singletons) */
    if (!window.p25aMap) {
      window.p25aMap = L.map(mapEl);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:"&copy; OpenStreetMap contributors"
      }).addTo(window.p25aMap);
      if (L.Control?.geocoder) L.Control.geocoder({collapsed:false})
        .on("markgeocode", e=>window.p25aMap.fitBounds(e.geocode.bbox))
        .addTo(window.p25aMap);
      window.p25aMap.fitBounds([[24.396308,-124.848974],[49.384358,-66.885444]],{padding:[40,40]});
    }
    const map = window.p25aMap;

    /* ---------------------------------------------------------------- 4. UI BAR (build once) */
    let uiBar = document.getElementById("date-filter-bar");
    if (!uiBar) {
      uiBar = document.createElement("div");
      uiBar.id = "date-filter-bar";
      uiBar.style.cssText =
        "display:flex;flex-wrap:wrap;gap:8px;justify-content:center;"+
        "margin:12px auto;max-width:900px";
      mapEl.parentNode.insertBefore(uiBar, mapEl);
    }
    uiBar.innerHTML = "";

    const badge = document.createElement("span");
    badge.id="event-badge";
    badge.style.cssText="margin-left:8px;font-weight:600;font-size:.9em;"+
      "background:#eee;padding:4px 8px;border-radius:6px";

    const presets = [
      ["All",   "all"],
      ["30" ,   30   ],
      ["15" ,   15   ],
      ["7"  ,   7    ],
      ["3"  ,   3    ],
      ["Today",1    ],
    ];
    const makeBtn = (label,val)=>{
      const b=document.createElement("button");
      b.textContent=label;
      b.dataset.days=val;
      Object.assign(b.style,{padding:"6px 10px",border:"1px solid #666",borderRadius:"4px",cursor:"pointer",background:"#fafafa"});
      return b;
    };
    presets.forEach(([l,v])=>uiBar.appendChild(makeBtn(l,v)));
    const customBtn = makeBtn("Custom…","custom");
    uiBar.append(customBtn,badge);

    /* ---------------------------------------------------------------- 5. Data fetch */
    let raw=[]; let cluster;
    fetch(`/assets/data/merged_events.json?v=${Date.now()}`)
      .then(r=>r.json())
      .then(js=>{raw=js.data||[]; initFilter();})
      .catch(e=>console.error("merged_events.json fetch",e));

    /* ---------------------------------------------------------------- 6. Filtering */
    const labelOf = d=> d==="all"?"All Dates":d===1?"Today":d==="custom"?"Custom":`Next ${d} Days`;

    function render(list,lbl){
      if(cluster) map.removeLayer(cluster);
      cluster=L.markerClusterGroup({maxClusterRadius:40});
      list.forEach(ev=>{
        const dateStr = ev.begin === ev.end ? ev.begin : `${ev.begin} – ${ev.end}`;
        const links = (ev.links || []).map(l=>`<li><a href="${l.href}" target="_blank">${l.title}</a></li>`).join("");
        const popup = `<strong>${ev.title}</strong><br><em>${ev.location}</em><br><em>${dateStr}</em>`+
          (links ? `<ul style="padding-left:16px;margin:8px 0;">${links}</ul>` : "");
        cluster.addLayer(L.marker([ev.lat,ev.lng]).bindPopup(popup));
      });
      map.addLayer(cluster);
      badge.textContent=`Showing: ${lbl} — ${list.length} events`;
    }

    function applyPreset(days){
      if(days==="all") {
        const filtered = raw.filter(ev => ev.lat != null && new Date(ev.end) >= today);
        return render(filtered, labelOf("all"));
      }
      const cutoff = new Date(today.getTime() + (days - 1) * ONE_DAY);
      const filtered = raw.filter(ev => {
        const startDate = new Date(ev.begin);
        return ev.lat != null && startDate >= today && startDate <= cutoff;
      });
      render(filtered, labelOf(days));
    }

    function openCustom(){
      const wrap=document.createElement("div");
      Object.assign(wrap.style,{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999});
      wrap.innerHTML=`<div style=\"background:#fff;padding:20px;border-radius:8px;text-align:center\">
        <h3 style=\"margin-top:0\">Custom Range</h3>
        <label>Start:<br><input type=date id=start></label><br><br>
        <label>End:<br><input type=date id=end></label><br><br>
        <button id=apply>Apply</button> <button id=cancel>Cancel</button></div>`;
      document.body.appendChild(wrap);
      wrap.querySelector("#start").value=fmt(today);
      wrap.querySelector("#end").value=fmt(today);
      wrap.querySelector("#apply").onclick=()=>{
        const s=new Date(wrap.querySelector("#start").value);
        const e=new Date(wrap.querySelector("#end").value);
        const list=raw.filter(ev=>ev.lat!=null&&new Date(ev.begin)>=s&&new Date(ev.begin)<=e);
        render(list,`${s.toLocaleDateString()} – ${e.toLocaleDateString()}`);
        localStorage.setItem("p25a-date-range","custom");
        wrap.remove();
      };
      wrap.querySelector("#cancel").onclick=()=>wrap.remove();
    }

    function initFilter(){
      uiBar.querySelectorAll("button").forEach(btn=>{
        btn.onclick=()=>{
          const v=btn.dataset.days;
          if(v==="custom") return openCustom();
          localStorage.setItem("p25a-date-range",v);
          applyPreset(v==="all"?"all":parseInt(v,10));
        };
      });
      const saved=localStorage.getItem("p25a-date-range")||"all";
      applyPreset(saved==="all"?"all":saved==="custom"?"all":parseInt(saved,10));
    }

    /* ---------------------------------------------------------------- 7. Virtual Events Toggle */
    fetch(`/assets/data/virtual_events.json?v=${Date.now()}`)
      .then(r=>r.json())
      .then(js=>{
        const virtual=js.data||[];
        if(!virtual.length) return;
        const btn=document.createElement("button");
        btn.textContent="Show Virtual Events";
        Object.assign(btn.style,{display:"block",margin:"12px auto",padding:"12px 24px",backgroundColor:"#0073e6",color:"#fff",border:"none",borderRadius:"6px",fontSize:"1em",cursor:"pointer"});
        const list=document.createElement("ul");
        list.style.cssText="display:none;max-width:800px;margin:8px auto;padding:0 1em;list-style:none";
        virtual.sort((a,b)=>a.begin.localeCompare(b.begin)).forEach(ev=>{
          const li=document.createElement("li");
          const dateLabel=ev.begin===ev.end?ev.begin:`${ev.begin} – ${ev.end}`;
          const href=ev.links?.[0]?.href||"#";
          li.innerHTML=`<strong>${dateLabel}</strong> — <a href="${href}" target="_blank">${ev.title}</a>`+
            (ev.location?` (<em>${ev.location}</em>)`:" ");
          li.style.padding="6px 0";
          list.appendChild(li);
        });
        mapEl.parentNode.insertBefore(btn, mapEl.nextSibling);
        mapEl.parentNode.insertBefore(list, btn.nextSibling);
        btn.onclick=()=>{
          const showing=list.style.display==="block";
          list.style.display=showing?"none":"block";
          btn.textContent=showing?"Show Virtual Events":"Hide Virtual Events";
        };
      });

    /* ---------------------------------------------------------------- 8. Metadata timestamp */
    fetch(`/assets/data/events_meta.json?v=${Date.now()}`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{if(!d) return; const el=document.getElementById("map-last-updated"); if(el) el.textContent=`Map last updated: ${d.lastUpdated}`;});
  });
}
