from bs4 import BeautifulSoup
import json
import os

# 🔍 Paths
ATOM_FILE_PATH = os.path.join(os.path.dirname(__file__), "../data/Political Revolution.atom")
JSON_FILE_PATH = os.path.join(os.path.dirname(__file__), "../data/events.json")

def parse_atom_feed():
    """Extract event data from the Atom feed and save it as a JSON file."""
    try:
        print("📡 Reading Atom feed...")

        # Open and read the Atom file
        with open(ATOM_FILE_PATH, "r", encoding="utf-8") as f:
            atom_content = f.read()

        # Parse the Atom XML
        soup = BeautifulSoup(atom_content, "xml")
        entries = soup.find_all("entry")

        events = []
        for entry in entries:
            title = entry.find("title").get_text(strip=True) if entry.find("title") else "No Title"
            date = entry.find("updated").get_text(strip=True) if entry.find("updated") else "No Date"
            link = entry.find("link")["href"] if entry.find("link") else "#"
            summary = entry.find("summary").get_text(strip=True) if entry.find("summary") else "No Description"

            events.append({
                "title": title,
                "date": date,
                "link": link,
                "summary": summary
            })

        if events:
            # Save to JSON file
            with open(JSON_FILE_PATH, "w", encoding="utf-8") as f:
                json.dump(events, f, indent=4)

            print(f"✅ Successfully extracted {len(events)} events from Atom feed.")
        else:
            print("⚠️ No events found in the Atom feed.")

    except Exception as e:
        print(f"❌ Error parsing Atom feed: {e}")

if __name__ == "__main__":
    parse_atom_feed()
