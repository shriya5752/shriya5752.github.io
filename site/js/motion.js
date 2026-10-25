// Motion preference: "auto" follows the system's reduce-motion setting; "full" always animates; "calm" never does.
const KEY = "shriya.os.prefs";

export function motionPref() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}").motion || "auto"; } catch { return "auto"; }
}

export function systemReduces() {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// true when animations should be calm/off
export function reduced() {
  const m = motionPref();
  if (m === "full") return false;
  if (m === "calm") return true;
  return systemReduces();
}

// a link like ?motion=full remembers the choice, handy for sharing a preview with animations on
try {
  const m = new URLSearchParams(location.search).get("motion");
  if (m === "full" || m === "calm" || m === "auto") {
    const p = JSON.parse(localStorage.getItem(KEY) || "{}");
    p.motion = m;
    localStorage.setItem(KEY, JSON.stringify(p));
  }
} catch { /* storage blocked: the setting simply isn't remembered */ }

// lets the stylesheet switch big animations off with one class
document.documentElement.classList.toggle("calm", reduced());
