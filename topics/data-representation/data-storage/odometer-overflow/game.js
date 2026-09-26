/* Odometer Overflow — số nguyên không dấu n bit quay vòng mod 2^n. Xem README.md. */
(function () {
  "use strict";
  const { $, el } = G;

  const LEVELS = [
    { name: "Đặt cược 4-bit", desc: "Chọn 1 trong 4 dự đoán", ns: [4], ops: ["+"], mode: "mc", rounds: 6, first: [11, 9] },
    { name: "Tự gõ 4-bit", desc: "Gõ số đồng hồ sẽ hiện", ns: [4], ops: ["+"], mode: "type", rounds: 6 },
    { name: "Một byte", desc: "Đồng hồ 8-bit (0–255)", ns: [8], ops: ["+"], mode: "type", rounds: 6 },
    { name: "Chạy lùi", desc: "Phép trừ: 3 − 5 ra bao nhiêu?", ns: [4, 8], ops: ["-"], mode: "type", rounds: 6, first: [3, 5] },
    { name: "Hỗn hợp", desc: "Cộng, trừ, 4 và 8 bit", ns: [4, 8], ops: ["+", "-"], mode: "type", rounds: 8 },
  ];
  const ERR = "err";

  const S = { lv: 0, level: null, round: 0, score: 0, streak: 0, wins: 0, n: 4, a: 0, b: 0, op: "+", bet: null, running: false, done: false };
  const M = () => 2 ** S.n;
  const result = () => (((S.op === "+" ? S.a + S.b : S.a - S.b) % M()) + M()) % M();
  const trueVal = () => (S.op === "+" ? S.a + S.b : S.a - S.b);

  function startLevel(i) {
    S.lv = i; S.level = LEVELS[i]; S.round = 0; S.score = 0; S.streak = 0; S.wins = 0;
    $("#hud-level").textContent = i + 1;
    G.showScreen("play");
    nextRound();
  }

  function makeProblem() {
    S.n = G.pick(S.level.ns);
    S.op = G.pick(S.level.ops);
    const max = M() - 1;
    if (S.round === 1 && S.level.first) {
      [S.a, S.b] = S.level.first; S.n = 4; return;
    }
    const overflow = Math.random() < 0.65;
    if (S.op === "+") {
      if (overflow) { S.a = G.randInt(Math.ceil(max / 2), max); S.b = G.randInt(max - S.a + 1, max); }
      else { S.a = G.randInt(1, max - 1); S.b = G.randInt(1, max - S.a); }
    } else {
      if (overflow) { S.a = G.randInt(0, Math.floor(max / 2)); S.b = G.randInt(S.a + 1, max); }
      else { S.a = G.randInt(2, max); S.b = G.randInt(1, S.a); }
    }
  }

  function nextRound() {
    if (S.round >= S.level.rounds) return finish();
    S.round++; S.bet = null; S.done = false; S.running = false;
    makeProblem();
    $("#hud-round").textContent = `${S.round}/${S.level.rounds}`;
    $("#hud-score").textContent = S.score;
    $("#hud-streak").textContent = S.streak;
    const verb = S.op === "+" ? "chạy thêm" : "lùi lại";
    $("#task").innerHTML = `Đồng hồ <b>${S.n}-bit</b> đang ở <span class="num">${S.a}</span>, xe ${verb} <span class="num">${S.b}</span> km`
      + `<div class="muted" style="font-size:.95rem;font-weight:500">${S.a} ${S.op === "+" ? "+" : "−"} ${S.b} = ? (đồng hồ chỉ đếm được 0 … ${M() - 1})</div>`;
    buildOdo();
    setOdo(S.a, false);
    $("#carry").classList.remove("on");
    const car = $("#car");
    car.style.transition = "none"; car.style.left = S.op === "+" ? "0%" : "90%";
    car.classList.toggle("fwd", S.op === "+");
    $("#bet").hidden = false;
    $("#btn-go").disabled = false;
    $("#btn-next").hidden = true;
    const mc = S.level.mode === "mc";
    $("#opts").hidden = !mc;
    $("#typed").hidden = mc;
    if (mc) buildOpts();
    else { $("#guess").value = ""; $("#btn-error").classList.remove("sel"); $("#guess").focus(); }
    setFeedback("Đặt cược xong thì bấm <b>🏁 Cho xe chạy</b>.");
  }

  function buildOdo() {
    const box = $("#odo");
    box.innerHTML = "";
    for (let i = 0; i < S.n; i++) box.append(el("div", { class: "drum" }, el("span", { text: "0" })));
  }

  function setOdo(v, animate = true) {
    const bits = G.bits(v, S.n);
    G.$$(".drum", $("#odo")).forEach((d, i) => {
      const sp = $("span", d);
      if (sp.textContent !== bits[i]) {
        sp.textContent = bits[i];
        if (animate) { d.classList.remove("roll"); void d.offsetWidth; d.classList.add("roll"); }
      }
    });
    $("#odo-dec").textContent = v;
  }

  function buildOpts() {
    const r = result(), t = trueVal(), max = M() - 1;
    const cands = [
      { v: r }, { v: t, note: "toán học" },
      S.op === "+" ? { v: max, note: "kẹt ở max" } : { v: 0, note: "kẹt ở 0" },
      { v: ERR }, { v: (r + 1) % M() }, { v: Math.abs(t) % M() },
    ];
    const seen = new Set(), opts = [];
    for (const c of cands) if (!seen.has(c.v) && opts.length < 4) { seen.add(c.v); opts.push(c); }
    const box = $("#opts");
    box.innerHTML = "";
    G.shuffle(opts).forEach((o) => box.append(el("button", {
      type: "button", class: "opt", "data-v": o.v,
      html: o.v === ERR ? `<span>⚠️</span><small>Máy báo lỗi</small>` : `<span class="mono">${o.v}</span>`,
      onclick: (e) => { if (S.running || S.done) return; G.$$(".opt").forEach((b) => b.classList.remove("sel")); e.currentTarget.classList.add("sel"); S.bet = o.v; G.sound.play("tick"); },
    })));
  }

  async function go() {
    if (S.running || S.done) return;
    if (S.level.mode === "type") {
      const raw = $("#guess").value.trim().replace(/[−–]/g, "-");
      if ($("#btn-error").classList.contains("sel") && !raw) S.bet = ERR;
      else if (/^-?\d+$/.test(raw)) S.bet = parseInt(raw, 10);
      else S.bet = null;
    }
    if (S.bet == null) { setFeedback("Bạn chưa đặt cược!", "warn"); G.shake($("#bet")); return; }
    S.running = true;
    $("#btn-go").disabled = true;
    setFeedback(`Xe đang chạy… 🚗💨`);
    const dir = S.op === "+" ? 1 : -1;
    const delay = Math.max(20, Math.min(220, 2600 / S.b));
    const car = $("#car");
    car.style.transition = `left ${delay / 1000}s linear`;
    let v = S.a;
    for (let k = 1; k <= S.b; k++) {
      const nv = (v + dir + M()) % M();
      if ((dir > 0 && nv === 0) || (dir < 0 && v === 0)) {
        $("#carry").classList.add("on");
        G.toast(dir > 0 ? `🔄 ${"1".repeat(S.n)} → ${"0".repeat(S.n)}: bit nhớ rơi mất!` : `🔄 ${"0".repeat(S.n)} → ${"1".repeat(S.n)}: phải "mượn" từ hư không!`, "bad", 1800);
        G.sound.play("bad");
      } else if (S.b <= 30) G.sound.play("tick");
      v = nv;
      setOdo(v);
      car.style.left = (dir > 0 ? (k / S.b) * 90 : 90 - (k / S.b) * 90) + "%";
      await G.wait(delay);
    }
    S.running = false;
    reveal();
  }

  function reveal() {
    S.done = true;
    const r = result(), t = trueVal(), right = S.bet === r;
    const wrapped = t !== r;
    if (right) { S.streak++; S.wins++; S.score += 10 + 2 * (S.streak - 1); G.sound.play("good"); }
    else { S.streak = 0; G.sound.play("bad"); }
    $("#hud-score").textContent = S.score;
    $("#hud-streak").textContent = S.streak;
    G.$$(".opt").forEach((b) => { if (b.dataset.v === String(r)) b.classList.add("right"); });

    const sign = S.op === "+" ? "+" : "−";
    let why;
    if (!wrapped) why = `${S.a} ${sign} ${S.b} = ${t} vẫn nằm trong 0 … ${M() - 1}, không tràn.`;
    else if (S.op === "+") why = `${S.a} + ${S.b} = ${t} > ${M() - 1}. Cần bit thứ ${S.n + 1} (giá trị ${M()}) nhưng đồng hồ chỉ có ${S.n} bit, nên bit đó rơi mất: ${t} − ${M()} = <b>${r}</b>.`
      + `<br><span class="mono">&nbsp;&nbsp;${G.bits(S.a, S.n)}<br>+ ${G.bits(S.b, S.n)}<br>= <s>1</s>${G.bits(r, S.n)}</span>`;
    else why = `${S.a} − ${S.b} = ${t} < 0. Đồng hồ không có số âm nên lùi qua 0 thì quay về ${M() - 1}: ${t} + ${M()} = <b>${r}</b>.`;
    let extra = "";
    if (S.bet === ERR) extra = "<br>Máy tính <b>không báo lỗi</b> khi phép cộng số không dấu bị tràn. Nó lặng lẽ quay vòng, nên bug tràn số rất khó phát hiện.";
    else if (!right && S.bet === t) extra = "<br>Đó là đáp án của toán học, nhưng đồng hồ không có chỗ chứa nó.";
    setFeedback(`${right ? "✓ Thắng cược!" : "✗ Thua cược."} Đồng hồ hiện <b>${r}</b>.<span class="detail">${why}${extra}</span>`, right ? "good" : "bad");
    $("#bet").hidden = true;
    $("#btn-next").hidden = false;
    $("#btn-next").focus();
  }

  function finish() {
    const { isNew } = G.progress.record("odometer-overflow", S.lv, S.score, LEVELS.length);
    G.showScreen("end");
    $("#end-score").textContent = S.score;
    const all = S.wins === S.level.rounds;
    $("#end-title").textContent = all ? "Thần cược overflow! 🎉" : "Hoàn thành level!";
    $("#end-detail").textContent = `Thắng ${S.wins}/${S.level.rounds} lần cược.` + (isNew ? " Kỷ lục mới!" : "");
    if (all) { G.confetti(); G.sound.play("win"); }
    G.mountNextLink($("#next-game"));
  }

  function setFeedback(html, type = "") {
    const f = $("#feedback");
    f.className = "feedback " + type;
    f.innerHTML = html;
  }

  $("#btn-error").addEventListener("click", (e) => { e.currentTarget.classList.toggle("sel"); if (e.currentTarget.classList.contains("sel")) $("#guess").value = ""; });
  $("#guess").addEventListener("input", () => $("#btn-error").classList.remove("sel"));
  document.addEventListener("keydown", (e) => {
    if ($("[data-screen=play]").hidden || e.key !== "Enter" || S.running) return;
    e.preventDefault();
    if (S.done) nextRound(); else go();
  });
  $("#btn-go").addEventListener("click", go);
  $("#btn-next").addEventListener("click", nextRound);
  $("#btn-again").addEventListener("click", () => startLevel(S.lv));
  $("#btn-menu").addEventListener("click", () => { G.renderLevels($("#levels"), LEVELS, startLevel); G.showScreen("start"); });

  G.renderLevels($("#levels"), LEVELS, startLevel);
})();
