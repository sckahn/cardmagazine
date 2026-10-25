#!/usr/bin/env python3
"""Stitch each issue's card PNGs into one tall image (width 1080).

Folder convention mirrors build_pdfs.py:
- AI × Series:  {N}-outputs-{name}/*.png            → full/series-{NN}-{name}.png
- AI Chronicle: chronicle-{N}-outputs-{name}/*.png  → full/chronicle-{NN}-{name}.png
- AI Frontier:  atlas-{N}-outputs-{name}/*.png      → full/atlas-{NN}-{name}.png

Uses ImageMagick (`convert -append`). Cards are 1080px wide, so the
stitched image stays 1080 wide and grows vertically, one card after
another with no gaps.

Usage:
  python3 stitch.py            # all issues
  python3 stitch.py dream      # one issue (any track, by name)
"""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "full"

TRACKS = [
    ("series", re.compile(r"(\d+)-outputs-(.+)")),
    ("chronicle", re.compile(r"chronicle-(\d+)-outputs-(.+)")),
    ("atlas", re.compile(r"atlas-(\d+)-outputs-(.+)")),
]


def collect():
    found = []
    for d in sorted(ROOT.iterdir()):
        if not d.is_dir():
            continue
        for track, pat in TRACKS:
            if track == "series" and (d.name.startswith("chronicle-") or d.name.startswith("atlas-")):
                continue
            m = pat.fullmatch(d.name)
            if m:
                found.append((track, int(m.group(1)), m.group(2), d))
                break
    return found


def stitch(track: str, num: int, name: str, d: Path) -> bool:
    pngs = sorted(p for p in d.glob("*.png"))
    if not pngs:
        print(f"! no PNGs in {d.name}")
        return False
    target = OUT / f"{track}-{num:02d}-{name}.png"
    cmd = ["convert", *[str(p) for p in pngs], "-append", str(target)]
    subprocess.run(cmd, check=True)
    print(f"  · {target.name} ({len(pngs)} cards)")
    return True


def main() -> int:
    only = sys.argv[1] if len(sys.argv) > 1 else None
    OUT.mkdir(exist_ok=True)
    n = 0
    for track, num, name, d in collect():
        if only and name != only:
            continue
        if stitch(track, num, name, d):
            n += 1
    print(f"✓ {n} issue(s) stitched → {OUT.name}/")
    return 0 if n else 1


if __name__ == "__main__":
    raise SystemExit(main())
