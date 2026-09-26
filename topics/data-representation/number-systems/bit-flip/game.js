/* Bit Flip — cảm nhận trọng số vị trí (positional notation). Xem README.md. */
(function () {
  "use strict";
  const { $, el, L } = G;

  const LEVELS = [
    { name: L("Khởi động", "Warm-up"), desc: L("4 bóng hệ 2 (0–15)", "4 base-2 bulbs (0–15)"), base: 2, digits: 4, rounds: 6, time: 30, showSum: true },
    { name: L("Một byte", "One byte"), desc: L("8 bóng hệ 2 (0–255)", "8 base-2 bulbs (0–255)"), base: 2, digits: 8, rounds: 8, time: 30, showSum: true },
    { name: L("Không nhìn tổng", "No peeking"), desc: L("8 bóng, tự cộng nhẩm", "8 bulbs, add it up in your head"), base: 2, digits: 8, rounds: 8, time: 35, showSum: false },
    { name: L("Bánh xe bát phân", "Octal dials"), desc: L("3 bánh xe hệ 8 (0–511)", "3 base-8 dials (0–511)"), base: 8, digits: 3, rounds: 6, time: 40, showSum: true },
    { name: L("Bánh xe hex", "Hex dials"), desc: L("2 bánh xe hệ 16 (0–255)", "2 base-16 dials (0–255)"), base: 16, digits: 2, rounds: 6, time: 40, showSum: true },
    { name: L("Hex 3 chữ số", "3-digit hex"), desc: L("3 bánh xe hệ 16, không nhìn tổng", "3 base-16 dials, no peeking"), base: 16, digits: 3, rounds: 6, time: 50, showSum: false },
  ];

  const S = { lv: 0, level: null, round: 0, score: 0, solved: 0, target: 0, values: [], timer: null, done: false, used: new Set() };

  const weightOf = (i) => S.level.base ** (S.level.digits - 1 - i); // i = 0 là ô trái nhất
  const current = () => S.values.reduce((s, v, i) => s + v * weightOf(i), 0);
  const reprStr = (vals) => vals.map(G.digitChar).join("");

  function startLevel(i) {
    S.lv = i; S.level = LEVELS[i]; S.round = 0; S.score = 0; S.solved = 0; S.used.clear();
    G.showScreen("play");
    $("#hud-level").textContent = i + 1;
    nextRound();
  }

  function pickTarget() {
    const max = S.level.base ** S.level.digits - 1;
    let t, tries = 0;
    do { t = G.randInt(1, max); } while ((S.used.has(t) || (S.level.base > 2 && t < S.level.base)) && ++tries < 50);
    S.used.add(t);
    return t;
  }

  function nextRound() {
    if (S.round >= S.level.rounds) return finish();
    S.round++; S.done = false;
    S.target = pickTarget();
    S.values = Array(S.level.digits).fill(0);
    $("#hud-round").textContent = `${S.round}/${S.level.rounds}`;
    $("#hud-score").textContent = S.score;
    $("#target").textContent = S.target;
    $("#btn-next").hidden = true;
    $("#btn-clear").disabled = false;
    setFeedback(S.level.base === 2
      ? L("Bấm vào bóng đèn để bật/tắt. Phím số ", "Click a bulb to switch it. Number keys ") + "<kbd>1</kbd>…<kbd>" + S.level.digits + "</kbd>" + L(" cũng được.", " work too.")
      : L("Bấm ▲/▼ hoặc cuộn chuột trên bánh xe để đổi chữ số.", "Use ▲/▼ or scroll on a dial to change the digit."));
    buildCells();
    update();
    S.timer && S.timer.stop();
    S.timer = new G.Timer(S.level.time, (left, ratio) => {
      $("#hud-time").textContent = Math.ceil(left);
      G.renderTimerBar($("#timer-bar"), ratio);
    }, timeUp).start();
  }

  function buildCells() {
    const box = $("#cells");
    box.innerHTML = "";
    const { base, digits } = S.level;
    for (let i = 0; i < digits; i++) {
      const w = weightOf(i), p = digits - 1 - i;
      let control;
      if (base === 2) {
        control = el("button", {
          class: "bulb", type: "button", "aria-label": L(`Bit trọng số ${w}`, `Bit of weight ${w}`), "aria-pressed": "false",
          onclick: () => setDigit(i, S.values[i] ? 0 : 1),
        });
      } else {
        const face = el("div", { class: "face", text: "0" });
        face.addEventListener("click", () => setDigit(i, (S.values[i] + 1) % base));
        face.addEventListener("wheel", (e) => {
          e.preventDefault();
          setDigit(i, (S.values[i] + (e.deltaY < 0 ? 1 : base - 1)) % base);
        }, { passive: false });
        control = el("div", { class: "wheel" }, [
          el("button", { type: "button", "aria-label": L("Tăng", "Up"), text: "▲", onclick: () => setDigit(i, (S.values[i] + 1) % base) }),
          face,
          el("button", { type: "button", "aria-label": L("Giảm", "Down"), text: "▼", onclick: () => setDigit(i, (S.values[i] + base - 1) % base) }),
        ]);
      }
      box.append(el("div", { class: "cell", "data-i": i }, [
        el("span", { class: "weight", text: w }),
        el("span", { class: "power", html: `${base}${G.SUP(p)}` }),
        control,
        base === 2 ? el("span", { class: "digit", text: "0" }) : null,
      ]));
    }
  }

  function setDigit(i, v) {
    if (S.done) return;
    S.values[i] = v;
    G.sound.play("pop");
    update();
  }

  function update() {
    const { base, showSum } = S.level;
    G.$$(".cell", $("#cells")).forEach((c, i) => {
      const v = S.values[i];
      if (base === 2) {
        const b = $(".bulb", c);
        b.classList.toggle("on", v === 1);
        b.setAttribute("aria-pressed", v === 1 ? "true" : "false");
        $(".digit", c).textContent = v;
      } else {
        $(".face", c).textContent = G.digitChar(v);
      }
    });
    const cur = current();
    $("#repr").innerHTML = G.based(reprStr(S.values), base);
    const sumEl = $("#sum");
    if (showSum || S.done) sumEl.innerHTML = `= <b>${cur}</b><sub>10</sub>`;
    else sumEl.innerHTML = `= <b>?</b> <span class="muted">${L("(level này ẩn tổng)", "(hidden in this level)")}</span>`;
    sumEl.classList.toggle("match", cur === S.target);
    if (!S.done && cur === S.target) win();
  }

  function expansion(vals) {
    const { base, digits } = S.level;
    const terms = vals.map((v, i) => ({ v, w: base ** (digits - 1 - i) }))
      .filter((t) => t.v !== 0)
      .map((t) => (base === 2 ? `${t.w}` : `${t.v}×${t.w}`));
    return terms.join(" + ") + ` = ${vals.reduce((s, v, i) => s + v * base ** (digits - 1 - i), 0)}`;
  }

  function win() {
    S.done = true;
    S.timer.stop();
    const gained = 10 + Math.ceil(S.timer.left);
    S.score += gained; S.solved++;
    $("#hud-score").textContent = S.score;
    G.sound.play("good");
    setFeedback(`✓ ${L("Chính xác!", "Correct!")} +${gained} <span class="detail expansion">${expansion(S.values)}</span>`, "good");
    update();
    $("#btn-clear").disabled = true;
    $("#btn-next").hidden = false;
    $("#btn-next").focus();
  }

  function timeUp() {
    if (S.done) return;
    S.done = true;
    G.sound.play("bad");
    // Hiện đáp án đúng
    const { base, digits } = S.level;
    const ans = S.target.toString(base).toUpperCase().padStart(digits, "0");
    S.values = ans.split("").map(G.digitValue);
    G.$$(".cell", $("#cells")).forEach((c, i) => c.classList.toggle("hint", S.values[i] !== 0));
    update();
    setFeedback(`⏰ ${L("Hết giờ! Đáp án:", "Time's up! Answer:")} ${G.based(ans, base)} <span class="detail expansion">${expansion(S.values)}</span>`, "bad");
    $("#btn-clear").disabled = true;
    $("#btn-next").hidden = false;
  }

  function finish() {
    S.timer && S.timer.stop();
    const { isNew } = G.progress.record("bit-flip", S.lv, S.score, LEVELS.length);
    G.showScreen("end");
    $("#end-score").textContent = S.score;
    $("#end-title").textContent = S.solved === S.level.rounds ? L("Hoàn hảo! 🎉", "Perfect! 🎉") : L("Hoàn thành level!", "Level complete!");
    $("#end-detail").textContent = L(`Giải đúng ${S.solved}/${S.level.rounds} vòng.`, `Solved ${S.solved}/${S.level.rounds} rounds.`) + (isNew ? L(" Kỷ lục mới!", " New best!") : "");
    if (S.solved === S.level.rounds) { G.confetti(); G.sound.play("win"); }
    G.mountNextLink($("#next-game"));
  }

  function setFeedback(html, type = "") {
    const f = $("#feedback");
    f.className = "feedback " + type;
    f.innerHTML = html;
  }

  // Phím tắt: 1..8 bật/tắt bóng từ trái sang, Enter sang vòng tiếp
  document.addEventListener("keydown", (e) => {
    if ($("[data-screen=play]").hidden || e.target.tagName === "INPUT") return;
    if (e.key === "Enter" && !$("#btn-next").hidden) { e.preventDefault(); $("#btn-next").click(); return; }
    const n = parseInt(e.key, 10);
    if (S.level && S.level.base === 2 && n >= 1 && n <= S.level.digits) setDigit(n - 1, S.values[n - 1] ? 0 : 1);
  });

  $("#btn-clear").addEventListener("click", () => { S.values.fill(0); update(); });
  $("#btn-next").addEventListener("click", nextRound);
  $("#btn-again").addEventListener("click", () => startLevel(S.lv));
  $("#btn-menu").addEventListener("click", () => { G.renderLevels($("#levels"), LEVELS, startLevel); G.showScreen("start"); });

  G.renderLevels($("#levels"), LEVELS, startLevel);
})();
