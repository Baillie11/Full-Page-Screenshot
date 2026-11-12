"""Generate code-drawn icons and package only the extension for the Web Store."""
from pathlib import Path
import json
import zipfile
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
extension = root / 'chrome-extension'
icons = extension / 'icons'
icons.mkdir(exist_ok=True)
scale = 4
image = Image.new('RGBA', (128*scale, 128*scale))
draw = ImageDraw.Draw(image)
def box(coords):
    return tuple(int(c*scale) for c in coords)
draw.rounded_rectangle(box((16,16,112,112)), radius=20*scale, fill='#0877B9')
draw.rounded_rectangle(box((38,29,90,99)), radius=5*scale, fill='white')
draw.rounded_rectangle(box((47,40,81,45)), radius=2*scale, fill='#292E6D')
for y, end in [(54,77),(64,81),(74,72)]:
    draw.rounded_rectangle(box((47,y,end,y+3)), radius=scale, fill='#A7D3EC')
draw.line(box((59,87,69,87)), fill='#0877B9', width=3*scale)
draw.polygon([box((64,81)),box((59,86)),box((69,86))], fill='#0877B9')
draw.polygon([box((64,94)),box((59,89)),box((69,89))], fill='#0877B9')
for size in (16,32,48,128):
    image.resize((size,size), Image.Resampling.LANCZOS).save(icons / f'icon{size}.png')
manifest = json.loads((extension/'manifest.json').read_text())
release = root/'release'
release.mkdir(exist_ok=True)
package = release/f'full-page-screenshot-{manifest["version"]}.zip'
with zipfile.ZipFile(package, 'w', zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(extension.rglob('*')):
        if path.is_file():
            archive.write(path,path.relative_to(extension).as_posix())
with zipfile.ZipFile(package) as archive:
    assert archive.testzip() is None
    assert 'manifest.json' in archive.namelist()
    for path in manifest['icons'].values():
        assert path in archive.namelist()
print(package)
