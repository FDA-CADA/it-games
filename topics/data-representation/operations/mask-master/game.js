/* Mask Master — set/clear/toggle bit bằng AND, OR, XOR và mask. Xem README.md. */
(function () {
  "use strict";
  const { $, el } = G;

  const OPS = { AND: (x, m) => x & m, OR: (x, m) => x | m, XOR: (x, m) => x ^ m };
  const hex = (v) => "0x" + v.toString(16).toUpperCase().padStart(2, "0");
  const ALL = [...Array(256).keys()];
  const LOWER = [...Array(26).keys()].map((k) => 97 + k);

  const RULES = [
    { text: "Giữ lại 4 bit thấp, xóa 4 bit cao (lấy \"nibble\" thấp).", f: (x) => x & 0x0f, dom: ALL, sol: "AND 0x0F (00001111)" },
    { text: "Bật bit cao nhất (bit 7) của mọi byte.", f: (x) => x | 0x80, dom: ALL, sol: "OR 0x80 (10000000)" },
    { text: "Đảo toàn bộ 8 bit (bù 1).", f: (x) => x ^ 0xff, dom: ALL, sol: "XOR 0xFF (11111111)" },
    { text: "Biến chữ thường ASCII thành chữ hoa (a → A).", f: (x) => x - 32, dom: LOWER, sol: "AND 0xDF (11011111) để tắt bit 0x20. Với chữ thường, XOR 0x20 cũng được", show: "char" },
    { text: "Chỉ giữ bit 0 để biết số chẵn hay lẻ (kết quả 1 là lẻ).", f: (x) => x & 1, dom: ALL, sol: "AND 0x01 (00000001)" },
    { text: "Bật quyền \"ghi\" (bit 1) trong byte quyền truy cập, không đụng tới quyền khác.", f: (x) => x | 2, dom: ALL, sol: "OR 0x02 (00000010)" },
  ];

  const LEVELS = [
    { name: "Bật bit (set)", desc: "Chỉ có OR", ops: ["OR"], gen: "set", par: 1, rounds: 4 },
    { name: "Tắt bit (clear)", desc: "Chỉ có AND", ops: ["AND"], gen: "clear", par: 1, rounds: 4 },
    { name: "Đảo bit (toggle)", desc: "Chỉ có XOR", ops: ["XOR"], gen: "toggle", par: 1, rounds: 4 },
    { name: "Vừa bật vừa tắt", desc: "AND và OR, cần 2 lượt", ops: ["AND", "OR"], gen: "combo", par: 2, rounds: 4 },
    { name: "Mask vạn năng", desc: "Một mask đúng cho mọi byte", ops: ["AND", "OR", "XOR"], gen: "rule", rounds: RULES.length },
  ];

  const S = { lv: 0, level: null, round: 0, score: 0, perfect: 0, start: 0, cur: 0, target: 0, mask: 0, op: null, moves: 0, done: false, rule: null, history: [] };

  const pickBits = (pool, k) => G.shuffle(pool).slice(0, k).reduce((m, i) => m | (1 << i), 0);
  const zerosOf = (v) => [...Array(8).keys()].filter((i) => !(v >> i & 1));
  const onesOf = (v) => [...Array(8).keys()].filter((i) => v >> i & 1);

  function startLevel(i) {
    S.lv = i; S.level = LEVELS[i]; S.round = 0; S.score = 0; S.perfect = 0;
    $("#hud-level").textContent = i + 1;
    $("#hud-moves-wrap").hidden = S.level.gen === "rule";
    const ops = $("#ops");
    ops.innerHTML = "";
    ["AND", "OR", "XOR"].forEach((o) => ops.append(el("button", {
      type: "button", class: "op", "data-op": o, text: o, disabled: !S.level.ops.includes(o),
      onclick: () => { if (S.done) return; S.op = o; render(); },
    })));
    G.showScreen("play");
    nextRound();
  }

  function nextRound() {
    if (S.round >= S.level.rounds) return finish();
    S.round++; S.done = false; S.moves = 0; S.mask = 0; S.history = [];
    S.op = S.level.ops.length === 1 ? S.level.ops[0] : null;
    const g = S.level.gen;
    if (g === "rule") {
      S.rule = RULES[S.round - 1];
      S.samples = G.shuffle(S.rule.dom).slice(0, 4);
      $("#mission").innerHTML = `📜 ${S.rule.text}<div class="muted" style="font-weight:500;font-size:.9rem">Chọn phép toán và mask. Game sẽ thử với <b>mọi</b> byte đầu vào có thể.</div>`;
    } else {
      let s, t;
      do {
        s = G.randInt(1, 254);
        if (g === "set") t = s | pickBits(zerosOf(s), G.randInt(2, 3));
        else if (g === "clear") t = s & ~pickBits(onesOf(s), G.randInt(2, 3)) & 0xff;
        else if (g === "toggle") t = s ^ (pickBits(zerosOf(s), 2) | pickBits(onesOf(s), 2));
        else t = (s | pickBits(zerosOf(s), 2)) & ~pickBits(onesOf(s), 2) & 0xff;
      } while (t === s || (g === "combo" && (zerosOf(s).length < 2 || onesOf(s).length < 2)));
      S.start = S.cur = s; S.target = t;
      const verb = { set: "Bật các bit còn thiếu", clear: "Tắt các bit thừa", toggle: "Đảo đúng các bit khác nhau", combo: "Vừa bật vừa tắt" }[g];
      $("#mission").innerHTML = `🎯 ${verb} để biến <b>Hiện tại</b> thành <b>Mục tiêu</b>.`;
    }
    $("#hud-round").textContent = `${S.round}/${S.level.rounds}`;
    $("#hud-score").textContent = S.score;
    $("#btn-apply").hidden = false;
    $("#btn-apply").textContent = g === "rule" ? "✔ Kiểm tra" : "⚡ Áp dụng";
    $("#btn-next").hidden = true;
    $("#btn-reset").hidden = g === "rule";
    setFeedback(S.op ? `Phép toán: <b>${S.op}</b>. Bấm các bit của Mask.` : "Chọn phép toán, rồi bấm các bit của Mask.");
    render();
  }

  function toggleMask(i) { if (S.done) return; S.mask ^= 1 << (7 - i); G.sound.play("tick"); render(); }

  function render() {
    G.$$(".op").forEach((b) => b.classList.toggle("sel", b.dataset.op === S.op));
    $("#hud-moves").textContent = `${S.moves}/${S.level.par ?? "-"}`;
    const board = $("#board");
    board.innerHTML = "";
    board.style.display = "";
    const line = (lbl, row, num, cls = "") => {
      board.append(el("div", { class: "lbl" + cls, html: lbl }), row, el("div", { class: "num", text: num }));
    };
    if (S.level.gen === "rule") return renderRule(board);
    const preview = S.op ? OPS[S.op](S.cur, S.mask) : null;
    line("Hiện tại", G.bitRow(S.cur), `${hex(S.cur)} = ${S.cur}`);
    line(S.op || "?", G.bitRow(S.mask, 8, { onToggle: S.done ? null : toggleMask }), `mask ${hex(S.mask)}`, " op-lbl");
    board.append(el("div", { class: "sep" }));
    const diffs = preview == null ? [] : [...G.bits(preview)].map((b, i) => (b !== G.bits(S.target)[i] ? i : -1)).filter((i) => i >= 0);
    line("Kết quả", preview == null ? el("div", { class: "muted", text: "(chọn phép toán)" }) : G.bitRow(preview, 8, { bad: diffs }), preview == null ? "" : `${hex(preview)} = ${preview}`);
    const tRow = G.bitRow(S.target);
    tRow.classList.add("target");
    if (preview === S.target) tRow.classList.add("match");
    line("Mục tiêu", tRow, `${hex(S.target)} = ${S.target}`);
  }

  function renderRule(board) {
    board.style.display = "block";
    const wrap = el("div", { class: "mask-row" }, [el("b", { class: "mono", text: `${S.op || "?"} mask:` }), G.bitRow(S.mask, 8, { onToggle: S.done ? null : toggleMask }), el("span", { class: "mono muted", text: hex(S.mask) })]);
    board.append(wrap);
    const tbl = el("table", { class: "samples" });
    tbl.append(el("tr", {}, ["Đầu vào", "Kết quả của bạn", "Cần ra", ""].map((t) => el("th", { text: t }))));
    const fmt = (v) => (S.rule.show === "char" ? `'${String.fromCharCode(v)}'` : v);
    S.samples.forEach((x) => {
      const got = S.op ? OPS[S.op](x, S.mask) : null, want = S.rule.f(x);
      tbl.append(el("tr", {}, [
        el("td", {}, [G.bitRow(x, 8, { cls: "sm" }), el("div", { class: "num mono", text: fmt(x) })]),
        el("td", {}, got == null ? [el("span", { class: "muted", text: "?" })] : [G.bitRow(got, 8, { cls: "sm" }), el("div", { class: "num mono", text: fmt(got) })]),
        el("td", {}, [G.bitRow(want, 8, { cls: "sm" }), el("div", { class: "num mono", text: fmt(want) })]),
        el("td", { class: got === want ? "ok" : "no", text: got === want ? "✓" : "✗" }),
      ]));
    });
    board.append(tbl);
  }

  function apply() {
    if (S.done) return;
    if (!S.op) { setFeedback("Hãy chọn phép toán AND, OR hoặc XOR trước.", "warn"); return; }
    if (S.level.gen === "rule") return checkRule();
    const before = S.cur;
    S.cur = OPS[S.op](S.cur, S.mask);
    S.moves++;
    S.history.push(`${S.op} ${G.bits(S.mask)}`);
    G.sound.play("pop");
    if (S.cur === S.target) return win();
    const limit = S.level.par + 2;
    if (S.moves >= limit) {
      S.done = true;
      G.sound.play("bad");
      setFeedback(`✗ Hết lượt! <span class="detail">Lời giải: ${solution()}</span>`, "bad");
      endRound();
      render();
      return;
    }
    const why = S.cur === before ? "Byte không đổi: mask này không tác động bit nào với phép " + S.op + "." : "Đã áp dụng. Các bit tô đỏ vẫn khác mục tiêu.";
    setFeedback(`${why} Còn ${limit - S.moves} lượt.`, "warn");
    S.mask = 0;
    render();
  }

  function solution() {
    const s = S.start, t = S.target, g = S.level.gen;
    if (g === "set") return `OR ${G.bits(t & ~s & 0xff)} (bật đúng các bit 0 → 1)`;
    if (g === "clear") return `AND ${G.bits(~(s & ~t) & 0xff)} (bit 0 ở mask là bit bị tắt)`;
    if (g === "toggle") return `XOR ${G.bits(s ^ t)} = Hiện tại XOR Mục tiêu`;
    return `OR ${G.bits(t & ~s & 0xff)}, rồi AND ${G.bits(~(s & ~t) & 0xff)}`;
  }

  function win() {
    S.done = true;
    const extra = S.moves - S.level.par;
    const gained = extra <= 0 ? 15 : Math.max(5, 15 - 4 * extra);
    S.score += gained; if (extra <= 0) S.perfect++;
    G.sound.play("good");
    const tip = { set: "OR với 1 thì bật, OR với 0 thì giữ nguyên.", clear: "AND với 0 thì tắt, AND với 1 thì giữ nguyên.",
      toggle: "Mask XOR chính là \"chỗ khác nhau\": Hiện tại XOR Mục tiêu.", combo: "Một phép OR để bật, một phép AND để tắt." }[S.level.gen];
    setFeedback(`✓ Khớp mục tiêu sau ${S.moves} lượt! +${gained} <span class="detail">${S.history.join(" → ")}. ${tip}</span>`, "good");
    endRound();
    render();
  }

  function checkRule() {
    const f = OPS[S.op], r = S.rule;
    const bad = r.dom.filter((x) => f(x, S.mask) !== r.f(x));
    S.moves++;
    if (!bad.length) {
      S.done = true;
      const gained = S.moves === 1 ? 15 : Math.max(5, 15 - 4 * (S.moves - 1));
      S.score += gained; if (S.moves === 1) S.perfect++;
      G.sound.play("good");
      setFeedback(`✓ Đúng với cả ${r.dom.length} đầu vào! +${gained} <span class="detail">${S.op} ${hex(S.mask)} (${G.bits(S.mask)}).</span>`, "good");
      endRound();
      render();
      return;
    }
    G.sound.play("bad");
    const x = bad[0], fmt = (v) => (r.show === "char" ? `'${String.fromCharCode(v)}' (${G.bits(v)})` : G.bits(v));
    setFeedback(`✗ Sai với ${bad.length}/${r.dom.length} đầu vào, ví dụ ${fmt(x)} → ${fmt(f(x, S.mask))}, cần ${fmt(r.f(x))}.`
      + (S.moves >= 3 ? `<span class="detail">Gợi ý: ${r.sol}</span>` : ""), "bad");
  }

  function endRound() {
    $("#hud-score").textContent = S.score;
    $("#btn-apply").hidden = true;
    $("#btn-next").hidden = false;
    $("#btn-next").focus();
  }

  function finish() {
    const { isNew } = G.progress.record("mask-master", S.lv, S.score, LEVELS.length);
    G.showScreen("end");
    $("#end-score").textContent = S.score;
    const all = S.perfect === S.level.rounds;
    $("#end-title").textContent = all ? "Bậc thầy mặt nạ! 🎉" : "Hoàn thành level!";
    $("#end-detail").textContent = `${S.perfect}/${S.level.rounds} vòng đạt số lượt tối thiểu.` + (isNew ? " Kỷ lục mới!" : "");
    if (all) { G.confetti(); G.sound.play("win"); }
    G.mountNextLink($("#next-game"));
  }

  function setFeedback(html, type = "") {
    const f = $("#feedback");
    f.className = "feedback " + type;
    f.innerHTML = html;
  }

  $("#btn-apply").addEventListener("click", apply);
  $("#btn-next").addEventListener("click", nextRound);
  $("#btn-reset").addEventListener("click", () => {
    if (S.done || S.level.gen === "rule") return;
    S.cur = S.start; S.mask = 0; S.history = [];
    setFeedback("Đã đặt lại byte về ban đầu. Số lượt đã dùng vẫn được giữ.");
    render();
  });
  document.addEventListener("keydown", (e) => {
    if ($("[data-screen=play]").hidden || e.key !== "Enter") return;
    e.preventDefault();
    if (S.done) nextRound(); else apply();
  });
  $("#btn-again").addEventListener("click", () => startLevel(S.lv));
  $("#btn-menu").addEventListener("click", () => { G.renderLevels($("#levels"), LEVELS, startLevel); G.showScreen("start"); });

  G.renderLevels($("#levels"), LEVELS, startLevel);
})();
