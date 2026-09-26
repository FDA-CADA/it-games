/* Find the Flipped Bit — parity bit: tính, phát hiện lỗi, giới hạn, và parity 2 chiều. Xem README.md. */
(function () {
  "use strict";
  const { $, el } = G;

  const pop = (v) => { let c = 0; while (v) { c += v & 1; v >>= 1; } return c; };
  const withParity = (d) => (d << 1) | (pop(d) & 1);       // 7 bit dữ liệu + 1 bit parity chẵn
  const flip = (v, k) => v ^ (1 << k);

  const LEVELS = [
    { name: "Tính parity", desc: "Đặt bit parity cho 4 gói tin", kind: "compute", rounds: 4 },
    { name: "Trạm kiểm tra", desc: "Gói nào bị lật bit?", kind: "detect", rounds: 4 },
    { name: "Lỗi 2 bit", desc: "Khi parity bị qua mặt", kind: "twobit", rounds: 4 },
    { name: "Parity 2 chiều", desc: "Không chỉ phát hiện mà còn sửa lỗi", kind: "grid", rounds: 4 },
  ];

  const S = { lv: 0, level: null, round: 0, score: 0, perfect: 0, tried: false, done: false, pk: [], grid: null };

  function startLevel(i) {
    S.lv = i; S.level = LEVELS[i]; S.round = 0; S.score = 0; S.perfect = 0;
    $("#hud-level").textContent = i + 1;
    G.showScreen("play");
    nextRound();
  }

  function nextRound() {
    if (S.round >= S.level.rounds) return finish();
    S.round++; S.tried = false; S.done = false;
    $("#hud-round").textContent = `${S.round}/${S.level.rounds}`;
    $("#hud-score").textContent = S.score;
    const k = S.level.kind;
    $("#btn-check").hidden = k === "grid";
    $("#btn-next").hidden = true;
    if (k === "compute") setupCompute();
    else if (k === "grid") setupGrid();
    else if (k === "twobit" && S.round === 4) setupQuiz();
    else setupDetect(k === "twobit");
  }

  /* ---------- Level 1: tính parity ---------- */
  function setupCompute() {
    $("#mission").innerHTML = "📤 Bạn là bên <b>gửi</b>. Đặt bit parity (viền cam) cho mỗi gói sao cho tổng số bit 1 là <b>số chẵn</b>.";
    S.pk = Array.from({ length: 4 }, () => ({ d: G.randInt(1, 127), p: 0 }));
    renderCompute();
    setFeedback("Đếm số bit 1 trong 7 bit dữ liệu: lẻ thì parity = 1, chẵn thì parity = 0.");
  }

  function renderCompute(showBad = false) {
    const box = $("#packets");
    box.innerHTML = "";
    S.pk.forEach((p, k) => {
      const v = (p.d << 1) | p.p, ok = p.p === (pop(p.d) & 1);
      const row = G.bitRow(v, 8, { onToggle: S.done ? null : (i) => { if (i === 7) { p.p ^= 1; G.sound.play("tick"); renderCompute(); } } });
      box.append(el("div", { class: "packet" + (showBad || S.done ? (ok ? " good" : " bad") : "") }, [
        el("span", { class: "pid", text: `Gói ${k + 1}` }), row,
        el("span", { class: "cnt", text: S.done ? `${pop(v)} bit 1` : "" }),
      ]));
    });
  }

  function checkCompute() {
    const wrong = S.pk.filter((p) => p.p !== (pop(p.d) & 1)).length;
    if (!wrong) {
      S.done = true;
      S.score += 3 * S.pk.length + (S.tried ? 0 : 5);
      if (!S.tried) S.perfect++;
      G.sound.play("good");
      setFeedback("✓ Cả 4 gói đều có số bit 1 chẵn, sẵn sàng gửi đi! <span class=\"detail\">Parity = XOR của 7 bit dữ liệu: XOR ra 1 khi có lẻ bit 1.</span>", "good");
      renderCompute();
      return endRound();
    }
    S.tried = true;
    G.sound.play("bad");
    renderCompute(true);
    setFeedback(`✗ Còn ${wrong} gói có tổng số bit 1 là số lẻ (tô đỏ).`, "bad");
  }

  /* ---------- Level 2, 3: trạm kiểm tra ---------- */
  function setupDetect(twoBit) {
    $("#mission").innerHTML = twoBit
      ? "📥 Trạm nhận. Đánh dấu các gói mà <b>parity báo lỗi</b>. Lần này kênh nhiễu nặng hơn…"
      : "📥 Bạn là bên <b>nhận</b>. Gói nào bị lật bit trên đường truyền? Bấm để đánh dấu ❌ Lỗi.";
    const n = 6;
    // Số bit bị lật của từng gói: 0 = nguyên vẹn
    const ones = twoBit ? G.randInt(1, 2) : G.randInt(1, 3), twos = twoBit ? G.randInt(1, 2) : 0;
    const kinds = G.shuffle([...Array(ones).fill(1), ...Array(twos).fill(2), ...Array(n - ones - twos).fill(0)]);
    S.pk = kinds.slice(0, n).map((flips) => {
      const orig = withParity(G.randInt(1, 127));
      const pos = G.shuffle([0, 1, 2, 3, 4, 5, 6, 7]).slice(0, flips);
      const got = pos.reduce((v, k) => flip(v, k), orig);
      return { orig, got, pos, flips, mark: false };
    });
    renderDetect();
    setFeedback("Đếm số bit 1 của cả 8 bit: nếu lẻ thì gói đã bị lỗi.");
  }

  function renderDetect() {
    const box = $("#packets");
    box.innerHTML = "";
    S.pk.forEach((p, k) => {
      const parityErr = pop(p.got) % 2 === 1;
      const btn = el("button", {
        type: "button", class: "btn sm mark-btn " + (p.mark ? "err" : "ghost"), text: p.mark ? "❌ Lỗi" : "✅ OK", disabled: S.done,
        onclick: () => { p.mark = !p.mark; G.sound.play("tick"); renderDetect(); },
      });
      const cls = S.done ? (p.mark === parityErr ? " good" : " bad") : "";
      const kids = [el("span", { class: "pid", text: `Gói ${k + 1}` }), G.bitRow(p.got, 8, { bad: S.done ? p.pos.map((x) => 7 - x) : [] }),
        el("span", { class: "cnt", text: S.done ? `${pop(p.got)} bit 1` : "" }), btn];
      if (S.done && p.flips) {
        const ob = G.bits(p.orig), flipped = p.pos.map((x) => 7 - x);
        kids.push(el("div", { class: "orig", html: `Gói gốc: ${[...ob].map((b, i) => (flipped.includes(i) ? `<span class="flip">${b}</span>` : b)).join("")} · bị lật ${p.flips} bit`
          + (p.flips === 2 ? " · <b>parity không phát hiện được!</b>" : "") }));
      }
      box.append(el("div", { class: "packet" + cls }, kids));
    });
  }

  function checkDetect() {
    S.done = true;
    let right = 0;
    S.pk.forEach((p) => { if (p.mark === (pop(p.got) % 2 === 1)) right++; });
    const all = right === S.pk.length;
    S.score += 3 * right + (all ? 5 : 0);
    if (all) S.perfect++;
    G.sound.play(all ? "good" : "bad");
    renderDetect();
    const sneaky = S.pk.filter((p) => p.flips === 2).length;
    let msg = all ? `✓ Phân loại đúng cả ${S.pk.length} gói!` : `Đúng ${right}/${S.pk.length} gói. Các bit bị lật được tô đỏ.`;
    if (sneaky) msg += `<span class="detail">⚠️ Có ${sneaky} gói bị lật <b>2 bit</b>: số bit 1 vẫn chẵn nên parity báo "OK", dù dữ liệu đã sai. Parity chỉ phát hiện được khi số bit lỗi là <b>số lẻ</b>.</span>`;
    else if (S.level.kind === "detect") msg += `<span class="detail">Lật 1 bit làm số bit 1 tăng hoặc giảm 1, nên luôn đổi từ chẵn sang lẻ.</span>`;
    setFeedback(msg, all ? "good" : "warn");
    endRound();
  }

  function setupQuiz() {
    $("#mission").innerHTML = "🎓 Qua các vòng vừa rồi: parity chẵn phát hiện được lỗi nào?";
    const box = $("#packets");
    box.innerHTML = "";
    const opts = el("div", { class: "opts" });
    G.shuffle([
      { t: "Khi số bit bị lật là số lẻ (1, 3, 5…)", ok: true },
      { t: "Mọi lỗi, bất kể bao nhiêu bit", ok: false },
      { t: "Chỉ khi bị lật đúng 2 bit", ok: false },
      { t: "Phát hiện và tự sửa được mọi lỗi 1 bit", ok: false },
    ]).forEach((o) => opts.append(el("button", { type: "button", class: "opt", text: o.t, onclick: (e) => {
      if (S.done) return;
      if (!o.ok) { S.tried = true; e.currentTarget.classList.add("wrong"); e.currentTarget.disabled = true; G.sound.play("bad"); setFeedback("✗ Chưa đúng, thử lại.", "bad"); return; }
      S.done = true; e.currentTarget.classList.add("right");
      S.score += S.tried ? 4 : 10; if (!S.tried) S.perfect++;
      G.sound.play("good");
      setFeedback("✓ Đúng! <span class=\"detail\">Parity chỉ biết \"có lỗi\" chứ không biết lỗi ở đâu, nên không sửa được. Muốn sửa thì cần thêm bit kiểm tra: parity 2 chiều (level sau), mã Hamming, hoặc CRC trong mạng máy tính.</span>", "good");
      endRound();
    } })));
    box.append(opts);
    $("#btn-check").hidden = true;
    setFeedback("Chọn một đáp án.");
  }

  /* ---------- Level 4: parity 2 chiều ---------- */
  function setupGrid() {
    const d = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => G.randInt(0, 1)));
    const rp = d.map((r) => r.reduce((a, b) => a ^ b, 0));
    const cp = [0, 1, 2, 3].map((c) => d.reduce((a, r) => a ^ r[c], 0));
    const er = G.randInt(0, 3), ec = G.randInt(0, 3);
    d[er][ec] ^= 1;
    S.grid = { d, rp, cp, er, ec, hint: false, miss: [] };
    $("#mission").innerHTML = "🧮 16 bit dữ liệu được gửi kèm parity của <b>từng hàng</b> (cột phải) và <b>từng cột</b> (hàng dưới). Một bit đã bị lật. <b>Bấm vào ô bị lật để sửa.</b>";
    renderGrid();
    setFeedback("Tìm hàng có tổng bit 1 lẻ và cột có tổng bit 1 lẻ. Giao điểm của chúng là ô bị lỗi.");
  }

  function renderGrid() {
    const g = S.grid, box = $("#packets");
    box.innerHTML = "";
    const grid = el("div", { class: "grid2d" });
    const oddRow = (r) => (g.d[r].reduce((a, b) => a + b, 0) + g.rp[r]) % 2 === 1;
    const oddCol = (c) => (g.d.reduce((a, r) => a + r[c], 0) + g.cp[c]) % 2 === 1;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const v = g.d[r][c], fixed = S.done && r === g.er && c === g.ec;
        grid.append(el(S.done ? "span" : "button", {
          type: S.done ? null : "button", class: "cell" + (v ? " one" : "") + (fixed ? " fixed" : "") + (g.miss.includes(r * 4 + c) ? " miss" : ""), text: v,
          onclick: S.done ? null : () => pickCell(r, c),
        }));
      }
      grid.append(el("span", { class: "cell par" + (g.hint && oddRow(r) ? " odd" : ""), text: g.rp[r], title: "Parity hàng" }));
    }
    for (let c = 0; c < 4; c++) grid.append(el("span", { class: "cell par" + (g.hint && oddCol(c) ? " odd" : ""), text: g.cp[c], title: "Parity cột" }));
    grid.append(el("span", { class: "cell corner" }));
    box.append(grid);
  }

  function pickCell(r, c) {
    const g = S.grid;
    if (r === g.er && c === g.ec) {
      S.done = true;
      g.d[r][c] ^= 1;
      S.score += S.tried ? 4 : 10; if (!S.tried) S.perfect++;
      G.sound.play("good");
      setFeedback(`✓ Tìm và sửa đúng bit ở hàng ${r + 1}, cột ${c + 1}! <span class="detail">Hàng lẻ cho biết lỗi ở hàng nào, cột lẻ cho biết cột nào. Chỉ với 8 bit kiểm tra mà sửa được mọi lỗi 1 bit trong 16 bit. Mã QR và RAM ECC dùng ý tưởng tương tự (nhưng mạnh hơn).</span>`, "good");
      renderGrid();
      return endRound();
    }
    S.tried = true;
    g.miss.push(r * 4 + c);
    g.hint = true;
    G.sound.play("bad");
    setFeedback("✗ Không phải ô đó. Các hàng và cột có tổng số bit 1 lẻ đã được khoanh đỏ ở ô parity.", "bad");
    renderGrid();
  }

  /* ---------- Chung ---------- */
  function endRound() {
    $("#hud-score").textContent = S.score;
    $("#btn-check").hidden = true;
    $("#btn-next").hidden = false;
    $("#btn-next").focus();
  }

  function check() {
    if (S.done) return;
    const k = S.level.kind;
    if (k === "compute") checkCompute();
    else if (k === "detect" || (k === "twobit" && S.round < 4)) checkDetect();
  }

  function finish() {
    const { isNew } = G.progress.record("find-flipped-bit", S.lv, S.score, LEVELS.length);
    G.showScreen("end");
    $("#end-score").textContent = S.score;
    const all = S.perfect === S.level.rounds;
    $("#end-title").textContent = all ? "Thám tử kênh truyền! 🎉" : "Hoàn thành level!";
    $("#end-detail").textContent = `${S.perfect}/${S.level.rounds} vòng hoàn hảo.` + (isNew ? " Kỷ lục mới!" : "");
    if (all) { G.confetti(); G.sound.play("win"); }
    G.mountNextLink($("#next-game"));
  }

  function setFeedback(html, type = "") {
    const f = $("#feedback");
    f.className = "feedback " + type;
    f.innerHTML = html;
  }

  document.addEventListener("keydown", (e) => {
    if ($("[data-screen=play]").hidden || e.key !== "Enter") return;
    e.preventDefault();
    if (S.done) nextRound(); else check();
  });
  $("#btn-check").addEventListener("click", check);
  $("#btn-next").addEventListener("click", nextRound);
  $("#btn-again").addEventListener("click", () => startLevel(S.lv));
  $("#btn-menu").addEventListener("click", () => { G.renderLevels($("#levels"), LEVELS, startLevel); G.showScreen("start"); });

  G.renderLevels($("#levels"), LEVELS, startLevel);
})();
