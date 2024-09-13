import os

# Path to your HTML directory
directory_path = r"C:\Users\SirMo\OneDrive\Documents\github\new_approach2website\website2.0\_layouts"

# The specific image source to search for
target_image_src = '/assets/images/logo.webp'

# Define the old lazy loading attribute to search for
lazy_loading_str = f'<img class="logo" src="{target_image_src}" alt="Project 2025 Assistant Logo" loading="lazy">'
# Define the new eager loading attribute
eager_loading_str = f'<img class="logo" src="{target_image_src}" alt="Project 2025 Assistant Logo" loading="eager">'

# Loop through all files in the directory
for filename in os.listdir(directory_path):
    # Process only HTML files
    if filename.endswith(".html"):
        file_path = os.path.join(directory_path, filename)

        # Read the contents of the file
        with open(file_path, "r", encoding="utf-8") as file:
            content = file.read()

        # Check if the lazy-loading string is in the file and replace it with eager-loading
        if lazy_loading_str in content:
            content = content.replace(lazy_loading_str, eager_loading_str)

            # Write the updated content back to the file
            with open(file_path, "w", encoding="utf-8") as file:
                file.write(content)

        print(f"Processed {filename}")

print("Completed the search and replace.")
