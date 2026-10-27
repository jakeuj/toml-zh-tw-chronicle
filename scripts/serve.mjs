import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const data=JSON.parse(await readFile(new URL('../data/chronicle.json',import.meta.url),'utf8'));
const base=new URL(data.siteUrl).pathname;
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.xml':'application/xml; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/' && base!=='/'){res.writeHead(302,{location:base});res.end();return;}
  if(!url.pathname.startsWith(base)){res.writeHead(404);res.end('Not found');return;}
  let name=decodeURIComponent(url.pathname.slice(base.length))||'index.html';
  if(name.endsWith('/'))name+='index.html';
  const file=path.resolve(root,name);
  if(!file.startsWith(root)){res.writeHead(403);res.end();return;}
  const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(4173,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:4173${base}`));
