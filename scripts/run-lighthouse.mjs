import { existsSync } from "node:fs";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

// CLI args
const url = process.argv[2];
const strategy = process.argv[3] || "mobile";

if (!url) {
  console.error("Usage: node run-lighthouse.mjs <url> [mobile|desktop]");
  process.exit(1);
}

// Browser detection
function findChromiumPath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;

  const candidatesByPlatform = {
    darwin: [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
      "/Applications/Arc.app/Contents/MacOS/Arc",
      "/Applications/Vivaldi.app/Contents/MacOS/Vivaldi",
      "/Applications/Opera.app/Contents/MacOS/Opera",
    ],
    win32: [
      `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env.PROGRAMFILES}\\Microsoft\\Edge\\Application\\msedge.exe`,
      `${process.env.PROGRAMFILES}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
    ],
    linux: [
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
      "/snap/bin/chromium",
      "/usr/bin/microsoft-edge",
      "/usr/bin/brave-browser",
    ],
  };

  const candidates =
    candidatesByPlatform[process.platform] ?? candidatesByPlatform.linux;

  for (const candidatePath of candidates) {
    if (existsSync(candidatePath)) return candidatePath;
  }

  return undefined;
}

// Chrome launch
const chromePath = findChromiumPath();

const windowSize =
  strategy === "desktop" ? "--window-size=1350,940" : "--window-size=412,823";

const chrome = await chromeLauncher.launch({
  ...(chromePath && { chromePath }),
  chromeFlags: [
    "--headless=new",
    windowSize,
    "--no-sandbox",
    "--disable-gpu-sandbox",
    "--disable-blink-features=AutomationControlled",
  ],
});

// Lighthouse configs
const onlyCategories = [
  "performance",
  "accessibility",
  "seo",
  "best-practices",
];

// Mobile preset
const mobileConfig = {
  extends: "lighthouse:default",
  settings: {
    formFactor: "mobile",
    throttlingMethod: "devtools",
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      requestLatencyMs: 562.5,
      downloadThroughputKbps: 1474.56,
      uploadThroughputKbps: 675,
      cpuSlowdownMultiplier: 4,
    },
    screenEmulation: {
      mobile: true,
      width: 412,
      height: 823,
      deviceScaleFactor: 1.75,
      disabled: false,
    },
    emulatedUserAgent:
      "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36",
    onlyCategories,
  },
};

// Desktop preset
const desktopConfig = {
  extends: "lighthouse:default",
  settings: {
    formFactor: "desktop",
    throttlingMethod: "devtools",
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
      cpuSlowdownMultiplier: 1,
    },
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
    emulatedUserAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
    onlyCategories,
  },
};

// Run audit
const config = strategy === "desktop" ? desktopConfig : mobileConfig;

try {
  const result = await lighthouse(
    url,
    { port: chrome.port, output: "json" },
    config,
  );

  if (!result || !result.lhr) {
    console.error("Lighthouse returned no results");
    process.exit(1);
  }

  const {
    categories,
    audits,
    fetchTime,
    finalDisplayedUrl,
    lighthouseVersion,
  } = result.lhr;

  process.stdout.write(
    JSON.stringify({
      categories,
      audits,
      fetchTime,
      finalDisplayedUrl,
      lighthouseVersion,
    }),
  );
} finally {
  await chrome.kill();
}
