/* ==========================================================================
   common.js — tiện ích dùng chung cho mọi game (namespace G).
   Trang game khai báo trên <body>:
     data-root="../../../../"   đường dẫn tương đối về thư mục gốc site
     data-game="bit-flip"       id game, trùng với id trong catalog.js
   ========================================================================== */
(function () {
  "use strict";

  const G = {};
  const body = document.body;
  G.root = (body && body.dataset.root) || "./";
  G.gameId = (body && body.dataset.game) || null;

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
  };
  G.shake = (node) => { node.classList.remove("shake"); void node.offsetWidth; node.classList.add("shake"); };
  G.wait = (ms) => new Promise((r) => setTimeout(r, ms));

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
      return this;
    }
    stop() { if (this.id) clearInterval(this.id); this.id = null; }
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
        best != null ? G.el("span", { class: "best", text: "Kỷ lục: " + best }) : null,
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
    const title = info ? info.game.title : document.title;
    const sub = info ? info.section.title : "";
    const help = G.$("dialog.help");
    slot.className = "site-header";
    slot.innerHTML = "";
    const soundBtn = G.el("button", {
      class: "icon-btn", type: "button", title: "Bật/tắt âm thanh", "aria-label": "Bật/tắt âm thanh",
      text: G.sound.muted ? "🔇" : "🔊",
      onclick: (e) => { e.currentTarget.textContent = G.sound.toggle() ? "🔇" : "🔊"; },
    });
    const helpBtn = help ? G.el("button", {
      class: "icon-btn", type: "button", title: "Hướng dẫn", "aria-label": "Hướng dẫn", text: "?",
      onclick: () => help.showModal(),
    }) : null;
    slot.append(G.el("div", { class: "container" }, [
      G.el("a", { class: "back", href: G.root + "index.html", text: "← Tất cả game" }),
      G.el("div", { class: "title", html: `${title}${sub ? `<small>${sub}</small>` : ""}` }),
      soundBtn, helpBtn,
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
    container.append(G.el("a", { class: "btn ghost", href: G.root + next.path, text: `Game tiếp theo: ${next.title} →` }));
  };

  window.G = G;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountHeader);
  else mountHeader();
})();
