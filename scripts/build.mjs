import {readFileSync, mkdirSync, writeFileSync, cpSync, rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const data = JSON.parse(readFileSync(path.join(root, 'data/chronicle.json'), 'utf8'));
const {records} = data;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link = (url, label, cls='') => `<a href="${esc(url)}"${cls ? ` class="${cls}"` : ''}${url.startsWith('https:') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
const local = (id,label) => link(`#${id}`,esc(label));
const stamp = iso => new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(new Date(iso));
const when = iso => `<time datetime="${esc(iso)}">${stamp(iso)}</time>`;
const clock = iso => `<span class="utc-pair">臺灣 ${when(iso)}<span class="utc">UTC ${esc(new Date(iso).toISOString().replace('T',' ').replace('.000Z','').replace(/\.\d+Z$/,''))}</span></span>`;
const paras = arr => arr.map(p=>`<p>${esc(p)}</p>`).join('');
const kinds={opening:'主文',comment:'留言',review:'機器人審查總評',inline:'行內討論'};
const navItems=[['overview','事件導讀'],['timeline','完整時間線'],['archive','逐則留言'],['questions','爭點對照'],['sources','資料與方法']];
const navigation = () => navItems.map(([id,t],i)=>`<a href="#${id}"><span>0${i+1}</span>${t}</a>`).join('');

function card(r,index) {
 return `<article class="record" id="${r.id}" data-record data-author="${esc(r.author)}" data-thread="${r.thread}">
 <div class="record-top"><span class="record-index">${String(index+1).padStart(2,'0')}</span><div class="record-author"><strong>${esc(r.author)}</strong><span>${esc(r.role)} · ${kinds[r.kind]}</span></div><a class="permalink" href="#${r.id}" aria-label="${esc(r.title)}的固定連結">#</a><button type="button" class="copy-link" data-copy="${r.id}" hidden aria-label="複製${esc(r.title)}的連結">複製連結</button></div>
 <div class="record-content"><h4>${esc(r.title)}</h4><p class="record-lead">${esc(r.lead)}</p><div class="record-time">${clock(r.createdAt)}${r.editedAt ? `<span class="edited">最後編輯：${clock(r.editedAt)} · 以下為截點時的版本</span>` : ''}</div>
 ${r.context ? `<p class="context"><span>回應脈絡</span>${esc(r.context)}</p>` : ''}
 <div class="record-prose">${paras(r.paragraphs)}</div>
 ${r.notes.length ? `<aside class="verification"><span class="note-label">查核註記</span>${paras(r.notes)}</aside>` : ''}
 <div class="record-bottom">${link(r.url,'查看原始'+(r.kind==='opening'?'主文':r.kind==='review'?'審查':'留言')+' <span aria-hidden="true">↗</span>','source-link')}${r.related.length ? `<span class="related">延伸閱讀 ${r.related.map(id=>{const v=records.find(x=>x.id===id);return local(id,v.title)}).join(' / ')}</span>`:''}</div></div></article>`;
}

let timeline = [
 ...records.map(r=>({id:r.id,thread:r.thread,createdAt:r.createdAt,author:r.author,title:r.title,summary:r.lead+(r.editedAt?'（此留言後曾編輯；詳述顯示最新可讀版本。）':''),url:'#'+r.id,type:kinds[r.kind]})),
 ...data.events.map(e=>({...e,type:'狀態事件'})),
 ...data.extraEvents.map(e=>({...e,type:'提交紀錄'})),
 ...records.filter(r=>r.editedAt).map(r=>({id:'edit-'+r.id,thread:r.thread,createdAt:r.editedAt,author:r.author,title:r.author+' 編輯先前留言',summary:'API 記錄的最後編輯時間；沒有完整歷次修訂紀錄，不推定具體改動時間或文字。',url:'#'+r.id,type:'最後編輯'}))
].sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt) || a.id.localeCompare(b.id));
const timelineHTML = timeline.map((e,i)=>{
 const d=new Date(new Date(e.createdAt).getTime()+8*3600000).toISOString();
 const day=d.slice(5,10).replace('-','.');const prev=i?new Date(new Date(timeline[i-1].createdAt).getTime()+8*3600000).toISOString().slice(5,10).replace('-','.') : '';
 return `${day!==prev?`<li class="timeline-day"><h3><span>2026</span>${day}</h3></li>`:''}<li class="timeline-event" data-timeline-time="${e.createdAt}"><div class="timeline-clock">${d.slice(11,19)}<span>臺灣時間</span></div><div class="timeline-body"><div class="timeline-meta"><span class="thread-tag">#${e.thread}</span><span>${esc(e.author)} · ${e.type}</span></div><h4>${link(e.url,esc(e.title))}</h4><p>${esc(e.summary)}</p><details class="utc-details"><summary>UTC 對照與來源</summary>${clock(e.createdAt)}${link(e.url,'前往紀錄 ↗')}</details></div></li>`;
}).join('');

const threads=[
 {id:'97',label:'第一份提案',title:'需求、拒絕與第一次申覆',subtitle:'從新增語系的規格，走向 AI 工具、貢獻方式與社群規範的討論。',url:'https://github.com/toml-lang/toml.io/issues/97',state:'已關閉 · 不規劃處理'},
 {id:'98',label:'翻譯 PR',title:'提交內容與技術審查',subtitle:'八個異動檔案，一項具體的無障礙意見，以及未納入原 PR 的修正。',url:'https://github.com/toml-lang/toml.io/pull/98',state:'已關閉 · 未合併'},
 {id:'99',label:'第二份提案',title:'再次詢問，衝突轉向信任',subtitle:'較短的提案、Facebook 貼文與關閉後的立場說明。',url:'https://github.com/toml-lang/toml.io/issues/99',state:'已關閉 · 已鎖定'}
];
let recordIndex=0;
const archive = threads.map(t=>`<section class="thread-group" data-thread-group="${t.id}" aria-labelledby="thread-${t.id}"><header class="thread-heading"><div class="thread-number">#${t.id}</div><div><span class="eyebrow">${t.label}</span><h3 id="thread-${t.id}">${t.title}</h3><p>${t.subtitle}</p><span class="state-label">${t.state}</span> ${link(t.url,'GitHub 討論串 ↗','thread-source')}</div></header>${records.filter(r=>r.thread===t.id).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt)).map(r=>card(r,recordIndex++)).join('')}</section>`).join('');

const topics=[
 ['在地化需求','繁中是否只是字形轉換？','提案者與 ddman 強調臺灣用語與文化脈絡；arp242 後來明確表示不反對新增繁中。語系需求與本次貢獻方式，應分別閱讀。',['proposal-97','ddman-localization','maintainer-position']],
 ['工具與責任','AI 輔助到哪一步？誰負責？','作者主張工具不決定品質、提交者應負責；維護者期待經仔細驗證的人類翻譯。自述人工通讀、AI 審閱與具名人工校對並非同一種證據。',['author-pushback','author-tools','daniel-review']],
 ['規則與慣例','沒有明文規則，是否代表歡迎？','作者要求提供禁止 AI 的書面依據；brlin-tw 認為還應觀察專案既有慣例。此處是對貢獻期待的分歧，不等於已有一份團隊一致通過的完整 AI 政策。',['author-pushback','brlin-deescalation','maintainer-position']],
 ['審查負擔','如何交付容易評估的貢獻？','PR 除了譯文也修改共用模板，確有技術審查面向。作者願意縮小範圍；brlin-tw 則批評長篇說明增加負擔，同時要求維護者提供可操作回饋。',['proposal-98','review-language','brlin-deescalation']],
 ['公開擴散','社群曝光是討論，還是施壓？','維護者指控作者煽動支持者；brlin-tw 批評處理方式；pcchou 認為曝光也可能有益。已讀公開貼文沒有明文號召湧入，仍不能推及所有外部互動。',['facebook-confrontation','maintainer-position','brlin-deescalation','pcchou-publicity']],
 ['溝通與信任','尖銳回覆留下了什麼？','參與者對「提示詞」「機械翻譯」與後續貶抑措辭提出異議。可確認的是措辭與狀態變更；關於個人動機、歧視或誠信的指控，仍須與已證實的事實區分。',['first-rejection','shiki-localization','maintainer-position']]
];
const topicHTML=topics.map(([label,title,body,ids],i)=>`<article class="topic"><div class="topic-num">0${i+1}<span>${label}</span></div><div><h3>${title}</h3><p>${body}</p><div class="topic-links">${ids.map(id=>local(id,records.find(r=>r.id===id).title)).join('')}</div></div></article>`).join('');

const followupHTML = data.followupPost ? `<aside class="followup-story" id="${esc(data.followupPost.id)}"><span class="note-label">後續回應 · Facebook 公開貼文</span><h3>${esc(data.followupPost.title)}</h3>${paras(data.followupPost.paragraphs)}<p class="followup-method">${esc(data.followupPost.note)}</p>${link(data.followupPost.url,'閱讀原始貼文 ↗','source-link')}</aside>` : '';

const html=`<!doctype html>
<html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(data.title)}</title><meta name="description" content="${esc(data.description)}"><link rel="canonical" href="${data.siteUrl}"><link rel="icon" href="assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="assets/style.css"><script src="assets/app.js" defer></script>
<meta property="og:type" content="article"><meta property="og:locale" content="zh_TW"><meta property="og:site_name" content="開源現場 · TOML 事件全紀錄"><meta property="og:title" content="${esc(data.title)}"><meta property="og:description" content="${esc(data.description)}"><meta property="og:url" content="${data.siteUrl}"><meta property="og:image" content="${data.siteUrl}assets/toml-chronicle-cover-v1.png"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="TOML 繁中翻譯爭議：#97、#98、#99 事件全紀錄"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(data.title)}"><meta name="twitter:description" content="${esc(data.description)}"><meta name="twitter:image" content="${data.siteUrl}assets/toml-chronicle-cover-v1.png"><meta name="twitter:image:alt" content="TOML 繁中翻譯爭議事件紀實專題">
</head><body><a class="skip-link" href="#main">跳至主要內容</a><div class="reading-progress" aria-hidden="true"></div>
<header class="masthead"><a href="#top" class="brand"><span class="brand-mark" aria-hidden="true">誌</span><span>開源現場<small>THE OPEN SOURCE RECORD</small></span></a><div class="masthead-right"><span>獨立紀實專題</span><a href="#sources">資料截至 2026.10.27 <span class="live-dot" aria-hidden="true"></span></a></div></header>
<main id="main"><section class="hero" id="top"><div class="hero-copy"><div class="eyebrow hero-eyebrow"><span class="red-line"></span>開源協作 × 在地化 × 人工智慧</div><h1>一份繁中翻譯，<br>如何成為<br><span>AI 貢獻爭議。</span></h1><p class="hero-deck">TOML 事件全紀錄</p><p class="hero-intro">從一個新增 <code>zh-TW</code> 的提案開始，<br class="desktop-break">爭論走向工具、品質、信任，以及開源協作的邊界。</p><div class="hero-links"><a class="primary-link" href="#overview">從事件開始讀 <span aria-hidden="true">↘</span></a><a class="quiet-link" href="#archive">查閱逐則留言 ↗</a></div></div>
<aside class="dossier" aria-label="三份核心紀錄"><div class="dossier-top"><span>THE CASE FILE</span><span>001 / TOML</span></div><div class="dossier-glyph" aria-hidden="true"><span>zh</span><span class="glyph-slash">/</span><span>TW</span><i></i></div><p class="dossier-caption">一種語言需求。<br>三份公開紀錄。</p><div class="case-rows">${threads.map(t=>`<a href="#thread-${t.id}" class="case-row"><strong>#${t.id}</strong><span>${t.label}<small>${t.state}</small></span><span aria-hidden="true">↗</span></a>`).join('')}</div><div class="dossier-footer"><span>2026.10.23 — 10.27</span><span>PUBLIC RECORD</span></div></aside></section>
<div class="edition-strip"><span><b>03</b> 核心討論串</span><span><b>16</b> 篇有文字紀錄</span><span><b>10.23</b> 提案與 PR 建立</span><span><b>10.25</b> 第二份提案關閉、鎖定</span></div>
<div class="article-shell"><aside class="toc"><span class="eyebrow">本篇導覽</span><nav aria-label="專題章節">${navigation()}</nav><div class="toc-note">先理解脈絡，<br>再回到每一則發言。<a href="#sources">整理方法與限制 ↗</a></div></aside><div class="article-column">
<details class="mobile-toc"><summary>閱讀章節 <span aria-hidden="true">＋</span></summary><nav aria-label="手機專題章節">${navigation()}</nav></details>
<section class="chapter" id="overview"><header class="chapter-header"><span class="section-no">01 / CONTEXT</span><h2>爭議之前，<br>先看見那份貢獻。</h2><p class="chapter-deck">這不是只有一則回覆的故事。需求、提交內容與後續公開討論，構成了不同層次的問題。</p></header>
<div class="prose"><p>TOML 是用於設定檔的文字格式；toml.io 提供規格與不同語言版本。2026 年 10 月 23 日，doggy8088（Will 保哥）為網站提出臺灣繁體中文語系，並送出首頁、兩版規格與介面調整的 PR。${link('https://toml.io/en/','TOML 官網 ↗')} ${local('proposal-97','查看提案')}</p>
<p>專案成員 arp242 將第一份 issue 判斷為 LLM 提示詞，要求不要用 agent 提交；issue 與 PR 隨後關閉。作者承認 AI 協助，主張自己審閱並負責，希望按成果品質評估。兩天後再次提出的 issue，則在維護者引用 Facebook 貼文後遭關閉及鎖定。${local('first-rejection','第一則拒絕')} · ${local('facebook-confrontation','再次關閉的脈絡')}</p>
<p>後續留言並未形成單一陣營：有人強調人工審校與文化差異，有人批評提交及公開擴散方式，也有人同時要求維護者改善回饋。這份專題逐則轉述各方論點，並把當事人的說法與能由紀錄核實的事實分開。</p></div>
<aside class="current-status"><span class="note-label">截至資料截點</span><h3>三份紀錄均已關閉，翻譯 PR 尚未合併。</h3><p>#97 與 #99 的關閉理由為不規劃處理；#99 另限協作者發言。本專題沒有完成兩版譯文的全面語意審校，也不以是否使用 AI 推定譯文合格或不合格。</p><div>${threads.map(t=>link(t.url,`#${t.id} 原始紀錄 ↗`)).join('')}</div></aside>
<h3 class="subheading">需要分開理解的三個層次</h3><div class="three-layers"><div><span>需求</span><h4>繁中在地化</h4><p>字形、臺灣技術術語與閱讀習慣。新增語系的必要性，由哪些讀者需求支持？</p></div><div><span>成果</span><h4>譯文與程式變更</h4><p>文字是否準確？共用模板是否正確？如何提供可查核的審校證據？</p></div><div><span>協作</span><h4>規則、負擔與信任</h4><p>專案接受什麼提交方式？拒絕如何說明？公開討論如何影響彼此信任？</p></div></div>
<h3 class="subheading">在這份紀錄中發言的人</h3><div class="people"><div><b>doggy8088</b><p>提案與 PR 作者；公開表示使用 AI 協助並願意負責。</p></div><div><b>arp242</b><p>GitHub 顯示為專案成員；執行關閉並說明拒絕立場。</p></div><div><b>ShikiSuen · d4n1elchen · ddman</b><p>分別提出在地化、人工審校及對拒絕方式的意見。</p></div><div><b>brlin-tw · pcchou</b><p>自述有在地化或社群經驗；對處理及公開擴散方式提出不同評價。</p></div><div><b>Copilot</b><p>自動審查工具；意見聚焦介面語言標記。</p></div></div>
${followupHTML}</section>
<section class="chapter" id="timeline"><header class="chapter-header"><span class="section-no">02 / CHRONOLOGY</span><h2>把三個討論串，<br>放回同一條時間線。</h2><p class="chapter-deck">時間採臺灣時區（UTC+8），可展開 UTC 對照。點選事件標題，跳到逐則詳述或原始紀錄。</p></header><div class="timeline-guide"><span><i></i>發言與主文</span><span>＋ 狀態變更、提交與最後編輯</span></div><ol class="timeline-list">${timelineHTML}</ol></section>
<section class="chapter" id="archive"><header class="chapter-header"><span class="section-no">03 / THE RECORD</span><h2>每一則發言，<br>都放回它的脈絡。</h2><p class="chapter-deck">依討論串分章，保留每則發言的差異。下方為繁中轉述；原文、編輯時間與查核註記均可對照。</p></header>
<div class="archive-tools" hidden><form class="filter-form" role="search" aria-label="搜尋逐則紀錄"><label class="search-label" for="search"><span>搜尋主題、作者或內容</span><div class="search-wrap"><span aria-hidden="true">⌕</span><input type="search" id="search" placeholder="例如：人工審校、Facebook、lang" autocomplete="off"></div></label><div class="filter-row"><div class="filter-field"><label for="author">作者</label><select id="author"><option value="">所有作者</option>${[...new Set(records.map(r=>r.author))].sort().map(a=>`<option>${esc(a)}</option>`).join('')}</select></div><div class="filter-field"><label for="thread">討論串</label><select id="thread"><option value="">全部討論串</option><option value="97">#97 第一份提案</option><option value="98">#98 翻譯 PR</option><option value="99">#99 第二份提案</option></select></div><button type="reset" class="reset-button">清除篩選</button></div></form><div class="search-status"><p id="result-count" role="status" aria-live="polite">顯示全部 16 篇紀錄</p><span>3 篇主文＋10 則留言＋2 則行內討論＋1 份總評</span></div></div><noscript><p class="noscript-note">JavaScript 已停用。下方仍提供全部紀錄、章節導覽與來源；搜尋與複製功能需 JavaScript。</p></noscript>
<p class="empty-state" hidden>沒有符合的紀錄。請換一個關鍵字，或使用「清除篩選」查看全部。</p>${archive}
<aside class="historical" id="${data.historical.id}"><span class="note-label">歷史補充 · 不計入現存留言</span><h3>一則目前清單中已不可見的回應</h3><p class="history-meta">ShikiSuen · 快照標示 2026 年 10 月 25 日，精確時間未知</p>${paras(data.historical.paragraphs)}${link(data.historical.url,'原討論串 ↗')} · ${local('method-history','快照差異如何處理')}</aside></section>
<section class="chapter" id="questions"><header class="chapter-header"><span class="section-no">04 / POINTS OF DISAGREEMENT</span><h2>他們爭論的，<br>其實有好幾件事。</h2><p class="chapter-deck">以下依論點整理，不替任何一方補上沒有說過的立場，也不將個別留言等同專案全體共識。</p></header>${topicHTML}
<aside class="reading-note"><h3>公開紀錄仍回答不了的問題</h3><p>維護者究竟讀過多少譯文？作者的人工審校深度如何？社群擴散是否涉及其他動員？缺乏完整證據時，這些問題應維持開放，不能由語氣、工具或陣營直接推斷。</p></aside></section>
<section class="chapter" id="sources"><header class="chapter-header"><span class="section-no">05 / SOURCES & METHOD</span><h2>可查核的地方，<br>以及紀錄的邊界。</h2><p class="chapter-deck">這是一份有截點的獨立整理，不是 TOML 官方聲明，也不是對兩版譯文的品質認證。</p></header>
<div class="capture-box"><span>GitHub 資料擷取完成於</span><strong>${stamp(data.capturedAt)} <small>臺灣時間</small></strong><span>UTC ${new Date(data.capturedAt).toISOString()}</span><p>外部資料查閱於 ${stamp(data.externalCheckedAt)} 完成。網站不即時同步；原始來源可能繼續編輯、撤除或新增內容。</p></div>
<h3 class="subheading">核心來源與完整性</h3><div class="table-scroll"><table><caption>三份核心討論串的資料涵蓋</caption><thead><tr><th>來源</th><th>本頁涵蓋</th><th>截點狀態</th></tr></thead><tbody><tr><td>${link(threads[0].url,'Issue #97 ↗')}</td><td>主文、7 則留言、關閉事件</td><td>關閉</td></tr><tr><td>${link(threads[1].url,'PR #98 ↗')}</td><td>主文、1 份有文字總評、2 則行內留言、1 個空白 review、提交與審查事件</td><td>關閉、未合併</td></tr><tr><td>${link(threads[2].url,'Issue #99 ↗')}</td><td>主文、3 則留言、關閉與鎖定事件</td><td>關閉、鎖定</td></tr></tbody></table></div><div class="prose"><p>以 GitHub API 分頁取得一般留言、review、行內留言、timeline、提交與檔案差異，依原始 ID 去重。空白 review 物件已登錄，並連到同時提交的作者回覆；Copilot 的總評與行內意見分開記錄，但不視為兩次獨立審查。訂閱、取消訂閱與單純提及通知不納入敘事時間線。</p><p>公開的 ${link('data/coverage.json','覆蓋清單 JSON')} 記錄來源 ID、網址、對應本頁位置及內容雜湊；${link('data/chronicle.json','專題內容 JSON')} 提供整理後的繁中資料。來源全文暫存不隨網站發布。更新時須重新擷取並人工修訂敘述；自動完整性檢查不能代替語意查核。</p></div>
<h3 class="subheading">直接相關的外部脈絡</h3>
<article class="source-note"><span class="source-number">A</span><div><h4>${link('https://www.facebook.com/1576676851153065/posts/1577393651081385','Will 保哥的技術交流中心公開貼文 ↗')}</h4><p>已透過瀏覽器讀取公開貼文正文。作者稱前一份 PR 因 AI 被拒，表示再次使用 AI 調整語氣，已有自行審閱，並反問人工翻譯的必要性。這是 #99 中維護者直接連結的貼文。</p><p>已讀正文沒有明文號召讀者湧入 GitHub。未取得可獨立核對的精確發布時間，故不為此貼文安排按秒排序的時間線位置；不採相對日期或動態按讚數推定影響。Facebook 留言未作全量擷取，也不推論所有外部互動。</p></div></article>
<article class="source-note"><span class="source-number">B</span><div><h4>${link('https://hackmd.io/@brlin/BJij2njhfe','brlin-tw 的 HackMD 草稿 ↗')}</h4><p>一般網頁擷取受限，但公開 Markdown 下載端點可讀。草稿的主要論點與 GitHub 發言相對照，涉及提交方式、專案慣例、公開擴散與可操作回饋。GitHub 留言另揭露使用 LLM 校正文句。</p><p>可讀取現存草稿，不代表已取得每一版修訂歷史或驗證實際寫作流程；流程揭露依作者說法記錄。</p></div></article>
<article class="source-note"><span class="source-number">C</span><div><h4>${link('https://lkml.org/lkml/2026/10/13/3242','Linux 核心郵件：remove Assisted-by references ↗')}</h4><p>已透過瀏覽器核對 Linus Torvalds 在 2026 年 10 月 13 日的原始郵件。他以編譯器、編輯器類比反對對工具作一概禁止，並強調期待貢獻者盡力且理解自己在做什麼。doggy8088 在 #97 第二次申覆時引用這封信。</p><p>它是另一個專案的討論，只能說明引用的論證背景，不能視為 TOML 的政策或 Linux 對這份翻譯的認可。</p></div></article>
<article class="source-note"><span class="source-number">D</span><div><h4>既有翻譯貢獻與 README</h4><p>brlin-tw 引用 ${link('https://github.com/toml-lang/toml.io/pull/86','俄文 #86')}、${link('https://github.com/toml-lang/toml.io/pull/96','法文 #96')}、${link('https://github.com/toml-lang/toml.io/pull/65','葡文 #65')}。截點時法文與葡文已合併，俄文仍開啟、未合併。法文主文很短；俄文則有雙語說明與範例鍵名的討論，不能把三份一律說成沒有詳細說明。</p><p>核對 ${link('https://github.com/toml-lang/toml.io/blob/b950d4929980ee66f2e77bfe421e725ddffbeb69/README.md','PR 基底版本的 README')}，可見複製英文語系、設定語言名稱及建立版本的貢獻步驟。該文件未提 AI；本頁不據此宣稱其他文件、管道或歷史版本從未有相關規則。</p></div></article>
<article class="source-note"><span class="source-number">E</span><div><h4>${link('https://github.com/toml-lang/toml.io/commit/83dd824cc5581e89ef853ca07221ee5b6ca4219d','83dd824 修正提交 ↗')}</h4><p>提交確實存在，其父提交為原 PR 的 b9bd601。截點時 #98 提交清單與 head 均仍是原始版本；「另有修正」與「PR 已包含修正」是兩件事。</p></div></article>
${data.followupPost ? `<article class="source-note"><span class="source-number">F</span><div><h4>${link(data.followupPost.url,'作者對 AI 標籤與開源貢獻心情的後續回應 ↗')}</h4><p>公開正文已透過瀏覽器核對，重點另列於 ${local(data.followupPost.id,'事件導讀後的獨立段落')}。其中的寫作年資、專案數量與感受均按作者自述呈現，沒有以這篇文章推定翻譯品質、動員情況或 GitHub 決策。</p><p>查閱時間：${stamp(data.followupPost.checkedAt)}（臺灣時間）。未取得精確發布時間，不以相對時間推算時間線；貼文留言未作全量擷取。</p></div></article>` : ''}
<h3 class="subheading" id="method-history">編輯、消失留言與快照差異</h3><div class="prose"><p>GitHub API 提供現存留言與最後編輯時間，不能重建所有過去版本。ShikiSuen 的一則現存留言已於 10 月 27 日編輯；較早搜尋快照還顯示他對留言消失的觀察，現存版本則改為說明自行移除另一回應。</p><p>較早快照另見他於 10 月 25 日向其他維護者呼籲討論策略的留言，目前不在 API 清單。該段只列為 ${local('historical-shiki','有標示的歷史補充')}，未補造 ID 或精確時間，也不認定誰移除、何時移除或原因。搜尋快照是本次研究時所見的較早頁面版本，沒有作為可重放的公開歷史封存；讀者目前無法由即時頁面獨立重現該版本。</p></div>
<h3 class="subheading">整理方式與更正</h3><div class="prose"><p>網站由 jakeuj 委託 Codex 協助調查、轉述、製作與部署。本文不是逐字翻譯；工具協助也不代表所有內容已經具名人工審校。人名與帳號僅用於辨認公開發言，不以臆測補足動機。若來源不足，明確保留未知。</p><p>發言者的指控、價值判斷及自述經歷均標明歸屬；不以 AI 使用方式、瀏覽器翻譯功能、留言反應數或一則技術審查替代翻譯品質判定。讀者可對照來源，並透過 ${link(data.repositoryUrl+'/issues','本站 repository 的 issue')} 提出具體更正與來源。請勿因此前往原討論串施壓或洗版。</p></div>
</section><div class="endnote"><span class="endnote-symbol">誌</span><p>留下脈絡，讓判斷有據可循。</p><a href="#top">回到頁首 ↑</a></div></div></div></main>
<footer class="site-footer"><div><strong>開源現場</strong><span>TOML 事件全紀錄 · 獨立整理</span></div><div>${link(data.repositoryUrl,'網站原始碼 ↗')}<span>來源內容權利歸各原作者；本頁非 TOML 官方網站。</span></div></footer><p id="copy-status" class="sr-only" role="status" aria-live="polite"></p></body></html>`;
const out=path.join(root,'dist');rmSync(out,{recursive:true,force:true});mkdirSync(out,{recursive:true});cpSync(path.join(root,'assets'),path.join(out,'assets'),{recursive:true});cpSync(path.join(root,'data'),path.join(out,'data'),{recursive:true});
writeFileSync(path.join(out,'index.html'),html);writeFileSync(path.join(out,'.nojekyll'),'');
writeFileSync(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${data.siteUrl}</loc><lastmod>${data.externalCheckedAt.slice(0,10)}</lastmod></url></urlset>\n`);
console.log(`Built ${records.length} text records, ${timeline.length} chronological items → dist/`);
