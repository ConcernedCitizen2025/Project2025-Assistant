from playwright.sync_api import sync_playwright
import json

def scrape_mobilize_events():
    print("🚀 Launching browser...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        print("🌐 Navigating to Mobilize.us map page...")
        page.goto("https://www.mobilize.us/map/?show_all_events=true&tag_ids=26053", timeout=60000)

        print("\n🕵️ Please wait for the map and events to load fully in the browser.")
        print("✅ If there is a CAPTCHA or 'I'm human' box, complete it.")
        input("👉 Press ENTER **once you see events on the map and list**...")

        print("📦 Attempting to extract embedded JSON data from script tags...")

        scripts = page.query_selector_all("script")
        event_data = None

        for script in scripts:
            try:
                content = script.inner_text()
                if "window.__MLZ_INITIAL_STATE__" in content:
                    json_text = content.split("window.__MLZ_INITIAL_STATE__ = ")[1].strip()
                    if json_text.endswith(";"):
                        json_text = json_text[:-1]
                    event_data = json.loads(json_text)
                    break
            except Exception:
                continue  # Skip broken scripts

        browser.close()

        if event_data:
            with open("mobilize_events.json", "w", encoding="utf-8") as f:
                json.dump(event_data, f, indent=2)
            print("✅ Success! Data saved to mobilize_events.json")
        else:
            print("❌ Could not extract the event data. Please make sure the page fully loaded.")

scrape_mobilize_events()
