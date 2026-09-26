/* Zoom War — ảnh raster vs vector: zoom, dung lượng, và khi nào dùng loại nào. Xem README.md. */
(function () {
  "use strict";
  const { $, el, L } = G;

  /* ---------- Các hình (hệ tọa độ 0..100) ---------- */
  const BG = '<rect width="100" height="100" fill="#ffffff"/>';
  const SHAPES = [
    { name: L("ngôi sao", "star"), focus: [39, 38], body: `${BG}<polygon points="50,6 61,38 95,38 67,58 78,92 50,71 22,92 33,58 5,38 39,38" fill="#f59e0b" stroke="#b45309" stroke-width="2" stroke-linejoin="round"/>` },
    { name: L("logo chữ", "text logo"), focus: [30, 50], body: `${BG}<circle cx="50" cy="50" r="44" fill="none" stroke="#4f46e5" stroke-width="3"/><text x="50" y="62" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" text-anchor="middle" fill="#4f46e5">NEU</text>` },
    { name: L("biểu đồ", "chart"), focus: [55, 35], body: `${BG}<line x1="8" y1="90" x2="95" y2="90" stroke="#334155" stroke-width="1.5"/><line x1="8" y1="90" x2="8" y2="8" stroke="#334155" stroke-width="1.5"/><polyline points="12,82 26,60 41,68 55,35 70,46 90,16" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linejoin="round"/><circle cx="55" cy="35" r="2.5" fill="#dc2626"/><circle cx="90" cy="16" r="2.5" fill="#dc2626"/>` },
    { name: L("biểu tượng", "icon"), focus: [45, 70], body: `${BG}<circle cx="50" cy="50" r="40" fill="#10b981"/><path d="M30 52 L45 67 L72 34" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>` },
  ];
  const svgOf = (s) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${s.body}</svg>`;
  const bytesOf = (str) => new TextEncoder().encode(str).length;
  const RES = [200, 400, 800, 1200, 2000];

  const QUIZ = () => {
    const svgLen = bytesOf(svgOf(SHAPES[0]));
    return [
      { q: L("Ảnh raster 512 × 512 pixel, màu 24-bit, chưa nén, nặng bao nhiêu?", "How big is an uncompressed 512 × 512 pixel raster image in 24-bit colour?"), opts: ["768 KB", "256 KB", "6 MB", "96 KB"],
        why: L("512 × 512 = 262 144 pixel × 3 byte (24 bit) = 786 432 byte = 768 KB. (256 KB là quên nhân 3 kênh màu, 6 MB là quên chia 8 khi đổi bit ra byte.)", "512 × 512 = 262 144 pixels × 3 bytes (24 bits) = 786 432 bytes = 768 KB. (256 KB forgets the 3 colour channels, 6 MB forgets to divide by 8 when going from bits to bytes.)") },
      { q: L("Muốn in ảnh raster đó to gấp 4 lần (cả rộng lẫn cao) mà vẫn nét như cũ, cần bao nhiêu pixel?", "To print that raster image 4 times larger (both width and height) just as sharply, how many pixels do you need?"), opts: [L("Gấp 16 lần", "16 times as many"), L("Gấp 4 lần", "4 times as many"), L("Gấp 2 lần", "Twice as many"), L("Không đổi", "The same")],
        why: L("Rộng × 4 và cao × 4 nên số pixel tăng 4 × 4 = 16 lần: 2048 × 2048 ≈ 12 MB chưa nén.", "Width × 4 and height × 4, so the pixel count grows 4 × 4 = 16 times: 2048 × 2048 ≈ 12 MB uncompressed.") },
      { q: L(`File SVG ngôi sao ở level 1 dài ${svgLen} byte. Phóng to nó gấp 4 lần thì file…`, `The star SVG from level 1 is ${svgLen} bytes. Scale it up 4 times and the file…`), opts: [L("Không đổi", "Stays the same"), L("Gấp 16 lần", "Grows 16 times"), L("Gấp 4 lần", "Grows 4 times"), L("Gấp 2 lần", "Doubles")],
        why: L("Vector chỉ lưu tọa độ và màu. Phóng to chỉ là nhân tọa độ khi vẽ, nên file giữ nguyên và hình vẫn nét ở mọi kích thước.", "Vectors only store coordinates and colours. Scaling just multiplies coordinates when drawing, so the file stays the same and the picture is sharp at every size.") },
      { q: L("Vì sao ảnh chụp (phong cảnh, khuôn mặt) hầu như luôn lưu dạng raster?", "Why are photos (landscapes, faces) almost always stored as raster?"), opts: [L("Mỗi điểm một màu khác nhau, không mô tả gọn bằng hình học được", "Every point has a different colour and cannot be described compactly with geometry"), L("Raster luôn nhẹ hơn vector", "Raster is always smaller than vector"), L("Máy ảnh không ghi được SVG", "Cameras cannot write SVG"), L("Vector không có màu", "Vectors have no colour")],
        why: L("Một bức ảnh có hàng triệu điểm màu thay đổi liên tục. Mô tả bằng hình học sẽ cần hàng triệu hình, nặng hơn nhiều so với lưới pixel (lại còn nén JPEG được).", "A photo has millions of constantly changing colour points. Describing it with geometry would take millions of shapes, far heavier than a pixel grid (which can also be JPEG-compressed).") },
      { q: L("Ảnh MNIST 28 × 28 pixel xám 8-bit. Một ảnh bao nhiêu byte, cả 60 000 ảnh bao nhiêu?", "MNIST images are 28 × 28 pixels, 8-bit gray. How many bytes is one image, and all 60 000?"), opts: ["784 B · ≈ 45 MB", "784 B · ≈ 4.5 MB", "6 272 B · ≈ 359 MB", "28 B · ≈ 1.6 MB"],
        why: L("28 × 28 × 1 byte = 784 B. 60 000 × 784 = 47 040 000 B ≈ 44.9 MB. Với mô hình AI, ảnh raster chính là một ma trận (tensor) số.", "28 × 28 × 1 byte = 784 B. 60 000 × 784 = 47 040 000 B ≈ 44.9 MB. To an AI model, a raster image is simply a matrix (tensor) of numbers.") },
    ];
  };
  const SCENARIOS = [
    { icon: "🤳", q: L("Ảnh selfie chụp bằng điện thoại", "A selfie taken with a phone"), right: 0, why: L("Ảnh chụp là lưới điểm màu phức tạp nên dùng raster (JPEG/HEIC).", "A photo is a complex grid of colour points, so raster (JPEG/HEIC).") },
    { icon: "🏫", q: L("Logo trường in lên băng rôn dài 5 mét", "The university logo printed on a 5-metre banner"), right: 1, why: L("Vector phóng to bao nhiêu cũng nét, lại là một file duy nhất cho mọi kích thước in.", "A vector stays sharp at any size, and one file serves every print size.") },
    { icon: "📊", q: L("Biểu đồ trong báo cáo, sẽ được phóng to khi thuyết trình", "A chart in a report that will be enlarged during a presentation"), right: 1, why: L("Xuất biểu đồ dạng SVG/PDF (vd <code>plt.savefig(\"fig.svg\")</code>) thì chữ và đường kẻ luôn sắc nét.", "Export the chart as SVG/PDF (e.g. <code>plt.savefig(\"fig.svg\")</code>) and text and lines always stay sharp.") },
    { icon: "🩻", q: L("Ảnh X-quang đưa vào mô hình CNN", "An X-ray image fed to a CNN model"), right: 0, why: L("Ảnh y tế là dữ liệu đo từng điểm, và CNN làm việc trực tiếp trên ma trận pixel.", "Medical images are measurements at every point, and CNNs work directly on pixel matrices.") },
    { icon: "📱", q: L("Icon của app hiển thị trên nhiều loại màn hình", "An app icon shown on many kinds of screens"), right: 1, why: L("Một icon vector tự co giãn cho mọi độ phân giải màn hình.", "A vector icon scales to every screen resolution.") },
    { icon: "🔤", q: L("Font chữ (như Be Vietnam Pro trên trang này)", "A font (like Be Vietnam Pro on this page)"), right: 1, why: L("Font lưu đường viền của từng chữ bằng đường cong, nên chữ nét ở mọi cỡ.", "Fonts store each letter outline as curves, so text is sharp at every size.") },
    { icon: "🖥️", q: L("Ảnh chụp màn hình để báo lỗi", "A screenshot for a bug report"), right: 0, why: L("Chụp màn hình là sao chép lưới pixel đang hiển thị, nên nó là raster (thường là PNG).", "A screenshot copies the pixel grid on screen, so it is raster (usually PNG).") },
  ];

  const LEVELS = [
    { name: L("Ai vỡ trước?", "Who breaks first?"), desc: L("Zoom để tìm hình raster", "Zoom in to find the raster"), kind: "zoom" },
    { name: L("Dung lượng", "File size"), desc: L("Pixel, byte và phóng to", "Pixels, bytes and scaling"), kind: "quiz" },
    { name: L("Chọn định dạng", "Pick the format"), desc: L("7 tình huống thực tế", "7 real-world situations"), kind: "choose" },
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
    $("#mission").innerHTML = L(`Vòng ${S.i + 1}: hai hình "${S.shape.name}" trông giống hệt nhau. <b>Hình nào là raster?</b>`, `Round ${S.i + 1}: the two "${S.shape.name}" pictures look identical. <b>Which one is raster?</b>`);
    ["a", "b"].forEach((s) => { $("#cap-" + s).textContent = ""; $("#panel-" + s).className = "panel"; });
    G.$$("#answers .btn").forEach((b) => { b.disabled = false; });
    setFeedback(L("Kéo thanh zoom hoặc bấm <b>▶ Zoom liên tục</b>, quan sát các cạnh.", "Drag the zoom slider or press <b>▶ Keep zooming</b>, and watch the edges."));
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
      setFeedback(L("✗ Chưa đúng. Zoom sâu hơn nữa và nhìn kỹ các cạnh: cạnh bị răng cưa thành bậc thang là raster.", "✗ Not quite. Zoom in further and look closely at the edges: jagged, staircase edges mean raster."), "bad");
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
    $("#cap-" + vecSide).textContent = `Vector: ${svgBytes} ${L("byte", "bytes of")} SVG`;
    setFeedback(L(`✓ ${S.rasterSide.toUpperCase()} là raster! <span class="detail">Zoom tới ${Math.round(S.zoom)}× thì mỗi pixel phóng to thành một ô vuông. Lưới ${S.res}×${S.res} pixel, 24-bit màu, chưa nén ≈ ${G.formatBytes(rasBytes)}, trong khi file vector chỉ ${svgBytes} byte và nét ở mọi mức zoom.</span>`,
      `✓ ${S.rasterSide.toUpperCase()} is raster! <span class="detail">At ${Math.round(S.zoom)}× every pixel is blown up into a square. A ${S.res}×${S.res} pixel grid in 24-bit colour is ≈ ${G.formatBytes(rasBytes)} uncompressed, while the vector file is just ${svgBytes} bytes and sharp at every zoom level.</span>`), "good");
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
      $("#mission").innerHTML = `${L("Câu", "Question")} ${S.i + 1}: ${Q.q}`;
      items = G.shuffle(Q.opts.map((t, k) => ({ t, ok: k === 0 })));
    } else {
      const sc = SCENARIOS[S.i];
      $("#mission").innerHTML = `<div class="scenario">${sc.icon}</div><div class="center">${sc.q}: ${L("nên lưu dạng nào?", "which format?")}</div>`;
      items = [{ t: "🟥 Raster (JPG, PNG…)", ok: sc.right === 0 }, { t: "🟩 Vector (SVG, PDF…)", ok: sc.right === 1 }];
    }
    items.forEach((o) => box.append(el("button", { type: "button", class: "opt", html: o.t, onclick: (e) => answer(e.currentTarget, o.ok) })));
    setFeedback(L("Chọn một đáp án.", "Pick an answer."));
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
      setFeedback(`✓ ${L("Đúng!", "Correct!")} <span class="detail">${why}</span>`, "good");
      $("#btn-next").hidden = false;
      $("#btn-next").focus();
    } else {
      S.tried = true;
      btn.classList.add("wrong");
      btn.disabled = true;
      G.sound.play("bad");
      setFeedback(S.level.kind === "choose" ? `✗ ${L("Chưa hợp lý.", "Not the best choice.")} <span class="detail">${why}</span>` : L("✗ Chưa đúng, thử lại.", "✗ Not quite, try again."), "bad");
      if (S.level.kind === "choose") { S.done = true; $("#btn-next").hidden = false; }
    }
  }

  function finish() {
    const { isNew } = G.progress.record("zoom-war", S.lv, S.score, LEVELS.length);
    G.showScreen("end");
    $("#end-score").textContent = S.score;
    const all = S.perfect === S.n;
    $("#end-title").textContent = all ? L("Mắt thần pixel! 🎉", "Pixel eagle eye! 🎉") : L("Hoàn thành level!", "Level complete!");
    $("#end-detail").textContent = L(`Đúng ngay lần đầu ${S.perfect}/${S.n}.`, `${S.perfect}/${S.n} right on the first try.`) + (isNew ? L(" Kỷ lục mới!", " New best!") : "");
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
