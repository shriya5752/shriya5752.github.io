# Shriya's site

A tiny pastel desktop you can poke around in: a blog, semester notes, an about window, a doodle board and a mascot.
It is **plain files** (HTML, CSS, JavaScript). No Hugo, no framework, nothing to install to run it, so there is nothing that can break at build time.

```
site/       <- the website itself. This is the only folder that gets published.
content/    <- your blog posts (markdown) and extra files
data/       <- semester notes (notes.yaml) and your profile text (profile.yaml)
static/     <- images used by your posts
scripts/    <- helper scripts (you only run them through update.bat)
```

## See it on your computer

Double-click **`preview.bat`**. It opens http://localhost:8765/ in your browser. (Opening `site/index.html` by double-click does **not** work, because browsers block scripts on files.) Close the black window to stop it.

## Edit things

Every change is: **edit a file, save, double-click `update.bat`**, then publish (below).

| I want to change... | Edit this |
|---|---|
| my bio, links, email, the Say hi text | `data/profile.yaml` |
| a semester's tips, subjects or Drive links | `data/notes.yaml` |
| add or edit a blog post | `content/blog/` (one `.md` file per post, see below) |
| the big "hi, i'm shriya" text, the note-to-self, the tiles | `site/index.html` (plain words between tags) |
| colors of a theme | `site/js/theme.js` (the `THEMES` list at the top) |

### Add a blog post

Create `content/blog/my-post.md` like this, then run `update.bat`:

```
---
title: "my new post"
date: 2026-11-01
description: "one line about it"
cover_image: "/images/blog/my-cover.png"
emoji: "📝"
tags: ["tech"]
---

Write your post here. **bold**, *italic*, lists, and `code` all work.
```

Put images in `static/images/blog/` and refer to them as `![](/images/blog/pic.png)`.
Posts from your Substack are copied in automatically (see "Substack" below).

## Publish

The site is published from the **`site/`** folder. After `update.bat`, save your changes and push them to GitHub (GitHub Desktop: *Commit to main*, then *Push origin*).

### On Vercel (recommended)

1. Push this repo to GitHub.
2. On vercel.com choose **Add New > Project**, import the repo, and press **Deploy**. Leave every setting alone: `vercel.json` already tells Vercel to publish `site/` and run no build.
3. From then on, every push to `main` updates the live site in about 20 seconds.

### On Netlify

Already connected? `netlify.toml` tells Netlify to publish `site/` with no build, so nothing else to set up.

### On GitHub Pages instead

Repo **Settings > Pages > Source: GitHub Actions**. The included workflow publishes `site/` on every push.

## Substack

`.github/workflows/substack-sync.yml` checks your newsletter once a day and copies new posts into `content/blog/`, then rebuilds and commits them. It needs nothing from you (it uses your public feed). To disable it, delete that file.

## If something looks wrong

* **Old version showing in the browser:** press **Ctrl+Shift+R**.
* **Animations missing:** your computer may be set to reduce motion. Open *Settings* in the little desktop and set *animations* to *always on*, or add `?motion=full` to the address once.
* **A post or note is missing:** run `update.bat` again and read its last lines for a message.
* **Want the old version back?** Everything is saved in git: the tag `checkpoint-before-cleanup` is the site as it was before the old Hugo files were removed.
