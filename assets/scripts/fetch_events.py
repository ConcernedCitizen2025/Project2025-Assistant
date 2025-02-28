import requests
from bs4 import BeautifulSoup
import json
import os

# 🌐 Public Event Listing URL
EVENTS_URL = "https://events.pol-rev.com/events"

# 📂 Path to store events.json
EVENTS_JSON_PATH = os.path.join(os.path.dirname(__file__), "../data/events.json")

def scrape_events():
    """Scrape event details from the Political Revolution events page."""
    try:
        print("📡 Fetching live event data from Political Revolution...")

        # 🌍 Request event page
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        response = requests.get(EVENTS_URL, headers=headers)
        response.raise_for_status()  # 🔍 Raise error for failed requests

        # 🏗️ Parse HTML
        soup = BeautifulSoup(response.text, "html.parser")

        # 🔎 Find event listings (modify this selector if needed)
        event_elements = soup.find_all("div", class_="event-card")

        events = []
        for event in event_elements:
            title = event.find("h3").text.strip() if event.find("h3") else "Untitled Event"
            link = event.find("a", href=True)["href"] if event.find("a", href=True) else "#"
            date = event.find("time").text.strip() if event.find("time") else "Unknown Date"

            events.append({
                "title": title,
                "date": date,
                "link": f"https://events.pol-rev.com{link}" if link.startswith("/") else link
            })

        if events:
            # 📝 Save to JSON file
            with open(EVENTS_JSON_PATH, "w", encoding="utf-8") as f:
                json.dump(events, f, indent=4)

            print(f"✅ Successfully updated {EVENTS_JSON_PATH} with {len(events)} events.")
        else:
            print("⚠️ No events found on the page.")

    except requests.exceptions.HTTPError as http_err:
        print(f"❌ HTTP Error: {http_err}")
    except requests.exceptions.ConnectionError:
        print("❌ Network error: Unable to connect to the event server.")
    except requests.exceptions.Timeout:
        print("❌ Request timed out.")
    except requests.exceptions.RequestException as err:
        print(f"❌ Error fetching events: {err}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    scrape_events()
