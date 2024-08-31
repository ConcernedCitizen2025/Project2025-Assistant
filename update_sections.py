import os
import re

# Path to the _sections directory
sections_dir = "_sections"

# Regular expressions to find the "Red Flags in the Reforms" and "In a Nutshell" text
redflags_regex = re.compile(r'##\s*(.*Red Flags in the Reforms.*)')
nutshell_regex = re.compile(r'##\s*(.*?In a Nutshell)')

# Iterate over each file in the _sections directory
for filename in os.listdir(sections_dir):
    file_path = os.path.join(sections_dir, filename)
    
    # Read the content of the file
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    # Replace the "Red Flags in the Reforms" heading with the properly formatted span
    updated_content = redflags_regex.sub(r'## <span id="redflags">\1</span>', content)
    
    # Replace the "In a Nutshell" heading with the properly formatted span
    updated_content = nutshell_regex.sub(r'## <span id="nutshell">\1</span>', updated_content)

    # Write the updated content back to the file
    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(updated_content)

print("Red Flags and Nutshell tags updated successfully!")
