#!/usr/bin/env python3
"""Read-only original author ZIP audit. Never extracts into site or source."""
import json, zipfile, pathlib, re, collections
packs = [
  "gensrpg_monster_capture_lot_1_6_heros_decoupes.zip",
  "GenSRPG_heros_lot2_A_heros_07_08_09.zip",
  "GenSRPG_heros_lot2_B_heros_10_11_12.zip",
]
records=[]
for name in packs:
    source=pathlib.Path(name)
    if not source.is_file():
        raise SystemExit("MISSING_AUTHOR_ZIP "+name)
    with zipfile.ZipFile(source) as archive:
        all_entries=archive.infolist()
        files=[e for e in all_entries if not e.is_dir()]
        if any(".." in pathlib.PurePosixPath(i.filename).parts or i.filename.startswith("/") for i in files):
            raise SystemExit("UNSAFE_AUTHOR_ZIP "+name)
        if any(i.file_size > 25_000_000 for i in files):
            raise SystemExit("EXCESSIVE_HERO_FILE "+name)
        entries=[]
        for member in files:
            entries.append(dict(path=member.filename, bytes=member.file_size,
                                type=pathlib.PurePosixPath(member.filename).suffix.lower()))
        total=sum(e.file_size for e in files)
        by_type=dict(collections.Counter(e["type"] for e in entries))
        print("\nPACKAGE",name,"size",source.stat().st_size,"total_decompressed",total,
              "files",len(files),"extensions",by_type)
        for entry in entries[:350]:
            print("FILE",entry["bytes"],entry["path"])
        if len(entries)>350:print("MORE_FILES",len(entries)-350)
        records.append(dict(archive=name,sourceBytes=source.stat().st_size,
                            extractedBytes=total,entries=entries))
pathlib.Path("/tmp/exploration-hero-source-audit.json").write_text(json.dumps(records,indent=2,ensure_ascii=False))
print("AUDIT_COMPLETE source packs:",len(records),"files:",sum(len(x["entries"]) for x in records))
