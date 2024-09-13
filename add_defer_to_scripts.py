import os
import re

# Define the directory containing the HTML files
directory_path = r'C:\Users\SirMo\OneDrive\Documents\github\new_approach2website\website2.0\_layouts'

# Regex pattern to match <script> tags that don't already have defer or async
script_tag_pattern = re.compile(r'(<script\s+[^>]*)(?<!defer)(?<!async)(src="[^"]+")[^>]*>', re.IGNORECASE)

# Function to process and update HTML files
def add_defer_to_script_tags():
    # Loop through all the files in the directory
    for filename in os.listdir(directory_path):
        if filename.endswith(".html"):  # Only target HTML files
            file_path = os.path.join(directory_path, filename)
            
            # Open the file and read its content
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # Add 'defer' attribute to script tags that don't already have it
            updated_content = script_tag_pattern.sub(r'\1 defer \2>', content)
            
            # If the content has changed, overwrite the file
            if updated_content != content:
                with open(file_path, 'w', encoding='utf-8') as file:
                    file.write(updated_content)
                print(f"Processed: {filename} (defer added)")
            else:
                print(f"No changes made to: {filename}")

# Run the function
add_defer_to_script_tags()
