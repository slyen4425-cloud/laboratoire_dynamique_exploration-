#!/usr/bin/env python3
"""Extract the 10 arena PNG and WebP sources byte-for-byte from the approved archive."""
import hashlib
import json
import struct
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ZIP = ROOT / "arenes_10_elements_monster_capture_png_transparents.zip"
CHECKSUM = "6cde858a912e99ad7be38ab444733bdd9d573949c8f19d5d453c0a22a617b191"
MANIFEST = ROOT / "assets/exploration/objects/buildings/manifest.v1.json"
OUT = ROOT / "assets/exploration/objects/buildings/arenas"
ELEMENTS = ("nature", "feu", "eau", "air", "terre", "foudre", "glace", "lumiere", "tenebres", "arcane")

def verify(data, filename):
    if filename.endswith(".png"):
        assert data[:8] == b"\x89PNG\r\n\x1a\n"
        assert data[12:16] == b"IHDR"
        assert struct.unpack(">II", data[16:24]) == (512, 512)
        assert data[25] == 6
    else:
        assert data[:4] == b"RIFF" and data[8:12] == b"WEBP", filename
        assert struct.unpack("<I", data[4:8])[0] + 8 == len(data), filename

def main():
    assert hashlib.sha256(ZIP.read_bytes()).hexdigest() == CHECKSUM, "Source ZIP changed"
    records = {r["assetId"]: r for r in json.loads(MANIFEST.read_text(encoding="utf8"))["files"]}
    OUT.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(ZIP) as z:
        assert z.testzip() is None, "Corrupt ZIP"
        for element in ELEMENTS:
            r = records[f"object.building.arena.element.{element}.01"]
            for extension in ("png", "webp"):
                name = f"arene_{element}_2p5d.{extension}"
                data = z.read(name)
                verify(data, name)
                if extension == "webp":
                    assert len(data) == r["bytes"], name + " size"
                    assert hashlib.sha256(data).hexdigest() == r["sha256"], name + " hash"
                target = OUT / name
                if target.exists():
                    assert target.read_bytes() == data, name + " existing file differs"
                else:
                    target.write_bytes(data)
                print(name, len(data))
    assert len(list(OUT.glob("*.png"))) == 10
    assert len(list(OUT.glob("*.webp"))) == 10

if __name__ == "__main__":
    main()
