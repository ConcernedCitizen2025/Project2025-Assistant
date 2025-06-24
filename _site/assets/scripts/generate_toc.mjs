import fs from 'fs';
import path from 'path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.js';

(async () => {
  const pdfPath = path.resolve('assets/docs/big_ugly_bill.pdf');
  const data    = new Uint8Array(fs.readFileSync(pdfPath));

  const loadingTask = getDocument({ data });
  const doc         = await loadingTask.promise;

  async function flatten(items, out = []) {
    for (const item of items) {
      if (item.dest) {
        const dest    = await doc.getDestination(item.dest);
        const pageNum = dest[0] + 1;
        out.push({ title: item.title, page: pageNum });
      }
      if (item.items && item.items.length) {
        await flatten(item.items, out);
      }
    }
    return out;
  }

  const outline = await doc.getOutline();
  const toc     = outline ? await flatten(outline) : [];

  const yaml = toc.map(e => {
    const safeTitle = e.title.replace(/"/g, '\\"');
    return `- title: "${safeTitle}"\n  page: ${e.page}`;
  }).join('\n') + '\n';

  const outPath = path.resolve('_data/big_ugly_bill_toc.yml');
  fs.writeFileSync(outPath, yaml, 'utf8');

  console.log(`✅ Wrote ${toc.length} TOC entries to ${outPath}`);
})();
