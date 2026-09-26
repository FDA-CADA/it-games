/* Sample the Wave — sampling rate, bit depth, Nyquist và dung lượng âm thanh. Xem README.md. */
(function () {
  "use strict";
  const { $, el, L } = G;

  const RATES = [2000, 4000, 8000, 11025, 16000, 22050, 32000, 44100, 48000];
  const DURATION = 10;       // giây, dùng để tính dung lượng
  const CLIP = 2.5;          // giây, đoạn nghe thử
  const QUALITY = [
    { name: L("Tệ", "Poor"), cls: "q-bad" }, { name: L("Chấp nhận được", "Acceptable"), cls: "q-ok" }, { name: L("Tốt", "Good"), cls: "q-good" }, { name: "CD", cls: "q-cd" },
  ];
  const KB = 1024, MB = 1024 * 1024;

  /* ---------- Hai loại tín hiệu ---------- */
  const TAU = 2 * Math.PI;
  const SIGNALS = {
    voice: {
      name: L("Giọng nói", "Voice"), fmax: 3400, win: 0.008,
      f: (t) => {
        const f0 = 180, env = 0.55 + 0.45 * Math.sin(TAU * 3 * t) ** 2;
        let s = 0;
        for (let k = 1; k * f0 <= 3400; k++) {
          const f = k * f0, formant = 1 + 2.2 * Math.exp(-(((f - 700) / 250) ** 2)) + 1.6 * Math.exp(-(((f - 1200) / 300) ** 2)) + 1.2 * Math.exp(-(((f - 2600) / 400) ** 2));
          s += (formant / k) * Math.sin(TAU * f * t + 0.9 * k * k);
        }
        return env * s;
      },
    },
    music: {
      name: L("Nhạc", "Music"), fmax: 10000, win: 0.004,
      f: (t) => {
        const notes = [440, 554.37, 659.25, 880, 659.25, 554.37, 440, 329.63];
        const idx = Math.floor(t / 0.3) % notes.length, tn = t % 0.3, f = notes[idx];
        const env = Math.exp(-tn * 6);
        let s = 0;
        [1, 0.5, 0.33, 0.25].forEach((a, k) => { s += a * Math.sin(TAU * f * (k + 1) * t); });
        s += 0.35 * Math.sin(TAU * 6000 * t) * env + 0.3 * Math.sin(TAU * 9500 * t) * (0.5 + 0.5 * Math.sin(TAU * 2 * t));
        return env * s;
      },
    },
  };
  SIGNALS.hifi = {
    name: L("Nhạc Hi-Fi", "Hi-Fi music"), fmax: 20000, win: 0.002,
    f: (t) => SIGNALS.music.f(t) + 0.25 * Math.sin(TAU * 15000 * t) * (0.5 + 0.5 * Math.sin(TAU * 3 * t)),
  };
  // Chuẩn hóa biên độ về [-0.9, 0.9]
  for (const sg of Object.values(SIGNALS)) {
    let m = 0;
    for (let t = 0; t < CLIP; t += 1 / 20000) m = Math.max(m, Math.abs(sg.f(t)));
    const raw = sg.f;
    sg.f = (t) => (0.9 * raw(t)) / m;
  }

  const MISSIONS = [
    { sig: "voice", text: L("Lưu 10 giây <b>giọng nói</b> cho tổng đài.", "Store 10 seconds of <b>voice</b> for a call centre."), budget: 80 * KB, need: 1 },
    { sig: "music", text: L("Lưu 10 giây <b>nhạc</b> làm nhạc chờ, nghe phải <b>Tốt</b>.", "Store 10 seconds of <b>hold music</b> that sounds <b>Good</b>."), budget: 250 * KB, need: 2 },
    { sig: "music", text: L("Vẫn là <b>nhạc</b>, nhưng ngân sách eo hẹp hơn nhiều.", "<b>Music</b> again, but on a much tighter budget."), budget: 150 * KB, need: 1 },
    { sig: "voice", text: L("Podcast <b>giọng nói</b> cần chất lượng <b>Tốt</b>.", "A <b>voice</b> podcast that needs <b>Good</b> quality."), budget: 100 * KB, need: 2 },
    { sig: "hifi", text: L("Nhạc Hi-Fi <b>stereo</b> chất lượng <b>CD</b>, đủ dải tần tai người nghe được.", "Hi-Fi <b>stereo</b> music at <b>CD</b> quality, covering the full range of human hearing."), budget: 1.8 * MB, need: 3, stereo: true },
  ];
  const QUIZ = [
    { q: L("Giọng nói qua điện thoại có tần số cao nhất khoảng 3.4 kHz. Sampling rate tối thiểu là bao nhiêu?", "Telephone voice goes up to about 3.4 kHz. What is the minimum sampling rate?"), opts: [L("6.8 kHz (điện thoại dùng 8 kHz)", "6.8 kHz (phones use 8 kHz)"), "3.4 kHz", "1.7 kHz", "44.1 kHz"],
      why: L("Nyquist: sampling rate ≥ 2 × tần số cao nhất = 6.8 kHz. Mạng điện thoại dùng 8 kHz để có chút dư.", "Nyquist: sampling rate ≥ 2 × highest frequency = 6.8 kHz. Phone networks use 8 kHz to leave some margin.") },
    { q: L("Vì sao đĩa CD chọn sampling rate 44.1 kHz?", "Why do CDs use a 44.1 kHz sampling rate?"), opts: [L("Tai người nghe tới khoảng 20 kHz, Nyquist cần hơn 40 kHz", "Human hearing reaches about 20 kHz, so Nyquist needs over 40 kHz"), L("Để file nhỏ nhất có thể", "To make files as small as possible"), L("Vì 44.1 là số may mắn", "Because 44.1 is a lucky number"), L("Để giảm bit depth", "To reduce the bit depth")],
      why: L("2 × 20 kHz = 40 kHz, cộng thêm khoảng dư cho bộ lọc chống aliasing, nên ra 44.1 kHz.", "2 × 20 kHz = 40 kHz, plus some margin for the anti-aliasing filter, giving 44.1 kHz.") },
    { q: L("Tăng bit depth từ 8 lên 16 bit thì dung lượng file thay đổi thế nào?", "Going from 8-bit to 16-bit depth, how does the file size change?"), opts: [L("Gấp đôi", "It doubles"), L("Tăng thêm 8 byte", "It grows by 8 bytes"), L("Gấp 256 lần", "It grows 256 times"), L("Không đổi", "No change")],
      why: L("Dung lượng tỉ lệ thuận với số bit mỗi mẫu: 16/8 = 2 lần. Nhưng số mức lượng tử tăng từ 2⁸ = 256 lên 2¹⁶ = 65 536 mức, tức gấp 256 lần!", "Size is proportional to bits per sample: 16/8 = 2 times. But the number of quantisation levels goes from 2⁸ = 256 to 2¹⁶ = 65 536, i.e. 256 times more!") },
    { q: L("10 giây nhạc CD stereo (44.1 kHz, 16 bit, 2 kênh) chiếm bao nhiêu?", "How big are 10 seconds of stereo CD audio (44.1 kHz, 16 bits, 2 channels)?"), opts: ["≈ 1.68 MB", "≈ 1.68 KB", "≈ 13.5 MB", "≈ 861 KB"],
      why: L("44 100 × 16 × 2 × 10 = 14 112 000 bit ÷ 8 = 1 764 000 byte ≈ 1.68 MB. (13.5 MB là quên chia 8, 861 KB là quên nhân 2 kênh.)", "44 100 × 16 × 2 × 10 = 14 112 000 bits ÷ 8 = 1 764 000 bytes ≈ 1.68 MB. (13.5 MB forgets to divide by 8, 861 KB forgets the 2 channels.)") },
    { q: L("Sampling rate thấp hơn mức Nyquist sẽ gây ra hiện tượng gì?", "What does a sampling rate below the Nyquist rate cause?"), opts: [L("Aliasing: âm cao biến thành âm giả, méo", "Aliasing: high notes turn into fake, distorted ones"), L("Nhiễu lượng tử (tiếng xì)", "Quantisation noise (hiss)"), L("File to hơn", "A bigger file"), L("Âm lượng nhỏ lại", "Lower volume")],
      why: L("Tần số cao hơn một nửa sampling rate bị \"gập\" xuống thành tần số giả. Thử lại nhiệm vụ nhạc với 8 kHz để nghe.", "Frequencies above half the sampling rate are \"folded\" down into fake frequencies. Retry a music mission at 8 kHz to hear it.") },
    { q: L("Bit depth quá thấp sẽ gây ra hiện tượng gì?", "What does too low a bit depth cause?"), opts: [L("Nhiễu lượng tử (tiếng xì, rè)", "Quantisation noise (hiss, crackle)"), "Aliasing", L("Mất hết âm bass", "Losing all the bass"), L("File to hơn", "A bigger file")],
      why: L("Mỗi mẫu bị làm tròn về mức gần nhất. Càng ít bit thì càng ít mức, sai số làm tròn nghe như tiếng rè. Thử 3 bit để nghe.", "Each sample is rounded to the nearest level. Fewer bits means fewer levels, and the rounding error sounds like crackle. Try 3 bits to hear it.") },
  ];
  const LEVELS = [
    { name: L("Kỹ sư âm thanh", "Sound engineer"), desc: L("5 nhiệm vụ ngân sách + chất lượng", "5 budget + quality missions"), kind: "lab" },
    { name: L("Câu hỏi Nyquist", "Nyquist quiz"), desc: L("6 câu kiểm tra nhanh", "6 quick questions"), kind: "quiz" },
  ];

  const S = { lv: 0, level: null, i: 0, score: 0, perfect: 0, tried: false, done: false, m: null, rateIdx: 2, bits: 8, ch: 1 };

  const rate = () => RATES[S.rateIdx];
  const sizeOf = (r, b, ch) => (r * b * ch * DURATION) / 8;
  const snrOf = (b) => 6.02 * b + 1.76;
  const rankOf = (r, b, fmax) => (r / 2 < fmax ? 0 : snrOf(b) < 30 ? 0 : snrOf(b) < 48 ? 1 : snrOf(b) < 96 ? 2 : 3);
  const khz = (r) => r / 1000 + " kHz";

  function optimum(m) {
    let best = Infinity;
    const chs = m.stereo ? [2] : [1];
    for (const r of RATES) for (let b = 1; b <= 16; b++) for (const ch of chs) {
      const s = sizeOf(r, b, ch);
      if (s <= m.budget && rankOf(r, b, SIGNALS[m.sig].fmax) >= m.need) best = Math.min(best, s);
    }
    return best;
  }

  /* ---------- Level ---------- */
  function startLevel(i) {
    S.lv = i; S.level = LEVELS[i]; S.i = 0; S.score = 0; S.perfect = 0;
    $("#hud-level").textContent = i + 1;
    $("#p-lab").hidden = S.level.kind !== "lab";
    $("#p-quiz").hidden = S.level.kind !== "quiz";
    G.showScreen("play");
    if (S.level.kind === "lab") showMission(); else showQuiz();
  }

  function showMission() {
    if (S.i >= MISSIONS.length) return finish();
    const m = (S.m = MISSIONS[S.i]);
    S.tried = false; S.done = false;
    S.rateIdx = 2; S.bits = 8; S.ch = 1;
    $("#hud-round").textContent = `${S.i + 1}/${MISSIONS.length}`;
    $("#hud-score").textContent = S.score;
    const sg = SIGNALS[m.sig];
    $("#mission").innerHTML = `${L("Nhiệm vụ", "Mission")} ${S.i + 1}: ${m.text}<div class="req">
      <span>🎵 ${sg.name}: ${L("tần số cao nhất", "highest frequency")} ≈ ${khz(sg.fmax)}</span>
      <span>💾 ${L("Ngân sách", "Budget")} ≤ ${G.formatBytes(m.budget)}</span>
      <span>🎚️ ${L("Chất lượng", "Quality")} ≥ ${QUALITY[m.need].name}</span>${m.stereo ? `<span>🎧 ${L("Bắt buộc stereo", "Stereo required")}</span>` : ""}</div>`;
    $("#chan-wrap").hidden = !m.stereo;
    $("#rate").value = S.rateIdx;
    $("#bits").value = S.bits;
    $("#btn-submit").hidden = false;
    $("#btn-next").hidden = true;
    setFeedback(L("Chỉnh hai thanh trượt, nghe thử, rồi bấm <b>📤 Nộp cấu hình</b>.", "Adjust the two sliders, listen, then press <b>📤 Submit settings</b>."));
    update();
  }

  function update() {
    const m = S.m, sg = SIGNALS[m.sig], r = rate(), b = S.bits, ch = S.ch;
    $("#rate-val").textContent = G.fmtInt(r) + " Hz";
    $("#bits-val").textContent = `${b} bit (${G.fmtInt(2 ** b)} ${L("mức", "levels")})`;
    G.$$(".chan-btn").forEach((x) => x.classList.toggle("sel", Number(x.dataset.ch) === ch));
    const size = sizeOf(r, b, ch);
    $("#size-calc").textContent = `${G.fmtInt(r)} × ${b} × ${ch} × ${DURATION} ÷ 8 = ${G.fmtInt(size)} B ≈ ${G.formatBytes(size)}`;
    const ratio = size / m.budget;
    $("#budget-fill").style.width = Math.min(100, ratio * 100) + "%";
    $(".budget").classList.toggle("over", ratio > 1);
    $("#budget-text").textContent = ratio > 1 ? L(`❌ Vượt ngân sách ${G.formatBytes(size - m.budget)}`, `❌ Over budget by ${G.formatBytes(size - m.budget)}`) : L(`✓ Dùng ${Math.round(ratio * 100)}% ngân sách`, `✓ Using ${Math.round(ratio * 100)}% of the budget`);
    const nyqOk = r / 2 >= sg.fmax;
    $("#nyq").innerHTML = `Nyquist: ${khz(r)} ÷ 2 = ${khz(r / 2)} ${nyqOk ? "≥" : "<"} ${khz(sg.fmax)} ${nyqOk ? "✓" : "❌ <b>aliasing!</b>"}`;
    $("#snr").textContent = `SNR ≈ 6.02 × ${b} + 1.76 = ${snrOf(b).toFixed(1)} dB`;
    const q = QUALITY[rankOf(r, b, sg.fmax)];
    $("#qlabel").className = "qlabel " + q.cls;
    $("#qlabel").textContent = q.name + (nyqOk ? "" : L(" (méo do aliasing)", " (aliasing distortion)"));
    draw();
  }

  /* ---------- Vẽ sóng ---------- */
  const quant = (x, b) => {
    const levels = 2 ** b, c = Math.max(-1, Math.min(0.999999, x));
    return ((Math.floor(((c + 1) / 2) * levels) + 0.5) / levels) * 2 - 1;
  };

  function draw() {
    const cv = $("#wave"), dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth, H = 200;
    cv.width = W * dpr; cv.height = H * dpr;
    const ctx = cv.getContext("2d");
    ctx.scale(dpr, dpr);
    const css = getComputedStyle(document.documentElement);
    const col = (v) => css.getPropertyValue(v).trim();
    const sg = SIGNALS[S.m.sig], t0 = 0.11, win = sg.win, r = rate(), b = S.bits;
    const X = (t) => ((t - t0) / win) * W, Y = (v) => H / 2 - v * (H / 2 - 10);
    ctx.clearRect(0, 0, W, H);
    // Các mức lượng tử
    if (b <= 5) {
      ctx.strokeStyle = col("--border"); ctx.lineWidth = 1;
      for (let k = 0; k < 2 ** b; k++) { const y = Y(((k + 0.5) / 2 ** b) * 2 - 1); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    }
    // Sóng gốc
    ctx.strokeStyle = col("--muted"); ctx.lineWidth = 1.5; ctx.beginPath();
    for (let px = 0; px <= W; px++) { const t = t0 + (px / W) * win, y = Y(sg.f(t)); px ? ctx.lineTo(px, y) : ctx.moveTo(px, y); }
    ctx.stroke();
    // Mẫu + bản tái tạo
    const n0 = Math.floor(t0 * r), n1 = Math.ceil((t0 + win) * r);
    const pts = [];
    for (let n = n0; n <= n1; n++) pts.push([X(n / r), Y(quant(sg.f(n / r), b))]);
    ctx.strokeStyle = col("--accent"); ctx.lineWidth = 2.5; ctx.beginPath();
    pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    if (pts.length < 120) {
      ctx.fillStyle = col("--bit-on");
      pts.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 3.5, 0, TAU); ctx.fill(); });
    }
    ctx.fillStyle = col("--muted"); ctx.font = "12px " + col("--mono");
    ctx.fillText(`${(win * 1000).toFixed(0)} ms · ${pts.length} ${L("mẫu trong khung này", "samples in this window")}`, 8, H - 8);
  }

  /* ---------- Âm thanh ---------- */
  let actx = null, src = null;
  function play(digital) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
      if (src) { try { src.stop(); } catch { /* đã dừng */ } }
      const sr = actx.sampleRate, N = Math.floor(CLIP * sr), sg = SIGNALS[S.m.sig];
      const buf = actx.createBuffer(1, N, sr), out = buf.getChannelData(0);
      if (!digital) for (let i = 0; i < N; i++) out[i] = sg.f(i / sr);
      else {
        // Lấy mẫu lý tưởng (không lọc chống aliasing), lượng tử hóa, rồi nội suy tuyến tính để phát lại
        const r = rate(), b = S.bits, M = Math.ceil(CLIP * r) + 2, smp = new Float32Array(M);
        for (let n = 0; n < M; n++) smp[n] = quant(sg.f(n / r), b);
        for (let i = 0; i < N; i++) { const p = (i / sr) * r, n = Math.floor(p), fr = p - n; out[i] = smp[n] + (smp[n + 1] - smp[n]) * fr; }
      }
      for (let i = 0; i < N; i++) out[i] *= 0.6 * Math.min(1, i / 800, (N - i) / 800);
      src = actx.createBufferSource();
      src.buffer = buf;
      src.connect(actx.destination);
      src.start();
    } catch (e) {
      setFeedback(L("Trình duyệt này không phát được âm thanh (Web Audio).", "This browser cannot play audio (Web Audio)."), "warn");
    }
  }

  /* ---------- Nộp ---------- */
  function submit() {
    if (S.done) return;
    const m = S.m, sg = SIGNALS[m.sig], r = rate(), b = S.bits, size = sizeOf(r, b, S.ch);
    const problems = [];
    if (m.stereo && S.ch !== 2) problems.push(L("Nhiệm vụ yêu cầu <b>stereo</b> (2 kênh).", "This mission requires <b>stereo</b> (2 channels)."));
    if (r / 2 < sg.fmax) problems.push(L(`Sampling rate quá thấp: cần ≥ 2 × ${khz(sg.fmax)} = ${khz(2 * sg.fmax)} để tránh aliasing.`, `Sampling rate too low: you need ≥ 2 × ${khz(sg.fmax)} = ${khz(2 * sg.fmax)} to avoid aliasing.`));
    else if (rankOf(r, b, sg.fmax) < m.need) problems.push(L(`Bit depth ${b} chưa đủ cho mức "${QUALITY[m.need].name}" (SNR ${snrOf(b).toFixed(1)} dB).`, `A bit depth of ${b} is not enough for "${QUALITY[m.need].name}" (SNR ${snrOf(b).toFixed(1)} dB).`));
    if (size > m.budget) problems.push(L(`Vượt ngân sách: ${G.formatBytes(size)} > ${G.formatBytes(m.budget)}.`, `Over budget: ${G.formatBytes(size)} > ${G.formatBytes(m.budget)}.`));
    if (problems.length) {
      S.tried = true;
      G.sound.play("bad");
      setFeedback(L("✗ Chưa đạt:", "✗ Not there yet:") + " <span class=\"detail\">" + problems.join("<br>") + "</span>", "bad");
      return;
    }
    S.done = true;
    const opt = optimum(m), eff = opt / size, bonus = Math.round(10 * eff);
    const gained = 20 + bonus;
    S.score += gained;
    if (!S.tried && eff >= 0.999) S.perfect++;
    $("#hud-score").textContent = S.score;
    G.sound.play("good");
    const effMsg = eff >= 0.999 ? L("Đây chính là cấu hình <b>tiết kiệm nhất</b> có thể.", "This is the <b>most economical</b> setup possible.") : L(`Cấu hình tiết kiệm nhất chỉ cần ${G.formatBytes(opt)} (bạn dùng ${G.formatBytes(size)}).`, `The most economical setup needs only ${G.formatBytes(opt)} (you used ${G.formatBytes(size)}).`);
    setFeedback(`✓ ${L("Đạt yêu cầu!", "Brief met!")} +${gained} <span class="detail">${effMsg}</span>`, "good");
    $("#btn-submit").hidden = true;
    $("#btn-next").hidden = false;
    $("#btn-next").focus();
  }

  /* ---------- Quiz ---------- */
  function showQuiz() {
    if (S.i >= QUIZ.length) return finish();
    const Q = QUIZ[S.i];
    S.tried = false; S.done = false;
    $("#hud-round").textContent = `${S.i + 1}/${QUIZ.length}`;
    $("#hud-score").textContent = S.score;
    $("#quiz-q").textContent = `${L("Câu", "Question")} ${S.i + 1}: ${Q.q}`;
    const box = $("#quiz-opts");
    box.innerHTML = "";
    G.shuffle(Q.opts.map((t, k) => ({ t, k }))).forEach((o) => box.append(el("button", {
      type: "button", class: "opt", text: o.t, onclick: (e) => answerQuiz(e.currentTarget, o.k === 0),
    })));
    $("#btn-quiz-next").hidden = true;
    setFeedback(L("Chọn một đáp án.", "Pick an answer."), "", "#quiz-feedback");
  }

  function answerQuiz(btn, right) {
    if (S.done) return;
    if (right) {
      S.done = true;
      btn.classList.add("right");
      if (!S.tried) { S.score += 10; S.perfect++; }
      $("#hud-score").textContent = S.score;
      G.sound.play("good");
      setFeedback(`✓ ${L("Đúng!", "Correct!")} <span class="detail">${QUIZ[S.i].why}</span>`, "good", "#quiz-feedback");
      $("#btn-quiz-next").hidden = false;
      $("#btn-quiz-next").focus();
    } else {
      S.tried = true;
      btn.classList.add("wrong");
      btn.disabled = true;
      G.sound.play("bad");
      setFeedback(L("✗ Chưa đúng, thử lại.", "✗ Not quite, try again."), "bad", "#quiz-feedback");
    }
  }

  function finish() {
    if (src) { try { src.stop(); } catch { /* đã dừng */ } }
    const { isNew } = G.progress.record("sample-the-wave", S.lv, S.score, LEVELS.length);
    G.showScreen("end");
    $("#end-score").textContent = S.score;
    const n = S.level.kind === "lab" ? MISSIONS.length : QUIZ.length, all = S.perfect === n;
    $("#end-title").textContent = all ? L("Kỹ sư âm thanh xuất sắc! 🎉", "Brilliant sound engineer! 🎉") : L("Hoàn thành level!", "Level complete!");
    $("#end-detail").textContent = (S.level.kind === "lab" ? L(`${S.perfect}/${n} nhiệm vụ đạt cấu hình tiết kiệm nhất ngay lần đầu.`, `${S.perfect}/${n} missions solved with the most economical setup on the first try.`) : L(`Đúng ngay lần đầu ${S.perfect}/${n} câu.`, `${S.perfect}/${n} right on the first try.`)) + (isNew ? L(" Kỷ lục mới!", " New best!") : "");
    if (all) { G.confetti(); G.sound.play("win"); }
    G.mountNextLink($("#next-game"));
  }

  function setFeedback(html, type = "", sel = "#feedback") {
    const f = $(sel);
    f.className = "feedback " + type;
    f.innerHTML = html;
  }

  $("#rate").addEventListener("input", (e) => { if (S.done) { e.target.value = S.rateIdx; return; } S.rateIdx = Number(e.target.value); update(); });
  $("#bits").addEventListener("input", (e) => { if (S.done) { e.target.value = S.bits; return; } S.bits = Number(e.target.value); update(); });
  G.$$(".chan-btn").forEach((b) => b.addEventListener("click", () => { if (S.done) return; S.ch = Number(b.dataset.ch); update(); }));
  $("#play-orig").addEventListener("click", () => play(false));
  $("#play-dig").addEventListener("click", () => play(true));
  $("#btn-submit").addEventListener("click", submit);
  $("#btn-next").addEventListener("click", () => { S.i++; showMission(); });
  $("#btn-quiz-next").addEventListener("click", () => { S.i++; showQuiz(); });
  window.addEventListener("resize", () => { if (!$("#p-lab").hidden && S.m) draw(); });
  document.addEventListener("keydown", (e) => {
    if ($("[data-screen=play]").hidden || e.key !== "Enter" || !S.done) return;
    e.preventDefault();
    S.i++;
    if (S.level.kind === "lab") showMission(); else showQuiz();
  });
  $("#btn-again").addEventListener("click", () => startLevel(S.lv));
  $("#btn-menu").addEventListener("click", () => { G.renderLevels($("#levels"), LEVELS, startLevel); G.showScreen("start"); });

  G.renderLevels($("#levels"), LEVELS, startLevel);
})();
