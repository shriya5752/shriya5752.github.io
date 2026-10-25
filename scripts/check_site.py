#!/usr/bin/env python3
"""Checks that every file the site refers to actually exists (images, fonts, scripts, styles, links).

USAGE:
    python scripts/check_site.py
Prints "all good" or a list of broken references. Safe to run any time.
"""

import json
import re
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent / "site"
SKIP = ("http:", "https:", "mailto:", "data:", "tel:", "//", "javascript:")
missing = []


def check(ref: str, source: str, base: Path) -> None:
    ref = ref.split("#")[0].split("?")[0]
    if not ref or ref.startswith(SKIP) or "${" in ref:
        return
    target = SITE / ref.lstrip("/") if ref.startswith("/") else base / ref
    if not target.resolve().exists():
        missing.append((source, ref))


for f in SITE.rglob("*"):
    if f.suffix not in (".html", ".css", ".js") or not f.is_file():
        continue
    text = f.read_text(encoding="utf-8")
    rel = f.relative_to(SITE).as_posix()
    for pattern in (r'(?:src|href)="([^"]+)"', r"url\(['\"]?([^'\")]+)", r'from "(\./[^"]+)"', r'import "(\./[^"]+)"'):
        for m in re.finditer(pattern, text):
            check(m.group(1), rel, f.parent)

# images and links inside the generated posts and notes
for name in ("posts", "notes"):
    data = json.loads((SITE / "data" / f"{name}.json").read_text(encoding="utf-8"))
    items = data if isinstance(data, list) else []
    for item in items:
        blob = json.dumps(item)
        for m in re.finditer(r'(?:src|href)=\\"([^"\\]+)\\"', blob):
            check(m.group(1), f"data/{name}.json", SITE)
        if name == "posts" and item.get("cover"):
            check("/" + item["cover"], f"cover of '{item['title']}'", SITE)

for key in ("posts", "notes", "profile"):
    if not (SITE / "data" / f"{key}.json").exists():
        missing.append(("data", f"{key}.json (run update.bat)"))

if missing:
    print("broken references:")
    for src, ref in missing:
        print(f"  {src}  ->  {ref}")
    raise SystemExit(1)

files = [f for f in SITE.rglob("*") if f.is_file()]
print(f"all good: {len(files)} files, {sum(f.stat().st_size for f in files) / 1e6:.1f} MB, no broken references")
