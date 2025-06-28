// scripts/keyword_freq.js
const fs = require("fs");
const events = JSON.parse(fs.readFileSync("assets/data/merged_events.json", "utf8")).data;
const freq = {};
events.forEach(ev => {
  (ev.title + " " + (ev.location||"")).toLowerCase()
    .split(/\W+/)
    .filter(w=>w.length>3)
    .forEach(w=> freq[w] = (freq[w]||0)+1);
});
const out = Object.entries(freq)
  .sort((a,b)=>b[1]-a[1])
  .map(([k,v])=>`${k}: ${v}`)
  .join("\n");
fs.writeFileSync("keyword_freq.txt", out);
console.log("👉 keyword_freq.txt generated");
