---
layout: reader
title: "{{ site.pages | where: 'url','/about/' | first.title }} – Reader View"
permalink: /about/reader/
---

{%- assign about = site.pages | where: "url", "/about/" | first -%}
{{ about.content }}
