// Small shared effects: the cursor sparkle trail.
import { prefs } from "./theme.js";
import { reduced as isReduced } from "./motion.js";

export function startTrail() {
  if (isReduced() || !matchMedia("(pointer: fine)").matches) return;
  let last = 0;
  addEventListener("pointermove", (e) => {
    if (!prefs.trail) return;
    const now = performance.now();
    if (now - last < 45) return;
    last = now;
    const s = document.createElement("i");
    s.className = "spark";
    s.style.left = e.clientX + (Math.random() * 10 - 5) + "px";
    s.style.top = e.clientY + (Math.random() * 10 - 5) + "px";
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 700);
  }, { passive: true });
}
