/* Number Wheel — unsigned, sign-and-magnitude, two's complement trên cùng 16 pattern 4-bit. Xem README.md. */
(function () {
  "use strict";
  const { $, el } = G;
  const MINUS = "−";

  const MODES = {
    u: {
      name: "Unsigned", rule: "<b>Unsigned:</b> 4 bit có trọng số 8 4 2 1, giá trị 0 … 15.",
      label: (v) => String(v),
      why: (p) => `${p} = ${terms(p, [8, 4, 2, 1])} = ${parseInt(p, 2)}`,
    },
    sm: {
      name: "Sign-and-magnitude", rule: "<b>Sign-and-magnitude:</b> bit đầu là <b>dấu</b> (0 = +, 1 = −), 3 bit sau là <b>độ lớn</b>.",
      label: (v) => (v & 8 ? MINUS : "+") + (v & 7),
      why: (p) => `Bit dấu ${p[0]} → "${p[0] === "1" ? MINUS : "+"}", độ lớn ${p.slice(1)} = ${parseInt(p.slice(1), 2)} → ${MODES.sm.label(parseInt(p, 2))}`,
    },
    tc: {
      name: "Two's complement", rule: "<b>Two's complement:</b> bit đầu có trọng số <b>−8</b>, ba bit sau là 4 2 1. Ví dụ 1101 = −8 + 4 + 1 = −3.",
      label: (v) => (v < 8 ? String(v) : MINUS + (16 - v)),
      why: (p) => `${p} = ${terms(p, [-8, 4, 2, 1])} = ${MODES.tc.label(parseInt(p, 2))}`,
    },
  };
  function terms(p, w) {
    const t = [...p].map((b, i) => (b === "1" ? w[i] : null)).filter((x) => x !== null);
    return t.length ? t.join(" + ").replace(/\+ -/g, "− ").replace(/^-/, MINUS) : "0";
  }

  const LEVELS = [
    { name: "Khởi động: Unsigned", desc: "0 … 15, làm quen với vòng", mode: "u" },
    { name: "Sign-and-magnitude", desc: "Bit dấu + 3 bit độ lớn", mode: "sm" },
    { name: "Two's complement", desc: "Bit đầu có trọng số −8", mode: "tc" },
    { name: "So sánh hai vòng", desc: "6 câu hỏi: −0, dải lệch, chỗ tràn", mode: "compare" },
  ];

  const S = { lv: 0, level: null, mode: null, score: 0, miss: 0, placed: 0, firstTry: {}, selected: null, q: 0, qTried: false, qRight: 0 };

  const pat = (v) => G.bits(v, 4);
  const angleOf = (i) => -90 + i * 22.5;

  function startLevel(i) {
    S.lv = i; S.level = LEVELS[i]; S.score = 0; S.miss = 0; S.placed = 0; S.firstTry = {}; S.selected = null;
    $("#hud-level").textContent = i + 1;
    $("#hud-score").textContent = 0;
    $("#hud-miss").textContent = 0;
    G.showScreen("play");
    const cmp = S.level.mode === "compare";
    $("#build-panel").hidden = cmp;
    $("#compare-panel").hidden = !cmp;
    $("#hud-placed").parentElement.hidden = cmp;
    $("#hud-miss").parentElement.hidden = cmp;
    if (cmp) return startCompare();
    S.mode = MODES[S.level.mode];
    $("#rule").innerHTML = S.mode.rule;
    $("#hub").innerHTML = `<span><span class="big">${S.mode.name}</span><br>0/16</span>`;
    buildWheel($("#wheel"), false);
    buildTray();
    $("#btn-finish").hidden = true;
    setFeedback("Bắt đầu với các pattern dễ trước, ví dụ 0000 và 0001.");
    updateHud();
  }

  /* ---------- Vòng tròn ---------- */
  function buildWheel(wheel, filledWith) {
    G.$$(".slot, .boundary", wheel).forEach((s) => s.remove());
    for (let v = 0; v < 16; v++) {
      const a = (angleOf(v) * Math.PI) / 180, r = 40;
      const p = pat(v);
      const slot = el("div", {
        class: "slot", "data-v": v, style: `left:${50 + r * Math.cos(a)}%; top:${50 + r * Math.sin(a)}%`,
        role: filledWith ? null : "button", "aria-label": `Ô ${p}`,
      }, [
        el("span", { class: "pat", html: `<b>${p[0]}</b>${p.slice(1)}` }),
        el("span", { class: "val" }),
      ]);
      if (filledWith) fillSlot(slot, filledWith.label(v));
      else {
        slot.addEventListener("click", () => S.selected && tryPlace(slot, S.selected));
        slot.addEventListener("dragover", (e) => { if (!slot.classList.contains("filled")) { e.preventDefault(); slot.classList.add("over"); } });
        slot.addEventListener("dragleave", () => slot.classList.remove("over"));
        slot.addEventListener("drop", (e) => {
          e.preventDefault(); slot.classList.remove("over");
          const chip = G.$$(".chip", $("#tray")).find((c) => c.dataset.label === e.dataTransfer.getData("text/plain"));
          if (chip) tryPlace(slot, chip);
        });
      }
      wheel.append(slot);
    }
  }

  function fillSlot(slot, label) {
    slot.classList.add("filled");
    slot.classList.toggle("neg", label.startsWith(MINUS));
    $(".val", slot).textContent = label;
  }

  function addBoundary(wheel, i) {
    const theta = angleOf(i + 0.5);
    wheel.append(el("div", { class: "boundary", style: `transform: rotate(${theta - 90}deg)` }));
  }

  function buildTray() {
    const tray = $("#tray");
    tray.innerHTML = "";
    const labels = G.shuffle([...Array(16).keys()].map((v) => S.mode.label(v)));
    labels.forEach((lab) => {
      const chip = el("button", { type: "button", class: "chip" + (lab.startsWith(MINUS) ? " neg" : ""), draggable: "true", "data-label": lab, text: lab });
      chip.addEventListener("click", () => {
        G.$$(".chip").forEach((c) => c.classList.remove("sel"));
        if (S.selected === chip) { S.selected = null; return; }
        chip.classList.add("sel"); S.selected = chip;
      });
      chip.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/plain", lab); });
      tray.append(chip);
    });
  }

  function tryPlace(slot, chip) {
    if (slot.classList.contains("filled")) return;
    const v = Number(slot.dataset.v), p = pat(v), want = S.mode.label(v), lab = chip.dataset.label;
    if (lab === want) {
      const first = !S.firstTry[lab];
      S.score += first ? 6 : 2;
      S.placed++;
      fillSlot(slot, lab);
      slot.classList.add("pop");
      chip.remove();
      S.selected = null;
      G.sound.play("pop");
      setFeedback(`✓ ${S.mode.why(p)}`, "good");
      $("#hub").innerHTML = `<span><span class="big">${S.mode.name}</span><br>${S.placed}/16</span>`;
      if (S.placed === 16) complete();
    } else {
      S.firstTry[lab] = true;
      S.miss++;
      G.shake(slot);
      G.sound.play("bad");
      let extra = "";
      if (S.level.mode === "tc" && MODES.sm.label(v) === lab) extra = " Bạn đang đọc theo sign-and-magnitude. Trong two's complement, bit đầu mang trọng số −8.";
      if (S.level.mode === "sm" && MODES.tc.label(v) === lab) extra = " Đó là cách đọc two's complement. Ở đây bit đầu chỉ là dấu.";
      setFeedback(`✗ Nhãn <b class="mono">${lab}</b> không thuộc ô <b class="mono">${p}</b>.${extra}`, "bad");
    }
    updateHud();
  }

  function updateHud() {
    $("#hud-placed").textContent = `${S.placed}/16`;
    $("#hud-score").textContent = S.score;
    $("#hud-miss").textContent = S.miss;
  }

  function complete() {
    G.sound.play("win");
    const wheel = $("#wheel");
    let note;
    if (S.level.mode === "u") {
      addBoundary(wheel, 15);
      note = "Đi theo chiều kim đồng hồ, mỗi bước là +1. Vạch đỏ giữa 1111 và 0000 là chỗ <b>tràn</b>: 15 + 1 quay về 0, như game Odometer.";
    } else if (S.level.mode === "sm") {
      [0, 8].forEach((v) => $(`.slot[data-v="${v}"]`, wheel).classList.add("star"));
      note = "Hai ô được đánh dấu là <b>+0 (0000) và −0 (1000)</b>: phí mất một pattern cho số 0 thứ hai, nên dải chỉ là −7 … +7. Để ý nửa âm còn chạy <b>ngược chiều</b>: từ 1000 đến 1111 là −0, −1, … −7.";
    } else {
      addBoundary(wheel, 7);
      note = "Chỉ có <b>một số 0</b>. Pattern thừa ra được dùng cho <b>−8 (1000)</b>, nên dải lệch: −8 … +7. Đi theo chiều kim đồng hồ luôn là +1, kể cả từ −1 (1111) sang 0 (0000). Chỗ tràn là vạch đỏ giữa +7 và −8.";
    }
    setFeedback(`🎉 Hoàn thành vòng ${S.mode.name}! <span class="detail">${note}</span>`, "good");
    $("#btn-finish").hidden = false;
    $("#btn-finish").focus();
  }

  /* ---------- Level so sánh ---------- */
  const QUESTIONS = [
    { q: "Chế độ nào có <b>hai</b> pattern cùng biểu diễn số 0?", opts: ["Sign-and-magnitude", "Two's complement", "Cả hai", "Không chế độ nào"], a: 0, star: { sm: [0, 8] },
      why: "0000 = +0 và 1000 = −0 trong sign-and-magnitude. Two's complement chỉ có 0000 là 0." },
    { q: "Pattern <code>1000</code> trong two's complement là số mấy?", opts: ["−8", "−0", "+8", "−7"], a: 0, star: { tc: [8] },
      why: "1000 = −8 + 0 + 0 + 0 = −8. Đây chính là pattern mà sign-and-magnitude dùng cho −0." },
    { q: "Dải giá trị của two's complement 4-bit là?", opts: ["−8 … +7", "−7 … +7", "−8 … +8", "0 … 15"], a: 0,
      why: "16 pattern: 1 cho số 0, 7 cho số dương, 8 cho số âm. Tổng quát với n bit: −2ⁿ⁻¹ … 2ⁿ⁻¹ − 1." },
    { q: "Đi theo chiều kim đồng hồ từ <code>0111</code> sang <code>1000</code>, giá trị two's complement nhảy từ … sang …?", opts: ["+7 → −8", "+7 → +8", "+7 → −0", "+7 → −7"], a: 0, star: { tc: [7, 8] },
      why: "Đây là chỗ tràn của số có dấu: cộng 1 vào số dương lớn nhất lại ra số âm nhỏ nhất." },
    { q: "Pattern <code>1111</code> ở hai chế độ lần lượt là?", opts: ["S&M: −7, TC: −1", "S&M: −1, TC: −7", "Cả hai đều là −7", "Cả hai đều là −15"], a: 0, star: { sm: [15], tc: [15] },
      why: "S&M: dấu −, độ lớn 111 = 7 → −7. TC: −8 + 4 + 2 + 1 = −1." },
    { q: "Vì sao máy tính ngày nay dùng two's complement?", opts: ["Cộng/trừ dùng chung một mạch cộng, chỉ có một số 0", "Vì dễ đọc bằng mắt hơn", "Vì biểu diễn được nhiều số dương hơn", "Vì không bao giờ bị tràn"], a: 0,
      why: "Trên vòng TC, mỗi bước theo chiều kim đồng hồ luôn là +1, nên phép cộng nhị phân thông thường cho kết quả đúng cho cả số âm. S&M thì nửa âm chạy ngược chiều, cần mạch riêng để xử lý dấu." },
  ];

  function startCompare() {
    buildWheel($("#wheel-sm"), MODES.sm);
    buildWheel($("#wheel-tc"), MODES.tc);
    S.q = 0; S.qRight = 0;
    showQuestion();
  }

  function showQuestion() {
    if (S.q >= QUESTIONS.length) return finish();
    const Q = QUESTIONS[S.q];
    S.qTried = false;
    G.$$("#compare-panel .slot").forEach((s) => s.classList.remove("star"));
    $("#q-text").innerHTML = `Câu ${S.q + 1}/${QUESTIONS.length}: ${Q.q}`;
    const box = $("#q-opts");
    box.innerHTML = "";
    G.shuffle(Q.opts.map((t, i) => ({ t, i }))).forEach((o) => box.append(el("button", {
      type: "button", class: "q-opt", html: o.t, onclick: (e) => answerQ(e.currentTarget, o.i === Q.a),
    })));
    $("#btn-q-next").hidden = true;
    setFeedback("Nhìn hai vòng bên trên để trả lời.", "", "#q-feedback");
  }

  function answerQ(btn, right) {
    if (!$("#btn-q-next").hidden) return;
    const Q = QUESTIONS[S.q];
    if (right) {
      btn.classList.add("right");
      if (!S.qTried) { S.score += 10; S.qRight++; }
      $("#hud-score").textContent = S.score;
      G.sound.play("good");
      for (const [w, vs] of Object.entries(Q.star || {})) vs.forEach((v) => $(`#wheel-${w} .slot[data-v="${v}"]`).classList.add("star"));
      setFeedback(`✓ ${Q.why}`, "good", "#q-feedback");
      $("#btn-q-next").hidden = false;
      $("#btn-q-next").focus();
    } else {
      S.qTried = true;
      btn.classList.add("wrong");
      btn.disabled = true;
      G.sound.play("bad");
      setFeedback("✗ Chưa đúng, thử lại. Gợi ý: tìm các pattern liên quan trên hai vòng.", "bad", "#q-feedback");
    }
  }

  function finish() {
    const { isNew } = G.progress.record("number-wheel", S.lv, S.score, LEVELS.length);
    G.showScreen("end");
    $("#end-score").textContent = S.score;
    const cmp = S.level.mode === "compare";
    const perfect = cmp ? S.qRight === QUESTIONS.length : S.miss === 0;
    $("#end-title").textContent = perfect ? "Bậc thầy vòng số! 🎉" : "Hoàn thành level!";
    $("#end-detail").textContent = (cmp ? `Đúng ngay lần đầu ${S.qRight}/${QUESTIONS.length} câu.` : `Xếp đủ 16 ô với ${S.miss} lần đặt nhầm.`) + (isNew ? " Kỷ lục mới!" : "");
    if (perfect) G.confetti();
    G.mountNextLink($("#next-game"));
  }

  function setFeedback(html, type = "", sel = "#feedback") {
    const f = $(sel);
    f.className = "feedback " + type;
    f.innerHTML = html;
  }

  $("#btn-finish").addEventListener("click", finish);
  $("#btn-q-next").addEventListener("click", () => { S.q++; showQuestion(); });
  $("#btn-again").addEventListener("click", () => startLevel(S.lv));
  $("#btn-menu").addEventListener("click", () => { G.renderLevels($("#levels"), LEVELS, startLevel); G.showScreen("start"); });

  G.renderLevels($("#levels"), LEVELS, startLevel);
})();
