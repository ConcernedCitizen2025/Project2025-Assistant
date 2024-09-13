import os
import re

# Define the path to the directory
directory_path = r'C:\Users\SirMo\OneDrive\Documents\github\new_approach2website\website2.0\_layouts'

# Regex pattern to match <img> tags that don't already have loading="lazy"
img_tag_pattern = re.compile(r'(<img\s+[^>]*)(?<!loading="lazy")(>)', re.IGNORECASE)

# Loop through all the files in the directory
for filename in os.listdir(directory_path):
    # Check if the file is an HTML file
    if filename.endswith(".html"):
        file_path = os.path.join(directory_path, filename)
        
        # Open the file and read its content
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()

        # Replace the img tag with loading="lazy"
        updated_content = img_tag_pattern.sub(r'\1 loading="lazy"\2', content)

        # If the content has changed, overwrite the file
        if updated_content != content:
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(updated_content)

        print(f"Processed: {filename}")
