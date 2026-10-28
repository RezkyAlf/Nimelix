import {spawnSync} from 'node:child_process';
import {cpSync,existsSync,mkdirSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
if(!process.argv.includes('--package-only')){
 const result=spawnSync(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'build'],{cwd:root,stdio:'inherit',windowsHide:true});
 if(result.status!==0)process.exit(result.status||1);
}
const source=path.join(root,'.cloudflare/output/v0/workers/default');
const output=path.resolve(root,'pages-dist');
if(path.dirname(output)!==root||path.basename(output)!=='pages-dist')throw Error('Output harus berada di folder pages-dist proyek.');
if(!existsSync(path.join(source,'bundle/index.js')))throw Error('Build vinext belum tersedia.');
const worker=JSON.parse(readFileSync(path.join(source,'worker.config.json'),'utf8'));
const vars={};for(const name of ['ANIME_API_BASE_URL','ALLOWED_STREAM_HOSTS']){
 const binding=worker.env?.[name];if(binding?.type!=='text'||typeof binding.value!=='string')throw Error(`Binding ${name} belum dikonfigurasi`);vars[name]=binding.value;
}
// Replace only this project's generated Pages output, never source or credentials.
rmSync(output,{recursive:true,force:true});mkdirSync(output,{recursive:true});
cpSync(path.join(source,'assets'),output,{recursive:true,filter:file=>!file.endsWith('.map')&&path.basename(file)!=='.vite'});
await build({entryPoints:[path.join(source,'bundle/index.js')],outfile:path.join(output,'_worker.js'),bundle:true,format:'esm',platform:'neutral',target:'es2022',external:['node:*','cloudflare:*'],conditions:['workerd','worker','browser'],minify:true,logLevel:'warning'});
writeFileSync(path.join(output,'_routes.json'),JSON.stringify({version:1,include:['/*'],exclude:['/_next/static/*','/images/*','/poster.svg']},null,2)+'\n');
console.log('\nPaket Cloudflare Pages siap di pages-dist (halaman, API, dan aset).');
