/* ASCII Spy — mã hóa văn bản: ASCII, mẹo 0x20, và giới hạn dẫn tới Unicode/UTF-8. Xem README.md. */
(function () {
  "use strict";
  const { $, el, L } = G;

  const LEVELS = [
    { name: L("Giải mã nhị phân", "Binary decoding"), desc: L("Mỗi ký tự là 8 bit", "Each character is 8 bits"), kind: "decode", fmt: "bin", words: [["HI", "OK", "AI"], ["NEU", "BIT", "CPU"], ["DATA", "CODE", "BYTE"], ["SPY42", "R2D2", "CR7"]] },
    { name: L("Giải mã hex", "Hex decoding"), desc: L("0x48 0x69 … có cả chữ thường", "0x48 0x69 … with lower case too"), kind: "decode", fmt: "hex", words: [["Ok", "Hi"], ["Spy", "Bit"], ["Data", "Code"], ["x=42", "a+b!"]] },
    { name: L("Mẹo 0x20", "The 0x20 trick"), desc: L("Đổi hoa ↔ thường bằng một lần lật bit", "Switch upper ↔ lower case with one bit flip"), kind: "flip",
      tasks: [null, ["hello", "HELLO"], ["DATA", "data"], ["NeU", "nEu"]] },
    { name: L("Kinh tế Quốc dân", "“Kinh tế Quốc dân”"), desc: L("Khi ASCII bất lực, Unicode ra tay", "When ASCII gives up, Unicode steps in"), kind: "viet" }, // i18n-ok: tên riêng
  ];
  const PHRASE = "Kinh tế Quốc dân"; // i18n-ok: nội dung mẫu, cố ý là tiếng Việt
  const QP = `<span data-i18n-skip>${PHRASE}</span>`;
  const utf8 = (s) => new TextEncoder().encode(s);
  const QUIZ = [
    { q: L(`Trong "${QP}", có bao nhiêu ký tự <b>không có</b> trong bảng ASCII?`, `In "${QP}", how many characters are <b>not</b> in the ASCII table?`), opts: ["3", "0", "5", "16"],
      why: L("ế, ố và â có mã Unicode lớn hơn 127, nên ASCII 7 bit không biểu diễn được.", "<span data-i18n-skip>ế, ố</span> and <span data-i18n-skip>â</span> have Unicode codes above 127, so 7-bit ASCII cannot represent them.") },
    { q: L(`Chữ "ế" (U+1EBF) chiếm bao nhiêu byte trong UTF-8?`, `How many bytes does "<span data-i18n-skip>ế</span>" (U+1EBF) take in UTF-8?`), opts: ["3", "1", "2", "4"],
      why: (() => { const eb = [...utf8("ế")].map((b) => b.toString(16).toUpperCase()).join(" "); return L(`UTF-8 dùng 1 byte cho ASCII, 2 byte cho mã tới U+07FF (như â = C3 A2), 3 byte cho mã tới U+FFFF (như ế = ${eb}).`, `UTF-8 uses 1 byte for ASCII, 2 bytes for codes up to U+07FF (like <span data-i18n-skip>â</span> = C3 A2), and 3 bytes up to U+FFFF (like <span data-i18n-skip>ế</span> = ${eb}).`); })() }, // i18n-ok: ký tự mẫu
    { q: L(`Cả chuỗi "${QP}" dài bao nhiêu byte trong UTF-8?`, `How many bytes is the whole string "${QP}" in UTF-8?`), opts: [String(utf8(PHRASE).length), "16", "19", "32"],
      why: L(`16 ký tự, nhưng 13 ký tự ASCII × 1 byte + ế (3) + ố (3) + â (2) = ${utf8(PHRASE).length} byte. Số ký tự ≠ số byte! (Trong Python: len(s) = 16, len(s.encode()) = ${utf8(PHRASE).length}.)`, `16 characters, but 13 ASCII characters × 1 byte + <span data-i18n-skip>ế</span> (3) + <span data-i18n-skip>ố</span> (3) + <span data-i18n-skip>â</span> (2) = ${utf8(PHRASE).length} bytes. Characters ≠ bytes! (In Python: len(s) = 16, len(s.encode()) = ${utf8(PHRASE).length}.)`) },
    { q: L(`Dòng chữ lỗi kiểu "Kinh táº¿ Quá»‘c dÃ¢n" xuất hiện khi nào?`, `When do you see garbled text like "<span data-i18n-skip>Kinh táº¿ Quá»‘c dÃ¢n</span>"?`), opts: [L("Byte UTF-8 bị đọc nhầm bằng bảng mã 1 byte (Latin-1/Windows-1252)", "UTF-8 bytes are misread with a 1-byte encoding (Latin-1/Windows-1252)"), L("File bị nhiễm virus", "The file has a virus"), L("Máy thiếu font tiếng Việt", "The computer lacks a Vietnamese font"), L("Ổ cứng bị hỏng", "The hard drive is broken")],
      why: L("Mỗi byte của ký tự nhiều byte bị hiểu thành một ký tự Latin riêng. Đọc CSV tiếng Việt mà sai encoding là gặp ngay. Trong pandas hãy dùng <code>pd.read_csv(f, encoding=\"utf-8\")</code>.", "Each byte of a multi-byte character is read as a separate Latin character. Read a Vietnamese CSV with the wrong encoding and you get exactly this. In pandas use <code>pd.read_csv(f, encoding=\"utf-8\")</code>.") },
    { q: L("Vì sao UTF-8 thành bảng mã phổ biến nhất trên web?", "Why did UTF-8 become the most popular encoding on the web?"), opts: [L("Tương thích ASCII: ký tự ASCII vẫn đúng 1 byte như cũ", "ASCII-compatible: ASCII characters are still exactly 1 byte"), L("Luôn dùng đúng 1 byte cho mỗi ký tự", "It always uses exactly 1 byte per character"), L("Chỉ hỗ trợ tiếng Anh nên nhanh hơn", "It only supports English, so it is faster"), L("Nén dữ liệu tốt nhất", "It compresses data best")],
      why: L("Mọi file ASCII cũ đều là file UTF-8 hợp lệ, trong khi vẫn biểu diễn được toàn bộ Unicode (hơn 150 000 ký tự, cả emoji 😀).", "Every old ASCII file is a valid UTF-8 file, yet UTF-8 can still represent all of Unicode (over 150 000 characters, emoji 😀 included).") },
  ];

  const S = { lv: 0, level: null, i: 0, n: 0, score: 0, perfect: 0, tried: false, done: false, word: "", rows: [], flips: 0, target: "" };

  const code = (c, fmt) => (fmt === "hex" ? "0x" + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0") : G.bits(c.charCodeAt(0)));
  const anchorOf = (v) => (v >= 97 ? ["a", 97] : v >= 65 ? ["A", 65] : v >= 48 ? ["0", 48] : null);

  function buildAsciiTable() {
    const g = $("#ascii-grid");
    for (let v = 32; v <= 126; v++) {
      g.append(el("div", { class: "cell", html: `<b>${v === 32 ? "␣" : String.fromCharCode(v).replace("<", "&lt;").replace("&", "&amp;")}</b><small>${v} · ${v.toString(16).toUpperCase()}</small>` }));
    }
  }

  function startLevel(i) {
    S.lv = i; S.level = LEVELS[i]; S.i = 0; S.score = 0; S.perfect = 0;
    S.n = S.level.kind === "decode" ? S.level.words.length : S.level.kind === "flip" ? S.level.tasks.length : QUIZ.length;
    $("#hud-level").textContent = i + 1;
    ["decode", "flip", "viet"].forEach((p) => { $("#p-" + p).hidden = S.level.kind !== p; });
    $("#ascii-table").open = S.level.kind === "decode";
    G.showScreen("play");
    if (S.level.kind === "viet") renderEncoder();
    showMission();
  }

  function showMission() {
    if (S.i >= S.n) return finish();
    S.tried = false; S.done = false;
    $("#hud-round").textContent = `${S.i + 1}/${S.n}`;
    $("#hud-score").textContent = S.score;
    $("#btn-next").hidden = true;
    $("#btn-check").hidden = S.level.kind === "viet";
    if (S.level.kind === "decode") missionDecode();
    else if (S.level.kind === "flip") missionFlip();
    else missionQuiz();
  }

  /* ================= Giải mã ================= */
  function missionDecode() {
    S.word = G.pick(S.level.words[S.i]);
    const hex = S.level.fmt === "hex";
    $("#mission").innerHTML = L(`📡 Tin nhắn chặn được #${S.i + 1}: ${S.word.length} byte, dạng ${hex ? "hệ 16" : "nhị phân"}. Gõ từng ký tự vào ô.`, `📡 Intercepted message #${S.i + 1}: ${S.word.length} bytes in ${hex ? "hex" : "binary"}. Type each character in its box.`);
    const box = $("#intercept");
    box.innerHTML = "";
    [...S.word].forEach((c, k) => box.append(el("div", { class: "cipher" }, [
      el("span", { class: "code", text: code(c, S.level.fmt) }),
      el("input", { maxlength: 1, autocomplete: "off", autocapitalize: "off", spellcheck: "false", "aria-label": L(`Ký tự ${k + 1}`, `Character ${k + 1}`), oninput: onCharInput }),
      el("span", { class: "dec" }),
    ])));
    $("#btn-check").textContent = L("Giải mã", "Decode");
    setFeedback(hex ? L("Đổi hex ra thập phân: 0x4B = 4 × 16 + 11 = 75, rồi tra bảng.", "Convert hex to decimal: 0x4B = 4 × 16 + 11 = 75, then look it up.") : L("Đổi 8 bit ra thập phân rồi tra bảng. Mẹo: 010xxxxx là chữ hoa, 011xxxxx là chữ thường, 0011xxxx là chữ số.", "Convert the 8 bits to decimal, then look it up. Tip: 010xxxxx is upper case, 011xxxxx lower case, 0011xxxx a digit."));
    $("input", box).focus();
  }

  function onCharInput(e) {
    e.target.classList.remove("ok", "err");
    if (e.target.value) {
      const next = e.target.closest(".cipher").nextElementSibling;
      if (next) $("input", next).focus();
    }
  }

  function checkDecode() {
    const boxes = G.$$(".cipher");
    let wrong = [];
    boxes.forEach((b, k) => {
      const c = S.word[k], inp = $("input", b), ok = inp.value === c;
      inp.classList.toggle("ok", ok); inp.classList.toggle("err", !ok);
      if (!ok) wrong.push(k);
    });
    if (!wrong.length) {
      S.done = true;
      boxes.forEach((b, k) => { const v = S.word.charCodeAt(k); $(".dec", b).textContent = `${v} → ${S.word[k]}`; });
      const gained = 2 * S.word.length + (S.tried ? 0 : 5);
      S.score += gained; if (!S.tried) S.perfect++;
      $("#hud-score").textContent = S.score;
      G.sound.play("good");
      setFeedback(`✓ ${L("Giải mã thành công", "Decoded")}: <b class="mono">${S.word}</b>. +${gained}`, "good");
      $("#btn-check").hidden = true;
      $("#btn-next").hidden = false;
      $("#btn-next").focus();
      return;
    }
    S.tried = true;
    G.sound.play("bad");
    const k = wrong[0], c = S.word[k], v = c.charCodeAt(0), a = anchorOf(v);
    const typed = $("input", boxes[k]).value;
    let tip = `${L("Ký tự thứ", "Character")} ${k + 1}: ${code(c, S.level.fmt)} = <b>${v}</b>`;
    if (a) tip += ` = '${a[0]}' (${a[1]}) + ${v - a[1]}`;
    if (typed && typed.toLowerCase() === c.toLowerCase() && typed !== c) tip += L(`. Chú ý hoa/thường: 'A' = 65 nhưng 'a' = 97.`, `. Mind the case: 'A' = 65 but 'a' = 97.`);
    setFeedback(`✗ ${L(`Còn ${wrong.length} ký tự sai.`, `${wrong.length} characters still wrong.`)} <span class="detail">${tip}</span>`, "bad");
  }

  /* ================= Lật bit 0x20 ================= */
  function missionFlip() {
    const task = S.level.tasks[S.i];
    const box = $("#flip-rows");
    box.innerHTML = "";
    S.flips = 0;
    $("#flip-count").textContent = "";
    $("#btn-check").textContent = L("Kiểm tra", "Check");
    if (!task) {
      // Khám phá: 'A' và 'a' khác nhau ở bit nào?
      $("#mission").innerHTML = L(`🔎 So sánh 'A' và 'a'. <b>Bấm vào bit của 'a' khác với 'A'.</b>`, `🔎 Compare 'A' and 'a'. <b>Click the bit of 'a' that differs from 'A'.</b>`);
      box.append(weightsRow());
      box.append(flipRow("A", null, false));
      box.append(flipRow("a", null, true, true));
      $("#btn-check").hidden = true;
      setFeedback(L("Chỉ có đúng một bit khác nhau. Tìm nó!", "Exactly one bit differs. Find it!"));
      return;
    }
    const [from, to] = task;
    S.word = from; S.target = to;
    S.rows = [...from].map((c) => c.charCodeAt(0));
    $("#mission").innerHTML = L(`🛠️ Biến <b class="mono">"${from}"</b> thành <b class="mono">"${to}"</b> bằng cách lật bit, càng ít lần càng tốt.`, `🛠️ Turn <b class="mono">"${from}"</b> into <b class="mono">"${to}"</b> by flipping bits, as few times as possible.`);
    box.append(weightsRow());
    S.rows.forEach((v, k) => box.append(flipRow(null, k, true)));
    updateFlip();
    setFeedback(L("Bit tô viền cam là bit có trọng số 32 (0x20).", "The orange-outlined bit has weight 32 (0x20)."));
  }

  function weightsRow() {
    return el("div", { class: "weights-row" }, [128, 64, 32, 16, 8, 4, 2, 1].map((w) => el("span", { text: w })));
  }

  function flipRow(fixedChar, k, clickable, discovery = false) {
    const v = fixedChar ? fixedChar.charCodeAt(0) : S.rows[k];
    const bits = el("div", { class: "bits" });
    [...G.bits(v)].forEach((b, i) => {
      const cls = "fb" + (b === "1" ? " one" : "") + (!discovery && !fixedChar && i === 2 ? " col5" : "");
      const btn = el(clickable ? "button" : "span", { class: cls, text: b, type: clickable ? "button" : null });
      if (clickable) btn.addEventListener("click", () => (discovery ? pickDiff(btn, i) : toggleBit(k, i)));
      bits.append(btn);
    });
    const ch = fixedChar || String.fromCharCode(v);
    return el("div", { class: "frow", "data-k": k ?? "" }, [
      el("span", { class: "lbl", text: fixedChar ? `'${fixedChar}' = ${v}` : `${L("ký tự", "char")} ${k + 1}` }),
      bits,
      el("span", { class: "ch", text: ch }),
      k != null ? el("span", { class: "arrow", text: "→" }) : null,
      k != null ? el("span", { class: "want", text: S.target[k] }) : null,
    ]);
  }

  function pickDiff(btn, i) {
    if (S.done) return;
    if (i === 2) {
      S.done = true;
      btn.classList.add("hit");
      if (!S.tried) { S.score += 10; S.perfect++; }
      $("#hud-score").textContent = S.score;
      G.sound.play("good");
      setFeedback(L(`✓ Chính là bit có trọng số <b>32 = 0x20</b>! 'a' = 97 = 65 + 32. Mọi cặp chữ hoa/thường đều cách nhau đúng 32.
        <span class="detail">Lật bit này là đổi hoa ↔ thường. Trong code: <code>c ^ 0x20</code> (XOR) để đảo, <code>c &amp; ~0x20</code> để thành hoa, <code>c | 0x20</code> để thành thường.</span>`,
        `✓ It is the bit of weight <b>32 = 0x20</b>! 'a' = 97 = 65 + 32. Every upper/lower pair is exactly 32 apart.
        <span class="detail">Flipping this bit switches case. In code: <code>c ^ 0x20</code> (XOR) to toggle, <code>c &amp; ~0x20</code> for upper case, <code>c | 0x20</code> for lower case.</span>`), "good");
      $("#btn-next").hidden = false;
      $("#btn-next").focus();
    } else {
      S.tried = true;
      G.shake(btn);
      G.sound.play("bad");
      setFeedback(L("✗ Bit đó của 'A' và 'a' giống nhau. So từng cột với dòng trên.", "✗ That bit is the same in 'A' and 'a'. Compare each column with the row above."), "bad");
    }
  }

  function toggleBit(k, i) {
    if (S.done) return;
    S.rows[k] ^= 1 << (7 - i);
    S.flips++;
    G.sound.play("tick");
    const row = $(`.frow[data-k="${k}"]`);
    row.replaceWith(flipRow(null, k, true));
    updateFlip();
  }

  function updateFlip() {
    const minimal = [...S.word].filter((c, k) => c !== S.target[k]).length;
    G.$$(".frow[data-k]").forEach((r) => {
      const k = r.dataset.k;
      if (k === "") return;
      $(".ch", r).classList.toggle("ok", String.fromCharCode(S.rows[k]) === S.target[k]);
    });
    $("#flip-count").textContent = L(`Đã lật ${S.flips} lần · tối thiểu cần ${minimal} lần`, `${S.flips} flips so far · minimum needed: ${minimal}`);
  }

  function checkFlip() {
    const now = S.rows.map((v) => String.fromCharCode(v)).join("");
    const minimal = [...S.word].filter((c, k) => c !== S.target[k]).length;
    if (now !== S.target) {
      S.tried = true;
      G.sound.play("bad");
      setFeedback(L(`✗ Hiện đang là <b class="mono">"${now}"</b>, chưa phải "${S.target}".`, `✗ It currently reads <b class="mono">"${now}"</b>, not "${S.target}" yet.`), "bad");
      return;
    }
    S.done = true;
    const extra = S.flips - minimal;
    const gained = extra <= 0 ? 15 : Math.max(5, 15 - 2 * extra);
    S.score += gained; if (extra <= 0 && !S.tried) S.perfect++;
    $("#hud-score").textContent = S.score;
    G.sound.play("good");
    setFeedback(extra <= 0 ? L(`✓ Hoàn hảo: ${S.flips} lần lật, mỗi chữ đúng một bit! +${gained}`, `✓ Perfect: ${S.flips} flips, exactly one bit per letter! +${gained}`) : L(`✓ Xong, nhưng lật thừa ${extra} lần. +${gained} <span class="detail">Mỗi chữ chỉ cần lật đúng bit 0x20.</span>`, `✓ Done, but with ${extra} extra flips. +${gained} <span class="detail">Each letter only needs its 0x20 bit flipped.</span>`), "good");
    $("#btn-check").hidden = true;
    $("#btn-next").hidden = false;
    $("#btn-next").focus();
  }

  /* ================= Tiếng Việt ================= */
  function renderEncoder() {
    const text = $("#viet-in").value;
    const chars = [...text];
    const CH = L("Ký tự", "Char");
    const rows = { [CH]: [], "Unicode": [], "ASCII (7 bit)": [], "UTF-8 (hex)": [] };
    chars.forEach((c) => {
      const cp = c.codePointAt(0);
      rows[CH].push({ t: c === " " ? "␣" : c, cls: "ch" });
      rows["Unicode"].push({ t: "U+" + cp.toString(16).toUpperCase().padStart(4, "0"), cls: "mono" });
      rows["ASCII (7 bit)"].push(cp < 128 ? { t: cp.toString(2).padStart(7, "0"), cls: "mono" } : { t: "❌ > 127", cls: "bad" });
      rows["UTF-8 (hex)"].push({ t: [...utf8(c)].map((b) => b.toString(16).toUpperCase().padStart(2, "0")).join(" "), cls: "mono" + (cp >= 128 ? " bad" : "") });
    });
    const tbl = $("#enc-table");
    tbl.innerHTML = "";
    for (const [name, cells] of Object.entries(rows)) {
      tbl.append(el("tr", {}, [el("th", { text: name }), ...cells.map((c) => el("td", { class: c.cls, text: c.t }))]));
    }
    const bad = chars.filter((c) => c.codePointAt(0) > 127).length;
    let moji = "";
    try { moji = new TextDecoder("windows-1252").decode(utf8(text)); } catch { moji = ""; }
    $("#mojibake").innerHTML = L(`${chars.length} ký tự · ${utf8(text).length} byte UTF-8 · <b style="color:var(--bad)">${bad} ký tự ASCII không mã hóa được</b>`, `${chars.length} characters · ${utf8(text).length} UTF-8 bytes · <b style="color:var(--bad)">${bad} characters ASCII cannot encode</b>`)
      + (moji && bad ? `<br>${L("Nếu máy đọc các byte UTF-8 này bằng bảng mã 1 byte (Windows-1252)", "If a computer reads these UTF-8 bytes with a 1-byte encoding (Windows-1252)")}: <code data-i18n-skip>${moji.replace(/</g, "&lt;")}</code> 😱` : "");
  }

  function missionQuiz() {
    const Q = QUIZ[S.i];
    $("#mission").innerHTML = S.i === 0
      ? L(`✉️ Nhiệm vụ cuối: gửi tin nhắn "<b>${PHRASE}</b>" bằng ASCII. Xem bảng mã hóa bên dưới (bạn có thể sửa tin nhắn), rồi trả lời câu hỏi.`, `✉️ Final mission: send the message "<b>${QP}</b>" (National Economics University) in ASCII. Study the encoding table below (you can edit the message), then answer the questions.`)
      : `✉️ ${L("Câu hỏi", "Question")} ${S.i + 1}/${QUIZ.length}`;
    const box = $("#quiz");
    box.innerHTML = "";
    box.append(el("div", { class: "q", html: Q.q }));
    const opts = el("div", { class: "opts" });
    G.shuffle(Q.opts.map((t, k) => ({ t, k }))).forEach((o) => opts.append(el("button", {
      type: "button", class: "opt", text: o.t, onclick: (e) => answerQuiz(e.currentTarget, o.k === 0),
    })));
    box.append(opts);
    setFeedback(L("Chọn một đáp án.", "Pick an answer."));
  }

  function answerQuiz(btn, right) {
    if (S.done) return;
    if (right) {
      S.done = true;
      btn.classList.add("right");
      if (!S.tried) { S.score += 10; S.perfect++; }
      $("#hud-score").textContent = S.score;
      G.sound.play("good");
      setFeedback(`✓ ${L("Đúng!", "Correct!")} <span class="detail">${QUIZ[S.i].why}</span>`, "good");
      $("#btn-next").hidden = false;
      $("#btn-next").focus();
    } else {
      S.tried = true;
      btn.classList.add("wrong");
      btn.disabled = true;
      G.sound.play("bad");
      setFeedback(L("✗ Chưa đúng. Gợi ý: nhìn bảng mã hóa phía trên.", "✗ Not quite. Hint: look at the encoding table above."), "bad");
    }
  }

  /* ================= Chung ================= */
  function check() {
    if (S.done) return;
    if (S.level.kind === "decode") checkDecode();
    else if (S.level.kind === "flip" && S.level.tasks[S.i]) checkFlip();
  }

  function finish() {
    const { isNew } = G.progress.record("ascii-spy", S.lv, S.score, LEVELS.length);
    G.showScreen("end");
    $("#end-score").textContent = S.score;
    const all = S.perfect === S.n;
    $("#end-title").textContent = all ? L("Điệp viên hạng A! 🎉", "Top-class spy! 🎉") : L("Hoàn thành nhiệm vụ!", "Missions complete!");
    $("#end-detail").textContent = L(`${S.perfect}/${S.n} nhiệm vụ hoàn hảo.`, `${S.perfect}/${S.n} perfect missions.`) + (isNew ? L(" Kỷ lục mới!", " New best!") : "");
    if (all) { G.confetti(); G.sound.play("win"); }
    G.mountNextLink($("#next-game"));
  }

  function setFeedback(html, type = "") {
    const f = $("#feedback");
    f.className = "feedback " + type;
    f.innerHTML = html;
  }

  $("#viet-in").addEventListener("input", renderEncoder);
  document.addEventListener("keydown", (e) => {
    if ($("[data-screen=play]").hidden || e.key !== "Enter" || e.target.id === "viet-in") return;
    e.preventDefault();
    if (S.done) { S.i++; showMission(); } else check();
  });
  $("#btn-check").addEventListener("click", check);
  $("#btn-next").addEventListener("click", () => { S.i++; showMission(); });
  $("#btn-again").addEventListener("click", () => startLevel(S.lv));
  $("#btn-menu").addEventListener("click", () => { G.renderLevels($("#levels"), LEVELS, startLevel); G.showScreen("start"); });

  buildAsciiTable();
  G.renderLevels($("#levels"), LEVELS, startLevel);
})();
