document.addEventListener("DOMContentLoaded", function () {
    const acceptButton = document.getElementById('accept-cookies');
    const rejectButton = document.getElementById('reject-cookies');

    // Show the banner if consent hasn't been provided
    if (!getCookie('cookie_consent')) {
        document.getElementById('cookie-consent-banner').style.display = 'block';
    }

    // Full tracking on "Accept"
    acceptButton.addEventListener('click', function () {
        setCookie('cookie_consent', 'accepted', 365); // Store consent in a cookie
        enableTrackingScripts(); // Enable Google Analytics tracking
        document.getElementById('cookie-consent-banner').style.display = 'none';
    });

    // Anonymous tracking on "Reject"
    rejectButton.addEventListener('click', function () {
        setCookie('cookie_consent', 'rejected', 365); // Store consent in a cookie
        recordAnonymousPageView(); // Track only anonymous page views
        document.getElementById('cookie-consent-banner').style.display = 'none';
    });

    // Set a cookie
    function setCookie(name, value, days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        let expires = "expires=" + date.toUTCString();
        document.cookie = name + "=" + value + ";" + expires + ";path=/";
    }

    // Get a cookie value
    function getCookie(name) {
        let cookieArr = document.cookie.split(";");
        for (let i = 0; i < cookieArr.length; i++) {
            let cookiePair = cookieArr[i].split("=");
            if (name == cookiePair[0].trim()) {
                return decodeURIComponent(cookiePair[1]);
            }
        }
        return null;
    }

    // Full tracking scripts (Google Analytics)
    function enableTrackingScripts() {
        // Insert your Google Analytics tracking code here
        console.log("Full tracking enabled!");
    }

    // Anonymous page view tracking
    function recordAnonymousPageView() {
        // Example: sending anonymous pageview count to server without personal data
        console.log("Anonymous page view recorded");
    }
});
