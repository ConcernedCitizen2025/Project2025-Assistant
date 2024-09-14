import os
import re

# Directory where your HTML files are stored
directory = r"C:\Users\SirMo\OneDrive\Documents\github\new_approach2website\website2.0\_layouts"

# Regex pattern to find lines with multiple <img> tags
multiple_img_pattern = re.compile(r'(<img\s[^>]*>)(.*?<img\s[^>]*>)+')

def fix_multiple_img_tags(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.readlines()

    # Process each line to find and fix multiple <img> tags
    new_content = []
    for line in content:
        # If multiple <img> tags are found in one line
        if re.search(multiple_img_pattern, line):
            # Only keep the first <img> tag
            fixed_line = re.sub(multiple_img_pattern, r'\1', line)
            new_content.append(fixed_line)
        else:
            new_content.append(line)

    # Write the fixed content back to the file
    with open(file_path, 'w', encoding='utf-8') as file:
        file.writelines(new_content)

def process_html_files(directory):
    for filename in os.listdir(directory):
        if filename.endswith('.html'):
            file_path = os.path.join(directory, filename)
            fix_multiple_img_tags(file_path)

# Run the script
process_html_files(directory)
