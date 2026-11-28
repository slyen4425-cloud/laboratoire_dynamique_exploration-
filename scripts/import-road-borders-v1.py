#!/usr/bin/env python3
"""Validate the original ZIP and explicitly extract only runtime WebP files.
No dependency, no modification of existing files, no publication."""
import argparse
import hashlib
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
ZIP_NAME = "Genesis_Bordures_Routes_v1.zip"
SOURCE_BLOB = "a46b5327fe6c59b38afde0c69d77e02f881c86a6"
PREFIX = "Genesis_Bordures_Routes_v1/runtime_webp/"
DEST = ROOT / "assets/exploration/materials/road-borders"
BANDS = ("naturelle", "cailloux", "pierre_taillee", "beton", "bois", "neige")
EXPECTED = {f"bandes/bordure_{name}.webp": (512, 128) for name in BANDS}
EXPECTED.update({f"sprites_cailloux/caillou_{i:02}.webp": (128, 128) for i in range(1, 9)})

def validate():
    archive = ROOT / ZIP_NAME
    raw = archive.read_bytes()
    blob = hashlib.sha1(f"blob {len(raw)}\0".encode() + raw).hexdigest()
    if blob != SOURCE_BLOB:
        raise ValueError("ZIP source différent du dépôt auteur validé")
    output = {}
    with zipfile.ZipFile(archive) as z:
        if z.testzip():
            raise ValueError("CRC ZIP invalide")
        actual = [n[len(PREFIX):] for n in z.namelist() if n.startswith(PREFIX) and not n.endswith("/")]
        if sorted(actual) != sorted(EXPECTED):
            raise ValueError("Inventaire runtime inattendu")
        for name, size in EXPECTED.items():
            data = z.read(PREFIX + name)
            if len(data) < 25 or data[:4] != b"RIFF" or data[8:16] != b"WEBPVP8L" or data[20] != 0x2f:
                raise ValueError(f"WebP lossless attendu : {name}")
            bits = int.from_bytes(data[21:25], "little")
            dimensions = ((bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1)
            if dimensions != size or not ((bits >> 28) & 1):
                raise ValueError(f"Dimensions ou alpha invalides : {name}")
            output[name] = data
    return output

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--install", action="store_true", help="Extraire les WebP dans leur emplacement candidat")
    args = parser.parse_args()
    output = validate()
    if args.install:
        for name, data in output.items():
            dest = DEST / name
            if dest.exists() and dest.read_bytes() != data:
                raise FileExistsError(f"Refus d'écraser un asset différent : {dest}")
        for name, data in output.items():
            dest = DEST / name
            dest.parent.mkdir(parents=True, exist_ok=True)
            if not dest.exists():
                dest.write_bytes(data)
    print(f"{len(output)} WebP validés, {sum(map(len, output.values()))} octets; installation={args.install}")

if __name__ == "__main__":
    main()
