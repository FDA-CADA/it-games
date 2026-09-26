/* Number Wheel — unsigned, sign-and-magnitude, two's complement trên cùng 16 pattern 4-bit. Xem README.md. */
(function () {
  "use strict";
  const { $, el, L } = G;
  const MINUS = "−";

  const MODES = {
    u: {
      name: "Unsigned", rule: L("<b>Unsigned:</b> 4 bit có trọng số 8 4 2 1, giá trị 0 … 15.", "<b>Unsigned:</b> 4 bits with weights 8 4 2 1, values 0 … 15."),
      label: (v) => String(v),
      why: (p) => `${p} = ${terms(p, [8, 4, 2, 1])} = ${parseInt(p, 2)}`,
    },
    sm: {
      name: "Sign-and-magnitude", rule: L("<b>Sign-and-magnitude:</b> bit đầu là <b>dấu</b> (0 = +, 1 = −), 3 bit sau là <b>độ lớn</b>.", "<b>Sign-and-magnitude:</b> the first bit is the <b>sign</b> (0 = +, 1 = −), the other 3 bits are the <b>magnitude</b>."),
      label: (v) => (v & 8 ? MINUS : "+") + (v & 7),
      why: (p) => L(`Bit dấu ${p[0]} → "${p[0] === "1" ? MINUS : "+"}", độ lớn ${p.slice(1)} = ${parseInt(p.slice(1), 2)} → ${MODES.sm.label(parseInt(p, 2))}`, `Sign bit ${p[0]} → "${p[0] === "1" ? MINUS : "+"}", magnitude ${p.slice(1)} = ${parseInt(p.slice(1), 2)} → ${MODES.sm.label(parseInt(p, 2))}`),
    },
    tc: {
      name: "Two's complement", rule: L("<b>Two's complement:</b> bit đầu có trọng số <b>−8</b>, ba bit sau là 4 2 1. Ví dụ 1101 = −8 + 4 + 1 = −3.", "<b>Two's complement:</b> the first bit weighs <b>−8</b>, the other three are 4 2 1. Example: 1101 = −8 + 4 + 1 = −3."),
      label: (v) => (v < 8 ? String(v) : MINUS + (16 - v)),
      why: (p) => `${p} = ${terms(p, [-8, 4, 2, 1])} = ${MODES.tc.label(parseInt(p, 2))}`,
    },
  };
  function terms(p, w) {
    const t = [...p].map((b, i) => (b === "1" ? w[i] : null)).filter((x) => x !== null);
    return t.length ? t.join(" + ").replace(/\+ -/g, "− ").replace(/^-/, MINUS) : "0";
  }

  const LEVELS = [
    { name: L("Khởi động: Unsigned", "Warm-up: Unsigned"), desc: L("0 … 15, làm quen với vòng", "0 … 15, get to know the wheel"), mode: "u" },
    { name: "Sign-and-magnitude", desc: L("Bit dấu + 3 bit độ lớn", "Sign bit + 3 magnitude bits"), mode: "sm" },
    { name: "Two's complement", desc: L("Bit đầu có trọng số −8", "The first bit weighs −8"), mode: "tc" },
    { name: L("So sánh hai vòng", "Compare the wheels"), desc: L("6 câu hỏi: −0, dải lệch, chỗ tràn", "6 questions: −0, lopsided range, overflow"), mode: "compare" },
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
    setFeedback(L("Bắt đầu với các pattern dễ trước, ví dụ 0000 và 0001.", "Start with the easy patterns, e.g. 0000 and 0001."));
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
        role: filledWith ? null : "button", "aria-label": L(`Ô ${p}`, `Slot ${p}`),
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
      if (S.level.mode === "tc" && MODES.sm.label(v) === lab) extra = L(" Bạn đang đọc theo sign-and-magnitude. Trong two's complement, bit đầu mang trọng số −8.", " You are reading it as sign-and-magnitude. In two's complement the first bit weighs −8.");
      if (S.level.mode === "sm" && MODES.tc.label(v) === lab) extra = L(" Đó là cách đọc two's complement. Ở đây bit đầu chỉ là dấu.", " That is the two's complement reading. Here the first bit is only a sign.");
      setFeedback(L(`✗ Nhãn <b class="mono">${lab}</b> không thuộc ô <b class="mono">${p}</b>.${extra}`, `✗ Label <b class="mono">${lab}</b> does not belong to slot <b class="mono">${p}</b>.${extra}`), "bad");
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
      note = L("Đi theo chiều kim đồng hồ, mỗi bước là +1. Vạch đỏ giữa 1111 và 0000 là chỗ <b>tràn</b>: 15 + 1 quay về 0, như game Odometer.", "Going clockwise, each step is +1. The red line between 1111 and 0000 is the <b>overflow</b> point: 15 + 1 wraps to 0, just like in Odometer.");
    } else if (S.level.mode === "sm") {
      [0, 8].forEach((v) => $(`.slot[data-v="${v}"]`, wheel).classList.add("star"));
      note = L("Hai ô được đánh dấu là <b>+0 (0000) và −0 (1000)</b>: phí mất một pattern cho số 0 thứ hai, nên dải chỉ là −7 … +7. Để ý nửa âm còn chạy <b>ngược chiều</b>: từ 1000 đến 1111 là −0, −1, … −7.", "The two marked slots are <b>+0 (0000) and −0 (1000)</b>: one pattern is wasted on a second zero, so the range is only −7 … +7. Notice the negative half also runs <b>backwards</b>: 1000 to 1111 is −0, −1, … −7.");
    } else {
      addBoundary(wheel, 7);
      note = L("Chỉ có <b>một số 0</b>. Pattern thừa ra được dùng cho <b>−8 (1000)</b>, nên dải lệch: −8 … +7. Đi theo chiều kim đồng hồ luôn là +1, kể cả từ −1 (1111) sang 0 (0000). Chỗ tràn là vạch đỏ giữa +7 và −8.", "There is <b>only one zero</b>. The spare pattern is used for <b>−8 (1000)</b>, so the range is lopsided: −8 … +7. Clockwise is always +1, even from −1 (1111) to 0 (0000). The overflow point is the red line between +7 and −8.");
    }
    setFeedback(`🎉 ${L(`Hoàn thành vòng ${S.mode.name}!`, `${S.mode.name} wheel complete!`)} <span class="detail">${note}</span>`, "good");
    $("#btn-finish").hidden = false;
    $("#btn-finish").focus();
  }

  /* ---------- Level so sánh ---------- */
  const QUESTIONS = [
    { q: L("Chế độ nào có <b>hai</b> pattern cùng biểu diễn số 0?", "Which scheme has <b>two</b> patterns for zero?"), opts: ["Sign-and-magnitude", "Two's complement", L("Cả hai", "Both"), L("Không chế độ nào", "Neither")], a: 0, star: { sm: [0, 8] },
      why: L("0000 = +0 và 1000 = −0 trong sign-and-magnitude. Two's complement chỉ có 0000 là 0.", "0000 = +0 and 1000 = −0 in sign-and-magnitude. In two's complement only 0000 is zero.") },
    { q: L("Pattern <code>1000</code> trong two's complement là số mấy?", "What is the pattern <code>1000</code> in two's complement?"), opts: ["−8", "−0", "+8", "−7"], a: 0, star: { tc: [8] },
      why: L("1000 = −8 + 0 + 0 + 0 = −8. Đây chính là pattern mà sign-and-magnitude dùng cho −0.", "1000 = −8 + 0 + 0 + 0 = −8. It is exactly the pattern sign-and-magnitude uses for −0.") },
    { q: L("Dải giá trị của two's complement 4-bit là?", "What is the range of 4-bit two's complement?"), opts: ["−8 … +7", "−7 … +7", "−8 … +8", "0 … 15"], a: 0,
      why: L("16 pattern: 1 cho số 0, 7 cho số dương, 8 cho số âm. Tổng quát với n bit: −2ⁿ⁻¹ … 2ⁿ⁻¹ − 1.", "16 patterns: 1 for zero, 7 for positives, 8 for negatives. In general with n bits: −2ⁿ⁻¹ … 2ⁿ⁻¹ − 1.") },
    { q: L("Đi theo chiều kim đồng hồ từ <code>0111</code> sang <code>1000</code>, giá trị two's complement nhảy từ … sang …?", "Going clockwise from <code>0111</code> to <code>1000</code>, the two's complement value jumps from … to …?"), opts: ["+7 → −8", "+7 → +8", "+7 → −0", "+7 → −7"], a: 0, star: { tc: [7, 8] },
      why: L("Đây là chỗ tràn của số có dấu: cộng 1 vào số dương lớn nhất lại ra số âm nhỏ nhất.", "This is signed overflow: adding 1 to the largest positive number gives the most negative one.") },
    { q: L("Pattern <code>1111</code> ở hai chế độ lần lượt là?", "What is <code>1111</code> in each scheme?"), opts: ["S&M: −7, TC: −1", "S&M: −1, TC: −7", L("Cả hai đều là −7", "Both are −7"), L("Cả hai đều là −15", "Both are −15")], a: 0, star: { sm: [15], tc: [15] },
      why: L("S&M: dấu −, độ lớn 111 = 7 → −7. TC: −8 + 4 + 2 + 1 = −1.", "S&M: sign −, magnitude 111 = 7 → −7. TC: −8 + 4 + 2 + 1 = −1.") },
    { q: L("Vì sao máy tính ngày nay dùng two's complement?", "Why do today's computers use two's complement?"), opts: [L("Cộng/trừ dùng chung một mạch cộng, chỉ có một số 0", "Addition and subtraction share one adder, and there is only one zero"), L("Vì dễ đọc bằng mắt hơn", "It is easier to read by eye"), L("Vì biểu diễn được nhiều số dương hơn", "It represents more positive numbers"), L("Vì không bao giờ bị tràn", "It never overflows")], a: 0,
      why: L("Trên vòng TC, mỗi bước theo chiều kim đồng hồ luôn là +1, nên phép cộng nhị phân thông thường cho kết quả đúng cho cả số âm. S&M thì nửa âm chạy ngược chiều, cần mạch riêng để xử lý dấu.", "On the TC wheel every clockwise step is +1, so ordinary binary addition also gives correct results for negatives. On S&M the negative half runs backwards, which needs extra circuitry to handle the sign.") },
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
    $("#q-text").innerHTML = `${L("Câu", "Question")} ${S.q + 1}/${QUESTIONS.length}: ${Q.q}`;
    const box = $("#q-opts");
    box.innerHTML = "";
    G.shuffle(Q.opts.map((t, i) => ({ t, i }))).forEach((o) => box.append(el("button", {
      type: "button", class: "q-opt", html: o.t, onclick: (e) => answerQ(e.currentTarget, o.i === Q.a),
    })));
    $("#btn-q-next").hidden = true;
    setFeedback(L("Nhìn hai vòng bên trên để trả lời.", "Use the two wheels above to answer."), "", "#q-feedback");
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
      setFeedback(L("✗ Chưa đúng, thử lại. Gợi ý: tìm các pattern liên quan trên hai vòng.", "✗ Not quite, try again. Hint: find the relevant patterns on both wheels."), "bad", "#q-feedback");
    }
  }

  function finish() {
    const { isNew } = G.progress.record("number-wheel", S.lv, S.score, LEVELS.length);
    G.showScreen("end");
    $("#end-score").textContent = S.score;
    const cmp = S.level.mode === "compare";
    const perfect = cmp ? S.qRight === QUESTIONS.length : S.miss === 0;
    $("#end-title").textContent = perfect ? L("Bậc thầy vòng số! 🎉", "Wheel master! 🎉") : L("Hoàn thành level!", "Level complete!");
    $("#end-detail").textContent = (cmp ? L(`Đúng ngay lần đầu ${S.qRight}/${QUESTIONS.length} câu.`, `${S.qRight}/${QUESTIONS.length} right on the first try.`) : L(`Xếp đủ 16 ô với ${S.miss} lần đặt nhầm.`, `All 16 slots filled with ${S.miss} misplacements.`)) + (isNew ? L(" Kỷ lục mới!", " New best!") : "");
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
