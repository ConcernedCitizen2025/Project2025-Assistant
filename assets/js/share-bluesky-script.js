
function shareToBluesky(title, url) {
    const text = `${title}: ${url}`;
    const shareUrl = `https://bsky.app/compose?text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank');
}

function copyBlueskyShare(title, url) {
    const shareText = `${title}: ${url}`;
    navigator.clipboard.writeText(shareText).then(() => {
        alert('Page details copied! Open Bluesky and paste to share.');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy text. Please try again.');
    });
}


