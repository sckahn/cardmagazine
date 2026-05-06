#!/usr/bin/env python3
"""각 호의 1080×1080 PNG들을 호별로 PDF 1개씩 합쳐 output-pdf/에 저장.

대상:
- AI × Series:    {N}-outputs-{name}/*.png   → output-pdf/series-{NN}-{name}.pdf
- AI Chronicle:   chronicle-{N}-outputs-{name}/*.png → output-pdf/chronicle-{NN}-{name}.pdf
"""
from pathlib import Path
from PIL import Image
import re

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "output-pdf"
OUT.mkdir(exist_ok=True)


def collect_dirs():
    """모든 outputs 폴더를 모아 (track, num, name, path) 튜플로 반환."""
    items = []
    for d in sorted(ROOT.iterdir()):
        if not d.is_dir():
            continue
        # series: {N}-outputs-{name}
        m = re.fullmatch(r"(\d+)-outputs-(.+)", d.name)
        if m:
            items.append(("series", int(m.group(1)), m.group(2), d))
            continue
        # chronicle: chronicle-{N}-outputs-{name}
        m = re.fullmatch(r"chronicle-(\d+)-outputs-(.+)", d.name)
        if m:
            items.append(("chronicle", int(m.group(1)), m.group(2), d))
    return items


def make_pdf(track: str, num: int, name: str, src_dir: Path):
    pngs = sorted(src_dir.glob("*.png"))
    if not pngs:
        print(f"  · skip {src_dir.name} (no png)")
        return None
    imgs = [Image.open(p).convert("RGB") for p in pngs]
    nn = f"{num:02d}"
    fname = f"{track}-{nn}-{name}.pdf"
    out_path = OUT / fname
    imgs[0].save(
        out_path,
        save_all=True,
        append_images=imgs[1:],
        resolution=150.0,
        title=f"{track} {nn} · {name}",
    )
    size_kb = out_path.stat().st_size // 1024
    print(f"  ✓ {fname} ({len(pngs)}p, {size_kb} KB)")
    return out_path


def main():
    items = collect_dirs()
    print(f"▶ {len(items)} sections found")
    by_track = {}
    for track, num, name, d in items:
        by_track.setdefault(track, []).append((num, name, d))
    for track in ("chronicle", "series"):
        if track not in by_track:
            continue
        print(f"\n— {track} —")
        for num, name, d in sorted(by_track[track]):
            make_pdf(track, num, name, d)
    print(f"\n✓ done · {OUT}")


if __name__ == "__main__":
    main()
