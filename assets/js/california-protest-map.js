document.addEventListener("DOMContentLoaded", function () {
    const mapContainer = document.getElementById("california-map");
    const dataUrl = "/assets/data/protest_events.json";

    if (!mapContainer) {
        console.error("Map container not found!");
        return;
    }

    // Initialize Leaflet map
    if (!window.map) {
        window.map = L.map(mapContainer).setView([39.8283, -98.5795], 4);
    }

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const today = new Date().toISOString().split("T")[0];

    // Helper function to sort events
    function sortProtests(protests) {
        return protests.sort((a, b) => {
            const stateA = a.region || "";
            const stateB = b.region || "";
            if (stateA !== stateB) return stateA.localeCompare(stateB);

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
                .map((event) => {
                    const geom = event?.physicalAddress?.geom;
                    if (!geom || !/^-?\d+(\.\d+)?;-?\d+(\.\d+)?$/.test(geom)) return null;

                    const [lng, lat] = geom.split(";").map(Number);
                    const date = event.beginsOn?.split("T")[0];

                    return {
                        title: event.title,
                        date,
                        link: event.url,
                        latitude: lat,
                        longitude: lng,
                        city: event?.physicalAddress?.locality || event?.physicalAddress?.description || "Unknown",
                        region: event?.physicalAddress?.region || "",
                    };
                })
                .filter((event) => event && event.date >= today);

            upcomingProtests = sortProtests(upcomingProtests);

            let eventListHtml = "<ul>";

            upcomingProtests.forEach((event) => {
                const popupContent = `
                    <strong>${event.title}</strong><br>
                    <em>${event.city}${event.region ? ", " + event.region : ""}</em><br>
                    Date: ${event.date}<br>
                    <a href="${event.link}" target="_blank">View Event</a>
                `;

                L.marker([event.latitude, event.longitude])
                    .addTo(map)
                    .bindPopup(popupContent);

                eventListHtml += `<li><a href="${event.link}" target="_blank">${event.city} - ${event.date}</a></li>`;
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
