import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DE_PATH = path.join(ROOT, 'src/locales/de/common.json');
const PATCH_PATH = path.join(ROOT, 'scripts/operations-de-patch.json');
const OVERRIDES_PATH = path.join(ROOT, 'scripts/de-manual-overrides.json');

function flatten(obj, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(obj ?? {})) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) flatten(value, nextKey, out);
    else out[nextKey] = value;
  }
  return out;
}

function unflatten(flat) {
  const root = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let current = root;
    for (let index = 0; index < parts.length - 1; index += 1) {
      current[parts[index]] = current[parts[index]] ?? {};
      current = current[parts[index]];
    }
    current[parts.at(-1)] = value;
  }
  return root;
}

const patch = fs.existsSync(PATCH_PATH) ? JSON.parse(fs.readFileSync(PATCH_PATH, 'utf8')) : {};
const overrides = fs.existsSync(OVERRIDES_PATH) ? JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf8')) : {};
const deFlat = flatten(JSON.parse(fs.readFileSync(DE_PATH, 'utf8')));

let applied = 0;
for (const [key, value] of Object.entries({ ...patch, ...overrides })) {
  if (deFlat[key] !== value) {
    deFlat[key] = value;
    applied += 1;
  }
}

fs.writeFileSync(DE_PATH, `${JSON.stringify(unflatten(deFlat), null, 2)}\n`);
console.log(`Applied ${applied} patch override values to de/common.json`);
