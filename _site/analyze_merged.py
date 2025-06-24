import json

# 1) Load your merged file
with open('assets/data/merged_events.json', 'r', encoding='utf-8') as f:
    data = json.load(f).get('data', [])

# 2) Find all events without coordinates
no_coord = [ev for ev in data if ev.get('lat') is None or ev.get('lng') is None]
print(f"Total markers: {len(data)}")
print(f"Markers without coordinates: {len(no_coord)}\n")

# 3) For each, list the titles from its links
print("Events missing coords (titles):")
for ev in no_coord:
    titles = [link.get('title','<untitled>') for link in ev.get('links',[])]
    print(" •", "; ".join(titles))

# (Optional) if you want to also print their raw location field:
#    and location = ev.get('location','<no location>')
