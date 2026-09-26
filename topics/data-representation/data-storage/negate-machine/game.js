/* Negate Machine — đổi dấu trong two's complement: Invert rồi +1. Xem README.md. */
(function () {
  "use strict";
  const { $, el, L } = G;

  const OPS = {
    inv: { name: "Invert", sub: L("đảo mọi bit", "flip every bit"), f: (u) => u ^ 0xff },
    inc: { name: "+1", sub: L("cộng 1", "add 1"), f: (u) => (u + 1) & 0xff },
    dec: { name: "−1", sub: L("trừ 1", "subtract 1"), f: (u) => (u + 255) & 0xff },
    sgn: { name: L("Lật bit dấu", "Flip sign bit"), sub: L("chỉ đảo bit đầu", "flip the first bit only"), f: (u) => u ^ 0x80 },
  };
  const LEVELS = [
    { name: L("Lắp máy", "Build it"), desc: L("Chọn đúng trạm, đúng thứ tự", "Right stations, right order"), kind: "build", rounds: 5 },
    { name: L("Tự vận hành", "Run by hand"), desc: L("Tự bấm từng bit, 30 giây/vòng", "Click every bit yourself, 30 s/round"), kind: "manual", rounds: 5, time: 30 },
    { name: L("Giải mã ngược", "Decode"), desc: L("11110110 là số mấy? 20 giây/câu", "What is 11110110? 20 s/question"), kind: "decode", rounds: 6, time: 20 },
    { name: L("Tổng lực 90 giây", "90-second all-out"), desc: L("Giải mã và mã hóa, càng nhiều càng tốt", "Decode and encode as many as you can"), kind: "blitz", time: 90 },
  ];

  const S = { lv: 0, level: null, round: 0, score: 0, correct: 0, streak: 0, done: false, timer: null,
    inU: 0, target: 0, pipe: [], tried: false, running: false, stage: 0, cur: 0, task: null };

  const sval = (u) => G.signed(G.bits(u));
  const fmt = (n) => (n < 0 ? "−" + -n : String(n));
  const u8 = (n) => ((n % 256) + 256) % 256;

  function startLevel(i) {
    S.lv = i; S.level = LEVELS[i]; S.round = 0; S.score = 0; S.correct = 0; S.streak = 0;
    $("#hud-level").textContent = i + 1;
    ["build", "manual", "type"].forEach((p) => { $("#p-" + p).hidden = true; });
    const kind = S.level.kind;
    $("#p-" + (kind === "decode" || kind === "blitz" ? "type" : kind)).hidden = false;
    $("#hud-round-wrap").hidden = kind === "blitz";
    $("#hud-time-wrap").hidden = !S.level.time;
    $("#timer-bar").hidden = !S.level.time;
    G.showScreen("play");
    if (kind === "blitz") {
      S.timer && S.timer.stop();
      S.timer = new G.Timer(S.level.time, tick, () => finish()).start();
    }
    nextRound();
  }

  function tick(left, ratio) { $("#hud-time").textContent = Math.ceil(left); G.renderTimerBar($("#timer-bar"), ratio); }

  function nextRound() {
    const kind = S.level.kind;
    if (kind !== "blitz" && S.round >= S.level.rounds) return finish();
    S.round++; S.done = false; S.tried = false;
    $("#hud-round").textContent = `${S.round}/${S.level.rounds}`;
    $("#hud-score").textContent = S.score;
    $("#btn-next").hidden = true;
    $("#btn-action").hidden = false;
    if (kind === "build") roundBuild();
    else if (kind === "manual") roundManual();
    else roundType();
    if (kind === "manual" || kind === "decode") {
      S.timer && S.timer.stop();
      S.timer = new G.Timer(S.level.time, tick, timeUp).start();
    }
  }

  /* ================= Level 1: lắp máy ================= */
  function roundBuild() {
    let x;
    if (S.round === 4) { x = -G.randInt(5, 100); }      // đầu vào âm: máy vẫn chạy được
    else if (S.round === 5) x = 0;                        // trường hợp đặc biệt
    else x = G.randInt(3, 100);
    S.inU = u8(x); S.target = u8(-x); S.pipe = [];
    $("#task").innerHTML = L(`Biến <span class="num">${fmt(x)}</span> thành <span class="num">${fmt(-x)}</span>`, `Turn <span class="num">${fmt(x)}</span> into <span class="num">${fmt(-x)}</span>`)
      + (S.round === 4 ? `<div class="muted" style="font-weight:500;font-size:.9rem">${L("Đầu vào là số âm. Máy cũ còn dùng được không?", "The input is negative. Does the same machine still work?")}</div>` : "")
      + (S.round === 5 ? `<div class="muted" style="font-weight:500;font-size:.9rem">${L("−0 = 0. Máy có giữ đúng như vậy không?", "−0 = 0. Does the machine keep it that way?")}</div>` : "");
    $("#trace").innerHTML = "";
    const st = $("#stations");
    st.innerHTML = "";
    G.shuffle(Object.keys(OPS)).forEach((k) => st.append(el("button", {
      type: "button", class: "station", html: `${OPS[k].name}<small>${OPS[k].sub}</small>`,
      onclick: () => { if (S.running || S.done || S.pipe.length >= 3) return; S.pipe.push(k); G.sound.play("tick"); renderBelt(); },
    })));
    $("#btn-action").textContent = L("▶ Chạy", "▶ Run");
    setFeedback(L("Lắp các trạm lên băng chuyền rồi bấm <b>▶ Chạy</b>.", "Put stations on the belt, then press <b>▶ Run</b>."));
    renderBelt();
  }

  function renderBelt(outU = null) {
    const belt = $("#belt");
    belt.innerHTML = "";
    belt.append(el("div", { class: "io", html: `${G.bits(S.inU)}<small>${L("vào", "in")}: ${fmt(sval(S.inU))}</small>` }));
    belt.append(el("span", { class: "arrow", text: "→" }));
    if (!S.pipe.length) belt.append(el("span", { class: "empty", text: L("(chưa có trạm)", "(no stations yet)") }));
    S.pipe.forEach((k, i) => {
      belt.append(el("button", {
        type: "button", class: "station", "data-i": i, html: `${OPS[k].name}<small>${L("bấm để gỡ", "tap to remove")}</small>`,
        onclick: () => { if (S.running || S.done) return; S.pipe.splice(i, 1); renderBelt(); },
      }));
      belt.append(el("span", { class: "arrow", text: "→" }));
    });
    belt.append(el("div", { class: "io", html: outU == null ? `????????<small>ra</small>` : `${G.bits(outU)}<small>ra: ${fmt(sval(outU))}</small>` }));
  }

  async function runBuild() {
    if (S.running || S.done) return;
    if (!S.pipe.length) { setFeedback(L("Băng chuyền đang trống!", "The belt is empty!"), "warn"); return; }
    S.running = true;
    let u = S.inU;
    const parts = [G.bits(u)];
    renderBelt();
    for (let i = 0; i < S.pipe.length; i++) {
      const k = S.pipe[i];
      $(`#belt .station[data-i="${i}"]`).classList.add("active");
      G.sound.play("tick");
      await G.wait(450);
      u = OPS[k].f(u);
      parts.push(`<span class="muted">→${OPS[k].name}→</span> ${G.bits(u)}`);
      $("#trace").innerHTML = parts.join(" ");
    }
    renderBelt(u);
    S.running = false;
    const ok = u === S.target;
    $("#trace").innerHTML = parts.join(" ") + ` = <span class="${ok ? "ok" : "no"}">${fmt(sval(u))}</span>`;
    if (ok) {
      S.done = true;
      const gained = S.tried ? 4 : 10;
      S.score += gained; if (!S.tried) S.correct++;
      $("#hud-score").textContent = S.score;
      G.sound.play("good");
      const alt = S.pipe.join() === "dec,inv" ? L(" Cách khác cũng đúng: trừ 1 rồi mới đảo bit!", " Another valid way: subtract 1, then flip the bits!") : "";
      let extra = "";
      if (S.round === 4) extra = L(" Cùng một máy vừa đổi dương thành âm, vừa đổi âm thành dương: đổi dấu hai lần là về chỗ cũ.", " The same machine turns positives into negatives and negatives into positives: negating twice brings you back.");
      if (S.round === 5) extra = L(" 11111111 + 1 = <s>1</s>00000000: bit nhớ rơi mất, nên −0 vẫn là 0. Two's complement chỉ có một số 0.", " 11111111 + 1 = <s>1</s>00000000: the carry falls off, so −0 is still 0. Two's complement has only one zero.");
      setFeedback(`✓ ${L("Máy chạy đúng!", "The machine works!")} +${gained}.${alt}${extra}`, "good");
      $("#btn-action").hidden = true;
      $("#btn-next").hidden = false;
      $("#btn-next").focus();
    } else {
      S.tried = true;
      G.sound.play("bad");
      let why = L(`Máy ra ${fmt(sval(u))}, nhưng cần ${fmt(sval(S.target))}.`, `The machine produced ${fmt(sval(u))}, but ${fmt(sval(S.target))} is needed.`);
      if (u === (S.inU ^ 0x80)) why += L(" Chỉ lật bit dấu là cách của <b>sign-and-magnitude</b>, không dùng được với two's complement.", " Flipping only the sign bit is the <b>sign-and-magnitude</b> way, and it does not work in two's complement.");
      else if (u === (S.inU ^ 0xff)) why += L(" Chỉ đảo bit mới ra <b>one's complement</b> (luôn thiếu 1 so với đáp án).", " Flipping the bits alone gives <b>one's complement</b> (always 1 short of the answer).");
      else if (S.pipe.join() === "inc,inv") why += L(" Thứ tự sai: phải đảo bit <b>trước</b>, cộng 1 <b>sau</b>.", " Wrong order: flip the bits <b>first</b>, add 1 <b>after</b>.");
      setFeedback(`✗ ${why} ${L("Sửa băng chuyền rồi chạy lại.", "Fix the belt and run again.")}`, "bad");
    }
  }

  /* ================= Level 2: tự vận hành ================= */
  function roundManual() {
    const x = G.randInt(1, 127);
    S.inU = x; S.target = u8(-x); S.stage = 1; S.cur = x;
    $("#task").innerHTML = L(`Tự tay biến <span class="num">${x}</span> thành <span class="num">−${x}</span>`, `By hand, turn <span class="num">${x}</span> into <span class="num">−${x}</span>`);
    $("#manual-trace").innerHTML = `${L("Vào", "In")}: ${G.bits(x)} = ${x}`;
    renderManual();
  }

  function renderManual(errs = []) {
    $("#stage-label").innerHTML = S.stage === 1
      ? L(`<span class="pill">Trạm 1: Invert</span> bấm để đảo <b>từng</b> bit`, `<span class="pill">Station 1: Invert</span> click to flip <b>each</b> bit`)
      : L(`<span class="pill done">✓ Invert</span><span class="pill">Trạm 2: +1</span> bấm các bit để ra kết quả cộng 1`, `<span class="pill done">✓ Invert</span><span class="pill">Station 2: +1</span> click bits to make the result of adding 1`);
    const box = $("#manual-byte");
    box.innerHTML = "";
    [...G.bits(S.cur)].forEach((b, i) => box.append(el("button", {
      type: "button", class: "b" + (b === "1" ? " one" : "") + (errs.includes(i) ? " err" : ""), text: b, "aria-label": `Bit ${7 - i}`,
      onclick: () => { if (S.done) return; S.cur ^= 1 << (7 - i); G.sound.play("tick"); renderManual(); },
    })));
    $("#btn-action").textContent = S.stage === 1 ? L("Xong trạm Invert →", "Invert done →") : L("Xong trạm +1 ✓", "+1 done ✓");
  }

  function checkManual() {
    if (S.done) return;
    const want = S.stage === 1 ? S.inU ^ 0xff : S.target;
    if (S.cur === want) {
      G.sound.play("good");
      if (S.stage === 1) {
        S.stage = 2;
        $("#manual-trace").innerHTML += ` <span class="muted">→Invert→</span> ${G.bits(want)}`;
        setFeedback(L("✓ Đảo bit xong. Giờ cộng 1: bắt đầu từ bit phải nhất, gặp 1 thì thành 0 và nhớ sang trái, gặp 0 thì thành 1 và dừng.", "✓ Bits flipped. Now add 1: start at the rightmost bit; a 1 becomes 0 and carries left, a 0 becomes 1 and you stop."), "good");
        renderManual();
        return;
      }
      S.done = true;
      S.timer.stop();
      const gained = 10 + Math.ceil(S.timer.left);
      S.score += gained; S.correct++;
      $("#hud-score").textContent = S.score;
      $("#manual-trace").innerHTML += ` <span class="muted">→+1→</span> ${G.bits(want)} = <span class="ok">−${S.inU}</span>`;
      setFeedback(`✓ ${L("Máy chạy chuẩn!", "Perfect run!")} +${gained}`, "good");
      $("#btn-action").hidden = true;
      $("#btn-next").hidden = false;
      $("#btn-next").focus();
    } else {
      const got = G.bits(S.cur), w = G.bits(want);
      const errs = [...got].map((b, i) => (b !== w[i] ? i : -1)).filter((i) => i >= 0);
      G.sound.play("bad");
      renderManual(errs);
      setFeedback(S.stage === 1 ? L(`✗ Còn ${errs.length} bit chưa đảo đúng (tô đỏ). Invert là đảo <b>tất cả</b> 8 bit.`, `✗ ${errs.length} bits are not flipped correctly (in red). Invert flips <b>all</b> 8 bits.`)
        : L(`✗ Kết quả cộng 1 chưa đúng ở ${errs.length} bit (tô đỏ). Nhớ xử lý phần nhớ từ phải sang trái.`, `✗ The +1 result is wrong in ${errs.length} bits (in red). Handle the carries from right to left.`), "bad");
    }
  }

  /* ================= Level 3, 4: nhập đáp án ================= */
  function roundType() {
    const blitz = S.level.kind === "blitz";
    const encode = blitz && Math.random() < 0.5;
    let u;
    if (!blitz && S.round === 1) u = 0b11110110;
    else if (Math.random() < 0.75) u = G.randInt(128, 255);
    else u = G.randInt(1, 127);
    const inp = $("#answer");
    inp.value = "";
    if (encode) {
      const x = -G.randInt(1, 128);
      S.task = { type: "enc", x, want: G.bits(x) };
      $("#task").innerHTML = L(`Viết <span class="num">${fmt(x)}</span> dạng two's complement 8 bit`, `Write <span class="num">${fmt(x)}</span> in 8-bit two's complement`);
      $("#type-byte").innerHTML = "";
      inp.placeholder = L("8 bit, vd 11110110", "8 bits, e.g. 11110110"); inp.maxLength = 8; inp.inputMode = "numeric";
    } else {
      S.task = { type: "dec", u, want: sval(u) };
      $("#task").innerHTML = L("Pattern two's complement này là số thập phân nào?", "Which decimal number is this two's complement pattern?");
      $("#type-byte").innerHTML = "";
      [...G.bits(u)].forEach((b) => $("#type-byte").append(el("span", { class: "b" + (b === "1" ? " one" : ""), text: b })));
      inp.placeholder = L("vd −10", "e.g. −10"); inp.maxLength = 5; inp.inputMode = "text";
    }
    $("#btn-action").textContent = L("Kiểm tra", "Check");
    setFeedback(S.task.type === "dec" ? L("Bit đầu là 1 thì số âm: chạy qua máy (Invert, +1) để tìm độ lớn.", "A leading 1 means negative: run it through the machine (Invert, +1) to find the magnitude.") : L("Viết +x dạng nhị phân, rồi Invert và +1.", "Write +x in binary, then Invert and +1."));
    inp.focus();
  }

  function checkType() {
    if (S.done) return;
    const raw = $("#answer").value.trim().replace(/[−–]/g, "-");
    const t = S.task;
    let ok, why;
    if (t.type === "dec") {
      if (!/^-?\d+$/.test(raw)) { setFeedback(L("Hãy gõ một số nguyên, ví dụ −10.", "Type an integer, e.g. −10."), "warn"); return; }
      const v = parseInt(raw, 10);
      ok = v === t.want;
      const b = G.bits(t.u);
      if (b[0] === "0") why = L(`Bit đầu là 0 nên là số dương: ${b} = ${t.want}.`, `The first bit is 0, so it is positive: ${b} = ${t.want}.`);
      else {
        const inv = t.u ^ 0xff, mag = (inv + 1) & 0xff;
        why = L(`Bit đầu 1 → số âm. Invert: ${G.bits(inv)}, +1: ${G.bits(mag)} = ${mag} → <b>${fmt(t.want)}</b>.`, `First bit 1 → negative. Invert: ${G.bits(inv)}, +1: ${G.bits(mag)} = ${mag} → <b>${fmt(t.want)}</b>.`)
          + (v === t.u ? L(" (Bạn đã đọc như số unsigned.)", " (You read it as unsigned.)") : v === -(t.u & 0x7f) ? L(" (Bạn đã đọc theo sign-and-magnitude.)", " (You read it as sign-and-magnitude.)") : "");
      }
    } else {
      if (!/^[01]{8}$/.test(raw)) { setFeedback(L("Hãy gõ đúng 8 bit 0/1.", "Type exactly 8 bits of 0/1."), "warn"); return; }
      ok = raw === t.want;
      const pos = G.bits(-t.x), inv = G.bits(-t.x ^ 0xff);
      why = t.x === -128 ? L("−128 = 10000000 (đặc biệt: +128 không có trong 8 bit, nhưng −128 thì có).", "−128 = 10000000 (special: +128 does not fit in 8 bits, but −128 does).")
        : `+${-t.x} = ${pos}, Invert: ${inv}, +1: <b>${t.want}</b>.`;
    }
    S.done = true;
    if (S.level.kind !== "blitz") S.timer.stop();
    if (ok) {
      S.streak++;
      const gained = S.level.kind === "blitz" ? 10 + 2 * (S.streak - 1) : 10 + Math.ceil(S.timer.left);
      S.score += gained; S.correct++;
      G.sound.play("good");
      setFeedback(`✓ ${L("Đúng!", "Correct!")} +${gained} <span class="detail">${why}</span>`, "good");
    } else {
      S.streak = 0;
      G.sound.play("bad");
      setFeedback(`✗ ${L("Chưa đúng.", "Not quite.")} <span class="detail">${why}</span>`, "bad");
    }
    $("#hud-score").textContent = S.score;
    $("#btn-action").hidden = true;
    $("#btn-next").hidden = false;
    $("#btn-next").focus();
  }

  function timeUp() {
    if (S.done) return;
    S.done = true;
    G.sound.play("bad");
    if (S.level.kind === "manual") setFeedback(`⏰ ${L("Hết giờ! Đáp án:", "Time's up! Answer:")} ${G.bits(S.inU)} → Invert → ${G.bits(S.inU ^ 0xff)} → +1 → <b>${G.bits(S.target)}</b>`, "bad");
    else setFeedback(`⏰ ${L("Hết giờ!", "Time's up!")} ${G.bits(S.task.u)} = <b>${fmt(S.task.want)}</b>`, "bad");
    $("#btn-action").hidden = true;
    $("#btn-next").hidden = false;
    $("#btn-next").focus();
  }

  /* ================= Chung ================= */
  function action() {
    const k = S.level.kind;
    if (k === "build") runBuild();
    else if (k === "manual") checkManual();
    else checkType();
  }

  function finish() {
    S.timer && S.timer.stop();
    const { isNew } = G.progress.record("negate-machine", S.lv, S.score, LEVELS.length);
    G.showScreen("end");
    $("#end-score").textContent = S.score;
    const blitz = S.level.kind === "blitz";
    const all = !blitz && S.correct === S.level.rounds;
    $("#end-title").textContent = blitz ? L("Hết 90 giây!", "90 seconds up!") : all ? L("Kỹ sư băng chuyền! 🎉", "Conveyor engineer! 🎉") : L("Hoàn thành level!", "Level complete!");
    $("#end-detail").textContent = (blitz ? L(`Làm đúng ${S.correct} câu.`, `${S.correct} correct answers.`) : L(`Đúng ngay lần đầu ${S.correct}/${S.level.rounds} vòng.`, `${S.correct}/${S.level.rounds} rounds right on the first try.`)) + (isNew ? L(" Kỷ lục mới!", " New best!") : "");
    if (all || (blitz && S.correct >= 10)) { G.confetti(); G.sound.play("win"); }
    G.mountNextLink($("#next-game"));
  }

  function setFeedback(html, type = "") {
    const f = $("#feedback");
    f.className = "feedback " + type;
    f.innerHTML = html;
  }

  document.addEventListener("keydown", (e) => {
    if ($("[data-screen=play]").hidden || e.key !== "Enter" || S.running) return;
    e.preventDefault();
    if (S.done) nextRound(); else action();
  });
  $("#btn-action").addEventListener("click", action);
  $("#btn-next").addEventListener("click", nextRound);
  $("#btn-again").addEventListener("click", () => startLevel(S.lv));
  $("#btn-menu").addEventListener("click", () => { S.timer && S.timer.stop(); G.renderLevels($("#levels"), LEVELS, startLevel); G.showScreen("start"); });

  G.renderLevels($("#levels"), LEVELS, startLevel);
})();
