"""Contact sheets for perceptual review; originals stay untouched."""
from pathlib import Path
from PIL import Image, ImageDraw
import json

root = Path('qa/visual')
names = ['home', 'oros', 'tema', 'articulo', 'watch', 'calculadora']
for phase in ['before', 'after']:
    for width in [1440, 768, 390]:
        cell_w = 360
        crop_height = 1000
        cell_h = round(crop_height * cell_w / width) + 30
        sheet = Image.new('RGB', (cell_w * 3, cell_h * 2), '#142239')
        draw = ImageDraw.Draw(sheet)
        for index, name in enumerate(names):
            source = Image.open(root / phase / f'{name}-{width}.png').convert('RGB')
            crop = source.crop((0, 0, width, min(crop_height, source.height)))
            crop = crop.resize((cell_w, round(crop.height * cell_w / width)))
            x, y = index % 3 * cell_w, index // 3 * cell_h
            draw.text((x + 8, y + 6), f'{phase} / {name} / {width}', fill='#f0d878')
            sheet.paste(crop, (x, y + 30))
        sheet.save(root / f'{phase}-top-{width}.png')
print('6 contact sheets generated from real PNG crops')
