// scripts/extract-keywords.js
const fs   = require("fs");
const path = require("path");

// load both feeds
const m = JSON.parse(fs.readFileSync("assets/data/mobilize_protests.json","utf8"));
const z = JSON.parse(fs.readFileSync("assets/data/mobilizon_events.json","utf8"));

// helper: pull text from titles
const texts = [
  ...(m.events   || []).map(e=>e.title||""),
  ...(z.data     || []).map(e=>e.title||"")
];

const stop = new Set(["the","and","for","with","you","that","this","from","are","will"]);
const freq = {};

texts.forEach(txt=>{
  (txt.toLowerCase().match(/\b[a-z]{3,}\b/g)||[])
    .forEach(w=>{
      if (!stop.has(w)) freq[w] = (freq[w]||0)+1;
    });
});

const lines = Object.entries(freq)
  .sort((a,b)=>b[1]-a[1])
  .map(([w,n])=>`${w} (${n})`)
  .join("\n");

fs.writeFileSync("keywords.txt", lines,"utf8");
console.log(`Wrote ${Object.keys(freq).length} keywords to keywords.txt`);
