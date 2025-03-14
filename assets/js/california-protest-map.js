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
        { city: "Los Angeles, CA", coords: [34.0522, -118.2437], link: "https://www.mobilize.us/mobilize/event/443382/", date: "Sundays" },
        { city: "Washington, DC", coords: [38.9072, -77.0369], link: "https://nowmarch.org/", date: "2025-03-14" },
        {
            city: "Sacramento, CA",
            coords: [38.5766, -121.4930],
            link: "https://events.pol-rev.com/events/fcb0be2d-46df-4af1-b805-ca363ecebc91",
            date: "2025-03-14"
        },
        {
            city: "Poulsbo, WA",
            coords: [47.73278, -122.66444],
            link: "https://events.pol-rev.com/events/bf0b795e-3b67-4643-8f49-964fedce393c",
            date: "2025-03-14"
        },
        {
            city: "Everett, WA",
            coords: [47.978984, -122.202079],
            link: "https://events.pol-rev.com/events/04c8b421-7dcc-41c5-aaef-b5a420ffa464",
            date: "2025-03-14"
        },
        {
            city: "Olympia, WA",
            coords: [47.035805, -122.905014],
            link: "https://events.pol-rev.com/events/748be73c-dfe6-4e23-96d5-45ec4d223329",
            date: "2025-03-14"
        },
        {
            city: "Olympia, WA",
            coords: [47.035805, -122.905014],
            link: "https://events.pol-rev.com/events/7c758485-ef4a-4fc8-8729-534b067e59ff",
            date: "2025-03-14"
        },
        {
            city: "Boise, ID",
            coords: [43.617775, -116.199722],
            link: "https://events.pol-rev.com/events/f4db5c63-f14d-494d-93c2-c5a428f49c3a",
            date: "2025-03-15"
        },
        {
            city: "Rapid City, SD",
            coords: [44.080543, -103.231014],
            link: "https://events.pol-rev.com/events/8081bec3-7fd4-4ed6-a6af-64359f894622",
            date: "2025-03-14"
        },
        {
            city: "Sioux Falls, SD",
            coords: [43.549974, -96.700327],
            link: "https://events.pol-rev.com/events/14011ba5-c648-4b70-96dd-6583d0ff66ea",
            date: "2025-03-14"
        },
        {
            city: "Albuquerque, NM",
            coords: [35.0844, -106.6504],
            link: "https://events.pol-rev.com/events/20660a8d-0b9a-4591-8008-161f82ba6f78",
            date: "2025-03-14"
        },
        {
            city: "Montgomery, AL",
            coords: [32.377447, -86.300942],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Little Rock, AR",
            coords: [34.746613, -92.288986],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Sacramento, CA",
            coords: [38.576668, -121.493629],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Denver, CO",
            coords: [39.739227, -104.984856],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Hartford, CT",
            coords: [41.764136, -72.682778],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Dover, DE",
            coords: [39.157307, -75.519722],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Tallahassee, FL",
            coords: [30.438118, -84.281296],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Atlanta, GA",
            coords: [33.749272, -84.388261],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Honolulu, HI",
            coords: [21.307342, -157.857267],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Boise, ID",
            coords: [43.617698, -116.199614],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Springfield, IL",
            coords: [39.798517, -89.654889],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Indianapolis, IN",
            coords: [39.76861, -86.1625],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Des Moines, IA",
            coords: [41.591178, -93.603869],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Topeka, KS",
            coords: [39.048008, -95.678156],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Frankfort, KY",
            coords: [38.186778, -84.875333],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Baton Rouge, LA",
            coords: [30.4571, -91.1874],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Augusta, ME",
            coords: [44.307167, -69.781693],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Annapolis, MD",
            coords: [38.9784, -76.4922],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Boston, MA",
            coords: [42.3587, -71.0636],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Lansing, MI",
            coords: [42.7335, -84.5467],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Saint Paul, MN",
            coords: [44.9551, -93.1022],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Jackson, MS",
            coords: [32.3038, -90.1821],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Jefferson City, MO",
            coords: [38.5767, -92.1735],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Helena, MT",
            coords: [46.5891, -112.0391],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Lincoln, NE",
            coords: [40.8081, -96.6995],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Carson City, NV",
            coords: [39.1638, -119.7674],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Concord, NH",
            coords: [43.2069, -71.5381],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Trenton, NJ",
            coords: [40.2206, -74.7597],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Santa Fe, NM",
            coords: [35.6870, -105.9378],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Albany, NY",
            coords: [42.6526, -73.7562],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Raleigh, NC",
            coords: [35.7796, -78.6382],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Bismarck, ND",
            coords: [46.8083, -100.7837],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Columbus, OH",
            coords: [39.9612, -82.9988],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Oklahoma City, OK",
            coords: [35.4676, -97.5164],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Salem, OR",
            coords: [44.9429, -123.0351],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Harrisburg, PA",
            coords: [40.2732, -76.8867],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Providence, RI",
            coords: [41.8240, -71.4128],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Columbia, SC",
            coords: [34.0007, -81.0348],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Pierre, SD",
            coords: [44.3683, -100.3510],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Nashville, TN",
            coords: [36.1627, -86.7816],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Austin, TX",
            coords: [30.2672, -97.7431],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Salt Lake City, UT",
            coords: [40.7608, -111.8910],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Montpelier, VT",
            coords: [44.2601, -72.5754],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Richmond, VA",
            coords: [37.5407, -77.4360],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Olympia, WA",
            coords: [47.0379, -122.9007],
            link: "https://events.pol-rev.com/events/08d77aab-f104-474a-9e72-ddbb78895d8d",
            date: "2025-03-14"
        },
        {
            city: "Dallas, TX",
            coords: [32.7767, -96.7970],
            link: "https://events.pol-rev.com/events/4e447aae-ad3e-4275-b297-08387149dc9d",
            date: "2025-03-15"
        },
        {
            city: "Las Vegas, NV",
            coords: [36.1699, -115.1398],
            link: "https://events.pol-rev.com/events/785def1a-138d-4e02-9761-1d5e63096e2e",
            date: "2025-03-15"
        },
        {
            city: "St. George, UT",
            coords: [37.0965, -113.5684],
            link: "https://events.pol-rev.com/events/b9da2d72-ee0b-48d0-92e6-b84166f8ed14",
            date: "2025-03-15"
        },
        {
            city: "Springfield, MO",
            coords: [37.2086, -93.2923],
            link: "https://events.pol-rev.com/events/891779d5-10bb-4e49-8d56-ccd10e7fbd93",
            date: "2025-03-15"
        },
        {
            city: "Jefferson City, MO",
            coords: [38.5767, -92.1735],
            link: "https://events.pol-rev.com/events/16fe0448-deed-491c-a000-0b2393ccbb0b",
            date: "2025-03-15"
        },
        {
            city: "Madison, WI",
            coords: [43.0747, -89.3842],
            link: "https://events.pol-rev.com/events/5eda17e2-fe9e-4911-b00b-061e1d41d742",
            date: "2025-03-15"
        },
        {
            city: "Madison, WI",
            coords: [43.0747, -89.3842],
            link: "https://events.pol-rev.com/events/fb0e4a5c-598b-48e3-aa5c-fbad58815397",
            date: "2025-03-15"
        },
        {
            city: "Pittsburgh, PA",
            coords: [40.4406, -79.9959],
            link: "https://events.pol-rev.com/events/a303a940-5297-4c2c-a2fc-86e4c57e6256",
            date: "2025-03-15"
        },
        {
            city: "Chicopee, MA",
            coords: [42.1487, -72.6079],
            link: "https://events.pol-rev.com/events/c0104397-c836-496e-b59b-668142ba9835",
            date: "2025-03-15"
        },
        {
            city: "Worcester, MA",
            coords: [42.2626, -71.8023],
            link: "https://events.pol-rev.com/events/3d5cab05-aca1-41bc-9594-3da425ac0b62",
            date: "2025-03-14"
        },
        {
            city: "Boston, MA",
            coords: [42.3601, -71.0589],
            link: "https://events.pol-rev.com/events/33bfcfa4-a63f-4c84-b28f-dc5ab1868297",
            date: "2025-03-15"
        },
        {
            city: "Hartford, CT",
            coords: [41.7658, -72.6734],
            link: "https://events.pol-rev.com/events/cc207d63-7f89-4bca-a9d7-33d2fdfe4ea2",
            date: "2025-03-15"
        },
        {
            city: "New York, NY",
            coords: [40.7128, -74.0060],
            link: "https://events.pol-rev.com/events/80c1ddac-c90e-423f-bcf9-1fe1610a2133",
            date: "2025-03-15"
        },
        {
            city: "Philadelphia, PA",
            coords: [39.9526, -75.1652],
            link: "https://events.pol-rev.com/events/abf6610b-6cdc-4fa5-b477-3ad79c245b00",
            date: "2025-03-15"
        },
        {
            city: "Trenton, NJ",
            coords: [40.2206, -74.7597],
            link: "https://events.pol-rev.com/events/6ac3c721-41c5-4810-9b04-925603d5b38b",
            date: "2025-03-15"
        },
        {
            city: "Owings Mills, MD",
            coords: [39.4196, -76.7803],
            link: "https://events.pol-rev.com/events/adb839b6-6d1f-489b-b4f4-4a4a4f8fc456",
            date: "2025-03-15"
        },
        {
            city: "Washington, DC",
            coords: [38.8899, -77.0091],
            link: "https://events.pol-rev.com/events/7b6d2ddf-c882-4790-8a8f-d0b62741536d",
            date: "2025-03-14"
        },
        {
            city: "Farmville, VA",
            coords: [37.3021, -78.3919],
            link: "https://events.pol-rev.com/events/7a539afd-0ce5-4eca-854a-6396cdcfe2f3",
            date: "2025-03-15"
        },
        {
            city: "Atlanta, GA",
            coords: [33.7764, -84.3980],
            link: "https://events.pol-rev.com/events/c979bbc7-f177-4c90-8a6b-fbf7996ec62d",
            date: "2025-03-15"
        },
        {
            city: "Ormond Beach, FL",
            coords: [29.2858, -81.0559],
            link: "https://events.pol-rev.com/events/ea1aa8ad-655d-4bd2-9369-4b92d1ee7fbf",
            date: "2025-03-14"
        },
        {
            city: "Pinellas County, FL",
            coords: [27.8764, -82.7772],
            link: "https://events.pol-rev.com/events/eb9d8008-9b1e-43c1-8e4d-59d5ba4dbd74",
            date: "2025-03-15"
        },
        {
            city: "Sarasota, FL",
            coords: [27.3364, -82.5307],
            link: "https://events.pol-rev.com/events/93c55e53-3fe4-4d3d-bdbd-dd8dee4f30dc",
            date: "2025-03-15"
        },
        {
            city: "Stuart, FL",
            coords: [27.1975, -80.2528],
            link: "https://events.pol-rev.com/events/9cd348da-a0df-416d-9526-31053c5c899d",
            date: "2025-03-14"
        },
        {
            city: "Miami, FL",
            coords: [25.7617, -80.1918],
            link: "https://events.pol-rev.com/events/5da1a583-b046-4bab-95f3-9782dc7373f4",
            date: "2025-03-15"
        },
        {
            city: "Anchorage, AK",
            coords: [61.2181, -149.9003],
            link: "https://events.pol-rev.com/events/a9e90356-ef59-49a0-bfd8-fc7c6008e344",
            date: "2025-03-14"
        },
        {
            city: "Honolulu, HI",
            coords: [21.3070, -157.8584],
            link: "https://events.pol-rev.com/events/17289212-7d2c-4d42-a36a-548103945dc3",
            date: "2025-03-13"
        },
        {
            city: "Ridgecrest, CA",
            coords: [35.6225, -117.6709],
            link: "https://events.pol-rev.com/events/0eb685f5-d25d-4ea8-bf35-4bc009392ff6",
            date: "2025-03-16"
        },
        {
            city: "Long Beach, CA",
            coords: [33.7701, -118.1937],
            link: "https://events.pol-rev.com/events/ff280d82-1f18-49b3-9d49-bdba8cab096e",
            date: "2025-03-15"
        },
        {
            city: "Long Beach, CA",
            coords: [33.7701, -118.1937],
            link: "https://events.pol-rev.com/events/1991465a-a6f1-434a-a5b1-ca133f6bc931",
            date: "2025-03-15"
        },
        {
            city: "Irvine, CA",
            coords: [33.6846, -117.8265],
            link: "https://events.pol-rev.com/events/ca8950ac-3d83-4237-a67b-0123ea59389c",
            date: "2025-03-14"
        },
        {
            city: "Irvine, CA",
            coords: [33.6846, -117.8265],
            link: "https://events.pol-rev.com/events/e96254d3-d538-4b54-b70a-79771517b62b",
            date: "2025-03-16"
        },
        {
            city: "Irvine, CA",
            coords: [33.6846, -117.8265],
            link: "https://events.pol-rev.com/events/d78ed4d2-dba9-47c1-ac8d-e6d579d9b5ee",
            date: "2025-03-23"
        },
        {
            city: "Upland, CA",
            coords: [34.0975, -117.6484],
            link: "https://events.pol-rev.com/events/93773631-d5ee-4b1e-9733-88e8481f241e",
            date: "2025-03-15"
        },
        {
            city: "Naples, FL",
            coords: [26.1420, -81.7948],
            link: "https://events.pol-rev.com/events/51de34e1-e5c2-4b59-9bff-6317dd33d61b",
            date: "2025-03-22"
        },
        {
            city: "Ormond Beach, FL",
            coords: [29.2858, -81.0559],
            link: "https://events.pol-rev.com/events/d247230d-c056-4606-92ea-e1bc93565916",
            date: "2025-03-21"
        },
        {
            city: "Ormond Beach, FL",
            coords: [29.2858, -81.0559],
            link: "https://events.pol-rev.com/events/631d430b-2a25-4880-8375-d92061ac892e",
            date: "2025-03-28"
        },
        {
            city: "Birmingham, AL",
            coords: [33.5186, -86.8104],
            link: "https://events.pol-rev.com/events/0458f5fe-93a1-47dc-8f50-390d43671533",
            date: "2025-03-29"
        },
        {
            city: "St. Louis, MO",
            coords: [38.6273, -90.1979],
            link: "https://events.pol-rev.com/events/e2d1a46d-cadd-4bf5-8602-bf8d2e9f3366",
            date: "2025-03-18"
        },
        {
            city: "Green Bay, WI",
            coords: [44.5133, -88.0133],
            link: "https://events.pol-rev.com/events/a0783944-77f7-41be-afb8-f219c52421c6",
            date: "2025-03-15"
        },
        {
            city: "Milwaukee, WI",
            coords: [43.0389, -87.9065],
            link: "https://events.pol-rev.com/events/dea4022d-a0b5-406e-8234-b4a566699a49",
            date: "2025-03-15"
        },
        {
            city: "Poulsbo, WA",
            coords: [47.7328, -122.6453],
            link: "https://events.pol-rev.com/events/e34f45ad-8056-44e1-9b60-af796d8e5a90",
            date: "2025-03-16"
        },
        {
            city: "Seattle, WA",
            coords: [47.6614, -122.3170],
            link: "https://events.pol-rev.com/events/2a3331e3-d9f3-49f4-b1a8-833a994167b2",
            date: "2025-03-27"
        },
        {
            city: "Seattle, WA",
            coords: [47.6614, -122.3170],
            link: "https://events.pol-rev.com/events/c5fa7348-8f08-4c77-9ba4-0227ba7e6c6b",
            date: "2025-03-20"
        },
        {
            city: "Kirkland, WA",
            coords: [47.6785, -122.2087],
            link: "https://events.pol-rev.com/events/5627d79f-23c1-443e-a6bd-6fb76b497ea0",
            date: "2025-03-29"
        },
        {
            city: "Kirkland, WA",
            coords: [47.6785, -122.2087],
            link: "https://events.pol-rev.com/events/3d524c60-67fc-4efd-8993-78820779bc97",
            date: "2025-03-27"
        },
        {
            city: "Kirkland, WA",
            coords: [47.6785, -122.2087],
            link: "https://events.pol-rev.com/events/256a68d2-58fa-4942-8136-8329dacd4e87",
            date: "2025-03-20"
        },
        {
            city: "Bellevue, WA",
            coords: [47.6101, -122.2015],
            link: "https://events.pol-rev.com/events/c4004de9-e6d0-4fb0-a8b7-c4971138d47c",
            date: "2025-03-16"
        },
        {
            city: "Coeur d'Alene, ID",
            coords: [47.6777, -116.7805],
            link: "https://events.pol-rev.com/events/e69dc156-3567-4c17-9b5b-6a5cb86baac1",
            date: "2025-03-20"
        },
        {
            city: "Paradise, NV",
            coords: [36.0986, -115.1467],
            link: "https://events.pol-rev.com/events/7603bfa1-1b39-44e2-94db-2b98af6dd9eb",
            date: "2025-03-30"
        },
        {
            city: "Albuquerque, NM",
            coords: [35.0844, -106.6504],
            link: "https://events.pol-rev.com/events/c8ae6402-9749-4210-a7cc-e9772c701e90",
            date: "2025-03-20"
        },
        {
            city: "South Dakota",
            coords: [44.5000, -100.0000],
            link: "https://events.pol-rev.com/events/f8dda43b-516f-4c32-8bb1-7b7caf66013e",
            date: "2025-03-20"
        },
        {
            city: "New York, NY",
            coords: [40.7587, -73.9819],
            link: "https://events.pol-rev.com/events/9f74f2f6-a5b4-473f-9939-f26af6e84c7c",
            date: "2025-03-21"
        },
        {
            city: "Anchorage, AK",
            coords: [61.2181, -149.9003],
            link: "https://events.pol-rev.com/events/e97fc0ad-37ea-45d1-9079-55108f3dae33",
            date: "2025-03-28"
        },
        {
            city: "Anchorage, AK",
            coords: [61.2181, -149.9003],
            link: "https://events.pol-rev.com/events/047d3939-38e3-44e8-9e5d-16e498333983",
            date: "2025-03-21"
        },
        {
            city: "Las Vegas, NV",
            coords: [36.1699, -115.1398],
            link: "https://events.pol-rev.com/events/41a2933b-36b7-4685-a431-a956a0b21866",
            date: "2025-04-05"
        },
        {
            city: "Anacortes, WA",
            coords: [48.5126, -122.6127],
            link: "https://events.pol-rev.com/events/49d7f5d3-80e3-4f6e-9149-dd577601d3b5",
            date: "2025-04-05"
        },
        {
            city: "Seattle, WA",
            coords: [47.6173, -122.3197],
            link: "https://events.pol-rev.com/events/6b78f42b-4265-484d-a25e-6ff191e7addf",
            date: "2025-04-05"
        },
        {
            city: "Portland, OR",
            coords: [45.5231, -122.6765],
            link: "https://events.pol-rev.com/events/63eaf14d-51e3-4eb1-bb2d-15757a1e731d",
            date: "2025-04-05"
        },
        {
            city: "United States",
            coords: [37.0902, -95.7129],
            link: "https://events.pol-rev.com/events/680bcea3-3988-48f8-a5d2-808ccfd9906e",
            date: "2025-04-19"
        },
        {
            city: "Duluth, MN",
            coords: [46.7867, -92.1005],
            link: "https://events.pol-rev.com/events/f8bfc325-decd-49cf-aa10-dc5f3f58c735",
            date: "2025-04-05"
        },
        {
            city: "Memphis, TN",
            coords: [35.1495, -90.0490],
            link: "https://events.pol-rev.com/events/cfa48ba0-0136-42e9-9a24-872de614387b",
            date: "2025-04-04"
        },
        {
            city: "Pensacola, FL",
            coords: [30.4213, -87.2169],
            link: "https://events.pol-rev.com/events/69598bca-0b1d-4905-a1f2-a7dc1cabd6aa",
            date: "2025-04-05"
        },
        {
            city: "Tampa, FL",
            coords: [27.9506, -82.4572],
            link: "https://events.pol-rev.com/events/477c6505-9ddf-4490-8cc5-7b3385ce9dc6",
            date: "2025-04-05"
        },
        {
            city: "DeLand, FL",
            coords: [29.0283, -81.3031],
            link: "https://events.pol-rev.com/events/d807a71f-baea-4824-9563-9f4ad19cbcb4",
            date: "2025-04-05"
        },
        {
            city: "Jacksonville, FL",
            coords: [30.3322, -81.6557],
            link: "https://events.pol-rev.com/events/5b00e3e2-7eb1-44be-b292-ae9a7a014552",
            date: "2025-04-05"
        },
        {
            city: "Tucker, GA",
            coords: [33.8540, -84.2171],
            link: "https://events.pol-rev.com/events/f09b4889-1dd3-4210-99d4-479f36476c82",
            date: "2025-04-04"
        },
        {
            city: "Asheville, NC",
            coords: [35.5951, -82.5515],
            link: "https://events.pol-rev.com/events/d1236d7b-d5dc-4a25-97cc-7261d249c89c",
            date: "2025-04-04"
        },
        {
            city: "New Bern, NC",
            coords: [35.1085, -77.0441],
            link: "https://events.pol-rev.com/events/9145f129-c2bf-45c7-aa1d-b5b058d58533",
            date: "2025-04-19"
        },
        {
            city: "Beverly, MA",
            coords: [42.5584, -70.8800],
            link: "https://events.pol-rev.com/events/76ac6a0d-5631-4f1c-95a9-16936f622e2c",
            date: "2025-04-05"
        },
        {
            city: "Boston, MA",
            coords: [42.3601, -71.0589],
            link: "https://events.pol-rev.com/events/7aacd223-79ec-4adf-9b04-5ef165397629",
            date: "2025-04-05"
        },
        {
            city: "Barnstable, MA",
            coords: [41.7003, -70.2996],
            link: "https://events.pol-rev.com/events/6ccc3846-f862-48e1-ad5d-7dc7c8fea299",
            date: "2025-04-05"
        },
        {
            city: "Barnstable, MA",
            coords: [41.7003, -70.2996],
            link: "https://events.pol-rev.com/events/07068a92-1d52-4066-b92f-0710058b7f4a",
            date: "2025-04-19"
        },
        { city: "Washington, DC", coords: [38.9072, -77.0369], link: "https://nowmarch.org/", date: "2025-03-14" },
        { 
            city: "Bakersfield, CA", 
            coords: [35.3733, -119.0187], 
            link: "https://www.bakersfield.com/news/local-veteran-to-lead-protest-against-va-cuts/article_10c9353e-ff7b-11ef-bef0-bbeb6658fdca.html", 
            date: "2025-03-14", 
            forceInclude: true 
        } 
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
