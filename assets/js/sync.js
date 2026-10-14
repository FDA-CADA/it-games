/* ==========================================================================
   sync.js — chế độ online: đăng nhập Supabase (tự host) và lưu tiến độ theo tài khoản.
   Không cần thư viện: gọi thẳng GoTrue (/auth/v1) và PostgREST (/rest/v1).
   Offline và online là hai kho riêng; không bao giờ đẩy dữ liệu offline lên tài khoản.
   Không cấu hình = không làm gì (chỉ offline).
   ========================================================================== */
(function () {
  "use strict";
  const G = window.G, L = window.L;
  const cfg = window.ITG_CONFIG || {};
  if (!G || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return;

  const URL_ = cfg.supabaseUrl.replace(/\/+$/, "");
  const SESSION = "itgames:session", MODE = "itgames:mode", CLOUD = "itgames:cloud:progress:";
  const H = { apikey: cfg.supabaseAnonKey, "Content-Type": "application/json" };
  const emit = () => document.dispatchEvent(new CustomEvent("itg:synced"));
  let session = G.store.get(SESSION, null);

  const rm = (k) => { try { localStorage.removeItem(k); } catch { /* bỏ qua */ } };
  const clearCloudCache = () => { try { Object.keys(localStorage).filter((k) => k.startsWith(CLOUD)).forEach(rm); } catch { /* bỏ qua */ } };
  const save = (s) => { session = s; if (s) G.store.set(SESSION, s); else rm(SESSION); };
  /** Đổi chế độ: đổi cờ, rồi cho trang vẽ lại bằng kho tương ứng. */
  function setMode(mode) {
    G.store.set(MODE, mode);
    G.online = mode === "online" && !!session;
    renderButtons(); emit();
  }
  const toSession = (r, prev) => ({
    access_token: r.access_token, refresh_token: r.refresh_token,
    expires_at: Date.now() + (r.expires_in || 3600) * 1000 - 30000,
    user_id: (r.user || prev).user_id || (r.user || prev).id, email: (r.user || prev).email,
  });

  async function api(path, opts = {}, auth = true) {
    const headers = { ...H, ...(opts.headers || {}) };
    if (auth) headers.Authorization = "Bearer " + (await token());
    const res = await fetch(URL_ + path, { ...opts, headers });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw Object.assign(new Error((data && (data.msg || data.error_description || data.message)) || res.statusText), { status: res.status });
    return data;
  }

  let refreshing = null;
  async function token() {
    if (!session) throw new Error("not signed in");
    if (Date.now() < session.expires_at) return session.access_token;
    refreshing = refreshing || api("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: JSON.stringify({ refresh_token: session.refresh_token }) }, false)
      .then((r) => { save(toSession(r, session)); return session.access_token; })
      .catch((e) => { if (e.status >= 400 && e.status < 500) { save(null); clearCloudCache(); setMode("offline"); } throw e; })
      .finally(() => { refreshing = null; });
    return refreshing;
  }

  /* ---------- Tiến độ theo tài khoản ---------- */
  /** Tải tiến độ của tài khoản về làm bản sao (thay hẳn, không trộn với offline). */
  async function pull() {
    if (!G.online) return;
    try {
      const rows = await api("/rest/v1/progress?select=game_id,levels,total");
      clearCloudCache();
      for (const r of rows) G.store.set(CLOUD + r.game_id, { levels: r.levels || {}, total: r.total || undefined });
      emit();
    } catch (e) { /* mất mạng: giữ bản sao cũ */ }
  }
  async function push(gameId) {
    if (!G.online) return;
    const p = G.progress.get(gameId);
    try {
      await api("/rest/v1/progress?on_conflict=user_id,game_id", {
        method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ user_id: session.user_id, game_id: gameId, levels: p.levels, total: p.total || null }),
      });
    } catch { G.toast && G.toast(L("Chưa lưu được lên máy chủ (mất mạng?)", "Could not save to the server (offline?)"), "bad"); }
  }
  async function clearRemote() {
    if (!G.online) return;
    try { await api("/rest/v1/progress?user_id=eq." + session.user_id, { method: "DELETE" }); } catch { /* bỏ qua */ }
  }

  /* ---------- Đăng nhập ---------- */
  async function enter(s) { // sau khi có phiên: vào chế độ online và tải dữ liệu tài khoản
    save(s); G.store.set(MODE, "online"); G.online = true; clearCloudCache();
    await pull(); renderButtons(); emit();
  }
  async function emailAuth(mode, email, password) {
    const body = JSON.stringify({ email, password });
    const r = mode === "signup"
      ? await api("/auth/v1/signup", { method: "POST", body }, false)
      : await api("/auth/v1/token?grant_type=password", { method: "POST", body }, false);
    if (!r.access_token) return false; // cần xác nhận email
    await enter(toSession(r)); return true;
  }
  function oauth(provider) { // chuyển sang nhà cung cấp, quay lại trang này kèm token trong #fragment
    const back = location.origin + location.pathname;
    location.href = `${URL_}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(back)}`;
  }
  async function finishOauth() { // gọi khi trang mở lại từ OAuth: #access_token=…
    const h = new URLSearchParams(location.hash.slice(1));
    if (!h.get("access_token")) return;
    history.replaceState(null, "", location.pathname + "#games");
    try {
      const u = await fetch(URL_ + "/auth/v1/user", { headers: { ...H, Authorization: "Bearer " + h.get("access_token") } }).then((r) => r.json());
      await enter(toSession({ access_token: h.get("access_token"), refresh_token: h.get("refresh_token"), expires_in: +h.get("expires_in") || 3600, user: u }));
      G.toast(L("Đã đăng nhập, đang dùng chế độ online", "Signed in, now in online mode"), "good");
    } catch { G.toast(L("Đăng nhập thất bại", "Sign-in failed"), "bad"); }
  }
  function signOut() {
    if (session) api("/auth/v1/logout", { method: "POST" }).catch(() => {});
    save(null); clearCloudCache(); setMode("offline");
  }

  /* ---------- Giao diện ---------- */
  const PROVIDERS = { google: ["Google", "G"], azure: ["Microsoft", "⊞"] };
  let dlg;
  function openDialog() {
    dlg && dlg.remove();
    const close = () => dlg.close();
    const modeBtn = (mode, label, desc, on) => G.el("button", { type: "button", class: "mode-opt" + (on ? " on" : ""), onclick: () => {
      if (mode === "offline") { setMode("offline"); close(); }
      else if (session) { setMode("online"); pull(); close(); }
    } }, [G.el("b", { text: label }), G.el("small", { text: desc })]);
    const body = [
      G.el("h2", { text: L("Chế độ chơi", "Play mode") }),
      G.el("div", { class: "mode-pick" }, [
        modeBtn("offline", "💾 Offline", L("Tiến độ chỉ lưu trên trình duyệt này.", "Progress stays in this browser only."), !G.online),
        modeBtn("online", "☁ Online", L("Tiến độ theo tài khoản, dùng được trên mọi thiết bị.", "Progress follows your account on any device."), G.online),
      ]),
      G.el("p", { class: "muted", text: L("Hai chế độ có dữ liệu riêng và không bao giờ gộp với nhau.", "The two modes keep separate data and are never merged.") }),
    ];
    if (session) {
      body.push(G.el("p", {}, [L("Tài khoản: ", "Account: "), G.el("b", { text: session.email || "" })]),
        G.el("div", { class: "row" }, [
          G.el("button", { class: "btn ghost", type: "button", text: L("Đóng", "Close"), onclick: close }),
          G.el("button", { class: "btn bad", type: "button", text: L("Đăng xuất", "Sign out"), onclick: () => { signOut(); close(); } })]));
    } else {
      body.push(G.el("p", { class: "muted", text: L("Chọn Online và đăng nhập để dùng chế độ này:", "Pick Online and sign in to use it:") }));
      const msg = G.el("p", { class: "muted auth-msg" });
      for (const p of cfg.providers || []) if (PROVIDERS[p]) body.push(G.el("button", { class: "btn ghost oauth-btn", type: "button", text: `${PROVIDERS[p][1]}  ${L("Đăng nhập với", "Sign in with")} ${PROVIDERS[p][0]}`, onclick: () => oauth(p) }));
      if (cfg.emailLogin !== false) {
        const email = G.el("input", { type: "email", required: true, autocomplete: "email", placeholder: "Email" });
        const pw = G.el("input", { type: "password", required: true, minlength: 6, autocomplete: "current-password", placeholder: L("Mật khẩu (≥ 6 ký tự)", "Password (6+ characters)") });
        let mode = "signin";
        const submit = G.el("button", { class: "btn", type: "submit", text: L("Đăng nhập", "Sign in") });
        const toggle = G.el("button", { class: "btn ghost", type: "button", text: L("Tạo tài khoản", "Create account"), onclick: () => {
          mode = mode === "signin" ? "signup" : "signin";
          submit.textContent = mode === "signin" ? L("Đăng nhập", "Sign in") : L("Đăng ký", "Sign up");
          toggle.textContent = mode === "signin" ? L("Tạo tài khoản", "Create account") : L("Đã có tài khoản", "I have an account");
        } });
        body.push(G.el("form", { class: "auth-form", onsubmit: async (e) => {
          e.preventDefault(); submit.disabled = true; msg.textContent = "";
          try {
            if (await emailAuth(mode, email.value.trim(), pw.value)) { close(); G.toast(L("Đã đăng nhập, đang dùng chế độ online", "Signed in, now in online mode"), "good"); }
            else msg.textContent = L("Hãy mở email để xác nhận tài khoản, rồi đăng nhập.", "Check your email to confirm the account, then sign in.");
          } catch (err) { msg.textContent = err.message; }
          submit.disabled = false;
        } }, [email, pw, G.el("div", { class: "row" }, [toggle, submit])]));
      }
      body.push(msg, G.el("div", { class: "row" }, [G.el("button", { class: "btn ghost", type: "button", text: L("Đóng", "Close"), onclick: close })]));
    }
    dlg = G.el("dialog", { class: "confirm" }, body);
    dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); });
    document.body.append(dlg);
    dlg.showModal();
  }

  const buttons = new Set();
  function renderButtons() {
    for (const b of buttons) {
      b.textContent = G.online ? "☁ Online" : "💾 Offline";
      b.title = L("Đổi chế độ chơi", "Change play mode");
    }
  }
  G.syncButton = () => {
    const b = G.el("button", { class: "icon-btn sync-btn", type: "button", onclick: openDialog });
    buttons.add(b); renderButtons();
    return b;
  };

  G.sync = { push, pull, clearRemote };
  document.dispatchEvent(new CustomEvent("itg:sync-ready"));
  finishOauth().then(pull);
})();
