import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContent} from '../scripts/lib/load-content.mjs';
import {createHtmlTools} from '../scripts/lib/html.mjs';
import {renderDocument} from '../scripts/lib/render-page.mjs';

test('介面設定保留原字串，script 結束字樣以 JSON escape 輸出', () => {
  const content = loadContent('zh');
  const label = '</script><script>example</script>';
  content.ui.labels.copy = label;
  const html = renderDocument(content, createHtmlTools('zh', {bindings: content.bindings}), {
    body: '', asset: file => file, pageUrl: content.data.siteUrl, alternateUrl: content.data.siteUrl + 'en/', alternateHref: 'en/'
  });
  const config = /<script id="site-config" type="application\/json">([\s\S]*?)<\/script>/.exec(html)[1];
  assert.ok(!config.includes('<'));
  assert.equal(JSON.parse(config).messages.copy, label);
});
