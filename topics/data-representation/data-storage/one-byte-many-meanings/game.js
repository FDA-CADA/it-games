/* One Byte, Many Meanings — cùng bit pattern, khác cách diễn giải. Xem README.md. */
(function () {
  "use strict";
  const { $, el } = G;

  const LEVELS = [
    { name: "Byte dương", desc: "0–127: bit dấu = 0", gen: "pos", rounds: 5 },
    { name: "Bit dấu bật", desc: "128–255: hai kính số bắt đầu khác nhau", gen: "neg", rounds: 5 },
    { name: "Hỗn hợp", desc: "Có cả ký tự điều khiển", gen: "mix", rounds: 6 },
    { name: "Không tra bảng", desc: "Ẩn bảng tra nhanh", gen: "mix", rounds: 6, noCheat: true },
  ];
  const CONTROL = { 0: "NUL", 7: "BEL", 8: "BS", 9: "TAB", 10: "LF (xuống dòng)", 13: "CR", 27: "ESC", 127: "DEL" };
  const NONE = "none";

  const S = { lv: 0, level: null, round: 0, score: 0, perfect: 0, v: 0, pickA: null, pickG: null, done: false, used: new Set() };

  const printable = (v) => v >= 32 && v <= 126;
  const charLabel = (v) => (v === 32 ? "␣" : String.fromCharCode(v));

  function genByte() {
    const g = S.level.gen;
    let v, tries = 0;
    do {
      if (g === "pos") v = G.pick([G.randInt(65, 90), G.randInt(97, 122), G.randInt(48, 57), G.randInt(33, 47)]);
      else if (g === "neg") v = G.randInt(128, 255);
      else v = G.pick([G.randInt(0, 31), G.randInt(32, 126), G.randInt(128, 255), G.randInt(128, 255), G.randInt(65, 122)]);
    } while (S.used.has(v) && ++tries < 50);
    S.used.add(v);
    return v;
  }

  function startLevel(i) {
    S.lv = i; S.level = LEVELS[i]; S.round = 0; S.score = 0; S.perfect = 0; S.used.clear();
    $("#hud-level").textContent = i + 1;
    $("#cheat").hidden = !!S.level.noCheat;
    $("#cheat").open = i === 0;
    G.showScreen("play");
    nextRound();
  }

  function nextRound() {
    if (S.round >= S.level.rounds) return finish();
    S.round++; S.done = false; S.pickA = null; S.pickG = null;
    S.v = genByte();
    $("#hud-round").textContent = `${S.round}/${S.level.rounds}`;
    $("#hud-score").textContent = S.score;
    const bits = G.bits(S.v);
    $("#byte").innerHTML = "";
    [...bits].forEach((b, i) => $("#byte").append(el("span", { class: (b === "1" ? "one" : "") + (i === 0 ? " sign" : ""), text: b })));
    G.$$(".lens").forEach((l) => { l.classList.remove("ok", "no"); $(".verdict", l).innerHTML = ""; });
    ["#in-u", "#in-s"].forEach((s) => { $(s).value = ""; $(s).disabled = false; });
    buildAsciiOpts();
    buildGrayOpts();
    $("#btn-check").hidden = false;
    $("#btn-next").hidden = true;
    setFeedback("Điền cả 4 kính rồi bấm <b>Kiểm tra</b> (<kbd>Enter</kbd>).");
    $("#in-u").focus();
  }

  /* ---------- Kính ASCII: đáp án nhiễu theo lỗi hay gặp ---------- */
  function buildAsciiOpts() {
    const v = S.v, right = printable(v) ? v : NONE;
    const cands = [];
    if (v >= 128 && printable(v & 0x7f)) cands.push(v & 0x7f);        // bỏ qua bit đầu
    if (printable(v ^ 0x20)) cands.push(v ^ 0x20);                      // nhầm hoa/thường
    [v + 1, v - 1, v + 2, v - 16, v + 32].forEach((c) => printable(c) && cands.push(c));
    [48 + (v % 10), 65 + (v % 26), 97 + (v % 26)].forEach((c) => cands.push(c));
    const opts = [right];
    if (right !== NONE) opts.push(NONE);
    for (const c of G.shuffle([...new Set(cands)])) if (opts.length < 4 && !opts.includes(c)) opts.push(c);
    const box = $("#opts-a");
    box.innerHTML = "";
    G.shuffle(opts).forEach((o) => box.append(el("button", {
      type: "button", class: "opt" + (o === NONE ? " small" : ""), "data-v": o,
      text: o === NONE ? "Không có ký tự in được" : charLabel(o),
      onclick: (e) => select("#opts-a", e.currentTarget, "pickA"),
    })));
  }

  /* ---------- Kính pixel xám ---------- */
  function buildGrayOpts() {
    const v = S.v, opts = [v];
    const cands = G.shuffle([255 - v, v + 64, v - 64, v + 128, v - 128, v + 96, v - 96, 0, 255, 128].filter((c) => c >= 0 && c <= 255));
    for (const c of cands) if (opts.length < 4 && opts.every((o) => Math.abs(o - c) >= 40)) opts.push(c);
    let guard = 0;
    while (opts.length < 4 && guard++ < 200) { const c = G.randInt(0, 255); if (opts.every((o) => Math.abs(o - c) >= 30)) opts.push(c); }
    const box = $("#opts-g");
    box.innerHTML = "";
    G.shuffle(opts).forEach((o) => box.append(el("button", {
      type: "button", class: "opt", "data-v": o, "aria-label": "Ô xám", style: `background: rgb(${o},${o},${o})`,
      onclick: (e) => select("#opts-g", e.currentTarget, "pickG"),
    })));
  }

  function select(boxSel, btn, key) {
    if (S.done) return;
    G.$$(".opt", $(boxSel)).forEach((b) => b.classList.remove("sel"));
    btn.classList.add("sel");
    S[key] = btn.dataset.v;
    G.sound.play("tick");
  }

  const parseNum = (s) => { s = s.trim().replace(/[−–]/g, "-"); return /^-?\d+$/.test(s) ? parseInt(s, 10) : NaN; };

  function check() {
    if (S.done) return;
    const u = parseNum($("#in-u").value), s = parseNum($("#in-s").value);
    if (isNaN(u) || isNaN(s) || S.pickA == null || S.pickG == null) {
      setFeedback("Bạn cần điền đủ cả 4 kính trước khi kiểm tra.", "warn");
      return;
    }
    S.done = true;
    const v = S.v, bits = G.bits(v), sv = G.signed(bits);
    const terms = [...bits].map((b, i) => (b === "1" ? 2 ** (7 - i) : 0)).filter(Boolean);
    const rightA = printable(v) ? String(v) : NONE;

    const res = {
      u: [u === v, `${terms.join(" + ") || "0"} = <b>${v}</b>`],
      s: [s === sv, bits[0] === "0" ? `Bit dấu = 0 nên giống unsigned: <b>${sv}</b>`
        : `Bit dấu = 1 nên ${v} − 256 = <b>${sv}</b>` + (s === v - 128 ? ". (Không phải bỏ bit dấu rồi thêm dấu trừ, đó là sign-magnitude.)" : "")],
      a: [S.pickA === rightA, asciiWhy(v)],
      g: [Number(S.pickG) === v, `Độ sáng ${v}/255 ≈ ${Math.round((v / 255) * 100)}%` + (Number(S.pickG) === 255 - v ? ". Bạn chọn ngược: 0 là đen, 255 là trắng." : "")],
    };
    let ok = 0;
    for (const [k, [good, why]] of Object.entries(res)) {
      const lens = $(`.lens[data-lens="${k}"]`);
      lens.classList.add(good ? "ok" : "no");
      $(".verdict", lens).innerHTML = (good ? "✓ " : "✗ ") + why;
      if (good) ok++;
    }
    ["#in-u", "#in-s"].forEach((q) => { $(q).disabled = true; });
    $(`#opts-a .opt[data-v="${rightA}"]`).classList.add("right");
    G.$$("#opts-g .opt").forEach((b) => { b.append(el("span", { class: "val", text: b.dataset.v })); if (Number(b.dataset.v) === v) b.classList.add("right"); });

    const gained = ok * 5 + (ok === 4 ? 5 : 0);
    S.score += gained;
    if (ok === 4) S.perfect++;
    $("#hud-score").textContent = S.score;
    G.sound.play(ok === 4 ? "good" : "bad");
    setFeedback(`${ok === 4 ? "🎉 Đúng cả 4 kính!" : `Đúng ${ok}/4 kính.`} +${gained} điểm
      <span class="detail">Cùng một pattern <b class="mono">${bits}</b> (0x${v.toString(16).toUpperCase().padStart(2, "0")}), bốn ý nghĩa khác nhau. Máy tính không tự biết byte này là gì. Chương trình quyết định cách đọc nó.</span>`, ok === 4 ? "good" : "warn");
    $("#btn-check").hidden = true;
    $("#btn-next").hidden = false;
    $("#btn-next").focus();
  }

  function asciiWhy(v) {
    if (v >= 128) return `${v} > 127: ASCII chỉ có 7 bit (0–127) nên byte này <b>không phải ký tự ASCII</b>.` + (printable(v & 0x7f) ? ` Bỏ qua bit đầu sẽ ra '${charLabel(v & 0x7f)}', nhưng như thế là đọc sai.` : "");
    if (!printable(v)) return `Mã ${v} là ký tự điều khiển${CONTROL[v] ? ` <b>${CONTROL[v]}</b>` : ""}, không in ra màn hình được.`;
    const anchor = v >= 97 ? ["a", 97] : v >= 65 ? ["A", 65] : v >= 48 ? ["0", 48] : [" ", 32];
    return `Mã ${v} = '${anchor[0] === " " ? "space" : anchor[0]}' (${anchor[1]}) + ${v - anchor[1]} → <b>'${charLabel(v)}'</b>`;
  }

  function finish() {
    const { isNew } = G.progress.record("one-byte-many-meanings", S.lv, S.score, LEVELS.length);
    G.showScreen("end");
    $("#end-score").textContent = S.score;
    const all = S.perfect === S.level.rounds;
    $("#end-title").textContent = all ? "Thám tử bit! 🎉" : "Hoàn thành level!";
    $("#end-detail").textContent = `${S.perfect}/${S.level.rounds} vòng đúng cả 4 kính.` + (isNew ? " Kỷ lục mới!" : "");
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
