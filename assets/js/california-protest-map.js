// assets/js/california-protest-map.js

document.addEventListener("DOMContentLoaded", function () {
    const mapContainer = document.getElementById("california-map");
    const manualUrl   = "/assets/data/protest_events.json";
    const autoUrl     = "/assets/data/mobilize_protests.json";

    if (!mapContainer) {
        console.error("Map container not found!");
        return;
    }

    if (!window.map) {
        window.map = L.map(mapContainer).setView([36.7783, -119.4179], 6);
    }

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const today = new Date().toISOString().split("T")[0];

    function extractCity(location) {
        if (!location) return "Unknown";
        const parts = location.split(",");
        if (parts.length >= 2) {
            return parts[parts.length - 2].trim();
        }
        return parts[0].trim();
    }

    // fetch both manual and auto data, then merge
    Promise.all([
        fetch(manualUrl).then(res => {
            if (!res.ok) throw new Error("Failed to fetch manual protest data");
            return res.json();
        }),
        fetch(autoUrl).then(res => {
            if (!res.ok) throw new Error("Failed to fetch Mobilize protest data");
            return res.json();
        })
    ])
    .then(([manualData, autoData]) => {
        // extract your hand-curated events
        const manualEvents = manualData.data?.searchEvents?.elements || manualData.events || [];
        // extract the Mobilize-fetched events
        const autoEvents   = autoData.events || [];
        // merge them
        const events = [...manualEvents, ...autoEvents];

        // filter, normalize, sort
        const upcomingProtests = events
            .filter(evt =>
                (evt.lat || evt.latitude) &&
                (evt.lng || evt.longitude) &&
                evt.date >= today
            )
            .map(evt => {
                const lat  = evt.lat || evt.latitude;
                const lng  = evt.lng || evt.longitude;
                const city = extractCity(evt.location);
                return { ...evt, lat, lng, city };
            })
            .sort((a, b) => {
                const cmp = a.city.localeCompare(b.city);
                return cmp !== 0 ? cmp : a.date.localeCompare(b.date);
            });

        // build markers + list HTML
        const markers = L.markerClusterGroup();
        let eventListHtml = "<ul>";

        upcomingProtests.forEach(event => {
            const popupContent = `
                <strong>${event.title}</strong><br>
                <em>${event.location}</em><br>
                Date: ${event.date}<br>
                <a href="${event.link}" target="_blank">View Event</a>
            `;

            const marker = L.marker([event.lat, event.lng])
                .bindPopup(popupContent);

            markers.addLayer(marker);

            eventListHtml += `
                <li>
                  <strong>${event.city}</strong>:
                  <a href="${event.link}" target="_blank">${event.title}</a>
                  – ${event.date}
                </li>
            `;
        });

        eventListHtml += "</ul>";

        map.addLayer(markers);

        // inject the list into your page
        const eventListElement = document.getElementById("event-list");
        if (eventListElement) {
            eventListElement.innerHTML = eventListHtml;
        }
    })
    .catch(error => {
        console.error("Error loading protest data:", error);
        const eventListElement = document.getElementById("event-list");
        if (eventListElement) {
            eventListElement.innerHTML = "<p>Failed to load events.</p>";
        }
    });
});
