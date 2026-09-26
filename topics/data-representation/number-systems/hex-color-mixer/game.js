/* Hex Color Mixer — hex ngoài đời thực: mã màu #RRGGBB. Xem README.md. */
(function () {
  "use strict";
  const { $, el } = G;

  const STEP33 = [0x00, 0x33, 0x66, 0x99, 0xcc, 0xff];
  const LEVELS = [
    { name: "Màu thuần", desc: "Mỗi kênh chỉ là 00 hoặc FF", kind: "mix", values: [0x00, 0xff], rounds: 5, pass: 100 },
    { name: "Đọc mã", desc: "Chọn đúng màu cho một mã hex", kind: "read", values: STEP33, rounds: 8 },
    { name: "Bậc 0x33", desc: "Kênh ∈ {00, 33, 66, 99, CC, FF}", kind: "mix", values: STEP33, rounds: 5, pass: 100 },
    { name: "Màu tự do", desc: "Bắt đầu bằng #FF5733 trên slide. Đạt ≥ 95% là qua", kind: "mix", values: null, rounds: 5, pass: 95, first: [0xff, 0x57, 0x33] },
    { name: "Đọc mã khó", desc: "Màu bất kỳ, đáp án nhiễu gần giống", kind: "read", values: null, rounds: 8 },
  ];
  const NAMES = ["R", "G", "B"];
  const MAX_DIST = Math.sqrt(3 * 255 * 255);

  const S = { lv: 0, level: null, round: 0, score: 0, perfect: 0, target: [0, 0, 0], mine: [0, 0, 0], tries: 0, done: false, seen: new Set() };

  const hex2 = (v) => v.toString(16).toUpperCase().padStart(2, "0");
  const code = (c) => "#" + c.map(hex2).join("");
  const dist = (a, b) => Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));
  const closeness = (a, b) => 100 * (1 - dist(a, b) / MAX_DIST);
  const randChannel = (values) => (values ? G.pick(values) : G.randInt(0, 255));

  function randomColor(values) {
    let c, tries = 0;
    do { c = [0, 1, 2].map(() => randChannel(values)); }
    while ((S.seen.has(code(c)) || code(c) === "#000000") && ++tries < 60);
    S.seen.add(code(c));
    return c;
  }

  function startLevel(i) {
    S.lv = i; S.level = LEVELS[i]; S.round = 0; S.score = 0; S.perfect = 0; S.seen.clear();
    $("#hud-level").textContent = i + 1;
    $("#mix-panel").hidden = S.level.kind !== "mix";
    $("#read-panel").hidden = S.level.kind !== "read";
    $("#hud-tries-wrap").hidden = S.level.kind !== "mix";
    G.showScreen("play");
    nextRound();
  }

  function nextRound() {
    if (S.round >= S.level.rounds) return finish();
    S.round++; S.done = false;
    $("#hud-round").textContent = `${S.round}/${S.level.rounds}`;
    $("#hud-score").textContent = S.score;
    if (S.level.kind === "mix") startMix(); else startRead();
  }

  /* ================= Pha màu ================= */
  function startMix() {
    S.target = S.round === 1 && S.level.first ? S.level.first.slice() : randomColor(S.level.values);
    S.seen.add(code(S.target));
    S.mine = [0, 0, 0];
    S.tries = 0;
    $("#hud-tries").textContent = 0;
    $("#sw-target").style.background = code(S.target);
    $("#meter-fill").style.width = "0%";
    $("#meter-val").textContent = "?";
    $("#btn-check").hidden = false;
    $("#btn-next").hidden = true;
    setFeedback("#mix-feedback", "Chỉnh từng chữ số hex rồi bấm <b>Kiểm tra</b>.");
    buildChannels();
    renderMine();
  }

  function buildChannels() {
    const box = $("#channels");
    box.innerHTML = "";
    NAMES.forEach((name, c) => {
      const digits = el("div", { class: "digits" });
      [0, 1].forEach((d) => {
        const bump = (delta) => bumpDigit(c, d, delta);
        const face = el("div", { class: "face", "data-d": d, text: "0" });
        face.addEventListener("click", () => bump(1));
        face.addEventListener("wheel", (e) => { e.preventDefault(); bump(e.deltaY < 0 ? 1 : -1); }, { passive: false });
        digits.append(el("div", { class: "hexwheel" }, [
          el("button", { type: "button", "aria-label": `Tăng chữ số ${d === 0 ? "trái" : "phải"} kênh ${name}`, text: "▲", onclick: () => bump(1) }),
          face,
          el("button", { type: "button", "aria-label": `Giảm chữ số ${d === 0 ? "trái" : "phải"} kênh ${name}`, text: "▼", onclick: () => bump(-1) }),
          el("span", { class: "wt", text: d === 0 ? "×16" : "×1" }),
        ]));
      });
      box.append(el("div", { class: "channel", "data-c": c }, [
        el("div", { class: "name", text: name }),
        digits,
        el("div", {}, [el("div", { class: "dec" }), el("div", { class: "hint" })]),
      ]));
    });
  }

  function bumpDigit(c, d, delta) {
    if (S.done) return;
    let hi = S.mine[c] >> 4, lo = S.mine[c] & 15;
    if (d === 0) hi = (hi + delta + 16) % 16; else lo = (lo + delta + 16) % 16;
    S.mine[c] = hi * 16 + lo;
    G.sound.play("pop");
    renderMine();
  }

  function renderMine(fromInput = false) {
    const c = code(S.mine);
    $("#sw-mine").style.background = c;
    $("#mine-code").textContent = c;
    if (!fromInput) $("#hex-text").value = c;
    G.$$(".channel", $("#channels")).forEach((ch, i) => {
      const v = S.mine[i];
      const faces = G.$$(".face", ch);
      faces[0].textContent = G.digitChar(v >> 4);
      faces[1].textContent = G.digitChar(v & 15);
      $(".dec", ch).textContent = `${v >> 4}×16 + ${v & 15} = ${v}`;
    });
  }

  function check() {
    if (S.done) return;
    S.tries++;
    $("#hud-tries").textContent = S.tries;
    const pct = closeness(S.mine, S.target);
    const exact = code(S.mine) === code(S.target);
    const passed = exact || (S.level.pass < 100 && pct >= S.level.pass);
    $("#meter-fill").style.width = pct.toFixed(1) + "%";
    $("#meter-fill").style.backgroundSize = (10000 / Math.max(pct, 1)).toFixed(0) + "% 100%";
    $("#meter-val").textContent = (exact ? 100 : Math.min(pct, 99.9)).toFixed(1) + "%";

    G.$$(".channel", $("#channels")).forEach((ch, i) => {
      const diff = S.target[i] - S.mine[i];
      const h = $(".hint", ch);
      const tol = S.level.pass < 100 ? 12 : 0;
      if (Math.abs(diff) <= tol) { h.className = "hint ok"; h.textContent = diff === 0 ? "✓ đúng" : "✓ gần đúng"; }
      else if (diff > 0) { h.className = "hint up"; h.textContent = diff > 64 ? "↑↑ tăng nhiều" : "↑ tăng"; }
      else { h.className = "hint down"; h.textContent = diff < -64 ? "↓↓ giảm nhiều" : "↓ giảm"; }
    });

    if (passed) {
      S.done = true;
      const gained = Math.max(10, 50 - 8 * (S.tries - 1));
      S.score += gained;
      if (S.tries === 1) S.perfect++;
      $("#hud-score").textContent = S.score;
      G.sound.play("good");
      const t = code(S.target);
      setFeedback("#mix-feedback", `✓ Khớp! +${gained} điểm. Mã mẫu là <b class="mono">${t}</b>`
        + `<span class="detail mono">${breakdown(S.target)}</span>`, "good");
      $("#btn-check").hidden = true;
      $("#btn-next").hidden = false;
      $("#btn-next").focus();
    } else {
      G.sound.play("bad");
      setFeedback("#mix-feedback", `Chưa khớp. Xem gợi ý ↑/↓ dưới từng kênh.`
        + (S.tries >= 4 ? `<span class="detail">Gợi ý: chỉnh chữ số <b>trái</b> (×16) trước để tiến nhanh, chữ số phải chỉ để tinh chỉnh.</span>` : ""), "warn");
    }
  }

  function breakdown(c) {
    return c.map((v, i) => `${NAMES[i]} = ${hex2(v)} = ${v >> 4}×16 + ${v & 15} = ${v}`).join(" · ");
  }

  $("#hex-text").addEventListener("input", (e) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(e.target.value.trim());
    if (!m || S.done) return;
    S.mine = [0, 2, 4].map((k) => parseInt(m[1].slice(k, k + 2), 16));
    renderMine(true);
  });
  $("#hex-text").addEventListener("keydown", (e) => { if (e.key === "Enter") check(); });

  /* ================= Đọc mã ================= */
  function startRead() {
    S.target = randomColor(S.level.values);
    const t = code(S.target);
    $("#read-code").innerHTML = `#<span class="r">${hex2(S.target[0])}</span><span class="g">${hex2(S.target[1])}</span><span class="b">${hex2(S.target[2])}</span>`;
    const options = G.shuffle([S.target, ...distractors(S.target)]);
    const box = $("#choices");
    box.innerHTML = "";
    box.classList.remove("revealed");
    options.forEach((c, i) => {
      box.append(el("button", {
        class: "choice", type: "button", "aria-label": `Lựa chọn ${i + 1}`, style: `background:${code(c)}`,
        "data-code": code(c), onclick: (e) => answerRead(e.currentTarget, code(c) === t),
      }));
    });
    $("#btn-read-next").hidden = true;
    setFeedback("#read-feedback", "Đọc từng cặp chữ số: RR, GG, BB. Phím <kbd>1</kbd>–<kbd>4</kbd> để chọn.");
  }

  /** Đáp án nhiễu dựa trên lỗi hay gặp: đảo R↔B, đảo 2 chữ số trong một kênh, nhầm kênh. */
  function distractors(t) {
    const cands = [
      [t[2], t[1], t[0]],                                             // đọc ngược BGR
      t.map((v, i) => (i === G.randInt(0, 2) ? ((v & 15) << 4) | (v >> 4) : v)), // đảo chữ số trong một kênh
      [t[1], t[0], t[2]],                                             // nhầm R↔G
      [t[0], t[2], t[1]],                                             // nhầm G↔B
      t.map((v) => 255 - v),                                          // màu bù
    ];
    const hard = !S.level.values;
    const out = [];
    const ok = (c) => [t, ...out].every((o) => dist(o, c) >= (hard ? 45 : 70));
    for (const c of G.shuffle(cands)) if (out.length < 3 && ok(c)) out.push(c);
    let guard = 0;
    while (out.length < 3 && guard++ < 500) {
      const c = hard ? t.map((v) => Math.max(0, Math.min(255, v + G.randInt(-120, 120)))) : [0, 1, 2].map(() => randChannel(STEP33));
      if (ok(c)) out.push(c);
    }
    return out;
  }

  function answerRead(btn, right) {
    if (S.done) return;
    S.done = true;
    const box = $("#choices");
    box.classList.add("revealed");
    G.$$(".choice", box).forEach((b) => {
      b.append(el("span", { class: "lbl", text: b.dataset.code }));
      if (b.dataset.code === code(S.target)) b.classList.add("right");
    });
    if (right) {
      S.score += 10; S.perfect++;
      $("#hud-score").textContent = S.score;
      G.sound.play("good");
      setFeedback("#read-feedback", `✓ Đúng! +10 <span class="detail mono">${breakdown(S.target)}</span>`, "good");
    } else {
      btn.classList.add("wrong");
      G.shake(btn);
      G.sound.play("bad");
      const picked = btn.dataset.code;
      let why = "";
      if (picked === code([S.target[2], S.target[1], S.target[0]])) why = "Bạn đã đọc ngược thứ tự thành B-G-R. Thứ tự luôn là <b>R</b>, <b>G</b>, <b>B</b> từ trái sang phải.";
      else if (dist(picked.slice(1).match(/../g).map((h) => parseInt(h, 16)), S.target.map((v) => 255 - v)) === 0) why = "Đó là màu bù (255 − mỗi kênh).";
      setFeedback("#read-feedback", `✗ Chưa đúng, bạn chọn <b class="mono">${picked}</b>. ${why}<span class="detail mono">${breakdown(S.target)}</span>`, "bad");
    }
    $("#btn-read-next").hidden = false;
    $("#btn-read-next").focus();
  }

  /* ================= Chung ================= */
  function finish() {
    const { isNew } = G.progress.record("hex-color-mixer", S.lv, S.score, LEVELS.length);
    G.showScreen("end");
    $("#end-score").textContent = S.score;
    const all = S.perfect === S.level.rounds;
    $("#end-title").textContent = all ? "Mắt hex siêu đẳng! 🎉" : "Hoàn thành level!";
    $("#end-detail").textContent = (S.level.kind === "mix"
      ? `${S.perfect}/${S.level.rounds} vòng khớp ngay lần kiểm tra đầu.`
      : `Đúng ${S.perfect}/${S.level.rounds} câu.`) + (isNew ? " Kỷ lục mới!" : "");
    if (all) { G.confetti(); G.sound.play("win"); }
    G.mountNextLink($("#next-game"));
  }

  function setFeedback(sel, html, type = "") {
    const f = $(sel);
    f.className = "feedback " + type;
    f.innerHTML = html;
  }

  document.addEventListener("keydown", (e) => {
    if ($("[data-screen=play]").hidden || e.target.tagName === "INPUT") return;
    if (S.level.kind === "read") {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 4 && !S.done) G.$$(".choice")[n - 1].click();
      if (e.key === "Enter" && S.done) { e.preventDefault(); nextRound(); }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (S.done) nextRound(); else check();
    }
  });

  $("#btn-check").addEventListener("click", check);
  $("#btn-next").addEventListener("click", nextRound);
  $("#btn-read-next").addEventListener("click", nextRound);
  $("#btn-again").addEventListener("click", () => startLevel(S.lv));
  $("#btn-menu").addEventListener("click", () => { G.renderLevels($("#levels"), LEVELS, startLevel); G.showScreen("start"); });

  G.renderLevels($("#levels"), LEVELS, startLevel);
})();
