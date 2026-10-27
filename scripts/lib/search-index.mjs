// The index uses the rendered record text, matching the former single-page search.
const decode = html => html.replace(/&(?:amp|lt|gt|quot|#39);/g, entity => ({
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'"
}[entity]));
export function buildSearchIndex(content, router, sections) {
  const html = sections.github + sections.facebook.join('');
  const text = new Map([...html.matchAll(/<article\b[^>]*\bid="([^"]+)"[^>]*\bdata-record\b[^>]*>([\s\S]*?)<\/article>/g)].map(match => [match[1], decode(match[2].replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()]));
  const records = content.allRecords.map(record => {
    if (!text.has(record.id)) throw new Error(`Search text missing for ${record.id}`);
    return {id: record.id, url: router.idHref('records', record.id), author: record.author, thread: record.thread || 'facebook', text: text.get(record.id)};
  });
  if (new Set(records.map(r => r.id)).size !== records.length) throw new Error('Duplicate search record');
  return {language: content.language, count: records.length, records};
}
