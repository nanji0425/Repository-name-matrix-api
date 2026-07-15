import { existsSync, readFileSync } from 'node:fs'

const files = {
  route: 'output/new-api-src/web/default/src/routes/docs/index.tsx',
  feature: 'output/new-api-src/web/default/src/features/docs/index.tsx',
  topNavLinks: 'output/new-api-src/web/default/src/hooks/use-top-nav-links.ts',
  hero: 'output/new-api-src/web/default/src/features/home/components/sections/hero.tsx',
  sslTemplate: 'nginx/ssl.conf.template',
  sslConf: 'nginx/conf.d/ssl.conf',
  nginxConf: 'nginx/nginx.conf',
}

const failures = []

function read(file) {
  return existsSync(file) ? readFileSync(file, 'utf8') : ''
}

function expectFile(key, message) {
  if (!existsSync(files[key])) failures.push(message)
}

function expectIncludes(key, needle, message) {
  if (!read(files[key]).includes(needle)) failures.push(message)
}

function expectNotIncludes(key, needle, message) {
  if (read(files[key]).includes(needle)) failures.push(message)
}

expectFile('route', 'New frontend must own /docs via src/routes/docs/index.tsx.')
expectFile('feature', 'Docs content must live in the new frontend feature tree.')
expectIncludes('route', "createFileRoute('/docs/')", 'Docs route must be /docs/.')
expectIncludes('route', 'component: Docs', 'Docs route must render the new Docs page.')
expectIncludes('feature', 'PublicLayout', 'Docs page must use the new public layout.')
expectIncludes('feature', 'Matrix API 文档', 'Docs page must contain Matrix API docs content.')
expectIncludes('feature', '1050365180', 'Docs page must show the QQ support group.')

expectIncludes(
  'topNavLinks',
  "links.push({ title: t('Docs'), href: docsLink })",
  'Top navigation Docs link should be a normal SPA route.'
)
expectNotIncludes(
  'topNavLinks',
  "href: docsLink, native: true",
  'Top navigation Docs link must not force native static-page navigation.'
)
expectIncludes(
  'hero',
  "render={<Link to='/docs' />}",
  'Homepage Docs button should use TanStack Link once /docs is a SPA route.'
)
expectNotIncludes(
  'hero',
  'render={<a href={docsUrl} />}',
  'Homepage Docs button must not bypass the SPA router.'
)

expectNotIncludes(
  'sslTemplate',
  'docs-routes.inc',
  'Nginx SSL template must not include the old static docs route.'
)
expectNotIncludes(
  'sslConf',
  'docs-routes.inc',
  'Nginx generated SSL config must not include the old static docs route.'
)
expectNotIncludes(
  'nginxConf',
  'docs-routes.inc',
  'Nginx base config must not include the old static docs route.'
)

if (existsSync('nginx/site/docs.html')) {
  failures.push('Old static docs.html must be removed.')
}
if (existsSync('nginx/conf.d/docs-routes.inc')) {
  failures.push('Old docs-routes.inc must be removed.')
}

if (failures.length) {
  console.error(JSON.stringify({ pass: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({ pass: true }))
