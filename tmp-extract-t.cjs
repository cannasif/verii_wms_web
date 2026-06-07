const fs=require('fs');
const path=require('path');
const parser=require('@babel/parser');
const traverse=require('@babel/traverse').default;
const t=require('@babel/types');

const mod=process.argv[2];
if(!mod){console.error('need module');process.exit(1);} 
const dir=path.join('src/features',mod);
const files=[];
const walk=(p)=>{for(const e of fs.readdirSync(p,{withFileTypes:true})){const f=path.join(p,e.name);if(e.isDirectory())walk(f);else if(/\.(ts|tsx)$/.test(e.name)) files.push(f);} };
walk(dir);
const entries=[];
for(const file of files){
  const src=fs.readFileSync(file,'utf8');
  const ast=parser.parse(src,{sourceType:'module',plugins:['typescript','jsx','decorators-legacy','classProperties'],errorRecovery:true});
  traverse(ast,{CallExpression(node){
    const callee=node.node.callee;
    if(!t.isIdentifier(callee,{name:'t'})) return;
    const args=node.node.arguments;
    if(!args.length || !t.isStringLiteral(args[0])) return;
    const key=args[0].value;
    if(!key.startsWith(mod+".")) return;
    let dv=null;
    if(args[1] && t.isObjectExpression(args[1])){
      const p=args[1].properties.find(x=>t.isObjectProperty(x)&&((t.isIdentifier(x.key)&&x.key.name==='defaultValue')||(t.isStringLiteral(x.key)&&x.key.value==='defaultValue')));
      if(p && t.isStringLiteral(p.value)) dv=p.value.value;
    }
    entries.push({key,dv,file:path.relative(process.cwd(),file)});
  }});
}
for(const e of entries){
  console.log(`${e.file}\t${e.key}\t${e.dv||''}`);
}
