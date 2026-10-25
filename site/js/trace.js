// "Leave a trace": a doodle board with sticky notes. Everything is saved only in the visitor's own browser.
const COLORS = ["#3b2f4f", "#f0649a", "#6b5bd2", "#2fb7a0", "#f5a524", "#e5484d", "#ffffff"];
const NOTE_COLORS = ["#fff1a0", "#ffd1e0", "#c9f0e0", "#d9d2f8", "#ffe0c2"];
const DRAW_KEY = "shriya.os.trace", NOTES_KEY = "shriya.os.trace.notes";

const store = {
  get(k, fallback) { try { const v = localStorage.getItem(k); return v === null ? fallback : v; } catch { return fallback; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage full or blocked: drawing still works this session */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function traceApp(body) {
  body.innerHTML = `
    <div class="trace">
      <div class="ttools">
        <div class="tcolors" role="group" aria-label="Colours">${COLORS.map((c, i) => `<button class="tc${i === 0 ? " on" : ""}" data-c="${c}" style="--c:${c}" aria-label="colour ${c}"></button>`).join("")}</div>
        <button class="btn on" data-tool="pencil">pencil</button>
        <button class="btn" data-tool="eraser">eraser</button>
        <label class="tsize">size <input id="tSize" type="range" min="2" max="26" value="6"></label>
        <button class="btn" id="tNote">+ note</button>
        <button class="btn" id="tSave">save png</button>
        <button class="btn" id="tClear">clear</button>
      </div>
      <div class="tboard">
        <canvas width="1000" height="620"></canvas>
        <div class="tnotes"></div>
        <form class="tform" hidden>
          <textarea maxlength="140" placeholder="write a little note (140 characters)" aria-label="note text"></textarea>
          <div class="trow"><button class="btn" type="submit">stick it</button><button class="btn" type="button" data-cancel>cancel</button></div>
        </form>
      </div>
      <p class="thint">doodle something or stick a note. it's saved only on your device, so nobody else sees it.</p>
    </div>`;

  const cv = body.querySelector("canvas"), ctx = cv.getContext("2d");
  const notesEl = body.querySelector(".tnotes"), form = body.querySelector(".tform"), ta = form.querySelector("textarea");
  let color = COLORS[0], tool = "pencil", size = 6, drawing = false, last = null, notes = [];
  ctx.lineCap = "round"; ctx.lineJoin = "round";

  const saved = store.get(DRAW_KEY, "");
  if (saved) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0); img.src = saved; }

  const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * cv.width, y: ((e.clientY - r.top) / r.height) * cv.height }; };
  const stroke = (a, b) => {
    ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    ctx.strokeStyle = color; ctx.lineWidth = tool === "eraser" ? size * 2.2 : size;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  };
  cv.addEventListener("pointerdown", (e) => {
    if (e.button > 0) return;
    cv.setPointerCapture(e.pointerId); drawing = true; last = pos(e); stroke(last, { x: last.x + 0.01, y: last.y });
  });
  cv.addEventListener("pointermove", (e) => { if (!drawing) return; const p = pos(e); stroke(last, p); last = p; });
  const end = () => { if (!drawing) return; drawing = false; store.set(DRAW_KEY, cv.toDataURL()); document.dispatchEvent(new Event("trace-saved")); };
  cv.addEventListener("pointerup", end);
  cv.addEventListener("pointercancel", end);

  body.querySelector(".tcolors").addEventListener("click", (e) => {
    const b = e.target.closest(".tc"); if (!b) return;
    color = b.dataset.c; tool = "pencil";
    body.querySelectorAll(".tc").forEach((x) => x.classList.toggle("on", x === b));
    body.querySelectorAll("[data-tool]").forEach((x) => x.classList.toggle("on", x.dataset.tool === "pencil"));
  });
  body.querySelectorAll("[data-tool]").forEach((b) => b.addEventListener("click", () => {
    tool = b.dataset.tool;
    body.querySelectorAll("[data-tool]").forEach((x) => x.classList.toggle("on", x === b));
  }));
  body.querySelector("#tSize").addEventListener("input", (e) => { size = +e.target.value; });

  body.querySelector("#tSave").addEventListener("click", () => {
    const out = document.createElement("canvas"); out.width = cv.width; out.height = cv.height;
    const o = out.getContext("2d"); o.fillStyle = "#fff9ef"; o.fillRect(0, 0, out.width, out.height); o.drawImage(cv, 0, 0);
    const a = document.createElement("a"); a.download = "my-trace.png"; a.href = out.toDataURL("image/png"); a.click();
  });
  body.querySelector("#tClear").addEventListener("click", () => {
    if (!confirm("clear the drawing and all notes?")) return;
    ctx.clearRect(0, 0, cv.width, cv.height); store.del(DRAW_KEY); document.dispatchEvent(new Event("trace-saved"));
    notes = []; store.del(NOTES_KEY); renderNotes();
  });

  // ----- sticky notes -----
  try { notes = JSON.parse(store.get(NOTES_KEY, "[]")) || []; } catch { notes = []; }
  const saveNotes = () => store.set(NOTES_KEY, JSON.stringify(notes));

  function renderNotes() {
    notesEl.innerHTML = "";
    notes.forEach((n) => {
      const d = document.createElement("div");
      d.className = "tnote";
      d.style.cssText = `left:${n.x * 100}%;top:${n.y * 100}%;background:${n.color};transform:rotate(${n.rot}deg)`;
      d.innerHTML = `<button class="tx" aria-label="delete note">&times;</button><p></p>`;
      d.querySelector("p").textContent = n.text;
      d.querySelector(".tx").onclick = () => { notes = notes.filter((x) => x.id !== n.id); saveNotes(); renderNotes(); };
      d.addEventListener("pointerdown", (e) => {
        if (e.target.closest(".tx")) return;
        const r = notesEl.getBoundingClientRect(), sx = e.clientX, sy = e.clientY, ox = n.x, oy = n.y;
        d.setPointerCapture(e.pointerId); d.style.zIndex = 5;
        const move = (ev) => {
          n.x = clamp(ox + (ev.clientX - sx) / r.width, 0, 0.9); n.y = clamp(oy + (ev.clientY - sy) / r.height, 0, 0.9);
          d.style.left = n.x * 100 + "%"; d.style.top = n.y * 100 + "%";
        };
        const up = () => { d.removeEventListener("pointermove", move); d.removeEventListener("pointerup", up); saveNotes(); };
        d.addEventListener("pointermove", move);
        d.addEventListener("pointerup", up);
      });
      notesEl.appendChild(d);
    });
  }
  renderNotes();

  body.querySelector("#tNote").addEventListener("click", () => { form.hidden = false; ta.value = ""; ta.focus(); });
  form.querySelector("[data-cancel]").addEventListener("click", () => { form.hidden = true; });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = ta.value.trim(); if (!text) return;
    notes.push({ id: Date.now(), text, x: 0.1 + Math.random() * 0.6, y: 0.08 + Math.random() * 0.5, rot: Math.round(Math.random() * 10 - 5), color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)] });
    saveNotes(); renderNotes(); form.hidden = true;
  });
}
