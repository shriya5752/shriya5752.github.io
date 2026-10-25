import { icon } from "./icons.js";
import { openWindow, getWindow, closeWindow, focus } from "./wm.js";
import { THEMES, prefs, applyTheme, applyCrt, savePrefs } from "./theme.js";

const LINKS = {
  substack: "https://nerdingoutwithshriya.substack.com",
  medium: "https://medium.com/@shriyamoh1362",
  linkedin: "https://www.linkedin.com/in/shriya-moh/",
  youtube: "https://youtube.com/@shriya_moh",
  github: "https://github.com/shriya5752",
  email: "mailto:shriyamoh1362@gmail.com",
};

// ---------- helpers ----------
const cache = {};
export const load = (name) =>
  (cache[name] ??= fetch(`data/${name}.json`).then((r) => {
    if (!r.ok) throw new Error(name + " " + r.status);
    return r.json();
  }));

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const setRoute = (p) => { try { history.replaceState(null, "", p ? "#" + p : location.pathname + location.search); } catch { /* ignore */ } };
const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).toLowerCase();

function externalLinks(root) {
  root.querySelectorAll("a[href^='http']").forEach((a) => { a.target = "_blank"; a.rel = "noopener noreferrer"; });
  root.querySelectorAll("img").forEach((i) => { i.loading = "lazy"; });
}

// ---------- app registry ----------
export const APPS = {
  terminal: { title: "terminal", icon: "term", label: "terminal", w: 660, h: 430, render: terminalApp },
  blog: { title: "blog.exe", icon: "doc", label: "blog", w: 880, h: 560, render: blogApp },
  notes: { title: "notes - my computer", icon: "folder", label: "notes", w: 800, h: 520, render: notesApp },
  about: { title: "about_me.txt", icon: "face", label: "about me", w: 640, h: 500, render: aboutApp },
  settings: { title: "control panel", icon: "monitor", label: "settings", w: 520, h: 430, render: settingsApp },
};

export function openApp(id, args) {
  const app = APPS[id];
  if (!app) return null;
  const existing = getWindow(id);
  if (existing) {
    focus(openWindow(id, app));
    if (args && existing.api && existing.api.navigate) existing.api.navigate(args);
    return existing;
  }
  document.dispatchEvent(new CustomEvent("app-open", { detail: id }));
  return openWindow(id, {
    title: app.title,
    icon: icon(app.icon),
    w: app.w,
    h: app.h,
    render: (body, win) => app.render(body, win, args),
    onClose: () => { if (id === "blog" || id === "notes") setRoute(""); },
  });
}

// ---------- blog ----------
function blogApp(body, win, args) {
  body.innerHTML = `<div class="blog"><aside class="list" aria-label="Posts"></aside><article class="reader"><div class="empty">pick a post from the list</div></article></div>`;
  const root = body.firstElementChild;
  const list = root.querySelector(".list");
  const reader = root.querySelector(".reader");
  let posts = [];

  function show(slug) {
    const p = posts.find((x) => x.slug === slug);
    if (!p) return;
    list.querySelectorAll(".item").forEach((b) => b.classList.toggle("on", b.dataset.slug === slug));
    reader.innerHTML = `
      <button class="btn back">&larr; all posts</button>
      ${p.cover ? `<img class="cover" src="${esc(p.cover)}" alt="" loading="lazy">` : ""}
      <h1>${esc(p.title)}</h1>
      <div class="meta"><span>${fmtDate(p.date)}</span><span>&middot; ${p.minutes} min read</span>${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}${p.url ? `<a class="btn" href="${esc(p.url)}">open on substack</a>` : ""}</div>
      <div class="prose">${p.html}</div>`;
    externalLinks(reader);
    reader.querySelector(".back").onclick = () => { root.classList.remove("reading"); setRoute("/blog"); };
    reader.scrollTop = 0;
    root.classList.add("reading");
    win.el.querySelector(".ttl").textContent = "blog.exe - " + p.title;
    setRoute("/blog/" + slug);
  }

  load("posts").then((data) => {
    posts = data;
    list.innerHTML = posts.map((p) => `<button class="item" data-slug="${esc(p.slug)}"><h4>${p.emoji ? esc(p.emoji) + " " : ""}${esc(p.title)}</h4><small>${fmtDate(p.date)} &middot; ${p.minutes} min</small></button>`).join("");
    list.onclick = (e) => { const b = e.target.closest(".item"); if (b) show(b.dataset.slug); };
    if (args && args.slug) show(args.slug);
    else setRoute("/blog");
  }).catch(() => { reader.innerHTML = `<div class="empty">couldn't load posts. try refreshing.</div>`; });

  return {
    navigate(a) {
      if (a.slug) { const go = () => show(a.slug); posts.length ? go() : load("posts").then(go); }
    },
    posts: () => posts,
  };
}

// ---------- notes ----------
const EXTRA_FILES = { sem3: [{ name: "AFLL notes (pdf)", href: "files/afll.pdf" }] };

function notesApp(body, win, args) {
  body.innerHTML = `<div class="notes"><nav aria-label="Semesters"></nav><div class="main"><div class="empty">loading...</div></div></div>`;
  const nav = body.querySelector("nav");
  const main = body.querySelector(".main");
  let sems = [];

  function show(slug) {
    const s = sems.find((x) => x.slug === slug);
    if (!s) return;
    nav.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.slug === slug));
    const files = [
      ...(s.drive ? [{ name: "all " + s.name.toLowerCase() + " notes (drive)", href: s.drive }] : []),
      ...s.subjects.filter((x) => x.drive).map((x) => ({ name: x.name, href: x.drive })),
      ...(EXTRA_FILES[s.slug] || []),
    ];
    main.innerHTML = `
      <h1>${esc(s.name)}</h1>
      <div class="sub">${esc(s.year || "")} &middot; ${s.subjects.length || "a few"} subjects &middot; honest tips below</div>
      ${files.length ? `<div class="files">${files.map((f) => `<a class="btn" href="${esc(f.href)}">${icon_inline("folder")} ${esc(f.name)}</a>`).join("")}</div>` : ""}
      <div class="prose">${s.tips}</div>`;
    externalLinks(main);
    main.scrollTop = 0;
    setRoute("/notes/" + slug);
  }

  load("notes").then((data) => {
    sems = data;
    nav.innerHTML = sems.map((s) => `<button data-slug="${s.slug}">${icon_inline("folder")}${esc(s.name.replace("Semester ", "sem "))}</button>`).join("");
    nav.onclick = (e) => { const b = e.target.closest("button"); if (b) show(b.dataset.slug); };
    show((args && args.slug) || sems[sems.length - 1].slug);
  }).catch(() => { main.innerHTML = `<div class="empty">couldn't load notes. try refreshing.</div>`; });

  return { navigate(a) { if (a.slug) { sems.length ? show(a.slug) : load("notes").then(() => show(a.slug)); } } };
}

const icon_inline = (name) => icon(name).replace("<svg ", '<svg width="20" height="20" style="vertical-align:-4px" ');

// ---------- about ----------
function aboutApp(body) {
  body.innerHTML = `
    <div class="about">
      <div class="hero">
        <div class="face">${icon("face")}</div>
        <div>
          <h1>hello, i'm shriya</h1>
          <div class="sys">
            <div><b>role</b> cs student</div>
            <div><b>motto</b> organized chaos, documented</div>
            <div><b>into</b> systems, ml, terminals, writing</div>
            <div><b>status</b> <span style="color:#4ade80">&#9679;</span> taking things apart</div>
          </div>
        </div>
      </div>
      <div class="prose">
        <p>most of my time goes into overthinking. with the time i have left, i like to tinker: take things apart, build small weird projects, and figure out what makes them tick.</p>
        <p>i was always interested in tech, but lately creativity is what makes it feel alive. i try new things all the time, which means a permanent, mildly delightful identity crisis.</p>
        <p>working on something interesting? i'd love to hear about it.</p>
      </div>
      <div class="links">
        <a class="btn" href="${LINKS.email}">${icon_inline("mail")} email me</a>
        <a class="btn" href="${LINKS.substack}">newsletter</a>
        <a class="btn" href="${LINKS.github}">github</a>
        <a class="btn" href="${LINKS.linkedin}">linkedin</a>
        <a class="btn" href="${LINKS.medium}">medium</a>
        <a class="btn" href="${LINKS.youtube}">youtube</a>
      </div>
      <div class="quote">"learning never exhausts the mind." - leonardo da vinci</div>
    </div>`;
  externalLinks(body);
  setRoute("/about");
}

// ---------- settings ----------
function settingsApp(body) {
  const swatches = Object.entries(THEMES).map(([k, t]) => `<button class="swatch${k === prefs.theme ? " on" : ""}" data-t="${k}"><i style="background:linear-gradient(90deg,${t.a},${t.b})"></i>${t.label}</button>`).join("");
  body.innerHTML = `
    <div class="settings">
      <h3>COLOR THEME</h3><div class="swatches">${swatches}</div>
      <h3>EFFECTS</h3>
      <label class="switch"><input type="checkbox" id="s-crt" ${prefs.crt ? "checked" : ""}> crt scanlines</label>
      <label class="switch"><input type="checkbox" id="s-trail" ${prefs.trail ? "checked" : ""}> cursor sparkles</label>
      <label class="switch"><input type="checkbox" id="s-wall" ${prefs.wallpaper ? "checked" : ""}> animated wallpaper</label>
      <h3>TIP</h3><div style="color:var(--dim);font-size:22px;line-height:1.1">everything here also works from the terminal: try <b style="color:var(--b)">theme amber</b> or <b style="color:var(--b)">crt off</b></div>
    </div>`;
  body.querySelector(".swatches").onclick = (e) => {
    const b = e.target.closest(".swatch"); if (!b) return;
    applyTheme(b.dataset.t);
    body.querySelectorAll(".swatch").forEach((s) => s.classList.toggle("on", s === b));
  };
  body.querySelector("#s-crt").onchange = (e) => applyCrt(e.target.checked);
  body.querySelector("#s-trail").onchange = (e) => { prefs.trail = e.target.checked; savePrefs(); };
  body.querySelector("#s-wall").onchange = (e) => document.dispatchEvent(new CustomEvent("wallpaper", { detail: e.target.checked }));
}

// ---------- terminal ----------
const FACE = [
  "    ▄▄▄▄▄▄▄▄    ",
  "  ▄██████████▄  ",
  " ██▀▀██████▀▀██ ",
  " ██  ██████  ██ ",
  " ████▄▄▄▄▄▄████ ",
  " ███▀▀▀▀▀▀▀███  ",
  "  ▀██████████▀  ",
  "     ▀▀▀▀▀▀     ",
];

function terminalApp(body, win) {
  body.innerHTML = `<div class="term" tabindex="-1"><div class="out"></div><div class="row"><span class="p">shriya@os:~$</span><input type="text" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="terminal input"></div></div>`;
  const term = body.firstElementChild;
  const out = term.querySelector(".out");
  const input = term.querySelector("input");
  const history = [];
  let hi = 0;
  const started = Date.now();

  const line = (text = "", cls = "") => { const d = document.createElement("div"); d.className = "ln " + cls; d.textContent = text; out.appendChild(d); term.scrollTop = term.scrollHeight; return d; };
  const html = (h) => { const d = document.createElement("div"); d.className = "ln"; d.innerHTML = h; externalLinks(d); out.appendChild(d); term.scrollTop = term.scrollHeight; return d; };

  const FILES = {
    "about.txt": "shriya. cs student. organized chaos, documented.\nmost of my time goes into overthinking. the rest, i tinker.\nalways into tech; lately creativity is what makes it alive. (identity crisis: ongoing)",
    "contact.txt": "email    shriyamoh1362@gmail.com\nnewsletter  nerdingoutwithshriya.substack.com\ngithub   github.com/shriya5752\nlinkedin linkedin.com/in/shriya-moh",
  };

  const cmds = {
    help() {
      line("commands:", "a");
      [["ls [posts|notes]", "list things"], ["cat <file>", "read about.txt / contact.txt"], ["read <n>", "open post number n"], ["open <app>", "blog, notes, about, settings"],
        ["theme <name>", Object.keys(THEMES).join(" | ")], ["crt on|off", "toggle scanlines"], ["neofetch", "system info"], ["clear", "clean the screen"], ["matrix", "wake up, shriya"]]
        .forEach(([c, d]) => line("  " + c.padEnd(18) + d, "d"));
    },
    ls(a) {
      if (a[0] === "posts") return cmds.posts();
      if (a[0] === "notes") return load("notes").then((s) => s.forEach((x) => line("  " + x.slug + "/   " + x.name + " (" + x.year + ")")));
      line("about.txt  contact.txt  posts/  notes/");
    },
    posts() {
      return load("posts").then((p) => {
        p.forEach((x, i) => line(` ${i + 1}. ${x.title}  [${x.date}]`));
        line("read <n> to open one.", "d");
      });
    },
    cat(a) {
      const f = FILES[a[0]];
      if (f) f.split("\n").forEach((l) => line(l)); else line(`cat: ${a[0] || ""}: no such file`, "e");
    },
    read(a) {
      return load("posts").then((posts) => {
        const n = parseInt(a[0], 10);
        const p = posts[n - 1];
        if (!p) return line("usage: read <n>   (see 'ls posts')", "e");
        line(`opening "${p.title}"...`, "d");
        openApp("blog", { slug: p.slug });
      });
    },
    open(a) {
      const id = (a[0] || "").replace(/\.exe$/, "");
      if (APPS[id] && id !== "terminal") { line(`opening ${id}...`, "d"); openApp(id); } else line(`open: ${a[0] || ""}: unknown app. try: blog notes about settings`, "e");
    },
    notes() { line("opening notes...", "d"); openApp("notes"); },
    blog() { line("opening blog...", "d"); openApp("blog"); },
    about() { line("opening about...", "d"); openApp("about"); },
    whoami() {
      line("shriya", "a");
      line("cs student / writer / professional note-taker");
      line("type 'help' to poke around, or double-click the icons.", "d");
    },
    theme(a) {
      if (!a[0]) return line("themes: " + Object.keys(THEMES).join(", ") + "   (current: " + prefs.theme + ")");
      if (applyTheme(a[0])) line("theme -> " + a[0], "d"); else line("unknown theme: " + a[0], "e");
    },
    crt(a) {
      if (a[0] !== "on" && a[0] !== "off") return line("usage: crt on|off", "e");
      applyCrt(a[0] === "on"); line("crt " + a[0], "d");
    },
    date() { line(new Date().toString()); },
    uptime() { line(`up ${Math.round((Date.now() - started) / 1000)}s, 1 user, load average: 0.00 (it's a website)`); },
    echo(a) { line(a.join(" ")); },
    history() { history.forEach((h, i) => line(` ${i + 1}  ${h}`, "d")); },
    clear() { out.innerHTML = ""; },
    exit() { closeWindow("terminal"); },
    sudo() { line("nice try. this incident will be reported (to nobody).", "e"); },
    rm(a) { line(a.join(" ").includes("-rf") ? "deleting everything... just kidding. it's a static site." : "rm: permission denied (you're a guest)", "e"); },
    neofetch() {
      const info = ["shriya@os", "---------", "OS: shriya.os 1.0", "Host: github pages", "Shell: sh-riya", "Theme: " + prefs.theme, "Posts: " + (cache.posts ? "loaded" : "..."), "Fuel: curiosity"];
      const pre = document.createElement("pre");
      pre.className = "a";
      pre.textContent = FACE.map((r, i) => r + "  " + (info[i] || "")).join("\n");
      const d = document.createElement("div"); d.className = "ln"; d.appendChild(pre); out.appendChild(d);
    },
    matrix() {
      const cv = document.createElement("canvas");
      cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;background:#000;z-index:5;cursor:pointer";
      body.appendChild(cv);
      const c = cv.getContext("2d");
      cv.width = body.clientWidth; cv.height = body.clientHeight;
      const cols = Math.floor(cv.width / 14), drops = Array(cols).fill(0).map(() => Math.random() * -20);
      let alive = true;
      const stop = () => { alive = false; cv.remove(); };
      cv.onclick = stop; setTimeout(stop, 5000);
      (function tick() {
        if (!alive) return;
        c.fillStyle = "rgba(0,0,0,.12)"; c.fillRect(0, 0, cv.width, cv.height);
        c.fillStyle = "#39ff88"; c.font = "16px monospace";
        drops.forEach((y, i) => { c.fillText(String.fromCharCode(0x30a0 + Math.random() * 60), i * 14, y * 16); drops[i] = y * 16 > cv.height && Math.random() > 0.96 ? 0 : y + 1; });
        setTimeout(() => requestAnimationFrame(tick), 40);
      })();
      line("follow the white rabbit... (click to exit)", "d");
    },
  };

  async function run(raw) {
    const text = raw.trim();
    html(`<span class="p">shriya@os:~$</span> ${esc(text)}`);
    if (!text) return;
    history.push(text); hi = history.length;
    const [name, ...args] = text.split(/\s+/);
    const fn = cmds[name.toLowerCase()];
    if (!fn) return line(`command not found: ${name}. try 'help'`, "e");
    try { await fn(args); } catch { line("something went wrong. try again?", "e"); }
    term.scrollTop = term.scrollHeight;
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { const v = input.value; input.value = ""; run(v); }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (hi > 0) input.value = history[--hi]; }
    else if (e.key === "ArrowDown") { e.preventDefault(); hi = Math.min(history.length, hi + 1); input.value = history[hi] || ""; }
    else if (e.key === "Tab") {
      e.preventDefault();
      const parts = input.value.split(/\s+/);
      const pool = parts.length < 2 ? Object.keys(cmds) : parts[0] === "open" ? Object.keys(APPS) : parts[0] === "theme" ? Object.keys(THEMES) : [];
      const hit = pool.filter((c) => c.startsWith(parts[parts.length - 1]));
      if (hit.length === 1) { parts[parts.length - 1] = hit[0]; input.value = parts.join(" ") + " "; }
    } else if (e.key === "l" && e.ctrlKey) { e.preventDefault(); cmds.clear(); }
  });
  term.addEventListener("pointerup", () => { if (!getSelection().toString()) input.focus({ preventScroll: true }); });

  // greeting: type "whoami" for the visitor
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  line("shriya.os terminal [v1.0]  -  type 'help' for commands", "d");
  const greet = "whoami";
  let i = 0;
  const typer = setInterval(() => {
    if (!document.body.contains(term)) return clearInterval(typer);
    if (reduced) i = greet.length; else i++;
    input.value = greet.slice(0, i);
    if (i >= greet.length) { clearInterval(typer); setTimeout(() => { if (input.value === greet) { input.value = ""; run(greet).then(() => { line(); line("try: ls posts  |  read 1  |  theme amber  |  neofetch", "d"); }); } }, 250); }
  }, 90);
  term.addEventListener("keydown", () => { clearInterval(typer); }, { once: true });
  setTimeout(() => input.focus({ preventScroll: true }), 50);
}
