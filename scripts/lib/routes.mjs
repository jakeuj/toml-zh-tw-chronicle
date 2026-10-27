import path from 'node:path';

export const routes = {
  home: '', timeline: 'timeline/', records: 'records/', github: 'records/github/',
  original: 'records/facebook-original/', published: 'records/facebook-published/',
  followup: 'records/facebook-followup/', analysis: 'analysis/', sources: 'sources/'
};
export const routeOrder = Object.keys(routes);
export const localeRoute = (language, page) => (language === 'en' ? 'en/' : '') + routes[page];

export function createRoutes(content, siteUrl = content.data.siteUrl) {
  const owners = new Map();
  const add = (id, page, label) => {
    if (owners.has(id)) throw new Error(`Duplicate content ID: ${id}`);
    owners.set(id, {page, label: label || id});
  };
  add('brief', 'home', content.brief.title);
  add('brief-title', 'home', content.brief.title);
  add('overview', 'home', content.editorial.chapters.overview.title.join(''));
  add(content.editorial.overview.maintainerBackground.id, 'home', content.editorial.overview.maintainerBackground.title);
  add(content.data.followupPost.id, 'home', content.data.followupPost.title);
  add('timeline', 'timeline', content.editorial.chapters.timeline.title.join(''));
  add('archive', 'records', content.ui.labels.searchHeading);
  for (const id of ['search', 'author', 'thread', 'result-count']) add(id, 'records', content.ui.labels.searchHeading);
  add('questions', 'analysis', content.editorial.chapters.questions.title.join(''));
  add('sources', 'sources', content.editorial.chapters.sources.title.join(''));
  add(content.data.historical.id, 'github', content.ui.historical.title);
  add('method-history', 'sources', content.editorial.sources.historyHeading);
  for (const note of content.editorial.sources.notes) {
    if (note.id) add(note.id, 'sources', note.title.map(t => typeof t === 'string' ? t : t.label || '').join(''));
  }
  add('facebook-original-links', 'sources', content.ui.labels.fbSourcesHeading);
  add('facebook-original-links-title', 'sources', content.ui.labels.fbSourcesHeading);
  for (const source of content.facebookSources.posts) add(source.id, 'sources', source.title);
  add(content.context.id, 'analysis', content.context.title);
  add('translation-context-title', 'analysis', content.context.title);
  for (const question of content.context.questions) add(question.id, 'analysis', question.title);
  for (const thread of content.ui.threads) add('thread-' + thread.id, 'github', '#' + thread.id + ' ' + thread.title);
  for (const record of content.data.records) add(record.id, 'github', record.title);
  for (const [index, set] of content.facebookSets.entries()) {
    const page = ['original', 'published', 'followup'][index];
    add(set.id, page, set.label);
    add(set.heading, page, set.title);
    for (const record of set.data.items) add(record.id, page, record.title);
  }
  const route = page => localeRoute(content.language, page);
  const relative = (from, target) => {
    const result = path.posix.relative(route(from) || '.', target || '.') || '.';
    return result === '.' ? './' : result + ((target === '' || target.endsWith('/')) && !result.endsWith('/') ? '/' : '');
  };
  const pageHref = (from, targetPage, language = content.language) => relative(from, localeRoute(language, targetPage));
  const idHref = (from, id) => {
    const owner = owners.get(id);
    if (!owner) throw new Error(`Unregistered content ID: ${id}`);
    return (owner.page === from ? '' : pageHref(from, owner.page)) + '#' + encodeURIComponent(id);
  };
  const resolve = (from, href, editorial = false) => {
    if (href.startsWith('#')) {
      const id = decodeURIComponent(href.slice(1));
      if (['main', 'top', 'search', 'record-index'].includes(id)) return href;
      return idHref(from, id);
    }
    if (/^(?:\.\.\/)?data\//.test(href)) return relative(from, href.replace(/^\.\.\//, ''));
    if (editorial && (href === 'en/' || href === '../')) return pageHref(from, 'home', content.language === 'en' ? 'zh' : 'en');
    return href;
  };
  const absolute = (page, language = content.language) => new URL(localeRoute(language, page), siteUrl).href;
  const legacy = Object.fromEntries([...owners].filter(([, owner]) => owner.page !== 'home').map(([id]) => [id, idHref('home', id)]));
  return {owners, route, relative, pageHref, idHref, resolve, absolute, legacy};
}
