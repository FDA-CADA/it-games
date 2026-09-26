/* Zoom War — ảnh raster vs vector: zoom, dung lượng, và khi nào dùng loại nào. Xem README.md. */
(function () {
  "use strict";
  const { $, el } = G;

  /* ---------- Các hình (hệ tọa độ 0..100) ---------- */
  const BG = '<rect width="100" height="100" fill="#ffffff"/>';
  const SHAPES = [
    { name: "ngôi sao", focus: [39, 38], body: `${BG}<polygon points="50,6 61,38 95,38 67,58 78,92 50,71 22,92 33,58 5,38 39,38" fill="#f59e0b" stroke="#b45309" stroke-width="2" stroke-linejoin="round"/>` },
    { name: "logo chữ", focus: [30, 50], body: `${BG}<circle cx="50" cy="50" r="44" fill="none" stroke="#4f46e5" stroke-width="3"/><text x="50" y="62" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" text-anchor="middle" fill="#4f46e5">NEU</text>` },
    { name: "biểu đồ", focus: [55, 35], body: `${BG}<line x1="8" y1="90" x2="95" y2="90" stroke="#334155" stroke-width="1.5"/><line x1="8" y1="90" x2="8" y2="8" stroke="#334155" stroke-width="1.5"/><polyline points="12,82 26,60 41,68 55,35 70,46 90,16" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linejoin="round"/><circle cx="55" cy="35" r="2.5" fill="#dc2626"/><circle cx="90" cy="16" r="2.5" fill="#dc2626"/>` },
    { name: "biểu tượng", focus: [45, 70], body: `${BG}<circle cx="50" cy="50" r="40" fill="#10b981"/><path d="M30 52 L45 67 L72 34" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>` },
  ];
  const svgOf = (s) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${s.body}</svg>`;
  const bytesOf = (str) => new TextEncoder().encode(str).length;
  const RES = [200, 400, 800, 1200, 2000];

  const QUIZ = () => {
    const svgLen = bytesOf(svgOf(SHAPES[0]));
    return [
      { q: "Ảnh raster 512 × 512 pixel, màu 24-bit, chưa nén, nặng bao nhiêu?", opts: ["768 KB", "256 KB", "6 MB", "96 KB"],
        why: "512 × 512 = 262 144 pixel × 3 byte (24 bit) = 786 432 byte = 768 KB. (256 KB là quên nhân 3 kênh màu, 6 MB là quên chia 8 khi đổi bit ra byte.)" },
      { q: "Muốn in ảnh raster đó to gấp 4 lần (cả rộng lẫn cao) mà vẫn nét như cũ, cần bao nhiêu pixel?", opts: ["Gấp 16 lần", "Gấp 4 lần", "Gấp 2 lần", "Không đổi"],
        why: "Rộng × 4 và cao × 4 nên số pixel tăng 4 × 4 = 16 lần: 2048 × 2048 ≈ 12 MB chưa nén." },
      { q: `File SVG ngôi sao ở level 1 dài ${svgLen} byte. Phóng to nó gấp 4 lần thì file…`, opts: ["Không đổi", "Gấp 16 lần", "Gấp 4 lần", "Gấp 2 lần"],
        why: "Vector chỉ lưu tọa độ và màu. Phóng to chỉ là nhân tọa độ khi vẽ, nên file giữ nguyên và hình vẫn nét ở mọi kích thước." },
      { q: "Vì sao ảnh chụp (phong cảnh, khuôn mặt) hầu như luôn lưu dạng raster?", opts: ["Mỗi điểm một màu khác nhau, không mô tả gọn bằng hình học được", "Raster luôn nhẹ hơn vector", "Máy ảnh không ghi được SVG", "Vector không có màu"],
        why: "Một bức ảnh có hàng triệu điểm màu thay đổi liên tục. Mô tả bằng hình học sẽ cần hàng triệu hình, nặng hơn nhiều so với lưới pixel (lại còn nén JPEG được)." },
      { q: "Ảnh MNIST 28 × 28 pixel xám 8-bit. Một ảnh bao nhiêu byte, cả 60 000 ảnh bao nhiêu?", opts: ["784 B · ≈ 45 MB", "784 B · ≈ 4.5 MB", "6 272 B · ≈ 359 MB", "28 B · ≈ 1.6 MB"],
        why: "28 × 28 × 1 byte = 784 B. 60 000 × 784 = 47 040 000 B ≈ 44.9 MB. Với mô hình AI, ảnh raster chính là một ma trận (tensor) số." },
    ];
  };
  const SCENARIOS = [
    { icon: "🤳", q: "Ảnh selfie chụp bằng điện thoại", right: 0, why: "Ảnh chụp là lưới điểm màu phức tạp nên dùng raster (JPEG/HEIC)." },
    { icon: "🏫", q: "Logo trường in lên băng rôn dài 5 mét", right: 1, why: "Vector phóng to bao nhiêu cũng nét, lại là một file duy nhất cho mọi kích thước in." },
    { icon: "📊", q: "Biểu đồ trong báo cáo, sẽ được phóng to khi thuyết trình", right: 1, why: "Xuất biểu đồ dạng SVG/PDF (vd <code>plt.savefig(\"fig.svg\")</code>) thì chữ và đường kẻ luôn sắc nét." },
    { icon: "🩻", q: "Ảnh X-quang đưa vào mô hình CNN", right: 0, why: "Ảnh y tế là dữ liệu đo từng điểm, và CNN làm việc trực tiếp trên ma trận pixel." },
    { icon: "📱", q: "Icon của app hiển thị trên nhiều loại màn hình", right: 1, why: "Một icon vector tự co giãn cho mọi độ phân giải màn hình." },
    { icon: "🔤", q: "Font chữ (như Be Vietnam Pro trên trang này)", right: 1, why: "Font lưu đường viền của từng chữ bằng đường cong, nên chữ nét ở mọi cỡ." },
    { icon: "🖥️", q: "Ảnh chụp màn hình để báo lỗi", right: 0, why: "Chụp màn hình là sao chép lưới pixel đang hiển thị, nên nó là raster (thường là PNG)." },
  ];

  const LEVELS = [
    { name: "Ai vỡ trước?", desc: "Zoom để tìm hình raster", kind: "zoom" },
    { name: "Dung lượng", desc: "Pixel, byte và phóng to", kind: "quiz" },
    { name: "Chọn định dạng", desc: "7 tình huống thực tế", kind: "choose" },
  ];

  const S = { lv: 0, level: null, i: 0, n: 0, score: 0, perfect: 0, tried: false, done: false, rasterSide: "a", shape: null, res: 0, off: null, zoom: 1, anim: 0, quiz: [] };

  function startLevel(i) {
    S.lv = i; S.level = LEVELS[i]; S.i = 0; S.score = 0; S.perfect = 0;
    S.quiz = QUIZ();
    S.n = S.level.kind === "zoom" ? RES.length : S.level.kind === "quiz" ? S.quiz.length : SCENARIOS.length;
    $("#hud-level").textContent = i + 1;
    $("#p-zoom").hidden = S.level.kind !== "zoom";
    $("#p-quiz").hidden = S.level.kind === "zoom";
    G.showScreen("play");
    next();
  }

  function next() {
    cancelAnimationFrame(S.anim);
    if (S.i >= S.n) return finish();
    S.tried = false; S.done = false;
    $("#hud-round").textContent = `${S.i + 1}/${S.n}`;
    $("#hud-score").textContent = S.score;
    $("#btn-next").hidden = true;
    if (S.level.kind === "zoom") roundZoom();
    else roundQuiz();
  }

  /* ================= Zoom ================= */
  async function roundZoom() {
    S.shape = SHAPES[S.i % SHAPES.length];
    S.res = RES[S.i];
    S.rasterSide = Math.random() < 0.5 ? "a" : "b";
    S.zoom = 1;
    $("#zoom").value = 0;
    $("#zoom-val").textContent = "1×";
    $("#mission").innerHTML = `Vòng ${S.i + 1}: hai hình "${S.shape.name}" trông giống hệt nhau. <b>Hình nào là raster?</b>`;
    ["a", "b"].forEach((s) => { $("#cap-" + s).textContent = ""; $("#panel-" + s).className = "panel"; });
    G.$$("#answers .btn").forEach((b) => { b.disabled = false; });
    setFeedback("Kéo thanh zoom hoặc bấm <b>▶ Zoom liên tục</b>, quan sát các cạnh.");
    const vec = $("#panel-" + (S.rasterSide === "a" ? "b" : "a")), ras = $("#panel-" + S.rasterSide);
    vec.innerHTML = svgOf(S.shape);
    ras.innerHTML = "";
    ras.append(el("canvas"));
    // Raster hóa chính hình vector đó ở độ phân giải S.res
    S.off = document.createElement("canvas");
    S.off.width = S.off.height = S.res;
    const img = new Image();
    await new Promise((ok) => { img.onload = ok; img.onerror = ok; img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgOf(S.shape)); });
    S.off.getContext("2d").drawImage(img, 0, 0, S.res, S.res);
    renderZoom();
  }

  function renderZoom() {
    const z = S.zoom, [fx, fy] = S.shape.focus;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    // Vector: chỉ cần đổi viewBox
    const w = 100 / z;
    const vx = clamp(fx - w / 2, 0, 100 - w), vy = clamp(fy - w / 2, 0, 100 - w);
    const svg = $(`#panel-${S.rasterSide === "a" ? "b" : "a"} svg`);
    if (svg) svg.setAttribute("viewBox", `${vx} ${vy} ${w} ${w}`);
    // Raster: phóng to lưới pixel (nearest neighbor)
    const cv = $(`#panel-${S.rasterSide} canvas`);
    if (!cv || !S.off) return;
    const dpr = window.devicePixelRatio || 1, W = Math.round(cv.clientWidth * dpr) || 300;
    if (cv.width !== W) { cv.width = W; cv.height = W; }
    const ctx = cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    const sw = S.res / z;
    ctx.clearRect(0, 0, W, W);
    ctx.drawImage(S.off, (vx / 100) * S.res, (vy / 100) * S.res, sw, sw, 0, 0, W, W);
  }

  function setZoom(v) {
    S.zoom = 2 ** v;
    $("#zoom").value = v;
    $("#zoom-val").textContent = (S.zoom < 10 ? S.zoom.toFixed(1) : Math.round(S.zoom)) + "×";
    renderZoom();
  }

  function autoZoom() {
    cancelAnimationFrame(S.anim);
    const v0 = Number($("#zoom").value), t0 = performance.now(), dur = 5000 * (1 - v0 / 5) + 500;
    const stepFn = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      setZoom(v0 + (5 - v0) * p);
      if (p < 1) S.anim = requestAnimationFrame(stepFn);
    };
    S.anim = requestAnimationFrame(stepFn);
  }

  function pick(side) {
    if (S.done) return;
    const right = side === S.rasterSide;
    if (!right && !S.tried) {
      S.tried = true;
      G.sound.play("bad");
      setFeedback("✗ Chưa đúng. Zoom sâu hơn nữa và nhìn kỹ các cạnh: cạnh bị răng cưa thành bậc thang là raster.", "bad");
      G.$$("#answers .btn").forEach((b) => { if (b.dataset.pick === side) b.disabled = true; });
      return;
    }
    S.done = true;
    cancelAnimationFrame(S.anim);
    if (!S.tried) { S.score += 10; S.perfect++; }
    $("#hud-score").textContent = S.score;
    G.sound.play("good");
    const vecSide = S.rasterSide === "a" ? "b" : "a";
    $("#panel-" + S.rasterSide).classList.add("is-raster");
    $("#panel-" + vecSide).classList.add("is-vector");
    const rasBytes = S.res * S.res * 3, svgBytes = bytesOf(svgOf(S.shape));
    $("#cap-" + S.rasterSide).textContent = `Raster ${S.res}×${S.res} px ≈ ${G.formatBytes(rasBytes)}`;
    $("#cap-" + vecSide).textContent = `Vector: ${svgBytes} byte SVG`;
    setFeedback(`✓ ${S.rasterSide.toUpperCase()} là raster! <span class="detail">Zoom tới ${Math.round(S.zoom)}× thì mỗi pixel phóng to thành một ô vuông. Lưới ${S.res}×${S.res} pixel, 24-bit màu, chưa nén ≈ ${G.formatBytes(rasBytes)}, trong khi file vector chỉ ${svgBytes} byte và nét ở mọi mức zoom.</span>`, "good");
    G.$$("#answers .btn").forEach((b) => { b.disabled = true; });
    $("#btn-next").hidden = false;
    $("#btn-next").focus();
  }

  /* ================= Trắc nghiệm & chọn định dạng ================= */
  function roundQuiz() {
    const box = $("#opts");
    box.innerHTML = "";
    let items;
    if (S.level.kind === "quiz") {
      const Q = S.quiz[S.i];
      $("#mission").innerHTML = `Câu ${S.i + 1}: ${Q.q}`;
      items = G.shuffle(Q.opts.map((t, k) => ({ t, ok: k === 0 })));
    } else {
      const sc = SCENARIOS[S.i];
      $("#mission").innerHTML = `<div class="scenario">${sc.icon}</div><div class="center">${sc.q}: nên lưu dạng nào?</div>`;
      items = [{ t: "🟥 Raster (JPG, PNG…)", ok: sc.right === 0 }, { t: "🟩 Vector (SVG, PDF…)", ok: sc.right === 1 }];
    }
    items.forEach((o) => box.append(el("button", { type: "button", class: "opt", html: o.t, onclick: (e) => answer(e.currentTarget, o.ok) })));
    setFeedback("Chọn một đáp án.");
  }

  function answer(btn, right) {
    if (S.done) return;
    const why = S.level.kind === "quiz" ? S.quiz[S.i].why : SCENARIOS[S.i].why;
    if (right) {
      S.done = true;
      btn.classList.add("right");
      if (!S.tried) { S.score += 10; S.perfect++; }
      $("#hud-score").textContent = S.score;
      G.sound.play("good");
      setFeedback(`✓ Đúng! <span class="detail">${why}</span>`, "good");
      $("#btn-next").hidden = false;
      $("#btn-next").focus();
    } else {
      S.tried = true;
      btn.classList.add("wrong");
      btn.disabled = true;
      G.sound.play("bad");
      setFeedback(S.level.kind === "choose" ? `✗ Chưa hợp lý. <span class="detail">${why}</span>` : "✗ Chưa đúng, thử lại.", "bad");
      if (S.level.kind === "choose") { S.done = true; $("#btn-next").hidden = false; }
    }
  }

  function finish() {
    const { isNew } = G.progress.record("zoom-war", S.lv, S.score, LEVELS.length);
    G.showScreen("end");
    $("#end-score").textContent = S.score;
    const all = S.perfect === S.n;
    $("#end-title").textContent = all ? "Mắt thần pixel! 🎉" : "Hoàn thành level!";
    $("#end-detail").textContent = `Đúng ngay lần đầu ${S.perfect}/${S.n}.` + (isNew ? " Kỷ lục mới!" : "");
    if (all) { G.confetti(); G.sound.play("win"); }
    G.mountNextLink($("#next-game"));
  }

  function setFeedback(html, type = "") {
    const f = $("#feedback");
    f.className = "feedback " + type;
    f.innerHTML = html;
  }

  $("#zoom").addEventListener("input", (e) => { cancelAnimationFrame(S.anim); setZoom(Number(e.target.value)); });
  $("#btn-auto").addEventListener("click", autoZoom);
  G.$$("#answers .btn").forEach((b) => b.addEventListener("click", () => pick(b.dataset.pick)));
  $("#btn-next").addEventListener("click", () => { S.i++; next(); });
  window.addEventListener("resize", () => { if (S.level && S.level.kind === "zoom") renderZoom(); });
  document.addEventListener("keydown", (e) => {
    if ($("[data-screen=play]").hidden || e.key !== "Enter" || !S.done) return;
    e.preventDefault();
    S.i++; next();
  });
  $("#btn-again").addEventListener("click", () => startLevel(S.lv));
  $("#btn-menu").addEventListener("click", () => { cancelAnimationFrame(S.anim); G.renderLevels($("#levels"), LEVELS, startLevel); G.showScreen("start"); });

  G.renderLevels($("#levels"), LEVELS, startLevel);
})();
