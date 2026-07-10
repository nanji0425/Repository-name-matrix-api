import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 512, height: 512 },
  deviceScaleFactor: 1,
});

await page.goto(`file://${process.cwd().replaceAll('\\', '/')}/nginx/site/matrixapi-logo.svg`);
await page.screenshot({
  path: 'nginx/site/matrixapi-logo.png',
  omitBackground: true,
});

await browser.close();
