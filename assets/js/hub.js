/* ==========================================================================
   hub.js — trang chủ, gồm 2 màn hình trên cùng một trang:
     /            màn hình chào: Bắt đầu chơi, Chơi tiếp, Xoá tiến độ
     /#games?...  thư viện game: cột chương, tìm kiếm, lọc theo mục và tiến độ
   Bộ lọc nằm trên URL (#games?topic=…&section=…&status=…&q=…) nên giảng viên
   có thể gửi link thẳng tới một chương hay một nhóm game.
   Mọi dữ liệu lấy từ catalog.js; không cần sửa file này khi thêm game/chương.
   ========================================================================== */
(function () {
  const { $, el, L } = G;
  const cat = window.CATALOG;
  const HUB_KEY = "itgames:hub";

  /* ---------- Dữ liệu phẳng từ catalog ---------- */
  const ALL = [];
  cat.topics.forEach((topic) => topic.sections.forEach((section) => section.games.forEach((game) => {
    ALL.push({ game, topic, section, text: norm(searchText(game, topic, section)) });
  })));
  const READY = ALL.filter((x) => x.game.status === "ready");
  const hasPlanned = ALL.length > READY.length;

  /** Bỏ dấu tiếng Việt + chữ thường, để "bu 2" tìm được "bù 2". */
  function norm(s) {
    return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\u0111\u0110]/g, "d").toLowerCase(); // đ, Đ
  }
  /** Tìm được bằng cả tiếng Việt lẫn tiếng Anh, bất kể đang hiển thị ngôn ngữ nào. */
  function searchText(game, topic, section) {
    const both = (x) => (x && typeof x === "object" ? [x.vi, x.en].join(" ") : x || "");
    return [game.id, game.title, game.skill, game.desc, topic.title, topic.label, section.title]
      .map(both).concat(game.tags || []).join(" ").replace(/\s+/g, " ");
  }
  const stateOf = (x) => (x.game.status !== "ready" ? "planned" : G.progress.summary(x.game.id).state);

  /* ---------- Trạng thái bộ lọc (đồng bộ với URL) ---------- */
  const S = { topic: "all", section: "all", status: "all", q: "" };

  function readHash() {
    const i = location.hash.indexOf("?");
    const p = new URLSearchParams(i >= 0 ? location.hash.slice(i + 1) : "");
    const saved = G.store.get(HUB_KEY, {});
    const has = [...p.keys()].length > 0;
    S.topic = (has ? p.get("topic") : saved.topic) || "all";
    S.section = (has ? p.get("section") : saved.section) || "all";
    S.status = (has ? p.get("status") : saved.status) || "all";
    S.q = p.get("q") || "";
    // Bỏ giá trị không còn tồn tại (ví dụ chương đã đổi id)
    const topic = cat.topics.find((t) => t.id === S.topic);
    if (!topic) S.topic = "all";
    if (!topic || !topic.sections.some((s) => s.id === S.section)) S.section = "all";
    if (!["all", "new", "started", "done", "planned"].includes(S.status)) S.status = "all";
  }

  function writeHash() {
    const p = new URLSearchParams();
    if (S.topic !== "all") p.set("topic", S.topic);
    if (S.section !== "all") p.set("section", S.section);
    if (S.status !== "all") p.set("status", S.status);
    if (S.q) p.set("q", S.q);
    const qs = p.toString();
    history.replaceState(null, "", location.pathname + location.search + "#games" + (qs ? "?" + qs : ""));
    G.store.set(HUB_KEY, { topic: S.topic, section: S.section, status: S.status });
  }

  function set(patch) {
    Object.assign(S, patch);
    writeHash();
    renderLibrary();
  }

  /* ---------- Tìm theo cụm từ, khớp từ đầu một từ, không phân biệt dấu ---------- */
  // "bu 2" khớp "bù 2" nhưng không khớp "bước"; "over" khớp "overflow".
  function terms() { const t = norm(S.q).trim().replace(/\s+/g, " "); return t ? [t] : []; }
  const isWordStart = (s, j) => j === 0 || !/[a-z0-9]/.test(s[j - 1]);
  function matches(text, t) {
    for (let j = text.indexOf(t); j >= 0; j = text.indexOf(t, j + 1)) if (isWordStart(text, j)) return true;
    return false;
  }

  function highlight(text, ts) {
    text = text || "";
    if (!ts.length) return document.createTextNode(text);
    // Chuẩn hoá từng ký tự để giữ được vị trí trong chuỗi gốc
    let flat = "";
    const pos = [];
    for (let i = 0; i < text.length; i++) {
      const n = norm(text[i]);
      for (let k = 0; k < n.length; k++) { flat += n[k]; pos.push(i); }
    }
    const hit = new Array(text.length).fill(false);
    for (const t of ts) {
      for (let j = flat.indexOf(t); j >= 0; j = flat.indexOf(t, j + 1))
        if (isWordStart(flat, j)) for (let k = j; k < j + t.length; k++) hit[pos[k]] = true;
    }
    const frag = document.createDocumentFragment();
    let i = 0;
    while (i < text.length) {
      let j = i;
      while (j < text.length && hit[j] === hit[i]) j++;
      const part = text.slice(i, j);
      frag.append(hit[i] ? el("mark", { text: part }) : document.createTextNode(part));
      i = j;
    }
    return frag;
  }

  /* ---------- Lọc ---------- */
  function inScope(x, ignore = {}) {
    if (S.topic !== "all" && x.topic.id !== S.topic) return false;
    if (!ignore.section && S.section !== "all" && x.section.id !== S.section) return false;
    const ts = terms();
    if (ts.length && !ts.every((t) => matches(x.text, t))) return false;
    if (!ignore.status) {
      const st = stateOf(x);
      if (S.status === "all" ? st === "planned" : st !== S.status) return false;
    }
    return true;
  }

  const STATUS = [
    ["all", () => L("Tất cả", "All")],
    ["new", () => L("Chưa chơi", "Not played")],
    ["started", () => L("Đang chơi", "In progress")],
    ["done", () => L("Hoàn thành", "Finished")],
    ["planned", () => L("Sắp có", "Coming soon")],
  ];

  /* ---------- Vẽ thư viện ---------- */
  function meter(done, total) {
    return el("div", { class: "meter" }, [el("span", { style: `width:${total ? Math.round((100 * done) / total) : 0}%` })]);
  }

  function renderChapters() {
    const nav = $("#chapters");
    nav.innerHTML = "";
    nav.append(el("div", { class: "head", text: L("Chương", "Chapters") }));
    const item = (id, label, name, list) => {
      const ready = list.filter((x) => x.game.status === "ready");
      const played = ready.filter((x) => stateOf(x) !== "new").length;
      return el("button", {
        class: "chap", type: "button", "aria-current": String(S.topic === id),
        title: name,
        onclick: (e) => { set({ topic: id, section: "all" }); e.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" }); },
      }, [
        label ? el("span", { class: "lbl", text: label }) : null,
        el("span", { class: "l1" }, [
          el("span", { class: "nm", text: name }),
          el("span", { class: "cnt", text: played ? `${played}/${ready.length}` : String(ready.length) }),
        ]),
        meter(played, ready.length),
      ]);
    };
    nav.append(item("all", "", L("Tất cả chương", "All chapters"), ALL));
    for (const t of cat.topics) nav.append(item(t.id, G.tr(t.label), G.tr(t.title), ALL.filter((x) => x.topic === t)));
    // Màn hình hẹp: cột chương thành hàng cuộn ngang, kéo chương đang chọn vào tầm nhìn
    const cur = nav.querySelector('[aria-current="true"]');
    if (cur && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = cur.offsetLeft - nav.offsetLeft - 16;
  }

  function renderSectionChips() {
    const box = $("#sections");
    const topic = cat.topics.find((t) => t.id === S.topic);
    box.innerHTML = "";
    box.hidden = !topic || topic.sections.length < 2;
    if (box.hidden) return;
    const scope = ALL.filter((x) => inScope(x, { section: true }));
    const chip = (id, name) => {
      const n = id === "all" ? scope.length : scope.filter((x) => x.section.id === id).length;
      return el("button", {
        class: "chip", type: "button", "aria-pressed": String(S.section === id), disabled: n === 0 && S.section !== id,
        onclick: () => set({ section: id }),
      }, [document.createTextNode(name), el("span", { class: "n", text: String(n) })]);
    };
    box.append(chip("all", L("Mọi mục", "All sections")));
    for (const s of topic.sections) box.append(chip(s.id, G.tr(s.title)));
  }

  function renderStatusChips() {
    const box = $("#status");
    box.innerHTML = "";
    const scope = ALL.filter((x) => inScope(x, { status: true }));
    for (const [id, name] of STATUS) {
      if (id === "planned" && !hasPlanned) continue;
      const n = scope.filter((x) => (id === "all" ? stateOf(x) !== "planned" : stateOf(x) === id)).length;
      box.append(el("button", {
        class: "chip", type: "button", "aria-pressed": String(S.status === id), disabled: n === 0 && S.status !== id,
        onclick: () => set({ status: id }),
      }, [document.createTextNode(name()), el("span", { class: "n", text: String(n) })]));
    }
  }

  function card(x, ts) {
    const { game } = x;
    const ready = game.status === "ready";
    const sum = ready ? G.progress.summary(game.id) : null;
    let foot;
    if (!ready) foot = [el("span", { class: "badge warn", text: L("Sắp có", "Coming soon") })];
    else if (sum.state === "new") foot = [el("span", { class: "badge good", text: L("Chơi ngay", "Play now") })];
    else foot = [
      el("span", { class: "badge" + (sum.state === "done" ? " good" : ""), text: sum.total ? `✓ ${sum.done}/${sum.total} ${L("level", "levels")}` : L("✓ Đã chơi", "✓ Played") }),
      sum.total ? meter(sum.done, sum.total) : null,
    ];
    const inner = [
      el("div", { class: "top" }, [
        el("div", { class: "ic", text: game.icon || "🎮" }),
        el("div", {}, [el("h3", {}, [highlight(G.tr(game.title), ts)]), el("div", { class: "skill" }, [highlight(G.tr(game.skill), ts)])]),
      ]),
      el("p", {}, [highlight(G.tr(game.desc), ts)]),
      el("div", { class: "foot" }, foot),
    ];
    const cls = "card game-card" + (sum && sum.state === "done" ? " done" : "");
    return ready ? el("a", { class: cls, href: game.path }, inner) : el("div", { class: cls + " planned" }, inner);
  }

  function renderRecent() {
    const box = $("#recent");
    box.innerHTML = "";
    if (S.q || S.status !== "all" || S.section !== "all") return;
    const items = G.recent.list()
      .map((id) => READY.find((x) => x.game.id === id))
      .filter((x) => x && (S.topic === "all" || x.topic.id === S.topic))
      .slice(0, 6);
    if (!items.length) return;
    box.append(el("div", { class: "recent" }, [
      el("div", { class: "section-title", text: L("Chơi gần đây", "Recently played") }),
      el("div", { class: "recent-list" }, items.map((x) => {
        const s = G.progress.summary(x.game.id);
        return el("a", { class: "recent-item", href: x.game.path }, [
          el("span", { class: "ic", text: x.game.icon || "🎮" }),
          el("span", { style: "min-width:0" }, [
            el("b", { text: G.tr(x.game.title) }),
            el("small", { text: s.total ? `${s.done}/${s.total} ${L("level", "levels")}` : s.done ? L("Đã chơi", "Played") : L("Mới mở", "Just opened") }),
          ]),
        ]);
      })),
    ]));
  }

  function renderResults() {
    const box = $("#results");
    box.innerHTML = "";
    const ts = terms();
    const hits = ALL.filter((x) => inScope(x));
    const filtered = ts.length || S.status !== "all" || S.section !== "all";

    // Số game khớp từ khoá nếu bỏ mọi bộ lọc khác (để mời tìm rộng ra)
    const everywhere = ts.length ? ALL.filter((x) => x.game.status === "ready" && ts.every((t) => matches(x.text, t))).length : 0;
    const widen = () => el("button", {
      class: "btn" + (hits.length ? " ghost sm" : ""), type: "button",
      text: L(`Tìm trong mọi chương (${everywhere})`, `Search all chapters (${everywhere})`),
      onclick: () => set({ topic: "all", section: "all", status: "all" }),
    });
    if (!hits.length) {
      box.append(el("div", { class: "empty" }, [
        el("div", { class: "big", text: "🔎" }),
        el("p", { text: S.q ? L(`Không có game nào khớp “${S.q}” trong bộ lọc này.`, `No games match “${S.q}” in this filter.`) : L("Không có game nào trong bộ lọc này.", "No games in this filter.") }),
        everywhere
          ? widen()
          : el("button", { class: "btn ghost", type: "button", text: L("Xoá bộ lọc", "Clear filters"), onclick: clearFilters }),
      ]));
      return;
    }
    if (filtered) {
      box.append(el("div", { class: "row result-info" }, [
        el("span", { text: L(`${hits.length} game`, `${hits.length} ${hits.length === 1 ? "game" : "games"}`) }),
        el("button", { class: "btn ghost sm", type: "button", text: L("✕ Xoá bộ lọc", "✕ Clear filters"), onclick: clearFilters }),
        everywhere > hits.length ? widen() : null,
      ]));
    }
    for (const topic of cat.topics) {
      const inTopic = hits.filter((x) => x.topic === topic);
      if (!inTopic.length) continue;
      const block = el("section", { class: "topic-block" }, [
        el("div", { class: "topic-head" }, [
          topic.label ? el("span", { class: "badge", text: G.tr(topic.label) }) : null,
          el("h2", { text: G.tr(topic.title) }),
          el("p", { text: G.tr(topic.summary) || "" }),
        ]),
      ]);
      for (const sec of topic.sections) {
        const games = inTopic.filter((x) => x.section === sec);
        if (!games.length) continue;
        const ready = sec.games.filter((g) => g.status === "ready").length;
        block.append(el("div", { class: "section-title" }, [
          document.createTextNode(G.tr(sec.title)),
          el("span", { class: "badge", text: filtered ? `${games.length}/${ready}` : String(ready) }),
        ]));
        block.append(el("div", { class: "grid" }, games.map((x) => card(x, ts))));
      }
      box.append(block);
    }
  }

  function renderLibrary() {
    const q = $("#q");
    if (q.value !== S.q) q.value = S.q;
    $("#q-clear").hidden = !S.q;
    $("#q-kbd").hidden = !!S.q;
    renderChapters();
    renderSectionChips();
    renderStatusChips();
    renderRecent();
    renderResults();
  }

  function clearFilters() { set({ section: "all", status: "all", q: "" }); }

  /* ---------- Màn hình chào ---------- */
  function renderWelcome() {
    const played = READY.filter((x) => stateOf(x) !== "new").length;
    const stat = (n, label) => el("span", { class: "stat" }, [el("b", { text: String(n) }), document.createTextNode(label)]);
    const stats = $("#welcome-stats");
    stats.innerHTML = "";
    stats.append(
      stat(READY.length, L("game", READY.length === 1 ? "game" : "games")),
      stat(cat.topics.length, L("chương", cat.topics.length === 1 ? "chapter" : "chapters")),
    );
    if (played) stats.append(stat(`${played}/${READY.length}`, L("đã chơi", "played")));

    const last = G.recent.list().map((id) => READY.find((x) => x.game.id === id)).find(Boolean);
    const cont = $("#btn-continue");
    cont.hidden = !last;
    if (last) {
      cont.href = last.game.path;
      cont.textContent = `↻ ${L("Chơi tiếp", "Continue")}: ${G.tr(last.game.title)}`;
    }
    $("#btn-reset").hidden = !played && !last;
  }

  function spawnBits() {
    const bg = $("#bits-bg");
    const n = Math.min(48, Math.round(window.innerWidth / 28));
    for (let i = 0; i < n; i++) {
      bg.append(el("span", {
        text: Math.random() < 0.5 ? "0" : "1",
        style: [
          `left:${(Math.random() * 100).toFixed(1)}%`,
          `--y:${(Math.random() * 100).toFixed(1)}%`,
          `--o:${(0.08 + Math.random() * 0.2).toFixed(2)}`,
          `font-size:${(0.8 + Math.random() * 1.6).toFixed(2)}rem`,
          `animation-duration:${(12 + Math.random() * 18).toFixed(1)}s`,
          `animation-delay:${(-Math.random() * 30).toFixed(1)}s`,
        ].join(";"),
      }));
    }
  }

  /* ---------- Xoá tiến độ ---------- */
  function askReset() {
    const n = READY.filter((x) => stateOf(x) !== "new").length;
    $("#confirm-text").textContent = n
      ? L(`Điểm và kỷ lục của ${n} game trên trình duyệt này sẽ bị xoá vĩnh viễn. Bạn sẽ bắt đầu lại từ đầu.`,
          `Scores and best records for ${n} ${n === 1 ? "game" : "games"} in this browser will be permanently deleted. You will start from scratch.`)
      : L("Danh sách game đã mở gần đây sẽ bị xoá.", "Your recently opened games list will be cleared.");
    $("#confirm-reset").showModal();
  }
  $("#confirm-yes").addEventListener("click", () => {
    G.progress.resetAll();
    $("#confirm-reset").close();
    Object.assign(S, { topic: "all", section: "all", status: "all", q: "" });
    if (isLibrary()) writeHash();
    route();
    G.toast(L("Đã xoá toàn bộ tiến độ", "All progress has been reset"), "good");
  });
  $("#confirm-reset").addEventListener("click", (e) => { if (e.target.id === "confirm-reset") e.target.close(); });
  G.$$("#confirm-reset [data-close]").forEach((b) => b.addEventListener("click", () => $("#confirm-reset").close()));
  $("#btn-reset").addEventListener("click", askReset);
  $("#btn-reset-2").addEventListener("click", askReset);

  /* ---------- Chuyển giữa 2 màn hình ---------- */
  const isLibrary = () => location.hash.startsWith("#games");

  function route() {
    document.documentElement.classList.remove("to-library");
    const lib = isLibrary();
    $('[data-view="welcome"]').hidden = lib;
    $('[data-view="library"]').hidden = !lib;
    if (lib) {
      readHash();
      renderLibrary();
      document.title = `${L("Danh sách game", "Games")} · ${G.tr(cat.course)}`;
    } else {
      renderWelcome();
      document.title = G.tr(cat.course);
    }
  }

  // Link tới trang chào: bỏ hash mà không tải lại trang
  document.querySelector(".lib-header .home").addEventListener("click", (e) => {
    e.preventDefault();
    history.pushState(null, "", location.pathname + location.search);
    route();
    window.scrollTo(0, 0);
  });
  $("#btn-start").addEventListener("click", () => setTimeout(() => window.scrollTo(0, 0)));
  window.addEventListener("hashchange", route);
  window.addEventListener("popstate", route);

  /* ---------- Tìm kiếm ---------- */
  let typing;
  $("#q").addEventListener("input", (e) => {
    clearTimeout(typing);
    const v = e.target.value;
    $("#q-clear").hidden = !v;
    $("#q-kbd").hidden = !!v;
    typing = setTimeout(() => set({ q: v.trim() ? v : "" }), 120);
  });
  $("#q").addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.target.value = ""; set({ q: "" }); }
    if (e.key === "Enter") { const a = $("#results a.game-card"); if (a && S.q) a.click(); }
  });
  $("#q-clear").addEventListener("click", () => { set({ q: "" }); $("#q").focus(); });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "/" || !isLibrary() || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    e.preventDefault();
    $("#q").focus();
  });

  /* ---------- Khởi động ---------- */
  G.$$(".course-name").forEach((n) => { n.textContent = G.tr(cat.course); });
  $("#welcome-lang").append(G.langButton());
  $("#lib-lang").append(G.langButton());
  spawnBits();
  route();
})();
