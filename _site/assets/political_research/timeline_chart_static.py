import matplotlib.pyplot as plt
import numpy as np
from datetime import datetime

# Updated events list without source URLs in annotations.
events = [
    {"date": "2023-06", "description": "SpaceX violated FAA safety regulations", 
     "url": "https://www.faa.gov/newsroom/faa-proposes-633009-civil-penalties-against-spacex"},
    {"date": "2023-07", "description": "Second FAA safety violation by SpaceX", 
     "url": "https://www.faa.gov/newsroom/faa-proposes-633009-civil-penalties-against-spacex"},
    {"date": "2024-09", "description": "FAA proposed $633,000 fine against SpaceX", 
     "url": "https://www.faa.gov/newsroom/faa-proposes-633009-civil-penalties-against-spacex"},
    {"date": "2024-12-12", "description": "FAA Chief Mike Whitaker announced resignation", 
     "url": "https://time.com/7211655/elon-musk-former-faa-administrator-mike-whitaker-history/"},
    {"date": "2025-01-20", "description": "Trump sworn in; FAA Chief resigned", 
     "url": "https://time.com/7211655/elon-musk-former-faa-administrator-mike-whitaker-history/"},
    {"date": "2025-01-21", "description": "Trump fired TSA and Coast Guard heads, dissolved Advisory Committee", 
     "url": "https://www.propublica.org/article/elon-musk-spacex-doge-faa-ast-regulation-spaceflight-trump"},
    {"date": "2025-01-28", "description": "White House urged 2M federal employees to resign", 
     "url": "https://www.propublica.org/article/elon-musk-spacex-doge-faa-ast-regulation-spaceflight-trump"},
    {"date": "2025-01-29", "description": "Washington National Airport plane crash (67 dead)", 
     "url": "https://www.propublica.org/article/elon-musk-spacex-doge-faa-ast-regulation-spaceflight-trump"},
    {"date": "2025-01-30", "description": "Trump appointed new FAA administrator, blamed crash on DEI", 
     "url": "https://www.propublica.org/article/elon-musk-spacex-doge-faa-ast-regulation-spaceflight-trump"},
    {"date": "2025-01-31", "description": "Philadelphia jet crash (7 dead)", 
     "url": "https://www.propublica.org/article/elon-musk-spacex-doge-faa-ast-regulation-spaceflight-trump"},
    {"date": "2025-02-02", "description": "Administration reversed controller buyouts, lifted hiring freeze", 
     "url": "https://www.propublica.org/article/elon-musk-spacex-doge-faa-ast-regulation-spaceflight-trump"},
    {"date": "2025-02-05", "description": "Two planes collided on the runway in Seattle", 
     "url": "https://www.propublica.org/article/elon-musk-spacex-doge-faa-ast-regulation-spaceflight-trump"},
    {"date": "2025-02-06", "description": "Alaska plane crash (10 dead)", 
     "url": "https://www.propublica.org/article/elon-musk-spacex-doge-faa-ast-regulation-spaceflight-trump"},
    {"date": "2025-02-10", "description": "Arizona mid-air collision (1 dead)", 
     "url": "https://www.propublica.org/article/elon-musk-spacex-doge-faa-ast-regulation-spaceflight-trump"},
    {"date": "2025-02-12", "description": "Military jet crash in California", 
     "url": "https://www.propublica.org/article/elon-musk-spacex-doge-faa-ast-regulation-spaceflight-trump"},
    {"date": "2025-02-14", "description": "Hundreds of FAA employees laid off via email", 
     "url": "https://www.propublica.org/article/elon-musk-spacex-doge-faa-ast-regulation-spaceflight-trump"},
    {"date": "2025-02-15", "description": "Georgia plane crash (2 dead)", 
     "url": "https://www.propublica.org/article/elon-musk-spacex-doge-faa-ast-regulation-spaceflight-trump"},
    {"date": "2025-02-17", "description": "Minnesota-origin flight crash-landed upside down in Toronto", 
     "url": "https://www.propublica.org/article/elon-musk-spacex-doge-faa-ast-regulation-spaceflight-trump"},
    {"date": "2025-02-19", "description": "Another Arizona fatal plane crash occurred", 
     "url": "https://www.propublica.org/article/elon-musk-spacex-doge-faa-ast-regulation-spaceflight-trump"}
]

# Convert date strings to datetime objects. For year-month only, assume day '01'.
for event in events:
    try:
        event["datetime"] = datetime.strptime(event["date"], "%Y-%m-%d")
    except ValueError:
        event["datetime"] = datetime.strptime(event["date"] + "-01", "%Y-%m-%d")

# Sort events chronologically.
events.sort(key=lambda x: x["datetime"])

n_events = len(events)
# Evenly space events vertically.
y_positions = np.linspace(0, n_events - 1, n_events)

# Create vertical timeline figure.
fig, ax = plt.subplots(figsize=(12, 16))

# Draw vertical line in the middle.
ax.axvline(0.5, ymin=0.05, ymax=0.95, color="gray", linestyle="--", linewidth=2)

# Set axis limits and remove axes.
ax.set_xlim(0, 1)
ax.set_ylim(-1, n_events)
ax.axis("off")

# Place markers and annotations, alternating left/right.
offset = 0.05  # horizontal offset for text

for i, event in enumerate(events):
    x = 0.5
    y = y_positions[i]
    # Plot marker on vertical line.
    ax.plot(x, y, "o", color="red", markersize=10)
    
    # Prepare annotation text: date and description only.
    date_str = event["datetime"].strftime("%Y-%m-%d")
    annotation = f"{date_str}\n{event['description']}"
    
    # Alternate text placement.
    if i % 2 == 0:
        ax.text(x - offset, y, annotation, fontsize=9, horizontalalignment="right", verticalalignment="center")
    else:
        ax.text(x + offset, y, annotation, fontsize=9, horizontalalignment="left", verticalalignment="center")

# Add a suptitle so it doesn't get cut off.
fig.suptitle("Timeline of FAA-Related Events Under Trump-Musk Administration", fontsize=18, y=0.98)

plt.tight_layout(rect=[0, 0, 1, 0.96])
plt.savefig("FAA_Timeline_Vertical.png", dpi=300)
plt.show()