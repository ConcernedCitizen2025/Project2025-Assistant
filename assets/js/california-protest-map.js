document.addEventListener("DOMContentLoaded", function () {
    const mapContainer = document.getElementById("california-map");

    // Default protest locations with flyers (for CA-only)
    const protestLocations = [
        { city: "Bakersfield", coords: [35.3733, -119.0187], flyer: "/assets/images/protests/Bakersfield.png" },
        { city: "Irvine", coords: [33.6846, -117.8265], flyer: "/assets/images/protests/Irvine.png" },
        { city: "Riverside", coords: [33.9806, -117.3755], flyer: "/assets/images/protests/Riverside.png" },
        { city: "Sacramento", coords: [38.5816, -121.4944], flyer: "/assets/images/protests/Sacramento.png" },
        { city: "San Francisco", coords: [37.7749, -122.4194], flyer: "/assets/images/protests/San_Francisco.png" },
        { city: "Santa Cruz", coords: [36.9741, -122.0308], flyer: "/assets/images/protests/Santa_Cruz.png" }
    ];

    // Initialize the map
    const map = L.map(mapContainer).setView([37.5, -119.5], 6); // Center on California

    // Load map tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Function to add markers
    function addMarker(location, popupContent) {
        L.marker(location.coords).addTo(map)
            .bindPopup(popupContent);
    }

    // Add hardcoded CA protest locations
    protestLocations.forEach(location => {
        addMarker(location, `<strong>${location.city}</strong><br><a href="${location.flyer}" target="_blank">View Flyer</a>`);
    });

    // Fetch events.json for additional locations
    fetch("/assets/data/events.json")
        .then(response => response.json())
        .then(events => {
            events.forEach(event => {
                if (event.location && event.link) {
                    // Attempt to geocode the location for mapping
                    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(event.location)}`)
                        .then(res => res.json())
                        .then(data => {
                            if (data.length > 0) {
                                const coords = [data[0].lat, data[0].lon];
                                addMarker({ coords: coords }, `<strong>${event.title}</strong><br><a href="${event.link}" target="_blank">View Event</a>`);
                            } else {
                                console.warn(`⚠️ Unable to geocode: ${event.location}`);
                            }
                        })
                        .catch(err => console.error(`❌ Geocoding error: ${err}`));
                }
            });
        })
        .catch(err => console.error(`❌ Error fetching events.json: ${err}`));
});
