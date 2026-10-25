// Intro splash: a screen with the chibi in the middle. Tap and the whole screen parts down the middle like doors.
import { chibi } from "./chibi.js";
import "./motion.js"; // sets the .calm class before the intro paints

// resolves when the doors have opened (or straight away if the intro is skipped).
// With reduced motion the doors become a gentle fade; the splash still appears.
export function startIntro({ oncePerSession = false } = {}) {
  return new Promise((resolve) => {
    const q = new URLSearchParams(location.search);
    let seen = false;
    if (oncePerSession) { try { seen = sessionStorage.getItem("shriya.intro") === "1"; } catch { /* ignore */ } }
    if (q.has("nointro") || (seen && !q.has("intro"))) { resolve(); return; }

    document.body.classList.add("introing");
    const root = document.createElement("div");
    root.className = "intro";
    root.setAttribute("role", "button");
    root.setAttribute("aria-label", "Tap to open the website");
    root.tabIndex = 0;
    const scene = `<div class="iscene"><div class="ibrand">&#10022; Shriya Mohanty</div><div class="ichar">${chibi()}</div><div class="ihint">tap to open &#10022;</div></div>`;
    root.innerHTML = `<div class="iseam"></div><div class="ihalf l">${scene}</div><div class="ihalf r">${scene}</div>`;
    root.querySelectorAll("[class~=ichar] svg").forEach((s) => s.removeAttribute("role")); // decorative copies
    document.body.appendChild(root);
    root.focus({ preventScroll: true });

    let opened = false;
    function open() {
      if (opened) return;
      opened = true;
      try { sessionStorage.setItem("shriya.intro", "1"); } catch { /* ignore */ }
      root.classList.add("open");
      document.body.classList.remove("introing");
      setTimeout(() => { root.remove(); resolve(); }, 1150);
    }
    root.addEventListener("click", open);
    root.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " " || e.key === "Escape") { e.preventDefault(); open(); } });
  });
}
