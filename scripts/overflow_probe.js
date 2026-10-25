// Paste into the browser console (or run via the preview tool) on the live page.
// Opens each window at a small width and reports any element that sticks out past the window's right edge.
(async () => {
  const report = [];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  for (const id of ["about", "blog", "notes", "terminal", "settings", "contact", "trace"]) {
    if (id === "trace") document.querySelector("#traceCard").click();
    else document.querySelector(`.tile[data-app=${id}]`).dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    await sleep(700);
    const win = [...document.querySelectorAll(".win")].pop();
    win.style.width = "300px";
    await sleep(150);
    const body = win.querySelector(".body");
    const edge = body.getBoundingClientRect().right + 0.5;
    const out = [...body.querySelectorAll("*")].filter((e) => e.getBoundingClientRect().width && e.getBoundingClientRect().right > edge && !e.closest(".tnote") && getComputedStyle(e).position !== "fixed");
    report.push(`${id}: hscroll=${body.scrollWidth > body.clientWidth + 1} sticking-out=${out.slice(0, 4).map((e) => e.tagName.toLowerCase() + "." + (e.className || "") + "[" + (e.textContent || "").trim().slice(0, 14) + "]").join(", ") || "none"}`);
    win.querySelector(".cls").click();
    await sleep(250);
  }
  return report.join("\n");
})();
