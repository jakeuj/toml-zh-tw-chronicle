export function renderDocument(content, tools, options) {
  const {ui, data, language} = content;
  const {esc, rich, link} = tools;
  const {body, asset, pageUrl, alternateUrl, alternateHref, title = data.title, description = data.description, home = true, navigation = ''} = options;
  const messageKeys = ['all', 'found', 'copied', 'copy', 'copiedStatus', 'copyFallback', 'copyUrl', 'searchFailure'];
  const config = JSON.stringify({language, legacy: options.legacy, messages: Object.fromEntries(messageKeys.map(key => [key, ui.labels[key]]))}).replace(/</g, '\\u003c');
  const otherLang = language === 'en' ? 'zh-Hant-TW' : 'en';
  const cover = new URL(`assets/toml-chronicle-cover${language === 'en' ? '-en' : ''}-v1.png`, data.siteUrl).href;
  const nav = navigation || ui.nav.map(({id, label}, i) => link('#' + id, `<span>${String(i).padStart(2, '0')}</span>${esc(label)}`)).join('');
  const languageLink = label => `<a data-language-switch href="${esc(alternateHref)}" lang="${otherLang}" hreflang="${otherLang}">${esc(label)}</a>`;
  const hero = `<section class="hero" id="top">
<div class="hero-copy">
<div class="eyebrow hero-eyebrow">
<span class="red-line">
</span>${esc(ui.hero.eyebrow)}</div>
<h1>${ui.hero.title.map((line, i) => i === ui.hero.title.length - 1 ? `<span>${esc(line)}</span>` : esc(line)).join('<br>')}</h1>
<p class="hero-deck">${esc(ui.hero.deck)}</p>
<p class="hero-intro">${rich(ui.hero.intro)}</p>
<div class="hero-links">${link('#brief', esc(ui.hero.brief), 'primary-link')}${link('#archive', esc(ui.hero.archive), 'quiet-link')}</div>
</div>
<aside class="dossier" aria-label="${esc(ui.hero.dossierLabel)}">
<div class="dossier-top">
<span>THE CASE FILE</span>
<span>001 / TOML</span>
</div>
<div class="dossier-glyph" aria-hidden="true">
<span>zh</span>
<span class="glyph-slash">/</span>
<span>TW</span>
<i>
</i>
</div>
<p class="dossier-caption">${rich(ui.hero.caption)}</p>
<div class="case-rows">${ui.threads.map(t => link('#thread-' + t.id, `<strong>#${t.id}</strong>
<span>${esc(t.label)}<small>${esc(t.state)}</small>
</span>
<span aria-hidden="true">↗</span>`, 'case-row')).join('')}</div>
<div class="dossier-footer">
<span>2026.10.23 — 10.27</span>
<span>PUBLIC RECORD</span>
</div>
</aside>
</section>
<div class="edition-strip">${ui.strip.map(runs => `<span>${rich(runs)}</span>`).join('')}</div>`;
  return `<!doctype html>
<html lang="${ui.language}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(pageUrl)}">
<link rel="alternate" hreflang="${ui.language}" href="${esc(pageUrl)}">
<link rel="alternate" hreflang="${otherLang}" href="${esc(alternateUrl)}">
<link rel="icon" href="${asset('assets/favicon.svg')}" type="image/svg+xml">
<meta name="theme-color" content="#f8f6f0">
<meta property="og:type" content="article">
<meta property="og:locale" content="${ui.ogLocale}">
<meta property="og:site_name" content="${esc(ui.footer.brand)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(pageUrl)}">
<meta property="og:image" content="${cover}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(data.title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${cover}">
<meta name="twitter:image:alt" content="${esc(data.title)}">
<link rel="stylesheet" href="${asset('assets/style.css')}">
<script src="${asset('assets/app.js')}" defer>
</script>
</head>
<body>
<a class="skip-link" href="#main">${esc(ui.headers.skip)}</a>
<div class="reading-progress" aria-hidden="true">
</div>
<header class="masthead">${link(options.homeHref || '#top', `<span class="brand-mark">${esc(ui.headers.brandMark)}</span>
<span>${esc(ui.headers.brand)}<small>${esc(ui.headers.brandSmall)}</small>
</span>`, 'brand')}<div class="masthead-right">${ui.headers.edition ? `<span>${esc(ui.headers.edition)}</span>` : ''}<a class="language-switch" data-language-switch href="${esc(alternateHref)}" lang="${otherLang}" hreflang="${otherLang}">${esc(ui.headers.language)}</a>${link('#sources', esc(ui.headers.cutoff))}</div>
</header>
<main id="main">${home ? hero : `<div class="page-intro" id="top">
<span class="eyebrow">${esc(ui.hero.deck)}</span>
<h1>${esc(options.heading || title)}</h1>
</div>`}<div class="article-shell">
<aside class="toc">
<span class="eyebrow">${esc(ui.toc.label)}</span>
<nav aria-label="${esc(ui.toc.label)}">${nav}</nav>
<div class="toc-note">${rich(ui.toc.note)}</div>
</aside>
<div class="article-column">
<details class="mobile-toc">
<summary>${esc(ui.toc.mobile)}</summary>
<nav aria-label="${esc(ui.toc.label)}">${nav}</nav>
</details>${body}<div class="endnote">
<span class="endnote-symbol">${esc(ui.endnote.mark)}</span>
<p>${rich(ui.endnote.text)}</p>
<a href="#top">${esc(ui.endnote.top)}</a>
</div>
</div>
</div>
</main>
<footer class="site-footer">
<div>
<strong>${esc(ui.footer.brand)}</strong>
<span>${esc(ui.footer.description)}</span>
</div>
<div>${link(data.repositoryUrl, esc(ui.footer.source))}${languageLink(ui.footer.language)}<span>${esc(ui.footer.rights)}</span>
</div>
</footer>
<script id="site-config" type="application/json">${config}</script>
<p id="copy-status" class="sr-only" role="status" aria-live="polite">
</p>
</body>
</html>`;
}
