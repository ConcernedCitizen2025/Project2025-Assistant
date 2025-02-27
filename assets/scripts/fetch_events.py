import requests
from icalendar import Calendar
import json
import os

# 🔗 ICS Calendar URL (Replace with a working public ICS feed if needed)
ICS_FILE_PATH = os.path.join(os.path.dirname(__file__), "../data/events.ics")


# 🛠 Headers to mimic a browser request (helps bypass bot blocks)
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://events.pol-rev.com"
}

# 📂 Path to store events.json (Modify if needed)
EVENTS_JSON_PATH = os.path.join(os.path.dirname(__file__), "../data/events.json")


def fetch_events():
    """Fetch event data from the ICS link and save to JSON."""
    try:
        print("📡 Fetching new event data...")

        # 🌐 Attempt to download ICS file
        response = with open(ICS_FILE_PATH, "rb") as f:
        cal = Calendar.from_ical(f.read())
        response.raise_for_status()  # 🔍 Raises error for HTTP 403, 404, etc.

        # 📆 Parse ICS file
        cal = Calendar.from_ical(response.content)
        events = []

        for component in cal.walk():
            if component.name == "VEVENT":
                event = {
                    "summary": str(component.get("summary")),
                    "start": str(component.get("dtstart").dt),
                    "location": str(component.get("location")) if component.get("location") else "N/A",
                    "description": str(component.get("description")) if component.get("description") else "No description available"
                }
                events.append(event)

        if events:
            # 📝 Save to JSON file
            with open(EVENTS_JSON_PATH, "w", encoding="utf-8") as f:
                json.dump(events, f, indent=4)

            print(f"✅ Successfully updated {EVENTS_JSON_PATH} with {len(events)} events.")
        else:
            print("⚠️ No events found in the ICS file.")

    except requests.exceptions.HTTPError as http_err:
        print(f"❌ HTTP Error: {http_err}")
    except requests.exceptions.ConnectionError:
        print("❌ Network error: Unable to connect to the ICS server.")
    except requests.exceptions.Timeout:
        print("❌ Request timed out.")
    except requests.exceptions.RequestException as err:
        print(f"❌ Error fetching ICS: {err}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")


if __name__ == "__main__":
    fetch_events()
