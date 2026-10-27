import {readFileSync, readdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const root = fileURLToPath(new URL('../', import.meta.url));
export const read = file => readFileSync(path.join(root, file), 'utf8');
export const json = file => JSON.parse(read(file));
export const decode = value => value.replace(/&(?:amp|lt|gt|quot|#39|#x[\da-f]+|#\d+);/gi, entity => {
  const named = {'&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'"};
  if (entity in named) return named[entity];
  return String.fromCodePoint(parseInt(entity.slice(entity.startsWith('&#x') ? 3 : 2, -1), entity.startsWith('&#x') ? 16 : 10));
});
export const visibleText = html => decode(html.replace(/<[^>]*>/g, ''));
export const compact = text => text.replace(/\s/g, '');
export function pages(language) {
  const result = [];
  const visit = directory => {
    for (const entry of readdirSync(path.join(root, directory), {withFileTypes: true})) {
      const file = path.posix.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (['assets', 'data'].includes(entry.name) || language === 'zh' && entry.name === 'en') continue;
        visit(file);
      } else if (entry.name.endsWith('.html')) result.push({file, html: read(file)});
    }
  };
  visit(language === 'en' ? 'dist/en' : 'dist');
  return result;
}
