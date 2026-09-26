/* Exponent Zones — overflow, underflow và vùng subnormal của IEEE 754. Xem README.md. */
(function () {
  "use strict";
  const { $, el } = G;

  const f32 = Math.fround;
  const MIN_NORMAL = { f32: 2 ** -126, f64: 2 ** -1022 };
  const MIN_SUB = { f32: 2 ** -149, f64: 2 ** -1074 };
  const MANT = { f32: 24, f64: 53 };

  /* ---------- Các "thang trượt" ---------- */
  const probChain = (() => { const a = [1]; for (let n = 1; n <= 40; n++) a.push(f32(a[n - 1] * f32(0.01))); return a; })();
  const SCALES = {
    f32pow: { type: "f32", min: -160, max: 140, start: 0, value: (k) => f32(1.5 * 2 ** k), formula: (k) => `1.5 × 2<sup>${k}</sup>`, unit: "k" },
    f64pow: { type: "f64", min: -1090, max: 1040, start: 0, value: (k) => (k < -900 ? 1.5 * 2 ** (k + 200) * 2 ** -200 : 1.5 * 2 ** k), formula: (k) => `1.5 × 2<sup>${k}</sup>`, unit: "k" },
    prob: { type: "f32", min: 1, max: 40, start: 5, value: (n) => probChain[n], formula: (n) => `0.01 × 0.01 × … (${n} lần) = 0.01<sup>${n}</sup>`, unit: "N" },
    exp: { type: "f32", min: 0, max: 120, start: 10, value: (x) => f32(Math.exp(x)), formula: (x) => `e<sup>${x}</sup>`, unit: "x" },
  };
  const zoneOf = (v, type) => (v === 0 ? "zero" : !isFinite(v) ? "inf" : Math.abs(v) < MIN_NORMAL[type] ? "sub" : "norm");
  const scan = (sc, pred) => { const out = []; for (let k = sc.min; k <= sc.max; k++) if (pred(sc.value(k), k)) out.push(k); return out; };
  const maxFinite = (sc) => Math.max(...scan(sc, (v) => isFinite(v)));
  const minNonzero = (sc) => Math.min(...scan(sc, (v) => v !== 0));
  const firstZero = (sc) => Math.min(...scan(sc, (v) => v === 0));
  const minNormal = (sc) => Math.min(...scan(sc, (v) => zoneOf(v, sc.type) === "norm"));

  const slider = (scale, text, target, hint) => ({ kind: "slider", scale, text, target, hint });
  const mc = (text, code, opts, why, run) => ({ kind: "mc", text, code, opts, why, run });
  const nearHint = (k, t, up, down) => (k < t ? up : down);

  const LEVELS = [
    { name: "Tìm biên float32", desc: "Kéo tới ∞, về 0, và vào vùng subnormal", missions: [
      slider("f32pow", "Kéo tới số <b>lớn nhất</b> mà float32 vẫn chưa tràn thành ∞.", maxFinite,
        (k, t) => nearHint(k, t, "Vẫn còn tăng được nữa.", "Đã tràn thành ∞ rồi, lùi lại một chút.")),
      slider("f32pow", "Kéo tới số <b>nhỏ nhất vẫn khác 0</b>.", minNonzero,
        (k, t) => nearHint(k, t, "Đã rơi về 0 rồi, tăng lên.", "Vẫn còn giảm được nữa. Để ý vùng màu cam!")),
      slider("f32pow", "Tìm số nhỏ nhất vẫn còn <b>đủ 24 bit chính xác</b> (ranh giới Normal / Subnormal).", minNormal,
        (k, t) => nearHint(k, t, "Đang ở vùng subnormal, độ chính xác đã bị mất.", "Vẫn còn giảm được mà chưa mất bit nào.")),
      mc("Trong vùng <b>subnormal</b>, điều gì xảy ra với con số?", null,
        ["Vẫn khác 0 nhưng mất dần bit chính xác", "Bằng 0 ngay lập tức", "Thành ∞", "Máy báo lỗi"],
        "Exponent đã chạm đáy (00000000), nên máy dùng bớt bit mantissa để biểu diễn số nhỏ hơn nữa. Mỗi bước xuống lại mất một bit chính xác, cho đến khi hết bit thì về 0 (gradual underflow)."),
    ] },
    { name: "Dự đoán", desc: "Đoán trước kết quả, rồi xem máy tính thật", missions: [
      mc("Float32: 3×10³⁸ × 10 = ?", "np.float32(3e38) * np.float32(10)", ["3e+39", "inf", "nan", "Báo lỗi"],
        "Float32 lớn nhất ≈ 3.4×10³⁸. Vượt qua thì thành inf, <b>không báo lỗi</b> (NumPy chỉ in một cảnh báo).", () => f32(f32(3e38) * f32(10))),
      mc("Float32: 1×10⁻⁴⁵ ÷ 10 = ?", "np.float32(1e-45) / np.float32(10)", ["1e-46", "0.0", "-inf", "nan"],
        "1e−45 đã nằm sát đáy vùng subnormal (nhỏ nhất ≈ 1.4×10⁻⁴⁵). Chia tiếp thì underflow về 0.", () => f32(f32(1e-45) / f32(10))),
      mc("Tiếp tục: (3×10³⁸ × 10) ÷ 10 = ?", "(np.float32(3e38) * 10) / 10", ["3e+38", "inf", "3e+37", "nan"],
        "Đã thành inf thì chia bao nhiêu cũng vẫn là inf. Overflow <b>không quay lại được</b>.", () => f32(f32(f32(3e38) * 10) / 10)),
      mc("∞ − ∞ = ?", "np.inf - np.inf", ["0.0", "inf", "nan", "Báo lỗi"],
        "Kết quả không xác định nên IEEE 754 trả về NaN (Not a Number): exponent toàn 1, mantissa khác 0.", () => Infinity - Infinity),
      mc("Float32: 16 777 216 + 1 = ?", "np.float32(16777216) + np.float32(1)", ["16777217.0", "16777216.0", "inf", "Báo lỗi"],
        "16 777 216 = 2²⁴. Ở độ lớn này, khoảng cách giữa hai float32 liên tiếp là 2, nên +1 bị làm tròn mất. Exponent càng lớn thì các số càng thưa.", () => f32(f32(16777216) + f32(1))),
    ] },
    { name: "Float64", desc: "Exponent 11 bit: dải rộng hơn bao nhiêu?", missions: [
      slider("f64pow", "Float64: kéo tới số <b>lớn nhất</b> chưa tràn thành ∞.", maxFinite,
        (k, t) => nearHint(k, t, "Vẫn còn tăng được.", "Đã thành ∞, lùi lại.")),
      slider("f64pow", "Float64: kéo tới số <b>nhỏ nhất vẫn khác 0</b>.", minNonzero,
        (k, t) => nearHint(k, t, "Đã về 0, tăng lên.", "Vẫn còn giảm được nữa.")),
      mc("Float64 lớn nhất xấp xỉ bao nhiêu?", "np.finfo(np.float64).max", ["1.8e+308", "3.4e+38", "9.2e+18", "1e+100"],
        "Float64 lớn nhất ≈ 1.8×10³⁰⁸, còn float32 chỉ ≈ 3.4×10³⁸. (9.2×10¹⁸ là int64 lớn nhất.)", () => Number.MAX_VALUE),
      mc("Vì sao deep learning thường dùng float32 (thậm chí float16) thay vì float64?", null,
        ["Tốn ít bộ nhớ hơn, chạy nhanh hơn trên GPU", "Vì chính xác hơn float64", "Vì dải giá trị rộng hơn", "Vì không bao giờ bị tràn"],
        "Mỗi float32 chỉ tốn 4 byte (float64 tốn 8), nên mô hình nhẹ bằng một nửa và GPU tính nhanh hơn. Đổi lại dải và độ chính xác nhỏ hơn, nên phải cẩn thận với overflow/underflow như trong level sau."),
    ] },
    { name: "Cứu dữ liệu Data/AI", desc: "Tích xác suất và softmax", missions: [
      slider("prob", "Mô hình nhân <b>N</b> xác suất, mỗi cái 0.01, bằng float32. Tìm <b>N nhỏ nhất</b> làm tích bị underflow về 0.", firstZero,
        (k, t) => nearHint(k, t, "Tích vẫn còn khác 0.", "Tích đã bằng 0 từ trước đó rồi.")),
      mc("Cách chữa kinh điển cho tích nhiều xác suất?", "np.sum(np.log(p))  # thay cho np.prod(p)",
        ["Cộng log(p) thay vì nhân p", "Chuyển sang float16", "Nhân thêm 1000 ở cuối", "Làm tròn từng bước"],
        "log(0.01³⁰) = 30 × log(0.01) ≈ −138.2, một số hoàn toàn bình thường. Vì vậy các mô hình (Naive Bayes, language model…) làm việc với <b>log-probability</b>."),
      slider("exp", "Softmax cần tính e<sup>x</sup>. Tìm <b>x lớn nhất</b> mà float32 vẫn tính được e<sup>x</sup> (chưa thành ∞).", maxFinite,
        (k, t) => nearHint(k, t, "Vẫn còn tăng được.", "e^x đã tràn thành ∞.")),
      mc("Mẹo chuẩn trong softmax để e<sup>x</sup> không bao giờ tràn?", "e = np.exp(x - x.max()); e / e.sum()",
        ["Trừ max(x) trước khi tính e^x", "Chia x cho 2", "Dùng int32", "Bỏ qua các x lớn"],
        "softmax(x) = softmax(x − max(x)) nên kết quả không đổi, nhưng mọi số mũ đều ≤ 0 nên e<sup>x − max</sup> ≤ 1, không bao giờ tràn."),
    ] },
  ];

  const S = { lv: 0, level: null, i: 0, score: 0, perfect: 0, m: null, sc: null, k: 0, tried: false, done: false };

  const fmtv = (v) => (Number.isNaN(v) ? "nan" : v === Infinity ? "inf" : v === -Infinity ? "-inf" : v === 0 ? "0.0" : Math.abs(v) >= 1e6 || Math.abs(v) < 1e-4 ? v.toExponential(3) : String(v));

  function startLevel(i) {
    S.lv = i; S.level = LEVELS[i]; S.i = 0; S.score = 0; S.perfect = 0;
    $("#hud-level").textContent = i + 1;
    G.showScreen("play");
    showMission();
  }

  function showMission() {
    if (S.i >= S.level.missions.length) return finish();
    S.m = S.level.missions[S.i]; S.tried = false; S.done = false;
    $("#hud-round").textContent = `${S.i + 1}/${S.level.missions.length}`;
    $("#hud-score").textContent = S.score;
    $("#mission").innerHTML = `<span class="tag">${S.m.kind === "slider" ? "Thanh trượt" : "Dự đoán"}</span>${S.m.text}`;
    $("#p-slider").hidden = S.m.kind !== "slider";
    $("#p-mc").hidden = S.m.kind !== "mc";
    $("#btn-lock").hidden = S.m.kind !== "slider";
    $("#btn-next").hidden = true;
    if (S.m.kind === "slider") setupSlider(); else setupMc();
  }

  /* ---------- Thanh trượt ---------- */
  function setupSlider() {
    const sc = SCALES[S.m.scale];
    S.sc = sc;
    const sl = $("#slider");
    sl.min = sc.min; sl.max = sc.max; sl.step = 1; sl.value = sc.start;
    S.k = sc.start;
    // Vẽ dải màu theo vùng
    const bar = $("#zonebar");
    G.$$(".seg", bar).forEach((s) => s.remove());
    let prev = null, start = sc.min;
    const push = (z, a, b) => bar.insertBefore(el("span", { class: "seg " + z, style: `width:${((b - a + 1) / (sc.max - sc.min + 1)) * 100}%` }), $("#marker"));
    for (let k = sc.min; k <= sc.max + 1; k++) {
      const z = k <= sc.max ? zoneOf(sc.value(k), sc.type) : null;
      if (z !== prev) { if (prev) push(prev, start, k - 1); prev = z; start = k; }
    }
    setFeedback("Kéo thanh trượt, rồi bấm <b>📌 Chốt đáp án</b>.");
    updateSlider();
  }

  function updateSlider() {
    const sc = S.sc, k = S.k, v = sc.value(k), z = zoneOf(v, sc.type);
    $("#formula").innerHTML = `${sc.unit} = ${k}: &nbsp;${sc.formula(k)}`;
    $("#stored").textContent = fmtv(v);
    const badge = $("#zone-badge");
    badge.className = "zone-badge " + z;
    badge.textContent = { zero: "Underflow → 0", sub: "Subnormal", norm: "Normal", inf: "Overflow → ∞" }[z];
    let prec = "";
    if (z === "norm") prec = `Độ chính xác: đủ ${MANT[sc.type]} bit`;
    else if (z === "sub") prec = `⚠️ Chỉ còn ${Math.floor(Math.log2(Math.abs(v) / MIN_SUB[sc.type])) + 1}/${MANT[sc.type]} bit chính xác`;
    $("#precision").textContent = prec;
    $("#marker").style.left = ((k - sc.min + 0.5) / (sc.max - sc.min + 1)) * 100 + "%";
    // Hiện các trường bit đang lưu
    const n = sc.type === "f32" ? 32 : 64, eb = sc.type === "f32" ? 8 : 11;
    const dv = new DataView(new ArrayBuffer(8));
    let bits;
    if (n === 32) { dv.setFloat32(0, v); bits = dv.getUint32(0).toString(2).padStart(32, "0"); }
    else { dv.setFloat64(0, v); bits = dv.getUint32(0).toString(2).padStart(32, "0") + dv.getUint32(4).toString(2).padStart(32, "0"); }
    const mant = bits.slice(1 + eb);
    $("#fields").innerHTML = `<span class="lbl">Sign</span> <span class="s">${bits[0]}</span> · <span class="lbl">Exponent</span> <span class="e">${bits.slice(1, 1 + eb)}</span> · <span class="lbl">Mantissa</span> <span class="m">${n === 64 ? mant.slice(0, 20) + "…" : mant}</span>`;
    $("#slider").value = k;
  }

  function lock() {
    if (S.done || S.m.kind !== "slider") return;
    const t = S.m.target(S.sc);
    if (S.k === t) {
      S.done = true;
      const gained = S.tried ? 5 : 15;
      S.score += gained; if (!S.tried) S.perfect++;
      $("#hud-score").textContent = S.score;
      G.sound.play("good");
      const v = S.sc.value(t);
      setFeedback(`✓ Chính xác! ${S.sc.unit} = ${t}, máy lưu <b class="mono">${fmtv(v)}</b>. +${gained}${explainSlider(t)}`, "good");
      $("#btn-lock").hidden = true;
      $("#btn-next").hidden = false;
      $("#btn-next").focus();
    } else {
      S.tried = true;
      G.sound.play("bad");
      setFeedback(`✗ Chưa đúng. ${S.m.hint(S.k, t)}`, "bad");
    }
  }

  function explainSlider(t) {
    const sc = S.m.scale, tg = S.m.target;
    if (sc === "f32pow" && tg === maxFinite) return `<span class="detail">Exponent đã là 11111110 (254 − 127 = 127). Lên một nấc nữa là 11111111, mã dành riêng cho ∞.</span>`;
    if (sc === "f32pow" && tg === minNonzero) return `<span class="detail">Nhỏ hơn cả 2⁻¹²⁶ nhờ vùng subnormal: chỉ còn đúng 1 bit mantissa. Xuống thêm là hết bit, về 0.</span>`;
    if (sc === "f32pow" && tg === minNormal) return `<span class="detail">Số mũ thật nhỏ nhất của số normal là −126 (exponent 00000001). Từ đây trở xuống là subnormal.</span>`;
    if (sc === "f64pow") return `<span class="detail">Với 11 bit exponent, dải float64 rộng gấp khoảng 8 lần float32 tính theo số mũ.</span>`;
    if (sc === "prob") return `<span class="detail">Chỉ khoảng ${t} xác suất nhỏ nhân với nhau là float32 đã về 0, trong khi một câu văn bản có thể có hàng trăm từ!</span>`;
    if (sc === "exp") return `<span class="detail">e⁸⁸ ≈ 1.65×10³⁸, còn e⁸⁹ vượt 3.4×10³⁸. Logit lớn hơn 88 là softmax "ngây thơ" ra inf/nan.</span>`;
    return "";
  }

  /* ---------- Trắc nghiệm ---------- */
  function setupMc() {
    const m = S.m;
    $("#code").hidden = !m.code;
    $("#code").textContent = m.code ? ">>> " + m.code : "";
    const box = $("#opts");
    box.innerHTML = "";
    G.shuffle(m.opts.map((t, i) => ({ t, i }))).forEach((o) => box.append(el("button", {
      type: "button", class: "opt", html: o.t, onclick: (e) => answerMc(e.currentTarget, o.i === 0),
    })));
    setFeedback("Đoán trước, rồi xem máy tính thật ra gì.");
  }

  function answerMc(btn, right) {
    if (S.done) return;
    if (right) {
      S.done = true;
      btn.classList.add("right");
      if (!S.tried) { S.score += 10; S.perfect++; }
      $("#hud-score").textContent = S.score;
      G.sound.play("good");
      const real = S.m.run ? `<br><span class="mono">Trình duyệt của bạn vừa tính thật: ${fmtv(S.m.run())}</span>` : "";
      setFeedback(`✓ Đúng! <span class="detail">${S.m.why}${real}</span>`, "good");
      $("#btn-next").hidden = false;
      $("#btn-next").focus();
    } else {
      S.tried = true;
      btn.classList.add("wrong");
      btn.disabled = true;
      G.sound.play("bad");
      setFeedback("✗ Chưa đúng, thử lại.", "bad");
    }
  }

  function finish() {
    const { isNew } = G.progress.record("exponent-zones", S.lv, S.score, LEVELS.length);
    G.showScreen("end");
    $("#end-score").textContent = S.score;
    const n = S.level.missions.length, all = S.perfect === n;
    $("#end-title").textContent = all ? "Nhà thám hiểm số mũ! 🎉" : "Hoàn thành level!";
    $("#end-detail").textContent = `${S.perfect}/${n} nhiệm vụ đúng ngay lần đầu.` + (isNew ? " Kỷ lục mới!" : "");
    if (all) { G.confetti(); G.sound.play("win"); }
    G.mountNextLink($("#next-game"));
  }

  function setFeedback(html, type = "") {
    const f = $("#feedback");
    f.className = "feedback " + type;
    f.innerHTML = html;
  }

  const step = (d) => { if (S.done || !S.sc) return; S.k = Math.max(S.sc.min, Math.min(S.sc.max, S.k + d)); updateSlider(); };
  $("#slider").addEventListener("input", (e) => { if (S.done) { e.target.value = S.k; return; } S.k = Number(e.target.value); updateSlider(); });
  $("#btn-minus").addEventListener("click", () => step(-1));
  $("#btn-plus").addEventListener("click", () => step(1));
  document.addEventListener("keydown", (e) => {
    if ($("[data-screen=play]").hidden || !S.m) return;
    if (e.key === "Enter") { e.preventDefault(); if (S.done) { S.i++; showMission(); } else lock(); }
    if (S.m.kind === "slider" && e.target !== $("#slider")) {
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    }
  });
  $("#btn-lock").addEventListener("click", lock);
  $("#btn-next").addEventListener("click", () => { S.i++; showMission(); });
  $("#btn-again").addEventListener("click", () => startLevel(S.lv));
  $("#btn-menu").addEventListener("click", () => { G.renderLevels($("#levels"), LEVELS, startLevel); G.showScreen("start"); });

  G.renderLevels($("#levels"), LEVELS, startLevel);
})();
