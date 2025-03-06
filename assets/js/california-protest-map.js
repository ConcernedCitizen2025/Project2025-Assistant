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
        { city: "Paradise, NV", coords: [36.0986, -115.1467], link: "https://events.pol-rev.com/events/519ebb45-5212-4a1a-81b5-21fd010f67e1", date: "2025-03-08" },
        { city: "Milwaukie, OR", coords: [45.4464, -122.6391], link: "https://events.pol-rev.com/events/4f56e486-6e8e-4edd-8aee-ee6b958d1c66", date: "2025-03-07" },
        { city: "Portland, OR", coords: [45.5051, -122.6750], link: "https://events.pol-rev.com/events/ba3df3b9-85e3-49d0-a933-e3ec09a774f0", date: "2025-03-10" },
        { city: "Portland, OR", coords: [45.5231, -122.6765], link: "https://events.pol-rev.com/events/68d1df35-2fdf-4eed-8b28-342a93b865d9", date: "2025-03-08" },
        { city: "Olympia, WA", coords: [47.0379, -122.9007], link: "https://events.pol-rev.com/events/9ada42b1-9c89-4c35-ac76-646269f3f643", date: "2025-03-08" },
        { city: "Seattle, WA", coords: [47.6062, -122.3321], link: "https://events.pol-rev.com/events/5ab0ec91-e8a8-43cc-a7da-f93f9b4e9270", date: "2025-03-20" },
        { city: "Seattle, WA", coords: [47.6062, -122.3321], link: "https://events.pol-rev.com/events/333a531c-b1e1-48c2-8a95-19f849880bfe", date: "2025-03-13" },
        { city: "Seattle, WA", coords: [47.6062, -122.3321], link: "https://events.pol-rev.com/events/f8c3d79a-6d67-4a74-b015-38a6fa2c2eea", date: "2025-03-27" },
        { city: "Seattle, WA", coords: [47.6062, -122.3321], link: "https://events.pol-rev.com/events/16b82fcb-ac85-4aa9-8d51-16aa8e3cffa3", date: "2025-03-06" },
        { city: "Austin, TX", coords: [30.2672, -97.7431], link: "https://events.pol-rev.com/events/30c49579-ba68-4659-8157-d56c14d28141", date: "2025-03-12" },
        { city: "Washington, DC", coords: [38.9072, -77.0369], link: "https://events.pol-rev.com/events/7b6d2ddf-c882-4790-8a8f-d0b62741536d", date: "2025-03-14" },
        { city: "San Diego, CA", coords: [32.8801, -117.2340], link: "https://events.pol-rev.com/events/a2f299ab-e005-467c-957b-8312ba300307", date: "2025-03-07" },
        { city: "Chicopee, MA", coords: [42.1487, -72.6079], link: "https://events.pol-rev.com/events/c0104397-c836-496e-b59b-668142ba9835", date: "2025-03-15" },
        { city: "Keene, NH", coords: [42.9336, -72.2781], link: "https://events.pol-rev.com/events/df8cd1b1-8bc8-4533-b53b-adbae31fd07e", date: "2025-03-08" },
        { city: "Corpus Christi, TX", coords: [27.8006, -97.3964], link: "https://events.pol-rev.com/events/396dc646-b83d-40ea-ae0f-b12f59eaaf5b", date: "2025-03-08" },
        { city: "Detroit, MI", coords: [42.3314, -83.0458], link: "https://events.pol-rev.com/events/5fce5656-ffac-4d25-abaa-5aaea886fa6a", date: "2025-03-08" },
        { city: "Anchorage, AK", coords: [61.2181, -149.9003], link: "https://events.pol-rev.com/events/a7d32b36-6a69-450f-b6b7-71a5ad007c68", date: "2025-03-09" },
        { city: "Sioux Falls, SD", coords: [43.5460, -96.7313], link: "https://events.pol-rev.com/events/50074918-969d-48f2-9b5d-757030c7383f", date: "2025-03-08" },
        { city: "Pinellas County, FL", coords: [27.8918, -82.7248], link: "https://events.pol-rev.com/events/eb9d8008-9b1e-43c1-8e4d-59d5ba4dbd74", date: "2025-03-15" },
        { city: "New Bern, NC", coords: [35.1085, -77.0441], link: "https://events.pol-rev.com/events/9145f129-c2bf-45c7-aa1d-b5b058d58533", date: "2025-04-19" },
        { city: "Cape May, NJ", coords: [38.9351, -74.9060], link: "https://events.pol-rev.com/events/fe6d412d-9877-462f-b3c9-527a3c28d809", date: "2025-03-08" },
        { city: "New York, NY", coords: [40.7128, -74.0060], link: "https://events.pol-rev.com/events/9f74f2f6-a5b4-473f-9939-f26af6e84c7c", date: "2025-03-21" },
        { city: "Danbury, CT", coords: [41.3948, -73.4540], link: "https://events.pol-rev.com/events/0a0ff72d-9684-49e3-948e-82493c79e200", date: "2025-03-08" },
        { city: "Concord, NH", coords: [43.2081, -71.5376], link: "https://events.pol-rev.com/events/e42e7709-1adf-410f-b7d3-5f484aa8c9c1", date: "2025-03-08" },
        { city: "Saint Paul, MN", coords: [44.9537, -93.0900], link: "https://events.pol-rev.com/events/f2e4ffea-d0c2-438d-ad50-f272e7e6bd05", date: "2025-03-08" },
        { city: "Milwaukee, WI", coords: [43.0389, -87.9065], link: "https://events.pol-rev.com/events/822b1e5e-c52f-4f26-976d-4f03f4691fa5", date: "2025-03-08" },
        { city: "Ashland, WI", coords: [46.5925, -90.8830], link: "https://events.pol-rev.com/events/82b5e057-5b9d-4bd0-9ab0-266727118bda", date: "2025-03-09" },
        { city: "Delaware, OH", coords: [40.2987, -83.0679], link: "https://events.pol-rev.com/events/646c3770-c730-43f2-9a80-b66d3d3ccc2b", date: "2025-03-08" },
        { city: "Bakersfield, CA", coords: [35.3733, -119.0187], link: "https://www.mobilize.us/mobilize/event/761008/", date: "2025-03-23" },
        { city: "Los Angeles, CA", coords: [34.0522, -118.2437], link: "https://www.mobilize.us/mobilize/event/443382/", date: "Sundays" }
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
