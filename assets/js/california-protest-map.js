document.addEventListener("DOMContentLoaded", function() {
    const mapContainer = document.getElementById("california-map");

    // Initialize the map
    const map = L.map(mapContainer).setView([37.5, -119.5], 6); // Center on California

    // Load map tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Fetch protest events from events.json
    fetch("/assets/data/events.json")
        .then(response => response.json())
        .then(events => {
            events.forEach(event => {
                if (event.coords) {
                    L.marker(event.coords).addTo(map)
                        .bindPopup(`<strong>${event.title}</strong><br>
                                    📍 ${event.location}<br>
                                    📅 ${event.date}<br>
                                    <a href="${event.link}" target="_blank">More Info</a>`);
                }
            });
        })
        .catch(error => console.error("❌ Error loading events:", error));
});
