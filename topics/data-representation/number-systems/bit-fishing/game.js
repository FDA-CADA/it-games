/* Bit Fishing — phần thập phân sang nhị phân bằng nhân 2 liên tiếp. Xem README.md. */
(function () {
  "use strict";
  const { $, el } = G;

  const MAX_BITS = 24;
  const LEVELS = [
    { name: "Cá cạn", desc: "Câu vài lần là hết", items: ["0.5", "0.75", "0.625", "0.375"], tol: 0.001 },
    { name: "Cá sâu", desc: "Hết cá, nhưng phải câu lâu hơn", items: ["0.8125", "0.4375", "0.90625", "0.203125"], tol: 0.001 },
    { name: "Cá vô tận", desc: "Không bao giờ hết. Dừng khi sai số < 0.001 hoặc khi thấy chu kỳ", items: ["0.1", "0.2", "0.3", "0.26"], tol: 0.001 },
    { name: "Hỗn hợp", desc: "Tự nhận ra con nào hết, con nào không", items: ["0.6875", "0.1", "0.5625", "0.7", "0.4", "0.15625"], tol: 0.001, shuffle: true },
  ];

  const S = { lv: 0, level: null, items: [], round: 0, score: 0, bonusRounds: 0, x: "", frac: null, digits: 0, n: 0, bits: [], seen: new Map(), cycle: null, missed: false, over: false };

  /** Hiển thị n/d dưới dạng thập phân (d luôn là ước của 10^digits). */
  const decStr = (n) => {
    if (n === 0) return "0";
    const scale = 10 ** S.digits / S.frac.d;
    return "0." + String(n * scale).padStart(S.digits, "0").replace(/0+$/, "");
  };
  const fmt = (v) => String(parseFloat(v.toPrecision(12)));
  const approx = () => S.bits.reduce((s, b, i) => s + b / 2 ** (i + 1), 0);
  const trueVal = () => S.frac.n / S.frac.d;

  function startLevel(i) {
    S.lv = i; S.level = LEVELS[i]; S.round = 0; S.score = 0; S.bonusRounds = 0;
    S.items = S.level.shuffle ? G.shuffle(S.level.items) : S.level.items.slice();
    $("#hud-level").textContent = i + 1;
    G.showScreen("play");
    nextRound();
  }

  function nextRound() {
    if (S.round >= S.items.length) return finish();
    S.x = S.items[S.round];
    S.round++;
    S.frac = G.parseFraction(S.x);
    S.digits = S.x.split(".")[1].length;
    S.n = S.frac.n; S.bits = []; S.seen = new Map([[S.n, 0]]); S.cycle = null; S.missed = false; S.over = false;

    $("#hud-round").textContent = `${S.round}/${S.items.length}`;
    $("#hud-score").textContent = S.score;
    $("#task").innerHTML = `Đổi <span class="num">${S.x}</span><sub>10</sub> sang hệ 2`;
    $("#log").innerHTML = "";
    $("#summary").hidden = true;
    $("#ask").hidden = false;
    $("#btn-next").hidden = true;
    $("#bubble").classList.remove("zero");
    $("#fish").hidden = true;
    setFeedback("Phím tắt: <kbd>0</kbd> / <kbd>1</kbd> để câu, <kbd>S</kbd> để dừng.");
    render();
  }

  function render() {
    $("#hud-net").textContent = `${S.bits.length}/${MAX_BITS}`;
    $("#bubble").textContent = decStr(S.n);
    $("#question").textContent = `${decStr(S.n)} × 2 = ?`;
    const bitsEl = $("#bits");
    bitsEl.innerHTML = `<span class="lead">0.</span>`;
    S.bits.forEach((b, i) => {
      const inPeriod = S.cycle && i >= S.cycle.start;
      bitsEl.append(el("span", { class: "b" + (inPeriod ? " period" : ""), text: b }));
    });
    if (S.bits.length) bitsEl.append(el("span", { class: "sub", text: "₂" }));
    bitsEl.parentElement.scrollLeft = 9999;
    $("#btn-stop").disabled = S.bits.length === 0 || S.over;

    const st = $("#status");
    st.innerHTML = "";
    if (S.bits.length) {
      const a = approx(), err = Math.abs(trueVal() - a);
      st.append(el("span", { html: `Đã câu: <b>${fmt(a)}</b>` }));
      st.append(el("span", { html: `Sai số: <b>${err === 0 ? "0" : err.toExponential(2)}</b>` }));
    }
    if (S.cycle) st.append(el("span", { class: "cycle", text: `🔁 Chu kỳ ${S.cycle.len} bit` }));
  }

  function guess(bit) {
    if (S.over) return;
    const prod = 2 * S.n;
    const right = prod >= S.frac.d ? 1 : 0;
    const prodStr = prod >= S.frac.d ? "1" + decStr(prod - S.frac.d).slice(1) : decStr(prod);
    if (bit !== right) {
      S.missed = true;
      G.sound.play("bad");
      G.shake($("#ask"));
      setFeedback(`✗ ${decStr(S.n)} × 2 = ${prodStr} ${right ? "≥ 1" : "< 1"}, nên phần nguyên là <b>${right}</b>. Bấm lại cho đúng.`, "bad");
      return;
    }
    // Câu đúng
    if (!S.missed) S.score += 2;
    S.missed = false;
    const before = S.n;
    S.n = prod - right * S.frac.d;
    S.bits.push(right);
    const step = S.bits.length;
    addLog(step, before, prodStr, right, S.n);
    catchAnim(right);
    G.sound.play("pop");
    $("#hud-score").textContent = S.score;

    if (S.n === 0) {
      render();
      $("#bubble").classList.add("zero");
      $("#bubble").textContent = "0 🎉";
      return endRound("exact");
    }
    if (!S.cycle && S.seen.has(S.n)) {
      const start = S.seen.get(S.n);
      S.cycle = { start, len: step - start };
      G.$$("#log tr")[step - 1].classList.add("rep");
      setFeedback(`🔁 ${decStr(S.n)} đã xuất hiện trước đó! Từ đây các bit <b>${S.bits.slice(start).join("")}</b> sẽ lặp lại mãi mãi. Cá này không bao giờ hết. Bạn có thể dừng.`, "warn");
    } else if (!S.cycle) {
      S.seen.set(S.n, step);
      setFeedback(`✓ ${decStr(before)} × 2 = ${prodStr} → bit <b>${right}</b>, còn lại ${decStr(S.n)}.`, "good");
    } else {
      setFeedback(`✓ Bit <b>${right}</b>. Chu kỳ vẫn đang lặp lại.`, "good");
    }
    render();
    if (S.bits.length >= MAX_BITS) endRound("full");
  }

  function catchAnim(bit) {
    const old = $("#fish");
    const f = el("div", { class: "fish mono", id: "fish", text: bit });
    old.replaceWith(f);
  }

  function addLog(step, before, prodStr, bit, after) {
    $("#log").append(el("tr", {}, [
      el("td", { text: step }), el("td", { text: `${decStr(before)} × 2 = ${prodStr}` }),
      el("td", { text: bit }), el("td", { text: decStr(after) }),
    ]));
  }

  function endRound(reason) {
    S.over = true;
    $("#ask").hidden = true;
    const exact = reason === "exact";
    const err = Math.abs(trueVal() - approx());
    let bonus = 0, msg;
    // Có hữu hạn không? mẫu số (tối giản) là lũy thừa của 2
    const terminates = G.isPowerOfTwo(S.frac.d);

    if (exact) { bonus = 10; msg = `🎉 Hết cá! ${S.x} được biểu diễn <b>chính xác</b> bằng ${S.bits.length} bit.`; }
    else if (terminates) msg = `Bạn dừng sớm quá. Con cá này vẫn còn và sẽ hết nếu câu tiếp (mẫu số ${S.frac.d} = 2${G.SUP(Math.log2(S.frac.d))}).`;
    else if (S.cycle || err < S.level.tol) { bonus = 10; msg = S.cycle ? "Quyết định hợp lý: đã thấy chu kỳ, câu tiếp cũng chỉ lặp lại." : `Dừng tốt: sai số đã nhỏ hơn ${S.level.tol}.`; }
    else msg = `Sai số còn lớn (≥ ${S.level.tol}). Câu thêm vài bit nữa sẽ chính xác hơn.`;
    if (reason === "full") msg = "Lưới đầy (" + MAX_BITS + " bit). " + msg;

    S.score += bonus;
    if (bonus) S.bonusRounds++;
    $("#hud-score").textContent = S.score;
    G.sound.play(bonus ? "good" : "bad");
    setFeedback((bonus ? `+${bonus} điểm. ` : "") + msg, bonus ? "good" : "warn");

    // Tổng kết: biểu diễn đầy đủ (dùng chu kỳ nếu có)
    const full = fullRepresentation();
    const box = $("#summary");
    box.hidden = false;
    box.innerHTML = `
      <div class="muted">Bạn câu được ${S.bits.length} bit:</div>
      <div class="rep">0.${S.bits.join("")}<sub>2</sub> ${exact ? "=" : "≈"} ${fmt(approx())}</div>
      ${exact ? "" : `<div class="muted" style="margin-top:6px">Sai số: ${err.toExponential(3)}</div>`}
      ${full ? `<div style="margin-top:10px">Biểu diễn đúng: <span class="rep">${full}</span></div>` : ""}
      ${!terminates ? `<p style="margin:10px 0 0">Máy tính chỉ có hữu hạn bit nên buộc phải cắt ở đâu đó, và thế là sinh ra <b>sai số làm tròn</b>. Game <i>"Máy tính có lưu chính xác không?"</i> cho bạn thấy hậu quả: <code>0.1 + 0.2 ≠ 0.3</code>.</p>` : ""}`;
    $("#btn-next").hidden = false;
    $("#btn-next").focus();
    render();
  }

  /** 0.0(0011)₂ — tính chu kỳ đầy đủ kể cả khi người chơi dừng sớm. */
  function fullRepresentation() {
    const { d } = S.frac;
    let n = S.frac.n; const seen = new Map(); const bits = [];
    while (n !== 0 && !seen.has(n) && bits.length < 64) { seen.set(n, bits.length); n *= 2; bits.push(n >= d ? 1 : 0); n -= bits[bits.length - 1] * d; }
    if (n === 0) return null; // hữu hạn: đã hiển thị ở trên
    const st = seen.get(n);
    return `0.${bits.slice(0, st).join("")}(<span class="period">${bits.slice(st).join("")}</span>)<sub>2</sub> <span class="muted" style="font-size:.8rem;font-family:var(--font)">phần trong ngoặc lặp vô hạn</span>`;
  }

  function finish() {
    const { isNew } = G.progress.record("bit-fishing", S.lv, S.score, LEVELS.length);
    G.showScreen("end");
    $("#end-score").textContent = S.score;
    const all = S.bonusRounds === S.items.length;
    $("#end-title").textContent = all ? "Ngư dân bit lão luyện! 🎉" : "Hoàn thành level!";
    $("#end-detail").textContent = `${S.bonusRounds}/${S.items.length} vòng dừng đúng lúc.` + (isNew ? " Kỷ lục mới!" : "");
    if (all) { G.confetti(); G.sound.play("win"); }
    G.mountNextLink($("#next-game"));
  }

  function setFeedback(html, type = "") {
    const f = $("#feedback");
    f.className = "feedback " + type;
    f.innerHTML = html;
  }

  G.$$(".bitbtn").forEach((b) => b.addEventListener("click", () => guess(Number(b.dataset.bit))));
  $("#btn-stop").addEventListener("click", () => !S.over && S.bits.length && endRound("stop"));
  document.addEventListener("keydown", (e) => {
    if ($("[data-screen=play]").hidden) return;
    if (e.key === "0" || e.key === "1") guess(Number(e.key));
    else if (e.key.toLowerCase() === "s") $("#btn-stop").click();
    else if (e.key === "Enter" && S.over) { e.preventDefault(); nextRound(); }
  });
  $("#btn-next").addEventListener("click", nextRound);
  $("#btn-again").addEventListener("click", () => startLevel(S.lv));
  $("#btn-menu").addEventListener("click", () => { G.renderLevels($("#levels"), LEVELS, startLevel); G.showScreen("start"); });

  G.renderLevels($("#levels"), LEVELS, startLevel);
})();
