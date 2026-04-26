#!/usr/bin/env python3
"""Detect faces in portrait images and auto-adjust `object-position` in card HTMLs.

Why:
  When a portrait is cropped with `object-fit: cover` + fixed height, the default
  `object-position: center top` often cuts off the subject's face. This script
  detects the face in each image and rewrites the CSS so the face sits centered
  in the visible area.

Usage:
  python3 fix_face_crop.py [--dry-run] [--series <name>]

Requires: opencv-python, Pillow
  pip3 install --break-system-packages opencv-python
"""
import argparse
import glob
import os
import re
import sys

try:
    import cv2
except ImportError:
    sys.exit("! pip3 install --break-system-packages opencv-python")

ROOT = os.path.dirname(os.path.abspath(__file__))
IMAGES_DIR = os.path.join(ROOT, "images")


def detect_faces() -> dict[str, float]:
    """Return {image_name: face_center_y_percent}."""
    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    out = {}
    for name in os.listdir(IMAGES_DIR):
        if not name.lower().endswith((".jpg", ".jpeg", ".png")):
            continue
        img = cv2.imread(os.path.join(IMAGES_DIR, name))
        if img is None:
            continue
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = cascade.detectMultiScale(gray, 1.1, 4, minSize=(40, 40))
        if len(faces) == 0:
            continue
        fx, fy, fw, fh = max(faces, key=lambda f: f[2] * f[3])
        out[name] = (fy + fh / 2) / img.shape[0] * 100
    return out


def recommend_y(face_pct: float) -> int:
    """Map face center Y% in source image to object-position Y% that shows it."""
    if face_pct < 25:
        return 0
    if face_pct > 75:
        return 100
    y = (face_pct - 20) / 0.55
    return max(0, min(100, round(y)))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="print recommendations only")
    ap.add_argument("--series", help="limit to a single series name (e.g. bias)")
    args = ap.parse_args()

    face_y = detect_faces()
    rec = {name: recommend_y(y) for name, y in face_y.items()}

    if args.dry_run:
        print("Face center Y% → recommended object-position:")
        for name in sorted(face_y):
            print(f"  {name:30} face@{face_y[name]:5.1f}%  → center {rec[name]}%")
        return 0

    pattern_glob = (
        f"{ROOT}/*-cards-{args.series}/*.html" if args.series else f"{ROOT}/*-cards-*/*.html"
    )
    changed = 0
    for html_path in glob.glob(pattern_glob):
        with open(html_path) as f:
            content = f.read()
        orig = content
        for name, y_rec in rec.items():
            pattern = (
                rf'(src="[^"]*images/{re.escape(name)}"[^>]*object-fit:\s*cover[^"]*?)'
                rf'object-position:\s*center\s+(?:top|bottom|center|\d+%?)'
            )
            content = re.sub(pattern, rf"\1object-position:center {y_rec}%", content)
        if content != orig:
            with open(html_path, "w") as f:
                f.write(content)
            changed += 1
            print(f"updated {os.path.relpath(html_path, ROOT)}")
    print(f"\n✓ {changed} file(s) updated. Run `python3 capture.py <series>` to regenerate PNGs.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
