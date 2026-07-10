#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const helperPath = resolve('frontend/src/lib/adminAccess.ts');
const loginPagePath = resolve('frontend/src/app/login/page.tsx');
const marketingLayoutPath = resolve('frontend/src/components/marketing/MarketingLayout.tsx');

const helperSource = readFileSync(helperPath, 'utf8');
const loginSource = readFileSync(loginPagePath, 'utf8');
const marketingSource = readFileSync(marketingLayoutPath, 'utf8');

assert.match(helperSource, /export function isAdminRole/);
assert.match(helperSource, /role === 'ADMIN'/);
assert.match(helperSource, /role === '100'/);
assert.match(helperSource, /role === 100/);
assert.match(helperSource, /export function getPostLoginPath/);
assert.match(helperSource, /return isAdminUser\(user\) \? '\/admin' : '\/dashboard'/);

assert.match(loginSource, /getPostLoginPath/);
assert.match(loginSource, /const loggedInUser = await login/);
assert.match(loginSource, /router\.push\(getPostLoginPath\(loggedInUser\)\)/);

assert.match(marketingSource, /getPostLoginPath/);
assert.match(marketingSource, /onSuccess\(loggedInUser, mode\)/);
assert.match(marketingSource, /router\.push\(mode === 'register' \? '\/dashboard\/api-keys' : getPostLoginPath\(user\)\)/);
assert.doesNotMatch(marketingSource, /router\.push\('\/dashboard'\)/);
assert.match(marketingSource, /router\.push\(getPostLoginPath\(user\)\)/);

console.log('admin login routing QA passed');
