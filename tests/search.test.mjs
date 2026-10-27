import test from 'node:test';
import assert from 'node:assert/strict';
import {json} from './helpers.mjs';
import {loadContent} from '../scripts/lib/load-content.mjs';
import {createRoutes} from '../scripts/lib/routes.mjs';
for (const language of ['zh', 'en']) test(`${language}: 全站索引涵蓋 144 筆正文、脈絡、註記、作者與時間`, () => {
  const index = json(`dist/data/search.${language}.json`);
  const content = loadContent(language), router = createRoutes(content);
  assert.equal(index.count, 144);
  assert.deepEqual(index.records.map(r => r.id), content.allRecords.map(r => r.id));
  const compact = value => value.replace(/\s/g, '');
  for (const record of content.allRecords) {
    const entry = index.records.find(r => r.id === record.id);
    assert.equal(entry.url, router.idHref('records', record.id));
    assert.equal(entry.author, record.author);
    assert.equal(entry.thread, record.thread || 'facebook');
    for (const value of [record.title, record.author, record.context || '', ...record.paragraphs, ...record.notes]) assert.ok(compact(entry.text).includes(compact(value)), record.id + ': ' + value);
    assert.ok(entry.text.includes('UTC'));
  }
});
