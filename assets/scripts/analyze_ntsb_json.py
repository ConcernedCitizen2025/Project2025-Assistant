import json
import pandas as pd

# File Path
source_file = r"C:\Users\SirMo\OneDrive\Documents\github\new_approach2website\website2.0\assets\ntsb_gov_source_data\2007-01-01_through_2025-02-21_AviationData.json"

# Load JSON Data
def load_data(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return pd.json_normalize(data)

data = load_data(source_file)

# Print Column Names
print("### Available Fields in the Dataset ###")
print(data.columns.tolist())

# Display Sample Data (First 3 Rows)
print("\n### Sample Data Structure (First 3 Rows) ###")
print(data.head(3).to_string())

# Identify Key Fields
key_fields = ["EventDate", "State", "Country", "AircraftCategory", "HighestInjury"]
for field in key_fields:
    if field in data.columns:
        print(f"\n### Unique Values in '{field}' ###")
        print(data[field].dropna().unique()[:10])  # Show first 10 unique values

# Identify Date Ranges
if "EventDate" in data.columns:
    data["EventDate"] = pd.to_datetime(data["EventDate"], errors='coerce')
    print("\n### Date Range in Dataset ###")
    print(f"Start Date: {data['EventDate'].min()}, End Date: {data['EventDate'].max()}")

# Identify Missing Values
print("\n### Missing Values Per Column ###")
print(data.isnull().sum())

print("\nAnalysis Complete!")
