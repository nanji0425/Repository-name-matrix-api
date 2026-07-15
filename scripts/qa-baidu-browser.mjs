import { chromium } from 'playwright';

const executablePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ headless: true, executablePath });
const page = await browser.newPage();
const response = await page.goto('https://matrixapi.online/', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(5000);
const result = await page.evaluate(() => {
  const tags = [...document.head.querySelectorAll('meta[name="baidu-site-verification"]')].map((node) => ({
    name: node.getAttribute('name'),
    content: node.getAttribute('content'),
    outerHTML: node.outerHTML,
  }));
  return {
    readyState: document.readyState,
    title: document.title,
    bodyText: document.body.innerText.replace(/\s+/g, ' ').trim(),
    bodyLength: document.body.innerText.replace(/\s+/g, ' ').trim().length,
    tagCount: tags.length,
    tags,
    headContains: document.head.innerHTML.includes('codeva-zfLalJhUJY'),
  };
});

await browser.close();
const output = { status: response?.status() || 0, ...result };
if (output.status !== 200 || output.tagCount !== 1 || output.tags[0]?.content !== 'codeva-zfLalJhUJY') {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(output, null, 2));
