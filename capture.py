#!/usr/bin/env python3
"""Card news PNG capture via Playwright.

Folder convention: <N>-cards-<name>/*.html -> <N>-outputs-<name>/*.png
N = series index (1 philosophy, 2 taste, 3 vibe, 4 loop, 5 canvas, 6 aura,
7 rhythm, 8 dream, ...).

Usage:
  python3 capture.py <name>              # e.g. dream  -> captures 8-cards-dream/*
  python3 capture.py <name> <slide>      # single slide (e.g. dream 02-dick)
  python3 capture.py --all               # capture every numbered series
"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
VIEWPORT = {"width": 1080, "height": 1080}
DEVICE_SCALE = 1


def find_cards_dir(name: str) -> Path | None:
    """Look for <N>-cards-<name> (any prefix number)."""
    matches = sorted(ROOT.glob(f"*-cards-{name}"))
    if matches:
        return matches[0]
    legacy = ROOT / f"cards-{name}"
    return legacy if legacy.is_dir() else None


def output_dir_for(cards_dir: Path) -> Path:
    """Map <N>-cards-<name> -> <N>-outputs-<name>."""
    stem = cards_dir.name
    if stem.startswith("cards-"):
        return ROOT / stem.replace("cards-", "outputs-", 1)
    # <N>-cards-<name>
    parts = stem.split("-", 2)
    if len(parts) == 3 and parts[1] == "cards":
        return ROOT / f"{parts[0]}-outputs-{parts[2]}"
    raise ValueError(f"Unrecognized cards dir: {cards_dir}")


def capture(htmls: list[Path], out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport=VIEWPORT, device_scale_factor=DEVICE_SCALE)
        page = ctx.new_page()
        for html in htmls:
            target = out_dir / f"{html.stem}.png"
            page.goto(html.as_uri(), wait_until="networkidle", timeout=15_000)
            page.evaluate("document.fonts.ready")
            page.wait_for_timeout(200)
            page.screenshot(path=str(target), clip={"x": 0, "y": 0, **VIEWPORT}, omit_background=False)
            print(f"  · {target.name}")
        browser.close()


def run_series(cards_dir: Path, slide: str | None = None) -> int:
    out_dir = output_dir_for(cards_dir)
    if slide:
        htmls = [cards_dir / f"{slide}.html"]
        if not htmls[0].exists():
            print(f"! not found: {htmls[0]}")
            return 3
    else:
        htmls = sorted(cards_dir.glob("*.html"))
    print(f"▶ {len(htmls)} card(s) · {cards_dir.name} → {out_dir.name}")
    capture(htmls, out_dir)
    return 0


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    if sys.argv[1] == "--all":
        for cards_dir in sorted(ROOT.glob("*-cards-*")):
            run_series(cards_dir)
        print("✓ all done")
        return 0
    name = sys.argv[1]
    cards_dir = find_cards_dir(name)
    if cards_dir is None:
        print(f"! not found: *-cards-{name}")
        return 2
    slide = sys.argv[2] if len(sys.argv) >= 3 else None
    rc = run_series(cards_dir, slide)
    if rc == 0:
        print("✓ done")
    return rc


if __name__ == "__main__":
    raise SystemExit(main())
