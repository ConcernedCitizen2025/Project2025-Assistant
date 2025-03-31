const puppeteer = require('puppeteer-core');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    headless: false, // Show the browser so you can complete Cloudflare
    executablePath: chromePath,
    userDataDir: './user-data', // Persist session so Cloudflare sees you as logged in next time
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('https://events.pol-rev.com/map', { waitUntil: 'networkidle2' });

  console.log('🛑 Please complete the Cloudflare verification if needed...');
  console.log('✅ Once the map has fully loaded, press any key in this terminal to continue.');

  // Wait for user confirmation before continuing
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', async () => {
    try {
      const events = await page.evaluate(() => {
        return window.__NUXT__?.data?.[0]?.searchEvents?.elements || [];
      });

      fs.writeFileSync('protests.json', JSON.stringify(events, null, 2));
      console.log('✅ Protest data saved to protests.json');

      await browser.close();
      process.exit();
    } catch (err) {
      console.error('❌ Error extracting data:', err);
      await browser.close();
      process.exit(1);
    }
  });
})();
