import json
import time
import requests
import os

# File path
json_path = r"C:\Users\SirMo\OneDrive\Documents\github\new_approach2website\website2.0\assets\data\protest_events.json"
backup_path = json_path.replace(".json", "_backup.json")

# OpenStreetMap geocoding service
GEOCODE_API_URL = "https://nominatim.openstreetmap.org/search"

# Load existing JSON
with open(json_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# Create a backup just in case
with open(backup_path, "w", encoding="utf-8") as backup:
    json.dump(data, backup, indent=2)

print(f"📁 Backup created at: {backup_path}")

updated_events = []
for i, event in enumerate(data):
    if "latitude" in event and "longitude" in event:
        updated_events.append(event)
        continue

    location = event.get("location")
    if not location:
        print(f"⚠️ Skipping event with missing location: {event.get('title')}")
        updated_events.append(event)
        continue

    print(f"🔍 Geocoding ({i+1}/{len(data)}): {location}")
    try:
        response = requests.get(GEOCODE_API_URL, params={
            "q": location,
            "format": "json",
            "limit": 1
        }, headers={"User-Agent": "50501 protest geocoder"})

        response.raise_for_status()
        results = response.json()
        if results:
            coords = results[0]
            event["latitude"] = float(coords["lat"])
            event["longitude"] = float(coords["lon"])
            print(f"✅ Success: {event['latitude']}, {event['longitude']}")
        else:
            print(f"❌ No coordinates found for: {location}")
    except Exception as e:
        print(f"❌ Error geocoding '{location}': {e}")

    updated_events.append(event)
    time.sleep(1)  # Respect rate limits

# Write updated file
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(updated_events, f, indent=2)

print("🎉 Geocoding complete and JSON updated.")
