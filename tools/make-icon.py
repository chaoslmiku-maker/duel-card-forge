"""生成发布用图标：512x512，深色底 + 金色描边 + 「决」字。"""
from PIL import Image, ImageDraw, ImageFont

S = 512
img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# 背景渐变（竖直）
top = (18, 25, 44)
bottom = (34, 45, 76)
for y in range(S):
    t = y / (S - 1)
    color = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)) + (255,)
    d.line([(0, y), (S, y)], fill=color)

# 圆角遮罩
mask = Image.new("L", (S, S), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=96, fill=255)
img.putalpha(mask)

d = ImageDraw.Draw(img)
# 外金色描边
d.rounded_rectangle([10, 10, S - 11, S - 11], radius=90, outline=(231, 196, 106, 255), width=7)
d.rounded_rectangle([26, 26, S - 27, S - 27], radius=76, outline=(231, 196, 106, 70), width=2)

# 中央卡牌剪影
card_w, card_h = 190, 260
cx, cy = S // 2, S // 2 - 18
card = [cx - card_w // 2, cy - card_h // 2, cx + card_w // 2, cy + card_h // 2]
d.rounded_rectangle(card, radius=22, fill=(22, 30, 52, 235), outline=(231, 196, 106, 120), width=3)
# 卡面上的“决”
font_cn = ImageFont.truetype(r"C:\Windows\Fonts\msyhbd.ttc", 150)
text = "决"
bbox = d.textbbox((0, 0), text, font=font_cn)
tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
d.text((cx - tw / 2 - bbox[0], cy - th / 2 - bbox[1] - 14), text, font=font_cn, fill=(244, 227, 176, 255))

# 底部英文
font_en = ImageFont.truetype(r"C:\Windows\Fonts\msyh.ttc", 34)
label = "CARD FORGE"
bbox = d.textbbox((0, 0), label, font=font_en)
tw = bbox[2] - bbox[0]
d.text(((S - tw) / 2, cy + card_h // 2 - 6), label, font=font_en, fill=(231, 196, 106, 220))

img.save(r"C:\Users\19861\Downloads\卡牌作战自定义\assets\icon.png")
print("icon written")
