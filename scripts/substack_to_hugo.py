#!/usr/bin/env python3
"""
substack_to_hugo.py

Fetches your Substack RSS feed and converts any posts that aren't
already in your Hugo site into proper Hugo markdown files, downloading
any images locally so the post doesn't depend on Substack's CDN.

USAGE:
    python substack_to_hugo.py

CONFIGURE ME:
    Edit the CONFIG block below (or set the equivalent environment
    variables, which take priority — useful for GitHub Actions).
"""

import os
import re
import hashlib
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

import feedparser
import requests
from markdownify import markdownify as html_to_md
from slugify import slugify

# ---------------------------------------------------------------------------
# CONFIG — edit these to match your setup
# ---------------------------------------------------------------------------

# Your Substack RSS feed URL. Find it at: https://YOURNAME.substack.com/feed
SUBSTACK_FEED_URL = os.environ.get(
    "SUBSTACK_FEED_URL",
    "https://YOURNAME.substack.com/feed",  # <-- CHANGE THIS
)

# Where Hugo content files should be written, relative to repo root.
CONTENT_DIR = Path(os.environ.get("HUGO_CONTENT_DIR", "content/blog"))

# Where downloaded images should be saved, relative to repo root.
# Hugo serves anything under /static/ at the site root, so an image saved
# to static/images/blog/foo.jpg is reachable at /images/blog/foo.jpg —
# matching your existing cover_image convention (e.g. "/images/blog/gdocs.png").
IMAGES_DIR = Path(os.environ.get("HUGO_IMAGES_DIR", "static/images/blog"))
IMAGES_URL_PREFIX = os.environ.get("HUGO_IMAGES_URL_PREFIX", "/images/blog")

# Fallback emoji per tag, used to fill the "emoji" frontmatter field.
# Add more mappings as your tags evolve — anything unmatched falls back
# to DEFAULT_EMOJI below.
TAG_EMOJI = {
    "tech": "\U0001F4BB",
    "distributed systems": "\U0001F310",
    "engineering": "\U0001F4DD",
    "ml": "\U0001F9E0",
    "machine learning": "\U0001F9E0",
    "ai": "\U0001F916",
    "systems": "\U0001F5A5\uFE0F",
    "research": "\U0001F52C",
    "psychology": "\U0001F9E0",
    "neuroscience": "\U0001F9E0",
}
DEFAULT_EMOJI = "\U0001F4C4"  # generic page emoji — edit the post after sync if you want a better fit

# Set to True the first time you run this if you want ALL existing
# Substack posts imported. After that, leave as-is — the script only
# adds posts it hasn't seen before (tracked via frontmatter substack_id).
IMPORT_ALL = os.environ.get("IMPORT_ALL", "false").lower() == "true"

# ---------------------------------------------------------------------------


def slugify_title(title: str) -> str:
    return slugify(title)[:80]


def already_synced(substack_id: str) -> bool:
    """Check if a post with this substack_id already has a markdown file."""
    if not CONTENT_DIR.exists():
        return False
    for md_file in CONTENT_DIR.glob("*.md"):
        try:
            text = md_file.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        if f'substack_id: "{substack_id}"' in text:
            return True
    return False


def download_image(url: str, post_slug: str) -> str:
    """
    Download an image referenced in the post body, save it locally,
    and return the new local path to use in the markdown.
    """
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    # Build a stable, collision-safe filename from the URL.
    parsed = urlparse(url)
    ext = os.path.splitext(parsed.path)[1] or ".jpg"
    if len(ext) > 5 or "?" in ext:  # guard against garbage extensions
        ext = ".jpg"
    url_hash = hashlib.sha1(url.encode("utf-8")).hexdigest()[:10]
    filename = f"{post_slug}-{url_hash}{ext}"
    local_path = IMAGES_DIR / filename

    if not local_path.exists():
        try:
            resp = requests.get(url, timeout=20)
            resp.raise_for_status()
            local_path.write_bytes(resp.content)
        except requests.RequestException as e:
            print(f"  ! Failed to download image {url}: {e}")
            return url  # fall back to original URL rather than break the post

    return f"{IMAGES_URL_PREFIX}/{filename}"


def process_images(markdown_body: str, post_slug: str) -> tuple[str, list[str]]:
    """
    Find markdown image references, replace remote URLs with local ones,
    and return (updated_body, list_of_local_image_urls_in_order).
    The first entry becomes the post's cover_image.
    """
    local_urls = []

    def replace(match):
        alt_text, url = match.group(1), match.group(2)
        if url.startswith(("http://", "https://")):
            local_url = download_image(url, post_slug)
            local_urls.append(local_url)
            print(f"  - image: {url} -> {local_url}")
            return f"![{alt_text}]({local_url})"
        return match.group(0)

    updated_body = re.sub(r"!\[([^\]]*)\]\((https?://[^\)]+)\)", replace, markdown_body)
    return updated_body, local_urls


def pick_emoji(tags: list[str]) -> str:
    for tag in tags:
        match = TAG_EMOJI.get(tag.lower().strip())
        if match:
            return match
    return DEFAULT_EMOJI


def build_frontmatter(entry, slug: str, cover_image: str) -> str:
    title = entry.title.replace('"', "'")
    published = datetime(*entry.published_parsed[:6]) if hasattr(entry, "published_parsed") else datetime.now()
    date_str = published.strftime("%Y-%m-%d")  # matches your existing posts: date: 2026-02-17 (no time)
    summary = getattr(entry, "summary", "")
    # Strip HTML tags roughly for a plain-text description
    description = re.sub("<[^<]+?>", "", summary).strip().replace('"', "'")[:200]

    # Substack RSS entries expose categories as entry.tags (list of FeedParserDict)
    tags = [t.term for t in getattr(entry, "tags", [])] or ["substack"]
    emoji = pick_emoji(tags)
    tags_str = ", ".join(f'"{t}"' for t in tags)

    lines = [
        "---",
        f'title: "{title}"',
        f"date: {date_str}",
        f'description: "{description}"',
        f'cover_image: "{cover_image}"',
        f'emoji: "{emoji}"',
        f"tags: [{tags_str}]",
        "draft: false",
        f'substack_id: "{entry.id if hasattr(entry, "id") else entry.link}"',  # hidden dedupe key, harmless extra field
        "---",
        "",
    ]
    return "\n".join(lines)


def main():
    print(f"Fetching feed: {SUBSTACK_FEED_URL}")
    feed = feedparser.parse(SUBSTACK_FEED_URL)

    if feed.bozo and not feed.entries:
        print("Could not parse feed. Check the URL and try again.")
        return

    CONTENT_DIR.mkdir(parents=True, exist_ok=True)

    new_count = 0
    for entry in feed.entries:
        entry_id = entry.id if hasattr(entry, "id") else entry.link

        if not IMPORT_ALL and already_synced(entry_id):
            continue

        slug = slugify_title(entry.title)
        filepath = CONTENT_DIR / f"{slug}.md"

        # Get the full HTML body — Substack usually puts it in content[0].value,
        # falling back to summary if not present.
        if hasattr(entry, "content") and entry.content:
            html_body = entry.content[0].value
        else:
            html_body = entry.summary

        markdown_body = html_to_md(html_body, heading_style="ATX")
        markdown_body, local_image_urls = process_images(markdown_body, slug)
        cover_image = local_image_urls[0] if local_image_urls else ""

        frontmatter = build_frontmatter(entry, slug, cover_image)

        filepath.write_text(frontmatter + markdown_body.strip() + "\n", encoding="utf-8")
        print(f"+ Wrote {filepath}")
        new_count += 1

    if new_count == 0:
        print("No new posts. Everything's already synced.")
    else:
        print(f"\nDone — {new_count} new post(s) added.")


if __name__ == "__main__":
    main()
