document.addEventListener("DOMContentLoaded", function () {
    const mapContainer = document.getElementById("california-map");
    const dataUrl = "/assets/data/protest_events.json";

    if (!mapContainer) {
        console.error("Map container not found!");
        return;
    }

    if (!window.map) {
        window.map = L.map(mapContainer).setView([39.8283, -98.5795], 4);
    }

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const today = new Date().toISOString().split("T")[0];

    function getState(city) {
        const stateAbbreviations = {
            "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
            "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
            "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
            "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
            "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri",
            "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
            "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
            "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
            "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
            "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming",
            "DC": "District of Columbia"
        };

        if (!city.includes(", ")) return "";
        const stateCode = city.split(", ")[1]?.trim();
        return stateAbbreviations[stateCode] || "";
    }

    function sortProtests(protests) {
        return protests.sort((a, b) => {
            const stateA = getState(a.city);
            const stateB = getState(b.city);
            if (stateA !== stateB) return stateA.localeCompare(stateB);

            const cityA = a.city.split(", ")[0];
            const cityB = b.city.split(", ")[0];
            if (cityA !== cityB) return cityA.localeCompare(cityB);

            return a.date.localeCompare(b.date);
        });
    }

    fetch(dataUrl)
        .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch protest data");
            return res.json();
        })
        .then((protestLocations) => {
            let upcomingProtests = protestLocations.filter((location) => {
                return /^\d{4}-\d{2}-\d{2}$/.test(location.date) && location.date >= today;
            });

            upcomingProtests = sortProtests(upcomingProtests);

            let eventListHtml = "<ul>";

            upcomingProtests.forEach((location) => {
                if (!location.coords || location.coords.length !== 2) {
                    console.warn("Skipping event with invalid coordinates:", location);
                    return;
                }

                const popupContent = `
                    <strong>${location.city}</strong><br>
                    Date: ${location.date}<br>
                    <a href="${location.link}" target="_blank">View Event</a>
                `;

                L.marker(location.coords).addTo(map).bindPopup(popupContent);

                eventListHtml += `<li><a href="${location.link}" target="_blank">${location.city} - ${location.date}</a></li>`;
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
