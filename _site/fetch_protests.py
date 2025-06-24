from playwright.sync_api import sync_playwright
import json
import os

# ✏️ Update this with your actual path
chrome_user_data_dir = r"C:\Users\SirMo\AppData\Local\Google\Chrome\User Data"
profile_directory = "Default"  # or "Profile 1", etc.

# ✅ Output file path
output_path = "assets/data/protest_events.json"

def fetch_event_data():
    with sync_playwright() as p:
        browser = p.chromium.launch_persistent_context(
            user_data_dir=chrome_user_data_dir,
            headless=False,
            args=[f"--profile-directory={profile_directory}"]
        )
        page = browser.new_page()

        print("🔄 Opening the protest events page...")
        page.goto("https://events.pol-rev.com/api/search", wait_until="networkidle")

        # 💡 Optional: If the site doesn't load JSON directly, grab from a request instead
        try:
            content = page.text_content("body")
            json_data = json.loads(content)
        except Exception as e:
            print("⚠️ Failed to parse content as JSON. Trying to extract from XHR response...")

            # Intercept the JSON API call
            response = page.wait_for_response(lambda r: "api/search" in r.url)
            json_data = response.json()

        # ✅ Write to file
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(json_data, f, indent=2)

        print(f"✅ Protest event data saved to: {output_path}")
        browser.close()

if __name__ == "__main__":
    fetch_event_data()
