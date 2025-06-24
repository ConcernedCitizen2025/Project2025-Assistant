from bs4 import BeautifulSoup
import json
import os

# Paths
HTML_FILE_PATH = os.path.join(os.path.dirname(__file__), "../data/events.html")
JSON_FILE_PATH = os.path.join(os.path.dirname(__file__), "../data/events.json")

def parse_events():
    """Extract event data from the saved HTML file."""
    try:
        # Read the saved HTML file
        with open(HTML_FILE_PATH, "r", encoding="utf-8") as f:
            html_content = f.read()

        # Parse the HTML
        soup = BeautifulSoup(html_content, "html.parser")

        # Find all event listings (adjust selector based on actual structure)
        events = []
        event_elements = soup.find_all("div", class_="event-card")  # Adjust this selector as needed

        for event in event_elements:
            title = event.find("h2").get_text(strip=True) if event.find("h2") else "No Title"
            date = event.find("time").get("datetime") if event.find("time") else "No Date"
            location = event.find("span", class_="event-location").get_text(strip=True) if event.find("span", class_="event-location") else "No Location"
            link = event.find("a", class_="event-link")["href"] if event.find("a", class_="event-link") else "#"

            events.append({
                "title": title,
                "date": date,
                "location": location,
                "link": f"https://events.pol-rev.com{link}"
            })

        # Save parsed events as JSON
        with open(JSON_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(events, f, indent=4)

        print(f"✅ Successfully extracted {len(events)} events and saved to {JSON_FILE_PATH}.")

    except Exception as e:
        print(f"❌ Error parsing events: {e}")

if __name__ == "__main__":
    parse_events()
