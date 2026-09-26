/* Máy tính có lưu chính xác không? — quick-fire Exact/Approximate + màn reveal 0.1 + 0.2. Xem README.md. */
(function () {
  "use strict";
  const { $, el } = G;

  const EXACT = ["0.5", "0.25", "0.75", "0.125", "0.375", "0.625", "0.875", "0.0625", "0.5625", "0.3125", "2.5", "7.75", "0.1875", "10.125", "0.9375", "3.25"];
  const APPROX = ["0.1", "0.2", "0.3", "0.26", "0.6", "0.7", "0.9", "0.05", "0.15", "1.1", "0.33", "3.14", "0.01", "0.4", "0.45", "2.6"];
  const LEVELS = [
    { name: "Quick-fire", desc: "12 câu, 8 giây mỗi câu", exact: 6, approx: 6, time: 8 },
    { name: "Siêu tốc", desc: "16 câu, 5 giây mỗi câu", exact: 8, approx: 8, time: 5 },
  ];
  const PATTERNS = [
    { text: "Số có ít chữ số sau dấu chấm", why: "0.1 chỉ có 1 chữ số sau dấu chấm nhưng vẫn là gần đúng, trong khi 0.0625 có 4 chữ số lại được lưu chính xác." },
    { text: "Số nhỏ hơn 1", why: "0.1 < 1 nhưng gần đúng, còn 7.75 > 1 lại chính xác." },
    { text: "Viết thành phân số tối giản thì mẫu số là lũy thừa của 2 (2, 4, 8, 16, …)", right: true, why: "Mỗi bit sau dấu chấm có giá trị 1/2, 1/4, 1/8, … nên tổng hữu hạn các bit chỉ tạo ra được phân số có mẫu là 2ⁿ. 0.1 = 1/10 có thừa số 5 ở mẫu nên không bao giờ biểu diễn hết được." },
    { text: "Chữ số cuối cùng là 5", why: "0.05 và 0.15 tận cùng bằng 5 nhưng vẫn gần đúng. 0.375 thì chính xác, nhưng đó là vì 0.375 = 3/8." },
  ];

  const S = { lv: 0, level: null, qs: [], i: 0, score: 0, correct: 0, streak: 0, answered: false, timer: null, auto: 0, patternTried: false };

  /* ---------- Toán: phân số & nhị phân ---------- */
  /** "2.5" -> { p: 5, q: 2 } tối giản (dùng BigInt để an toàn). */
  function toFraction(str) {
    const [ip, fp = ""] = str.replace("-", "").split(".");
    let p = BigInt(ip + fp), q = 10n ** BigInt(fp.length);
    const g = bgcd(p, q) || 1n;
    return { p: p / g, q: q / g };
  }
  function bgcd(a, b) { while (b) [a, b] = [b, a % b]; return a; }
  const isPow2 = (q) => q > 0n && (q & (q - 1n)) === 0n;

  /** Biểu diễn nhị phân của p/q, tối đa maxBits bit sau dấu chấm. */
  function binaryOf(p, q, maxBits = 16) {
    const ip = p / q; let r = p % q; let bits = "";
    while (r !== 0n && bits.length < maxBits) { r *= 2n; if (r >= q) { bits += "1"; r -= q; } else bits += "0"; }
    return ip.toString(2) + (bits ? "." + bits : "") + (r !== 0n ? "…" : "");
  }

  /** Giá trị THẬT SỰ mà một số double đang lưu, dưới dạng { num, k } với x = num / 10^k. */
  function storedParts(x) {
    const dv = new DataView(new ArrayBuffer(8));
    dv.setFloat64(0, x);
    const hi = dv.getUint32(0), lo = dv.getUint32(4);
    const neg = hi >>> 31 === 1, exp = (hi >>> 20) & 0x7ff;
    let mant = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo);
    let e;
    if (exp === 0) e = -1074; else { mant |= 1n << 52n; e = exp - 1075; }
    if (e >= 0) return { neg, num: mant << BigInt(e), k: 0 };
    return { neg, num: mant * 5n ** BigInt(-e), k: -e }; // m·2^e = m·5^-e / 10^-e
  }
  function decStr(num, k, neg = false) {
    let s = num.toString().padStart(k + 1, "0");
    let ip = s.slice(0, s.length - k), fp = s.slice(s.length - k).replace(/0+$/, "");
    return (neg && num !== 0n ? "-" : "") + ip + (fp ? "." + fp : "");
  }
  const exactStored = (x) => { const s = storedParts(x); return decStr(s.num, s.k, s.neg); };

  /* ---------- Quick-fire ---------- */
  function startLevel(i) {
    S.lv = i; S.level = LEVELS[i];
    S.qs = G.shuffle([
      ...G.shuffle(EXACT).slice(0, S.level.exact).map((x) => ({ x, exact: true })),
      ...G.shuffle(APPROX).slice(0, S.level.approx).map((x) => ({ x, exact: false })),
    ]);
    S.i = 0; S.score = 0; S.correct = 0; S.streak = 0; S.patternTried = false;
    G.showScreen("play");
    ask();
  }

  function ask() {
    clearTimeout(S.auto);
    if (S.i >= S.qs.length) return showPattern();
    const q = S.qs[S.i];
    S.answered = false;
    $("#hud-q").textContent = `${S.i + 1}/${S.qs.length}`;
    $("#hud-score").textContent = S.score;
    $("#hud-streak").textContent = S.streak;
    const n = $("#number");
    n.textContent = q.x;
    n.classList.remove("pop"); void n.offsetWidth; n.classList.add("pop");
    G.$$(".ans").forEach((b) => { b.disabled = false; b.classList.remove("picked"); });
    $("#btn-next").hidden = true;
    setFeedback("Chính xác hay gần đúng?");
    S.timer && S.timer.stop();
    S.timer = new G.Timer(S.level.time, (_, r) => G.renderTimerBar($("#timer-bar"), r), () => answer(null)).start();
  }

  function answer(choice) {
    if (S.answered) return;
    S.answered = true;
    S.timer.stop();
    const q = S.qs[S.i];
    const right = choice === (q.exact ? "exact" : "approx");
    G.$$(".ans").forEach((b) => { b.disabled = true; if (b.dataset.a === choice) b.classList.add("picked"); });
    if (right) {
      const gained = 10 + Math.ceil(S.timer.left);
      S.score += gained; S.correct++; S.streak++;
      G.sound.play("good");
      setFeedback(`✓ Đúng! +${gained}${S.streak >= 3 ? ` 🔥 chuỗi ${S.streak}` : ""}<span class="detail explain">${explain(q.x)}</span>`, "good");
    } else {
      S.streak = 0;
      G.sound.play("bad");
      setFeedback(`${choice ? "✗ Sai." : "⏰ Hết giờ!"} ${q.x} được lưu <b>${q.exact ? "chính xác" : "gần đúng"}</b>.<span class="detail explain">${explain(q.x)}</span>`, "bad");
    }
    $("#hud-score").textContent = S.score;
    $("#hud-streak").textContent = S.streak;
    $("#btn-next").hidden = false;
    S.auto = setTimeout(next, right ? 2200 : 4500);
  }

  function next() { clearTimeout(S.auto); S.i++; ask(); }

  function explain(x) {
    const { p, q } = toFraction(x);
    const bin = binaryOf(p, q);
    const frac = q === 1n ? `${p}` : `${p}/${q}`;
    if (isPow2(q)) {
      const n = q.toString(2).length - 1;
      return `${x} = ${frac}, mẫu ${q} = 2${G.SUP(n)} → ${bin}₂ (hết sau ${n} bit)`;
    }
    const f5 = q % 5n === 0n;
    return `${x} = ${frac}, mẫu ${q} có thừa số ${f5 ? "5" : "khác 2"} → ${bin}₂ (lặp vô hạn)`;
  }

  /* ---------- Đoán quy luật ---------- */
  function showPattern() {
    S.timer && S.timer.stop();
    G.showScreen("pattern");
    const box = $("#pattern-choices");
    box.innerHTML = "";
    $("#btn-reveal").hidden = true;
    setFeedback("Chọn một đáp án.", "", "#pattern-feedback");
    G.shuffle(PATTERNS).forEach((pt) => {
      box.append(el("button", { class: "choice", type: "button", text: pt.text, onclick: (e) => pickPattern(e.currentTarget, pt) }));
    });
  }

  function pickPattern(btn, pt) {
    if (!$("#btn-reveal").hidden) return;
    if (pt.right) {
      btn.classList.add("right");
      if (!S.patternTried) S.score += 20;
      G.sound.play("good");
      setFeedback(`✓ Chính xác!${S.patternTried ? "" : " +20 điểm."} ${pt.why}`, "good", "#pattern-feedback");
      $("#btn-reveal").hidden = false;
      $("#btn-reveal").focus();
    } else {
      S.patternTried = true;
      btn.classList.add("wrong");
      btn.disabled = true;
      G.sound.play("bad");
      setFeedback(`✗ Phản ví dụ: ${pt.why}`, "bad", "#pattern-feedback");
    }
  }

  /* ---------- Reveal ---------- */
  function showReveal(fromGame) {
    G.showScreen("reveal");
    $("#score-card").hidden = !fromGame;
    if (fromGame) {
      const { isNew } = G.progress.record("exact-or-approx", S.lv, S.score, LEVELS.length);
      $("#end-score").textContent = S.score;
      $("#end-detail").textContent = `Đúng ${S.correct}/${S.qs.length} câu.` + (isNew ? " Kỷ lục mới!" : "");
      if (S.correct === S.qs.length) { G.confetti(); G.sound.play("win"); }
    }
    $("#out-sum").textContent = "…";
    $("#out-eq").textContent = "…";
    $("#out-eq").classList.remove("false");
    $("#lab-explain").hidden = true;
    $("#btn-again").hidden = !fromGame;
    probe();
    G.mountNextLink($("#next-game"));
  }

  async function runLab() {
    const a = 0.1, b = 0.2;
    $("#out-sum").textContent = "";
    await G.wait(250);
    $("#out-sum").textContent = String(a + b);
    G.sound.play("pop");
    await G.wait(600);
    const eq = a + b === 0.3;
    $("#out-eq").textContent = eq ? "True" : "False";
    $("#out-eq").classList.toggle("false", !eq);
    G.sound.play("bad");
    // Tô phần trùng / phần lệch của giá trị thật sự được lưu
    const stored = exactStored(0.1);
    let k = 0; const want = "0.1";
    while (k < stored.length && stored[k] === (want[k] || "0")) k++;
    $("#stored-01").innerHTML = `<span class="same">${stored.slice(0, k)}</span><span class="diff">${stored.slice(k)}</span>`;
    $("#lab-explain").hidden = false;
  }

  function probe() {
    const raw = $("#probe").value.trim().replace(",", ".");
    const out = $("#probe-out");
    if (!/^-?\d{1,6}(\.\d{1,12})?$/.test(raw)) {
      out.innerHTML = `<p class="muted">Hãy gõ số thập phân dạng <code>0.375</code> (tối đa 6 chữ số phần nguyên, 12 chữ số phần thập phân).</p>`;
      return;
    }
    const x = Number(raw);
    const st = storedParts(x);
    const { p, q } = toFraction(raw);
    // So sánh chính xác: raw = D/10^k, stored = N/10^K
    const [ip, fp = ""] = raw.replace("-", "").split(".");
    const D = BigInt(ip + fp), k = fp.length;
    const K = Math.max(k, st.k);
    const a = D * 10n ** BigInt(K - k), b = st.num * 10n ** BigInt(K - st.k);
    const diff = b > a ? b - a : a - b;
    const exact = diff === 0n;
    out.innerHTML = "";
    out.append(el("dl", {}, [
      el("dt", { text: "Bạn gõ" }), el("dd", { text: raw }),
      el("dt", { text: "Phân số" }), el("dd", { text: (raw.startsWith("-") ? "-" : "") + (q === 1n ? String(p) : `${p}/${q}`) }),
      el("dt", { text: "Nhị phân" }), el("dd", { text: (raw.startsWith("-") ? "-" : "") + binaryOf(p, q, 32) + "₂" }),
      el("dt", { text: "Máy thực sự lưu" }), el("dd", { text: decStr(st.num, st.k, st.neg) }),
      el("dt", { text: "Kết luận" }), el("dd", {
        html: exact ? `<span class="badge good">Chính xác</span>`
          : `<span class="badge warn">Gần đúng</span> sai số ≈ ${Number(decStr(diff, K)).toExponential(2)}`,
      }),
    ]));
  }

  function setFeedback(html, type = "", sel = "#feedback") {
    const f = $(sel);
    f.className = "feedback " + type;
    f.innerHTML = html;
  }

  /* ---------- Sự kiện ---------- */
  G.$$(".ans").forEach((b) => b.addEventListener("click", () => answer(b.dataset.a)));
  $("#btn-next").addEventListener("click", next);
  $("#btn-reveal").addEventListener("click", () => showReveal(true));
  $("#btn-run").addEventListener("click", runLab);
  $("#btn-probe").addEventListener("click", probe);
  $("#probe").addEventListener("keydown", (e) => { if (e.key === "Enter") probe(); });
  $("#btn-lab").addEventListener("click", () => showReveal(false));
  $("#btn-again").addEventListener("click", () => startLevel(S.lv));
  $("#btn-menu").addEventListener("click", () => { G.renderLevels($("#levels"), LEVELS, startLevel); G.showScreen("start"); });
  document.addEventListener("keydown", (e) => {
    if ($("[data-screen=play]").hidden || e.target.tagName === "INPUT") return;
    const k = e.key.toLowerCase();
    if (!S.answered && (k === "arrowleft" || k === "e")) answer("exact");
    else if (!S.answered && (k === "arrowright" || k === "a")) answer("approx");
    else if (S.answered && (k === "enter" || k === " ")) { e.preventDefault(); next(); }
  });

  G.renderLevels($("#levels"), LEVELS, startLevel);
})();
