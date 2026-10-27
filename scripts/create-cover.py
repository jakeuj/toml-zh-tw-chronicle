"""Optional artwork regeneration. Requires Pillow and a Traditional Chinese font.
The generated PNG is committed, so the website build needs only Node.js.
"""
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import argparse
p=argparse.ArgumentParser();p.add_argument('--font',default='/System/Library/Fonts/Supplemental/Songti.ttc');p.add_argument('--font-index',type=int,default=None);args=p.parse_args()
root=Path(__file__).resolve().parents[1]
font_path=Path(args.font)
if not font_path.exists():raise SystemExit('請以 --font 指定可使用的繁體中文字型。')
font_index=args.font_index if args.font_index is not None else (2 if font_path.name=='Songti.ttc' else 0)
def font(size):return ImageFont.truetype(str(font_path),size,index=font_index)
for ch in '誌開源現場獨立紀實專題一份繁中翻譯如何成為貢獻爭議事件全紀錄第二提案逐則留言時間線來源查核':
 if font(32).getmask(ch).getbbox() is None:raise SystemExit(f'字型缺字：{ch}；請選用完整繁中字型。')
im=Image.new('RGB',(1200,630),'#f8f6f0');d=ImageDraw.Draw(im)
ink='#20231f';muted='#62645d';red='#ad3029';rule='#d8d7cd'
d.rectangle((0,0,1200,8),fill=ink);d.rectangle((64,44,107,90),fill=red);d.text((72,46),'誌',font=font(29),fill='#f8f6f0')
d.text((123,46),'開源現場',font=font(30),fill=ink);d.text((900,58),'獨立紀實專題',font=font(18),fill=muted)
d.line((64,116,1136,116),fill=rule,width=1)
d.text((66,150),'一份繁中翻譯，',font=font(64),fill=ink)
d.text((66,236),'如何成為',font=font(64),fill=ink)
d.text((66,322),'AI 貢獻爭議。',font=font(64),fill=red)
d.text((70,428),'TOML 事件全紀錄',font=font(27),fill=ink)
d.line((860,156,860,480),fill=rule,width=1)
for y,n,title in [(165,'#97','第一份提案'),(274,'#98','翻譯 PR'),(383,'#99','第二份提案')]:
 d.text((907,y),n,font=font(40),fill=red);d.text((909,y+51),title,font=font(19),fill=ink)
d.line((64,523,1136,523),fill=ink,width=2)
d.text((68,552),'2026.10.23 — 10.27',font=font(22),fill=muted)
d.text((737,553),'逐則留言 · 時間線 · 來源查核',font=font(21),fill=muted)
im.save(root/'assets/toml-chronicle-cover-v1.png',optimize=True)
print('Saved 1200 × 630 PNG')
