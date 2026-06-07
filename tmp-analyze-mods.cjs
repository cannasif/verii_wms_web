const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

const mods = ['transfer', 'goods-receipt', 'warehouse', 'service-allocation', 'kkd'];

function walk(dir, files) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, files);
    else if (/\.(ts|tsx)$/.test(e.name)) files.push(p);
  }
}

function hasNested(obj, keyPath) {
  let cur = obj;
  for (const k of keyPath.split('.')) {
    if (!cur || typeof cur !== 'object' || !(k in cur)) return false;
    cur = cur[k];
  }
  return true;
}

for (const mod of mods) {
  const dir = path.join('src/features', mod);
  if (!fs.existsSync(dir)) {
    console.log(`## ${mod}`);
    console.log('MISSING_DIR');
    continue;
  }

  const files = [];
  walk(dir, files);

  const locPath = path.join(dir, 'localization', 'en.json');
  const hasLoc = fs.existsSync(locPath);
  const loc = hasLoc ? JSON.parse(fs.readFileSync(locPath, 'utf8')) : {};

  const missing = [];
  const hardcoded = [];

  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    const ast = parser.parse(src, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx', 'decorators-legacy', 'classProperties'],
      errorRecovery: true,
    });

    traverse(ast, {
      CallExpression(pathNode) {
        const callee = pathNode.node.callee;
        if (!t.isIdentifier(callee, { name: 't' })) return;
        const args = pathNode.node.arguments;
        if (!args.length || !t.isStringLiteral(args[0])) return;
        const key = args[0].value;
        if (!key.startsWith(mod + '.')) return;
        if (!hasNested(loc, key)) missing.push(key);
      },
      JSXText(node) {
        const text = (node.node.value || '').replace(/\s+/g, ' ').trim();
        if (!text || text.length < 3) return;
        if (!/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(text)) return;
        hardcoded.push({
          file: path.relative(process.cwd(), file),
          line: node.node.loc ? node.node.loc.start.line : -1,
          text,
        });
      },
    });
  }

  const uniqMissing = [...new Set(missing)].sort();
  console.log(`## ${mod}`);
  console.log(`HAS_LOCALIZATION=${hasLoc}`);
  console.log(`MISSING_KEYS=${uniqMissing.length}`);
  for (const m of uniqMissing.slice(0, 120)) {
    console.log(m);
  }
  if (uniqMissing.length > 120) console.log('...');

  console.log(`HARDCODED_TEXTS=${hardcoded.length}`);
  for (const h of hardcoded.slice(0, 180)) {
    console.log(`${h.file}:${h.line}:${h.text}`);
  }
  if (hardcoded.length > 180) console.log('...');
  console.log('');
}
