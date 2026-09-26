/* Overflow Detective — cộng/trừ two's complement và cờ overflow. Xem README.md. */
(function () {
  "use strict";
  const { $, el, L } = G;

  const LEVELS = [
    { name: L("Cộng 4-bit", "4-bit addition"), desc: L("Dải −8 … 7", "Range −8 … 7"), ns: [4], ops: ["+"], rounds: 6 },
    { name: L("Trừ 4-bit", "4-bit subtraction"), desc: L("Trừ = cộng số bù 2", "Subtract = add the two's complement"), ns: [4], ops: ["-"], rounds: 6 },
    { name: L("6-bit hỗn hợp", "6-bit mixed"), desc: L("Dải −32 … 31, cộng và trừ", "Range −32 … 31, add and subtract"), ns: [6], ops: ["+", "-"], rounds: 6 },
    { name: L("Thám tử nhanh", "Quick detective"), desc: L("60 giây: tràn hay không?", "60 seconds: overflow or not?"), ns: [6], ops: ["+", "-"], quick: true, time: 60 },
  ];

  const S = { lv: 0, level: null, round: 0, score: 0, perfect: 0, streak: 0, n: 4, a: 0, b: 0, op: "+", stage: "add", negB: 0, res: 0, flag: false, done: false, timer: null };

  const M = () => 2 ** S.n, MIN = () => -(2 ** (S.n - 1)), MAX = () => 2 ** (S.n - 1) - 1;
  const u = (x) => ((x % M()) + M()) % M();
  const sv = (v) => G.signed(G.bits(v, S.n));
  const fmt = (x) => (x < 0 ? "−" + -x : String(x));
  const trueVal = () => (S.op === "+" ? S.a + S.b : S.a - S.b);
  const overflow = () => trueVal() < MIN() || trueVal() > MAX();
  const addend = () => (S.op === "+" ? u(S.b) : u(-S.b));
  const resU = () => (u(S.a) + addend()) % M();

  function makeCase() {
    S.n = G.pick(S.level.ns);
    S.op = S.level.ops.length > 1 && !S.level.quick ? S.level.ops[S.round % 2] : G.pick(S.level.ops);
    const want = Math.random() < 0.5;
    let tries = 0;
    do {
      S.a = G.randInt(MIN(), MAX());
      S.b = G.randInt(S.op === "-" ? MIN() + 1 : MIN(), MAX());
    } while ((overflow() !== want || S.a === 0 || S.b === 0) && ++tries < 500);
  }

  function startLevel(i) {
    S.lv = i; S.level = LEVELS[i]; S.round = 0; S.score = 0; S.perfect = 0; S.streak = 0;
    $("#hud-level").textContent = i + 1;
    $("#hud-round-wrap").hidden = !!S.level.quick;
    $("#hud-time-wrap").hidden = !S.level.quick;
    $("#timer-bar").hidden = !S.level.quick;
    $("#flag-row").hidden = !!S.level.quick;
    $("#quick").hidden = !S.level.quick;
    G.showScreen("play");
    if (S.level.quick) {
      S.timer && S.timer.stop();
      S.timer = new G.Timer(S.level.time, (l, r) => { $("#hud-time").textContent = Math.ceil(l); G.renderTimerBar($("#timer-bar"), r); }, finish).start();
    }
    nextRound();
  }

  function nextRound() {
    if (!S.level.quick && S.round >= S.level.rounds) return finish();
    S.round++; S.done = false; S.flag = false; S.res = 0; S.negB = 0;
    makeCase();
    S.stage = S.op === "-" && !S.level.quick ? "neg" : "add";
    $("#hud-round").textContent = `${S.round}/${S.level.rounds || "∞"}`;
    $("#hud-score").textContent = S.score;
    const opTxt = S.op === "+" ? "+" : "−";
    const expr = `<span class="num">${fmt(S.a)} ${opTxt} ${S.b < 0 ? `(${fmt(S.b)})` : S.b}</span>`;
    $("#case").innerHTML = L(`Vụ án #${S.round}: ${expr} trên <b>${S.n} bit</b>`, `Case #${S.round}: ${expr} on <b>${S.n} bits</b>`)
      + `<span class="range">${L("Dải biểu diễn được", "Representable range")}: ${fmt(MIN())} … ${MAX()}</span>`;
    $("#btn-check").hidden = !!S.level.quick;
    $("#btn-check").textContent = S.stage === "neg" ? L("Xong bước 1 →", "Step 1 done →") : L("Kết luận", "Close the case");
    $("#btn-next").hidden = true;
    G.$$("#quick .btn").forEach((b) => { b.disabled = false; });
    setFeedback(S.level.quick ? L("Nhìn bit dấu: cộng hai số cùng dấu mà ra khác dấu là tràn.", "Watch the sign bits: same-sign inputs giving an opposite-sign result means overflow.")
      : S.stage === "neg" ? L(`Bước 1: phép trừ đổi thành cộng. Ghi <b>−b = −(${fmt(S.b)})</b> dạng ${S.n} bit (đảo bit rồi +1).`, `Step 1: subtraction becomes addition. Write <b>−b = −(${fmt(S.b)})</b> in ${S.n} bits (flip the bits, then +1).`)
      : L("Ghi kết quả vào dòng cuối, rồi khai báo cờ overflow.", "Write the result in the last row, then declare the overflow flag."));
    renderFlag();
    render();
  }

  function render(reveal = false) {
    const sh = $("#sheet");
    sh.innerHTML = "";
    const row = (lbl, bitEl, dec, cls = "") => { if (cls) bitEl.classList.add(cls); sh.append(el("div", { class: "lbl", html: lbl }), bitEl, el("div", { class: "dec", html: dec })); };
    if (reveal) {
      // Hàng nhớ: carry vào từng cột, và bit nhớ ra ngoài
      let c = 0, carries = 0;
      const A = u(S.a), B = addend();
      for (let i = 0; i < S.n; i++) { if (c) carries |= 1 << i; c = ((A >> i & 1) + (B >> i & 1) + c) >> 1; }
      row(`<small>${L("nhớ", "carry")}</small>`, G.bitRow(carries, S.n, { cls: "sm" }), c ? `<span class="lost">↖ ${c} ${L("rơi ra ngoài", "falls off")}</span>` : "", "carry");
    }
    row("a", G.bitRow(u(S.a), S.n), fmt(S.a), "signcol");
    if (S.op === "+" || S.level.quick) {
      row(S.op === "+" ? "+ b" : "− b", G.bitRow(u(S.b), S.n), fmt(S.b), "signcol");
    } else {
      const editNeg = S.stage === "neg" && !S.done;
      row(`+ (−b)<small>b = ${fmt(S.b)} = ${G.bits(u(S.b), S.n)}</small>`,
        G.bitRow(S.stage === "neg" ? S.negB : addend(), S.n, { onToggle: editNeg ? (i) => { S.negB ^= 1 << (S.n - 1 - i); G.sound.play("tick"); render(); } : null }),
        S.stage === "neg" ? "?" : fmt(-S.b), "signcol");
    }
    if (S.level.quick) return;
    sh.append(el("div", { class: "line" }));
    const editRes = S.stage === "add" && !S.done;
    const bad = reveal ? [...G.bits(S.res, S.n)].map((b, i) => (b !== G.bits(resU(), S.n)[i] ? i : -1)).filter((i) => i >= 0) : [];
    row(L("Kết quả", "Result"), S.stage === "neg" ? el("div", { class: "muted", text: L("(làm bước 1 trước)", "(do step 1 first)") })
      : G.bitRow(S.res, S.n, { onToggle: editRes ? (i) => { S.res ^= 1 << (S.n - 1 - i); G.sound.play("tick"); render(); } : null, bad }),
    reveal ? `= ${fmt(sv(resU()))}` : "", "signcol");
  }

  function renderFlag() {
    const f = $("#flag");
    f.classList.toggle("on", S.flag);
    f.textContent = S.flag ? L("🚩 Có overflow!", "🚩 Overflow!") : L("🏳️ Không overflow", "🏳️ No overflow");
    f.disabled = S.done || S.stage === "neg";
  }

  function check() {
    if (S.done || S.level.quick) return;
    if (S.stage === "neg") {
      if (S.negB === u(-S.b)) {
        S.stage = "add";
        G.sound.play("good");
        setFeedback(`✓ −b = ${G.bits(u(-S.b), S.n)} = ${fmt(-S.b)}. ${L("Bước 2: cộng như bình thường, rồi khai báo cờ overflow.", "Step 2: add as usual, then declare the overflow flag.")}`, "good");
        $("#btn-check").textContent = L("Kết luận", "Close the case");
        renderFlag();
        render();
      } else {
        G.sound.play("bad");
        const inv = u(S.b) ^ (M() - 1);
        setFeedback(L(`✗ Chưa đúng. Đảo bit của ${G.bits(u(S.b), S.n)} được ${G.bits(inv, S.n)}, rồi cộng thêm 1.`, `✗ Not quite. Flipping the bits of ${G.bits(u(S.b), S.n)} gives ${G.bits(inv, S.n)}, then add 1.`), "bad");
      }
      return;
    }
    S.done = true;
    const resOk = S.res === resU(), flagOk = S.flag === overflow();
    const gained = (resOk ? 5 : 0) + (flagOk ? 5 : 0);
    S.score += gained;
    if (resOk && flagOk) S.perfect++;
    G.sound.play(resOk && flagOk ? "good" : "bad");
    renderFlag();
    render(true);
    setFeedback(`${resOk ? L("✓ Kết quả đúng", "✓ Result right") : L("✗ Kết quả sai", "✗ Result wrong")} · ${flagOk ? L("✓ cờ đúng", "✓ flag right") : L("✗ cờ sai", "✗ flag wrong")}. +${gained}<span class="detail">${explain()}</span>`, resOk && flagOk ? "good" : "bad");
    $("#hud-score").textContent = S.score;
    $("#btn-check").hidden = true;
    $("#btn-next").hidden = false;
    $("#btn-next").focus();
  }

  function explain() {
    const t = trueVal(), r = sv(resU());
    const sub = S.op === "-" ? `${fmt(S.a)} − ${S.b < 0 ? `(${fmt(S.b)})` : S.b} = ${fmt(S.a)} + ${-S.b < 0 ? `(${fmt(-S.b)})` : -S.b}. ` : "";
    const NEG = L("âm", "negative"), POS = L("dương", "positive");
    const sa = S.a < 0 ? NEG : POS, sb = (S.op === "+" ? S.b : -S.b) < 0 ? NEG : POS;
    const rs = r < 0 ? NEG : POS;
    if (overflow()) return sub + L(`Kết quả thật là ${fmt(t)}, nằm ngoài ${fmt(MIN())} … ${MAX()}: <b>overflow</b>. Máy chỉ giữ ${S.n} bit nên ra ${G.bits(resU(), S.n)} = ${fmt(r)}. Dấu hiệu: hai số hạng đều ${sa} mà kết quả lại ${rs}.`, `The true result is ${fmt(t)}, outside ${fmt(MIN())} … ${MAX()}: <b>overflow</b>. The machine keeps only ${S.n} bits, giving ${G.bits(resU(), S.n)} = ${fmt(r)}. The tell-tale sign: both operands are ${sa} but the result is ${rs}.`);
    let s = sub + L(`Kết quả ${fmt(t)} nằm trong dải, <b>không overflow</b>.`, `The result ${fmt(t)} is within range, <b>no overflow</b>.`);
    if (sa !== sb) s += L(" Hai số hạng khác dấu thì không bao giờ tràn.", " Operands with different signs never overflow.");
    if (u(S.a) + addend() >= M()) s += L(" Có bit nhớ rơi ra ngoài, nhưng với số có dấu thì <b>carry không phải overflow</b>. Cứ bỏ bit nhớ đó đi.", " A carry bit falls off the end, but for signed numbers <b>carry is not overflow</b>. Just drop that carry.");
    return s;
  }

  /* ---------- Thám tử nhanh ---------- */
  function quickAnswer(v) {
    if (S.done || !S.level.quick) return;
    S.done = true;
    const right = (v === 1) === overflow();
    G.$$("#quick .btn").forEach((b) => { b.disabled = true; });
    if (right) {
      S.streak++; S.score += 10 + 2 * (S.streak - 1); S.perfect++;
      G.sound.play("good");
      setFeedback(`✓ ${overflow() ? L("Tràn!", "Overflow!") : L("Không tràn.", "No overflow.")} ${fmt(S.a)} ${S.op === "+" ? "+" : "−"} ${S.b < 0 ? `(${fmt(S.b)})` : S.b} = ${fmt(trueVal())}`, "good");
      $("#hud-score").textContent = S.score;
      setTimeout(() => { if (!$("[data-screen=play]").hidden && S.level.quick) nextRound(); }, 900);
    } else {
      S.streak = 0;
      G.sound.play("bad");
      setFeedback(`✗ <span class="detail">${explain()}</span>`, "bad");
      $("#btn-next").hidden = false;
      $("#btn-next").focus();
    }
  }

  function finish() {
    S.timer && S.timer.stop();
    if ($("[data-screen=end]").hidden === false) return;
    const { isNew } = G.progress.record("overflow-detective", S.lv, S.score, LEVELS.length);
    G.showScreen("end");
    $("#end-score").textContent = S.score;
    const all = !S.level.quick && S.perfect === S.level.rounds;
    $("#end-title").textContent = S.level.quick ? L("Hết giờ phá án!", "Time's up, detective!") : all ? L("Thám tử lừng danh! 🎉", "Legendary detective! 🎉") : L("Hoàn thành level!", "Level complete!");
    $("#end-detail").textContent = (S.level.quick ? L(`Phá đúng ${S.perfect} vụ.`, `${S.perfect} cases solved.`) : L(`${S.perfect}/${S.level.rounds} vụ đúng cả kết quả lẫn cờ.`, `${S.perfect}/${S.level.rounds} cases with both result and flag right.`)) + (isNew ? L(" Kỷ lục mới!", " New best!") : "");
    if (all || (S.level.quick && S.perfect >= 12)) { G.confetti(); G.sound.play("win"); }
    G.mountNextLink($("#next-game"));
  }

  function setFeedback(html, type = "") {
    const f = $("#feedback");
    f.className = "feedback " + type;
    f.innerHTML = html;
  }

  $("#flag").addEventListener("click", () => { if (S.done || S.stage === "neg") return; S.flag = !S.flag; G.sound.play("tick"); renderFlag(); });
  G.$$("#quick .btn").forEach((b) => b.addEventListener("click", () => quickAnswer(Number(b.dataset.v))));
  document.addEventListener("keydown", (e) => {
    if ($("[data-screen=play]").hidden) return;
    if (S.level.quick && !S.done && (e.key === "ArrowLeft" || e.key === "ArrowRight")) { quickAnswer(e.key === "ArrowLeft" ? 1 : 0); return; }
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (S.done) nextRound(); else check();
  });
  $("#btn-check").addEventListener("click", check);
  $("#btn-next").addEventListener("click", nextRound);
  $("#btn-again").addEventListener("click", () => startLevel(S.lv));
  $("#btn-menu").addEventListener("click", () => { S.timer && S.timer.stop(); G.renderLevels($("#levels"), LEVELS, startLevel); G.showScreen("start"); });

  G.renderLevels($("#levels"), LEVELS, startLevel);
})();
