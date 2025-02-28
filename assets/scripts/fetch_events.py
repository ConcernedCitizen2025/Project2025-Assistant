from bs4 import BeautifulSoup
from geopy.geocoders import Nominatim
import json
import os
import time

# 🗂 File paths
ATOM_FEED_PATH = os.path.join(os.path.dirname(__file__), "../data/Political Revolution.atom")
EVENTS_JSON_PATH = os.path.join(os.path.dirname(__file__), "../data/events.json")

# 🌎 Initialize geolocator for address lookup
geolocator = Nominatim(user_agent="protest_event_locator")

def get_coordinates(location_name):
    """Convert location names into latitude & longitude coordinates."""
    try:
        location = geolocator.geocode(location_name)
        if location:
            return [location.latitude, location.longitude]
        else:
            print(f"⚠️ Warning: Could not find coordinates for {location_name}")
            return None
    except Exception as e:
        print(f"❌ Geolocation error for {location_name}: {e}")
        return None

def process_atom_feed():
    """Extract protest events from the Atom feed and save to JSON."""
    try:
        print("📡 Processing Atom feed...")

        with open(ATOM_FEED_PATH, "r", encoding="utf-8") as file:
            soup = BeautifulSoup(file.read(), "xml")

        events = []

        for entry in soup.find_all("entry"):
            title = entry.find("title").text if entry.find("title") else "No Title"
            link = entry.find("link")["href"] if entry.find("link") else "#"
            summary = entry.find("summary").text if entry.find("summary") else "No Description"
            date = entry.find("updated").text if entry.find("updated") else "Unknown Date"

            # Extract possible **location** from the title or summary
            location = "Unknown"
            possible_locations = title.split() + summary.split()
            for word in possible_locations:
                if "," in word:  # Looks for "City, State" format
                    location = word.strip()
                    break

            # 🌍 Get coordinates for the location
            coords = get_coordinates(location) if location != "Unknown" else None

            event_data = {
                "title": title,
                "date": date,
                "link": link,
                "summary": summary,
                "location": location,
                "coords": coords
            }

            events.append(event_data)
            time.sleep(1)  # 🔄 Prevents overloading the geolocation API

        # 📝 Save to JSON
        with open(EVENTS_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(events, f, indent=4)

        print(f"✅ Successfully updated {EVENTS_JSON_PATH} with {len(events)} events.")

    except Exception as err:
        print(f"❌ Error processing Atom feed: {err}")

if __name__ == "__main__":
    process_atom_feed()
