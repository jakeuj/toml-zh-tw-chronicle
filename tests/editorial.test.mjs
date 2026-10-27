import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
test('章節中英文保持對應，中文變更必須複核英文',()=>{
 for(const file of readdirSync(new URL('data/editorial/',root))){
  const raw=readFileSync(new URL('data/editorial/'+file,root));
  const zh=JSON.parse(raw),en=JSON.parse(readFileSync(new URL('data/en/editorial/'+file,root)));
  assert.equal(en.sourceEditorialSha256,createHash('sha256').update(raw).digest('hex'),file+' translation needs review');
  assert.deepEqual(Object.keys(zh),Object.keys(en).filter(k=>k!=='sourceEditorialSha256'),file);
 }
});
test('共用介面語系資料保留中文複核雜湊',()=>{
 const raw=readFileSync(new URL('data/ui.json',root));
 const en=JSON.parse(readFileSync(new URL('data/en/ui.json',root)));
 assert.equal(en.sourceEditorialSha256,createHash('sha256').update(raw).digest('hex'));
 assert.deepEqual(Object.keys(JSON.parse(raw).labels),Object.keys(en.labels));
});
