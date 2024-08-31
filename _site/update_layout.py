import os

# Define the path to the _questions directory
questions_dir = '_questions'

# Loop through each file in the _questions directory
for filename in os.listdir(questions_dir):
    if filename.endswith('.md'):  # Process only markdown files
        file_path = os.path.join(questions_dir, filename)
        
        # Read the contents of the file with utf-8 encoding
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Replace 'layout: default' with 'layout: question'
        updated_content = content.replace('layout: default', 'layout: question')
        
        # Write the updated content back to the file with utf-8 encoding
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(updated_content)

print("All files in the _questions directory have been updated.")
