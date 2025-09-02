import os

def list_files(startpath, output_file="website_structure.txt"):
    """Generates a structured list of all files and folders in a given directory."""
    with open(output_file, "w", encoding="utf-8") as f:
        for root, dirs, files in os.walk(startpath):
            level = root.replace(startpath, "").count(os.sep)
            indent = " " * 4 * level
            f.write(f"{indent}{os.path.basename(root)}/\n")
            sub_indent = " " * 4 * (level + 1)
            for file in files:
                f.write(f"{sub_indent}{file}\n")
    
    print(f"Website structure saved to: {output_file}")

# Set the base directory to scan (modify this path)
base_path = r"C:\Users\SirMo\OneDrive\Documents\github\new_approach2website\website2.0"

# Run the function
list_files(base_path)
