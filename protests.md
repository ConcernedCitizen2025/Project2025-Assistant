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
<div style="display: flex; flex-wrap: nowrap; align-items: flex-start; justify-content: space-between; margin: 20px 0; gap: 20px;">
  <!-- Left Column (Text Content) -->
  <div class="content-box" style="flex: 2; padding: 20px; background-color: #f9f9f9; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
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
  </div>
  <!-- Right Column (Videos and Additional Content) -->
  <div style="flex: 1; display: flex; flex-direction: column;">
    <div id="video-list" style="overflow-y: auto; gap: 20px; display: flex; flex-direction: column;">
    <!--Protest Guidance Video-->
    <div style="text-align: center;">
      <video controls style="width: 100%; height: 400px; border-radius: 8px;" preload="metadata">
        <source src="/assets/videos/protest_guidance.mp4" type="video/mp4">
        Your browser does not support the video tag.
      </video>
      <p style="font-size: 0.9em; color: #555; margin-top: 10px;">
        Video by <a href="https://www.instagram.com/reel/DKrqF95o-d6/?utm_source=ig_web_copy_link&igsh=MWUwbzBqYXc0aG16eA==" target="_blank">@lukeforthought</a>. Originally posted on Instagram.
      </p>
    </div>
  </div>
</div>

---

## 📍 Interactive Protest Map

<p><strong>Last updated:</strong> {{ site.time | date: "%B %-d, %Y at %-I:%M %P %Z" }} (automatically refreshed daily)</p>
<p>Protests data are pulled each night from <a href="https://www.mobilize.us" target="_blank">Mobilize.us</a>. Thank you to Mobilize for powering grassroots action. For a fuller view of event visit:</p>
<ul>
  <li><a href="https://events.pol-rev.com/search?mode=MAP&eventPage=1&bbox=49.38237278700955,+-101.93115234375:39.07890809706475,+-87.95654296875&zoom=6&sortByEvents=START_TIME_ASC&isOnline=false&contentType=EVENTS" target="_blank">Full Protest Map on events.pol-rev.com</a></li>
  <li><a href="https://www.mobilize.us/map/?show_all_events=true&tag_ids=26053" target="_blank">Mobilize.us Event Directory</a></li>
</ul>

<div id="california-map" style="height: 600px;"></div>
<script src="/assets/js/california-protest-map.js"></script>
