#!/usr/bin/env python3
"""V74: conservative source WebP decontamination for 28 native 2.5D bridges.

Assets only. Keep dimensions, ids, strong opaque wood/stone RGB and WorldObject
geometry unchanged. Requires Pillow. --apply writes ONLY images with changes.
"""
from collections import deque
from pathlib import Path
import argparse
import hashlib
import json
import os

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets/exploration/objects/bridges"
SUFFIXES = ("horizontal", "vertical", "diagonal_left", "diagonal_right")


def near_white(pixel, floor=232, spread=26):
    r, g, b, a = pixel
    return a >= 18 and min(r, g, b) >= floor and max(r, g, b)-min(r, g, b) <= spread


def clean_rgba(image):
    """Return a cleaned copy and recorded pixel-change totals, no geometry changes."""
    img = image.convert("RGBA")
    width, height = img.size
    original = list(img.getdata())
    pixels = list(original)
    count = width * height
    removed = set()
    # Eight-connected bright islands need not be separate alpha components:
    # extraction debris frequently touches genuine bridge stone by one pixel.
    white = bytearray(count)
    for i, p in enumerate(original):
        if near_white(p): white[i] = 1
    seen = bytearray(count)
    limit = min(12000, max(160, int(count * .035)))
    for start in range(count):
        if not white[start] or seen[start]:
            continue
        q = deque([start])
        seen[start] = 1
        component = []
        touch_clear = False
        bottom = 0
        minx, maxx, miny, maxy = width, 0, height, 0
        solid_contact = 0
        while q:
            i = q.popleft()
            x, y = i % width, i // width
            component.append(i)
            bottom += y >= int(height * .58)
            minx = min(minx, x); maxx = max(maxx, x)
            miny = min(miny, y); maxy = max(maxy, y)
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if not (dx or dy): continue
                    nx, ny = x + dx, y + dy
                    if nx < 0 or nx >= width or ny < 0 or ny >= height:
                        touch_clear = True
                        continue
                    j = ny * width + nx
                    if original[j][3] < 18:
                        touch_clear = True
                    elif not white[j] and original[j][3] >= 190 and min(original[j][:3]) < 205:
                        solid_contact += 1
                    if white[j] and not seen[j]:
                        seen[j] = 1
                        q.append(j)
        size = len(component)
        # Only strongly external lower-half WHITE fragments; retain white
        # highlights on planks and pale/white stones inside the object.
        isolated = size <= 180 and solid_contact == 0
        stain = (touch_clear and 3 <= size <= limit and bottom / size >= .80
                 and maxx - minx < width * .30 and maxy - miny < height * .24
                 and solid_contact <= size * .42)
        if isolated or stain:
            for i in component:
                pixels[i] = (*pixels[i][:3], 0)
                removed.add(i)
    # Exact white RGB leaks most noticeably in semi-transparent WebP pixels
    # around the opaque outline. Replace their white matte with the nearest
    # real opaque WOOD/STONE tone; do not erase or reshape the alpha contour.
    recolored = 0
    faded = 0
    for i, (r, g, b, a) in enumerate(original):
        if i in removed or a < 18 or a >= 210: continue
        if min(r, g, b) < 210 or max(r, g, b) - min(r, g, b) > 35: continue
        x, y = i % width, i // width
        exposed = False
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                nx, ny = x + dx, y + dy
                if nx < 0 or nx >= width or ny < 0 or ny >= height or pixels[ny * width + nx][3] < 18:
                    exposed = True
        if not exposed: continue
        color = None
        for distance in (1, 2, 3, 4):
            candidates = []
            for dy in range(-distance, distance + 1):
                for dx in range(-distance, distance + 1):
                    if max(abs(dx), abs(dy)) != distance: continue
                    nx, ny = x + dx, y + dy
                    if nx < 0 or nx >= width or ny < 0 or ny >= height: continue
                    p = original[ny * width + nx]
                    if p[3] >= 220 and min(p[:3]) < 200:
                        candidates.append(p)
            if candidates:
                color = tuple(round(sum(p[k] for p in candidates)/len(candidates)) for k in range(3))
                break
        if color:
            pixels[i] = (*color, a)
            recolored += 1
        elif any(((y + dy) * width + (x + dx)) in removed
                 for dy in (-1, 0, 1) for dx in (-1, 0, 1)
                 if 0 <= x + dx < width and 0 <= y + dy < height):
            pixels[i] = (r, g, b, round(a * .28))
            faded += 1
    changed = sum(a != b for a, b in zip(original, pixels))
    if changed > count * .065:
        raise ValueError(f"Safety gate: too many altered pixels ({changed}/{count})")
    if changed:
        img.putdata(pixels)
    return img, {"changed": changed, "removed": len(removed),
                 "recolored": recolored, "faded": faded, "width": width, "height": height}


def assets():
    paths = sorted(ASSETS.glob("bridge_*_2p5d_*.webp"))
    assert len(paths) == 28, f"Expected seven families × four views, got {len(paths)}"
    assert sorted(len([p for p in paths if f"_{view}_01" in p.name]) for view in SUFFIXES) == [7] * 4
    return paths


def run(apply=False):
    summary = []
    for path in assets():
        before = path.read_bytes()
        with Image.open(path) as input_image:
            cleaned, stats = clean_rgba(input_image)
            if apply and stats["changed"]:
                temp = path.with_suffix(".tmp.webp")
                cleaned.save(temp, "WEBP", lossless=True, quality=100, method=6, exact=True)
                with Image.open(temp) as restored:
                    assert restored.size == input_image.size, "size changed"
                    assert restored.mode in ("RGBA", "RGB"), "wrong WebP encoding"
                os.replace(temp, path)
        stats["file"] = path.name
        stats["sha256Before"] = hashlib.sha256(before).hexdigest()
        stats["sha256After"] = hashlib.sha256(path.read_bytes()).hexdigest()
        summary.append(stats)
    print(json.dumps({"mode":"APPLY" if apply else "AUDIT",
        "files":len(summary), "modified":sum(x["sha256Before"] != x["sha256After"] for x in summary),
        "pixels":sum(x["changed"] for x in summary),"details":summary},indent=2))
    return summary


def self_test():
    im = Image.new("RGBA", (90, 90), (0,0,0,0))
    for y in range(14, 58):
        for x in range(16, 75):
            im.putpixel((x,y),(94,66,49,255))
    im.putpixel((50,30),(250,250,246,255))  # legitimate plank highlight
    for y in range(72,77):
        for x in range(8,14):
            im.putpixel((x,y),(255,254,253,250))  # disconnected stain
    im.putpixel((15,33),(243,241,241,90))  # boundary white matte
    clean, stats = clean_rgba(im)
    assert stats["removed"] >= 30, stats
    assert clean.getpixel((50,30)) == (250,250,246,255)
    assert clean.getpixel((35,30)) == (94,66,49,255)
    assert clean.getpixel((9,73))[3] == 0
    assert clean.getpixel((15,33))[:3] != (243,241,241)
    assert clean.size == im.size
    print("V74 source alpha-clean self-test GREEN",stats)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply",action="store_true")
    parser.add_argument("--self-test",action="store_true")
    a = parser.parse_args()
    if a.self_test: self_test()
    else: run(apply=a.apply)
