import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import * as constants from "lighthouse/core/config/constants.js";

const url = process.argv[2];
const strategy = process.argv[3] || "desktop"; // "desktop" | "mobile"

if (!url) {
  console.error("Usage: node run-lighthouse.mjs <url> [desktop|mobile]");
  process.exit(1);
}

const chromePath =
  process.env.CHROME_PATH ||
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";

const chrome = await chromeLauncher.launch({
  chromePath,
  chromeFlags: [
    "--headless=new",
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-brave-extension",
    "--disable-brave-shields",
    "--disable-features=BraveAdblockCosmeticFiltering,BraveAdblockDefault",
  ],
});

const isDesktop = strategy === "desktop";

const config = {
  extends: "lighthouse:default",
  settings: {
    formFactor: isDesktop ? "desktop" : "mobile",
    throttling: isDesktop
      ? constants.throttling.desktopDense4G
      : constants.throttling.mobileSlow4G,
    throttlingMethod: "simulate",
    screenEmulation: isDesktop
      ? constants.screenEmulationMetrics.desktop
      : constants.screenEmulationMetrics.mobile,
    emulatedUserAgent: isDesktop
      ? constants.userAgents.desktop
      : constants.userAgents.mobile,
    onlyCategories: ["performance", "accessibility", "seo", "best-practices"],
  },
};

try {
  const result = await lighthouse(url, {
    port: chrome.port,
    output: "json",
  }, config);

  if (!result || !result.lhr) {
    console.error("Lighthouse returned no results");
    process.exit(1);
  }

  const { categories, audits, fetchTime, finalDisplayedUrl, lighthouseVersion } = result.lhr;
  process.stdout.write(JSON.stringify({ categories, audits, fetchTime, finalDisplayedUrl, lighthouseVersion }));
} finally {
  await chrome.kill();
}
