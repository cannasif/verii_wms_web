const fs=require('fs');const path=require('path');const parser=require('@babel/parser');const traverse=require('@babel/traverse').default;const t=require('@babel/types');
const mod='bilginoglu-hakedis';const dir='src/features/'+mod;const exts=/\.(ts|tsx)$/;const files=[];
const walk=(d)=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory()) walk(p);else if(exts.test(e.name)) files.push(p);}};walk(dir);
const loc=JSON.parse(fs.readFileSync(path.join(dir,'localization','en.json'),'utf8'));
const has=(obj,key)=>{let c=obj;for(const p of key.split('.')){if(!c||typeof c!=='object'||!(p in c)) return false;c=c[p];}return true;};
let hard=[];let miss=[];
for(const file of files){const ast=parser.parse(fs.readFileSync(file,'utf8'),{sourceType:'module',plugins:['typescript','jsx','decorators-legacy','classProperties'] ,errorRecovery:true});traverse(ast,{CallExpression(n){const c=n.node.callee;if(!t.isIdentifier(c,{name:'t'})) return;const args=n.node.arguments;if(!args.length||!t.isStringLiteral(args[0])) return;const k=args[0].value;if(!k.startsWith(mod+'.')) return;if(!has(loc,k)) miss.push(k);},JSXText(x){const s=(x.node.value||'').replace(/\s+/g,' ').trim();if(!s||s.length<3) return;if(!/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(s)) return;hard.push(path.relative(process.cwd(),file)+':'+(x.node.loc?x.node.loc.start.line:-1)+':'+s);}})}
console.log('MISSING='+[...new Set(miss)].length);for(const k of [...new Set(miss)]) console.log(k);console.log('HARDCODED='+hard.length);for(const h of hard.slice(0,120)) console.log(h);
