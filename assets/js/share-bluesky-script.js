
function shareToBluesky(title, url) {
    const text = `${title}: ${url}`;
    const shareUrl = `https://bsky.app/compose?text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank');
}



