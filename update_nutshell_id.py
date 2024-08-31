import os
import re

# Path to the _questions directory
questions_dir = "_questions"

# Regular expression to find the "In a Nutshell" text and properly format it
nutshell_regex = re.compile(r'##\s*(.*?In a Nutshell)')

# Iterate over each file in the _questions directory
for filename in os.listdir(questions_dir):
    file_path = os.path.join(questions_dir, filename)
    
    # Read the content of the file
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    # Replace the "In a Nutshell" heading with the properly formatted span
    updated_content = nutshell_regex.sub(r'## <span id="nutshell">\1</span>', content)

    # Write the updated content back to the file
    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(updated_content)

print("Nutshell tags fixed successfully!")
