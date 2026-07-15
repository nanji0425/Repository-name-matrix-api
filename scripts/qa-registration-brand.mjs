#!/usr/bin/env node

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const read = (path) => readFileSync(resolve(root, path), 'utf8')
const bootstrap = read('scripts/bootstrap-new-api.mjs')
const brandInit = read('nginx/site/brand-init.js')
const logoSvg = read('nginx/site/matrixapi-logo.svg')
const versionedLogo = '/matrix-assets/matrixapi-logo.png?v=2026071419'
const versionedFavicon = '/matrix-assets/matrixapi-favicon.png?v=2026071421'
const versionedBrandInit = '/matrix-assets/brand-init.js?v=2026071421'
const newApiDefaultIndex = read('output/new-api-src/web/default/index.html')
const newApiClassicIndex = read('output/new-api-src/web/classic/index.html')
const newApiDefaultDistIndex = read('output/new-api-src/web/default/dist/index.html')
const newApiClassicDistIndex = read('output/new-api-src/web/classic/dist/index.html')

assert.ok(bootstrap.includes("JSON.stringify({ confirmed: true })"), 'bootstrap must confirm payment compliance with an explicit JSON body')
assert.ok(bootstrap.includes("'GroupRatio', groupRatio") && bootstrap.includes("JSON.stringify({ default: 1 })"), 'default model group ratio must be 1.0')
assert.ok(bootstrap.includes("'SidebarModulesAdmin'") && /chat:\s*false/.test(bootstrap), 'bootstrap must persist the hidden secondary chat module')
assert.ok(brandInit.includes('Matrix API'), 'brand injection must use Matrix API')

assert.match(
  bootstrap,
  /upstreamBaseUrlInput\s*=\s*process\.env\.UPSTREAM_BASE_URL\s*\|\|\s*'https:\/\/www\.kukuai\.fyi\/api-proxy\/china'/,
  'bootstrap must use the confirmed Kukuai upstream base URL',
)
assert.ok(bootstrap.includes(`'Logo', '${versionedLogo}'`), 'system Logo option must cache-bust the transparent asset')
assert.ok(bootstrap.includes(`'general_setting.logo', '${versionedLogo}'`), 'general logo option must cache-bust the transparent asset')
assert.ok(brandInit.includes(`logo: '${versionedLogo}'`), 'brand injection must cache-bust the transparent asset')
assert.match(
  bootstrap,
  /updateOption\(cookie,\s*'EmailVerificationEnabled',\s*'false'\)/,
  'bootstrap must explicitly disable email verification',
)
assert.doesNotMatch(
  logoSvg,
  /<rect[^>]+(?:fill=['"]#061423['"]|width=['"]512['"][^>]+height=['"]512['"])/i,
  'logo SVG must not contain an opaque full-canvas background',
)

for (const path of [
  'nginx/conf.d/ssl.conf',
  'nginx/ssl.conf.template',
]) {
  const source = read(path)
  const block = source.match(/location\s*=\s*\/sign-up\s*\{([\s\S]*?)\n\s*\}/)?.[1] || ''
  assert.match(block, /proxy_pass\s+http:\/\/new_api\s*;/, `${path} must proxy /sign-up to New API`)
  assert.doesNotMatch(block, /sign-up\.html|matrix-site/, `${path} must not serve the legacy registration page`)
  assert.doesNotMatch(source, /location\s*=\s*\/wallet\/?\s*\{[\s\S]*?try_files\s+\/wallet\.html/, `${path} must not intercept native wallet with the retired login page`)
}

for (const path of [
  'nginx/site/index.html',
  'nginx/site/pricing.html',
  'nginx/site/rankings.html',
  'nginx/site/legal.html',
  'nginx/site/wallet.html',
]) {
  const source = read(path)
  assert.doesNotMatch(source, /\bNew API\b/, `${path} must not expose the old brand name`)
  assert.ok(source.includes('Matrix API'), `${path} must expose the Matrix API brand`)
}

for (const path of [
  'nginx/nginx.conf',
  'nginx/conf.d/ssl.conf',
  'nginx/ssl.conf.template',
  'nginx/site/pricing.html',
  'nginx/site/wallet.html',
]) {
  const source = read(path)
  assert.doesNotMatch(source, /brand-init\.js\?v=2026071319/, `${path} must not serve a stale brand-init cache key`)
  assert.ok(source.includes(versionedBrandInit), `${path} must serve the cache-busted brand-init script`)
}

assert.ok(brandInit.includes(`favicon: '${versionedFavicon}'`), 'brand injection must synchronize favicon with the white-background icon')
assert.ok(newApiDefaultIndex.includes(versionedFavicon), 'New API default shell must use the white-background favicon asset')
assert.ok(newApiClassicIndex.includes(versionedFavicon), 'New API classic shell must use the white-background favicon asset')
assert.doesNotMatch(newApiDefaultIndex, /rel=["']icon["'][^>]+href=["']\/logo\.png["']/, 'New API default shell must not use the transparent logo as favicon')
assert.doesNotMatch(newApiClassicIndex, /rel=["']icon["'][^>]+href=["']\/logo\.png["']/, 'New API classic shell must not use the transparent logo as favicon')

for (const [name, source] of Object.entries({
  'New API default dist shell': newApiDefaultDistIndex,
  'New API classic dist shell': newApiClassicDistIndex,
})) {
  assert.ok(source.includes(versionedFavicon), `${name} must use the cache-busted white-background favicon asset`)
  assert.doesNotMatch(source, /rel=["']icon["'][^>]+href=["']\/logo\.png["']/, `${name} must not use the transparent logo as favicon`)
  assert.doesNotMatch(source, /rel=["']icon["'][^>]+href=["']\/favicon\.ico["']/, `${name} must not use the unversioned favicon link`)
}

for (const path of [
  'nginx/site/index.html',
  'nginx/site/pricing.html',
  'nginx/site/rankings.html',
]) {
  const source = read(path)
  assert.ok(source.includes(versionedFavicon), `${path} must use the white-background favicon asset`)
}

const python = [
  'import json',
  'from PIL import Image',
  `im=Image.open(r'${resolve(root, 'nginx/site/matrixapi-logo.png')}').convert('RGBA')`,
  "a=im.getchannel('A')",
  "print(json.dumps({'size':im.size,'bbox':a.getbbox(),'extrema':a.getextrema(),'corner':im.getpixel((0,0)),'transparent':sum(1 for value in a.get_flattened_data() if value == 0)}))",
].join(';')
const alpha = JSON.parse(execFileSync('python', ['-c', python], { encoding: 'utf8' }))
assert.equal(alpha.extrema[0], 0, 'logo PNG must have an alpha channel with transparent pixels')
assert.equal(alpha.corner[3], 0, 'logo PNG corners must be transparent')
assert.ok(alpha.transparent > 0, 'logo PNG must contain transparent background pixels')
assert.ok(
  (alpha.bbox[2] - alpha.bbox[0]) / alpha.size[0] >= 0.75,
  'logo artwork must fill at least 75% of the transparent canvas width',
)
assert.ok(
  (alpha.bbox[3] - alpha.bbox[1]) / alpha.size[1] >= 0.75,
  'logo artwork must fill at least 75% of the transparent canvas height',
)

const favicon = JSON.parse(execFileSync('python', ['-c', [
  'import json',
  'from PIL import Image',
  `im=Image.open(r'${resolve(root, 'nginx/site/matrixapi-favicon.png')}').convert('RGBA')`,
  "print(json.dumps({'size':im.size,'corner':im.getpixel((0,0))}))",
].join(';')], { encoding: 'utf8' }))
assert.equal(favicon.corner[0], 255, 'favicon corner must be white')
assert.equal(favicon.corner[1], 255, 'favicon corner must be white')
assert.equal(favicon.corner[2], 255, 'favicon corner must be white')
assert.equal(favicon.corner[3], 255, 'favicon corner must be opaque')

const appTabIcons = JSON.parse(execFileSync('python', ['-c', [
  'import json, os',
  'from PIL import Image',
  `root=r'${root}'`,
  "paths=['output/new-api-src/web/default/public/favicon.ico','output/new-api-src/web/default/dist/favicon.ico','output/new-api-src/web/classic/public/favicon.ico','output/new-api-src/web/classic/dist/favicon.ico']",
  'out={}',
  'for path in paths:',
  '    full=os.path.join(root,path)',
  '    im=Image.open(full).convert("RGBA")',
  '    out[path]={"size":im.size,"corner":im.getpixel((0,0))}',
  'print(json.dumps(out))',
].join('\n')], { encoding: 'utf8' }))

for (const [path, data] of Object.entries(appTabIcons)) {
  assert.deepEqual(data.corner, [255, 255, 255, 255], `${path} must have an opaque white favicon background`)
}

console.log(JSON.stringify({ pass: true, alpha, favicon, appTabIcons }))
