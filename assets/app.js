const config = JSON.parse(document.querySelector('#site-config').textContent);
const messages = config.messages;
const message = (key, values = {}) => messages[key].replace(/\{\{([^}]+)\}\}/g, (_, name) => values[name]);
const normalize = value => value.normalize('NFKC').toLocaleLowerCase(config.language === 'en' ? 'en' : 'zh-TW');

function redirectLegacy() {
  if (!config.legacy || !location.hash) return false;
  let id;
  try { id = decodeURIComponent(location.hash.slice(1)); } catch { return false; }
  if (!Object.hasOwn(config.legacy, id)) return false;
  const destination = new URL(config.legacy[id], location.href);
  destination.search = location.search;
  if (destination.href === location.href) return false;
  location.replace(destination.href);
  return true;
}
const redirecting = redirectLegacy();

function updateLanguageLinks() {
  const version = new URL(location.href).searchParams.get('v');
  for (const anchor of document.querySelectorAll('[data-language-switch]')) {
    const destination = new URL(anchor.href);
    destination.hash = location.hash;
    if (version) destination.searchParams.set('v', version);
    anchor.href = destination.href;
  }
}
updateLanguageLinks();
window.addEventListener('hashchange', updateLanguageLinks);

async function initializeSearch() {
  const list = document.querySelector('[data-search-index]');
  if (!list) return;
  const form = document.querySelector('.filter-form');
  const tools = document.querySelector('.archive-tools');
  const search = document.querySelector('#search');
  const author = document.querySelector('#author');
  const thread = document.querySelector('#thread');
  const count = document.querySelector('#result-count');
  const empty = document.querySelector('.empty-state');
  const rows = [...list.querySelectorAll('[data-result]')];
  try {
    const response = await fetch(list.dataset.searchIndex);
    if (!response.ok) throw new Error('Search index unavailable');
    const index = await response.json();
    if (index.language !== config.language || index.count !== rows.length) throw new Error('Search inventory mismatch');
    const byId = new Map(index.records.map(record => [record.id, normalize(record.text)]));
    if (rows.some(row => !byId.has(row.dataset.id))) throw new Error('Search record missing');
    const applyFilters = () => {
      const words = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
      let total = 0;
      for (const row of rows) {
        const match = words.every(word => byId.get(row.dataset.id).includes(word)) &&
          (!author.value || row.dataset.author === author.value) &&
          (!thread.value || row.dataset.thread === thread.value);
        row.hidden = !match;
        if (match) total++;
      }
      count.textContent = total === rows.length ? message('all', {count: total}) : message('found', {count: total, total: rows.length});
      empty.hidden = total !== 0;
    };
    form.addEventListener('submit', event => event.preventDefault());
    form.addEventListener('input', applyFilters);
    form.addEventListener('change', applyFilters);
    form.addEventListener('reset', () => requestAnimationFrame(applyFilters));
    tools.hidden = false;
    if (location.hash) revealHashTarget();
  } catch {
    count.textContent = message('searchFailure');
    const warning = document.createElement('p');
    warning.className = 'noscript-note';
    warning.setAttribute('role', 'status');
    warning.textContent = message('searchFailure');
    list.before(warning);
  }
}
initializeSearch();

function revealHashTarget() {
  let id;
  try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  const target = document.getElementById(id);
  if (!target) return;
  for (let parent = target.parentElement; parent; parent = parent.parentElement) {
    if (parent.tagName === 'DETAILS') parent.open = true;
  }
  requestAnimationFrame(() => target.scrollIntoView({behavior: 'instant', block: 'start'}));
}
window.addEventListener('hashchange', () => { if (!redirectLegacy()) revealHashTarget(); });
if (location.hash && !redirecting) revealHashTarget();

const status = document.querySelector('#copy-status');
for (const button of document.querySelectorAll('[data-copy]')) {
  button.hidden = false;
  button.addEventListener('click', async () => {
    const url = new URL(location.href);
    url.hash = button.dataset.copy;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(url.href);
      button.textContent = message('copied');
      status.textContent = message('copiedStatus');
      setTimeout(() => { button.textContent = message('copy'); }, 1800);
    } catch {
      location.hash = button.dataset.copy;
      status.textContent = message('copyFallback');
      button.textContent = message('copyUrl');
    }
  });
}
document.querySelectorAll('.mobile-toc nav a').forEach(anchor => anchor.addEventListener('click', () => {
  anchor.closest('details').open = false;
}));
if ('IntersectionObserver' in window) {
  const links = [...document.querySelectorAll('.toc nav a')];
  const chapters = [...document.querySelectorAll('.chapter')];
  const visible = new Set();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) entry.isIntersecting ? visible.add(entry.target.id) : visible.delete(entry.target.id);
    const selected = chapters.find(chapter => visible.has(chapter.id));
    if (!selected || !links.some(link => link.hash === '#' + selected.id)) return;
    for (const link of links) {
      if (link.hash === '#' + selected.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }, {rootMargin: '-5% 0px -65% 0px', threshold: 0});
  chapters.forEach(chapter => observer.observe(chapter));
}
const progress = document.querySelector('.reading-progress');
if (progress) {
  let scheduled = false;
  const updateProgress = () => {
    const length = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${length > 0 ? Math.min(1, Math.max(0, scrollY / length)) : 0})`;
    scheduled = false;
  };
  window.addEventListener('scroll', () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(updateProgress);
  }, {passive: true});
  window.addEventListener('resize', updateProgress);
  updateProgress();
}
