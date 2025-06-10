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
<!-- Wrap the boycott table and video in a flex container -->
<div style="display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start;">

  <!-- Left side: Boycott Checklist -->
  <div style="flex: 1; min-width: 300px;">
    <h2>📢 Upcoming Boycotts</h2>
    {% assign today = site.time | date: '%Y-%m-%d' %}
    <table>
      <thead>
        <tr>
          <th>Company / Target</th>
          <th>Dates</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Amazon</strong></td>
          <td>March 7–14</td>
          <td>{% if today > '2025-03-14' %}✅{% endif %}</td>
        </tr>
        <!-- repeat rows as before... -->
        <tr>
          <td><strong>McDonald's</strong></td>
          <td>June 24–30</td>
          <td>{% if today > '2025-06-30' %}✅{% endif %}</td>
        </tr>
      </tbody>
    </table>
    <p><strong>Stay involved!</strong> Every boycott makes an impact.</p>
  </div>

  <!-- Right side: Protest Guidance Video -->
  <div style="flex: 1; min-width: 300px; text-align: center;">
    <video
      controls
      style="width: 100%; height: auto; border-radius: 8px;"
      preload="metadata"
    >
      <source
        src="/assets/videos/protest_guidance.mp4"
        type="video/mp4"
      >
      Your browser does not support the video tag.
    </video>
    <p style="font-size: 0.9em; color: #555; margin-top: 10px;">
      Video by
      <a
        href="https://www.instagram.com/reel/DKrqF95o-d6/?utm_source=ig_web_copy_link"
        target="_blank"
      >@lukeforthought</a>.
      Originally posted on Instagram.
    </p>
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
