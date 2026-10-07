import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
const root=path.dirname(fileURLToPath(import.meta.url));
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
await build({entryPoints:[path.join(root,'src/experience.js')],outfile:path.join(root,'assets/experience.js'),bundle:true,minify:true,format:'iife',target:'es2022',legalComments:'linked'});
fs.writeFileSync(path.join(root,'index.html'),read('src/page.html').replace('/* STYLES */',read('src/tokens.css')+'\n'+read('src/style.css')));
console.log('Built standalone Cybertruck HTML and local experience bundle.');
