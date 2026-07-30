#!/usr/bin/env node
// ===========================================================================
// Pocket Architect — social image renderer
// Renders every template in social/ to a PNG at exact platform dimensions.
//
//   node social/render.mjs            # render all
//   node social/render.mjs og         # render only matching names (substring)
//
// Requires puppeteer. If it isn't a project dependency the script falls back
// to a global/home install:  npm i puppeteer   (bundled Chromium is downloaded)
// ===========================================================================
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

// Resolve puppeteer: project dep first, then a global/home install.
let puppeteer;
try {
  puppeteer = (await import('puppeteer')).default;
} catch {
  const { createRequire } = await import('node:module');
  const home = process.env.HOME || '/Users/wesley';
  const require = createRequire(path.join(home, 'package.json'));
  puppeteer = require('puppeteer');
}

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'out');
fs.mkdirSync(out, { recursive: true });

const PAGES = [
  { html: 'og.html',         png: 'og.png',          w: 1200, h: 630  },
  { html: 'card.html',       png: 'card.png',        w: 1200, h: 675  },
  { html: 'instagram.html',  png: 'instagram.png',   w: 1080, h: 1080 },
  { html: 'linkedin-1.html', png: 'linkedin-1.png',  w: 1080, h: 1080 },
  { html: 'linkedin-2.html', png: 'linkedin-2.png',  w: 1080, h: 1080 },
  { html: 'linkedin-3.html', png: 'linkedin-3.png',  w: 1080, h: 1080 },
];

const SCALE = 1;          // 1× = exact platform spec + small files. Set 2 for retina.
const filter = process.argv.slice(2);   // optional name substrings

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
try {
  for (const p of PAGES) {
    if (filter.length && !filter.some((f) => p.png.includes(f) || p.html.includes(f))) continue;
    const page = await browser.newPage();
    await page.setViewport({ width: p.w, height: p.h, deviceScaleFactor: SCALE });
    await page.goto('file://' + path.join(here, p.html), { waitUntil: 'networkidle0' });
    if (page.evaluate) await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.evaluate(() => document.fonts ? document.fonts.ready : null);
    const body = await page.$('body');
    await body.screenshot({ path: path.join(out, p.png) });
    await page.close();
    console.log(`✓ ${p.png}  (${p.w}×${p.h} @${SCALE}x)`);
  }
} finally {
  await browser.close();
}
