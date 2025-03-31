document.addEventListener("DOMContentLoaded", function () {
    const mapContainer = document.getElementById("california-map");
    const dataUrl = "/assets/data/protest_events.json";

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
        // Try the second-to-last or last part for the city
        if (parts.length >= 2) {
            return parts[parts.length - 2].trim();
        }
        return parts[0].trim();
    }

    fetch(dataUrl)
        .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch protest data");
            return res.json();
        })
        .then((data) => {
            const events = data?.data?.searchEvents?.elements || [];

            const upcomingProtests = events
                .filter((event) => (event.lat || event.latitude) && (event.lng || event.longitude) && event.date >= today)
                .map((event) => {
                    const lat = event.lat || event.latitude;
                    const lng = event.lng || event.longitude;
                    const city = extractCity(event.location);
                    return { ...event, lat, lng, city };
                })
                .sort((a, b) => {
                    const cityCompare = a.city.localeCompare(b.city);
                    return cityCompare !== 0 ? cityCompare : a.date.localeCompare(b.date);
                });

            let eventListHtml = "<ul>";

            upcomingProtests.forEach((event) => {
                const popupContent = `
                    <strong>${event.title}</strong><br>
                    <em>${event.location}</em><br>
                    Date: ${event.date}<br>
                    <a href="${event.link}" target="_blank">View Event</a>
                `;

                L.marker([event.lat, event.lng])
                    .addTo(map)
                    .bindPopup(popupContent);

                eventListHtml += `<li><strong>${event.city}</strong>: <a href="${event.link}" target="_blank">${event.title}</a> – ${event.date}</li>`;
            });

            eventListHtml += "</ul>";

            const eventListElement = document.getElementById("event-list");
            if (eventListElement) {
                eventListElement.innerHTML = eventListHtml;
            }
        })
        .catch((error) => {
            console.error("Error loading protest data:", error);
            const eventListElement = document.getElementById("event-list");
            if (eventListElement) {
                eventListElement.innerHTML = "<p>Failed to load events.</p>";
            }
        });
});
