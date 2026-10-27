export function buildTimeline(content) {
  const {data, ui: {labels: l}} = content;
  return [
    ...data.records.map(r => ({id: r.id, thread: r.thread, createdAt: r.createdAt, author: r.author, title: r.title, summary: r.lead + (r.editedAt ? l.timelineEdited : ''), url: '#' + r.id, type: l[r.kind]})),
    ...data.events.map(event => ({...event, type: l.statusEvent})),
    ...data.extraEvents.map(event => ({...event, type: l.commit})),
    ...data.records.filter(r => r.editedAt).map(r => ({id: 'edit-' + r.id, thread: r.thread, createdAt: r.editedAt, author: r.author, title: r.author + l.editTitle, summary: l.editSummary, url: '#' + r.id, type: l.lastEdit}))
  ].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id));
}

export function renderTimeline(content, tools) {
  const {esc, link, clock} = tools;
  const l = content.ui.labels;
  const timeline = buildTimeline(content);
  let previousDay = '';
  const events = timeline.map(event => {
    const date = new Date(Date.parse(event.createdAt) + 8 * 3600000).toISOString();
    const day = date.slice(0, 10);
    const heading = day !== previousDay ? `<li class="timeline-day">
<h3>
<span>${day.slice(0, 4)}</span>${day.slice(5).replace('-', '.')}</h3>
</li>` : '';
    previousDay = day;
    return `${heading}<li class="timeline-event" data-timeline-time="${event.createdAt}">
<div class="timeline-clock">${date.slice(11, 19)}<span>${esc(l.taiwan)}</span>
</div>
<div class="timeline-body">
<div class="timeline-meta">
<span class="thread-tag">#${event.thread}</span>
<span>${esc(event.author)} · ${esc(event.type)}</span>
</div>
<h4>${link(event.url, esc(event.title))}</h4>
<p>${esc(event.summary)}</p>
<details class="utc-details">
<summary>${esc(l.utcSource)}</summary>${clock(event.createdAt)}${link(event.url, esc(l.openRecord))}</details>
</div>
</li>`;
  }).join('');
  return `<div class="timeline-guide">
<span>
<i>
</i>${esc(l.guidePosts)}</span>
<span>${esc(l.guideEvents)}</span>
</div>
<ol class="timeline-list">${events}</ol>`;
}
