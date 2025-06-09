// scripts/generate_toc.js

import fs      from "fs";
import path    from "path";
import pdfjs   from "pdfjs-dist";

(async () => {
  const pdfPath = path.resolve("assets/docs/big_ugly_bill.pdf");
  const data    = new Uint8Array(fs.readFileSync(pdfPath));
  const doc     = await pdfjs.getDocument({ data }).promise;

  async function flatten(items, out = []) {
    for (const item of items) {
      if (item.dest) {
        const dest     = await doc.getDestination(item.dest);
        const pageNum  = dest[0] + 1;            // pdfjs is zero-based
        out.push({ title: item.title, page: pageNum });
      }
      if (item.items?.length) {
        await flatten(item.items, out);
      }
    }
    return out;
  }

  const outline = await doc.getOutline();
  const toc     = outline ? await flatten(outline) : [];
  const yaml    = toc.map(e =>
    `- title: "${e.title.replace(/"/g,'\\"')}"\n  page: ${e.page}`
  ).join("\n");

  fs.writeFileSync(
    path.resolve("_data/big_ugly_bill_toc.yml"),
    yaml,
    "utf8"
  );
  console.log(`✅ Generated ${toc.length} TOC entries in _data/big_ugly_bill_toc.yml`);
})();
