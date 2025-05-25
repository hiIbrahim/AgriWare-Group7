import os
import re

# Function to check if a file is text-based
def is_text_file(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            file.read(1024)  # Try reading the first 1KB
        return True
    except:
        return False

# Function to extract filenames from a file
def extract_filenames_from_file(file_path):
    filenames = []
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            for line in file:
                # Use regex to find full filenames with extensions
                matches = re.findall(r'[\w\-.]+\.(js|css|html|png|jpg|jpeg|avif|txt)', line, re.IGNORECASE)
                filenames.extend(matches)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
    return filenames

# Function to recursively find filenames in all files and directories
def find_filenames_recursively(directory):
    directory_structure = {}  # Dictionary to store files under their directories
    for root, _, files in os.walk(directory):
        relative_root = os.path.relpath(root, directory)  # Get relative path of the directory
        directory_structure[relative_root] = []  # Initialize the directory in the structure
        for file in files:
            file_path = os.path.join(root, file)
            # Add the current file to the directory structure
            directory_structure[relative_root].append(file)
            # Extract filenames from the current file if it's a text file
            if is_text_file(file_path):
                extracted_filenames = extract_filenames_from_file(file_path)
                directory_structure[relative_root].extend(extracted_filenames)
    return directory_structure

# Directory to search (current directory)
directory = os.getcwd()

# Find all filenames recursively
directory_structure = find_filenames_recursively(directory)

# Save the filenames to a new file in a structured format
output_file = "all_filenames.txt"
with open(output_file, "w", encoding="utf-8") as file:
    for folder, files in directory_structure.items():
        file.write(f"{folder}:\n")  # Write the folder name
        for filename in sorted(set(files)):  # Sort and remove duplicates
            file.write(f"  {filename}\n")
        file.write("\n")  # Add a blank line between folders

print(f"Extracted filenames have been saved to {output_file}")