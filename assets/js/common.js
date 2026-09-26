/* ==========================================================================
   common.js — tiện ích dùng chung cho mọi game (namespace G).
   Trang game khai báo trên <body>:
     data-root="../../../../"   đường dẫn tương đối về thư mục gốc site
     data-game="bit-flip"       id game, trùng với id trong catalog.js

   Đa ngôn ngữ (vi/en), xem docs/adding-a-game.md:
     - JS:   L("Tiếng Việt", "English")   hoặc G.tr({ vi, en })
     - HTML: <span data-en="English">Tiếng Việt</span>             (câu ngắn)
             <p data-lang="vi">…</p><p data-lang="en">…</p>          (đoạn dài)
             data-en-placeholder / data-en-title / data-en-aria    (thuộc tính)
   ========================================================================== */
(function () {
  "use strict";

  const G = {};
  const body = document.body;
  G.root = (body && body.dataset.root) || "./";
  G.gameId = (body && body.dataset.game) || null;

  /* ---------- Ngôn ngữ ---------- */
  // lang.js (nạp trong <head>) đã chọn ngôn ngữ và đặt <html lang="…">
  G.lang = window.ITG_LANG || (document.documentElement.lang === "en" ? "en" : "vi");
  /** Chọn chuỗi theo ngôn ngữ hiện tại: L("Vòng", "Round"). */
  G.L = (vi, en) => (G.lang === "en" && en != null ? en : vi);
  /** Dịch giá trị có thể là chuỗi hoặc { vi, en } (dùng cho catalog). */
  G.tr = (x) => (x && typeof x === "object" && !Array.isArray(x) ? (x[G.lang] ?? x.vi) : x);
  /** Đổi ngôn ngữ: lưu lựa chọn rồi tải lại trang với ?lang=… */
  G.setLang = (lang) => {
    try { localStorage.setItem("itgames:lang", JSON.stringify(lang)); } catch { /* bỏ qua */ }
    const u = new URL(location.href);
    u.searchParams.set("lang", lang);
    location.replace(u.toString());
  };
  /** Áp bản dịch cho chữ tĩnh trong HTML (data-en, data-en-*). */
  G.applyStaticI18n = (root = document) => {
    if (G.lang !== "en") return;
    root.querySelectorAll("[data-en]").forEach((e) => { e.innerHTML = e.dataset.en; });
    root.querySelectorAll("[data-en-placeholder]").forEach((e) => { e.placeholder = e.dataset.enPlaceholder; });
    root.querySelectorAll("[data-en-title]").forEach((e) => { e.title = e.dataset.enTitle; });
    root.querySelectorAll("[data-en-aria]").forEach((e) => { e.setAttribute("aria-label", e.dataset.enAria); });
  };
  /** Nút chuyển ngôn ngữ (dùng trên header và trang chủ). */
  G.langButton = () => G.el("button", {
    class: "icon-btn lang-btn", type: "button",
    text: G.lang === "en" ? "VI" : "EN",
    title: G.lang === "en" ? "Chuyển sang tiếng Việt" : "Switch to English", // i18n-ok
    "aria-label": G.lang === "en" ? "Chuyển sang tiếng Việt" : "Switch to English", // i18n-ok
    onclick: () => {
      const playing = G.$("[data-screen=play]") && !G.$("[data-screen=play]").hidden;
      if (playing && !confirm(G.L("Đổi ngôn ngữ sẽ tải lại trang, vòng đang chơi sẽ bị bỏ dở. Tiếp tục?", "Switching language reloads the page and the current round will be lost. Continue?"))) return;
      G.setLang(G.lang === "en" ? "vi" : "en");
    },
  });

  /* ---------- Ngẫu nhiên & mảng ---------- */
  G.randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  G.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  G.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /* ---------- Hệ cơ số ---------- */
  const DIGITS = "0123456789ABCDEF";
  G.digitChar = (d) => DIGITS[d];
  G.digitValue = (ch) => DIGITS.indexOf(String(ch).toUpperCase());
  G.toBase = (n, base) => n.toString(base).toUpperCase();
  G.SUP = (n) => String(n).replace(/[-0-9]/g, (c) => "⁻⁰¹²³⁴⁵⁶⁷⁸⁹"["-0123456789".indexOf(c)]);
  /** Ghi số kèm chỉ số cơ số, ví dụ 1011₂ (dạng HTML). */
  G.based = (str, base) => `<span class="mono">${str}</span><sub>${base}</sub>`;

  /* ---------- Phân số (cho phần thập phân) ---------- */
  G.gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  /** "0.375" -> { n: 3, d: 8 } (tối giản, chỉ lấy phần thập phân). */
  G.parseFraction = (str) => {
    const frac = (String(str).split(".")[1] || "");
    let n = frac ? parseInt(frac, 10) : 0;
    let d = 10 ** frac.length;
    const g = G.gcd(n, d) || 1;
    return { n: n / g, d: d / g };
  };
  G.isPowerOfTwo = (d) => d > 0 && (d & (d - 1)) === 0;

  /* ---------- Bit & dung lượng ---------- */
  /** 65 -> "01000001" (n bit, số âm lấy theo bù 2). */
  G.bits = (v, n = 8) => {
    const m = 2 ** n;
    return (((v % m) + m) % m).toString(2).padStart(n, "0");
  };
  /** Đọc n bit theo bù 2: "11110110" -> -10. */
  G.signed = (str) => { const u = parseInt(str, 2), n = str.length; return u >= 2 ** (n - 1) ? u - 2 ** n : u; };
  /** 1536 -> "1.5 KB". Quy ước 1 KB = 1024 B (như trên slide). */
  G.formatBytes = (bytes, digits = 3) => {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let i = 0, v = bytes;
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
    return `${i === 0 ? v : Number(v.toPrecision(digits))} ${units[i]}`;
  };
  /**
   * Hàng bit dùng chung: G.bitRow(v, 8, { onToggle(i), mark: [i…], bad: [i…], cls: "sm" }).
   * i = 0 là bit trái nhất (MSB). Có onToggle thì mỗi bit là một nút bấm.
   */
  G.bitRow = (v, n = 8, opts = {}) => {
    const row = G.el("div", { class: "bitrow" + (opts.cls ? " " + opts.cls : "") });
    [...G.bits(v, n)].forEach((b, i) => {
      const cls = "bit" + (b === "1" ? " one" : "") + ((opts.mark || []).includes(i) ? " mark" : "") + ((opts.bad || []).includes(i) ? " bad" : "");
      row.append(opts.onToggle
        ? G.el("button", { type: "button", class: cls, text: b, "aria-label": `Bit ${n - 1 - i}`, onclick: () => opts.onToggle(i) })
        : G.el("span", { class: cls, text: b }));
    });
    return row;
  };
  /** 1105920000 -> "1 105 920 000" (khoảng trắng hàng nghìn, tránh nhầm với dấu chấm thập phân). */
  G.fmtInt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");

  /* ---------- DOM ---------- */
  G.$ = (sel, root = document) => root.querySelector(sel);
  G.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  G.el = (tag, attrs = {}, children = []) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") e.className = v;
      else if (k === "html") e.innerHTML = v;
      else if (k === "text") e.textContent = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) e.setAttribute(k, v === true ? "" : v);
    }
    for (const c of [].concat(children)) if (c != null) e.append(c);
    return e;
  };
  /** Hiện đúng một "màn hình" (start / play / end) trong nhóm [data-screen]. */
  G.showScreen = (name) => {
    G.$$("[data-screen]").forEach((s) => { s.hidden = s.dataset.screen !== name; });
    window.scrollTo({ top: 0 });
    levelHistory(name);
  };

  /* ---------- Nút Back: đang trong level thì quay về danh sách level ----------
     Vào một level (mọi màn hình khác "start") sẽ thêm một mục vào lịch sử trình
     duyệt, nên nút Back / vuốt Back đưa về màn hình chọn level thay vì rời game.
     Rời level thì dừng mọi G.Timer và bỏ các G.wait đang chờ của level cũ. */
  let epoch = 0, skipPop = false;
  const timers = new Set();
  const inLevelState = () => !!(history.state && history.state.itgLevel);
  function levelHistory(name) {
    if (!G.gameId) return;
    if (name !== "start") {
      if (!inLevelState()) history.pushState({ itgLevel: true }, "");
    } else {
      epoch++;
      timers.forEach((t) => t.stop());
      // skipPop = true nghĩa là đã có một lần back đang chờ: không back thêm lần nữa
      if (inLevelState() && !skipPop) { skipPop = true; history.back(); }
    }
    updateBackLink();
  }
  /** Về màn hình chọn level, dùng nút "Chọn level khác" của game (nó dọn trạng thái riêng). */
  G.backToLevels = () => {
    const menu = G.$("#btn-menu");
    if (menu) menu.click(); else G.showScreen("start");
  };
  window.addEventListener("popstate", () => {
    if (skipPop) { skipPop = false; return; }
    const start = G.$("[data-screen=start]");
    if (G.gameId && start && start.hidden) G.backToLevels();
  });
  // Tải lại trang giữa level: bỏ dấu của lần trước để Back vẫn đúng
  if (inLevelState()) history.replaceState(null, "");

  function updateBackLink() {
    const a = G.$(".site-header .back");
    const start = G.$("[data-screen=start]");
    if (!a || !start) return;
    a.textContent = start.hidden ? G.L("← Chọn level", "← Levels") : G.L("← Tất cả game", "← All games");
  }
  G.shake = (node) => { node.classList.remove("shake"); void node.offsetWidth; node.classList.add("shake"); };
  /** Chờ ms mili giây; nếu người chơi rời level trong lúc chờ thì không bao giờ chạy tiếp. */
  G.wait = (ms) => { const e = epoch; return new Promise((r) => setTimeout(() => { if (e === epoch) r(); }, ms)); };

  /* ---------- Toast & confetti ---------- */
  let toastWrap;
  G.toast = (msg, type = "", ms = 1600) => {
    if (!toastWrap) { toastWrap = G.el("div", { class: "toast-wrap", "aria-live": "polite" }); body.append(toastWrap); }
    const t = G.el("div", { class: "toast " + type, html: msg });
    toastWrap.append(t);
    setTimeout(() => t.remove(), ms);
  };
  G.confetti = (count = 60) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const colors = ["#4f46e5", "#f59e0b", "#10b981", "#ef4444", "#0ea5e9", "#a855f7"];
    for (let i = 0; i < count; i++) {
      const c = G.el("div", { class: "confetti" });
      c.style.left = Math.random() * 100 + "vw";
      c.style.background = G.pick(colors);
      c.style.setProperty("--dx", (Math.random() * 200 - 100) + "px");
      c.style.setProperty("--rot", (Math.random() * 900 - 450) + "deg");
      c.style.animationDuration = 1.6 + Math.random() * 1.4 + "s";
      c.style.animationDelay = Math.random() * 0.3 + "s";
      body.append(c);
      setTimeout(() => c.remove(), 3500);
    }
  };

  /* ---------- Âm thanh ngắn (Web Audio, có nút tắt) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* bỏ qua */ } },
  };
  G.store = store;

  let audioCtx = null;
  G.sound = {
    muted: store.get("itgames:muted", false),
    toggle() { this.muted = !this.muted; store.set("itgames:muted", this.muted); return this.muted; },
    play(kind) {
      if (this.muted) return;
      try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        const notes = { good: [660, 880], bad: [220, 180], pop: [520], tick: [900], win: [523, 659, 784, 1047] }[kind] || [440];
        notes.forEach((f, i) => {
          const o = audioCtx.createOscillator(), g = audioCtx.createGain();
          const t0 = audioCtx.currentTime + i * 0.09;
          o.type = kind === "bad" ? "sawtooth" : "triangle";
          o.frequency.value = f;
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
          o.connect(g).connect(audioCtx.destination);
          o.start(t0); o.stop(t0 + 0.18);
        });
      } catch { /* trình duyệt không hỗ trợ: bỏ qua */ }
    },
  };

  /* ---------- Tiến độ (lưu trên trình duyệt của từng người chơi) ---------- */
  G.progress = {
    get(gameId) { return store.get("itgames:progress:" + gameId, { levels: {} }); },
    /** Ghi điểm của một level; trả về { best, isNew }. */
    record(gameId, levelIdx, score, totalLevels) {
      const p = this.get(gameId);
      const prev = p.levels[levelIdx];
      const isNew = prev == null || score > prev;
      if (isNew) p.levels[levelIdx] = score;
      if (totalLevels) p.total = totalLevels;
      store.set("itgames:progress:" + gameId, p);
      return { best: Math.max(score, prev ?? score), isNew };
    },
    best(gameId, levelIdx) { return this.get(gameId).levels[levelIdx]; },
    /** Tóm tắt cho trang chủ: { done, total, state: "new" | "started" | "done" }. */
    summary(gameId) {
      const p = this.get(gameId);
      const done = Object.keys(p.levels).length, total = p.total || 0;
      return { done, total, state: !done ? "new" : total && done >= total ? "done" : "started" };
    },
    /** Xoá tiến độ của mọi game (giữ ngôn ngữ, âm thanh). Trả về số game bị xoá. */
    resetAll() {
      let n = 0;
      try {
        for (const k of Object.keys(localStorage)) {
          if (k.startsWith("itgames:progress:")) n++;
          if (k.startsWith("itgames:progress:") || k === "itgames:recent" || k === "itgames:hub" || k === "itgames:showPlanned") localStorage.removeItem(k);
        }
      } catch { /* bỏ qua */ }
      return n;
    },
  };

  /* ---------- Game vừa mở gần đây (cho nút "Chơi tiếp" ở trang chủ) ---------- */
  G.recent = {
    list() { return store.get("itgames:recent", []); },
    add(id) { store.set("itgames:recent", [id, ...this.list().filter((x) => x !== id)].slice(0, 8)); },
  };

  /* ---------- Đếm ngược ---------- */
  /** new G.Timer(seconds, onTick(left, ratio), onEnd) */
  G.Timer = class {
    constructor(seconds, onTick, onEnd) {
      this.total = seconds; this.left = seconds; this.onTick = onTick; this.onEnd = onEnd; this.id = null;
    }
    start() {
      this.stop();
      const t0 = performance.now(), start = this.left;
      this.id = setInterval(() => {
        this.left = Math.max(0, start - (performance.now() - t0) / 1000);
        this.onTick && this.onTick(this.left, this.left / this.total);
        if (this.left <= 0) { this.stop(); this.onEnd && this.onEnd(); }
      }, 100);
      this.onTick && this.onTick(this.left, this.left / this.total);
      timers.add(this);
      return this;
    }
    stop() { if (this.id) clearInterval(this.id); this.id = null; timers.delete(this); }
  };
  /** Cập nhật thanh thời gian .timer-bar */
  G.renderTimerBar = (bar, ratio) => {
    bar.firstElementChild.style.width = (ratio * 100).toFixed(1) + "%";
    bar.classList.toggle("low", ratio < 0.25);
  };

  /* ---------- Danh sách level trên màn hình bắt đầu ---------- */
  G.renderLevels = (container, levels, onPick) => {
    container.innerHTML = "";
    levels.forEach((lv, i) => {
      const best = G.gameId ? G.progress.best(G.gameId, i) : null;
      container.append(G.el("button", { class: "level-btn", onclick: () => onPick(i) }, [
        G.el("span", { class: "lv", text: "Level " + (i + 1) }),
        G.el("span", { class: "nm", text: lv.name }),
        lv.desc ? G.el("span", { class: "ds", html: lv.desc }) : null,
        best != null ? G.el("span", { class: "best", text: G.L("Kỷ lục: ", "Best: ") + best }) : null,
      ]));
    });
  };

  /* ---------- Tìm game trong catalog ---------- */
  G.findGame = (id) => {
    const cat = window.CATALOG;
    if (!cat) return null;
    for (const topic of cat.topics)
      for (const sec of topic.sections)
        for (const g of sec.games) if (g.id === id) return { topic, section: sec, game: g };
    return null;
  };
  /** Game "sẵn sàng" kế tiếp trong cùng chủ đề (để gợi ý chơi tiếp). */
  G.nextGame = (id) => {
    const cat = window.CATALOG;
    if (!cat) return null;
    const all = cat.topics.flatMap((t) => t.sections.flatMap((s) => s.games)).filter((g) => g.status === "ready");
    const i = all.findIndex((g) => g.id === id);
    return i >= 0 && i + 1 < all.length ? all[i + 1] : null;
  };

  /* ---------- Header chung cho trang game ---------- */
  function mountHeader() {
    const slot = G.$("[data-shell]");
    if (!slot) return;
    const info = G.gameId ? G.findGame(G.gameId) : null;
    const title = info ? G.tr(info.game.title) : document.title;
    const sub = info ? G.tr(info.section.title) : "";
    if (info) { document.title = title; G.recent.add(info.game.id); }
    const help = G.$("dialog.help");
    slot.className = "site-header";
    slot.innerHTML = "";
    const soundBtn = G.el("button", {
      class: "icon-btn", type: "button", title: G.L("Bật/tắt âm thanh", "Sound on/off"), "aria-label": G.L("Bật/tắt âm thanh", "Sound on/off"),
      text: G.sound.muted ? "🔇" : "🔊",
      onclick: (e) => { e.currentTarget.textContent = G.sound.toggle() ? "🔇" : "🔊"; },
    });
    const helpBtn = help ? G.el("button", {
      class: "icon-btn", type: "button", title: G.L("Hướng dẫn", "How to play"), "aria-label": G.L("Hướng dẫn", "How to play"), text: "?",
      onclick: () => help.showModal(),
    }) : null;
    slot.append(G.el("div", { class: "container" }, [
      G.el("a", {
        class: "back", href: G.root + "index.html#games", text: G.L("← Tất cả game", "← All games"),
        onclick: (e) => {
          const start = G.$("[data-screen=start]");
          if (start && start.hidden) { e.preventDefault(); G.backToLevels(); }
        },
      }),
      G.el("div", { class: "title", html: `${title}${sub ? `<small>${sub}</small>` : ""}` }),
      G.langButton(), soundBtn, helpBtn,
    ]));
    if (help) {
      help.addEventListener("click", (e) => { if (e.target === help) help.close(); });
      G.$$("[data-close]", help).forEach((b) => b.addEventListener("click", () => help.close()));
    }
  }

  /** Nút "Game tiếp theo" trên màn hình kết thúc. */
  G.mountNextLink = (container) => {
    const next = G.gameId && G.nextGame(G.gameId);
    if (!container || !next) return;
    container.innerHTML = "";
    container.append(G.el("a", { class: "btn ghost", href: G.root + next.path, text: `${G.L("Game tiếp theo", "Next game")}: ${G.tr(next.title)} →` }));
  };

  window.G = G;
  window.L = G.L;
  G.applyStaticI18n();
  const boot = () => { mountHeader(); updateBackLink(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
