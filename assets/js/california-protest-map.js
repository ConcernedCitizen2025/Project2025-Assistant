document.addEventListener("DOMContentLoaded", function () {
    const mapContainer = document.getElementById("california-map");

    if (!mapContainer) {
        console.error("❌ Map container not found.");
        return;
    }

    // Initialize the map
    const map = L.map(mapContainer).setView([37.5, -119.5], 6); // Center on California

    // Load map tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Fetch event data from JSON
    fetch("/assets/data/events.json")
        .then((response) => response.json())
        .then((events) => {
            events.forEach((event) => {
                // Ensure we have valid coordinates
                if (!event.latitude || !event.longitude) {
                    console.warn(`⚠️ Skipping event due to missing coordinates: ${event.title}`);
                    return;
                }

                // Create a marker for the event
                const marker = L.marker([event.latitude, event.longitude]).addTo(map);

                // Add popup with event details
                marker.bindPopup(
                    `<strong>${event.title}</strong><br>
                     <em>${new Date(event.date).toLocaleString()}</em><br>
                     <a href="${event.link}" target="_blank">View Event</a>`
                );
            });

            console.log(`✅ Loaded ${events.length} events onto the map.`);
        })
        .catch((error) => {
            console.error("❌ Error loading events:", error);
        });
});
