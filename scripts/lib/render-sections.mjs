import {createEditorialRenderer} from './render-editorial.mjs';
import {createRecordRenderer} from './render-records.mjs';
import {renderTimeline} from './render-timeline.mjs';
import {renderContext, renderFacebookSources, renderContextSources} from './render-context.mjs';
import {renderBrief} from '../render-brief.mjs';

export function renderSections(content, tools) {
  const editorial = createEditorialRenderer(tools);
  const records = createRecordRenderer(content, tools);
  const headers = content.editorial.chapters;
  const github = records.githubArchive();
  const facebook = content.facebookSets.map(records.facebookArchive);
  const jumps = `<nav class="archive-jumps" aria-label="${tools.esc(content.ui.labels.sourcesNav)}">${tools.local('thread-97', 'GitHub · ' + content.data.records.length)}${content.facebookSets.map(s => tools.local(s.id, s.label + ' · ' + s.data.loadedCount)).join('')}</nav>`;
  const archiveHeader = editorial.renderHeader(headers.archive);
  const historical = records.historical();
  return {
    brief: renderBrief(content.brief, tools),
    overview: editorial.renderOverview(content.editorial.overview, headers.overview, content.data.followupPost),
    timeline: `<section class="chapter" id="timeline">${editorial.renderHeader(headers.timeline)}${renderTimeline(content, tools)}</section>`,
    questions: editorial.renderQuestions(content.editorial.questions, headers.questions, content.byId, renderContext(content, tools)),
    sources: editorial.renderSources(content.editorial.sources, headers.sources, {capturedAt: content.data.capturedAt, stamp: tools.stamp, facebookSourceHTML: renderFacebookSources(content, tools), contextSourcesHTML: renderContextSources(content, tools)}),
    github: github + historical, facebook, jumps, archiveHeader
  };
}
