document.addEventListener("DOMContentLoaded", function() {
    const mapContainer = document.getElementById("california-map");

    // Define cities and their flyer locations
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

    // Add markers for each protest location
    protestLocations.forEach(location => {
        L.marker(location.coords).addTo(map)
            .bindPopup(`<strong>${location.city}</strong><br><a href="${location.flyer}" target="_blank">View Flyer</a>`);
    });
});
