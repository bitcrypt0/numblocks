import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

/**
 * Captures the UB supply/issuance copy on the public pages under
 * frontend/docs/screens/, in light and dark themes. Run once with the old
 * copy (PREFIX=before) and once with the new copy (PREFIX=after) against the
 * dev server on http://localhost:3000. No wallet required - the swap buy
 * preview renders from public mainnet reads.
 */
const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "docs", "screens");
mkdirSync(outDir, { recursive: true });

const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "http://localhost:3000";
const PREFIX = process.env.PREFIX ?? "after";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  defaultViewport: { width: 1440, height: 1000 },
  args: ["--no-first-run"],
});
const page = await browser.newPage();

async function go(path, ms = 5000) {
  for (let attempt = 1; ; attempt++) {
    try {
      await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 90_000 });
      break;
    } catch (e) {
      if (attempt >= 3) throw e;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  await new Promise((r) => setTimeout(r, ms));
}

async function setTheme(theme) {
  await page.evaluate((t) => {
    localStorage.setItem("nb-theme", t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, theme);
  await new Promise((r) => setTimeout(r, 400));
}

async function shot(name) {
  const file = join(outDir, `${PREFIX}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`captured ${PREFIX}-${name}.png`);
}

for (const theme of ["light", "dark"]) {
  await go("/", 1000);
  await setTheme(theme);

  await go("/", 4000);
  await shot(`home-${theme}`);

  await go("/about", 4000);
  await shot(`about-${theme}`);

  // Buy preview needs live pool reads from mainnet; give it time.
  await go("/swap", 12_000);
  await shot(`swap-buy-${theme}`);

  await go("/mint", 8000);
  await shot(`mint-${theme}`);

  await go("/wallet", 6000);
  await shot(`wallet-${theme}`);
}

await browser.close();
console.log(`screenshots in ${outDir}`);
