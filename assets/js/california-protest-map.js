document.addEventListener("DOMContentLoaded", function() {
    const mapContainer = document.getElementById("california-map");

    if (!mapContainer) return;

    // Initialize the map, focused on the U.S.
    const map = L.map(mapContainer).setView([39.8283, -98.5795], 4);

    // Load map tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Get today's date for filtering
    const today = new Date().toISOString().split("T")[0];

    // Protest locations
    const protestLocations = [
        { city: "Irvine, CA", coords: [33.6846, -117.8265], link: "https://events.pol-rev.com/events/b9d30c6b-9649-4b92-9a86-d4af6d6c15c3", date: "2025-03-09" },
        { city: "Irvine, CA", coords: [33.6846, -117.8265], link: "https://events.pol-rev.com/events/e96254d3-d538-4b54-b70a-79771517b62b", date: "2025-03-16" },
        { city: "San Luis Obispo, CA", coords: [35.2828, -120.6596], link: "https://events.pol-rev.com/events/9c2d9347-f5fc-4f2e-a1f4-30c1bd48282f", date: "2025-03-08" },
        { city: "Monterey, CA", coords: [36.6002, -121.8947], link: "https://events.pol-rev.com/events/1da5faad-cd3d-444f-952d-98c17bc0515b", date: "2025-03-08" },
        { city: "Palo Alto, CA", coords: [37.4419, -122.1430], link: "https://events.pol-rev.com/events/5999444e-d23a-4760-9a83-3bc074af4452", date: "2025-03-07" },
        { city: "San Jose, CA", coords: [37.3382, -121.8863], link: "https://events.pol-rev.com/events/6bed0fc6-1040-46b1-a003-b7c258c1aabc", date: "2025-03-08" },
        { city: "Las Vegas, NV", coords: [36.1699, -115.1398], link: "https://events.pol-rev.com/events/519ebb45-5212-4a1a-81b5-21fd010f67e1", date: "2025-03-08" },
        { city: "Milwaukie, OR", coords: [45.4469, -122.6397], link: "https://events.pol-rev.com/events/4f56e486-6e8e-4edd-8aee-ee6b958d1c66", date: "2025-03-07" },
        { city: "Portland, OR", coords: [45.5051, -122.6750], link: "https://events.pol-rev.com/events/ba3df3b9-85e3-49d0-a933-e3ec09a774f0", date: "2025-03-10" },
        { city: "Portland, OR", coords: [45.5152, -122.6784], link: "https://events.pol-rev.com/events/68d1df35-2fdf-4eed-8b28-342a93b865d9", date: "2025-03-08" },
        { city: "Olympia, WA", coords: [47.0379, -122.9007], link: "https://events.pol-rev.com/events/9ada42b1-9c89-4c35-ac76-646269f3f643", date: "2025-03-08" },
        { city: "Seattle, WA", coords: [47.6062, -122.3321], link: "https://events.pol-rev.com/events/16b82fcb-ac85-4aa9-8d51-16aa8e3cffa3", date: "2025-03-06" },
        { city: "Kirkland, WA", coords: [47.6815, -122.2087], link: "https://events.pol-rev.com/events/5e89797e-e039-44f1-838e-a6601202f545", date: "2025-03-06" },
        { city: "Corpus Christi, TX", coords: [27.8006, -97.3964], link: "https://events.pol-rev.com/events/396dc646-b83d-40ea-ae0f-b12f59eaaf5b", date: "2025-03-08" },
        { city: "Sioux Falls, SD", coords: [43.5460, -96.7313], link: "https://events.pol-rev.com/events/50074918-969d-48f2-9b5d-757030c7383f", date: "2025-03-08" },
        { city: "Washington, DC", coords: [38.9072, -77.0369], link: "https://events.pol-rev.com/events/9ada42b1-9c89-4c35-ac76-646269f3f643", date: "2025-03-08" },
        { city: "Anchorage, AK", coords: [61.2181, -149.9003], link: "https://events.pol-rev.com/events/a7d32b36-6a69-450f-b6b7-71a5ad007c68", date: "2025-03-09" }
    ];

    // Filter out past events
    const upcomingProtests = protestLocations.filter(event => event.date >= today);

    // Add markers to the map
    upcomingProtests.forEach(location => {
        let popupContent = `<strong>${location.city}</strong><br>Date: ${location.date}<br><a href="${location.link}" target="_blank">View Event</a>`;

        L.marker(location.coords)
            .addTo(map)
            .bindPopup(popupContent);
    });

    // List the events below the map
    let eventListHtml = "<ul>";
    upcomingProtests.forEach(location => {
        eventListHtml += `<li><a href="${location.link}" target="_blank">${location.city} - ${location.date}</a></li>`;
    });
    eventListHtml += "</ul>";

    document.getElementById("event-list").innerHTML = eventListHtml;
});
