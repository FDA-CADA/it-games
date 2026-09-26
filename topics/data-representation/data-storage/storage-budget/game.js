/* Storage Budget — ước lượng dung lượng ảnh, âm thanh, video chưa nén. Xem README.md. */
(function () {
  "use strict";
  const { $, el, L } = G;

  const n = (x) => G.fmtInt(x);
  const dur = (d) => (d >= 60 ? d / 60 + L(" phút", " min") : d + L(" giây", " s"));
  const SEC = L("giây", "s"), SECS = L("giây", "seconds");
  const IMAGES = [
    { icon: "✍️", name: L("Ảnh chữ số MNIST", "MNIST digit image"), w: 28, h: 28, b: 8 },
    { icon: "🧠", name: L("Ảnh đầu vào mô hình ResNet", "ResNet model input image"), w: 224, h: 224, b: 24 },
    { icon: "🖼️", name: L("Ảnh VGA", "VGA image"), w: 640, h: 480, b: 24 },
    { icon: "🖥️", name: L("Hình nền Full HD", "Full HD wallpaper"), w: 1920, h: 1080, b: 24 },
    { icon: "📱", name: L("Ảnh 12 MP từ điện thoại", "12 MP phone photo"), w: 4000, h: 3000, b: 24 },
    { icon: "🪟", name: L("Ảnh PNG có kênh trong suốt (alpha)", "PNG with a transparency (alpha) channel"), w: 1280, h: 720, b: 32 },
    { icon: "📄", name: L("Bản scan A4 đen trắng", "Black-and-white A4 scan"), w: 2480, h: 3508, b: 1 },
  ];
  const AUDIOS = [
    { icon: "☎️", name: L("Cuộc gọi điện thoại 1 phút", "1-minute phone call"), r: 8000, b: 8, ch: 1, d: 60 },
    { icon: "🎵", name: L("Bài hát 3 phút chất lượng CD", "3-minute CD-quality song"), r: 44100, b: 16, ch: 2, d: 180 },
    { icon: "🎙️", name: L("Voice note 10 giây", "10-second voice note"), r: 16000, b: 16, ch: 1, d: 10 },
    { icon: "📻", name: L("Podcast 10 phút", "10-minute podcast"), r: 22050, b: 16, ch: 1, d: 600 },
    { icon: "🎚️", name: L("Bản thu phòng studio 1 phút", "1-minute studio recording"), r: 48000, b: 24, ch: 2, d: 60 },
  ];
  const VIDEOS = [
    { icon: "🎞️", name: "Clip 720p", w: 1280, h: 720, b: 24, fps: 30, d: 10 },
    { icon: "🎬", name: L("Video Full HD 1 phút", "1-minute Full HD video"), w: 1920, h: 1080, b: 24, fps: 30, d: 60 },
    { icon: "🐱", name: L("Ảnh động GIF", "Animated GIF"), w: 320, h: 240, b: 8, fps: 15, d: 5 },
    { icon: "📹", name: L("Camera an ninh 1 giờ", "1 hour of security camera"), w: 640, h: 480, b: 24, fps: 10, d: 3600 },
    { icon: "🏎️", name: "Slow-motion 4K", w: 3840, h: 2160, b: 24, fps: 120, d: 2 },
  ];
  const BOSS = { icon: "👾", name: L("Video trên slide 81", "The video from slide 81"), boss: true, w: 640, h: 480, b: 24, fps: 120, d: 10 };

  const LEVELS = [
    { name: L("Ảnh", "Images"), desc: L("rộng × cao × bit ÷ 8", "width × height × bits ÷ 8"), pool: () => G.shuffle(IMAGES).slice(0, 5).map((x) => ({ kind: "img", ...x })) },
    { name: L("Âm thanh", "Audio"), desc: L("rate × bit × kênh × giây ÷ 8", "rate × bits × channels × seconds ÷ 8"), pool: () => G.shuffle(AUDIOS).map((x) => ({ kind: "aud", ...x })) },
    { name: "Video", desc: L("rộng × cao × bit × fps × giây ÷ 8", "width × height × bits × fps × seconds ÷ 8"), pool: () => G.shuffle(VIDEOS).map((x) => ({ kind: "vid", ...x })) },
    { name: "Boss", desc: L("Trộn cả ba, trùm cuối slide 81", "All three mixed, final boss from slide 81"), pool: () => [
      { kind: "img", ...G.pick(IMAGES) }, { kind: "aud", ...G.pick(AUDIOS) }, { kind: "vid", ...G.pick(VIDEOS) }, { kind: "aud", ...G.pick(AUDIOS) }, { kind: "vid", ...BOSS },
    ] },
  ];
  const TIME = 40;

  const S = { lv: 0, level: null, qs: [], i: 0, score: 0, correct: 0, done: false, timer: null, c: null };

  /* ---------- Tính toán ---------- */
  const T = { div8: L("quên chia 8", "forget to divide by 8"), unit: L("nhầm đơn vị", "mix up the units"), dur: L("quên nhân thời lượng", "forget to multiply by the duration"), frame: L("khung", "frame") };
  function solve(c) {
    if (c.kind === "img") {
      const px = c.w * c.h, bits = px * c.b, bytes = bits / 8;
      return { bytes, params: [`${c.w} × ${c.h} px`, `${c.b} bit/pixel`],
        steps: [`${n(c.w)} × ${n(c.h)} = ${n(px)} pixel`, `× ${c.b} bit = ${n(bits)} bit`, `÷ 8 = ${n(bytes)} byte`],
        traps: [{ v: bits, why: T.div8 }, c.b >= 24 && { v: px, why: L("tính như ảnh xám 8-bit", "treat it as an 8-bit gray image") }, c.b === 24 && { v: bytes * 3, why: L("nhân 3 kênh lần nữa", "multiply by 3 channels a second time") }, { v: bytes * 1024, why: T.unit }, { v: bytes / 1024, why: T.unit }] };
    }
    if (c.kind === "aud") {
      const bps = c.r * c.b * c.ch, bits = bps * c.d, bytes = bits / 8;
      return { bytes, params: [`${n(c.r)} Hz`, `${c.b} bit`, c.ch === 2 ? L("stereo (2 kênh)", "stereo (2 channels)") : L("mono (1 kênh)", "mono (1 channel)"), dur(c.d)],
        steps: [`${n(c.r)} × ${c.b} × ${c.ch} = ${n(bps)} bit/${SEC}`, `× ${n(c.d)} ${SECS} = ${n(bits)} bit`, `÷ 8 = ${n(bytes)} byte`],
        traps: [{ v: bits, why: T.div8 }, c.ch === 2 && { v: bytes / 2, why: L("quên nhân 2 kênh", "forget the 2 channels") }, { v: bytes / c.d, why: T.dur }, c.d >= 60 && { v: bytes / 60, why: L("nhầm phút thành giây", "mix up minutes and seconds") }, { v: bytes * 1024, why: T.unit }] };
    }
    const px = c.w * c.h, frame = px * c.b, bits = frame * c.fps * c.d, bytes = bits / 8;
    return { bytes, params: [`${c.w} × ${c.h} px`, `${c.b} bit/pixel`, `${c.fps} fps`, dur(c.d)],
      steps: [`${n(c.w)} × ${n(c.h)} = ${n(px)} pixel/${T.frame}`, `× ${c.b} bit = ${n(frame)} bit/${T.frame}`, `× ${c.fps} fps × ${n(c.d)} ${SECS} = ${n(bits)} bit`, `÷ 8 = ${n(bytes)} byte`],
      traps: [{ v: bits, why: T.div8 }, { v: bytes / c.fps, why: L("quên nhân fps", "forget to multiply by fps") }, { v: bytes / c.d, why: T.dur }, { v: bytes / (c.fps * c.d), why: L("chỉ tính 1 khung hình", "count only one frame") }, { v: bytes * 1024, why: T.unit }] };
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
    while (opts.length < 4) { const v = sol.bytes * (k % 2 ? 1 / k : k); if (opts.every((o) => label(o.v) !== label(v))) opts.push({ v, why: L("sai hệ số", "use a wrong factor") }); k++; }
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
    setFeedback(c.boss ? L("Trùm cuối! Tính cẩn thận từng bước.", "Final boss! Work it out step by step.") : L("Nhân các thông số, đừng quên ÷ 8.", "Multiply the parameters, and don't forget ÷ 8."));
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
    if (S.c.boss) extra = L(`<br>Khoảng 1.03 GB cho 10 giây (1 GB = 1024³ B), hoặc ≈ 1.1 GB nếu tính 1 GB = 10⁹ B. Vì vậy video luôn phải nén (H.264, H.265 nén được hàng trăm lần).`, `<br>About 1.03 GB for 10 seconds (1 GB = 1024³ B), or ≈ 1.1 GB with 1 GB = 10⁹ B. That is why video is always compressed (H.264 and H.265 shrink it hundreds of times).`);
    if (right) {
      const gained = 10 + Math.floor(S.timer.left / 4);
      S.score += gained; S.correct++;
      G.sound.play(S.c.boss ? "win" : "good");
      if (S.c.boss) G.confetti();
      setFeedback(`✓ ${L("Chính xác!", "Correct!")} +${gained}<span class="detail">${stepsHtml}${extra}</span>`, "good");
    } else {
      if (btn) btn.classList.add("wrong");
      G.sound.play("bad");
      const why = o ? L(`Đáp án bạn chọn là kết quả khi <b>${o.why}</b>.`, `The answer you picked is what you get if you <b>${o.why}</b>.`) : L("⏰ Hết giờ!", "⏰ Time's up!");
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
    $("#end-title").textContent = all ? L("Kế toán dung lượng! 🎉", "Storage accountant! 🎉") : L("Hoàn thành level!", "Level complete!");
    $("#end-detail").textContent = L(`Đúng ${S.correct}/${S.qs.length} câu.`, `${S.correct}/${S.qs.length} correct.`) + (isNew ? L(" Kỷ lục mới!", " New best!") : "");
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
