import {readFileSync, writeFileSync, mkdirSync, rmSync, cpSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {root, loadContent} from './load-content.mjs';
import {createHtmlTools} from './html.mjs';
import {renderSections} from './render-sections.mjs';
import {renderDocument} from './render-page.mjs';
import {buildSearchIndex} from './search-index.mjs';
import {createRoutes, routeOrder} from './routes.mjs';
import {pageDetails, editorialPages, recordPages, pageNavigation, pagePager, contentDates, legacyLinks} from './page-content.mjs';

export const output = path.join(root, 'dist');
export function prepareOutput() {
  rmSync(output, {recursive: true, force: true});
  mkdirSync(output, {recursive: true});
  for (const directory of ['assets', 'data']) cpSync(path.join(root, directory), path.join(output, directory), {recursive: true});
  writeFileSync(path.join(output, '.nojekyll'), '');
}
function assetVersion(file) {
  const hash = createHash('sha256').update(readFileSync(path.join(root, file))).digest('hex').slice(0, 12);
  return hash;
}
export function renderEdition(language, {siteUrl} = {}) {
  const content = loadContent(language);
  if (siteUrl) content.data.siteUrl = siteUrl;
  const router = createRoutes(content);
  const details = pageDetails(content);
  const pages = new Map();
  let searchIndex;
  for (const page of routeOrder) {
    const tools = createHtmlTools(language, {bindings: content.bindings, resolveHref: (href, editorial) => router.resolve(page, href, editorial)});
    const sections = renderSections(content, tools);
    if (page === 'records') searchIndex = buildSearchIndex(content, router, sections);
    const bodies = {...editorialPages(content, tools, router, sections), ...recordPages(content, tools, router, sections)};
    if (page === 'records') {
      const version = createHash('sha256').update(JSON.stringify(searchIndex)).digest('hex').slice(0, 12);
      bodies.records = bodies.records.replace('<ol class="record-list"', '<ol data-search-index="' + router.relative(page, 'data/search.' + language + '.json') + '?v=' + version + '" class="record-list"');
    }
    const info = details[page];
    const html = renderDocument(content, tools, {
      body: bodies[page] + pagePager(content, tools, router, page, details) + (page === 'home' ? legacyLinks(content, tools, router) : ''),
      legacy: page === 'home' ? router.legacy : undefined,
      asset: file => router.relative(page, file) + '?v=' + assetVersion(file),
      pageUrl: router.absolute(page), alternateUrl: router.absolute(page, language === 'en' ? 'zh' : 'en'),
      alternateHref: router.pageHref(page, page, language === 'en' ? 'zh' : 'en'),
      title: page === 'home' ? info.title : info.title + ' · ' + content.ui.hero.deck,
      heading: info.title, description: info.description, home: page === 'home', homeHref: page === 'home' ? '#top' : router.pageHref(page, 'home'),
      navigation: pageNavigation(content, tools, router, page)
    });
    pages.set(router.route(page) + 'index.html', html);
  }
  return {content, router, pages, searchIndex};
}
export function buildEdition(language) {
  const {pages, content, searchIndex} = renderEdition(language);
  writeFileSync(path.join(output, 'data/search.' + language + '.json'), JSON.stringify(searchIndex) + '\n');
  for (const [file, html] of pages) {
    const destination = path.join(output, file);
    mkdirSync(path.dirname(destination), {recursive: true});
    writeFileSync(destination, html);
  }
  console.log(`Built ${language}: ${pages.size} pages, ${content.allRecords.length} records`);
}
export function writeSitemap() {
  const content = loadContent('zh');
  const router = createRoutes(content);
  const urls = ['zh', 'en'].flatMap(language => routeOrder.map(page => `<url><loc>${router.absolute(page, language)}</loc><lastmod>${contentDates(content, page)}</lastmod></url>`));
  writeFileSync(path.join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>\n`);
}
