import asyncio
from playwright.sync_api import sync_playwright
import json

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Full browser, not headless
        context = browser.new_context()
        page = context.new_page()
        print("Opening browser... Please complete any Cloudflare checks if needed.")
        
        page.goto("https://events.pol-rev.com/")
        
        input("✅ Press ENTER once the site is fully loaded and any checks are passed...")

        # Now fetch the API data directly from the page
        print("Fetching protest data from the API...")
        response = page.request.post(
            "https://events.pol-rev.com/api/search",
            headers={"Content-Type": "application/json"},
            data=json.dumps({
                "searchType": "events",
                "filters": [],
                "limit": 200,
                "offset": 0,
                "sort": "newest"
            })
        )

        json_data = response.json()
        
        # Save it
        with open("assets/data/protest_events.json", "w", encoding="utf-8") as f:
            json.dump(json_data, f, indent=2)
        
        print("✅ Protest data saved to assets/data/protest_events.json")
        browser.close()

if __name__ == "__main__":
    run()
