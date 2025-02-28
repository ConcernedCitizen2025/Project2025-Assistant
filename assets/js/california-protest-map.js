document.addEventListener("DOMContentLoaded", function() {
    const mapContainer = document.getElementById("california-map");

    // Initialize the map, focused on California
    const map = L.map(mapContainer).setView([37.5, -119.5], 6); 

    // Load map tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Fetch events from JSON
    fetch("/assets/data/events.json")
        .then(response => response.json())
        .then(events => {
            const californiaEvents = events.filter(event => event.location.includes("CA") || event.location.includes("California"));

            if (californiaEvents.length === 0) {
                document.getElementById("event-list").innerHTML = "<p>No upcoming California events found.</p>";
                return;
            }

            let eventListHtml = "<ul>";
            
            californiaEvents.forEach(event => {
                // Add a marker for each California event
                L.marker([event.latitude, event.longitude])
                    .addTo(map)
                    .bindPopup(`<strong>${event.title}</strong><br><a href="${event.link}" target="_blank">View Event</a>`);

                // Add the event to the list below the map
                eventListHtml += `<li><a href="${event.link}" target="_blank">${event.title}</a></li>`;
            });

            eventListHtml += "</ul>";
            document.getElementById("event-list").innerHTML = eventListHtml;
        })
        .catch(error => {
            console.error("Error loading events:", error);
            document.getElementById("event-list").innerHTML = "<p>Failed to load events.</p>";
        });
});
