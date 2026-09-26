/* XOR Secret Messenger — mã hóa/giải mã bằng XOR, phá khóa, chơi theo cặp. Xem README.md. */
(function () {
  "use strict";
  const { $, el } = G;

  const hex = (v) => v.toString(16).toUpperCase().padStart(2, "0");
  const ch = (v) => (v >= 32 && v <= 126 ? String.fromCharCode(v) : "·");
  const letter = () => G.pick([G.randInt(65, 90), G.randInt(97, 122)]);

  const LEVELS = [
    { name: "Mã hóa", desc: "C = P ⊕ K, bấm từng bit", kind: "enc", rounds: 3 },
    { name: "Giải mã", desc: "P = C ⊕ K: cùng một phép toán!", kind: "dec", rounds: 3 },
    { name: "Tin từ tổng bộ", desc: "Giải mã cả một từ", kind: "hq", rounds: 3 },
    { name: "Phá mã", desc: "Tìm khóa khi biết một phần tin", kind: "break", rounds: 3 },
  ];

  const S = { lv: 0, level: null, round: 0, score: 0, perfect: 0, tried: false, done: false, P: 0, K: 0, C: 0, ans: 0, want: 0, word: "", key: 0, bad: [] };

  function startLevel(i) {
    S.lv = i; S.level = LEVELS[i]; S.round = 0; S.score = 0; S.perfect = 0;
    $("#hud-level").textContent = i + 1;
    G.showScreen("play");
    nextRound();
  }

  function nextRound() {
    if (S.round >= S.level.rounds) return finish();
    S.round++; S.tried = false; S.done = false; S.bad = [];
    $("#hud-round").textContent = `${S.round}/${S.level.rounds}`;
    $("#hud-score").textContent = S.score;
    $("#btn-check").hidden = false;
    $("#btn-next").hidden = true;
    const k = S.level.kind;
    if (k === "enc") setupBits("enc");
    else if (k === "dec") setupBits("dec");
    else if (k === "hq") setupWord(G.pick([["NEU", "BIT", "KEY"], ["DATA", "CODE", "BYTE"], ["HELLO", "AGENT", "SPY42"]][S.round - 1]), G.pick([..."KZ7#xq"]).charCodeAt(0), false);
    else if (S.round === 1) setupBits("key");
    else if (S.round === 2) setupWord(G.pick(["NEU-AI", "NHAPMON", "NEU2026"]), G.randInt(65, 122), true);
    else setupQuiz();
  }

  /* ---------- Bấm bit: mã hóa, giải mã, tìm khóa ---------- */
  function setupBits(mode) {
    S.mode = mode;
    S.P = letter(); S.K = G.randInt(1, 255); S.C = S.P ^ S.K; S.ans = 0;
    const text = {
      enc: `🔐 Mã hóa chữ <b>'${ch(S.P)}'</b> bằng khóa <b>${hex(S.K)}</b>: bấm các bit của <b>C = P ⊕ K</b>.`,
      dec: `🔓 Bạn nhận được bản mã <b>${hex(S.C)}</b>, khóa là <b>${hex(S.K)}</b>. Giải mã: <b>P = C ⊕ K</b>.`,
      key: `🕵️ Bắt được một cặp: tin gốc là <b>'${ch(S.P)}'</b>, bản mã là <b>${hex(S.C)}</b>. Tìm <b>khóa K</b>!`,
    }[mode];
    S.want = { enc: S.C, dec: S.P, key: S.K }[mode];
    $("#mission").innerHTML = text;
    setFeedback(mode === "key" ? "Gợi ý: nếu C = P ⊕ K thì K = P ⊕ C." : "Giống nhau ra 0, khác nhau ra 1.");
    renderBits();
  }

  function renderBits() {
    const w = $("#work");
    w.innerHTML = "";
    const edit = { onToggle: S.done ? null : (i) => { S.ans ^= 1 << (7 - i); S.bad = []; G.sound.play("tick"); renderBits(); }, bad: S.bad };
    const rows = {
      enc: [["P", "tin nhắn", S.P, `'${ch(S.P)}'`], ["K", "khóa", S.K, hex(S.K)], null, ["C", "bản mã", "ans"]],
      dec: [["C", "bản mã", S.C, hex(S.C)], ["K", "khóa", S.K, hex(S.K)], null, ["P", "tin nhắn", "ans"]],
      key: [["P", "tin gốc", S.P, `'${ch(S.P)}'`], ["C", "bản mã", S.C, hex(S.C)], null, ["K", "khóa", "ans"]],
    }[S.mode];
    rows.forEach((r) => {
      if (!r) return w.append(el("div", { class: "sep" }));
      const [name, sub, v, show] = r;
      const isAns = v === "ans";
      w.append(el("div", { class: "lbl", html: `${name}<small>${sub}</small>` }),
        isAns ? G.bitRow(S.ans, 8, edit) : G.bitRow(v),
        el("div", { class: "ch", text: isAns ? (S.done ? (S.mode === "dec" ? `'${ch(S.ans)}'` : hex(S.ans)) : "?") : show }));
    });
  }

  function checkBits() {
    if (S.ans === S.want) {
      S.done = true;
      award();
      const shown = S.C >= 32 && S.C <= 126 ? `'${ch(S.C)}'` : "một byte không in ra được";
      const extra = { enc: `Bản mã ${hex(S.C)} là ${shown}, chẳng còn dấu vết gì của '${ch(S.P)}'.`,
        dec: `Để ý: giải mã dùng <b>đúng phép XOR</b> với <b>đúng khóa</b> như lúc mã hóa.`,
        key: `K = P ⊕ C = ${G.bits(S.K)}. Chỉ cần biết <b>một</b> cặp (tin gốc, bản mã) là lộ khóa!` }[S.mode];
      setFeedback(`✓ Chính xác! <span class="detail">${extra}</span>`, "good");
      renderBits();
      return;
    }
    S.tried = true;
    const a = G.bits(S.ans), w = G.bits(S.want);
    S.bad = [...a].map((b, i) => (b !== w[i] ? i : -1)).filter((i) => i >= 0);
    G.sound.play("bad");
    setFeedback(`✗ Còn ${S.bad.length} bit sai (tô đỏ). So từng cột: giống nhau → 0, khác nhau → 1.`, "bad");
    renderBits();
  }

  /* ---------- Giải mã cả từ ---------- */
  function setupWord(word, key, hiddenKey) {
    S.mode = "word"; S.word = word; S.key = key; S.hiddenKey = hiddenKey;
    const cipher = [...word].map((c) => c.charCodeAt(0) ^ key);
    $("#mission").innerHTML = hiddenKey
      ? `🧩 Một tin nhắn mã hóa bằng khóa <b>1 byte chưa biết</b>. Tình báo cho biết tin luôn bắt đầu bằng chữ <b>'${word[0]}'</b>. Hãy tìm khóa rồi giải mã cả tin.`
      : `📡 Tổng bộ gửi tin, mỗi byte được XOR với khóa <b>'${String.fromCharCode(key)}'</b>. Giải mã từng byte rồi gõ ký tự.`;
    const w = $("#work");
    w.innerHTML = "";
    w.append(el("div", { class: "keybox" }, hiddenKey
      ? [el("span", { class: "muted", text: "Khóa: ???????? (gợi ý: K = byte đầu ⊕ '" + word[0] + "')" })]
      : [el("span", { html: `Khóa K = <b class="mono">'${String.fromCharCode(key)}' = ${G.bits(key)}</b>` })]));
    const grid = el("div", { class: "msg-grid" });
    cipher.forEach((c, i) => grid.append(el("div", { class: "msg-byte" }, [
      el("span", { class: "hex", text: hex(c) }), G.bitRow(c, 8, { cls: "sm" }),
      el("input", { maxlength: 1, autocomplete: "off", autocapitalize: "off", spellcheck: "false", "aria-label": `Ký tự ${i + 1}`,
        oninput: (e) => { e.target.classList.remove("ok", "err"); if (e.target.value) { const n = e.target.closest(".msg-byte").nextElementSibling; if (n) $("input", n).focus(); } } }),
    ])));
    w.append(grid);
    setFeedback(hiddenKey ? "Bắt đầu với byte đầu tiên: bạn biết cả P lẫn C của nó." : "Với mỗi byte: C ⊕ K = mã ASCII của ký tự. Mốc: 'A' = 65, 'a' = 97, '0' = 48.");
    $("input", grid).focus();
  }

  function checkWord() {
    const inputs = G.$$(".msg-byte input");
    const wrong = [];
    inputs.forEach((inp, i) => { const ok = inp.value === S.word[i]; inp.classList.toggle("ok", ok); inp.classList.toggle("err", !ok); if (!ok) wrong.push(i); });
    if (!wrong.length) {
      S.done = true;
      award();
      setFeedback(`✓ Giải mã thành công: <b class="mono">${S.word}</b> <span class="detail">Khóa là '${String.fromCharCode(S.key)}' = ${G.bits(S.key)}.${S.hiddenKey ? " Chỉ nhờ biết chữ cái đầu mà cả tin bị lộ. Đoán trước một phần nội dung (gọi là \"crib\") cũng là kỹ thuật phe Đồng minh dùng để phá máy Enigma trong Thế chiến II." : ""}</span>`, "good");
      return;
    }
    S.tried = true;
    G.sound.play("bad");
    const i = wrong[0], c = S.word.charCodeAt(i) ^ S.key;
    const c0 = S.word.charCodeAt(0) ^ S.key, p0 = S.word.charCodeAt(0);
    const tip = S.hiddenKey
      ? `Tìm khóa từ byte đầu trước: K = C ⊕ P = ${G.bits(c0)} ⊕ ${G.bits(p0)} ('${S.word[0]}'). Sau đó XOR từng byte với K.`
      : `Byte ${i + 1}: ${G.bits(c)} ⊕ ${G.bits(S.key)} = ${G.bits(S.word.charCodeAt(i))} = ${S.word.charCodeAt(i)}.`;
    setFeedback(`✗ Còn ${wrong.length} ký tự sai. <span class="detail">${tip}</span>`, "bad");
  }

  /* ---------- Câu hỏi cuối ---------- */
  function setupQuiz() {
    S.mode = "quiz";
    $("#mission").innerHTML = "🎓 Qua hai nhiệm vụ vừa rồi, vì sao <b>không nên dùng lại một khóa ngắn</b> cho nhiều tin nhắn?";
    const w = $("#work");
    w.innerHTML = "";
    const box = el("div", { class: "opts" });
    G.shuffle([
      { t: "Biết một cặp (tin gốc, bản mã) là suy ra khóa K = P ⊕ C, rồi giải mã được mọi tin khác", ok: true },
      { t: "Vì XOR nhiều lần sẽ làm hỏng khóa", ok: false },
      { t: "Vì bản mã sẽ dài gấp đôi tin nhắn", ok: false },
      { t: "Vì XOR chạy quá chậm với khóa ngắn", ok: false },
    ]).forEach((o) => box.append(el("button", { type: "button", class: "opt", text: o.t, onclick: (e) => answerQuiz(e.currentTarget, o.ok) })));
    w.append(box);
    $("#btn-check").hidden = true;
    setFeedback("Chọn một đáp án.");
  }

  function answerQuiz(btn, ok) {
    if (S.done) return;
    if (!ok) { S.tried = true; btn.classList.add("wrong"); btn.disabled = true; G.sound.play("bad"); setFeedback("✗ Chưa đúng, thử lại.", "bad"); return; }
    S.done = true;
    btn.classList.add("right");
    award();
    setFeedback(`✓ Đúng! <span class="detail">Nếu khóa là ngẫu nhiên, dài bằng tin nhắn và <b>chỉ dùng một lần</b> (one-time pad), XOR là mật mã không thể phá, đã được chứng minh bằng toán học. Mọi thuật toán hiện đại như AES cũng dùng XOR ở bên trong.</span>`, "good");
  }

  /* ---------- Chung ---------- */
  function award() {
    S.score += S.tried ? 4 : 10;
    if (!S.tried) S.perfect++;
    $("#hud-score").textContent = S.score;
    G.sound.play("good");
    $("#btn-check").hidden = true;
    $("#btn-next").hidden = false;
    $("#btn-next").focus();
  }

  function check() {
    if (S.done) return;
    if (S.mode === "word") checkWord();
    else if (S.mode !== "quiz") checkBits();
  }

  function finish() {
    const { isNew } = G.progress.record("xor-messenger", S.lv, S.score, LEVELS.length);
    G.showScreen("end");
    $("#end-score").textContent = S.score;
    const all = S.perfect === S.level.rounds;
    $("#end-title").textContent = all ? "Mật mã gia! 🎉" : "Hoàn thành nhiệm vụ!";
    $("#end-detail").textContent = `${S.perfect}/${S.level.rounds} nhiệm vụ đúng ngay lần đầu.` + (isNew ? " Kỷ lục mới!" : "");
    if (all) { G.confetti(); G.sound.play("win"); }
    G.mountNextLink($("#next-game"));
  }

  function setFeedback(html, type = "") {
    const f = $("#feedback");
    f.className = "feedback " + type;
    f.innerHTML = html;
  }

  /* ---------- Chơi theo cặp ---------- */
  const keyBytes = (s) => [...new TextEncoder().encode(s || "\0")];
  function updateSend() {
    const msg = [...new TextEncoder().encode($("#s-msg").value)], k = keyBytes($("#s-key").value);
    const c = msg.map((b, i) => b ^ k[i % k.length]);
    $("#s-out").textContent = c.map(hex).join(" ") || "(trống)";
    $("#s-trace").textContent = msg.map((b, i) => `${ch(b)}  ${G.bits(b)} ⊕ ${G.bits(k[i % k.length])} (${ch(k[i % k.length])}) = ${G.bits(c[i])}  ${hex(c[i])}`).join("\n");
    $("#copy-note").textContent = /[^\x20-\x7e]/.test($("#s-msg").value) ? "⚠️ Có ký tự ngoài ASCII (dấu tiếng Việt) nên mỗi ký tự có thể chiếm nhiều byte." : "";
  }
  function updateRecv() {
    const bytes = ($("#r-hex").value.match(/[0-9a-f]{2}/gi) || []).map((h) => parseInt(h, 16));
    const k = keyBytes($("#r-key").value);
    const p = bytes.map((b, i) => b ^ k[i % k.length]);
    let text;
    try { text = new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(p)); } catch { text = p.map(ch).join(""); }
    $("#r-out").textContent = bytes.length ? text : "(dán bản mã vào ô phía trên)";
  }
  ["#s-msg", "#s-key"].forEach((s) => $(s).addEventListener("input", updateSend));
  ["#r-hex", "#r-key"].forEach((s) => $(s).addEventListener("input", updateRecv));
  G.$$(".tab").forEach((t) => t.addEventListener("click", () => {
    G.$$(".tab").forEach((x) => { x.classList.toggle("sel", x === t); x.classList.toggle("ghost", x !== t); });
    $("#pane-send").hidden = t.dataset.tab !== "send";
    $("#pane-recv").hidden = t.dataset.tab !== "recv";
  }));
  $("#btn-copy").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText($("#s-out").textContent); $("#copy-note").textContent = "✓ Đã sao chép. Gửi cho bạn của bạn nhé!"; }
    catch { $("#copy-note").textContent = "Không sao chép tự động được, hãy bôi đen rồi copy."; }
  });
  $("#btn-pair").addEventListener("click", () => { G.showScreen("pair"); updateSend(); updateRecv(); });
  $("#btn-pair-back").addEventListener("click", () => G.showScreen("start"));

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
