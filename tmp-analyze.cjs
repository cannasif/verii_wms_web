const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

function walk(dir, arr = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, arr);
    else if (/\.(ts|tsx)$/.test(entry.name)) arr.push(p);
  }
  return arr;
}

function hasNestedKey(tree, key) {
  const parts = key.split('.');
  let cur = tree;
  for (const p of parts) {
    if (!cur || typeof cur !== 'object' || !(p in cur)) return false;
    cur = cur[p];
  }
  return true;
}

const files = walk('src/features/package');
const enLoc = JSON.parse(fs.readFileSync('src/features/package/localization/en.json', 'utf8'));
const packageKeys = new Set();
const defaultMap = new Map();
const hardcoded = [];

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const ast = parser.parse(source, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx', 'decorators-legacy', 'classProperties'],
    errorRecovery: true,
  });

  traverse(ast, {
    CallExpression(pathNode) {
      const callee = pathNode.node.callee;
      if (!t.isIdentifier(callee, { name: 't' }) && !t.isIdentifier(callee, { name: 'translate' })) return;
      const args = pathNode.node.arguments;
      if (!args.length) return;
      const first = args[0];
      if (!t.isStringLiteral(first)) return;
      const key = first.value;
      if (!key.startsWith('package.')) return;
      packageKeys.add(key);

      if (args[1] && t.isObjectExpression(args[1])) {
        const dv = args[1].properties.find((p) => {
          if (!t.isObjectProperty(p)) return false;
          return (t.isIdentifier(p.key) && p.key.name === 'defaultValue') || (t.isStringLiteral(p.key) && p.key.value === 'defaultValue');
        });
        if (dv && t.isStringLiteral(dv.value)) {
          defaultMap.set(key, dv.value.value);
        }
      }
    },
    JSXText(pathNode) {
      const text = (pathNode.node.value || '').replace(/\s+/g, ' ').trim();
      if (!text) return;
      if (!/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(text)) return;
      if (text.length <= 2) return;
      const filename = path.relative(process.cwd(), file);
      const line = pathNode.node.loc ? pathNode.node.loc.start.line : -1;
      hardcoded.push({ filename, line, text });
    },
  });
}

const missingEn = [...packageKeys].filter((key) => !hasNestedKey(enLoc, key)).sort();

console.log(`PACKAGE_KEYS=${packageKeys.size}`);
console.log(`DEFAULT_VALUES=${defaultMap.size}`);
console.log(`MISSING_EN=${missingEn.length}`);
for (const key of missingEn) {
  console.log(key);
}
console.log('DEFAULTS_START');
for (const [k,v] of [...defaultMap.entries()].sort((a,b)=>a[0].localeCompare(b[0]))) {
  console.log(`${k}||${v}`);
}
console.log('HARDCODED_START');
for (const h of hardcoded.slice(0, 240)) {
  console.log(`${h.filename}:${h.line}:${h.text}`);
}
