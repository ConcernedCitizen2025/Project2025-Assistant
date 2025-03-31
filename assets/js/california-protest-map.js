document.addEventListener("DOMContentLoaded", function () {
    const mapContainer = document.getElementById("california-map");
    const dataUrl = "/assets/data/protest_events.json";

    if (!mapContainer) {
        console.error("Map container not found!");
        return;
    }

    // Initialize Leaflet map
    if (!window.map) {
        window.map = L.map(mapContainer).setView([37.5, -119.5], 6); // CA-focused
    }

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const today = new Date().toISOString().split("T")[0];

    // Helper function to sort events
    function sortProtests(protests) {
        return protests.sort((a, b) => {
            const cityA = a.city || "";
            const cityB = b.city || "";
            if (cityA !== cityB) return cityA.localeCompare(cityB);

            return (a.date || "").localeCompare(b.date || "");
        });
    }

    fetch(dataUrl)
        .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch protest data");
            return res.json();
        })
        .then((data) => {
            const events = data?.data?.searchEvents?.elements || [];

            let upcomingProtests = events
                .filter(event => event.latitude && event.longitude && event.date >= today)
                .map(event => ({
                    title: event.title,
                    date: event.date,
                    link: event.link,
                    latitude: event.latitude,
                    longitude: event.longitude,
                    location: event.location
                }));

            upcomingProtests = sortProtests(upcomingProtests);

            let eventListHtml = "<ul>";

            upcomingProtests.forEach((event) => {
                const popupContent = `
                    <strong>${event.title}</strong><br>
                    <em>${event.location}</em><br>
                    Date: ${event.date}<br>
                    <a href="${event.link}" target="_blank">View Event</a>
                `;

                L.marker([event.latitude, event.longitude])
                    .addTo(map)
                    .bindPopup(popupContent);

                eventListHtml += `<li><a href="${event.link}" target="_blank">${event.title} - ${event.date}</a></li>`;
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
