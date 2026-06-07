const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

const mod = process.argv[2];
if (!mod) {
  console.error('module required');
  process.exit(1);
}

const root = path.join('src/features', mod);
const files = [];
const ignoreProps = new Set([
  'className','variant','size','type','id','name','key','value','checked','rows','cols','disabled','required','readOnly','min','max','step',
  'onChange','onClick','onSubmit','onOpenChange','queryKey','fetchPage','getKey','getLabel','onSelect','open','onValueChange','options',
  'getOptionValue','getOptionLabel','searchPlaceholder','emptyText','isLoading','modal','columns','renderCell','item','titleClassName','contentClassName',
  'variant','href','to','target','rel','src','alt','style','targetType','targetId','targetSourceType','targetPackageStatus','targetWarehouse','field',
  'rowsPerPage','children','disabledTooltip','icon','isError','isSuccess','maxLength','minLength','autoComplete','autoFocus','placeholderKey',
]);

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(e.name)) files.push(p);
  }
}

function maybeUserText(v) {
  return /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(v) && !/^[\d.\-/]+$/.test(v.trim());
}

walk(root);
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const ast = parser.parse(src, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx', 'decorators-legacy', 'classProperties'],
    errorRecovery: true,
  });

  traverse(ast, {
    JSXAttribute(node) {
      const attr = node.node;
      if (!t.isJSXIdentifier(attr.name)) return;
      const name = attr.name.name;
      if (ignoreProps.has(name)) return;

      let text = '';
      if (t.isStringLiteral(attr.value)) text = attr.value.value;
      else if (t.isJSXExpressionContainer(attr.value) && t.isStringLiteral(attr.value.expression)) {
        text = attr.value.expression.value;
      } else {
        return;
      }

      if (!maybeUserText(text)) return;
      const line = attr.loc ? attr.loc.start.line : -1;
      console.log(`${path.relative(process.cwd(), file)}:${line}:${name}:${text}`);
    },
  });
}
