import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {existsSync} from 'node:fs';
import {pages, root, read, decode} from './helpers.mjs';
import {loadContent} from '../scripts/lib/load-content.mjs';
import {createRoutes, routeOrder} from '../scripts/lib/routes.mjs';
import {renderEdition} from '../scripts/lib/build-site.mjs';

for (const language of ['zh', 'en']) {
  test(`${language}: 九頁 metadata、所有站內路徑、fragment 與資源可到達`, () => {
    const documents = pages(language);
    const router = createRoutes(loadContent(language));
    assert.equal(documents.length, 9);
    const byFile = new Map([...pages('zh'), ...pages('en')].map(p => [p.file, p.html]));
    for (const page of routeOrder) {
      const file = 'dist/' + router.route(page) + 'index.html';
      const html = byFile.get(file);
      assert.ok(html.includes(`<link rel="canonical" href="${router.absolute(page)}">`), file);
      assert.ok(html.includes(`<meta property="og:url" content="${router.absolute(page)}">`), file);
      const alternate = router.absolute(page, language === 'en' ? 'zh' : 'en');
      assert.ok(html.includes(`hreflang="${language === 'en' ? 'zh-Hant-TW' : 'en'}" href="${alternate}"`), file);
      const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
      assert.equal(ids.length, new Set(ids).size, file + ' duplicate IDs');
      for (const [, raw] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
        const href = decode(raw);
        if (/^(https?:|mailto:)/.test(href)) continue;
        const url = new URL(href, 'https://local.test/' + file.slice(5));
        const target = 'dist' + url.pathname + (url.pathname.endsWith('/') ? 'index.html' : '');
        assert.ok(existsSync(path.join(root, target)), `${file} -> ${href}`);
        if (url.hash) {
          const targetHTML = byFile.get(target) || read(target);
          assert.ok(targetHTML.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${file} -> ${href}`);
        }
      }
    }
    const titles = documents.map(p => /<title>(.*?)<\/title>/.exec(p.html)[1]);
    assert.equal(new Set(titles).size, 9);
  });
}
test('子路徑部署的 metadata、相對資源與跨語言深層連結保持一致', () => {
  const base = 'https://example.test/chronicle/';
  for (const language of ['zh', 'en']) {
    const {pages, router} = renderEdition(language, {siteUrl: base});
    for (const page of routeOrder) {
      const file = router.route(page) + 'index.html';
      const html = pages.get(file);
      assert.ok(html.includes(`href="${router.absolute(page)}"`));
      for (const [, asset] of html.matchAll(/(?:src|href)="([^"]*assets\/[^\"]+)"/g)) {
        const url = new URL(asset, new URL(file, base));
        assert.ok(url.pathname.startsWith('/chronicle/assets/'), file + ' ' + asset);
      }
      assert.ok(html.includes(`href="${router.pageHref(page, page, language === 'en' ? 'zh' : 'en')}"`));
    }
  }
});
test('舊首頁錨點有同語言新網址及可閱讀的靜態替代入口', () => {
  for (const language of ['zh', 'en']) {
    const content = loadContent(language), router = createRoutes(content);
    const html = read('dist/' + router.route('home') + 'index.html');
    const config = JSON.parse(/<script id="site-config" type="application\/json">([\s\S]*?)<\/script>/.exec(html)[1]);
    assert.deepEqual(config.legacy, router.legacy);
    for (const [id, href] of Object.entries(router.legacy)) {
      assert.ok(html.includes(`id="${id}"`), id);
      assert.ok(html.includes(`href="${href}"`), id);
      assert.ok(!href.startsWith('#'), id);
      assert.notEqual(router.owners.get(id).page, 'home');
    }
    assert.ok(!Object.hasOwn(config.legacy, 'brief'));
    assert.ok(!Object.hasOwn(config.legacy, '__proto__'));
  }
});
test('sitemap 涵蓋 18 個 canonical，日期依頁面來源截點而非建置時間', () => {
  const content = loadContent('zh'), router = createRoutes(content);
  const sitemap = read('dist/sitemap.xml');
  const urls = [...sitemap.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod><\/url>/g)];
  assert.equal(urls.length, 18);
  assert.equal(new Set(urls.map(m => m[1])).size, 18);
  for (const language of ['zh', 'en']) for (const page of routeOrder) assert.ok(urls.some(m => m[1] === router.absolute(page, language)));
  const timeline = urls.find(m => m[1] === router.absolute('timeline'));
  assert.equal(timeline[2], new Date(content.data.capturedAt).toISOString());
  const original = urls.find(m => m[1] === router.absolute('original'));
  assert.equal(original[2], new Date(content.original.capturedAt).toISOString());
});
test('紀錄頁搜尋入口及上一章指向同語言的索引，../ 不被誤當語言切換', () => {
  for (const language of ['zh', 'en']) {
    const content = loadContent(language), router = createRoutes(content);
    for (const page of ['github', 'original', 'published', 'followup']) {
      const html = read('dist/' + router.route(page) + 'index.html');
      const actual = /<a href="([^"]+)" class="search-entry">/.exec(html)[1];
      assert.equal(actual, router.pageHref(page, 'records'));
    }
    assert.equal(router.resolve('github', '../'), '../');
    assert.notEqual(router.resolve('github', '../', true), '../');
  }
});
