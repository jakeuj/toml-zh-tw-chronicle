const tools = document.querySelector('.archive-tools');
const form = document.querySelector('.filter-form');
const search = document.querySelector('#search');
const author = document.querySelector('#author');
const thread = document.querySelector('#thread');
const cards = [...document.querySelectorAll('[data-record]')];
const groups = [...document.querySelectorAll('[data-thread-group]')];
const count = document.querySelector('#result-count');
const empty = document.querySelector('.empty-state');
const status = document.querySelector('#copy-status');
const normalize = s => s.normalize('NFKC').toLocaleLowerCase('zh-TW');
// Index the whole rendered record: title, author, time, prose, context and notes.
const indexed = cards.map(el=>({el,text:normalize(el.textContent)}));

function applyFilters() {
  const words = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
  let total = 0;
  for (const {el,text} of indexed) {
    const match = words.every(word=>text.includes(word)) && (!author.value || el.dataset.author===author.value) && (!thread.value || el.dataset.thread===thread.value);
    el.hidden=!match;
    if(match)total++;
  }
  for(const group of groups)group.hidden=![...group.querySelectorAll('[data-record]')].some(el=>!el.hidden);
  const active = words.length || author.value || thread.value;
  count.textContent=active ? `找到 ${total} / ${cards.length} 篇紀錄` : `顯示全部 ${cards.length} 篇紀錄`;
  empty.hidden=total!==0;
}
form.addEventListener('submit',event=>event.preventDefault());
form.addEventListener('input',applyFilters);
form.addEventListener('change',applyFilters);
form.addEventListener('reset',()=>{requestAnimationFrame(applyFilters)});
tools.hidden=false;

function revealHashTarget(hash=location.hash) {
  let id;
  try{id=decodeURIComponent(hash.slice(1));}catch{return;}
  const target=document.getElementById(id);
  if(!target)return;
  const card=target.closest('[data-record]');
  const group=target.closest('[data-thread-group]');
  if((card && card.hidden) || (group && group.hidden)){
    form.reset();applyFilters();
  }
  const mobile=target.closest('.mobile-toc');
  if(mobile)mobile.open=true;
  requestAnimationFrame(()=>target.scrollIntoView({behavior:'instant',block:'start'}));
}
window.addEventListener('hashchange',()=>revealHashTarget());
// Clicking the current hash does not emit hashchange; reveal filtered targets too.
document.addEventListener('click',event=>{
  const anchor=event.target.closest('a[href^="#"]');
  if(anchor)revealHashTarget(anchor.hash);
});
if(location.hash)revealHashTarget();

for(const button of document.querySelectorAll('[data-copy]')){
 button.hidden=false;
 button.addEventListener('click',async()=>{
   const url=new URL(location.href);url.hash=button.dataset.copy;
   try{
     if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
     await navigator.clipboard.writeText(url.href);
     button.textContent='已複製';status.textContent='已複製此則紀錄的固定連結。';
     setTimeout(()=>button.textContent='複製連結',1800);
   }catch{
     location.hash=button.dataset.copy;
     status.textContent='目前無法自動複製；已開啟固定連結，可從網址列複製。';
     button.textContent='請複製網址';
   }
 });
}
document.querySelectorAll('.mobile-toc nav a').forEach(a=>a.addEventListener('click',()=>{a.closest('details').open=false}));

if('IntersectionObserver' in window){
 const navLinks=[...document.querySelectorAll('.toc nav a')];
 const chapters=[...document.querySelectorAll('.chapter')];
 const seen=new Set();
 const observer=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting)seen.add(e.target.id);else seen.delete(e.target.id)});
  const selected=chapters.find(e=>seen.has(e.id));
  if(!selected)return;
  navLinks.forEach(a=>{if(a.hash==='#'+selected.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')});
 },{rootMargin:'-5% 0px -65% 0px',threshold:0});
 chapters.forEach(el=>observer.observe(el));
}
const progress=document.querySelector('.reading-progress');
let scheduled=false;
function updateProgress(){
 const length=document.documentElement.scrollHeight-window.innerHeight;
 progress.style.transform=`scaleX(${length>0?Math.min(1,Math.max(0,window.scrollY/length)):0})`;
 scheduled=false;
}
window.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(updateProgress)}},{passive:true});
window.addEventListener('resize',updateProgress);
updateProgress();
