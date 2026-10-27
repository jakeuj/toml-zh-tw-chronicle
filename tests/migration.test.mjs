import {createHash} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {pages, json, compact, visibleText, decode} from './helpers.mjs';
const hashText = value => createHash('sha256').update(compact(value)).digest('hex');
const baseline = json('tests/fixtures/content-baseline.json');
for (const language of ['zh', 'en']) {
  test(`${language}: 重構保留所有原始錨點、144 筆可見紀錄及編輯段落`, () => {
    const documents = pages(language);
    const html = documents.map(p => p.html).join('\n');
    const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
    for (const id of baseline[language].ids) assert.ok(ids.has(id), `missing original ID: ${id}`);
    const cards = new Map([...html.matchAll(/<article\b[^>]*\bid="([^"]+)"[^>]*\bdata-record\b[^>]*>([\s\S]*?)<\/article>/g)].map(m => [m[1], {text: visibleText(m[2]), sourceUrls: new Set([...m[2].matchAll(/href="(https:[^"]+)"/g)].map(link => decode(link[1])))}]));
    assert.equal(cards.size, 144);
    for (const [id, record] of Object.entries(baseline[language].records)) {
      assert.equal(hashText(cards.get(id).text), record.textSha256, id);
      for (const url of record.sourceUrls) assert.ok(cards.get(id).sourceUrls.has(url), id + ': ' + url);
    }
    const paragraphs = new Set([...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(m => hashText(visibleText(m[1]))));
    for (const paragraph of baseline[language].editorialParagraphs) assert.ok(paragraphs.has(paragraph.sha256), `missing paragraph: ${paragraph.preview}`);
    assert.deepEqual([...html.matchAll(/data-timeline-time="([^"]+)"/g)].map(m => m[1]), baseline[language].timelineTimes);
  });
}
