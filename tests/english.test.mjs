import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const base=json('data/chronicle.json');
const enHTML=read('dist/en/index.html'),zhHTML=read('dist/index.html');
const files=['chronicle','facebook-comments','facebook-self-published-comments','facebook-followup-comments'];
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const records=d=>d.records||d.items;

test('英文資料逐 ID 對齊 144 筆，保留作者、時間、來源與回覆證據',()=>{
 let count=0;
 for(const name of files){
  const zh=json('data/'+name+'.json'),en=json('data/en/'+name+'.json');
  assert.equal(en.language,'en');assert.equal(en.capturedAt,zh.capturedAt);
  assert.equal(en.sourceEditorialSha256,createHash('sha256').update(readFileSync(path.join(root,'data',name+'.json'))).digest('hex'),name+' translation needs review');
  assert.deepEqual(records(en).map(r=>r.id),records(zh).map(r=>r.id));
  for(let i=0;i<records(zh).length;i++){
   const a=records(zh)[i],b=records(en)[i];count++;
   for(const key of ['id','sourceId','author','url','createdAt','editedAt','rootId','parentId','parentCandidates','parentResolution','depth','edited','authorLiked','sourceTextSha256','deletedParentNotice'])assert.deepEqual(b[key],a[key],`${a.id}: ${key}`);
   assert.equal(b.paragraphs.length,a.paragraphs.length,a.id);assert.equal(b.notes.length,a.notes.length,a.id);
   assert.notEqual(b.title,a.title,a.id);
   assert.deepEqual(b.evidenceLinks?.map(x=>x.url),a.evidenceLinks?.map(x=>x.url));
  }
 }
 assert.equal(count,144);
 const self=json('data/en/facebook-self-published-comments.json');
 assert.equal(self.loadedCount,51);assert.equal(self.observedPageCount,58);assert.equal(self.deletionNotices.length,6);
 assert.ok(self.coverageNote.includes('Seven'));assert.ok(self.coverageNote.includes('six distinct'));
});

test('英文完整正文直接輸出 HTML，所有固定錨點與來源可到達',()=>{
 const ids=[...enHTML.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
 for(const [,id] of enHTML.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(id),id);
 assert.equal((enHTML.match(/data-record data-author=/g)||[]).length,144);
 assert.ok(!/hidden[^>]*data-record|data-record[^>]*hidden/.test(enHTML));
 for(const name of files)for(const r of records(json('data/en/'+name+'.json'))){
  assert.ok(enHTML.includes(`id="${r.id}"`),r.id);assert.ok(enHTML.includes(esc(r.url)),r.id);
  for(const text of [...r.paragraphs,...r.notes])assert.ok(enHTML.includes(esc(text)),r.id);
 }
 for(const q of json('data/en/translation-context.json').questions)for(const f of q.findings)assert.ok(enHTML.includes(esc(f.text)),q.id);
 const times=s=>[...s.matchAll(/data-timeline-time="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(times(enHTML),times(zhHTML));assert.equal(times(enHTML).length,28);
});

test('中英文 canonical、hreflang、切換與子路徑資源指向正確版本',()=>{
 const enUrl=new URL('en/',base.siteUrl).href;
 assert.ok(enHTML.includes('<html lang="en">'));
 assert.ok(enHTML.includes(`<link rel="canonical" href="${enUrl}">`));
 for(const html of [enHTML,zhHTML]){
  assert.ok(html.includes(`hreflang="en" href="${enUrl}"`));
  assert.ok(html.includes(`hreflang="zh-Hant-TW" href="${base.siteUrl}"`));
  assert.ok(html.includes('data-language-switch'));
 }
 assert.ok(enHTML.includes('data-language-switch href="../"'));
 assert.ok(zhHTML.includes('data-language-switch href="en/"'));
 for(const [,asset] of enHTML.matchAll(/(?:src|href)="(\.\.\/(?:assets|data)\/[^"?#]+)/g))assert.ok(existsSync(path.resolve(root,'dist/en',asset)),asset);
 assert.ok(!/(?:src|href)="\/assets\//.test(enHTML));
 const sitemap=read('dist/sitemap.xml');assert.ok(sitemap.includes(`<loc>${base.siteUrl}</loc>`));assert.ok(sitemap.includes(`<loc>${enUrl}</loc>`));
});

test('英文分享圖與 metadata 相符，來源補充不遺漏',()=>{
 const image='assets/toml-chronicle-cover-en-v1.png';
 const png=readFileSync(path.join(root,'dist',image));assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
 assert.ok(enHTML.includes(`property="og:image" content="${new URL(image,base.siteUrl).href}"`));
 assert.ok(enHTML.includes('property="og:locale" content="en_US"'));
 for(const name of ['translation-context','facebook-sources']){
  const zh=json('data/'+name+'.json'),en=json('data/en/'+name+'.json');assert.equal(en.checkedAt,zh.checkedAt);
  assert.equal(en.sourceEditorialSha256,createHash('sha256').update(readFileSync(path.join(root,'data',name+'.json'))).digest('hex'));
  assert.deepEqual((en.sources||en.posts).map(s=>s.url||s.postUrl),(zh.sources||zh.posts).map(s=>s.url||s.postUrl));
 }
 assert.ok(enHTML.includes('not received named human linguistic review'));
});
