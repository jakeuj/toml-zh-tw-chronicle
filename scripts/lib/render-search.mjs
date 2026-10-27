export function renderSearchForm(content, tools) {
  const {ui, allRecords} = content;
  const {esc, text} = tools;
  const l = ui.labels;
  const groups = [...ui.threads.map(t => ({id: t.id, label: '#' + t.id + ' ' + t.label})), ...content.facebookSets.map(s => ({id: s.thread, label: s.label}))];
  return `<div class="archive-tools" hidden>
<form class="filter-form" role="search" aria-label="${esc(l.searchLabel)}">
<label class="search-label" for="search">
<span>${esc(l.searchLabel)}</span>
<div class="search-wrap">
<span aria-hidden="true">⌕</span>
<input type="search" id="search" placeholder="${esc(l.searchPlaceholder)}" autocomplete="off">
</div>
</label>
<div class="filter-row">
<div class="filter-field">
<label for="author">${esc(l.author)}</label>
<select id="author">
<option value="">${esc(l.allAuthors)}</option>${[...new Set(allRecords.map(r => r.author))].sort().map(author => `<option>${esc(author)}</option>`).join('')}</select>
</div>
<div class="filter-field">
<label for="thread">${esc(l.thread)}</label>
<select id="thread">
<option value="">${esc(l.allThreads)}</option>${groups.map(g => `<option value="${g.id}">${esc(g.label)}</option>`).join('')}</select>
</div>
<button type="reset" class="reset-button">${esc(l.reset)}</button>
</div>
</form>
<div class="search-status">
<p id="result-count" role="status" aria-live="polite">${esc(text(l.all, {count: allRecords.length}))}</p>
<span>${esc(text(l.recordCounts))}</span>
</div>
</div>
<noscript>
<p class="noscript-note">${esc(l.searchUnavailable)}</p>
</noscript>
<p class="empty-state" hidden>${esc(l.empty)}</p>`;
}
