import {renderSearchForm} from './render-search.mjs';
import {routeOrder} from './routes.mjs';

export function pageDetails(content) {
  const {editorial: {chapters}, ui: {labels: l}} = content;
  const chapter = id => ({title: chapters[id].title.join(content.language === 'en' ? ' ' : ''), description: chapters[id].deck});
  return {
    home: {title: content.data.title, description: content.data.description},
    timeline: chapter('timeline'), records: {title: l.searchHeading, description: chapters.archive.deck},
    github: {title: 'GitHub · ' + content.ui.threads.map(t => '#' + t.id).join(' / '), description: chapters.archive.deck},
    ...Object.fromEntries(content.facebookSets.map((set, index) => [['original', 'published', 'followup'][index], {title: set.label, description: set.title}])),
    analysis: chapter('questions'), sources: chapter('sources')
  };
}
export function pageNavigation(content, tools, router, current) {
  return content.ui.nav.map(({id, label}, index) => tools.link('#' + id, `<span>${String(index).padStart(2, '0')}</span>${tools.esc(label)}`).replace('<a ', (router.owners.get(id).page === current || id === 'archive' && ['github', 'original', 'published', 'followup'].includes(current)) ? '<a aria-current="page" ' : '<a ')).join('');
}
export function chapterLinks(content, tools, router, current, details) {
  const {esc, link} = tools;
  const entries = routeOrder.filter(page => page !== current);
  return `<nav class="chapter-links" aria-label="${esc(content.ui.labels.chaptersHeading)}">
<h2>${esc(content.ui.labels.chaptersHeading)}</h2>${entries.map(page => link(router.pageHref(current, page), `<strong>${esc(details[page].title)}</strong>
<span>${esc(details[page].description)}</span>`)).join('')}</nav>`;
}
export function pagePager(content, tools, router, current, details) {
  const i = routeOrder.indexOf(current);
  return `<nav class="page-pager" aria-label="${tools.esc(content.ui.labels.chaptersHeading)}">${[[-1, 'previous'], [1, 'next']].map(([offset, label]) => {
    const next = routeOrder[i + offset];
    return next ? tools.link(router.pageHref(current, next), `<span>${tools.esc(content.ui.labels[label])}</span>
<strong>${tools.esc(details[next].title)}</strong>`) : '';
  }).join('')}</nav>`;
}
export function contentDates(content, page) {
  const d = content.data;
  const dates = {
    home: [d.capturedAt, d.externalCheckedAt, d.followupPost.checkedAt, content.editorial.overview.maintainerBackground.checkedOn],
    timeline: [d.capturedAt], records: [d.capturedAt, ...content.facebookSets.map(set => set.data.capturedAt)],
    github: [d.capturedAt], original: [content.original.capturedAt], published: [content.published.capturedAt],
    followup: [content.followup.capturedAt], analysis: [d.capturedAt, content.context.checkedAt, ...content.facebookSets.map(set => set.data.capturedAt)],
    sources: [d.capturedAt, d.externalCheckedAt, d.followupPost.checkedAt, content.context.checkedAt, content.facebookSources.checkedAt, content.editorial.overview.maintainerBackground.checkedOn, ...content.facebookSets.map(set => set.data.capturedAt)]
  };
  return new Date(Math.max(...dates[page].map(Date.parse))).toISOString();
}
export function editorialPages(content, tools, router, sections) {
  const details = pageDetails(content);
  return {
    home: sections.brief + sections.overview + chapterLinks(content, tools, router, 'home', details),
    timeline: sections.timeline, analysis: sections.questions, sources: sections.sources
  };
}
export function recordPages(content, tools, router, sections) {
  const {esc, link} = tools;
  const index = `<section class="chapter" id="archive">${sections.archiveHeader}${sections.jumps}${renderSearchForm(content, tools)}<ol class="record-list" id="record-index">${content.allRecords.map(r => `<li data-result data-id="${r.id}" data-author="${esc(r.author)}" data-thread="${esc(r.thread || 'facebook')}">${link('#' + r.id, `<strong>${esc(r.title)}</strong>
<span>${esc(r.author)} · <time datetime="${r.createdAt}">${tools.stamp(r.createdAt, r.timePrecision === 'minute')}</time>
</span>`)}<p>${esc(r.lead || r.paragraphs[0])}</p>
</li>`).join('')}</ol>
</section>`;
  const records = {};
  for (const [page, body] of [['github', sections.github], ...sections.facebook.map((body, index) => [['original', 'published', 'followup'][index], body])]) {
    records[page] = `<section class="chapter" id="record-index">${sections.archiveHeader}${link(router.pageHref(page, 'records'), esc(content.ui.labels.searchEntry), 'search-entry')}${body}</section>`;
  }
  return {records: index, ...records};
}

export function legacyLinks(content, tools, router) {
  return `<details class="legacy-links">
<summary>${tools.esc(content.ui.labels.legacyHeading)}</summary>
<p>${tools.esc(content.ui.labels.legacyIntro)}</p>
<ol>${Object.entries(router.legacy).map(([id, href]) => `<li id="${tools.esc(id)}">${tools.link(href, tools.esc(router.owners.get(id).label))}</li>`).join('')}</ol>
</details>`;
}
