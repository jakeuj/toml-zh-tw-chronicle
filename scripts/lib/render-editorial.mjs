import {createHtmlTools} from './html.mjs';

export function createEditorialRenderer(tools = createHtmlTools('zh')) {
const {esc, rich} = tools;
const link = (href, label) => tools.link(href, esc(label));
const renderHeader = h => `<header class="chapter-header">
<span class="section-no">${esc(h.number)}</span>
<h2>${h.title.map(esc).join('<br>')}</h2>${h.deck?`<p class="chapter-deck">${esc(h.deck)}</p>`:''}</header>`;
const renderBackground = background => `<section id="${esc(background.id)}" aria-label="${esc(background.title)}">
<h3 class="subheading">${esc(background.title)}</h3>
<div class="prose">${background.sections.map(section => `<h4>${esc(section.title)}</h4>${section.paragraphs.map(p => `<p>${rich(p)}</p>`).join('')}`).join('')}</div>
<div class="verification"><p>${rich(background.note)}</p></div>
</section>`;
function renderOverview(content,header,followup){
 return `<section class="chapter" id="overview">${renderHeader(header)}<div class="prose">${content.paragraphs.map(p=>`<p>${rich(p)}</p>`).join('')}</div>
<aside class="current-status">
<span class="note-label">${esc(content.status.label)}</span>
<h3>${esc(content.status.title)}</h3>
<p>${rich(content.status.paragraph)}</p>
<div>${content.status.links.map(a=>link(a.href,a.label)).join('')}</div>
</aside>
<h3 class="subheading">${esc(content.layersHeading)}</h3>
<div class="three-layers">${content.layers.map(l=>`<div>
<span>${esc(l.label)}</span>
<h4>${esc(l.title)}</h4>
<p>${esc(l.text)}</p>
</div>`).join('')}</div>
<h3 class="subheading">${esc(content.peopleHeading)}</h3>
<div class="people">${content.people.map(p=>`<div>
<b>${esc(p.name)}</b>
<p>${esc(p.text)}</p>
</div>`).join('')}</div>${renderBackground(content.maintainerBackground)}${followup?`<aside class="followup-story" id="${esc(followup.id)}">
<span class="note-label">${esc(content.followupLabel)}</span>
<h3>${esc(followup.title)}</h3>${followup.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}<p class="followup-method">${esc(followup.note)}</p>${tools.link(followup.url,esc(content.followupSource),'source-link')}</aside>`:''}</section>`;
}
function renderQuestions(content,header,byId,contextHTML){
 return `<section class="chapter" id="questions">${renderHeader(header)}${content.topics.map((t,i)=>`<article class="topic">
<div class="topic-num">0${i+1}<span>${esc(t.label)}</span>
</div>
<div>
<h3>${esc(t.title)}</h3>
<p>${rich(t.paragraph)}</p>
<div class="topic-links">${t.sourceIds.map(id=>link('#'+id,byId.get(id).title)).join('')}</div>
</div>
</article>`).join('')}${contextHTML}<aside class="reading-note">
<h3>${esc(content.openQuestions.title)}</h3>
<p>${rich(content.openQuestions.paragraph)}</p>
</aside>
</section>`;
}
function renderSources(content,header,{capturedAt,stamp,facebookSourceHTML,contextSourcesHTML}){
 const paragraphs = list => list.map(p=>`<p>${rich(p)}</p>`).join('');
 return `<section class="chapter" id="sources">${renderHeader(header)}<div class="capture-box">
<span>${esc(content.captureLabel)}</span>
<strong>${stamp(capturedAt)} <small>${esc(content.captureTimezone)}</small>
</strong>
<span>UTC ${new Date(capturedAt).toISOString()}</span>
<p>${rich(content.captureParagraph)}</p>
</div>
<h3 class="subheading">${esc(content.coverageHeading)}</h3>
<div class="table-scroll">
<table>
<caption>${esc(content.table.caption)}</caption>
<thead>
<tr>${content.table.headings.map(h=>`<th>${esc(h)}</th>`).join('')}</tr>
</thead>
<tbody>${content.table.rows.map(row=>`<tr>${row.map(cell=>`<td>${rich(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
</table>
</div>
<div class="prose">${paragraphs(content.methodParagraphs)}</div>${facebookSourceHTML}<h3 class="subheading">${esc(content.externalHeading)}</h3>${content.notes.map(n=>`<article class="source-note"${n.id?` id="${esc(n.id)}"`:''}>
<span class="source-number">${esc(n.number)}</span>
<div>
<h4>${rich(n.title)}</h4>${n.number==='G'?paragraphs([n.paragraphs[0]])+contextSourcesHTML+paragraphs([n.paragraphs.at(-1)]):paragraphs(n.paragraphs)}</div>
</article>`).join('')}<h3 class="subheading" id="method-history">${esc(content.historyHeading)}</h3>
<div class="prose">${paragraphs(content.historyParagraphs)}</div>
<h3 class="subheading">${esc(content.processHeading)}</h3>
<div class="prose">${paragraphs(content.processParagraphs)}</div>
</section>`;
}

return {renderHeader,renderOverview,renderQuestions,renderSources};
}
