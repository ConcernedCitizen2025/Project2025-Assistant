import os
import re

# Directory where your HTML files are stored
directory = r"C:\Users\SirMo\OneDrive\Documents\github\new_approach2website\website2.0\_layouts"

# List of main logos for each page that need to be set to eager
main_logos = ["about_logo.webp", "faq_logo.webp", "illuminating_logo.webp", "mask.webp", 
              "nutshell_logo.webp", "redflags_logo.webp", "threat_logo.webp", "toc_logo.webp"]

# Regex patterns for matching and replacing image attributes
loading_lazy_pattern = re.compile(r'loading="lazy"')
logo_pattern = re.compile(r'<img\s[^>]*src="[^"]*logo\.webp"[^>]*>')
main_logo_pattern = re.compile(r'<img\s[^>]*src="[^"]*({})"[^>]*>'.format('|'.join(main_logos)))
arrow_logo_pattern = re.compile(r'<img\s[^>]*src="[^"]*arrow\.webp"[^>]*>')

def remove_lazy_and_apply_changes(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    # 1. Remove all loading="lazy"
    content = re.sub(loading_lazy_pattern, '', content)

    # 2. Add lazy to arrow logo
    content = re.sub(arrow_logo_pattern, r'<img \g<0> loading="lazy">', content)

    # 3. Add lazy to logo.webp on all pages (you'll manually fix home later)
    content = re.sub(logo_pattern, r'<img \g<0> loading="lazy">', content)

    # 4. Set eager to main logos (about_logo.webp, faq_logo.webp, etc.)
    content = re.sub(main_logo_pattern, r'<img \g<0> loading="eager">', content)

    # Save the modified content back to the file
    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(content)

def process_html_files(directory):
    for filename in os.listdir(directory):
        if filename.endswith('.html'):
            file_path = os.path.join(directory, filename)
            remove_lazy_and_apply_changes(file_path)

# Run the script
process_html_files(directory)
