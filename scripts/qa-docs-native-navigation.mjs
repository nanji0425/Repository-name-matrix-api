import { readFileSync } from 'node:fs';

const files = {
  topNavLinks: 'output/new-api-src/web/default/src/hooks/use-top-nav-links.ts',
  layoutTypes: 'output/new-api-src/web/default/src/components/layout/types.ts',
  navLinkItem:
    'output/new-api-src/web/default/src/components/layout/components/nav-link-item.tsx',
  topNav: 'output/new-api-src/web/default/src/components/layout/components/top-nav.tsx',
  publicNavigation:
    'output/new-api-src/web/default/src/components/layout/components/public-navigation.tsx',
  publicHeader:
    'output/new-api-src/web/default/src/components/layout/components/public-header.tsx',
  hero: 'output/new-api-src/web/default/src/features/home/components/sections/hero.tsx',
};

const source = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [
    key,
    readFileSync(file, 'utf8'),
  ])
);

const failures = [];

function expectIncludes(key, needle, message) {
  if (!source[key].includes(needle)) failures.push(message);
}

function expectNotIncludes(key, needle, message) {
  if (source[key].includes(needle)) failures.push(message);
}

expectIncludes(
  'topNavLinks',
  "native: true",
  'Docs top navigation link must be marked native so TanStack Router does not intercept /docs.'
);
expectIncludes(
  'layoutTypes',
  'native?: boolean',
  'TopNavLink type must support native same-tab document navigation.'
);
expectIncludes(
  'topNavLinks',
  "links.push({ title: t('Docs'), href: docsLink, native: true })",
  'Docs link must use native: true in useTopNavLinks().'
);

for (const key of ['navLinkItem', 'topNav', 'publicNavigation', 'publicHeader']) {
  expectIncludes(
    key,
    key === 'topNav' ? 'external || native' : 'link.native',
    `${files[key]} must render native links with <a href> instead of <Link to>.`
  );
  expectIncludes(
    key,
    key === 'topNav' ? "target={external ? '_blank' : undefined}" : 'target={link.external ?',
    `${files[key]} must keep native docs navigation in the same tab while external links open a new tab.`
  );
}

expectIncludes(
  'hero',
  'render={<a href={docsUrl} />}',
  'Homepage hero Docs button must use a native anchor.'
);
expectNotIncludes(
  'hero',
  'render={<Link to={docsUrl} />}',
  'Homepage hero Docs button must not use TanStack Link for /docs.'
);

if (failures.length) {
  console.error(JSON.stringify({ pass: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ pass: true }));
