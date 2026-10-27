import {createHtmlTools} from './lib/html.mjs';

export function renderBrief(brief, tools = createHtmlTools('zh')) {
  const {esc, local} = tools;
  const anchor = ({id, label}) => local(id, label);
  return `<section class="chapter quick-digest" id="brief" aria-labelledby="brief-title">
<header class="chapter-header">
<span class="section-no">00 / IN BRIEF</span>
<h2 id="brief-title">${esc(brief.title)}</h2>
</header>
<p class="digest-status">${esc(brief.status)}</p>
<ol class="digest-list">${brief.items.map(item => `<li>
<span class="digest-label">${esc(item.label)}</span>
<div>
<p>${esc(item.text)}</p>
<div class="topic-links">${item.sources.map(anchor).join('')}</div>
</div>
</li>`).join('')}</ol>
<p class="digest-limit">${esc(brief.limit)}</p>
<nav class="archive-jumps" aria-label="${esc(brief.title)}">${brief.links.map(anchor).join('')}</nav>
</section>`;
}
