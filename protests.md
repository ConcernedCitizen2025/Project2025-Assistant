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
<div style="display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start; margin-bottom: 20px;">

  <!-- Left column: full boycott list, including past ones -->
  <div style="flex: 1; min-width: 300px;">
    <h2>📢 Upcoming & Past Boycotts</h2>
    {% assign today = site.time | date: '%Y-%m-%d' %}
    <table style="width:100%; border-collapse: collapse; margin-top: 10px;">
      <thead>
        <tr>
          <th style="text-align:left; padding: 8px;">Company / Target</th>
          <th style="text-align:left; padding: 8px;">Dates</th>
          <th style="text-align:left; padding: 8px;">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:8px;"><strong>Amazon</strong></td>
          <td style="padding:8px;">March 7–14</td>
          <td style="padding:8px;">{% if today > '2025-03-14' %}✅{% endif %}</td>
        </tr>
        <tr>
          <td style="padding:8px;"><strong>Nestlé</strong></td>
          <td style="padding:8px;">March 21–28</td>
          <td style="padding:8px;">{% if today > '2025-03-28' %}✅{% endif %}</td>
        </tr>
        <tr>
          <td style="padding:8px;"><strong>Walmart</strong></td>
          <td style="padding:8px;">April 7–14</td>
          <td style="padding:8px;">{% if today > '2025-04-14' %}✅{% endif %}</td>
        </tr>
        <tr>
          <td style="padding:8px;"><strong>24-hour Economic Blackout</strong></td>
          <td style="padding:8px;">April 18</td>
          <td style="padding:8px;">{% if today > '2025-04-18' %}✅{% endif %}</td>
        </tr>
        <tr>
          <td style="padding:8px;"><strong>General Mills</strong></td>
          <td style="padding:8px;">April 21–28</td>
          <td style="padding:8px;">{% if today > '2025-04-28' %}✅{% endif %}</td>
        </tr>
        <tr>
          <td style="padding:8px;"><strong>Amazon (Round 2)</strong></td>
          <td style="padding:8px;">May 6–12</td>
          <td style="padding:8px;">{% if today > '2025-05-12' %}✅{% endif %}</td>
        </tr>
        <tr>
          <td style="padding:8px;"><strong>Walmart (Round 2)</strong></td>
          <td style="padding:8px;">May 20–26</td>
          <td style="padding:8px;">{% if today > '2025-05-26' %}✅{% endif %}</td>
        </tr>
        <tr>
          <td style="padding:8px;"><strong>Target</strong></td>
          <td style="padding:8px;">June 3–9</td>
          <td style="padding:8px;">{% if today > '2025-06-09' %}✅{% endif %}</td>
        </tr>
        <tr>
          <td style="padding:8px;"><strong>McDonald’s</strong></td>
          <td style="padding:8px;">June 24–30</td>
          <td style="padding:8px;">{% if today > '2025-06-30' %}✅{% endif %}</td>
        </tr>
      </tbody>
    </table>
    <p style="margin-top: 10px;"><strong>Stay involved!</strong> Every boycott makes an impact.</p>
  </div>

  <!-- Right column: smaller video -->
  <div style="flex: 1; min-width: 250px; text-align: center;">
    <video
      controls
      style="width: 100%; max-width: 250px; height: auto; border-radius: 8px;"
      preload="metadata"
    >
      <source src="/assets/videos/protest_guidance.mp4" type="video/mp4">
      Your browser does not support the video tag.
    </video>
    <p style="font-size: 0.9em; color: #555; margin-top: 10px;">
      Video by <a href="https://www.instagram.com/reel/DKrqF95o-d6/" target="_blank">@lukeforthought</a>. Originally posted on Instagram.
    </p>
  </div>

</div>


---

## 📍 Interactive Protest Map

<p><strong>Last updated:</strong> {{ site.time | date: "%B %-d, %Y at %-I:%M %P %Z" }} (automatically refreshed daily)</p>
<p>Protests data are pulled each night from <a href="https://www.mobilize.us" target="_blank">Mobilize.us</a> and <a href="https://www.mobilizon.org" target="_blank">Mobilizon.org</a>. Thank you to Mobilize and Mobilizon for powering grassroots action. For a fuller view of event visit:</p>
<ul>
  <li><a href="https://events.pol-rev.com/search?mode=MAP&eventPage=1&bbox=49.38237278700955,+-101.93115234375:39.07890809706475,+-87.95654296875&zoom=6&sortByEvents=START_TIME_ASC&isOnline=false&contentType=EVENTS" target="_blank">Full Protest Map on events.pol-rev.com (powered by Mobilizon)</a></li>
  <li><a href="https://www.mobilize.us/map/?show_all_events=true&tag_ids=26053" target="_blank">Mobilize.us Event Directory</a></li>
</ul>

<div id="california-map" style="height: 600px;"></div>
<script src="/assets/js/california-protest-map.js"></script>
