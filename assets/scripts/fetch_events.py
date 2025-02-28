import json
import os
import time
import re
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
from bs4 import BeautifulSoup

# Paths to your files
ATOM_FEED_PATH = os.path.join(os.path.dirname(__file__), "../data/Political Revolution.atom")
EVENTS_JSON_PATH = os.path.join(os.path.dirname(__file__), "../data/events.json")

# Initialize geocoder with a user-agent
geolocator = Nominatim(user_agent="project2025assistant")

# List of known U.S. states (to help with location detection)
US_STATES = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
    "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
    "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana",
    "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina",
    "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
    "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
    "Wisconsin", "Wyoming"
]

# List of major U.S. cities (for better extraction)
US_CITIES = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", 
             "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville", "Fort Worth", "Columbus", "San Francisco",
             "Indianapolis", "Seattle", "Denver", "Washington", "Boston", "El Paso", "Nashville", "Detroit",
             "Oklahoma City", "Portland", "Las Vegas", "Memphis", "Louisville", "Baltimore", "Milwaukee"]

def fetch_events():
    """Parses the ATOM feed, extracts locations, geocodes them, and saves to JSON."""
    print("📡 Parsing ATOM feed and fetching locations...")

    # Load the ATOM feed
    try:
        with open(ATOM_FEED_PATH, "r", encoding="utf-8") as file:
            xml_data = file.read()
    except Exception as e:
        print(f"❌ Error reading ATOM feed: {e}")
        return

    soup = BeautifulSoup(xml_data, "xml")
    events = []

    # Iterate through each event
    for entry in soup.find_all("entry"):
        title = entry.find("title").text if entry.find("title") else "No Title"
        summary = entry.find("summary").text if entry.find("summary") else "No Description"
        link = entry.find("link")["href"] if entry.find("link") else "No Link"
        date = entry.find("updated").text if entry.find("updated") else "Unknown Date"

        # Extract a location
        location = extract_location(summary, title)
        if not location:
            print(f"⚠️ No valid location found for: {title}")
            continue

        # Geocode the location
        lat, lon = geocode_location(location)
        if lat is None or lon is None:
            print(f"⚠️ Skipping {title} due to invalid geolocation.")
            continue

        # Store event data
        events.append({
            "title": title,
            "date": date,
            "link": link,
            "summary": summary,
            "location": location,
            "latitude": lat,
            "longitude": lon
        })

    # Save to JSON
    with open(EVENTS_JSON_PATH, "w", encoding="utf-8") as json_file:
        json.dump(events, json_file, indent=4)
    
    print(f"✅ Successfully updated {EVENTS_JSON_PATH} with {len(events)} events.")

def extract_location(summary, title):
    """Attempts to extract a city/state from event details."""
    text = summary + " " + title  # Combine both for better detection

    # Check for exact city matches
    for city in US_CITIES:
        if city in text:
            return city

    # Check for state mentions
    for state in US_STATES:
        if state in text:
            return state

    # Try to find "City, State" patterns
    location_match = re.search(r"([A-Za-z ]+),\s*(\b[A-Z]{2}\b)", text)  # Example: "Los Angeles, CA"
    if location_match:
        return f"{location_match.group(1)}, {location_match.group(2)}"

    return None  # No valid location found

def geocode_location(location):
    """Geocodes a location name, forcing results to the United States."""
    try:
        print(f"🌍 Geocoding: {location}...")
        time.sleep(1)  # Avoid rate limits
        result = geolocator.geocode(f"{location}, USA", exactly_one=True)
        
        if result:
            return result.latitude, result.longitude
        else:
            print(f"❌ Geocoding failed for: {location}")
            return None, None

    except (GeocoderTimedOut, GeocoderServiceError) as e:
        print(f"⚠️ Geocoding error: {e}")
        return None, None

if __name__ == "__main__":
    fetch_events()
