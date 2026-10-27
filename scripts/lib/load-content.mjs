import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHtmlTools} from './html.mjs';

export const root = fileURLToPath(new URL('../../', import.meta.url));
export const readJSON = relative => JSON.parse(readFileSync(path.join(root, relative), 'utf8'));

export function loadContent(language) {
  const prefix = language === 'en' ? 'data/en/' : 'data/';
  const read = name => readJSON(prefix + name + '.json');
  const data = read('chronicle');
  const original = read('facebook-comments');
  const published = read('facebook-self-published-comments');
  const followup = read('facebook-followup-comments');
  const context = read('translation-context');
  const ui = read('ui');
  const facebookSets = ui.facebookSets.map(set => ({...set, data: read(set.file)}));
  const allRecords = [...data.records, ...original.items, ...published.items, ...followup.items];
  const {stamp} = createHtmlTools(language);
  const bindings = {
    githubCapturedAt: stamp(data.capturedAt), externalCheckedAt: stamp(data.externalCheckedAt),
    contextCheckedAt: stamp(context.checkedAt), followupCheckedAt: stamp(data.followupPost.checkedAt),
    publishedCapturedAt: stamp(published.capturedAt), totalRecords: allRecords.length,
    githubCount: data.records.length, facebookCount: allRecords.length - data.records.length
  };
  for (const [label, value] of Object.entries({original, published, followup})) {
    for (const key of ['rootCount', 'replyCount', 'observedPageCount', 'loadedCount']) bindings[label + '.' + key] = value[key];
  }
  return {
    language, prefix, data, original, published, followup, context, ui, facebookSets, allRecords, bindings,
    byId: new Map(allRecords.map(record => [record.id, record])), brief: read('brief'),
    facebookSources: read('facebook-sources'),
    editorial: Object.fromEntries(['overview', 'questions', 'sources', 'chapters'].map(name => [name, read('editorial/' + name)]))
  };
}
