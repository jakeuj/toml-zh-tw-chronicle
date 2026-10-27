"""Regenerate the English 1200 x 630 share card with Pillow; not needed for builds."""
from pathlib import Path
import argparse
from PIL import Image, ImageDraw, ImageFont

p=argparse.ArgumentParser()
p.add_argument('--font',default='/System/Library/Fonts/Supplemental/Georgia.ttf')
args=p.parse_args()
font_path=Path(args.font)
if not font_path.exists():raise SystemExit('Use --font to select an available serif font.')
font=lambda size:ImageFont.truetype(str(font_path),size)
root=Path(__file__).resolve().parents[1]
im=Image.new('RGB',(1200,630),'#f8f6f0');d=ImageDraw.Draw(im)
ink='#20231f';muted='#62645d';red='#ad3029';rule='#d8d7cd'
d.rectangle((0,0,1200,8),fill=ink)
d.rectangle((64,44,107,90),fill=red);d.text((74,45),'R',font=font(31),fill='#f8f6f0')
d.text((123,49),'THE OPEN SOURCE RECORD',font=font(24),fill=ink)
d.text((942,56),'ENGLISH EDITION',font=font(15),fill=muted)
d.line((64,116,1136,116),fill=rule,width=1)
for y,text,color in [(153,'A Traditional Chinese',ink),(236,'translation becomes',ink),(319,'an AI contribution dispute.',red)]:
 d.text((64,y),text,font=font(49),fill=color)
d.text((69,428),'The TOML chronicle',font=font(28),fill=ink)
d.line((860,156,860,480),fill=rule,width=1)
for y,n,label in [(165,'#97','First proposal'),(274,'#98','Translation PR'),(383,'#99','Renewed issue')]:
 d.text((906,y),n,font=font(40),fill=red);d.text((908,y+53),label,font=font(18),fill=ink)
d.line((64,523,1136,523),fill=ink,width=2)
d.text((68,553),'23–27 OCT 2026',font=font(21),fill=muted)
d.text((638,553),'Comments · Timeline · Source checks',font=font(21),fill=muted)
im.save(root/'assets/toml-chronicle-cover-en-v1.png',optimize=True)
print('Saved English share card: 1200 x 630 PNG')
