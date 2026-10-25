import { icon } from "./icons.js";
import { reduced as isReduced } from "./motion.js";
import { isMobile } from "./wm.js";
import { APPS, openApp, load } from "./apps.js";
import { startCharacter } from "./character.js";
import { startSky } from "./sky.js";
import { startTrail } from "./fx.js";
import { prefs, applyTheme, applyCrt, refreshTheme, savePrefs } from "./theme.js";

const reduced = isReduced();
const $ = (s) => document.querySelector(s);

applyTheme(prefs.theme);
applyCrt(prefs.crt);
const sky = startSky(document.getElementById("wall"), { animated: prefs.wallpaper });
document.addEventListener("wallpaper", (e) => { prefs.wallpaper = e.detail; savePrefs(); sky.setAnimated(e.detail); });
document.addEventListener("skyhour", (e) => { sky.setHour(e.detail); refreshTheme(); });

startCharacter(openApp);

// ---------- desktop icons ----------
const ORDER = ["about", "blog", "notes", "terminal", "settings"];
$("#icons").innerHTML = ORDER.map((id) => `<button class="icon" data-app="${id}">${icon(APPS[id].icon)}<span>${APPS[id].label}</span></button>`).join("");
$("#icons").addEventListener("click", (e) => {
  const b = e.target.closest(".icon"); if (!b) return;
  document.querySelectorAll(".icon.sel").forEach((x) => x.classList.remove("sel"));
  b.classList.add("sel");
  // single tap on touch, double-click with a mouse (like the real thing)
  if (e.detail >= 2 || e.pointerType === "touch" || isMobile() || e.detail === 0) openApp(b.dataset.app);
});
$("#desktop").addEventListener("pointerdown", (e) => { if (!e.target.closest(".icon")) document.querySelectorAll(".icon.sel").forEach((x) => x.classList.remove("sel")); });

// ---------- start menu ----------
const menu = $("#menu");
const start = $("#start");
menu.innerHTML = `<div class="brand">shriya.os</div>` +
  [...ORDER, "trace"].map((id) => `<button data-app="${id}">${icon(APPS[id].icon)}${APPS[id].label}</button>`).join("") +
  `<hr><button data-act="mail">${icon("mail")}mail me</button><button data-act="off">${icon("power")}shut down...</button>`;
function toggleMenu(force) {
  const open = force ?? !menu.classList.contains("open");
  menu.classList.toggle("open", open);
  start.setAttribute("aria-expanded", open);
}
start.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(); });
menu.addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  toggleMenu(false);
  if (b.dataset.app) openApp(b.dataset.app);
  else if (b.dataset.act === "mail") openApp("contact");
  else if (b.dataset.act === "off") shutdown();
});
document.addEventListener("pointerdown", (e) => { if (!e.target.closest("#menu, #start")) toggleMenu(false); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggleMenu(false); });

// ---------- clock ----------
function tick() { $("#clock").textContent = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); }
tick(); setInterval(tick, 10000);

startTrail();

// ---------- shutdown / reboot ----------
function shutdown() {
  const off = $("#off");
  off.innerHTML = `<div>it is now safe to turn off<br>your computer.<br><br><span style="font-size:20px;opacity:.7">(click anywhere to reboot)</span></div>`;
  off.classList.add("on");
  off.onclick = () => { try { sessionStorage.removeItem("shriya.os.booted"); } catch { /* ignore */ } location.reload(); };
}

// ---------- routing: #/blog/slug, #/notes/sem3, #/about ... ----------
function route() {
  const [, app, arg] = location.hash.split("/");
  if (!app || !APPS[app]) return false;
  openApp(app, arg ? { slug: arg } : undefined);
  return true;
}
addEventListener("hashchange", route);

// ---------- boot ----------
async function boot() {
  const el = $("#boot");
  let seen = false;
  try { seen = sessionStorage.getItem("shriya.os.booted") === "1"; } catch { /* ignore */ }
  const preload = Promise.allSettled([load("posts"), load("notes")]);

  const finish = async () => {
    el.hidden = true;
    try { sessionStorage.setItem("shriya.os.booted", "1"); } catch { /* ignore */ }
    if (!route() && !isMobile()) openApp("terminal");
  };
  if (seen || reduced) { await finish(); return; }

  el.hidden = false;
  const [posts, notes] = (await preload).map((r) => (r.status === "fulfilled" ? r.value.length : "?"));
  const lines = [
    "shriya.os BIOS v1.0",
    "(c) organized chaos, documented",
    "",
    "memory test ............ 640K ok",
    `loading blog ........... ${posts} posts`,
    `loading notes .......... ${notes} semesters`,
    "mounting /home/shriya .. ok",
    "warming up the crt ..... ok",
    "",
    "welcome.",
  ];
  let done = false, skip = false;
  const end = () => { if (done) return; done = true; finish(); };
  el.onclick = () => { skip = true; end(); };
  addEventListener("keydown", () => { skip = true; end(); }, { once: true });
  el.innerHTML = `<span class="txt"></span><span class="cur"></span><div class="hint">click or press any key to skip</div>`;
  const txt = el.querySelector(".txt");
  for (const l of lines) {
    for (const ch of l + "\n") {
      if (skip) return;
      txt.textContent += ch;
      await new Promise((r) => setTimeout(r, ch === "\n" ? 90 : 12));
    }
  }
  await new Promise((r) => setTimeout(r, 350));
  end();
}
boot();
