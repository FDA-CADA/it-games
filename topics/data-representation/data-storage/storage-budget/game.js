/* Storage Budget — ước lượng dung lượng ảnh, âm thanh, video chưa nén. Xem README.md. */
(function () {
  "use strict";
  const { $, el } = G;

  const n = (x) => G.fmtInt(x);
  const IMAGES = [
    { icon: "✍️", name: "Ảnh chữ số MNIST", w: 28, h: 28, b: 8 },
    { icon: "🧠", name: "Ảnh đầu vào mô hình ResNet", w: 224, h: 224, b: 24 },
    { icon: "🖼️", name: "Ảnh VGA", w: 640, h: 480, b: 24 },
    { icon: "🖥️", name: "Hình nền Full HD", w: 1920, h: 1080, b: 24 },
    { icon: "📱", name: "Ảnh 12 MP từ điện thoại", w: 4000, h: 3000, b: 24 },
    { icon: "🪟", name: "Ảnh PNG có kênh trong suốt (alpha)", w: 1280, h: 720, b: 32 },
    { icon: "📄", name: "Bản scan A4 đen trắng", w: 2480, h: 3508, b: 1 },
  ];
  const AUDIOS = [
    { icon: "☎️", name: "Cuộc gọi điện thoại 1 phút", r: 8000, b: 8, ch: 1, d: 60 },
    { icon: "🎵", name: "Bài hát 3 phút chất lượng CD", r: 44100, b: 16, ch: 2, d: 180 },
    { icon: "🎙️", name: "Voice note 10 giây", r: 16000, b: 16, ch: 1, d: 10 },
    { icon: "📻", name: "Podcast 10 phút", r: 22050, b: 16, ch: 1, d: 600 },
    { icon: "🎚️", name: "Bản thu phòng studio 1 phút", r: 48000, b: 24, ch: 2, d: 60 },
  ];
  const VIDEOS = [
    { icon: "🎞️", name: "Clip 720p", w: 1280, h: 720, b: 24, fps: 30, d: 10 },
    { icon: "🎬", name: "Video Full HD 1 phút", w: 1920, h: 1080, b: 24, fps: 30, d: 60 },
    { icon: "🐱", name: "Ảnh động GIF", w: 320, h: 240, b: 8, fps: 15, d: 5 },
    { icon: "📹", name: "Camera an ninh 1 giờ", w: 640, h: 480, b: 24, fps: 10, d: 3600 },
    { icon: "🏎️", name: "Slow-motion 4K", w: 3840, h: 2160, b: 24, fps: 120, d: 2 },
  ];
  const BOSS = { icon: "👾", name: "Video trên slide 81", boss: true, w: 640, h: 480, b: 24, fps: 120, d: 10 };

  const LEVELS = [
    { name: "Ảnh", desc: "rộng × cao × bit ÷ 8", pool: () => G.shuffle(IMAGES).slice(0, 5).map((x) => ({ kind: "img", ...x })) },
    { name: "Âm thanh", desc: "rate × bit × kênh × giây ÷ 8", pool: () => G.shuffle(AUDIOS).map((x) => ({ kind: "aud", ...x })) },
    { name: "Video", desc: "rộng × cao × bit × fps × giây ÷ 8", pool: () => G.shuffle(VIDEOS).map((x) => ({ kind: "vid", ...x })) },
    { name: "Boss", desc: "Trộn cả ba, trùm cuối slide 81", pool: () => [
      { kind: "img", ...G.pick(IMAGES) }, { kind: "aud", ...G.pick(AUDIOS) }, { kind: "vid", ...G.pick(VIDEOS) }, { kind: "aud", ...G.pick(AUDIOS) }, { kind: "vid", ...BOSS },
    ] },
  ];
  const TIME = 40;

  const S = { lv: 0, level: null, qs: [], i: 0, score: 0, correct: 0, done: false, timer: null, c: null };

  /* ---------- Tính toán ---------- */
  function solve(c) {
    if (c.kind === "img") {
      const px = c.w * c.h, bits = px * c.b, bytes = bits / 8;
      return { bytes, params: [`${c.w} × ${c.h} px`, `${c.b} bit/pixel`],
        steps: [`${n(c.w)} × ${n(c.h)} = ${n(px)} pixel`, `× ${c.b} bit = ${n(bits)} bit`, `÷ 8 = ${n(bytes)} byte`],
        traps: [{ v: bits, why: "quên chia 8" }, c.b >= 24 && { v: px, why: "tính như ảnh xám 8-bit" }, c.b === 24 && { v: bytes * 3, why: "nhân 3 kênh lần nữa" }, { v: bytes * 1024, why: "nhầm đơn vị" }, { v: bytes / 1024, why: "nhầm đơn vị" }] };
    }
    if (c.kind === "aud") {
      const bps = c.r * c.b * c.ch, bits = bps * c.d, bytes = bits / 8;
      return { bytes, params: [`${n(c.r)} Hz`, `${c.b} bit`, c.ch === 2 ? "stereo (2 kênh)" : "mono (1 kênh)", `${c.d >= 60 ? c.d / 60 + " phút" : c.d + " giây"}`],
        steps: [`${n(c.r)} × ${c.b} × ${c.ch} = ${n(bps)} bit/giây`, `× ${n(c.d)} giây = ${n(bits)} bit`, `÷ 8 = ${n(bytes)} byte`],
        traps: [{ v: bits, why: "quên chia 8" }, c.ch === 2 && { v: bytes / 2, why: "quên nhân 2 kênh" }, { v: bytes / c.d, why: "quên nhân thời lượng" }, c.d >= 60 && { v: bytes / 60, why: "nhầm phút thành giây" }, { v: bytes * 1024, why: "nhầm đơn vị" }] };
    }
    const px = c.w * c.h, frame = px * c.b, bits = frame * c.fps * c.d, bytes = bits / 8;
    return { bytes, params: [`${c.w} × ${c.h} px`, `${c.b} bit/pixel`, `${c.fps} fps`, `${c.d >= 60 ? c.d / 60 + " phút" : c.d + " giây"}`],
      steps: [`${n(c.w)} × ${n(c.h)} = ${n(px)} pixel/khung`, `× ${c.b} bit = ${n(frame)} bit/khung`, `× ${c.fps} fps × ${n(c.d)} giây = ${n(bits)} bit`, `÷ 8 = ${n(bytes)} byte`],
      traps: [{ v: bits, why: "quên chia 8" }, { v: bytes / c.fps, why: "quên nhân fps" }, { v: bytes / c.d, why: "quên nhân thời lượng" }, { v: bytes / (c.fps * c.d), why: "chỉ tính 1 khung hình" }, { v: bytes * 1024, why: "nhầm đơn vị" }] };
  }

  function buildOptions(sol) {
    const opts = [{ v: sol.bytes, right: true }];
    const label = (v) => G.formatBytes(v);
    for (const t of G.shuffle(sol.traps.filter(Boolean))) {
      if (opts.length >= 4) break;
      if (t.v < 1) continue;
      if (opts.every((o) => label(o.v) !== label(t.v) && Math.max(o.v, t.v) / Math.min(o.v, t.v) >= 1.5)) opts.push({ v: t.v, why: t.why });
    }
    let k = 2;
    while (opts.length < 4) { const v = sol.bytes * (k % 2 ? 1 / k : k); if (opts.every((o) => label(o.v) !== label(v))) opts.push({ v, why: "sai hệ số" }); k++; }
    return G.shuffle(opts);
  }

  /* ---------- Vòng chơi ---------- */
  function startLevel(i) {
    S.lv = i; S.level = LEVELS[i]; S.qs = S.level.pool(); S.i = 0; S.score = 0; S.correct = 0;
    $("#hud-level").textContent = i + 1;
    G.showScreen("play");
    ask();
  }

  function ask() {
    if (S.i >= S.qs.length) return finish();
    S.done = false;
    const c = (S.c = S.qs[S.i]), sol = (S.sol = solve(c));
    $("#hud-round").textContent = `${S.i + 1}/${S.qs.length}`;
    $("#hud-score").textContent = S.score;
    $("#clip").innerHTML = "";
    $("#clip").append(el("div", { class: "ic", text: c.icon }), el("div", { class: "info" }, [
      el("div", { class: "title", html: c.name + (c.boss ? '<span class="boss">BOSS</span>' : "") }),
      el("div", { class: "params" }, sol.params.map((p) => el("span", { text: p }))),
    ]));
    const box = $("#opts");
    box.innerHTML = "";
    buildOptions(sol).forEach((o, k) => box.append(el("button", {
      type: "button", class: "opt", html: `${G.formatBytes(o.v)}<small>${k + 1}</small>`, onclick: (e) => answer(e.currentTarget, o),
    })));
    $("#btn-next").hidden = true;
    setFeedback(c.boss ? "Trùm cuối! Tính cẩn thận từng bước." : "Nhân các thông số, đừng quên ÷ 8.");
    S.timer && S.timer.stop();
    S.timer = new G.Timer(TIME, (left, ratio) => { $("#hud-time").textContent = Math.ceil(left); G.renderTimerBar($("#timer-bar"), ratio); }, () => answer(null, null)).start();
  }

  function answer(btn, o) {
    if (S.done) return;
    S.done = true;
    S.timer.stop();
    const sol = S.sol, right = o && o.right;
    G.$$(".opt").forEach((b, k) => { b.disabled = true; if (b.textContent.startsWith(G.formatBytes(sol.bytes))) b.classList.add("right"); });
    const stepsHtml = `<ol class="steps">${sol.steps.map((s) => `<li>${s}</li>`).join("")}<li>= <b>${G.formatBytes(sol.bytes)}</b></li></ol>`;
    let extra = "";
    if (S.c.boss) extra = `<br>Khoảng 1.03 GB cho 10 giây (1 GB = 1024³ B), hoặc ≈ 1.1 GB nếu tính 1 GB = 10⁹ B. Vì vậy video luôn phải nén (H.264, H.265 nén được hàng trăm lần).`;
    if (right) {
      const gained = 10 + Math.floor(S.timer.left / 4);
      S.score += gained; S.correct++;
      G.sound.play(S.c.boss ? "win" : "good");
      if (S.c.boss) G.confetti();
      setFeedback(`✓ Chính xác! +${gained}<span class="detail">${stepsHtml}${extra}</span>`, "good");
    } else {
      if (btn) btn.classList.add("wrong");
      G.sound.play("bad");
      const why = o ? `Đáp án bạn chọn là kết quả khi <b>${o.why}</b>.` : "⏰ Hết giờ!";
      setFeedback(`✗ ${why}<span class="detail">${stepsHtml}${extra}</span>`, "bad");
    }
    $("#hud-score").textContent = S.score;
    $("#btn-next").hidden = false;
    $("#btn-next").focus();
  }

  function finish() {
    S.timer && S.timer.stop();
    const { isNew } = G.progress.record("storage-budget", S.lv, S.score, LEVELS.length);
    G.showScreen("end");
    $("#end-score").textContent = S.score;
    const all = S.correct === S.qs.length;
    $("#end-title").textContent = all ? "Kế toán dung lượng! 🎉" : "Hoàn thành level!";
    $("#end-detail").textContent = `Đúng ${S.correct}/${S.qs.length} câu.` + (isNew ? " Kỷ lục mới!" : "");
    if (all) { G.confetti(); G.sound.play("win"); }
    G.mountNextLink($("#next-game"));
  }

  function setFeedback(html, type = "") {
    const f = $("#feedback");
    f.className = "feedback " + type;
    f.innerHTML = html;
  }

  document.addEventListener("keydown", (e) => {
    if ($("[data-screen=play]").hidden) return;
    const k = parseInt(e.key, 10);
    if (!S.done && k >= 1 && k <= 4) G.$$(".opt")[k - 1].click();
    else if (S.done && e.key === "Enter") { e.preventDefault(); S.i++; ask(); }
  });
  $("#btn-next").addEventListener("click", () => { S.i++; ask(); });
  $("#btn-again").addEventListener("click", () => startLevel(S.lv));
  $("#btn-menu").addEventListener("click", () => { S.timer && S.timer.stop(); G.renderLevels($("#levels"), LEVELS, startLevel); G.showScreen("start"); });

  G.renderLevels($("#levels"), LEVELS, startLevel);
})();
