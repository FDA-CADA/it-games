/* Remainder Tower — đổi thập phân sang hệ r bằng chia liên tiếp. Xem README.md. */
(function () {
  "use strict";
  const { $, el } = G;

  const LEVELS = [
    { name: "Nhị phân nhỏ", desc: "10–63 sang hệ 2", bases: [2], min: 10, max: 63, rounds: 4 },
    { name: "Một byte", desc: "64–255 sang hệ 2", bases: [2], min: 64, max: 255, rounds: 4 },
    { name: "Bát phân", desc: "65–999 sang hệ 8", bases: [8], min: 65, max: 999, rounds: 4 },
    { name: "Thập lục phân", desc: "200–4095 sang hệ 16", bases: [16], min: 200, max: 4095, rounds: 4 },
    { name: "Hỗn hợp", desc: "Hệ 2, 8, 16 ngẫu nhiên", bases: [2, 8, 16], min: 100, max: 2000, rounds: 5 },
  ];

  const S = {
    lv: 0, level: null, round: 0, score: 0, perfectRounds: 0,
    n: 0, base: 2, steps: [], k: 0, stepErr: false, dirErr: false, roundErr: false, phase: "divide",
  };

  const autoQ = () => $("#opt-auto").checked;
  $("#opt-auto").checked = G.store.get("remainder-tower:auto", false);
  $("#opt-auto").addEventListener("change", (e) => G.store.set("remainder-tower:auto", e.target.checked));

  function startLevel(i) {
    S.lv = i; S.level = LEVELS[i]; S.round = 0; S.score = 0; S.perfectRounds = 0;
    $("#hud-level").textContent = i + 1;
    G.showScreen("play");
    nextRound();
  }

  /** Chọn số sao cho đọc xuôi và đọc ngược cho kết quả khác nhau. */
  function pickNumber(base) {
    let n, s, tries = 0;
    do {
      n = G.randInt(S.level.min, S.level.max);
      s = G.toBase(n, base);
    } while (s === s.split("").reverse().join("") && ++tries < 100);
    return n;
  }

  function nextRound() {
    if (S.round >= S.level.rounds) return finish();
    S.round++;
    S.base = G.pick(S.level.bases);
    S.n = pickNumber(S.base);
    S.steps = [];
    let d = S.n;
    while (d > 0) { S.steps.push({ d, q: Math.floor(d / S.base), r: d % S.base }); d = Math.floor(d / S.base); }
    S.k = 0; S.phase = "divide"; S.dirErr = false; S.roundErr = false;

    $("#hud-round").textContent = `${S.round}/${S.level.rounds}`;
    $("#hud-score").textContent = S.score;
    $("#task").innerHTML = `Đổi <span class="num">${S.n}</span><sub>10</sub> sang hệ <span class="num">${S.base}</span>`;
    G.$$(".step", $("#ladder")).forEach((s) => s.remove());
    $("#read-phase").hidden = true;
    G.$$(".dir").forEach((b) => { b.classList.remove("picked-wrong"); b.disabled = false; });
    $("#result").hidden = true;
    $("#btn-next").hidden = true;
    setFeedback(`Dòng đầu tiên: chia ${S.n} cho ${S.base}.`);
    addStepRow();
  }

  function addStepRow() {
    const st = S.steps[S.k];
    S.stepErr = false;
    const wide = st.q >= 1000 ? " wide" : "";
    const qIn = autoQ()
      ? el("span", { class: "q", text: st.q })
      : el("input", { class: "qin" + wide, inputmode: "numeric", "aria-label": "Thương", autocomplete: "off" });
    const rIn = el("input", { class: "rin", inputmode: S.base === 16 ? "text" : "numeric", "aria-label": "Số dư", autocomplete: "off", maxlength: 2 });
    const eq = el("div", { class: "eq" }, [
      el("span", { class: "d", text: st.d }), el("span", { class: "op", text: "÷" }), el("span", { text: S.base }),
      el("span", { class: "op", text: "=" }), qIn, el("span", { class: "op", text: "dư" }), rIn,
    ]);
    const row = el("div", { class: "step" }, [eq, el("div", { class: "slot" })]);
    $("#ladder").append(row);
    [qIn, rIn].forEach((inp) => inp.tagName === "INPUT" && inp.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      if (inp === qIn && !rIn.value) rIn.focus(); else submitStep();
    }));
    (autoQ() ? rIn : qIn).focus();
  }

  function parseRemainder(str) {
    str = str.trim().toUpperCase();
    if (/^\d+$/.test(str)) return { v: parseInt(str, 10), typedDecimal: str.length > 1 };
    if (/^[A-F]$/.test(str)) return { v: G.digitValue(str), typedDecimal: false };
    return { v: NaN };
  }

  function submitStep() {
    if (S.phase !== "divide") return;
    const st = S.steps[S.k];
    const row = G.$$(".step", $("#ladder"))[S.k];
    const qIn = $(".qin", row), rIn = $(".rin", row);
    const q = qIn ? parseInt(qIn.value, 10) : st.q;
    const r = parseRemainder(rIn.value);
    const qOk = q === st.q, rOk = r.v === st.r;
    if (qIn) qIn.classList.toggle("err", !qOk);
    rIn.classList.toggle("err", !rOk);

    if (!qOk || !rOk) {
      S.stepErr = true; S.roundErr = true;
      G.sound.play("bad");
      G.shake($(".eq", row));
      let msg;
      if (!qOk) msg = `Thương là phần nguyên của ${st.d} ÷ ${S.base}. Thử: ${S.base} × ? ≤ ${st.d}, lấy số lớn nhất.`;
      else if (r.v >= S.base) msg = `Số dư luôn nhỏ hơn cơ số ${S.base}.`;
      else msg = `Số dư = ${st.d} − ${st.q} × ${S.base} = ?`;
      setFeedback(msg, "bad");
      return;
    }

    // Đúng: khóa dòng, thả khối số dư xuống tháp
    if (!S.stepErr) S.score += 5;
    $("#hud-score").textContent = S.score;
    G.sound.play("pop");
    const eq = $(".eq", row);
    if (qIn) qIn.replaceWith(el("span", { class: "q", text: st.q }));
    rIn.replaceWith(el("span", { class: "r", text: st.r }));
    const digit = G.digitChar(st.r);
    $(".slot", row).append(el("div", { class: "block", html: digit + (st.r >= 10 ? `<small>${st.r}</small>` : "") }));
    let note = "";
    if (S.base === 16 && st.r >= 10) note = r.typedDecimal ? ` Lưu ý: trong hệ 16, số dư ${st.r} được viết là <b>${digit}</b>.` : ` (${digit} = ${st.r})`;
    eq.dataset.done = "1";

    S.k++;
    if (S.k < S.steps.length) {
      setFeedback(`✓ Đúng!${note} Thương ${st.q} trở thành số bị chia của dòng tiếp theo.`, "good");
      addStepRow();
    } else {
      S.phase = "read";
      setFeedback(`✓ Thương bằng 0, dừng chia.${note}`, "good");
      $("#read-phase").hidden = false;
      G.$$(".dir")[0].focus();
    }
  }

  const readStr = (dir) => {
    const ds = S.steps.map((s) => G.digitChar(s.r));
    return (dir === "up" ? ds.reverse() : ds).join("");
  };

  function pickDirection(dir, btn) {
    if (S.phase !== "read") return;
    if (dir === "down") {
      S.dirErr = true; S.roundErr = true;
      btn.classList.add("picked-wrong");
      btn.disabled = true;
      G.sound.play("bad");
      const s = readStr("down"), v = parseInt(s, S.base);
      G.$$(".block").forEach((b) => b.classList.add("wrongpath"));
      setTimeout(() => G.$$(".block").forEach((b) => b.classList.remove("wrongpath")), 900);
      setFeedback(`✗ Đọc từ trên xuống cho ${G.based(s, S.base)} = <b>${v}</b><sub>10</sub>, không phải ${S.n}!`
        + `<span class="detail">Số dư đầu tiên là chữ số <b>hàng đơn vị</b> (${S.base}${G.SUP(0)}), nên nó phải đứng ở <b>cuối cùng bên phải</b>. Thử hướng còn lại.</span>`, "bad");
      return;
    }
    S.phase = "done";
    if (!S.dirErr) S.score += 15;
    if (!S.roundErr) S.perfectRounds++;
    $("#hud-score").textContent = S.score;
    $("#read-phase").hidden = true;
    revealAnswer();
  }

  async function revealAnswer() {
    const res = $("#result");
    res.hidden = false;
    res.innerHTML = `<div class="big" id="res-digits"></div><div class="check" id="res-check"></div>`;
    const slots = G.$$(".slot", $("#ladder"));
    // Gắn trọng số cho từng khối: dòng i ứng với base^i
    slots.forEach((s, i) => s.append(el("span", { class: "weight", html: `× ${S.base}${G.SUP(i)}` })));
    const out = $("#res-digits");
    for (let i = slots.length - 1; i >= 0; i--) {
      $(".block", slots[i]).classList.add("lit");
      out.textContent += G.digitChar(S.steps[i].r);
      G.sound.play("tick");
      await G.wait(260);
    }
    out.innerHTML = G.based(readStr("up"), S.base);
    const terms = S.steps.map((s, i) => ({ r: s.r, i })).reverse().filter((t) => t.r)
      .map((t) => `${t.r}×${S.base}${G.SUP(t.i)}`);
    $("#res-check").innerHTML = `Kiểm tra: ${terms.join(" + ")} = ${S.n} ✓`;
    G.sound.play("good");
    setFeedback(S.roundErr ? "✓ Hoàn thành vòng này." : "✓ Hoàn hảo! Không sai bước nào.", "good");
    $("#btn-next").hidden = false;
    $("#btn-next").focus();
  }

  function finish() {
    const { isNew } = G.progress.record("remainder-tower", S.lv, S.score, LEVELS.length);
    G.showScreen("end");
    $("#end-score").textContent = S.score;
    const all = S.perfectRounds === S.level.rounds;
    $("#end-title").textContent = all ? "Kiến trúc sư tháp số dư! 🎉" : "Hoàn thành level!";
    $("#end-detail").textContent = `${S.perfectRounds}/${S.level.rounds} vòng không sai bước nào.` + (isNew ? " Kỷ lục mới!" : "");
    if (all) { G.confetti(); G.sound.play("win"); }
    G.mountNextLink($("#next-game"));
  }

  function setFeedback(html, type = "") {
    const f = $("#feedback");
    f.className = "feedback " + type;
    f.innerHTML = html;
  }

  G.$$(".dir").forEach((b) => b.addEventListener("click", () => pickDirection(b.dataset.dir, b)));
  $("#btn-next").addEventListener("click", nextRound);
  $("#btn-again").addEventListener("click", () => startLevel(S.lv));
  $("#btn-menu").addEventListener("click", () => { G.renderLevels($("#levels"), LEVELS, startLevel); G.showScreen("start"); });

  G.renderLevels($("#levels"), LEVELS, startLevel);
})();
