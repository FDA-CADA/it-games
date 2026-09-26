/* Float Builder — lắp và giải mã số thực IEEE 754 single precision. Xem README.md. */
(function () {
  "use strict";
  const { $, el } = G;

  const LEVELS = [
    { name: "Lắp có hướng dẫn", desc: "5 bước, bắt đầu với −6.75", kind: "build", guided: true, rounds: 4 },
    { name: "Tự lắp", desc: "Không có từng bước, chỉ có kiểm tra", kind: "build", guided: false, rounds: 4 },
    { name: "Giải mã có hướng dẫn", desc: "32 bit → số thực, từng bước", kind: "decode", guided: true, rounds: 4 },
    { name: "Giải mã nhanh", desc: "Nhìn bit, gõ ngay giá trị", kind: "decode", guided: false, rounds: 6 },
  ];
  const FIELDS = { s: [0, 1], e: [1, 9], m: [9, 32] };

  const S = { lv: 0, level: null, round: 0, score: 0, perfect: 0, t: null, bits: [], editable: new Set(), steps: [], k: 0, stepTried: false, roundErr: false, tries: 0, done: false, show: {} };

  /* ---------- Toán IEEE 754 ---------- */
  const fmt = (x) => String(x).replace("-", "−");
  const SUPS = (n) => G.SUP(n);
  function bitsOfFloat(x) { const dv = new DataView(new ArrayBuffer(4)); dv.setFloat32(0, x); return dv.getUint32(0).toString(2).padStart(32, "0"); }
  function floatOfBits(b) { const dv = new DataView(new ArrayBuffer(4)); dv.setUint32(0, parseInt(b, 2)); return dv.getFloat32(0); }
  function parseBin(s) {
    s = s.trim();
    if (!/^[01]+(\.[01]*)?$|^\.[01]+$/.test(s)) return NaN;
    const [ip, fp = ""] = s.split(".");
    return (ip ? parseInt(ip, 2) : 0) + [...fp].reduce((a, b, i) => a + (b === "1" ? 2 ** -(i + 1) : 0), 0);
  }
  const parseNum = (s) => { s = s.trim().replace(/[−–]/g, "-").replace(",", "."); return /^-?\d+(\.\d+)?$/.test(s) ? parseFloat(s) : NaN; };

  function makeTarget(fixed) {
    let sign, E, frac;
    if (fixed) [sign, E, frac] = fixed;
    else {
      sign = Math.random() < 0.5 ? 1 : 0;
      E = G.randInt(-3, 6);
      const m = G.randInt(1, 5);
      frac = G.bits(G.randInt(0, 2 ** (m - 1) - 1) * 2 + 1, m); // bit cuối = 1
      if (Math.random() < 0.15) frac = "";                      // lũy thừa của 2
    }
    const sigBits = "1" + frac;
    let absBin;
    if (E >= 0) {
      const ip = sigBits.slice(0, E + 1).padEnd(E + 1, "0"), fp = sigBits.slice(E + 1);
      absBin = ip + (fp ? "." + fp : "");
    } else absBin = "0." + "0".repeat(-E - 1) + sigBits;
    const abs = (1 + (frac ? parseInt(frac, 2) / 2 ** frac.length : 0)) * 2 ** E;
    const x = sign ? -abs : abs;
    return { sign, E, frac, sig: "1" + (frac ? "." + frac : ""), absBin, x, bits: bitsOfFloat(x), exp: E + 127 };
  }

  /* ---------- Vẽ 32 bit ---------- */
  function renderFloat() {
    for (const [f, [a, b]] of Object.entries(FIELDS)) {
      const box = $(`.fbits[data-f="${f}"]`);
      box.innerHTML = "";
      const editable = S.editable.has(f) && !S.done;
      box.parentElement.classList.toggle("locked", !editable);
      for (let i = a; i < b; i++) {
        const cls = "fb" + (S.bits[i] === "1" ? " one" : "") + ((i - a) % 4 === 3 && i < b - 1 ? " nib" : "");
        box.append(editable
          ? el("button", { type: "button", class: cls, text: S.bits[i], "aria-label": `Bit ${31 - i}`, onclick: () => { S.bits[i] = S.bits[i] === "1" ? "0" : "1"; G.sound.play("tick"); renderFloat(); } })
          : el("span", { class: cls, text: S.bits[i] }));
      }
    }
    const b = S.bits.join("");
    const e = parseInt(b.slice(1, 9), 2), mant = b.slice(9).replace(/0+$/, "");
    $("#v-s").textContent = S.show.s ? (b[0] === "1" ? "−" : "+") : " ";
    $("#v-e").textContent = S.show.e ? `${e} → E = ${e} − 127 = ${e - 127}` : " ";
    $("#v-m").textContent = S.show.m ? `1.${mant || "0"}` : " ";
    $("#hexline").textContent = S.show.hex ? `0x${parseInt(b, 2).toString(16).toUpperCase().padStart(8, "0")} = ${fmt(floatOfBits(b))}` : "";
  }

  /* ---------- Các bước ---------- */
  function buildSteps(t) {
    const E = t.E, sigFrac = t.frac || "(không có)";
    if (S.level.kind === "build") return [
      { title: "Dấu (Sign)", text: `<b>Dấu:</b> ${fmt(t.x)} ${t.sign ? "âm" : "dương"} → bấm bit <b class="c-s">Sign</b> cho đúng (1 = âm), rồi Kiểm tra.`, fields: ["s"],
        check: () => S.bits[0] === String(t.sign), res: () => `Sign = ${t.sign}`, hint: t.sign ? "Số âm nên Sign = 1." : "Số dương nên Sign = 0 (giữ nguyên)." },
      { title: "Đổi |x| sang nhị phân", text: `<b>Đổi |x| = ${fmt(Math.abs(t.x))} sang nhị phân</b>`, input: "vd 110.11",
        check: (v) => parseBin(v) === Math.abs(t.x), res: () => `${fmt(Math.abs(t.x))} = ${t.absBin}₂`,
        hint: `Phần nguyên chia 2 liên tiếp, phần thập phân nhân 2 liên tiếp (Remainder Tower + Bit Fishing). Đáp án: ${t.absBin}` },
      { title: "Chuẩn hóa về 1.xxx × 2^E", text: `<b>Chuẩn hóa:</b> ${t.absBin} = ${t.sig} × 2<sup>E</sup>. E = ?`, input: "số mũ E",
        check: (v) => parseNum(v) === E, res: () => `${t.absBin} = ${t.sig} × 2${SUPS(E)}`,
        hint: E >= 0 ? `Dời dấu chấm sang <b>trái</b> ${E} vị trí thì E = +${E}.` : `Dời dấu chấm sang <b>phải</b> ${-E} vị trí thì E = −${-E}.` },
      { title: "Exponent = E + 127", text: `<b>Exponent</b> = E + 127. Bật các bit <b class="c-e">Exponent</b> cho đúng giá trị đó.`, fields: ["e"],
        check: () => S.bits.slice(1, 9).join("") === G.bits(t.exp), res: () => `${E} + 127 = ${t.exp} = ${G.bits(t.exp)}`, show: "e",
        hint: `${E} + 127 = ${t.exp} = ${G.bits(t.exp)}₂` },
      { title: "Mantissa", text: `<b>Mantissa:</b> chép phần sau dấu chấm của ${t.sig} vào <b class="c-m">Mantissa</b> từ trái sang, còn lại để 0.`, fields: ["m"],
        check: () => S.bits.slice(9).join("") === t.frac.padEnd(23, "0"), res: () => `Mantissa = ${sigFrac}000…`, show: "m",
        hint: `Phần sau dấu chấm là <b>${sigFrac}</b>. Số 1 phía trước là "ẩn", không lưu.` },
    ];
    return [
      { title: "Dấu (Sign)", text: `<b>Dấu:</b> bit <b class="c-s">Sign</b> = ${t.bits[0]}. Số này âm hay dương?`, choice: ["+ Dương", "− Âm"],
        check: (v) => v === (t.sign ? "− Âm" : "+ Dương"), res: () => (t.sign ? "−" : "+"), show: "s", hint: "Sign = 1 là âm, 0 là dương." },
      { title: "Giá trị trường Exponent", text: `<b>Exponent:</b> 8 bit <b class="c-e">${t.bits.slice(1, 9)}</b> là số thập phân nào?`, input: "0 … 255",
        check: (v) => parseNum(v) === t.exp, res: () => `${t.bits.slice(1, 9)} = ${t.exp}`, hint: `${t.bits.slice(1, 9)} = ${t.exp}` },
      { title: "Số mũ thật E", text: `<b>Số mũ thật</b> E = Exponent − 127 = ?`, input: "E",
        check: (v) => parseNum(v) === E, res: () => `E = ${t.exp} − 127 = ${E}`, show: "e", hint: `${t.exp} − 127 = ${E}` },
      { title: "Significand 1.xxx", text: `<b>Mantissa:</b> thêm "1." phía trước các bit <b class="c-m">Mantissa</b> (bỏ các số 0 thừa ở cuối).`, input: "vd 1.1011",
        check: (v) => parseBin(v) === 1 + (t.frac ? parseInt(t.frac, 2) / 2 ** t.frac.length : 0), res: () => t.sig, show: "m", hint: `Mantissa bắt đầu bằng ${sigFrac} → ${t.sig}` },
      { title: "Giá trị cuối cùng", text: `<b>Giá trị:</b> ${t.sign ? "−" : "+"}${t.sig}₂ × 2<sup>${E}</sup> = ? (hệ 10)`, input: "vd −6.75",
        check: (v) => parseNum(v) === t.x, res: () => `${t.sign ? "−" : ""}${t.absBin}₂ = ${fmt(t.x)}`, show: "hex",
        hint: `Dời dấu chấm của ${t.sig} ${E >= 0 ? "sang phải" : "sang trái"} ${Math.abs(E)} vị trí: ${t.absBin}₂ = ${fmt(Math.abs(t.x))}` },
    ];
  }

  function renderSteps() {
    const ol = $("#steps");
    ol.innerHTML = "";
    S.steps.forEach((st, i) => {
      const li = el("li", { class: i < S.k ? "done" : i === S.k ? "cur" : "" });
      const body = el("div", { class: "body", html: i <= S.k ? st.text : `<b>${st.title}</b>` });
      if (i < S.k) body.append(el("div", { class: "res", text: st.res() }));
      if (i === S.k && !S.done) {
        const ctrl = el("div", { class: "ctrl" });
        if (st.input) {
          const inp = el("input", { class: "mono step-in", id: "step-in", placeholder: st.input, autocomplete: "off" });
          ctrl.append(inp);
        } else if (st.choice) {
          st.choice.forEach((c) => ctrl.append(el("button", { type: "button", class: "btn ghost sm", text: c, onclick: () => checkStep(c) })));
        } else ctrl.append(el("span", { class: "muted", text: "↑ Bấm các bit ở trên, rồi Kiểm tra." }));
        body.append(ctrl);
        if (st.hintShown) body.append(el("div", { class: "hint", html: "💡 " + st.hint }));
      }
      li.append(body);
      ol.append(li);
    });
    const inp = $("#step-in");
    if (inp) inp.focus();
  }

  /* ---------- Vòng chơi ---------- */
  function startLevel(i) {
    S.lv = i; S.level = LEVELS[i]; S.round = 0; S.score = 0; S.perfect = 0;
    $("#hud-level").textContent = i + 1;
    G.showScreen("play");
    nextRound();
  }

  function nextRound() {
    if (S.round >= S.level.rounds) return finish();
    S.round++; S.done = false; S.k = 0; S.tries = 0; S.roundErr = false; S.stepTried = false;
    S.t = makeTarget(S.round === 1 && S.lv === 0 ? [1, 2, "1011"] : null);
    const t = S.t, build = S.level.kind === "build";
    $("#hud-round").textContent = `${S.round}/${S.level.rounds}`;
    $("#hud-score").textContent = S.score;
    $("#task").innerHTML = build ? `Lắp số <span class="num">${fmt(t.x)}</span> vào 32 bit` : `32 bit này là số thực nào?`;
    S.bits = build ? Array(32).fill("0") : [...t.bits];
    S.show = build ? {} : { s: false };
    S.editable = new Set(build && !S.level.guided ? ["s", "e", "m"] : []);
    S.steps = S.level.guided ? buildSteps(t) : [];
    $("#steps").hidden = !S.level.guided;
    $("#quick").hidden = !(S.level.kind === "decode" && !S.level.guided);
    $("#quick-in").value = "";
    $("#btn-hint").hidden = !S.level.guided;
    $("#btn-check").hidden = false;
    $("#btn-next").hidden = true;
    if (S.level.guided) enterStep();
    renderFloat();
    setFeedback(S.level.guided ? "Làm lần lượt từng bước bên dưới." : build ? "Bấm bit ở cả 3 khu rồi Kiểm tra. Nhớ 5 bước!" : "Gõ giá trị thập phân rồi Enter.");
    if ($("#quick").hidden === false) $("#quick-in").focus();
  }

  function enterStep() {
    const st = S.steps[S.k];
    S.stepTried = false;
    S.editable = new Set(st && st.fields ? st.fields : []);
    renderSteps();
    renderFloat();
  }

  function checkStep(choice) {
    const st = S.steps[S.k];
    if (st.choice && choice == null) { setFeedback("Chọn một trong hai nút + / − ở bước hiện tại.", "warn"); return; }
    const val = choice ?? ($("#step-in") ? $("#step-in").value : null);
    if (st.input && !String(val).trim()) { setFeedback("Hãy điền câu trả lời cho bước này.", "warn"); return; }
    if (st.check(val)) {
      if (!S.stepTried) S.score += 4;
      if (st.show) S.show[st.show] = true;
      $("#hud-score").textContent = S.score;
      G.sound.play("good");
      S.k++;
      if (S.k >= S.steps.length) return roundDone();
      setFeedback(`✓ ${st.res()}`, "good");
      enterStep();
    } else {
      S.stepTried = true; S.roundErr = true;
      G.sound.play("bad");
      G.shake($("#steps li.cur"));
      setFeedback("✗ Chưa đúng. Thử lại hoặc bấm 💡 Gợi ý.", "bad");
    }
  }

  function checkFree() {
    const t = S.t;
    S.tries++;
    const b = S.bits.join("");
    const wrong = Object.entries(FIELDS).filter(([, [a, c]]) => b.slice(a, c) !== t.bits.slice(a, c)).map(([f]) => f);
    G.$$(".field").forEach((f) => f.classList.remove("bad"));
    if (!wrong.length) {
      S.score += Math.max(5, 20 - 5 * (S.tries - 1));
      if (S.tries === 1) S.perfect++;
      return roundDone();
    }
    S.roundErr = true;
    wrong.forEach((f) => $(`.f-${f}`).classList.add("bad"));
    G.sound.play("bad");
    const names = { s: "Sign", e: "Exponent", m: "Mantissa" };
    const cur = floatOfBits(b);
    let tip = "";
    if (b.slice(1, 9) === "11111111") tip = " Exponent toàn bit 1 là mã đặc biệt dành cho ∞ và NaN, không dùng cho số thường.";
    if (wrong.includes("e") && b.slice(1, 9) === G.bits(t.E)) tip = " Exponent phải cộng thêm độ lệch 127 (không lưu E trực tiếp).";
    else if (wrong.includes("m") && b.slice(9).startsWith("1" + t.frac) && t.frac.length < 23) tip = " Không lưu số 1 đứng trước dấu chấm.";
    setFeedback(`✗ Sai ở: <b>${wrong.map((f) => names[f]).join(", ")}</b>. 32 bit hiện tại đang là <b class="mono">${fmt(cur)}</b>.${tip}`, "bad");
  }

  function checkQuick() {
    const v = parseNum($("#quick-in").value);
    if (isNaN(v)) { setFeedback("Hãy gõ số thập phân, ví dụ −6.75.", "warn"); return; }
    S.tries++;
    const t = S.t;
    if (v === t.x) {
      S.score += S.tries === 1 ? 10 : 4;
      if (S.tries === 1) S.perfect++;
      return roundDone();
    }
    S.roundErr = true;
    G.sound.play("bad");
    let tip = "";
    if (v === (t.sign ? -1 : 1) * (1 + (t.frac ? parseInt(t.frac, 2) / 2 ** t.frac.length : 0)) * 2 ** t.exp) tip = " Bạn quên trừ 127 ở exponent?";
    else if (Math.abs(v) === Math.abs(t.x)) tip = " Xem lại bit dấu.";
    setFeedback(`✗ Chưa đúng.${tip} Công thức: (−1)<sup>S</sup> × 1.M × 2<sup>Exp − 127</sup>.`, "bad");
  }

  function roundDone() {
    S.done = true;
    S.show = { s: true, e: true, m: true, hex: true };
    S.editable = new Set();
    if (S.level.guided) { S.score += 5; if (!S.roundErr) S.perfect++; renderSteps(); }
    $("#hud-score").textContent = S.score;
    renderFloat();
    G.sound.play("good");
    const t = S.t;
    setFeedback(`🎉 ${fmt(t.x)} = <span class="mono">${t.bits[0]} ${t.bits.slice(1, 9)} ${t.bits.slice(9)}</span>
      <span class="detail">(−1)<sup>${t.sign}</sup> × ${t.sig}₂ × 2<sup>${t.exp} − 127</sup> = ${fmt(t.x)}</span>`, "good");
    $("#btn-check").hidden = true;
    $("#btn-hint").hidden = true;
    $("#btn-next").hidden = false;
    $("#btn-next").focus();
  }

  function check() {
    if (S.done) return;
    if (S.level.guided) checkStep();
    else if (S.level.kind === "build") checkFree();
    else checkQuick();
  }

  function finish() {
    const { isNew } = G.progress.record("float-builder", S.lv, S.score, LEVELS.length);
    G.showScreen("end");
    $("#end-score").textContent = S.score;
    const all = S.perfect === S.level.rounds;
    $("#end-title").textContent = all ? "Kiến trúc sư IEEE 754! 🎉" : "Hoàn thành level!";
    $("#end-detail").textContent = `${S.perfect}/${S.level.rounds} vòng không sai lần nào.` + (isNew ? " Kỷ lục mới!" : "");
    if (all) { G.confetti(); G.sound.play("win"); }
    G.mountNextLink($("#next-game"));
  }

  function setFeedback(html, type = "") {
    const f = $("#feedback");
    f.className = "feedback " + type;
    f.innerHTML = html;
  }

  $("#btn-hint").addEventListener("click", () => {
    const st = S.steps[S.k];
    if (!st || st.hintShown || S.done) return;
    st.hintShown = true;
    S.score = Math.max(0, S.score - 2);
    $("#hud-score").textContent = S.score;
    renderSteps();
  });
  document.addEventListener("keydown", (e) => {
    if ($("[data-screen=play]").hidden || e.key !== "Enter") return;
    e.preventDefault();
    if (S.done) nextRound(); else check();
  });
  $("#btn-check").addEventListener("click", () => check());
  $("#btn-next").addEventListener("click", nextRound);
  $("#btn-again").addEventListener("click", () => startLevel(S.lv));
  $("#btn-menu").addEventListener("click", () => { G.renderLevels($("#levels"), LEVELS, startLevel); G.showScreen("start"); });

  G.renderLevels($("#levels"), LEVELS, startLevel);
})();
