import os
import re

# Path to the _sections directory
sections_dir = "_sections"

# Regular expressions for "In a Nutshell" and "Red Flags in the Reform(s)", case insensitive
nutshell_regex = re.compile(r'##\s*(.*?in a nutshell)', re.IGNORECASE)
redflags_regex = re.compile(r'##\s*(red flags in the reform[s]?:.*?)', re.IGNORECASE)

# Function to add span id if not already present
def add_span_id(match, span_id):
    # Check if the span id already exists in the match
    if f'<span id="{span_id}">' in match.group(1):
        return match.group(0)
    return f'## <span id="{span_id}">{match.group(1)}</span>'

# Iterate over each file in the _sections directory
for filename in os.listdir(sections_dir):
    file_path = os.path.join(sections_dir, filename)
    
    # Read the content of the file
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    # Replace the "In a Nutshell" and "Red Flags in the Reform(s)" headings with properly formatted spans
    updated_content = nutshell_regex.sub(lambda m: add_span_id(m, "nutshell"), content)
    updated_content = redflags_regex.sub(lambda m: add_span_id(m, "redflags"), updated_content)

    # Write the updated content back to the file
    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(updated_content)

print("Nutshell and Red Flags tags updated successfully!")
