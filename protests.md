---
layout: stay_current
title: "Find a Protest or Boycott Near You - 50 50 01"
description: "Find and join a 50 50 01 protest or boycott across the U.S. Stay updated on upcoming events and make your voice heard."
keywords: "protest, boycott, 50 50 01, political activism, national protests, economic blackout"
---

<div style="text-align: center;">
  <img src="/assets/images/protests/50501_logo.png" alt="50 50 01 Protest Logo" style="max-width: 300px; height: auto; margin-bottom: 20px;">
  <h1>Find a 50 50 01 Protest or Boycott Near You</h1>
  <p>50 states, 50 capitals, 1 movement. Stand up and make your voice heard.</p>
</div>

---

## 📢 Upcoming Boycotts

{% assign today = site.time | date: '%Y-%m-%d' %}

| Company / Target               | Dates       | Status                                                   |
|--------------------------------|-------------|----------------------------------------------------------|
| **Amazon**                     | March 7–14   | {% if today > '2025-03-14' %}✅{% endif %}                  |
| **Nestlé**                     | March 21–28  | {% if today > '2025-03-28' %}✅{% endif %}                  |
| **Walmart**                    | April 7–14   | {% if today > '2025-04-14' %}✅{% endif %}                  |
| **24-hour Economic Blackout**  | April 18     | {% if today > '2025-04-18' %}✅{% endif %}                  |
| **General Mills**              | April 21–28  | {% if today > '2025-04-28' %}✅{% endif %}                  |
| **Amazon (Round 2)**           | May 6–12     | {% if today > '2025-05-12' %}✅{% endif %}                  |
| **Walmart (Round 2)**          | May 20–26    | {% if today > '2025-05-26' %}✅{% endif %}                  |
| **Target**                     | June 3–9     | {% if today > '2025-06-09' %}✅{% endif %}                  |
| **McDonald's**                 | June 24–30   | {% if today > '2025-06-30' %}✅{% endif %}                  |

**Stay involved! Every boycott makes an impact.**

---

## 📍 Interactive Protest Map

<p><strong>Last updated:</strong> {{ site.time | date: "%B %-d, %Y at %-I:%M %P %Z" }} (automatically refreshed daily)</p>
<p>Protests data are pulled each night from <a href="https://www.mobilize.us" target="_blank">Mobilize.us</a>. Thank you to Mobilize for powering grassroots action. For a fuller view of events—including outside California—visit:</p>
<ul>
  <li><a href="https://events.pol-rev.com/search?mode=MAP&eventPage=1&bbox=49.38237278700955,+-101.93115234375:39.07890809706475,+-87.95654296875&zoom=6&sortByEvents=START_TIME_ASC&isOnline=false&contentType=EVENTS" target="_blank">Full Protest Map</a></li>
  <li><a href="https://www.mobilize.us/map/?show_all_events=true&tag_ids=26053" target="_blank">Mobilize Event Directory</a></li>
</ul>

<div id="california-map" style="height: 600px;"></div>
<script src="/assets/js/california-protest-map.js"></script>
