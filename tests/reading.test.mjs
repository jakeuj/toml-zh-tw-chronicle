import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {pages} from './helpers.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const script=read('assets/reading-settings.js');
const key='toml-chronicle.reading.v1';
function browser({saved=null,blocked=false,lang='zh-Hant-TW'}={}){
 const storage=new Map([[key,saved],['unrelated','keep']]);
 const root={dataset:{},lang};
 const font={value:'sans'},choices=['18','20','22','24'].map(value=>({value,checked:value==='20'}));
 const status={textContent:''},events={},windowEvents={};
 const reset={addEventListener:(name,fn)=>{events.reset=fn;}};
 const form={hidden:true,querySelector:s=>s==='[name="font"]'?font:reset,querySelectorAll:()=>choices,addEventListener:(name,fn)=>{events[name]=fn;}};
 const document={documentElement:root,readyState:'loading',getElementById:id=>id==='reading-preferences'?form:status,addEventListener:(name,fn)=>{events[name]=fn;}};
 const localStorage={getItem:k=>{if(blocked)throw Error('blocked');return storage.get(k)??null;},setItem:(k,v)=>{if(blocked)throw Error('blocked');storage.set(k,v);},removeItem:k=>{if(blocked)throw Error('blocked');storage.delete(k);}};
 vm.runInNewContext(script,{document,localStorage,window:{addEventListener:(name,fn)=>{windowEvents[name]=fn;}}});
 return {root,form,font,choices,status,events,windowEvents,storage,initialize:()=>events.DOMContentLoaded(),choose:(face,size)=>{font.value=face;choices.forEach(c=>c.checked=c.value===size);events.change();}};
}

test('儲存的有效偏好在 DOM 完成前套用，無效／損壞資料安全回到預設',()=>{
 const b=browser({saved:JSON.stringify({font:'serif',size:'24'})});
 assert.deepEqual(b.root.dataset,{readingFont:'serif',readingSize:'24'});
 assert.equal(b.form.hidden,true);b.initialize();assert.equal(b.form.hidden,false);
 assert.equal(b.font.value,'serif');assert.equal(b.choices.find(c=>c.checked).value,'24');
 for(const saved of ['bad json','null','[]','{"font":"unknown","size":"200"}']){
  const x=browser({saved});assert.deepEqual(x.root.dataset,{readingFont:'sans',readingSize:'20'});
 }
});

test('切換字體字級、重新載入與跨語言共用偏好，恢復預設只清除本站閱讀鍵',()=>{
 const zh=browser();zh.initialize();zh.choose('serif','22');
 assert.deepEqual(JSON.parse(zh.storage.get(key)),{font:'serif',size:'22'});
 const en=browser({saved:zh.storage.get(key),lang:'en'});en.initialize();
 assert.deepEqual(en.root.dataset,{readingFont:'serif',readingSize:'22'});
 en.events.reset();assert.deepEqual(en.root.dataset,{readingFont:'sans',readingSize:'20'});
 assert.equal(en.storage.has(key),false);assert.equal(en.storage.get('unrelated'),'keep');
 assert.match(en.status.textContent,/Applied sans serif, size 20/);
});

test('拒絕讀寫儲存時，設定與重設仍可操作並提供雙語提示',()=>{
 for(const lang of ['zh-Hant-TW','en']){
  const b=browser({blocked:true,lang});b.initialize();b.choose('serif','24');
  assert.deepEqual(b.root.dataset,{readingFont:'serif',readingSize:'24'});
  assert.match(b.status.textContent,lang==='en'?/could not save/:/無法儲存/);
  b.events.reset();assert.deepEqual(b.root.dataset,{readingFont:'sans',readingSize:'20'});
 }
});

test('另一分頁或返回快取時同步已儲存設定',()=>{
 const b=browser();b.initialize();
 b.storage.set(key,JSON.stringify({font:'serif',size:'18'}));b.windowEvents.storage({key});
 assert.deepEqual(b.root.dataset,{readingFont:'serif',readingSize:'18'});
 b.storage.delete(key);b.windowEvents.pageshow({persisted:true});
 assert.deepEqual(b.root.dataset,{readingFont:'sans',readingSize:'20'});
});

test('雙語設定在懶人包前、腳本早於樣式，無 JS 控制項隱藏且不限制縮放',()=>{
 for(const language of ['zh','en']){
  const documents=pages(language);
  for(const {html} of documents){
  assert.ok(html.indexOf('reading-settings.js?v=')<html.indexOf('style.css?v='));
  assert.ok(html.includes('reading.css?v='));
  assert.ok(html.includes('id="reading-settings"'));
  if(html.includes('id="brief"'))assert.ok(html.indexOf('id="reading-settings"')<html.indexOf('id="brief"'));
  assert.match(html,/<form id="reading-preferences" hidden/);
  assert.ok(!/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/.test(html));
  assert.equal((html.match(/class="reading-settings-link"/g)||[]).length,2);
  }
  assert.equal(documents.reduce((count,{html})=>count+(html.match(/data-record data-author=/g)||[]).length,0),144);
 }
});
