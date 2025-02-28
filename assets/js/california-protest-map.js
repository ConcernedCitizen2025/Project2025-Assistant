document.addEventListener("DOMContentLoaded", function() {
    const mapContainer = document.getElementById("california-map");

    // Initialize the map, focused on California
    const map = L.map(mapContainer).setView([37.5, -119.5], 6);

    // Load map tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Define protest locations manually
    const protestLocations = [
        { city: "Bakersfield", coords: [35.3733, -119.0187], flyer: "/assets/images/protests/Bakersfield.png", date: "Mar 4" },
        { city: "Eureka", coords: [40.8021, -124.1637], link: "https://events.pol-rev.com/events/100dc7ad-a71c-4a17-b9c6-0487c8d1dc90", date: "Mar 4" },
        { city: "Irvine", coords: [33.6846, -117.8265], 
          links: [
              { url: "https://events.pol-rev.com/events/c345ef21-2292-409e-a8d3-bf681562b4d3", date: "Mar 2" },
              { url: "https://events.pol-rev.com/events/66fc16dd-d9cb-4bc4-ac0e-a19f308936e8", date: "Mar 4" },
              { url: "https://events.pol-rev.com/events/ee9dbdd0-2a02-4509-b705-419832be6155", date: "Mar 4" }
          ]
        },
        { city: "Mission Viejo", coords: [33.6000, -117.6710], link: "https://events.pol-rev.com/events/66fc16dd-d9cb-4bc4-ac0e-a19f308936e8", date: "Mar 4" },
        { city: "Modesto", coords: [37.6391, -120.9969], link: "https://events.pol-rev.com/events/34331d05-e9b6-41df-b6fe-67ad9743564f", date: "Mar 3" },
        { city: "Ridgecrest", coords: [35.6225, -117.6709], link: "https://events.pol-rev.com/events/26714321-203b-4443-ac89-9fe2882c79db", date: "Mar 2" },
        { city: "Riverside", coords: [33.9806, -117.3755], link: "https://events.pol-rev.com/events/9646ec43-976a-4a31-bcde-3cf932da92f2", date: "Mar 4" },
        { city: "Sacramento", coords: [38.5816, -121.4944], link: "https://events.pol-rev.com/events/e2bc9edb-a868-4c9b-992c-5fbcedb175e9", date: "Mar 4" },
        { city: "San Francisco", coords: [37.7749, -122.4194], link: "https://events.pol-rev.com/events/99d1bc6f-26f1-46c4-980c-922f51028e78", date: "Mar 4" },
        { city: "Santa Cruz", coords: [36.9741, -122.0308], link: "https://events.pol-rev.com/events/5c705629-7a79-4f56-8d88-c05ed1d2e2bc", date: "Mar 4" },
        { city: "Truckee", coords: [39.3279, -120.1833], link: "https://events.pol-rev.com/events/61669262-1c3b-4e3d-8033-2e34e71727e7", date: "Mar 1" }
    ];

    // Add markers to the map
    protestLocations.forEach(location => {
        let popupContent = `<strong>${location.city}</strong><br>Date: ${location.date}<br>`;

        if (location.flyer) {
            popupContent += `<a href="${location.flyer}" target="_blank">View Flyer</a>`;
        } else if (location.links) {
            location.links.forEach(link => {
                popupContent += `<a href="${link.url}" target="_blank">View Event (${link.date})</a><br>`;
            });
        } else if (location.link) {
            popupContent += `<a href="${location.link}" target="_blank">View Event</a>`;
        }

        L.marker(location.coords)
            .addTo(map)
            .bindPopup(popupContent);
    });

    // List the events below the map
    let eventListHtml = "<ul>";
    protestLocations.forEach(location => {
        if (location.flyer) {
            eventListHtml += `<li><a href="${location.flyer}" target="_blank">${location.city} - ${location.date}</a></li>`;
        } else if (location.links) {
            location.links.forEach(link => {
                eventListHtml += `<li><a href="${link.url}" target="_blank">${location.city} - ${link.date}</a></li>`;
            });
        } else if (location.link) {
            eventListHtml += `<li><a href="${location.link}" target="_blank">${location.city} - ${location.date}</a></li>`;
        }
    });
    eventListHtml += "</ul>";

    document.getElementById("event-list").innerHTML = eventListHtml;
});
