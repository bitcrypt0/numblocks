import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

/**
 * Captures the mainnet-fork rehearsal journey as PNGs under
 * frontend/docs/rehearsal/. Prereqs: the fork node (port 8546, chainId 1,
 * already walked through the journey state), and the frontend dev server
 * on http://localhost:3000 with NEXT_PUBLIC_DEV_INJECTED=1.
 */
const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "docs", "rehearsal");
mkdirSync(outDir, { recursive: true });

const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "http://localhost:3000";
const OWNER = "0x5F85C9060576194cF3eFD27Edeb10e1e9a3274CF";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  defaultViewport: { width: 1440, height: 1000 },
  args: ["--no-first-run"],
});
const page = await browser.newPage();

async function go(path, ms = 6000) {
  for (let attempt = 1; ; attempt++) {
    try {
      await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      break;
    } catch (e) {
      if (attempt >= 3) throw e;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  await new Promise((r) => setTimeout(r, ms));
}

async function shot(name) {
  const file = join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`captured ${name}.png`);
}

// Pre-authorize the dev wallet so pages load connected as the journey user.
await go("/", 1000);
await page.evaluate(() => {
  localStorage.setItem("nb-dev-wallet-authorized", "1");
  localStorage.removeItem("nb-dev-wallet-account");
});

await go("/", 5000);
// Connect through the real picker if the persisted connection did not restore.
const connectBtn = await page.$$("header button");
const labels = await Promise.all(connectBtn.map((b) => b.evaluate((el) => el.textContent)));
if (labels.some((l) => l?.includes("Connect wallet"))) {
  const btn = connectBtn[labels.findIndex((l) => l?.includes("Connect wallet"))];
  await btn.click();
  await new Promise((r) => setTimeout(r, 800));
  const picker = await page.$$("[role=dialog] button");
  for (const b of picker) {
    const t = await b.evaluate((el) => el.textContent);
    if (t?.includes("Rehearsal Wallet")) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1500));
}
await shot("01-landing-connected");

await go("/mint");
await shot("02-mint-live-phase");

await go("/swap");
await shot("03-swap-buy-quote");

// Sell tab with the backing-cleanup pre-flight visible.
await page.evaluate(() => {
  const tab = [...document.querySelectorAll("button")].find(
    (b) => b.textContent.trim() === "Sell UB" && b.getAttribute("aria-pressed") !== null,
  );
  tab?.click();
});
await new Promise((r) => setTimeout(r, 1500));
await shot("04-swap-sell-preflight");

await go("/wallet");
await shot("05-wallet-after-cleanup");

await go("/block/5002", 9000);
await shot("06-block-5002-onchain-art");

await go("/explore", 9000);
await shot("07-explore-live-collection");

// Admin as the journey user: must show the "Owner only" gate.
await go("/admin");
await shot("08-admin-not-owner-gate");

// Admin as the impersonated owner: full dashboard.
await page.evaluate((owner) => {
  localStorage.setItem("nb-dev-wallet-account", owner);
  localStorage.setItem("nb-dev-wallet-authorized", "1");
  // wagmi caches the previous connection; clear it so the next load
  // reconnects with the overridden account.
  for (const k of Object.keys(localStorage)) {
    if (k.startsWith("wagmi")) localStorage.removeItem(k);
  }
}, OWNER);
await go("/admin", 4000);
const connect2 = await page.$$("button");
for (const b of connect2) {
  const t = await b.evaluate((el) => el.textContent);
  if (t?.includes("Connect wallet")) {
    await b.click();
    await new Promise((r) => setTimeout(r, 800));
    const picker = await page.$$("[role=dialog] button");
    for (const p of picker) {
      const pt = await p.evaluate((el) => el.textContent);
      if (pt?.includes("Rehearsal Wallet")) {
        await p.click();
        break;
      }
    }
    break;
  }
}
await new Promise((r) => setTimeout(r, 6000));
await shot("09-admin-owner-dashboard");

await page.evaluate(() => localStorage.removeItem("nb-dev-wallet-account"));
await browser.close();
console.log(`screenshots in ${outDir}`);
