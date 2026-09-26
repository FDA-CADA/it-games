/* Bit Tetris — nhóm bit 3/4 tính từ dấu chấm để đổi bin ↔ oct/hex. Xem README.md. */
(function () {
  "use strict";
  const { $, el, L } = G;

  const LEVELS = [
    { name: "Bin → Oct", desc: L("Nhóm 3 bit, chỉ phần nguyên", "Groups of 3, integers only"), dirs: ["b2x"], ks: [3], int: [5, 9], frac: [0, 0], fall: 60, rounds: 6 },
    { name: "Bin → Hex", desc: L("Nhóm 4 bit, chỉ phần nguyên", "Groups of 4, integers only"), dirs: ["b2x"], ks: [4], int: [6, 10], frac: [0, 0], fall: 60, rounds: 6 },
    { name: L("Có dấu chấm", "With a point"), desc: L("Phần thập phân nhóm sang phải", "The fraction groups to the right"), dirs: ["b2x"], ks: [3, 4], int: [3, 7], frac: [2, 5], fall: 60, rounds: 6 },
    { name: "Oct/Hex → Bin", desc: L("Mỗi chữ số bung ra 3 hoặc 4 bit", "Each digit unfolds into 3 or 4 bits"), dirs: ["x2b"], ks: [3, 4], dInt: [2, 3], dFrac: [0, 2], fall: 55, rounds: 6 },
    { name: L("Tổng lực", "All-out"), desc: L("Trộn tất cả, rơi nhanh hơn", "Everything mixed, falls faster"), dirs: ["b2x", "x2b"], ks: [3, 4], int: [3, 8], frac: [0, 4], dInt: [2, 3], dFrac: [0, 1], fall: 42, rounds: 8 },
  ];
  const PENALTY = 0.12; // mỗi lần sai, khối rơi thêm 12% quãng đường
  const LIFE_H = 44;

  const S = { lv: 0, level: null, round: 0, score: 0, lives: 3, cleared: 0, p: null, raf: 0, t0: 0, penalty: 0, active: false };

  /* ---------- Sinh đề ---------- */
  const randBits = (len, lead1, trail1) => {
    let s = "";
    for (let i = 0; i < len; i++) s += Math.random() < 0.5 ? "1" : "0";
    if (len && lead1) s = "1" + s.slice(1);
    if (len && trail1) s = s.slice(0, -1) + "1";
    return s;
  };

  function makePiece() {
    const lvl = S.level;
    const dir = G.pick(lvl.dirs), k = G.pick(lvl.ks), base = k === 3 ? 8 : 16;
    if (dir === "b2x") {
      let iLen = G.randInt(lvl.int[0], lvl.int[1]);
      if (iLen % k === 0 && Math.random() < 0.7 && iLen < lvl.int[1]) iLen++; // thường cần đệm số 0
      let fLen = G.randInt(lvl.frac[0], lvl.frac[1]);
      if (iLen + fLen > 11) fLen = Math.max(lvl.frac[0], 11 - iLen);
      return { dir, k, base, int: randBits(iLen, true, false), frac: randBits(fLen, false, true) };
    }
    const nI = G.randInt(lvl.dInt[0], lvl.dInt[1]);
    let nF = G.randInt(lvl.dFrac[0], lvl.dFrac[1]);
    if (k === 4) nF = Math.min(nF, 4 - nI); // hex: tối đa 4 chữ số cho vừa màn hình
    const dg = () => G.digitChar(G.randInt(0, base - 1));
    let int = G.digitChar(G.randInt(1, base - 1)); for (let i = 1; i < nI; i++) int += dg();
    let frac = ""; for (let i = 0; i < nF; i++) frac += i === nF - 1 ? G.digitChar(G.randInt(1, base - 1)) : dg();
    return { dir, k, base, int, frac };
  }

  /* ---------- Nhóm bit ---------- */
  const groupsInt = (s, k) => { const out = []; for (let e = s.length; e > 0; e -= k) out.unshift(s.slice(Math.max(0, e - k), e).padStart(k, "0")); return out; };
  const groupsFrac = (s, k) => { const out = []; for (let i = 0; i < s.length; i += k) out.push(s.slice(i, i + k).padEnd(k, "0")); return out; };
  const toDigit = (g) => G.digitChar(parseInt(g, 2));
  const answerStr = (p) => {
    const gi = groupsInt(p.int, p.k).map(toDigit).join(""), gf = groupsFrac(p.frac, p.k).map(toDigit).join("");
    return gi + (gf ? "." + gf : "");
  };

  /* ---------- Vòng chơi ---------- */
  function startLevel(i) {
    S.lv = i; S.level = LEVELS[i]; S.round = 0; S.score = 0; S.lives = 3; S.cleared = 0;
    $("#pile").innerHTML = "";
    $("#hud-level").textContent = i + 1;
    G.showScreen("play");
    nextPiece();
  }

  function nextPiece() {
    if (S.round >= S.level.rounds || S.lives <= 0) return finish();
    S.round++;
    S.p = makePiece();
    S.p.phase = S.p.dir === "b2x" ? "cut" : "digits";
    S.penalty = 0;
    $("#hud-round").textContent = `${S.round}/${S.level.rounds}`;
    $("#hud-score").textContent = S.score;
    $("#hud-lives").textContent = "❤".repeat(S.lives) + "♡".repeat(3 - S.lives);
    $("#btn-next").hidden = true;
    $("#btn-action").hidden = false;
    const name = S.p.base === 8 ? L("bát phân (hệ 8)", "octal (base 8)") : L("thập lục phân (hệ 16)", "hexadecimal (base 16)");
    if (S.p.dir === "b2x") {
      $("#goal").innerHTML = L(`Đổi sang <span class="tag">${name}</span>: cắt thành nhóm <span class="tag">${S.p.k}</span> bit`, `Convert to <span class="tag">${name}</span>: cut into groups of <span class="tag">${S.p.k}</span> bits`);
      setFeedback(L("Bấm vào khe giữa các bit để đặt vết cắt. Dấu chấm đã là ranh giới sẵn.", "Click the gaps between bits to place cuts. The point is already a boundary."));
    } else {
      $("#goal").innerHTML = L(`Đổi số <span class="tag">${name}</span> sang nhị phân: mỗi chữ số → <span class="tag">${S.p.k}</span> bit`, `Convert the <span class="tag">${name}</span> number to binary: each digit → <span class="tag">${S.p.k}</span> bits`);
      setFeedback(L(`Gõ ${S.p.k} bit cho từng chữ số.`, `Type ${S.p.k} bits for each digit.`));
    }
    renderPiece();
    const piece = $("#piece");
    piece.classList.remove("boom");
    piece.style.top = "0px";
    S.active = true;
    S.t0 = performance.now();
    cancelAnimationFrame(S.raf);
    S.raf = requestAnimationFrame(tick);
  }

  function renderPiece() {
    const p = S.p, piece = $("#piece");
    piece.innerHTML = "";
    if (p.dir === "x2b") {
      const tiles = [];
      [...p.int].forEach((d) => tiles.push({ d }));
      if (p.frac) { tiles.push({ pt: true }); [...p.frac].forEach((d) => tiles.push({ d })); }
      tiles.forEach((t) => {
        if (t.pt) return piece.append(el("span", { class: "pt", text: "." }));
        piece.append(el("div", { class: "digit-tile" }, [
          el("span", { class: "dg", text: t.d }),
          el("input", { maxlength: p.k, inputmode: "numeric", autocomplete: "off", "data-d": t.d, "aria-label": L(`Bit của chữ số ${t.d}`, `Bits of digit ${t.d}`), onkeydown: onInputKey, oninput: onBitsInput }),
        ]));
      });
      $("#btn-action").textContent = L("💥 Nổ", "💥 Blast");
      $("#btn-reset").hidden = true;
      $("input", piece).focus();
      return;
    }
    if (p.phase === "cut") {
      p.cuts = p.cuts || new Set();
      [...p.int].forEach((b, i) => {
        if (i > 0) piece.append(gapBtn("i", p.int.length - i));
        piece.append(el("span", { class: "bit", text: b }));
      });
      piece.append(el("span", { class: "pt" + (p.frac ? "" : " ghost"), text: ".", title: L("Dấu chấm (mốc để đếm nhóm)", "The point (where grouping starts)") }));
      if (p.frac) {
        [...p.frac].forEach((b, i) => {
          if (i > 0) piece.append(gapBtn("f", i));
          piece.append(el("span", { class: "bit", text: b }));
        });
      }
      $("#btn-action").textContent = L("✂ Cắt", "✂ Cut");
      $("#btn-reset").hidden = false;
    } else {
      // phase "digits": hiện các nhóm đã đệm số 0 và ô nhập chữ số
      const addGroups = (s, side) => {
        const gs = side === "i" ? groupsInt(s, p.k) : groupsFrac(s, p.k);
        const padLeft = side === "i" ? gs.length * p.k - s.length : 0;
        const padRight = side === "f" ? gs.length * p.k - s.length : 0;
        gs.forEach((g, gi) => {
          const bits = el("div", { class: "bits" });
          [...g].forEach((b, bi) => {
            const isPad = (side === "i" && gi === 0 && bi < padLeft) || (side === "f" && gi === gs.length - 1 && bi >= p.k - padRight);
            bits.append(el("span", { class: "bit" + (isPad ? " pad" : ""), text: b }));
          });
          piece.append(el("div", { class: "group" }, [bits, el("input", {
            maxlength: 1, autocomplete: "off", "data-g": g, "aria-label": L(`Chữ số cho nhóm ${g}`, `Digit for group ${g}`), onkeydown: onInputKey, oninput: onDigitInput,
          })]));
        });
      };
      addGroups(p.int, "i");
      piece.append(el("span", { class: "pt" + (p.frac ? "" : " ghost"), text: "." }));
      if (p.frac) addGroups(p.frac, "f");
      $("#btn-action").textContent = L("💥 Nổ", "💥 Blast");
      $("#btn-reset").hidden = true;
      $("input", piece).focus();
    }
  }

  function gapBtn(side, j) {
    const key = side + j;
    const b = el("button", { class: "gap" + (S.p.cuts.has(key) ? " cut" : ""), type: "button", "data-key": key, "aria-label": L("Khe cắt", "Cut slot") });
    b.addEventListener("click", () => {
      if (!S.active) return;
      S.p.cuts.has(key) ? S.p.cuts.delete(key) : S.p.cuts.add(key);
      b.classList.toggle("cut");
      b.classList.remove("bad", "missing");
      G.sound.play("tick");
    });
    return b;
  }

  /* ---------- Rơi ---------- */
  function tick(now) {
    if (!S.active) return;
    const well = $("#well"), piece = $("#piece");
    const pileH = (3 - S.lives) * LIFE_H;
    const room = well.clientHeight - pileH - piece.offsetHeight - 4;
    const prog = Math.min(1, (now - S.t0) / 1000 / S.level.fall + S.penalty);
    piece.style.top = Math.max(0, prog * room) + "px";
    if (prog >= 1) return landed();
    S.raf = requestAnimationFrame(tick);
  }

  function landed() {
    S.active = false;
    S.lives--;
    G.sound.play("bad");
    const p = S.p;
    const q = p.dir === "b2x" ? `${p.int}${p.frac ? "." + p.frac : ""}` : `${p.int}${p.frac ? "." + p.frac : ""}`;
    const a = p.dir === "b2x" ? answerStr(p) : binaryOf(p);
    $("#pile").append(el("div", { class: "dead", text: `${q} → ${a}` }));
    $("#hud-lives").textContent = "❤".repeat(S.lives) + "♡".repeat(3 - S.lives);
    $("#piece").innerHTML = "";
    setFeedback(`💥 ${L("Khối chạm đáy! Đáp án:", "The block hit the bottom! Answer:")} <b class="mono">${q}</b><sub>${p.dir === "b2x" ? 2 : p.base}</sub> = <b class="mono">${a}</b><sub>${p.dir === "b2x" ? p.base : 2}</sub>`, "bad");
    $("#btn-action").hidden = true;
    $("#btn-next").hidden = false;
    $("#btn-next").textContent = S.lives > 0 ? L("Khối tiếp →", "Next block →") : L("Xem kết quả", "See results");
    $("#btn-next").focus();
  }

  function binaryOf(p) {
    const conv = (s) => [...s].map((d) => G.digitValue(d).toString(2).padStart(p.k, "0")).join(" ");
    return conv(p.int) + (p.frac ? " . " + conv(p.frac) : "");
  }

  function punish(msg) {
    S.penalty += PENALTY;
    G.sound.play("bad");
    G.shake($("#piece"));
    setFeedback(msg, "bad");
  }

  /* ---------- Kiểm tra ---------- */
  function action() {
    if (!S.active) return;
    const p = S.p;
    if (p.phase === "cut") return checkCuts();
    if (p.dir === "b2x") return checkDigits();
    return checkBits();
  }

  function checkCuts() {
    const p = S.p, k = p.k;
    const expect = new Set();
    for (let j = 1; j < p.int.length; j++) if (j % k === 0) expect.add("i" + j);
    for (let j = 1; j < p.frac.length; j++) if (j % k === 0) expect.add("f" + j);
    const same = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));
    if (same(p.cuts, expect)) {
      p.phase = "digits";
      G.sound.play("good");
      setFeedback(L(`✓ Cắt chuẩn! Số 0 mờ là phần đệm thêm. Giờ gõ chữ số ${p.base === 8 ? "bát phân" : "hex"} cho từng nhóm.`, `✓ Clean cut! Faded 0s are padding. Now type the ${p.base === 8 ? "octal" : "hex"} digit for each group.`), "good");
      return renderPiece();
    }
    // Chẩn đoán lỗi hay gặp
    const leftInt = new Set(), rightFrac = new Set();
    for (let j = 1; j < p.int.length; j++) if ((p.int.length - j) % k === 0) leftInt.add("i" + j);
    for (let j = 1; j < p.frac.length; j++) if ((p.frac.length - j) % k === 0) rightFrac.add("f" + j);
    const pick = (set, side) => new Set([...set].filter((x) => x[0] === side));
    let msg = L(`Chưa đúng. Mỗi nhóm phải có đúng ${k} bit, đếm <b>từ dấu chấm</b> ra hai phía.`, `Not quite. Each group must have exactly ${k} bits, counted outwards <b>from the point</b>.`);
    if (p.int.length % k && same(pick(p.cuts, "i"), leftInt)) msg = L("Bạn đang nhóm phần nguyên <b>từ trái sang</b>. Phần nguyên phải nhóm <b>từ dấu chấm sang trái</b> (tức từ phải qua), nhóm thiếu nằm ở bên trái và được đệm 0.", "You are grouping the integer part <b>from the left</b>. It must be grouped <b>from the point leftwards</b> (i.e. from the right); the short group sits on the left and is padded with 0s.");
    else if (p.frac.length % k && same(pick(p.cuts, "f"), rightFrac)) msg = L("Phần thập phân phải nhóm <b>từ dấu chấm sang phải</b>. Nhóm thiếu nằm ở cuối bên phải và được đệm 0 phía sau.", "The fraction part must be grouped <b>from the point rightwards</b>. The short group sits at the far right and is padded with trailing 0s.");
    G.$$(".gap", $("#piece")).forEach((g) => {
      const key = g.dataset.key;
      if (p.cuts.has(key) && !expect.has(key)) g.classList.add("bad");
    });
    punish("✗ " + msg);
  }

  function checkDigits() {
    const inputs = G.$$("input", $("#piece"));
    let ok = true;
    inputs.forEach((inp) => {
      const good = inp.value.trim().toUpperCase() === toDigit(inp.dataset.g);
      inp.classList.toggle("err", !good); inp.classList.toggle("ok", good);
      ok = ok && good;
    });
    if (ok) return win(inputs.length);
    const bad = inputs.find((i) => i.classList.contains("err"));
    punish(L(`✗ Nhóm <b class="mono">${bad.dataset.g}</b> chưa đúng. Trọng số trong nhóm là ${S.p.k === 3 ? "4 2 1" : "8 4 2 1"}.`, `✗ Group <b class="mono">${bad.dataset.g}</b> is wrong. The weights inside a group are ${S.p.k === 3 ? "4 2 1" : "8 4 2 1"}.`));
    bad.select();
  }

  function checkBits() {
    const p = S.p, inputs = G.$$("input", $("#piece"));
    let ok = true;
    inputs.forEach((inp, idx) => {
      const want = G.digitValue(inp.dataset.d).toString(2).padStart(p.k, "0");
      const v = inp.value.trim();
      // Chữ số đầu tiên của phần nguyên được phép bỏ số 0 ở đầu
      const good = v === want || (idx === 0 && v.length > 0 && v.padStart(p.k, "0") === want && /^[01]+$/.test(v));
      inp.classList.toggle("err", !good); inp.classList.toggle("ok", good);
      ok = ok && good;
    });
    if (ok) return win(inputs.length);
    const bad = inputs.find((i) => i.classList.contains("err"));
    const v = bad.value.trim();
    const hint = v.length && v.length < p.k ? L(` Nhớ viết đủ ${p.k} bit, kể cả số 0 ở đầu (vd. 1 → ${"1".padStart(p.k, "0")}).`, ` Remember to write all ${p.k} bits, including leading 0s (e.g. 1 → ${"1".padStart(p.k, "0")}).`)
      : ` ${L("Trọng số", "Weights")}: ${p.k === 3 ? "4 2 1" : "8 4 2 1"}.`;
    punish(L(`✗ Chữ số <b class="mono">${bad.dataset.d}</b> chưa đúng.${hint}`, `✗ Digit <b class="mono">${bad.dataset.d}</b> is wrong.${hint}`));
    bad.select();
  }

  async function win(groups) {
    S.active = false;
    cancelAnimationFrame(S.raf);
    const elapsed = (performance.now() - S.t0) / 1000 / S.level.fall + S.penalty;
    const bonus = Math.max(0, Math.round((1 - elapsed) * 10));
    const gained = 10 + 2 * groups + bonus;
    S.score += gained; S.cleared++;
    $("#hud-score").textContent = S.score;
    G.sound.play("good");
    const p = S.p;
    const res = p.dir === "b2x"
      ? `${p.int}${p.frac ? "." + p.frac : ""}<sub>2</sub> = <b class="mono">${answerStr(p)}</b><sub>${p.base}</sub>`
      : `${p.int}${p.frac ? "." + p.frac : ""}<sub>${p.base}</sub> = <b class="mono">${binaryOf(p)}</b><sub>2</sub>`;
    setFeedback(`💥 ${L("Nổ!", "Boom!")} +${gained} <span class="detail mono">${res}</span>`, "good");
    $("#piece").classList.add("boom");
    $("#btn-action").hidden = true;
    await G.wait(450);
    $("#btn-next").hidden = false;
    $("#btn-next").textContent = L("Khối tiếp →", "Next block →");
    $("#btn-next").focus();
  }

  function finish() {
    S.active = false;
    cancelAnimationFrame(S.raf);
    const { isNew } = G.progress.record("bit-tetris", S.lv, S.score, LEVELS.length);
    G.showScreen("end");
    $("#end-score").textContent = S.score;
    const all = S.cleared === S.level.rounds;
    $("#end-title").textContent = S.lives <= 0 ? L("Hết mạng!", "Out of lives!") : all ? L("Không khối nào chạm đáy! 🎉", "Not a single block landed! 🎉") : L("Hoàn thành level!", "Level complete!");
    $("#end-detail").textContent = L(`Phá ${S.cleared}/${S.level.rounds} khối.`, `Cleared ${S.cleared}/${S.level.rounds} blocks.`) + (isNew ? L(" Kỷ lục mới!", " New best!") : "");
    if (all) { G.confetti(); G.sound.play("win"); }
    G.mountNextLink($("#next-game"));
  }

  /* ---------- Nhập liệu ---------- */
  function onInputKey(e) {
    if (e.key === "Enter") { e.preventDefault(); action(); }
    else if (e.key === "Backspace" && !e.target.value) { const prev = e.target.closest("div").previousElementSibling; const i = prev && $("input", prev); if (i) i.focus(); }
  }
  function focusNext(inp) {
    const all = G.$$("input", $("#piece"));
    const i = all.indexOf(inp);
    if (i >= 0 && i + 1 < all.length) all[i + 1].focus();
  }
  function onDigitInput(e) {
    const v = e.target.value.toUpperCase().replace(/[^0-9A-F]/g, "");
    e.target.value = v;
    e.target.classList.remove("err", "ok");
    if (v) focusNext(e.target);
  }
  function onBitsInput(e) {
    const v = e.target.value.replace(/[^01]/g, "");
    e.target.value = v;
    e.target.classList.remove("err", "ok");
    if (v.length >= S.p.k) focusNext(e.target);
  }

  function setFeedback(html, type = "") {
    const f = $("#feedback");
    f.className = "feedback " + type;
    f.innerHTML = html;
  }

  document.addEventListener("keydown", (e) => {
    if ($("[data-screen=play]").hidden || e.target.tagName === "INPUT") return;
    if (e.key === "Enter") {
      e.preventDefault();
      if (!$("#btn-next").hidden) $("#btn-next").click(); else action();
    }
  });
  document.addEventListener("visibilitychange", () => {
    // Tạm dừng khi chuyển tab: dời mốc thời gian để khối không rơi "trộm"
    if (!S.active) return;
    if (document.hidden) S.hiddenAt = performance.now();
    else if (S.hiddenAt) { S.t0 += performance.now() - S.hiddenAt; S.hiddenAt = 0; }
  });

  $("#btn-action").addEventListener("click", action);
  $("#btn-reset").addEventListener("click", () => { if (S.active && S.p.phase === "cut") { S.p.cuts.clear(); renderPiece(); } });
  $("#btn-next").addEventListener("click", nextPiece);
  $("#btn-again").addEventListener("click", () => startLevel(S.lv));
  $("#btn-menu").addEventListener("click", () => { S.active = false; G.renderLevels($("#levels"), LEVELS, startLevel); G.showScreen("start"); });

  G.renderLevels($("#levels"), LEVELS, startLevel);
})();
