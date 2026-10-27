const labels={
 zh:{title:'閱讀設定',description:'設定只儲存在此瀏覽器。也可使用 Ctrl／⌘＋或手機縮放。',font:'正文字體',sans:'清晰黑體',serif:'報導明體',size:'字級',sizes:['18 小','20 標準','22 大','24 特大'],reset:'恢復預設',nojs:'JavaScript 未啟用，目前使用清晰黑體與標準字級；仍可使用瀏覽器縮放。'},
 en:{title:'Reading settings',description:'Preferences stay in this browser. Browser zoom (Ctrl/⌘ +) and pinch zoom remain available.',font:'Body typeface',sans:'Clear sans serif',serif:'Editorial serif',size:'Text size',sizes:['18 Small','20 Standard','22 Large','24 Extra large'],reset:'Reset defaults',nojs:'JavaScript is disabled. Clear sans serif and standard text size are used; browser zoom remains available.'}
};
export function readingSettingsLink(language='zh'){
 return `<a class="reading-settings-link" href="#reading-settings"><span aria-hidden="true">Aa</span> ${labels[language].title}</a>`;
}
export function renderReadingSettings(language='zh'){
 const t=labels[language];
 return `<section class="reading-settings" id="reading-settings" aria-labelledby="reading-settings-title"><h2 id="reading-settings-title">${t.title}</h2><p class="reading-description">${t.description}</p><form id="reading-preferences" hidden aria-labelledby="reading-settings-title"><div class="reading-font-field"><label for="reading-font">${t.font}</label><select id="reading-font" name="font"><option value="sans">${t.sans}</option><option value="serif">${t.serif}</option></select></div><fieldset class="reading-size-field"><legend>${t.size}</legend><div class="reading-size-choices">${[18,20,22,24].map((size,i)=>`<label class="reading-size-choice"><input type="radio" name="size" value="${size}"${size===20?' checked':''}><span>${t.sizes[i]}</span></label>`).join('')}</div></fieldset><button type="button" data-reset-reading>${t.reset}</button></form><noscript><p class="reading-noscript">${t.nojs}</p></noscript><p id="reading-status" class="reading-status" role="status" aria-live="polite"></p></section>`;
}
