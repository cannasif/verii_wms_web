const fs=require('fs');
const path=require('path');
const parser=require('@babel/parser');
const traverse=require('@babel/traverse').default;
const t=require('@babel/types');

const mod=process.argv[2];
if(!mod){console.error('module required');process.exit(1);} 
const dir=path.join('src/features',mod);
const files=[];
const walk=(d)=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p); else if(/\.(ts|tsx)$/.test(e.name)) files.push(p);}};
walk(dir);
const candidates=[];
for(const f of files){
  const src=fs.readFileSync(f,'utf8');
  const ast=parser.parse(src,{sourceType:'module',plugins:['typescript','jsx','decorators-legacy','classProperties'],errorRecovery:true});
  traverse(ast,{JSXAttribute(node){
    const n=node.node;
    if(!n.value) return;
    // keep string only
    if(t.isStringLiteral(n.value)){ 
      const s=n.value.value.trim();
      if(!s || s.length<2) return;
      if(!/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(s)) return;
      candidates.push({file:path.relative(process.cwd(),f), line:n.loc.start.line, key:n.name.name, text:s});
    }
    if(t.isJSXExpressionContainer(n.value) && t.isStringLiteral(n.value.expression)){
      const s=n.value.expression.value.trim();
      if(!s||s.length<2||!/ [A-Za-zÇĞİÖŞÜçğıöşü]/.test(' '+s)) return;
      candidates.push({file:path.relative(process.cwd(),f), line:n.loc.start.line, key:n.name.name, text:s});
    }
  }});
}
for(const c of candidates){console.log(`${c.file}:${c.line}:${c.key}:${c.text}`);} 
