export function renderContext(content, tools) {
  const {context, ui: {labels: l}, prefix} = content;
  const {esc, stamp, local, link} = tools;
  const sources = new Map(context.sources.map(source => [source.id, source]));
  return `<section class="followup-story" id="${context.id}" aria-labelledby="translation-context-title">
<span class="note-label">${esc(l.contextLabel)}</span>
<h3 id="translation-context-title">${esc(context.title)}</h3>
<p class="followup-method">${esc(context.method)} ${esc(l.checked)}${stamp(context.checkedAt)}${esc(l.checkedSuffix)}${context.checkedAt}${content.language === 'en' ? '.' : '。'}</p>
<nav class="archive-jumps" aria-label="${esc(l.contextNav)}">${context.questions.map(q => local(q.id, q.label)).join('')}</nav>${context.questions.map((q, index) => `<article class="topic" id="${q.id}">
<div class="topic-num">0${index + 1}<span>${esc(q.label)}</span>
</div>
<div>
<h3>${esc(q.title)}</h3>${q.findings.map(f => `<p>
<strong>${esc(f.status)}${content.language === 'en' ? ':' : '：'}</strong>${content.language === 'en' ? ' ' : ''}${esc(f.text)}</p>`).join('')}<div class="topic-links">${q.sourceRefs.map(id => {const s = sources.get(id); return link(s.url, esc(s.title) + ' ↗');}).join('')}</div>
</div>
</article>`).join('')}<p class="followup-method">${local('source-translation-context', l.contextSource)} · ${link((content.language === 'en' ? '../' : '') + prefix + 'translation-context.json', esc(l.contextData))}</p>
</section>`;
}

export function renderFacebookSources(content, tools) {
  const {facebookSources, ui: {labels: l}} = content;
  const {esc, stamp, local, link} = tools;
  return `<section id="facebook-original-links" aria-labelledby="facebook-original-links-title">
<h3 class="subheading" id="facebook-original-links-title">${esc(l.fbSourcesHeading)}</h3>
<div class="prose">
<p>${esc(facebookSources.method)} ${content.language === 'en' ? 'Checked: ' : '核對時間：'}${stamp(facebookSources.checkedAt)}${esc(l.checkedSuffix)}${facebookSources.checkedAt}${content.language === 'en' ? '.' : '。'}</p>
</div>${facebookSources.posts.map((p, i) => `<article class="source-note" id="${p.id}">
<span class="source-number">${i + 1}</span>
<div>
<h4>${esc(p.title)}</h4>
<p>${esc(p.summary)}</p>
<div class="topic-links">${link(p.shareUrl, esc(l.fbShare))}${link(p.postUrl, esc(l.fbPermalink))}${p.archiveId ? local(p.archiveId, l.fbRead) : ''}</div>
<p>${esc(p.coverage)}</p>
</div>
</article>`).join('')}</section>`;
}

export function renderContextSources(content, tools) {
  const {stamp, esc, link} = tools;
  return content.context.sources.map(s => `<p>${link(s.url, esc(s.title) + ' ↗')} · ${esc(s.author)}${content.language === 'en' ? '. ' : '。'}${s.createdAt ? content.language === 'en' ? `Published ${stamp(s.createdAt)}, last edited ${stamp(s.editedAt)} (Taiwan, UTC+8); UTC ${s.createdAt} / ${s.editedAt}.` : `發布 ${stamp(s.createdAt)}，最後編輯 ${stamp(s.editedAt)}（臺灣時間）；UTC ${s.createdAt}／${s.editedAt}。` : content.language === 'en' ? `Publication date: ${s.publishedDate}; exact time and timezone unavailable.` : `發布日期 ${s.publishedDate}，未提供可核對的精確時刻或時區。`}${content.language === 'en' ? ' ' : ''}${esc(s.access)}${content.language === 'en' ? '.' : '。'}</p>`).join('');
}
