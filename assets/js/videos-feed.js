// Videos feed renderer — reads /assets/data/videos.json and embeds
(function(){
  const GRID_ID = 'video-feed-grid';
  const DATA_URL = '/assets/data/videos.json?cb=' + Date.now();

  const $grid = document.getElementById(GRID_ID);
  if (!$grid) return;

  function ytid(url){
    const m = String(url).match(/[?&]v=([^&]+)|youtu\.be\/([^?&/]+)/);
    return (m && (m[1] || m[2])) || null;
  }

  function cardWrap(inner, meta){
    const title = meta.title ? `<div class="title">${escapeHtml(meta.title)}</div>` : '';
    const when  = meta.posted ? `<div class="when">${escapeHtml(meta.posted)}</div>` : '';
    const src   = meta.source ? `<div class="src">${escapeHtml(meta.source)}</div>` : '';
    return `<article class="video-card">
      ${inner}
      <div class="meta">${title}${when}${src}</div>
    </article>`;
  }

  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

  function render(items){
    if (!Array.isArray(items) || !items.length) {
      $grid.innerHTML = `<div class="vd-loading">No videos yet.</div>`;
      return;
    }
    // newest first by posted date (if present)
    items.sort((a,b)=>String(b.posted||'').localeCompare(String(a.posted||'')));

    const html = items.map(item=>{
      const type = (item.type||'').toLowerCase();
      const url  = item.url;
      const meta = { title: item.title, posted: item.posted, source: (item.source||type).toUpperCase() };

      if (type === 'youtube'){
        const id = ytid(url);
        if (!id) return cardWrap(`<div class="vd-loading">Bad YouTube URL</div>`, meta);
        const embed = `<iframe width="560" height="315" style="width:100%;aspect-ratio:16/9" 
            src="https://www.youtube-nocookie.com/embed/${id}" 
            title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
        return cardWrap(embed, meta);
      }

      if (type === 'instagram'){
        // blockquote per Instagram embed
        const embed = `<blockquote class="instagram-media" data-instgrm-permalink="${escapeHtml(url)}" data-instgrm-version="14" style="background:#FFF; border:0; margin:0; padding:0; width:100%;"></blockquote>`;
        return cardWrap(embed, meta);
      }

      if (type === 'facebook'){
        // fb-video element
        const embed = `<div class="fb-video" data-href="${escapeHtml(url)}" data-allowfullscreen="true" data-width="500"></div>`;
        return cardWrap(embed, meta);
      }

      // Fallback: simple link
      const link = `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">Open video</a>`;
      return cardWrap(link, meta);
    }).join('');

    $grid.innerHTML = html;

    // Kick provider parsers after DOM insertion
    if (window.instgrm && window.instgrm.Embeds && typeof window.instgrm.Embeds.process === 'function') {
      try { window.instgrm.Embeds.process(); } catch(e){}
    }
    if (window.FB && window.FB.XFBML && typeof window.FB.XFBML.parse === 'function') {
      try { window.FB.XFBML.parse($grid); } catch(e){}
    }
  }

  fetch(DATA_URL).then(r=>r.json()).then(js=>{
    // Accept either {items:[...]} or [...]
    const list = Array.isArray(js) ? js : js.items || [];
    // de-dupe by URL
    const seen = new Set();
    const dedup = list.filter(v => {
      const u = String(v.url||'').trim();
      if (!u || seen.has(u)) return false;
      seen.add(u);
      return true;
    });
    render(dedup.slice(0,48)); // show up to 48 latest
  }).catch(err=>{
    console.error('videos-feed:', err);
    $grid.innerHTML = `<div class="vd-loading">Could not load videos.</div>`;
  });
})();
