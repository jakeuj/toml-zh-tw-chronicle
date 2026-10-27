// Loaded before CSS so valid saved preferences apply before the first text layout.
(()=>{
 'use strict';
 const key='toml-chronicle.reading.v1';
 const defaults={font:'sans',size:'20'};
 const fonts=['sans','serif'],sizes=['18','20','22','24'];
 const root=document.documentElement;
 function read(){
  try{
   const saved=JSON.parse(localStorage.getItem(key));
   return {font:fonts.includes(saved?.font)?saved.font:defaults.font,size:sizes.includes(saved?.size)?saved.size:defaults.size};
  }catch{return {...defaults};}
 }
 let preferences=read();
 const apply=()=>{root.dataset.readingFont=preferences.font;root.dataset.readingSize=preferences.size;};
 apply();
 function initialize(){
  const form=document.getElementById('reading-preferences');
  if(!form)return;
  const font=form.querySelector('[name="font"]');
  const choices=[...form.querySelectorAll('[name="size"]')];
  const status=document.getElementById('reading-status');
  const en=root.lang==='en';
  function sync(){font.value=preferences.font;for(const choice of choices)choice.checked=choice.value===preferences.size;}
  function announce(saved){
   const face=preferences.font==='sans'?(en?'sans serif':'清晰黑體'):(en?'serif':'報導明體');
   status.textContent=en?`Applied ${face}, size ${preferences.size}.${saved?' Saved in this browser.':' Available for this visit; this browser could not save it.'}`:`已套用${face}、${preferences.size} 字級。${saved?'已記住此瀏覽器的設定。':'本次仍可使用，這個瀏覽器無法儲存設定。'}`;
  }
  form.addEventListener('submit',event=>event.preventDefault());
  form.addEventListener('change',()=>{
   preferences={font:fonts.includes(font.value)?font.value:defaults.font,size:choices.find(c=>c.checked&&sizes.includes(c.value))?.value||defaults.size};
   apply();sync();let saved=true;
   try{localStorage.setItem(key,JSON.stringify(preferences));}catch{saved=false;}
   announce(saved);
  });
  form.querySelector('[data-reset-reading]').addEventListener('click',()=>{
   preferences={...defaults};apply();sync();let saved=true;
   try{localStorage.removeItem(key);}catch{saved=false;}
   announce(saved);
  });
  // Restore settings after a back/forward-cache visit or a change in another tab.
  const refresh=()=>{preferences=read();apply();sync();};
  window.addEventListener('pageshow',event=>{if(event.persisted)refresh();});
  window.addEventListener('storage',event=>{if(event.key===key||event.key===null)refresh();});
  sync();form.hidden=false;
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
 else initialize();
})();
