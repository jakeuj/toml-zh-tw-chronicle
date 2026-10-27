export const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

export function createHtmlTools(language, {resolveHref = href => href, bindings = {}} = {}) {
  const text = (value, additional = {}) => String(value ?? '').replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    if (!(key in additional) && !(key in bindings)) throw new Error(`Unknown content binding: ${key}`);
    return key in additional ? additional[key] : bindings[key];
  });
  const link = (href, label, className = '', editorial = false) => {
    const destination = resolveHref(href, editorial);
    return `<a href="${esc(destination)}"${className ? ` class="${esc(className)}"` : ''}${destination.startsWith('https:') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
  };
  const local = (id, label) => link('#' + id, esc(label));
  const stamp = (iso, minute = false) => new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'zh-TW', {
    timeZone: 'Asia/Taipei', year: 'numeric', month: language === 'en' ? 'short' : '2-digit',
    day: '2-digit', hour: '2-digit', minute: '2-digit', ...(!minute ? {second: '2-digit'} : {}), hourCycle: 'h23'
  }).format(new Date(iso));
  const clock = (iso, minute = false) => `<span class="utc-pair">${language === 'en' ? 'Taiwan' : '臺灣'} <time datetime="${esc(iso)}">${stamp(iso, minute)}</time><span class="utc">UTC ${new Date(iso).toISOString().slice(0, minute ? 16 : 19).replace('T', ' ')}${minute ? language === 'en' ? ' · minute precision' : ' · 精確至分鐘' : ''}</span></span>`;
  const rich = (runs, additional) => runs.map(run => {
    if (typeof run === 'string') return esc(text(run, additional)).replaceAll('\n', '<br>');
    if (run.href) return link(run.href, esc(text(run.label, additional)), '', true);
    const entries = Object.entries(run);
    if (entries.length !== 1 || !['code', 'strong', 'b', 'em'].includes(entries[0][0])) throw new Error('Invalid editorial inline text');
    const [tag, value] = entries[0];
    return `<${tag}>${esc(text(value, additional))}</${tag}>`;
  }).join('');
  const paras = paragraphs => paragraphs.map(p => `<p>${esc(p)}</p>`).join('');
  return {esc, text, link, local, stamp, clock, rich, paras};
}
