#!/usr/bin/env python3
"""V74: reconcile content hashes/lengths of 28 updated source WebP assets.

Never modify the four legacy bridges or semantic ObjectDefinition metadata.
Run --write after source cleanup. Default --audit checks the committed manifest.
"""
import argparse
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT / "assets/exploration/objects/bridges/manifest.v1.json"

def main(write=False):
    source=MANIFEST.read_text(encoding="utf-8")
    obj=json.loads(source)
    assert obj["schemaVersion"] == 1 and len(obj["files"]) == 32
    modified=0
    native=0
    for item in obj["files"]:
        if "_2p5d." not in item["assetId"]: continue
        native+=1
        file=ROOT / item["path"]
        data=file.read_bytes()
        assert data[:4] == b"RIFF" and data[8:12] == b"WEBP"
        assert data[12:16] == b"VP8L", f"V74 must keep lossless WebP: {file}"
        assert int.from_bytes(data[4:8],"little")+8 == len(data)
        digest=hashlib.sha256(data).hexdigest()
        if write:
            item["sha256"]=digest
            item["bytes"]=len(data)
            item["runtimeProfile"]="mobile-webp-512x512-lossless-v74"
            modified+=1
        else:
            assert item["sha256"] == digest, f"manifest SHA mismatch {file.name}"
            assert item["bytes"] == len(data), f"manifest size mismatch {file.name}"
    assert native == 28, f"expected 28 native WebP entries, got {native}"
    if write:
        obj["assetCleanup"]={"revision":"v74","format":"WebP lossless RGBA",
                             "scope":"28 native 2.5D bridges only",
                             "legacyFilesUnchanged":4}
        MANIFEST.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("V74 manifest", "REWRITTEN" if write else "AUDITED",native,
          "source files; legacy bridge records unchanged")

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--write",action="store_true")
    main(write=p.parse_args().write)
