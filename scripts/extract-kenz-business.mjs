import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';

// One-time frontend extraction. API routes, functions, credentials and database stay in Kenz.
const root = process.cwd();
const target = path.join(root, 'kenz business');
const manifestPath = path.join(target, 'migration-manifest.json');
if (fs.existsSync(manifestPath)) throw new Error('Extraction already completed; do not overwrite the independent portal.');
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root }).toString().split('\0').filter(Boolean);
const businessRoutes = tracked.filter((file) => file.startsWith('src/app/') && (
  file.startsWith('src/app/dashboard/business-pro/') ||
  file.startsWith('src/app/dashboard/settings/business-account/') ||
  file.startsWith('src/app/dashboard/agent-relay/') ||
  file.startsWith('src/app/dashboard/agent/') ||
  file.startsWith('src/app/dashboard/echurch/') ||
  file.startsWith('src/app/dashboard/nkampa/store/') ||
  file === 'src/app/dashboard/nkampa/seller/page.tsx'
) && /\.(tsx?|jsx?)$/.test(file));
const sharedRoutes = ['login', 'complete-profile', 'kyc', 'age-restricted'].map((route) => `src/app/${route}/page.tsx`);
const queue = [...businessRoutes, ...sharedRoutes,
  'src/components/theme-provider.tsx', 'src/components/ui/toaster.tsx',
  'src/components/dashboard/global-location-bar.tsx',
  'src/components/security/AgeRestrictionGate.tsx',
  'src/components/shared/kenz-data-loader.tsx',
  'src/hooks/useKycStatus.ts', 'src/lib/cloudinary-upload.ts',
  'src/components/verified-account-badge.tsx',
];
const copied = new Set();
const assets = new Set(['public/kenz-logo.png', 'public/favicon.ico', 'public/apple-touch-icon.png']);
const external = new Set(['next', 'react', 'react-dom', 'firebase', 'lucide-react']);
const resolve = (specifier, source) => {
  const base = specifier.startsWith('@/') ? path.join(root, 'src', specifier.slice(2)) : path.resolve(root, path.dirname(source), specifier);
  return [base, ...['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '/index.ts', '/index.tsx'].map((ext) => base + ext)]
    .find((file) => fs.existsSync(file) && fs.statSync(file).isFile());
};
const copy = (file) => {
  fs.mkdirSync(path.dirname(path.join(target, file)), { recursive: true });
  fs.copyFileSync(path.join(root, file), path.join(target, file));
};
while (queue.length) {
  const file = queue.shift();
  if (copied.has(file)) continue;
  if (file.startsWith('src/app/api/') || file.startsWith('functions/')) throw new Error(`Backend dependency must remain upstream: ${file}`);
  copied.add(file);
  copy(file);
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  if (file.endsWith('.json')) continue;
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  function visit(node) {
    let spec;
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) spec = node.moduleSpecifier.text;
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || node.expression.getText(ast) === 'require') && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) spec = node.arguments[0].text;
    if (spec) {
      if (spec.startsWith('@/') || spec.startsWith('.')) {
        const resolved = resolve(spec, file);
        if (!resolved) throw new Error(`Unresolved import ${spec} in ${file}`);
        queue.push(path.relative(root, resolved));
      } else if (!spec.startsWith('node:')) {
        external.add(spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]);
      }
    }
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && node.text.startsWith('/')) {
      const asset = `public${node.text.split('?')[0]}`;
      if (fs.existsSync(path.join(root, asset)) && fs.statSync(path.join(root, asset)).isFile()) assets.add(asset);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
}
for (const file of tracked.filter((name) => name.startsWith('public/brand/'))) assets.add(file);
for (const asset of assets) copy(asset);
for (const file of ['tailwind.config.ts', 'postcss.config.mjs', 'src/app/globals.css']) if (fs.existsSync(path.join(root, file))) copy(file);
const sourcePackage = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const dependencies = Object.fromEntries(Object.entries(sourcePackage.dependencies).filter(([name]) => external.has(name) || name === 'tailwindcss-animate'));
fs.writeFileSync(path.join(target, 'package.json'), JSON.stringify({
  name: 'kenz-business', version: '1.0.0', private: true,
  scripts: { dev: 'next dev --turbopack -p 9003', build: 'next build', start: 'next start -p 9003', typecheck: 'tsc --noEmit', test: 'node --test tests/*.test.mjs' },
  dependencies,
  devDependencies: Object.fromEntries(Object.entries(sourcePackage.devDependencies).filter(([name]) => !['@tauri-apps/cli', 'genkit-cli'].includes(name))),
}, null, 2) + '\n');
fs.writeFileSync(manifestPath, JSON.stringify({
  sourceRepository: 'https://github.com/MakGroupDigital/eNkamba-app.git',
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root }).toString().trim(),
  backend: 'Shared Kenz Firebase project and original HTTP API; no backend deployment in this repository',
  businessRoutes, sharedRoutes, files: [...copied].sort(), assets: [...assets].sort(),
}, null, 2) + '\n');
console.log(`Extracted ${businessRoutes.length} business route files, ${copied.size} frontend dependencies and ${assets.size} assets.`);
