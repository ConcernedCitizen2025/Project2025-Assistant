import os

# Define the directory where your HTML files are located
directory = r"C:\Users\SirMo\OneDrive\Documents\github\new_approach2website\website2.0\_layouts"

# Function to process the HTML content
def process_html_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as file:
        content = file.readlines()

    modified = False
    new_content = []
    
    # Go through each line and modify script tags
    for line in content:
        # Check if the line contains a <script> tag that needs defer or async
        if '<script' in line and 'src=' in line:
            # If it is Google Analytics or other third-party JS, add async attribute
            if 'googletagmanager.com' in line or 'google-analytics.com' in line:
                if 'async' not in line:
                    line = line.replace('<script', '<script async', 1)
                    modified = True
            # For internal scripts, add defer attribute if it doesn't already have it
            elif 'defer' not in line and 'async' not in line:
                line = line.replace('<script', '<script defer', 1)
                modified = True
        
        new_content.append(line)

    # If there was a modification, overwrite the file with the new content
    if modified:
        with open(filepath, 'w', encoding='utf-8') as file:
            file.writelines(new_content)
        print(f"Updated {filepath}")
    else:
        print(f"No changes made to {filepath}")

# Walk through the directory and apply the process to all .html files
for filename in os.listdir(directory):
    if filename.endswith(".html"):
        filepath = os.path.join(directory, filename)
        process_html_file(filepath)
