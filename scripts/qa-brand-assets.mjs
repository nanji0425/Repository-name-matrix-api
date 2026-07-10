import { readFileSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const logoPath = 'nginx/site/matrixapi-logo.png';
const faviconPath = 'nginx/site/matrixapi-favicon.png';
const appleIconPath = 'nginx/site/apple-touch-icon.png';
const oldLogoPath = 'nginx/site/matrix-logo.png';
const sourceLogoPath = 'logo.png';

const logo = readFileSync(logoPath);
const favicon = readFileSync(faviconPath);
const oldLogo = readFileSync(oldLogoPath);
const sourceLogo = readFileSync(sourceLogoPath);

const logoHash = createHash('sha256').update(logo).digest('hex');
const oldLogoHash = createHash('sha256').update(oldLogo).digest('hex');
const sourceLogoHash = createHash('sha256').update(sourceLogo).digest('hex');
const faviconHash = createHash('sha256').update(favicon).digest('hex');
const failures = [];

if (logoHash === oldLogoHash) failures.push('New logo file is identical to the previous screenshot-based logo');
if (logoHash === sourceLogoHash) failures.push('Derived logo asset should not be a raw copy of the source logo');
if (!existsSync(faviconPath)) failures.push('Favicon PNG is missing');
if (!existsSync(appleIconPath)) failures.push('Apple touch icon PNG is missing');
if (statSync(logoPath).size <= 0 || statSync(faviconPath).size <= 0 || statSync(appleIconPath).size <= 0) {
  failures.push('Brand assets must not be empty');
}

const report = {
  logoPath,
  faviconPath,
  appleIconPath,
  logoBytes: statSync(logoPath).size,
  faviconBytes: statSync(faviconPath).size,
  appleIconBytes: statSync(appleIconPath).size,
  oldLogoBytes: statSync(oldLogoPath).size,
  sourceLogoBytes: statSync(sourceLogoPath).size,
  logoHash,
  oldLogoHash,
  sourceLogoHash,
  faviconHash,
};

if (failures.length) {
  console.error(JSON.stringify({ failures, report }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
