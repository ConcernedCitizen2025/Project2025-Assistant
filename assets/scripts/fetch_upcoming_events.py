from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import json
from datetime import datetime

# Set up Chrome WebDriver
options = Options()
options.add_argument("--headless")  # Run without opening a browser
options.add_argument("--disable-gpu")
options.add_argument("--no-sandbox")
options.add_argument("--window-size=1920x1080")

# Initialize WebDriver
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=options)

event_pages = [
    "https://events.pol-rev.com/tag/50501%203%2F4?eventPage=1",
    "https://events.pol-rev.com/tag/50501%203%2F4?eventPage=2",
    "https://events.pol-rev.com/tag/50501%203%2F4?eventPage=3",
    "https://events.pol-rev.com/tag/50501%203%2F4?eventPage=4"
]

all_events = []

for page in event_pages:
    print(f"Fetching {page}...")
    driver.get(page)

    event_elements = driver.find_elements("css selector", ".event-item")  # Adjust selector if needed

    for event in event_elements:
        title = event.find_element("css selector", ".event-title").text.strip()
        date_str = event.find_element("css selector", ".event-date").text.strip()
        link = event.find_element("css selector", "a").get_attribute("href")
        summary = event.find_element("css selector", ".event-summary").text.strip()

        event_date = datetime.strptime(date_str, "%B %d, %Y %I:%M %p")

        if event_date >= datetime.now():
            all_events.append({
                "title": title,
                "date": event_date.isoformat(),
                "link": link,
                "summary": summary
            })

driver.quit()

# Save events to a JSON file
with open("upcoming_events.json", "w") as f:
    json.dump(all_events, f, indent=4)

print(f"✅ Saved {len(all_events)} upcoming events.")
