import {esc} from './html.mjs';

export function createRecordRenderer(content, tools) {
  const {data, byId, ui, language} = content;
  const {link, local, paras, clock, stamp, rich, text} = tools;
  const l = ui.labels;
  let index = 0;
  const notes = record => record.notes.length ? `<aside class="verification">
<span class="note-label">${esc(l.notes)}</span>${paras(record.notes)}</aside>` : '';
  function header(record, kind) {
    return `<div class="record-top">
<span class="record-index">${String(++index).padStart(2, '0')}</span>
<div class="record-author">
<strong>${esc(record.author)}</strong>
<span>${esc(kind)}</span>
</div>
<a class="permalink" href="#${esc(record.id)}" aria-label="${esc(l.permalink + ': ' + record.title)}">#</a>
<button type="button" class="copy-link" data-copy="${esc(record.id)}" hidden aria-label="${esc(l.copy + ': ' + record.title)}">${esc(l.copy)}</button>
</div>`;
  }
  function githubCard(record) {
    const source = record.kind === 'opening' ? l.originalPost : record.kind === 'review' ? l.originalReview : l.originalComment;
    return `<article class="record" id="${record.id}" data-record data-author="${esc(record.author)}" data-thread="${record.thread}">
${header(record, record.role + ' · ' + l[record.kind])}<div class="record-content">
<h4>${esc(record.title)}</h4>
<p class="record-lead">${esc(record.lead)}</p>
<div class="record-time">${clock(record.createdAt)}${record.editedAt ? `<span class="edited">${esc(l.edited)}${clock(record.editedAt)}${esc(l.latest)}</span>` : ''}</div>${record.context ? `<p class="context">
<span>${esc(l.context)}</span>${esc(record.context)}</p>` : ''}<div class="record-prose">${paras(record.paragraphs)}</div>${notes(record)}<div class="record-bottom">${link(record.url, esc(source), 'source-link')}${record.related.length ? `<span class="related">${esc(l.related)} ${record.related.map(id => local(id, byId.get(id).title)).join(' / ')}</span>` : ''}</div>
</div>
</article>`;
  }
  function facebookCard(record) {
    const parent = record.parentId ? byId.get(record.parentId) : null;
    const title = item => item.author + (language === 'en' ? ': ' : '：') + item.title;
    let relation = parent ? esc(l.fbReply) + local(parent.id, title(parent)) : esc(l.fbResponding);
    if (parent && record.parentResolution === 'unique-visible-match') relation += esc(l.fbUnique);
    if (record.parentResolution === 'named-target-only') {
      relation = esc(text(l.fbAmbiguous, {author: record.replyToAuthor})) + local(record.rootId, l.fbRoot);
    }
    if (record.parentResolution === 'root-thread-only') {
      relation = esc(l.fbRootPrefix) + local(record.rootId, title(byId.get(record.rootId))) + esc(text(l.fbRootSuffix, {label: record.replyLabel}));
    }
    const kind = record.parentResolution === 'root-thread-only' ? l.replyByRoot : record.depth === 2 ? l.replyTwice : record.depth === 1 ? l.reply : l.topLevel;
    const role = language === 'en' ? record.role + ' · Facebook · ' + kind : 'Facebook · ' + record.role + ' · ' + kind;
    return `<article class="record facebook-record fb-depth-${record.depth}" id="${record.id}" data-record data-author="${esc(record.author)}" data-thread="${esc(record.thread || 'facebook')}" data-parent-id="${record.parentId || ''}">${header(record, role)}<div class="record-content">
<h4>${esc(record.title)}</h4>
<div class="record-time">${clock(record.createdAt, true)}${record.edited ? `<span class="edited">${esc(l.fbEdited)}</span>` : ''}${record.authorLiked ? `<span class="edited">${esc(l.fbLiked)}</span>` : ''}</div>
<p class="context">
<span>${esc(l.context)}</span>${relation}</p>
<div class="record-prose">${paras(record.paragraphs)}</div>${notes(record)}<div class="record-bottom">${link(record.url, esc(l.fbComment), 'source-link')}${record.evidenceLinks.map(e => link(e.url, esc(e.label) + ' ↗', 'source-link')).join('')}${['fb-1423904753272004', 'fb-1111411041689827'].includes(record.id) ? local('review-language', l.languageIssue) : ''}</div>
</div>
</article>`;
  }
  function githubArchive() {
    return ui.threads.map(thread => `<section class="thread-group" data-thread-group="${thread.id}" aria-labelledby="thread-${thread.id}">
<header class="thread-heading">
<div class="thread-number">#${thread.id}</div>
<div>
<span class="eyebrow">${esc(thread.label)}</span>
<h3 id="thread-${thread.id}">${esc(thread.title)}</h3>
<p>${esc(thread.subtitle)}</p>
<span class="state-label">${esc(thread.state)}</span> ${link(thread.url, esc(l.githubThread), 'thread-source')}</div>
</header>${data.records.filter(record => record.thread === thread.id).sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)).map(githubCard).join('')}</section>`).join('');
  }
  function facebookArchive(set) {
    const d = set.data;
    const original = set.thread === 'facebook';
    const originalTree = record => facebookCard(record) + d.items.filter(child => child.parentId === record.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map(originalTree).join('');
    const roots = d.items.filter(record => original ? !record.parentId : !record.isReply).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const comments = roots.map(record => `<div class="fb-thread">${original ? originalTree(record) : facebookCard(record) + d.items.filter(child => child.isReply && child.rootId === record.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map(facebookCard).join('')}</div>`).join('');
    return `<section class="thread-group facebook-group" id="${set.id}" data-thread-group="${set.thread}" aria-labelledby="${set.heading}">
<header class="thread-heading">
<div class="thread-number">FB</div>
<div>
<span class="eyebrow">${esc(set.label)}</span>
<h3 id="${set.heading}">${esc(set.title)}</h3>
<p>${rich(set.summary, d)}</p>${set.sources.map(a => link(a.href, esc(a.label), 'thread-source')).join(' ')}</div>
</header>${set.focus.length ? `<nav class="archive-jumps" aria-label="${esc(set.label)}">${set.focus.map(a => local(a.id, a.label)).join('')}</nav>` : ''}<aside class="facebook-method">
<span class="note-label">${esc(set.methodLabel)}</span>
<p>${esc(d.methodology)}</p>${d.coverageNote ? `<p>${esc(d.coverageNote)}</p>` : ''}<p>${rich(set.capturedParagraph, {capturedAt: stamp(d.capturedAt)})}</p>
<details>
<summary>${esc(set.detailsLabel)}</summary>${set.detailFields.map(key => `<p>${esc(d[key])}</p>`).join('')}${d.deletionNotices ? `<p>${esc(set.deletionLabel)}</p>
<ul>${d.deletionNotices.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}</details>
</aside>${comments}</section>`;
  }
  function historical() {
    const h = ui.historical;
    return `<aside class="historical" id="${data.historical.id}">
<span class="note-label">${esc(h.label)}</span>
<h3>${esc(h.title)}</h3>
<p class="history-meta">${esc(h.meta)}</p>${paras(data.historical.paragraphs)}${link(data.historical.url, esc(h.source))} · ${local('method-history', h.method)}</aside>`;
  }
  return {githubArchive, facebookArchive, historical};
}
