// scripts/extract-keywords.js
const fs = require("fs");
const path = require("path");

// load both feeds
const m = JSON.parse(fs.readFileSync("assets/data/mobilize_protests.json"));
const z = JSON.parse(fs.readFileSync("assets/data/mobilizon_events.json"));

// helper: pull text from title + description if any
const texts = [
  ...(m.events||[]).map(e=>e.title),
  ...(z.data||[]).map(e=>e.title),
];

const stop = new Set(["the","and","for","with","you","that","this","from","are","will"]);
const freq = {};

texts.forEach(txt=>{
  txt.toLowerCase()
     .match(/\b[a-z]{3,}\b/g)
     .forEach(w=>{
       if (!stop.has(w)) freq[w] = (freq[w]||0) + 1;
     });
});

const keywords = Object.entries(freq)
  .sort((a,b) => b[1] - a[1])
  .map(([w,n]) => `${w} (${n})`)
  .join("\n");

fs.writeFileSync("keywords.txt", keywords);
console.log(`Wrote ${Object.keys(freq).length} keywords to keywords.txt`);
