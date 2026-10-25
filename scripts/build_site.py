#!/usr/bin/env python3
"""
build_site.py

Turns the markdown posts in content/blog, the semester notes in
data/notes.yaml and your profile text into plain JSON under site/data/, and copies images into
site/images. The site itself (site/) is static HTML/CSS/JS with no build
framework, so this is the only build step.

USAGE:
    pip install markdown pyyaml
    python scripts/build_site.py
"""

import html
import json
import re
import shutil
from pathlib import Path

import markdown
import yaml

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
POSTS_DIR = ROOT / "content" / "blog"
IMAGES_SRC = ROOT / "static" / "images"

MD_EXTENSIONS = ["fenced_code", "tables", "sane_lists", "md_in_html"]

FRONT_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n(.*)$", re.S)


def render(md_text: str) -> str:
    return markdown.markdown(md_text, extensions=MD_EXTENSIONS)


def build_ml_overview() -> None:
    """The ML map post embeds a big interactive widget. Ship it as its own
    page and iframe it, instead of inlining 33 KB of CSS into the reader."""
    src = ROOT / "content" / "embeds" / "ml-overview.html"
    if not src.exists():
        return
    body = src.read_text(encoding="utf-8")
    # drop the Google Fonts @import (falls back to system fonts) and the
    # full-viewport breakout hack, which only made sense inside the old theme
    body = re.sub(r"@import url\([^)]*\);", "", body)
    page = (
        "<!doctype html><html><head><meta charset='utf-8'>"
        "<meta name='viewport' content='width=device-width,initial-scale=1'>"
        "<title>machine learning overview</title>"
        "<style>body{margin:0;background:#fff;font-family:system-ui,sans-serif}"
        ".mlov-breakout{width:auto!important;left:0!important;right:0!important;"
        "margin:0!important}</style></head><body>" + body + "</body></html>"
    )
    out = SITE / "embeds"
    out.mkdir(parents=True, exist_ok=True)
    (out / "ml-overview.html").write_text(page, encoding="utf-8")


def build_posts() -> list[dict]:
    posts = []
    for path in sorted(POSTS_DIR.glob("*.md")):
        if path.name.startswith("_"):
            continue
        m = FRONT_RE.match(path.read_text(encoding="utf-8"))
        if not m:
            continue
        meta = yaml.safe_load(m.group(1)) or {}
        if meta.get("draft"):
            continue
        body = m.group(2)
        body = body.replace(
            "{{< ml-overview >}}",
            '<iframe class="embed" src="embeds/ml-overview.html" '
            'loading="lazy" title="machine learning overview"></iframe>',
        )
        words = len(re.findall(r"\w+", body))
        # file stems like first_post1 are ugly; use a slug from the title
        slug = re.sub(r"[^a-z0-9]+", "-", str(meta["title"]).lower()).strip("-")[:60]
        cover = str(meta.get("cover_image") or "").lstrip("/")
        tags = [t for t in (meta.get("tags") or []) if t != "substack"]
        posts.append(
            {
                "slug": slug,
                "title": html.unescape(str(meta["title"])),
                "date": str(meta.get("date")),
                "description": html.unescape(str(meta.get("description") or "")),
                "emoji": meta.get("emoji") or "",
                "cover": cover,
                "tags": tags,
                "minutes": max(1, round(words / 220)),
                "url": meta.get("substack_id") or "",
                "html": render(body),
            }
        )
    posts.sort(key=lambda p: p["date"], reverse=True)
    return posts


def build_notes() -> list[dict]:
    data = yaml.safe_load((ROOT / "data" / "notes.yaml").read_text(encoding="utf-8"))
    sems = []
    for s in data["semesters"]:
        sems.append(
            {
                "name": s["name"],
                "slug": s["slug"],
                "year": s.get("year"),
                "drive": s.get("drive_link"),
                "tips": render(s.get("tips", "")),
                "subjects": [
                    {"name": x["name"], "drive": x.get("drive_url")}
                    for x in s.get("subjects_list", [])
                ],
            }
        )
    return sems


def main() -> None:
    (SITE / "data").mkdir(parents=True, exist_ok=True)
    build_ml_overview()

    posts = build_posts()
    (SITE / "data" / "posts.json").write_text(
        json.dumps(posts, ensure_ascii=False), encoding="utf-8"
    )
    notes = build_notes()
    (SITE / "data" / "notes.json").write_text(
        json.dumps(notes, ensure_ascii=False), encoding="utf-8"
    )

    profile_src = ROOT / "data" / "profile.yaml"
    if profile_src.exists():
        profile = yaml.safe_load(profile_src.read_text(encoding="utf-8")) or {}
        (SITE / "data" / "profile.json").write_text(
            json.dumps(profile, ensure_ascii=False), encoding="utf-8"
        )

    if IMAGES_SRC.exists():
        shutil.copytree(IMAGES_SRC, SITE / "images", dirs_exist_ok=True)
    pdf = ROOT / "content" / "files" / "afll.pdf"
    if pdf.exists():
        (SITE / "files").mkdir(exist_ok=True)
        shutil.copy2(pdf, SITE / "files" / "afll.pdf")

    print(f"built {len(posts)} posts, {len(notes)} semesters")


if __name__ == "__main__":
    main()
