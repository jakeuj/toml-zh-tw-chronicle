import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>readFileSync(path.join(root,p),'utf8');
const data=JSON.parse(read('data/chronicle.json'));
const coverage=JSON.parse(read('data/coverage.json'));
const facebook=JSON.parse(read('data/facebook-comments.json'));
const html=read('dist/index.html');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
test('來源覆蓋：逐則紀錄、空白 review 與原始 ID 不遺漏、不重複',()=>{
 assert.equal(coverage.items.length,17);
 assert.equal(new Set(coverage.items.map(x=>x.sourceId)).size,17);
 assert.equal(data.records.length,16);
 assert.equal(new Set(data.records.map(x=>x.id)).size,16);
 for(const x of coverage.items){assert.ok(data.records.some(r=>r.id===x.representedBy),x.sourceId);assert.match(x.bodySha256,/^[a-f0-9]{64}$/);}
 for(const r of data.records)assert.equal(coverage.items.filter(x=>x.sourceId===r.sourceId).length,1);
 assert.equal(coverage.items.filter(x=>x.emptyBody).length,1);
 assert.equal(coverage.items.find(x=>x.emptyBody).representedBy,'review-response');
 assert.deepEqual([97,98,99].map(n=>data.records.filter(r=>r.thread===String(n)).length),[8,4,4]);
});
test('不執行 JavaScript 即有完整繁中正文、時間與原文來源',()=>{
 for(const r of data.records){
  assert.ok(html.includes(`id="${r.id}"`));assert.ok(html.includes(escape(r.url)));
  for(const paragraph of r.paragraphs)assert.ok(html.includes(escape(paragraph)),r.id);
  assert.ok(!/hidden[^>]*data-record|data-record[^>]*hidden/.test(html));
  assert.ok(Number.isFinite(Date.parse(r.createdAt)));
  if(r.editedAt)assert.ok(Date.parse(r.editedAt)>=Date.parse(r.createdAt));
 }
 assert.ok(html.includes('UTC '));
});
test('所有站內錨點可到達，沒有重複 ID',()=>{
 const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(const [,id] of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(id),id);
});
test('Facebook 可讀留言覆蓋與回覆層級完整，保留分鐘精度',()=>{
 assert.equal(facebook.observedPageCount,18);
 assert.equal(facebook.items.length,18);
 assert.equal(new Set(facebook.items.map(x=>x.id)).size,18);
 assert.equal(facebook.items.filter(x=>!x.parentId).length,10);
 assert.equal(facebook.items.filter(x=>x.parentId).length,8);
 assert.equal(facebook.items.filter(x=>x.depth===2).length,1);
 assert.equal((html.match(/data-record data-author=/g)||[]).length,34);
 for(const r of facebook.items){
  assert.ok(html.includes(`id="${r.id}"`));assert.ok(html.includes(escape(r.url)));
  assert.match(r.createdAt,/T\d{2}:\d{2}\+08:00$/);
  assert.equal(r.timePrecision,'minute');
  assert.match(r.sourceTextSha256,/^[a-f0-9]{64}$/);
  for(const paragraph of r.paragraphs)assert.ok(html.includes(escape(paragraph)),r.id);
  if(r.parentId){
   const parent=facebook.items.find(x=>x.id===r.parentId);
   assert.ok(parent,r.id);assert.equal(r.depth,parent.depth+1);assert.equal(r.rootId,parent.rootId);
  }else{assert.equal(r.depth,0);assert.equal(r.rootId,r.id);}
 }
 assert.ok(html.includes('value="facebook"'));
 assert.ok(html.includes('顯示全部 34 篇紀錄'));
});
test('跨串時間線以時間排序，重要事件全數呈現',()=>{
 const times=[...html.matchAll(/data-timeline-time="([^"]+)"/g)].map(m=>Date.parse(m[1]));
 assert.ok(times.length>=24);
 for(let i=1;i<times.length;i++)assert.ok(times[i]>=times[i-1]);
 for(const e of coverage.events)assert.ok(html.includes(escape(e.url)));
 assert.equal(coverage.prHead,coverage.fixParent);
 assert.ok(!coverage.prCommitShas.includes(coverage.fixCommit));
});
test('GitHub Pages 子路徑、分享 metadata 與 1200×630 PNG 相符',()=>{
 assert.ok(html.includes('<html lang="zh-Hant-TW">'));
 assert.ok(html.includes(`<link rel="canonical" href="${data.siteUrl}">`));
 assert.ok(html.includes('og:image:alt'));
 assert.ok(!/localhost|127\.0\.0\.1/.test(html));
 for(const [,asset] of html.matchAll(/(?:src|href)="(assets\/[^"#?]+)"/g))assert.ok(existsSync(path.join(root,'dist',asset)),asset);
 assert.ok(!/(?:src|href)="\/assets\//.test(html));
 const png=readFileSync(path.join(root,'dist/assets/toml-chronicle-cover-v1.png'));
 assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
 assert.ok(read('dist/sitemap.xml').includes(data.siteUrl));
});
