/* Find the Flipped Bit — parity bit: tính, phát hiện lỗi, giới hạn, và parity 2 chiều. Xem README.md. */
(function () {
  "use strict";
  const { $, el, L } = G;

  const T = { pk: L("Gói", "Packet") };
  const pop = (v) => { let c = 0; while (v) { c += v & 1; v >>= 1; } return c; };
  const withParity = (d) => (d << 1) | (pop(d) & 1);       // 7 bit dữ liệu + 1 bit parity chẵn
  const flip = (v, k) => v ^ (1 << k);

  const LEVELS = [
    { name: L("Tính parity", "Compute parity"), desc: L("Đặt bit parity cho 4 gói tin", "Set the parity bit of 4 packets"), kind: "compute", rounds: 4 },
    { name: L("Trạm kiểm tra", "Checkpoint"), desc: L("Gói nào bị lật bit?", "Which packets have flipped bits?"), kind: "detect", rounds: 4 },
    { name: L("Lỗi 2 bit", "2-bit errors"), desc: L("Khi parity bị qua mặt", "When parity gets fooled"), kind: "twobit", rounds: 4 },
    { name: L("Parity 2 chiều", "2D parity"), desc: L("Không chỉ phát hiện mà còn sửa lỗi", "Not just detect errors, fix them"), kind: "grid", rounds: 4 },
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
    $("#mission").innerHTML = L("📤 Bạn là bên <b>gửi</b>. Đặt bit parity (viền cam) cho mỗi gói sao cho tổng số bit 1 là <b>số chẵn</b>.", "📤 You are the <b>sender</b>. Set the parity bit (orange outline) of each packet so the number of 1 bits is <b>even</b>.");
    S.pk = Array.from({ length: 4 }, () => ({ d: G.randInt(1, 127), p: 0 }));
    renderCompute();
    setFeedback(L("Đếm số bit 1 trong 7 bit dữ liệu: lẻ thì parity = 1, chẵn thì parity = 0.", "Count the 1s among the 7 data bits: odd means parity = 1, even means parity = 0."));
  }

  function renderCompute(showBad = false) {
    const box = $("#packets");
    box.innerHTML = "";
    S.pk.forEach((p, k) => {
      const v = (p.d << 1) | p.p, ok = p.p === (pop(p.d) & 1);
      const row = G.bitRow(v, 8, { onToggle: S.done ? null : (i) => { if (i === 7) { p.p ^= 1; G.sound.play("tick"); renderCompute(); } } });
      box.append(el("div", { class: "packet" + (showBad || S.done ? (ok ? " good" : " bad") : "") }, [
        el("span", { class: "pid", text: `${T.pk} ${k + 1}` }), row,
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
      setFeedback(L("✓ Cả 4 gói đều có số bit 1 chẵn, sẵn sàng gửi đi! <span class=\"detail\">Parity = XOR của 7 bit dữ liệu: XOR ra 1 khi có lẻ bit 1.</span>", "✓ All 4 packets have an even number of 1s, ready to send! <span class=\"detail\">Parity = XOR of the 7 data bits: XOR gives 1 when there is an odd number of 1s.</span>"), "good");
      renderCompute();
      return endRound();
    }
    S.tried = true;
    G.sound.play("bad");
    renderCompute(true);
    setFeedback(L(`✗ Còn ${wrong} gói có tổng số bit 1 là số lẻ (tô đỏ).`, `✗ ${wrong} packets still have an odd number of 1s (in red).`), "bad");
  }

  /* ---------- Level 2, 3: trạm kiểm tra ---------- */
  function setupDetect(twoBit) {
    $("#mission").innerHTML = twoBit
      ? L("📥 Trạm nhận. Đánh dấu các gói mà <b>parity báo lỗi</b>. Lần này kênh nhiễu nặng hơn…", "📥 Receiving station. Mark the packets where <b>parity reports an error</b>. The channel is noisier this time…")
      : L("📥 Bạn là bên <b>nhận</b>. Gói nào bị lật bit trên đường truyền? Bấm để đánh dấu ❌ Lỗi.", "📥 You are the <b>receiver</b>. Which packets had bits flipped on the way? Click to mark ❌ Error.");
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
    setFeedback(L("Đếm số bit 1 của cả 8 bit: nếu lẻ thì gói đã bị lỗi.", "Count the 1s in all 8 bits: an odd count means the packet is corrupted."));
  }

  function renderDetect() {
    const box = $("#packets");
    box.innerHTML = "";
    S.pk.forEach((p, k) => {
      const parityErr = pop(p.got) % 2 === 1;
      const btn = el("button", {
        type: "button", class: "btn sm mark-btn " + (p.mark ? "err" : "ghost"), text: p.mark ? L("❌ Lỗi", "❌ Error") : "✅ OK", disabled: S.done,
        onclick: () => { p.mark = !p.mark; G.sound.play("tick"); renderDetect(); },
      });
      const cls = S.done ? (p.mark === parityErr ? " good" : " bad") : "";
      const kids = [el("span", { class: "pid", text: `${T.pk} ${k + 1}` }), G.bitRow(p.got, 8, { bad: S.done ? p.pos.map((x) => 7 - x) : [] }),
        el("span", { class: "cnt", text: S.done ? `${pop(p.got)} bit 1` : "" }), btn];
      if (S.done && p.flips) {
        const ob = G.bits(p.orig), flipped = p.pos.map((x) => 7 - x);
        const shownBits = [...ob].map((b, i) => (flipped.includes(i) ? `<span class="flip">${b}</span>` : b)).join("");
        kids.push(el("div", { class: "orig", html: L(`Gói gốc: ${shownBits} · bị lật ${p.flips} bit`, `Original: ${shownBits} · ${p.flips} bits flipped`)
          + (p.flips === 2 ? L(" · <b>parity không phát hiện được!</b>", " · <b>parity cannot detect this!</b>") : "") }));
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
    let msg = all ? L(`✓ Phân loại đúng cả ${S.pk.length} gói!`, `✓ All ${S.pk.length} packets classified correctly!`) : L(`Đúng ${right}/${S.pk.length} gói. Các bit bị lật được tô đỏ.`, `${right}/${S.pk.length} packets right. Flipped bits are shown in red.`);
    if (sneaky) msg += `<span class="detail">${L(`⚠️ Có ${sneaky} gói bị lật <b>2 bit</b>: số bit 1 vẫn chẵn nên parity báo "OK", dù dữ liệu đã sai. Parity chỉ phát hiện được khi số bit lỗi là <b>số lẻ</b>.`, `⚠️ ${sneaky} packets had <b>2 bits</b> flipped: the count of 1s is still even, so parity says "OK" even though the data is wrong. Parity only detects an <b>odd</b> number of bit errors.`)}</span>`;
    else if (S.level.kind === "detect") msg += `<span class="detail">${L("Lật 1 bit làm số bit 1 tăng hoặc giảm 1, nên luôn đổi từ chẵn sang lẻ.", "Flipping 1 bit changes the count of 1s by one, so even always becomes odd.")}</span>`;
    setFeedback(msg, all ? "good" : "warn");
    endRound();
  }

  function setupQuiz() {
    $("#mission").innerHTML = L("🎓 Qua các vòng vừa rồi: parity chẵn phát hiện được lỗi nào?", "🎓 From the rounds so far: which errors can even parity detect?");
    const box = $("#packets");
    box.innerHTML = "";
    const opts = el("div", { class: "opts" });
    G.shuffle([
      { t: L("Khi số bit bị lật là số lẻ (1, 3, 5…)", "When an odd number of bits is flipped (1, 3, 5…)"), ok: true },
      { t: L("Mọi lỗi, bất kể bao nhiêu bit", "Every error, however many bits"), ok: false },
      { t: L("Chỉ khi bị lật đúng 2 bit", "Only when exactly 2 bits flip"), ok: false },
      { t: L("Phát hiện và tự sửa được mọi lỗi 1 bit", "It detects and fixes every 1-bit error"), ok: false },
    ]).forEach((o) => opts.append(el("button", { type: "button", class: "opt", text: o.t, onclick: (e) => {
      if (S.done) return;
      if (!o.ok) { S.tried = true; e.currentTarget.classList.add("wrong"); e.currentTarget.disabled = true; G.sound.play("bad"); setFeedback(L("✗ Chưa đúng, thử lại.", "✗ Not quite, try again."), "bad"); return; }
      S.done = true; e.currentTarget.classList.add("right");
      S.score += S.tried ? 4 : 10; if (!S.tried) S.perfect++;
      G.sound.play("good");
      setFeedback(L("✓ Đúng! <span class=\"detail\">Parity chỉ biết \"có lỗi\" chứ không biết lỗi ở đâu, nên không sửa được. Muốn sửa thì cần thêm bit kiểm tra: parity 2 chiều (level sau), mã Hamming, hoặc CRC trong mạng máy tính.</span>", "✓ Correct! <span class=\"detail\">Parity only knows \"there is an error\", not where it is, so it cannot fix it. Fixing needs more check bits: 2D parity (next level), Hamming codes, or CRC in computer networks.</span>"), "good");
      endRound();
    } })));
    box.append(opts);
    $("#btn-check").hidden = true;
    setFeedback(L("Chọn một đáp án.", "Pick an answer."));
  }

  /* ---------- Level 4: parity 2 chiều ---------- */
  function setupGrid() {
    const d = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => G.randInt(0, 1)));
    const rp = d.map((r) => r.reduce((a, b) => a ^ b, 0));
    const cp = [0, 1, 2, 3].map((c) => d.reduce((a, r) => a ^ r[c], 0));
    const er = G.randInt(0, 3), ec = G.randInt(0, 3);
    d[er][ec] ^= 1;
    S.grid = { d, rp, cp, er, ec, hint: false, miss: [] };
    $("#mission").innerHTML = L("🧮 16 bit dữ liệu được gửi kèm parity của <b>từng hàng</b> (cột phải) và <b>từng cột</b> (hàng dưới). Một bit đã bị lật. <b>Bấm vào ô bị lật để sửa.</b>", "🧮 16 data bits are sent with the parity of <b>every row</b> (right column) and <b>every column</b> (bottom row). One bit was flipped. <b>Click the flipped cell to fix it.</b>");
    renderGrid();
    setFeedback(L("Tìm hàng có tổng bit 1 lẻ và cột có tổng bit 1 lẻ. Giao điểm của chúng là ô bị lỗi.", "Find the row with an odd number of 1s and the column with an odd number of 1s. Where they cross is the bad cell."));
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
      grid.append(el("span", { class: "cell par" + (g.hint && oddRow(r) ? " odd" : ""), text: g.rp[r], title: L("Parity hàng", "Row parity") }));
    }
    for (let c = 0; c < 4; c++) grid.append(el("span", { class: "cell par" + (g.hint && oddCol(c) ? " odd" : ""), text: g.cp[c], title: L("Parity cột", "Column parity") }));
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
      setFeedback(L(`✓ Tìm và sửa đúng bit ở hàng ${r + 1}, cột ${c + 1}! <span class="detail">Hàng lẻ cho biết lỗi ở hàng nào, cột lẻ cho biết cột nào. Chỉ với 8 bit kiểm tra mà sửa được mọi lỗi 1 bit trong 16 bit. Mã QR và RAM ECC dùng ý tưởng tương tự (nhưng mạnh hơn).</span>`, `✓ Found and fixed the bit at row ${r + 1}, column ${c + 1}! <span class="detail">The odd row tells you which row, the odd column which column. Just 8 check bits can fix any 1-bit error in 16 bits. QR codes and ECC RAM use similar (but stronger) ideas.</span>`), "good");
      renderGrid();
      return endRound();
    }
    S.tried = true;
    g.miss.push(r * 4 + c);
    g.hint = true;
    G.sound.play("bad");
    setFeedback(L("✗ Không phải ô đó. Các hàng và cột có tổng số bit 1 lẻ đã được khoanh đỏ ở ô parity.", "✗ Not that cell. Rows and columns with an odd number of 1s are now circled in red at their parity cells."), "bad");
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
    $("#end-title").textContent = all ? L("Thám tử kênh truyền! 🎉", "Channel detective! 🎉") : L("Hoàn thành level!", "Level complete!");
    $("#end-detail").textContent = L(`${S.perfect}/${S.level.rounds} vòng hoàn hảo.`, `${S.perfect}/${S.level.rounds} perfect rounds.`) + (isNew ? L(" Kỷ lục mới!", " New best!") : "");
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
