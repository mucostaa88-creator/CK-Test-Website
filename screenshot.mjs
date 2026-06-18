import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'temporary screenshots');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Auto-increment filename, never overwrite
function nextFilename(label) {
  const files = fs.readdirSync(outDir).filter(f => f.startsWith('screenshot-') && f.endsWith('.png'));
  const nums = files.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] ?? '0', 10)).filter(n => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return label ? `screenshot-${next}-${label}.png` : `screenshot-${next}.png`;
}

const [,, url = 'http://localhost:3000', label] = process.argv;

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

console.log(`Navigating to ${url} …`);
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

// Scroll through the page in chunks to trigger IntersectionObserver reveals
await page.evaluate(async () => {
  await new Promise(resolve => {
    let scrollY = 0;
    const step = 400;
    const delay = 120;
    const id = setInterval(() => {
      window.scrollBy(0, step);
      scrollY += step;
      if (scrollY >= document.body.scrollHeight) {
        clearInterval(id);
        resolve();
      }
    }, delay);
  });
});

// Force-reveal any elements the observer may have missed
await page.evaluate(() => {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
});

// Scroll back to top
await page.evaluate(() => window.scrollTo(0, 0));

// Let everything settle
await new Promise(r => setTimeout(r, 1200));

const filename = nextFilename(label);
const filepath = path.join(outDir, filename);

await page.screenshot({ path: filepath, fullPage: true });

console.log(`Saved → temporary screenshots/${filename}`);

await browser.close();
