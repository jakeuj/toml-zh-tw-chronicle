import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const exec=promisify(execFile);
const manifest=JSON.parse(readFileSync(new URL('../data/coverage.json',import.meta.url),'utf8'));
const base='repos/toml-lang/toml.io';
async function get(endpoint){
 const {stdout}=await exec('gh',['api','--paginate','--slurp',`${base}/${endpoint}`],{maxBuffer:12*1024*1024});
 const pages=JSON.parse(stdout);return Array.isArray(pages[0])?pages.flat():pages[0];
}
const sourceItems=[];const eventItems=[];
const jobs=[];
for(const n of [97,98,99]){
 jobs.push(get(`issues/${n}`).then(x=>sourceItems.push({id:`issue:${n}`,body:x.body})));
 jobs.push(get(`issues/${n}/comments`).then(xs=>xs.forEach(x=>sourceItems.push({id:`comment:${x.id}`,body:x.body}))));
 jobs.push(get(`issues/${n}/timeline`).then(xs=>xs.filter(x=>['closed','locked','review_requested','copilot_work_started'].includes(x.event)).forEach(x=>eventItems.push(`event:${x.id}`))));
}
jobs.push(get('pulls/98/reviews').then(xs=>xs.forEach(x=>sourceItems.push({id:`review:${x.id}`,body:x.body}))));
jobs.push(get('pulls/98/comments').then(xs=>xs.forEach(x=>sourceItems.push({id:`inline:${x.id}`,body:x.body}))));
const [pr,commits]=await Promise.all([get('pulls/98'),get('pulls/98/commits'),...jobs]);
const failures=[];
const expected=new Map(manifest.items.map(x=>[x.sourceId,x]));
for(const x of sourceItems){
 const saved=expected.get(x.id);
 if(!saved)failures.push(`新增、尚未整理：${x.id}`);
 else if(createHash('sha256').update(x.body||'').digest('hex')!==saved.bodySha256)failures.push(`來源內容已變更：${x.id}`);
}
for(const id of expected.keys())if(!sourceItems.some(x=>x.id===id))failures.push(`來源清單已無此項：${id}`);
const savedEvents=manifest.events.map(e=>e.sourceId);
for(const id of new Set([...savedEvents,...eventItems]))if(savedEvents.includes(id)!==eventItems.includes(id))failures.push(`狀態事件有變：${id}`);
if(pr.head.sha!==manifest.prHead)failures.push('PR head 已變更');
if(JSON.stringify(commits.map(x=>x.sha))!==JSON.stringify(manifest.prCommitShas))failures.push('PR 提交清單已變更');
if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}else console.log(`來源查核通過：${sourceItems.length} 個內容物件、${eventItems.length} 個事件；head 與提交清單符合 ${manifest.capturedAt} 的快照。`);
