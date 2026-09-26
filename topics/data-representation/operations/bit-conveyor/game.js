/* Bit Conveyor — logical, circular, arithmetic shift trên 8 bit. Xem README.md. */
(function () {
  "use strict";
  const { $, el } = G;

  const OPS = {
    SHL: { name: "Logical ←", sub: "<< 1, điền 0", dir: "l", f: (u) => (u << 1) & 0xff },
    SHR: { name: "Logical →", sub: ">>> 1, điền 0", dir: "r", f: (u) => u >>> 1 },
    SAR: { name: "Arithmetic →", sub: ">> 1, giữ dấu", dir: "r", f: (u) => (u >>> 1) | (u & 0x80) },
    ROL: { name: "Circular ←", sub: "quay trái", dir: "l", f: (u) => ((u << 1) | (u >>> 7)) & 0xff },
    ROR: { name: "Circular →", sub: "quay phải", dir: "r", f: (u) => (u >>> 1) | ((u & 1) << 7) },
  };
  const LEVELS = [
    { name: "Logical shift", desc: "Dịch trái/phải, bit rơi là mất", ops: ["SHL", "SHR"], depth: [1, 3], rounds: 4 },
    { name: "Circular shift", desc: "Không mất bit nào, quay vòng", ops: ["ROL", "ROR"], depth: [2, 5], rounds: 4 },
    { name: "Arithmetic vs logical", desc: "Chia số âm cho 2 mà vẫn giữ dấu", ops: ["SHL", "SHR", "SAR"], kind: "signed", rounds: 4 },
    { name: "Tổng hợp", desc: "Đủ 5 loại dịch", ops: ["SHL", "SHR", "SAR", "ROL", "ROR"], depth: [3, 4], rounds: 4 },
  ];

  const S = { lv: 0, level: null, round: 0, score: 0, perfect: 0, start: 0, cur: 0, target: 0, min: 0, moves: 0, hist: [], stack: [], done: false };

  const sval = (u) => G.signed(G.bits(u));
  const desc = (u) => (u & 0x80 ? `${u} · có dấu: ${sval(u)}` : `${u}`);

  /** BFS: số bước ít nhất từ a tới b với các phép cho phép. */
  function bfs(a, b, ops) {
    if (a === b) return 0;
    const seen = new Map([[a, 0]]);
    let q = [a];
    while (q.length) {
      const nq = [];
      for (const u of q) for (const o of ops) {
        const v = OPS[o].f(u);
        if (seen.has(v)) continue;
        seen.set(v, seen.get(u) + 1);
        if (v === b) return seen.get(v);
        nq.push(v);
      }
      q = nq;
    }
    return Infinity;
  }

  function makeRound() {
    const L = S.level;
    if (L.kind === "signed") {
      // Số âm (và một vòng số dương) cần chia cho 2^k
      const k = S.round === 1 ? 1 : G.randInt(1, 2);
      const x = S.round === 1 ? -42 : S.round === 3 ? G.randInt(20, 100) : -G.randInt(20, 120);
      S.start = x & 0xff;
      S.target = (x >> k) & 0xff;
      S.task = `Tính <b>${x} ÷ ${2 ** k}</b> (làm tròn xuống) bằng phép dịch: ${x} → ${x >> k}.`;
    } else {
      let s, t, m;
      do {
        s = G.randInt(1, 254);
        t = s;
        const d = G.randInt(L.depth[0], L.depth[1]);
        for (let i = 0; i < d; i++) t = OPS[G.pick(L.ops)].f(t);
        m = bfs(s, t, L.ops);
      } while (t === s || t === 0 || m < L.depth[0] || !isFinite(m));
      S.start = s; S.target = t;
      S.task = "Đưa pattern <b>Hiện tại</b> về đúng <b>Đích</b>.";
    }
    S.min = bfs(S.start, S.target, L.ops);
  }

  function startLevel(i) {
    S.lv = i; S.level = LEVELS[i]; S.round = 0; S.score = 0; S.perfect = 0;
    $("#hud-level").textContent = i + 1;
    const ops = $("#ops");
    ops.innerHTML = "";
    Object.entries(OPS).forEach(([k, o], n) => ops.append(el("button", {
      type: "button", class: "opbtn", "data-op": k, disabled: !S.level.ops.includes(k),
      html: `${o.name}<small>${n + 1} · ${o.sub}</small>`, onclick: () => apply(k),
    })));
    G.showScreen("play");
    nextRound();
  }

  function nextRound() {
    if (S.round >= S.level.rounds) return finish();
    S.round++; S.done = false; S.moves = 0; S.hist = []; S.stack = [];
    makeRound();
    S.cur = S.start;
    $("#hud-round").textContent = `${S.round}/${S.level.rounds}`;
    $("#hud-score").textContent = S.score;
    $("#mission").innerHTML = `${S.task} <span class="muted" style="font-weight:500">Tối thiểu: ${S.min} bước.</span>`;
    $("#btn-next").hidden = true;
    setFeedback("Bấm nút dịch để áp dụng lên byte Hiện tại.");
    render();
  }

  function render(anim) {
    $("#hud-moves").textContent = `${S.moves}/${S.min}`;
    const belt = $("#belt");
    belt.innerHTML = "";
    const cur = G.bitRow(S.cur);
    if (anim) cur.classList.add("slide-" + anim);
    const goal = G.bitRow(S.target);
    goal.classList.add("goal");
    if (S.cur === S.target) goal.classList.add("match");
    belt.append(el("div", { class: "lbl", text: "Hiện tại" }), cur, el("div", { class: "num", text: desc(S.cur) }));
    belt.append(el("div", { class: "lbl", text: "Đích" }), goal, el("div", { class: "num", text: desc(S.target) }));
    const h = $("#history");
    h.innerHTML = "";
    if (S.hist.length) h.append(...S.hist.map((x) => el("span", { class: "chip", text: OPS[x].name })));
    G.$$(".opbtn").forEach((b) => { b.disabled = S.done || !S.level.ops.includes(b.dataset.op); });
  }

  function apply(k) {
    if (S.done || !S.level.ops.includes(k)) return;
    S.stack.push(S.cur);
    const before = S.cur;
    S.cur = OPS[k].f(S.cur);
    S.moves++; S.hist.push(k);
    G.sound.play("tick");
    render(OPS[k].dir);
    if (S.cur === S.target) return win();
    if (S.moves >= S.min + 4) {
      S.done = true;
      G.sound.play("bad");
      setFeedback(`✗ Quá nhiều bước. <span class="detail">Gợi ý: có cách chỉ cần ${S.min} bước.</span>`, "bad");
      render();
      return endRound();
    }
    let note = "";
    if (k === "SHR" && before & 0x80 && S.level.kind === "signed") note = ` Logical → điền 0 vào bit dấu: ${sval(before)} biến thành ${sval(S.cur)} (số dương!).`;
    setFeedback(`Đã áp dụng ${OPS[k].name}.${note}`, note ? "warn" : "");
  }

  function win() {
    S.done = true;
    const extra = S.moves - S.min;
    const gained = extra <= 0 ? 15 : Math.max(5, 15 - 3 * extra);
    S.score += gained; if (extra <= 0) S.perfect++;
    G.sound.play("good");
    let why = "";
    if (S.level.kind === "signed") {
      const s = sval(S.start), lg = sval(OPS.SHR.f(S.start));
      why = s < 0 ? `Arithmetic shift giữ bit dấu nên ${s} → ${sval(S.target)}. Nếu dùng logical shift, lần dịch đầu đã ra ${lg}: số âm biến thành số dương lớn.`
        : `Với số dương, bit dấu là 0 nên logical và arithmetic shift cho cùng kết quả.`;
    } else if (S.level.ops.includes("ROL") && S.level.ops.length === 2) why = "Quay trái k lần bằng quay phải 8 − k lần. Chọn chiều ngắn hơn!";
    else if (S.level.ops.length === 2) why = "Dịch trái 1 bit = ×2, dịch phải 1 bit = ÷2. Bit nào bị đẩy ra ngoài thì mất hẳn.";
    setFeedback(`✓ Khớp đích sau ${S.moves} bước${extra <= 0 ? " (tối ưu!)" : `, tối thiểu là ${S.min}`}. +${gained}${why ? `<span class="detail">${why}</span>` : ""}`, "good");
    render();
    endRound();
  }

  function endRound() {
    $("#hud-score").textContent = S.score;
    $("#btn-next").hidden = false;
    $("#btn-next").focus();
  }

  function finish() {
    const { isNew } = G.progress.record("bit-conveyor", S.lv, S.score, LEVELS.length);
    G.showScreen("end");
    $("#end-score").textContent = S.score;
    const all = S.perfect === S.level.rounds;
    $("#end-title").textContent = all ? "Quản đốc băng chuyền! 🎉" : "Hoàn thành level!";
    $("#end-detail").textContent = `${S.perfect}/${S.level.rounds} vòng đạt số bước tối thiểu.` + (isNew ? " Kỷ lục mới!" : "");
    if (all) { G.confetti(); G.sound.play("win"); }
    G.mountNextLink($("#next-game"));
  }

  function setFeedback(html, type = "") {
    const f = $("#feedback");
    f.className = "feedback " + type;
    f.innerHTML = html;
  }

  $("#btn-undo").addEventListener("click", () => {
    if (S.done || !S.stack.length) return;
    S.cur = S.stack.pop(); S.hist.pop();
    setFeedback("Đã hoàn tác (số bước vẫn được tính).");
    render();
  });
  $("#btn-reset").addEventListener("click", () => {
    if (S.done) return;
    S.cur = S.start; S.stack = []; S.hist = [];
    setFeedback("Đã đưa về ban đầu (số bước vẫn được tính).");
    render();
  });
  document.addEventListener("keydown", (e) => {
    if ($("[data-screen=play]").hidden) return;
    if (e.key === "Enter" && S.done) { e.preventDefault(); nextRound(); return; }
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 5) apply(Object.keys(OPS)[n - 1]);
    if (e.key.toLowerCase() === "z") $("#btn-undo").click();
  });
  $("#btn-next").addEventListener("click", nextRound);
  $("#btn-again").addEventListener("click", () => startLevel(S.lv));
  $("#btn-menu").addEventListener("click", () => { G.renderLevels($("#levels"), LEVELS, startLevel); G.showScreen("start"); });

  G.renderLevels($("#levels"), LEVELS, startLevel);
})();
