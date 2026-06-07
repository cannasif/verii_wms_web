const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

const moduleName = process.argv[2];
if (!moduleName) {
  console.error('module argument required');
  process.exit(1);
}

const root = path.join(process.cwd(), 'src/features', moduleName);
const localizationDir = path.join(root, 'localization');
const feature = moduleName;
const exts = /\.(ts|tsx)$/;

const files = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (exts.test(e.name)) files.push(p);
  }
}

if (!fs.existsSync(root)) {
  console.error('Module not found', moduleName);
  process.exit(1);
}

walk(root);

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function toTitleCase(value) {
  const s = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\./g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return value;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function setNested(target, keyPath, value) {
  const parts = keyPath.split('.');
  let cur = target;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (i === parts.length - 1) {
      if (!(p in cur)) cur[p] = value;
    } else {
      if (!(p in cur) || typeof cur[p] !== 'object' || cur[p] === null) cur[p] = {};
      cur = cur[p];
    }
  }
}

function hasNested(obj, keyPath) {
  let cur = obj;
  for (const p of keyPath.split('.')) {
    if (!cur || typeof cur !== 'object' || !(p in cur)) return false;
    cur = cur[p];
  }
  return true;
}

const existingDefaultMap = new Map();
const missing = new Set();

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
      if (!key.startsWith(feature + '.')) return;
      let defaultValue = '';
      if (args[1] && t.isObjectExpression(args[1])) {
        const dv = args[1].properties.find(
          (p) =>
            t.isObjectProperty(p) &&
            ((t.isIdentifier(p.key) && p.key.name === 'defaultValue') ||
              (t.isStringLiteral(p.key) && p.key.value === 'defaultValue')) &&
            t.isStringLiteral(p.value),
        );
        if (dv && t.isStringLiteral(dv.value)) defaultValue = dv.value.value;
      }
      if (defaultValue) existingDefaultMap.set(key, defaultValue);
      missing.add(key);
    },
  });
}

const langs = ['en', 'tr', 'de', 'es', 'fr', 'it', 'ar'];
ensureDir(localizationDir);

const enPath = path.join(localizationDir, 'en.json');
const enObj = fs.existsSync(enPath)
  ? JSON.parse(fs.readFileSync(enPath, 'utf8'))
  : {};

const trPath = path.join(localizationDir, 'tr.json');
const trObj = fs.existsSync(trPath)
  ? JSON.parse(fs.readFileSync(trPath, 'utf8'))
  : {};

for (const key of [...missing].sort()) {
  const dv = existingDefaultMap.get(key);
  if (!hasNested(enObj, key)) setNested(enObj, key, dv || toTitleCase(key.split('.').slice(-1)[0]));
  if (!hasNested(trObj, key)) setNested(trObj, key, dv || toTitleCase(key.split('.').slice(-1)[0]));
}

const writePretty = (obj) => JSON.stringify(obj, null, 2) + '\n';
fs.writeFileSync(enPath, writePretty(enObj));
fs.writeFileSync(trPath, writePretty(trObj));

for (const lang of ['de', 'es', 'fr', 'it', 'ar']) {
  const out = JSON.parse(JSON.stringify(enObj));
  fs.writeFileSync(path.join(localizationDir, `${lang}.json`), writePretty(out));
}

console.log(`updated ${moduleName}`);
console.log(`KEYS=${missing.size}`);
for (const k of [...missing].sort()) console.log(k);
