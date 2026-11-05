import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const code = ts.transpileModule(readFileSync(new URL('../src/lib/business-portal.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const mod = { exports: {} };
new Function('module', 'exports', 'process', code)(mod, mod.exports, process);
const { businessPortalUrl, BUSINESS_ROUTE_ROOTS } = mod.exports;
test('business links preserve account, module and repeated query parameters', () => {
  const url = new URL(businessPortalUrl('/dashboard/business-pro', { businessId: 'account-A', module: 'PAYMENT', filter: ['one', 'two'] }));
  assert.equal(url.hostname, 'business.enkamba.io');
  assert.equal(url.searchParams.get('businessId'), 'account-A');
  assert.deepEqual(url.searchParams.getAll('filter'), ['one', 'two']);
});
test('public product, seller, consumer payment and logistics paths are not migrated', () => {
  for (const path of ['/shop/test/product/test', '/dashboard/nkampa/seller/123', '/dashboard/nkampa', '/dashboard/ugavi', '/dashboard/mbongo-dashboard', '/church/test']) {
    assert.equal(BUSINESS_ROUTE_ROOTS.some(root => path === root || path.startsWith(root + '/')), false);
  }
});
test('external destinations cannot be injected into the portal URL', () => {
  assert.equal(new URL(businessPortalUrl('//evil.test')).hostname, 'business.enkamba.io');
  assert.throws(() => businessPortalUrl('/\\evil.test'));
});
test('consumer settings expose only the business portal entry', () => {
  const settings = readFileSync(new URL('../src/app/dashboard/settings/page.tsx', import.meta.url), 'utf8');
  assert.match(settings, /Obtenir un compte business/);
  assert.doesNotMatch(settings, /useBusinessStatus|useNkampaStore|<AgentRelaySection|<BusinessAccessItem/);
});
