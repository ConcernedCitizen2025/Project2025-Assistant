import plotly.graph_objects as go
from datetime import datetime


# Define events with date, description, and a source URL.
# (Please update the URLs with your preferred credible sources.)
# events = [
#     {"date": "2023-06", "description": "SpaceX violated FAA safety regulations", "url": "https://www.reuters.com/technology/spacex-violated-faa-safety-regulations"},
#     {"date": "2023-07", "description": "Second FAA safety violation by SpaceX", "url": "https://www.reuters.com/technology/spacex-second-faa-violation"},
#     {"date": "2024-09", "description": "FAA fines SpaceX $633,000", "url": "https://www.reuters.com/article/faa-spacex-fine"},
#     {"date": "2024-12-12", "description": "FAA Chief Mike Whitaker resigns", "url": "https://www.washingtonpost.com/aviation/2024/12/faa-chief-whitaker-resigns/"},
#     {"date": "2025-01-20", "description": "Trump sworn in; FAA Chief resigns", "url": "https://www.cnn.com/2025/01/20/politics/trump-faa-chief-resignation"},
#     {"date": "2025-01-21", "description": "Trump fires TSA, Coast Guard heads", "url": "https://www.nytimes.com/2025/01/21/us/trump-fires-tsa-coast-guard"},
#     {"date": "2025-01-28", "description": "White House urges 2M federal employees to resign", "url": "https://www.reuters.com/article/white-house-federal-resign"},
#     {"date": "2025-01-29", "description": "Washington DC plane crash (67 dead)", "url": "https://www.cnn.com/2025/01/29/us/washington-dc-plane-crash"},
#     {"date": "2025-01-30", "description": "Trump appoints new FAA head", "url": "https://www.bloomberg.com/news/trump-new-faa-head"},
#     {"date": "2025-01-31", "description": "Philadelphia plane crash (7 dead)", "url": "https://www.nbcnews.com/philadelphia-plane-crash"},
#     {"date": "2025-02-06", "description": "Alaska plane crash (10 dead)", "url": "https://www.reuters.com/article/alaska-plane-crash"},
#     {"date": "2025-02-14", "description": "FAA staff laid off amid aviation crisis", "url": "https://www.nytimes.com/2025/02/14/us/faa-layoffs"},
#     {"date": "2025-02-17", "description": "Minnesota plane crash; flight overturns in Toronto", "url": "https://www.cbc.ca/news/minnesota-toronto-crash"},
#     {"date": "2025-02-19", "description": "Another Arizona fatal plane crash", "url": "https://www.reuters.com/article/arizona-plane-crash"}
# ]

# Define events with date, description, and a source URL.
events = [
    {"date": "2023-06", "description": "SpaceX violated FAA safety regulations", 
     "url": "https://www.faa.gov/newsroom/faa-proposes-633009-civil-penalties-against-spacex"},
    
    {"date": "2023-07", "description": "Second FAA safety violation by SpaceX", 
     "url": "https://www.faa.gov/newsroom/faa-proposes-633009-civil-penalties-against-spacex"},
    
    {"date": "2024-09", "description": "FAA proposed $633,000 fine against SpaceX", 
     "url": "https://www.faa.gov/newsroom/faa-proposes-633009-civil-penalties-against-spacex"},
    
    {"date": "2024-12-12", "description": "FAA Chief Mike Whitaker announced resignation", 
     "url": "https://time.com/7211655/elon-musk-former-faa-administrator-mike-whitaker-history/"},
    
    {"date": "2025-01-20", "description": "Trump sworn in; FAA Chief Mike Whitaker resigned", 
     "url": "https://time.com/7211655/elon-musk-former-faa-administrator-mike-whitaker-history/"},
    
    {"date": "2025-01-21", "description": "Trump fired TSA and Coast Guard heads, dissolved Aviation Security Advisory Committee", 
     "url": "https://www.propublica.org/article/elon-musk-spacex-doge-faa-ast-regulation-spaceflight-trump"},
    
    {"date": "2025-01-28", "description": "White House urged 2 million federal employees, including air traffic controllers, to resign", 
     "url": "https://www.propublica.org/article/elon-musk-spacex-doge-faa-ast-regulation-spaceflight-trump"},
    
    {"date": "2025-01-29", "description": "Washington National Airport plane crash killed 67 people", 
     "url": "https://www.propublica.org/article/elon-musk-spacex-doge-faa-ast-regulation-spaceflight-trump"},
    
    {"date": "2025-01-30", "description": "Trump appointed new FAA administrator and blamed the crash on DEI", 
     "url": "https://www.propublica.org/article/elon-musk-spacex-doge-faa-ast-regulation-spaceflight-trump"},
    
    {"date": "2025-01-31", "description": "Philadelphia jet crash killed 7 people", 
     "url": "https://www.propublica.org/article/elon-musk-spacex-doge-faa-ast-regulation-spaceflight-trump"},
    
    {"date": "2025-02-02", "description": "Administration reversed air traffic controller buyouts and lifted hiring freeze", 
     "url": "https://www.propublica.org/article/elon-musk-spacex-doge-faa-ast-regulation-spaceflight-trump"},
    
    {"date": "2025-02-05", "description": "Two planes collided on the runway in Seattle", 
     "url": "https://www.propublica.org/article/elon-musk-spacex-doge-faa-ast-regulation-spaceflight-trump"},
    
    {"date": "2025-02-06", "description": "Alaska plane crash killed 10 people", 
     "url": "https://www.propublica.org/article/elon-musk-spacex-doge-faa-ast-regulation-spaceflight-trump"},
    
    {"date": "2025-02-10", "description": "Arizona mid-air plane collision killed 1 person", 
     "url": "https://www.propublica.org/article/elon-musk-spacex-doge-faa-ast-regulation-spaceflight-trump"},
    
    {"date": "2025-02-12", "description": "Military jet crash in California", 
     "url": "https://www.propublica.org/article/elon-musk-spacex-doge-faa-ast-regulation-spaceflight-trump"},
    
    {"date": "2025-02-14", "description": "Hundreds of FAA employees were laid off via email", 
     "url": "https://www.propublica.org/article/elon-musk-spacex-doge-faa-ast-regulation-spaceflight-trump"},
    
    {"date": "2025-02-15", "description": "Georgia plane crash killed 2 people", 
     "url": "https://www.propublica.org/article/elon-musk-spacex-doge-faa-ast-regulation-spaceflight-trump"},
    
    {"date": "2025-02-17", "description": "Minnesota-origin flight crash-landed upside down in Toronto", 
     "url": "https://www.propublica.org/article/elon-musk-spacex-doge-faa-ast-regulation-spaceflight-trump"},
    
    {"date": "2025-02-19", "description": "Another Arizona fatal plane crash occurred", 
     "url": "https://www.propublica.org/article/elon-musk-spacex-doge-faa-ast-regulation-spaceflight-trump"}
]

# Convert each event's date to a datetime object.
# For dates that include only year-month, we assume day '01'.
for event in events:
    try:
        event["datetime"] = datetime.strptime(event["date"], "%Y-%m-%d")
    except ValueError:
        event["datetime"] = datetime.strptime(event["date"] + "-01", "%Y-%m-%d")

# Sort events by date.
events.sort(key=lambda x: x["datetime"])

# Create lists for plotting.
x_dates = [event["datetime"] for event in events]
# Use an incremental y-position for clarity.
y_positions = list(range(len(events)))

# Create text labels with HTML anchor tags so they are clickable.
text_labels = [
    f'<a href="{event["url"]}" target="_blank">{event["description"]}</a>'
    for event in events
]

# Create the interactive timeline figure.
fig = go.Figure()

fig.add_trace(go.Scatter(
    x=x_dates,
    y=y_positions,
    mode="markers+text",
    marker=dict(color="red", size=12),
    text=text_labels,
    textposition="top center",
    hovertemplate="<b>%{text}</b><br>Date: %{x|%Y-%m-%d}<extra></extra>"
))

fig.update_layout(
    title="Timeline of FAA-Related Events Under Trump-Musk Administration",
    xaxis_title="Date",
    yaxis=dict(visible=False),
    hovermode="closest",
    margin=dict(l=50, r=50, t=80, b=50)
)

# Save the interactive chart as an HTML file.
fig.write_html("FAA_Timeline_Interactive.html", include_plotlyjs='cdn')

# Show the figure.
fig.show()
