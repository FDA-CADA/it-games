/* Phòng Lab Hệ Điều Hành — tám mô phỏng về phần mềm và hệ điều hành. Xem README.md. */
(function () {
  "use strict";
  const { $, $$, L } = G;
  const GAME_ID = "os-lab";
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pressGroup = (container, attr, val) => $$("[data-" + attr + "]", container).forEach((b) => b.setAttribute("aria-pressed", b.dataset[attr] === val ? "true" : "false"));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* bỏ qua */ } },
  };

  /* ---------- tab, tiến độ, bộ chạy tự động ---------- */
  const TABS = [
    ["layers", L("Các lớp phần mềm", "Software layers"), L("Một yêu cầu đi xuống qua OS tới phần cứng", "A request travels down through the OS to the hardware")],
    ["memory", L("Bộ nhớ & paging", "Memory & paging"), L("Monoprogramming, paging, demand paging", "Monoprogramming, paging, demand paging")],
    ["process", L("Lập lịch tiến trình", "Process scheduling"), L("Hold, Ready, Running, Waiting và scheduler", "Hold, Ready, Running, Waiting and the scheduler")],
    ["deadlock", L("Deadlock", "Deadlock"), L("Bốn điều kiện và ba cách phá", "Four conditions and three ways to break them")],
    ["dining", L("Bữa tối triết gia", "Dining philosophers"), L("Deadlock và starvation", "Deadlock and starvation")],
    ["aistack", L("AI stack", "AI stack"), L("Thiếu một lớp, lỗi ở đâu?", "Miss a layer: where does it break?")],
    ["terminal", L("Terminal Linux", "Linux terminal"), L("Hỏi từng khối của OS bằng lệnh", "Query each OS block with a command")],
    ["choose", L("Chọn hệ điều hành", "Choose an OS"), L("Windows, Linux hay macOS?", "Windows, Linux or macOS?")],
  ];
  const stops = [];
  function autoRunner(btn, step, ms) {
    let id = null;
    const label = btn.textContent;
    function stop() { if (id) { clearInterval(id); id = null; } btn.textContent = label; btn.setAttribute("aria-pressed", "false"); }
    function start() {
      stop();
      btn.textContent = L("Dừng", "Stop");
      btn.setAttribute("aria-pressed", "true");
      if (step() === false) { stop(); return; }
      id = setInterval(() => { if (step() === false) stop(); }, ms);
    }
    btn.addEventListener("click", () => (id ? stop() : start()));
    stops.push(stop);
    return { stop };
  }

  const tabBtns = $$("#tabs [role=tab]");
  let curTab = null;
  function showTab(id, focus) {
    if (!TABS.some((t) => t[0] === id)) id = "layers";
    stops.forEach((f) => f());
    curTab = id;
    tabBtns.forEach((b, i) => {
      const on = b.dataset.tab === id;
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
      b.setAttribute("aria-controls", b.dataset.tab);
      if (on) { if (focus) b.focus(); b.scrollIntoView({ block: "nearest", inline: "nearest" }); }
    });
    $$(".panel").forEach((p) => { p.hidden = p.id !== id; });
    store.set("itgames:oslab-tab", id);
  }
  tabBtns.forEach((b, i) => {
    b.addEventListener("click", () => showTab(b.dataset.tab));
    b.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const n = tabBtns[(i + (e.key === "ArrowRight" ? 1 : -1) + tabBtns.length) % tabBtns.length];
        showTab(n.dataset.tab, true);
        e.preventDefault();
      }
    });
  });
  // Tab được tính là đã khám phá khi người chơi thao tác lần đầu trong đó
  $$(".panel").forEach((p) => p.addEventListener("click", (e) => {
    if (!e.target.closest("button, input, select")) return;
    const i = TABS.findIndex((t) => t[0] === p.id);
    if (i >= 0 && G.progress.best(GAME_ID, i) == null) {
      G.progress.record(GAME_ID, i, 100, TABS.length);
      G.toast(L(`✓ Đã khám phá: ${TABS[i][1]}`, `✓ Explored: ${TABS[i][1]}`), "good");
    }
  }));

  /* =========================================================
     1. LAYERS
     ========================================================= */
  const LNAME = { user: "User", app: "App", os: "OS", hw: "HW" };
  const SCEN = {
    save: [
      ["user", "down", L("Bạn bấm <b>Ctrl+S</b> trong Word.", "You press <b>Ctrl+S</b> in Word.")],
      ["app", "down", L("Word không tự ghi đĩa. Nó gọi OS: <i>“ghi giúp tôi file baocao.docx”</i>.", "Word does not write to disk itself. It asks the OS: <i>“please write baocao.docx for me”</i>.")],
      ["os", "down", L("<b>File manager</b> kiểm tra quyền ghi và tìm chỗ trống trên đĩa.", "The <b>file manager</b> checks write permission and finds free space on the disk.")],
      ["os", "down", L("<b>Device manager</b> đưa yêu cầu vào hàng đợi của ổ SSD và gọi <b>driver</b> của ổ.", "The <b>device manager</b> queues the request for the SSD and calls the drive's <b>driver</b>.")],
      ["hw", "down", L("SSD ghi các bit xuống. Word không cần biết đây là SSD hay HDD, của hãng nào.", "The SSD writes the bits. Word does not need to know whether it is an SSD or an HDD, or whose.")],
      ["os", "up", L("OS báo lại cho Word: đã ghi xong.", "The OS reports back to Word: write complete.")],
      ["app", "up", L("Word hiện dòng <i>“Đã lưu”</i>.", "Word shows <i>“Saved”</i>.")],
      ["user", "up", L("Bạn thấy file đã được lưu. Cả chuyến đi mất vài mili-giây.", "You see the file is saved. The whole trip took a few milliseconds.")],
    ],
    print: [
      ["user", "down", L("Bạn bấm <b>In</b> bài tập.", "You click <b>Print</b> on your assignment.")],
      ["app", "down", L("Word gửi tài liệu cho OS kèm yêu cầu in.", "Word hands the document to the OS with a print request.")],
      ["os", "down", L("<b>Device manager</b> xếp lệnh in vào hàng đợi của máy in. Phía trước còn 3 lệnh của các bạn cùng phòng lab.", "The <b>device manager</b> puts the job in the printer's queue. Three jobs from other lab users are ahead of it.")],
      ["os", "down", L("Đến lượt, OS gọi <b>printer driver</b> để dịch tài liệu sang ngôn ngữ máy in hiểu.", "When its turn comes, the OS calls the <b>printer driver</b> to translate the document into a language the printer understands.")],
      ["hw", "down", L("Máy in nhận lệnh và in ra giấy. Không có driver thì bước này không xảy ra.", "The printer receives the job and prints. Without the driver this step never happens.")],
      ["os", "up", L("Device manager báo lệnh đã xong và chuyển sang lệnh tiếp theo trong hàng đợi.", "The device manager reports the job done and moves on to the next one in the queue.")],
      ["app", "up", L("Word báo “Đã gửi tới máy in”.", "Word says “Sent to printer”.")],
      ["user", "up", L("Bạn ra lấy bài.", "You go and pick up your pages.")],
    ],
    video: [
      ["user", "down", L("Bạn mở một video YouTube trong Chrome.", "You open a YouTube video in Chrome.")],
      ["app", "down", L("Chrome cần dữ liệu từ mạng, cần RAM làm bộ đệm và cần màn hình để hiển thị.", "Chrome needs data from the network, RAM for a buffer and a screen to display on.")],
      ["os", "down", L("<b>Process manager</b> chia time slot CPU cho Chrome cùng hàng trăm process khác.", "The <b>process manager</b> shares CPU time slots between Chrome and hundreds of other processes.")],
      ["os", "down", L("<b>Memory manager</b> cấp thêm page RAM cho bộ đệm video.", "The <b>memory manager</b> hands out extra RAM pages for the video buffer.")],
      ["os", "down", L("OS gọi <b>driver card mạng</b> để nhận dữ liệu và <b>driver GPU</b> để giải mã hình.", "The OS calls the <b>network card driver</b> to receive data and the <b>GPU driver</b> to decode the picture.")],
      ["hw", "down", L("Card Wi-Fi nhận gói tin, GPU giải mã khung hình, loa phát âm thanh.", "The Wi-Fi card receives packets, the GPU decodes frames, the speakers play sound.")],
      ["os", "up", L("OS chuyển dữ liệu đã nhận lên cho Chrome.", "The OS passes the received data up to Chrome.")],
      ["app", "up", L("Chrome ghép hình và tiếng thành video.", "Chrome combines picture and sound into video.")],
      ["user", "up", L("Bạn xem video mượt mà mà không thấy bên dưới có bao nhiêu lớp đang làm việc.", "You watch smoothly, never seeing how many layers are working underneath.")],
    ],
  };
  let scen = "save", li = -1;
  function renderLayers() {
    const st = SCEN[scen];
    $("#layerSteps").innerHTML = st.map((s, i) => `<li class="${i < li ? "done" : i === li ? "cur" : ""}"><span class="tag">${LNAME[s[0]]}</span><span>${s[2]}</span></li>`).join("");
    $$("#stack .layer").forEach((el) => {
      const cur = li >= 0 && st[li][0] === el.dataset.l;
      el.classList.toggle("active", cur);
      $(".lmsg", el).innerHTML = cur ? `<span class="dir">${st[li][1] === "down" ? L("↓ yêu cầu đi xuống", "↓ request goes down") : L("↑ kết quả đi lên", "↑ result comes up")}</span>${st[li][2]}` : "";
    });
    $("#layerNext").disabled = li >= st.length - 1;
  }
  function layerNext() { const n = SCEN[scen].length; if (li < n - 1) { li++; renderLayers(); } return li < n - 1; }
  $("#layerNext").addEventListener("click", layerNext);
  const layerAuto = autoRunner($("#layerAuto"), () => { if (li >= SCEN[scen].length - 1) li = -1; return layerNext(); }, 1600);
  $("#layerReset").addEventListener("click", () => { layerAuto.stop(); li = -1; renderLayers(); });
  $("#scen").addEventListener("click", (e) => {
    const b = e.target.closest("[data-s]");
    if (!b) return;
    layerAuto.stop(); scen = b.dataset.s; pressGroup($("#scen"), "s", scen); li = -1; renderLayers();
  });
  renderLayers();

  const CLS = [
    ["Zalo", "A", L("Ứng dụng nhắn tin phục vụ người dùng.", "A messaging app that serves the user.")],
    ["Ubuntu", "S", L("Hệ điều hành (bản phân phối Linux).", "An operating system (a Linux distribution).")],
    [L("Driver card NVIDIA", "NVIDIA graphics driver"), "S", L("Device driver: giúp OS nói chuyện với GPU.", "A device driver: lets the OS talk to the GPU.")],
    ["Jupyter Notebook", "A", L("Ứng dụng để viết và chạy code.", "An application for writing and running code.")],
    ["Windows Defender", "S", L("Utility: phần mềm diệt virus, hỗ trợ OS.", "A utility: antivirus software that supports the OS.")],
    ["7-Zip", "S", L("Utility: công cụ nén file.", "A utility: a file compression tool.")],
    ["Photoshop", "A", L("Ứng dụng chuyên dụng (specialized).", "A specialized application.")],
    ["macOS", "S", L("Hệ điều hành của Apple.", "Apple's operating system.")],
    [L("Driver máy in", "Printer driver"), "S", L("Device driver.", "A device driver.")],
    ["Python", "*", L("Slide xếp Python vào application. Một số tài liệu xếp trình thông dịch vào system software. Điều quan trọng là biết nó chạy trên OS và phục vụ lập trình viên.", "The slides file Python under application software. Some textbooks file the interpreter under system software. What matters is knowing it runs on the OS and serves programmers.")],
  ];
  const clsAns = {};
  function renderCls() {
    $("#cls").innerHTML = CLS.map((c, i) => {
      const a = clsAns[i];
      let cls = "", fb = "";
      if (a) { const ok = c[1] === "*" || a === c[1]; cls = ok ? "right" : "wrong"; fb = (ok ? L("Đúng. ", "Correct. ") : L("Chưa đúng. ", "Not quite. ")) + c[2]; }
      return `<div class="clsitem ${cls}"><div class="top"><b>${esc(c[0])}</b><div class="row">
        <button class="chip" data-i="${i}" data-a="S" aria-pressed="${a === "S"}">System</button>
        <button class="chip" data-i="${i}" data-a="A" aria-pressed="${a === "A"}">Application</button></div></div>
        ${fb ? `<p class="fb">${fb}</p>` : ""}</div>`;
    }).join("");
    const done = Object.keys(clsAns).length, right = Object.entries(clsAns).filter(([i, a]) => CLS[i][1] === "*" || CLS[i][1] === a).length;
    $("#clsScore").textContent = done ? L(`Đúng ${right}/${done}`, `${right}/${done} correct`) : L("Chọn cho từng phần mềm", "Choose for each piece of software");
  }
  $("#cls").addEventListener("click", (e) => { const b = e.target.closest("[data-a]"); if (!b) return; clsAns[b.dataset.i] = b.dataset.a; renderCls(); });
  $("#clsReset").addEventListener("click", () => { for (const k in clsAns) delete clsAns[k]; renderCls(); });
  renderCls();

  /* =========================================================
     2. MEMORY
     ========================================================= */
  const PROGS = [{ id: "A", name: "Chrome", pages: 4, c: "var(--c1)" }, { id: "B", name: "Zalo", pages: 3, c: "var(--c2)" }, { id: "C", name: "VS Code", pages: 5, c: "var(--c3)" }, { id: "D", name: "Spotify", pages: 2, c: "var(--c4)" }];
  const NF = 12, OSF = 2;
  const MNOTE = {
    mono: L("<b>Monoprogramming:</b> RAM chỉ chứa OS và đúng một chương trình. Muốn chạy chương trình khác thì phải đẩy chương trình cũ ra. Đơn giản nhưng phí RAM và CPU.", "<b>Monoprogramming:</b> RAM holds the OS and exactly one program. To run another, the old one must be pushed out. Simple, but it wastes RAM and CPU."),
    paging: L("<b>Paging:</b> chương trình chia thành các page, RAM chia thành các frame cùng cỡ. Page vào frame trống bất kỳ, không cần liền nhau. Phải nạp đủ mọi page thì chương trình mới chạy.", "<b>Paging:</b> a program is split into pages and RAM into frames of the same size. A page can go in any free frame, not necessarily next to each other. Every page must be loaded before the program runs."),
    demand: L("<b>Demand paging:</b> chỉ nạp page đang cần. Truy cập page chưa có trong RAM gây <i>page fault</i>; nếu RAM đầy, OS đẩy page vào sớm nhất ra đĩa. Đây là ý tưởng của <i>virtual memory</i>.", "<b>Demand paging:</b> load only the page that is needed. Touching a page that is not in RAM causes a <i>page fault</i>; if RAM is full, the OS pushes the oldest page out to disk. This is the idea behind <i>virtual memory</i>."),
  };
  let mem = { mode: "paging" };
  function memReset() {
    mem = { mode: mem.mode, frames: Array(NF).fill(null), active: {}, fifo: [], faults: 0, swaps: 0, hits: 0, msg: L("RAM đang trống. Bấm Nạp ở một chương trình.", "RAM is empty. Press Load on a program."), flash: [] };
    for (let i = 0; i < OSF; i++) mem.frames[i] = { os: true };
  }
  const P_ = (id) => PROGS.find((p) => p.id === id);
  const freeFrames = () => mem.frames.map((f, i) => (f ? -1 : i)).filter((i) => i >= 0);
  const locOf = (id, pg) => mem.frames.findIndex((f) => f && f.pid === id && f.page === pg);
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function place(id, pg, f) { mem.frames[f] = { pid: id, page: pg }; mem.fifo.push(f); mem.flash.push(f); }
  function unload(id) { mem.frames = mem.frames.map((f) => (f && f.pid === id ? null : f)); mem.fifo = mem.fifo.filter((f) => mem.frames[f]); delete mem.active[id]; }
  function faultIn(id, pg) {
    mem.faults++;
    let note = "", free = freeFrames();
    if (!free.length) {
      const v = mem.fifo.shift(), old = mem.frames[v];
      mem.frames[v] = null; mem.swaps++;
      note = L(` RAM đầy: OS đẩy page ${old.pid}·${old.page} (vào sớm nhất) ra đĩa để lấy frame F${v}.`, ` RAM is full: the OS pushes page ${old.pid}·${old.page} (the oldest) out to disk to free frame F${v}.`);
      free = [v];
    }
    const f = free[Math.floor(Math.random() * free.length)];
    place(id, pg, f);
    return L(`Page fault: ${P_(id).name} cần page ${pg} nhưng page đang nằm trên đĩa. OS nạp vào F${f}.`, `Page fault: ${P_(id).name} needs page ${pg} but it is on disk. The OS loads it into F${f}.`) + note;
  }
  function memLoad(id) {
    const p = P_(id);
    mem.flash = [];
    if (mem.active[id]) { mem.msg = L(`${p.name} đã có trong RAM.`, `${p.name} is already in RAM.`); return; }
    if (mem.mode === "mono") {
      const out = Object.keys(mem.active).map((k) => P_(k).name);
      Object.keys(mem.active).forEach(unload);
      for (let i = 0; i < p.pages; i++) place(id, i, OSF + i);
      mem.active[id] = true;
      mem.msg = out.length
        ? L(`${out.join(", ")} bị đẩy ra khỏi RAM để nhường chỗ cho ${p.name}. Monoprogramming chỉ cho một chương trình.`, `${out.join(", ")} was pushed out of RAM to make room for ${p.name}. Monoprogramming allows only one program.`)
        : L(`${p.name} được nạp liền một khối ngay sau vùng OS. ${NF - OSF - p.pages} frame còn lại bỏ trống, không ai dùng.`, `${p.name} is loaded as one contiguous block right after the OS area. The other ${NF - OSF - p.pages} frames sit empty and unused.`);
    } else if (mem.mode === "paging") {
      const free = freeFrames();
      if (free.length < p.pages) {
        mem.msg = L(`Không nạp được ${p.name}: cần ${p.pages} frame nhưng chỉ còn ${free.length}. Gỡ bớt chương trình, hoặc chuyển sang demand paging để chỉ nạp page cần dùng.`, `Cannot load ${p.name}: it needs ${p.pages} frames but only ${free.length} are free. Remove a program, or switch to demand paging to load only the pages in use.`);
        return;
      }
      const pick = shuffle(free).slice(0, p.pages);
      pick.forEach((f, i) => place(id, i, f));
      mem.active[id] = true;
      mem.msg = L(`${p.name}: ${p.pages} page nằm ở các frame ${pick.map((f) => "F" + f).join(", ")}. Không liền nhau vẫn chạy được, page table ghi lại vị trí.`, `${p.name}: ${p.pages} pages sit in frames ${pick.map((f) => "F" + f).join(", ")}. They need not be adjacent; the page table records where each one is.`);
    } else {
      mem.active[id] = true;
      mem.msg = L(`${p.name} khởi động. `, `${p.name} starts. `) + faultIn(id, 0) + L(" Các page khác vẫn nằm trên đĩa.", " Its other pages stay on disk.");
    }
  }
  function memAccess(id) {
    mem.flash = [];
    const p = P_(id), pg = Math.floor(Math.random() * p.pages), f = locOf(id, pg);
    if (f >= 0) { mem.hits++; mem.flash = [f]; mem.msg = L(`${p.name} đọc page ${pg}: đã có sẵn ở F${f}. Không cần chạm tới đĩa.`, `${p.name} reads page ${pg}: already in F${f}. No disk access needed.`); }
    else mem.msg = faultIn(id, pg);
  }
  function renderMem() {
    pressGroup($("#memMode"), "m", mem.mode);
    $("#memNote").innerHTML = MNOTE[mem.mode];
    $("#progs").innerHTML = PROGS.map((p) => `<div class="prog" style="--pc:${p.c}"><span class="swatch"></span><div><b>${p.name}</b> <span class="note">· ${L("chương trình", "program")} ${p.id} · ${p.pages} page${mem.active[p.id] ? " · " + L("đang chạy", "running") : ""}</span></div>
      <div class="acts"><button class="lbtn sm" data-load="${p.id}" ${mem.active[p.id] ? "disabled" : ""}>${L("Nạp", "Load")}</button>
      ${mem.mode === "demand" ? `<button class="lbtn sm" data-acc="${p.id}" ${mem.active[p.id] ? "" : "disabled"}>${L("Truy cập page ngẫu nhiên", "Access a random page")}</button>` : ""}
      <button class="lbtn sm ghost" data-un="${p.id}" ${mem.active[p.id] ? "" : "disabled"}>${L("Gỡ", "Remove")}</button></div></div>`).join("");
    const free = freeFrames().length;
    const st = [[L("Frame trống", "Free frames"), free + "/" + (NF - OSF)]];
    if (mem.mode === "demand") st.push([L("Page fault", "Page faults"), mem.faults], [L("Đẩy ra đĩa", "Swapped out"), mem.swaps], [L("Có sẵn trong RAM", "Already in RAM"), mem.hits]);
    else st.push([L("Chương trình trong RAM", "Programs in RAM"), Object.keys(mem.active).length]);
    $("#memStats").innerHTML = st.map((s) => `<div class="stat"><b>${s[1]}</b><span>${s[0]}</span></div>`).join("");
    $("#memLog").textContent = mem.msg;
    $("#ram").innerHTML = mem.frames.map((f, i) => {
      const fl = mem.flash.includes(i) ? " flash" : "";
      if (!f) return `<div class="frame${fl}"><span>F${i}</span><span>${L("trống", "free")}</span></div>`;
      if (f.os) return `<div class="frame os"><span>F${i}</span><b>OS</b></div>`;
      return `<div class="frame used${fl}" style="--pc:${P_(f.pid).c}"><span>F${i}</span><b>${f.pid}·${f.page}</b></div>`;
    }).join("");
    const disk = [];
    PROGS.forEach((p) => { for (let i = 0; i < p.pages; i++) if (locOf(p.id, i) < 0) disk.push(`<span class="pg${mem.active[p.id] ? "" : " idle"}" style="--pc:${p.c}">${p.id}·${i}</span>`); });
    $("#disk").innerHTML = disk.join("") || `<span class="note">${L("Mọi page đều đã ở trong RAM.", "Every page is in RAM.")}</span>`;
    const act = PROGS.filter((p) => mem.active[p.id]);
    $("#ptables").innerHTML = act.length ? act.map((p) => {
      let r = "";
      for (let i = 0; i < p.pages; i++) { const f = locOf(p.id, i); r += `<tr><td>${i}</td><td>${f >= 0 ? "F" + f : `<span style="color:var(--warn)">${L("đĩa", "disk")}</span>`}</td></tr>`; }
      return `<table class="pt"><caption><span class="swatch" style="--pc:${p.c};display:inline-block;vertical-align:-2px"></span> ${p.name}</caption><thead><tr><th>page</th><th>frame</th></tr></thead><tbody>${r}</tbody></table>`;
    }).join("") : `<span class="note">${L("Chưa có chương trình nào chạy.", "No program is running yet.")}</span>`;
  }
  $("#progs").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.load) memLoad(b.dataset.load);
    else if (b.dataset.acc) memAccess(b.dataset.acc);
    else if (b.dataset.un) { mem.flash = []; unload(b.dataset.un); mem.msg = L(`${P_(b.dataset.un).name} đã đóng. OS thu hồi các frame của nó.`, `${P_(b.dataset.un).name} closed. The OS reclaims its frames.`); }
    renderMem();
  });
  $("#memMode").addEventListener("click", (e) => { const b = e.target.closest("[data-m]"); if (!b) return; mem.mode = b.dataset.m; memReset(); renderMem(); });
  $("#memReset").addEventListener("click", () => { memReset(); renderMem(); });
  memReset(); renderMem();

  /* =========================================================
     3. PROCESS SCHEDULER
     ========================================================= */
  const PDEF = [{ id: "P1", name: "Chrome", burst: 6, io: [3], c: "var(--c1)" }, { id: "P2", name: "Zalo", burst: 3, io: [], c: "var(--c2)" }, { id: "P3", name: "Word", burst: 5, io: [2], c: "var(--c3)" }, { id: "P4", name: "Spotify", burst: 4, io: [1], c: "var(--c4)" }, { id: "P5", name: "VS Code", burst: 2, io: [], c: "var(--c5)" }];
  const MEMCAP = 3, IOT = 2;
  let ps;
  function procReset() { ps = { t: 0, procs: PDEF.map((d) => ({ ...d, done: 0, q: 0, ioLeft: 0, ioDone: [], finishAt: null })), hold: PDEF.map((d) => d.id), ready: [], waiting: [], running: null, term: [], gantt: [], busy: 0, log: [] }; }
  const PP = (id) => ps.procs.find((p) => p.id === id);
  function procStep() {
    if (ps.term.length === ps.procs.length) return false;
    const policy = $("#policy").value, quantum = +$("#quantum").value, ev = [];
    for (const id of [...ps.waiting]) {
      const p = PP(id);
      p.ioLeft--;
      if (p.ioLeft <= 0) { ps.waiting.splice(ps.waiting.indexOf(id), 1); ps.ready.push(id); ev.push(L(`${id} ${p.name}: I/O xong → Ready`, `${id} ${p.name}: I/O done → Ready`)); }
    }
    const inMem = () => ps.ready.length + ps.waiting.length + (ps.running ? 1 : 0);
    while (ps.hold.length && inMem() < MEMCAP) { const id = ps.hold.shift(); ps.ready.push(id); ev.push(L(`${id} ${PP(id).name} được nạp vào RAM → Ready`, `${id} ${PP(id).name} is loaded into RAM → Ready`)); }
    if (!ps.running && ps.ready.length) {
      let idx = 0;
      if (policy === "sjf") idx = ps.ready.reduce((b, id, i, a) => { const r = (p) => p.burst - p.done; return r(PP(id)) < r(PP(a[b])) ? i : b; }, 0);
      const id = ps.ready.splice(idx, 1)[0];
      ps.running = id; PP(id).q = 0;
      ev.push(L(`Scheduler chọn ${id} ${PP(id).name} → Running`, `Scheduler picks ${id} ${PP(id).name} → Running`) + (policy === "sjf" ? L(" (còn ít việc nhất)", " (least work left)") : ""));
    }
    if (ps.running) {
      const p = PP(ps.running);
      p.done++; p.q++; ps.busy++; ps.gantt.push(p.id);
      if (p.done >= p.burst) { ps.term.push(p.id); ps.running = null; p.finishAt = ps.t + 1; ev.push(L(`${p.id} ${p.name} chạy xong → Terminated, trả RAM`, `${p.id} ${p.name} finished → Terminated, RAM released`)); }
      else if (p.io.includes(p.done) && !p.ioDone.includes(p.done)) { p.ioDone.push(p.done); p.ioLeft = IOT; ps.waiting.push(p.id); ps.running = null; ev.push(L(`${p.id} ${p.name} cần đọc đĩa (I/O) → Waiting, nhường CPU`, `${p.id} ${p.name} needs disk I/O → Waiting, gives up the CPU`)); }
      else if (policy === "rr" && p.q >= quantum) { ps.ready.push(p.id); ps.running = null; ev.push(L(`${p.id} ${p.name} hết time slot → quay lại cuối Ready`, `${p.id} ${p.name} used up its time slot → back to the end of Ready`)); }
    } else { ps.gantt.push(null); ev.push(L("CPU rảnh: mọi process trong RAM đang chờ I/O", "CPU idle: every process in RAM is waiting for I/O")); }
    ps.t++; ps.log.unshift({ t: ps.t, ev }); renderProc();
    return ps.term.length < ps.procs.length;
  }
  function chip(id, extra) { const p = PP(id); return `<span class="pchip" style="--pc:${p.c}">${p.id} ${p.name}<small>${extra != null ? extra : p.done + "/" + p.burst}</small></span>`; }
  function renderProc() {
    $("#q-hold").innerHTML = ps.hold.map((id) => chip(id)).join("");
    $("#q-ready").innerHTML = ps.ready.map((id) => chip(id)).join("");
    $("#q-run").innerHTML = ps.running ? chip(ps.running) : "";
    $("#q-wait").innerHTML = ps.waiting.map((id) => chip(id, L("I/O còn ", "I/O left ") + PP(id).ioLeft)).join("");
    $("#q-term").innerHTML = ps.term.map((id) => chip(id, "✓")).join("");
    const fin = ps.procs.filter((p) => p.finishAt);
    const avg = fin.length ? (fin.reduce((s, p) => s + p.finishAt, 0) / fin.length).toFixed(1) : "–";
    $("#procStats").innerHTML = [[ps.t, L("Nhịp đồng hồ", "Clock ticks")], [ps.t ? Math.round(ps.busy / ps.t * 100) + "%" : "–", L("CPU bận", "CPU busy")], [ps.ready.length + ps.waiting.length + (ps.running ? 1 : 0) + "/" + MEMCAP, L("Process trong RAM", "Processes in RAM")], [ps.term.length + "/" + ps.procs.length, L("Đã xong", "Finished")], [avg, L("TB nhịp tới khi xong", "Avg ticks to finish")]].map((s) => `<div class="stat"><b>${s[0]}</b><span>${s[1]}</span></div>`).join("");
    $("#gantt").innerHTML = ps.gantt.map((id) => (id ? `<div class="gcell" style="--pc:${PP(id).c}">${id}</div>` : '<div class="gcell idle">–</div>')).join("") || `<span class="note">${L("Bấm Bước tiếp để bắt đầu.", "Press Next step to begin.")}</span>`;
    $("#gaxis").innerHTML = ps.gantt.map((_, i) => `<span>${i + 1}</span>`).join("");
    $("#evlog").innerHTML = ps.log.length ? ps.log.map((l) => `<div><span class="t">t=${l.t}</span><span>${l.ev.map(esc).join("<br>")}</span></div>`).join("") : `<span class="note">${L("Chưa có sự kiện. Mọi process đang ở Hold, chờ được nạp vào RAM.", "No events yet. Every process is in Hold, waiting to be loaded into RAM.")}</span>`;
    if (ps.term.length === ps.procs.length) $("#evlog").insertAdjacentHTML("afterbegin", `<p class="banner good">${L(`Xong cả 5 process sau ${ps.t} nhịp, CPU bận ${Math.round(ps.busy / ps.t * 100)}% thời gian.`, `All 5 processes finished after ${ps.t} ticks, with the CPU busy ${Math.round(ps.busy / ps.t * 100)}% of the time.`)}</p>`);
    $("#procStep").disabled = ps.term.length === ps.procs.length;
  }
  $("#plegend").innerHTML = PDEF.map((d) => `<span class="pchip" style="--pc:${d.c}">${d.id} ${d.name}<small>${d.burst} ${L("nhịp", "ticks")}${d.io.length ? " · " + L("I/O sau nhịp ", "I/O after tick ") + d.io.join(",") : ""}</small></span>`).join("");
  $("#procStep").addEventListener("click", procStep);
  const procAuto = autoRunner($("#procAuto"), procStep, 800);
  $("#procReset").addEventListener("click", () => { procAuto.stop(); procReset(); renderProc(); });
  ["policy", "quantum"].forEach((id) => $("#" + id).addEventListener("change", () => { procAuto.stop(); procReset(); renderProc(); }));
  $("#policy").addEventListener("change", () => { $("#quantum").closest("label").hidden = $("#policy").value !== "rr"; });
  procReset(); renderProc();

  /* =========================================================
     4. DEADLOCK
     ========================================================= */
  function S(f1, f2, rA, rB, msg, x) { return Object.assign({ f1, f2, rA: rA || [], rB: rB || [], msg }, x || {}); }
  const base = [
    S(null, null, null, null, L("A và B đều cần <b>cả File1 và File2</b> mới chạy xong. Bấm Bước tiếp.", "A and B both need <b>File1 and File2</b> to finish. Press Next step.")),
    S("A", null, null, null, L("A xin File1. File1 đang trống nên OS cấp cho A.", "A requests File1. It is free, so the OS grants it to A.")),
    S("A", "B", null, null, L("B xin File2. File2 đang trống nên OS cấp cho B.", "B requests File2. It is free, so the OS grants it to B.")),
    S("A", "B", ["File2"], null, L("A xin File2 nhưng B đang giữ. A phải chờ, và vẫn giữ File1.", "A requests File2 but B holds it. A must wait, still holding File1.")),
    S("A", "B", ["File2"], ["File1"], L("B xin File1 nhưng A đang giữ. B chờ, vẫn giữ File2. Hai bên chờ nhau mãi mãi.", "B requests File1 but A holds it. B waits, still holding File2. Each waits for the other forever."), { dead: true }),
  ];
  const DL = {
    none: { broken: null, steps: base },
    preempt: { broken: "nopre", steps: [...base.slice(0, 4),
      S("A", "B", ["File2"], ["File1"], L("B xin File1 nhưng A đang giữ. Vòng chờ đã hình thành, nhưng lần này OS được phép can thiệp.", "B requests File1 but A holds it. A circular wait has formed, but this time the OS is allowed to step in."), { danger: true }),
      S("A", "A", null, ["File1", "File2"], L("OS <b>thu hồi</b> File2 từ B và cấp cho A. Điều kiện <i>no preemption</i> bị phá. B quay lại chờ cả hai file.", "The OS <b>takes</b> File2 back from B and gives it to A. The <i>no preemption</i> condition is broken. B goes back to waiting for both files.")),
      S(null, null, null, ["File1", "File2"], L("A chạy xong và trả cả hai file.", "A finishes and releases both files."), { doneA: true }),
      S("B", "B", null, null, L("B nhận cả hai file và chạy xong. Cái giá: công việc của B bị ngắt giữa chừng và phải làm lại.", "B receives both files and finishes. The price: B's work was interrupted midway and had to be redone."), { doneA: true, doneB: true, ok: true })] },
    all: { broken: "hold", steps: [
      S(null, null, null, null, L("Luật mới: process phải xin <b>đủ mọi tài nguyên trong một lần</b>, không được giữ một phần rồi chờ phần còn lại.", "New rule: a process must request <b>every resource in one go</b>; it may not hold part and wait for the rest.")),
      S("A", "A", null, null, L("A xin cả File1 và File2. Cả hai trống nên OS cấp cùng lúc.", "A requests both File1 and File2. Both are free, so the OS grants them together.")),
      S("A", "A", null, ["File1", "File2"], L("B xin cả hai nhưng chưa đủ. B chờ mà <b>không giữ gì</b>, nên không có vòng chờ.", "B requests both but they are not all available. B waits <b>holding nothing</b>, so no circular wait can form.")),
      S(null, null, null, ["File1", "File2"], L("A chạy xong và trả cả hai file.", "A finishes and releases both files."), { doneA: true }),
      S("B", "B", null, null, L("B nhận cả hai và chạy xong. Nhược điểm: process cần nhiều tài nguyên dễ phải chờ rất lâu. Đó là starvation, xem tab Bữa tối triết gia.", "B receives both and finishes. The drawback: a process needing many resources may wait very long. That is starvation; see the Dining philosophers tab."), { doneA: true, doneB: true, ok: true })] },
    order: { broken: "circ", steps: [
      S(null, null, null, null, L("Luật mới: mọi process phải xin theo <b>thứ tự cố định</b>, File1 trước rồi mới tới File2.", "New rule: every process must request in a <b>fixed order</b>, File1 first, then File2.")),
      S("A", null, null, null, L("A xin File1. Trống nên OS cấp.", "A requests File1. It is free, so the OS grants it.")),
      S("A", null, null, ["File1"], L("B cũng phải xin File1 trước. A đang giữ nên B chờ, nhưng B chưa giữ gì.", "B must also request File1 first. A holds it, so B waits, but B holds nothing yet.")),
      S("A", "A", null, ["File1"], L("A xin File2. Trống nên OS cấp. Không ai giữ File2 mà chờ File1, nên không thể có vòng chờ.", "A requests File2. It is free, so the OS grants it. Nobody can hold File2 while waiting for File1, so no circular wait is possible.")),
      S(null, null, null, ["File1"], L("A chạy xong và trả cả hai file.", "A finishes and releases both files."), { doneA: true }),
      S("B", null, null, ["File2"], L("B nhận File1, rồi xin tiếp File2.", "B receives File1, then requests File2."), { doneA: true }),
      S("B", "B", null, null, L("B nhận File2 và chạy xong. Cả hai đều hoàn thành.", "B receives File2 and finishes. Both complete."), { doneA: true, doneB: true, ok: true })] },
  };
  const CONDS = [
    ["mutual", "Mutual exclusion", L("Mỗi tài nguyên chỉ một process giữ. Không phá được với file đang ghi.", "Only one process can hold a resource. Cannot be broken for a file being written.")],
    ["hold", "Resource holding", L("Giữ cái đang có trong khi chờ cái khác.", "Hold what you have while waiting for something else.")],
    ["nopre", "No preemption", L("OS không được giành lại tài nguyên.", "The OS may not take a resource back.")],
    ["circ", "Circular waiting", L("Các process chờ nhau thành vòng.", "Processes wait on each other in a cycle.")],
  ];
  let dlK = "none", dlI = 0;
  function line(x1, y1, x2, y2, r1, r2, cls) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
    return `<line x1="${(x1 + ux * r1).toFixed(1)}" y1="${(y1 + uy * r1).toFixed(1)}" x2="${(x2 - ux * r2).toFixed(1)}" y2="${(y2 - uy * r2).toFixed(1)}" class="${cls}"/>`;
  }
  function renderDL() {
    const sc = DL[dlK], s = sc.steps[dlI];
    pressGroup($("#dlStrat"), "k", dlK);
    $("#dlMsg").innerHTML = s.msg;
    $("#dlCount").textContent = L(`Bước ${dlI + 1}/${sc.steps.length}`, `Step ${dlI + 1}/${sc.steps.length}`);
    $("#dlNext").disabled = dlI >= sc.steps.length - 1;
    $("#conds").innerHTML = CONDS.map((c) => {
      const br = sc.broken === c[0], on = (s.dead || s.danger) && !br;
      return `<li class="${br ? "broken" : on ? "on" : ""}"><span class="mk">${br ? "✕" : on ? "!" : "·"}</span><span><span class="t">${c[1]}</span>${br ? L(" (bị phá)", " (broken)") : ""}<small>${c[2]}</small></span></li>`;
    }).join("");
    $("#dlBanner").innerHTML = s.dead ? `<p class="banner bad">${L("DEADLOCK: cả bốn điều kiện cùng xảy ra. Không process nào chạy tiếp được.", "DEADLOCK: all four conditions hold at once. No process can continue.")}</p>` : s.ok ? `<p class="banner good">${L("Không có deadlock. Cả A và B đều chạy xong.", "No deadlock. Both A and B finish.")}</p>` : "";
    const P = { A: [64, 115], B: [296, 115] }, R = { File1: [180, 40], File2: [180, 190] };
    let g = `<defs><marker id="mA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" class="mkA"/></marker>
    <marker id="mR" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" class="mkR"/></marker></defs>
    <style>.as{stroke:var(--accent);stroke-width:2.5;marker-end:url(#mA)}.rq{stroke:var(--danger);stroke-width:2.5;stroke-dasharray:7 5;marker-end:url(#mR)}.mkA{fill:var(--accent)}.mkR{fill:var(--danger)}</style>`;
    [["File1", s.f1], ["File2", s.f2]].forEach(([r, o]) => { if (o) g += line(R[r][0], R[r][1], P[o][0], P[o][1], 22, 34, "as"); });
    s.rA.forEach((r) => (g += line(P.A[0], P.A[1], R[r][0], R[r][1], 34, 24, "rq")));
    s.rB.forEach((r) => (g += line(P.B[0], P.B[1], R[r][0], R[r][1], 34, 24, "rq")));
    [["A", s.doneA], ["B", s.doneB]].forEach(([k, d]) => {
      const [x, y] = P[k];
      g += `<circle cx="${x}" cy="${y}" r="30" fill="${d ? "var(--ok-soft)" : "var(--surface)"}" stroke="${s.dead ? "var(--danger)" : d ? "var(--ok)" : "var(--ink)"}" stroke-width="2.5"/>
      <text x="${x}" y="${y + 1}" text-anchor="middle" dominant-baseline="middle" font-size="20" font-weight="700" fill="var(--ink)">${k}${d ? " ✓" : ""}</text>
      <text x="${x}" y="${y + 48}" text-anchor="middle" font-size="12" fill="var(--muted)">Process ${k}</text>`;
    });
    Object.entries(R).forEach(([r, [x, y]]) => {
      const own = r === "File1" ? s.f1 : s.f2;
      g += `<rect x="${x - 46}" y="${y - 18}" width="92" height="36" rx="6" fill="var(--sunk)" stroke="var(--muted)" stroke-width="1.5"/>
      <text x="${x}" y="${y + 1}" text-anchor="middle" dominant-baseline="middle" font-size="14" font-weight="600" fill="var(--ink)">${r}</text>
      <text x="${x}" y="${r === "File1" ? y - 26 : y + 32}" text-anchor="middle" font-size="11" fill="var(--muted)">${own ? L(`đang do ${own} giữ`, `held by ${own}`) : L("trống", "free")}</text>`;
    });
    $("#dlGraph").innerHTML = g;
  }
  $("#dlStrat").addEventListener("click", (e) => { const b = e.target.closest("[data-k]"); if (!b) return; dlK = b.dataset.k; dlI = 0; renderDL(); });
  $("#dlNext").addEventListener("click", () => { if (dlI < DL[dlK].steps.length - 1) { dlI++; renderDL(); } });
  $("#dlReset").addEventListener("click", () => { dlI = 0; renderDL(); });
  renderDL();

  /* =========================================================
     5. DINING PHILOSOPHERS
     ========================================================= */
  const N = 5, EAT = 2, THINK = 1, STARVE = 8;
  const PHNOTE = {
    left: L("Mỗi người cầm đũa bên trái trước, rồi chờ đũa bên phải và không chịu nhả. Khi cả năm người đói cùng lúc, ai cũng cầm một chiếc và chờ chiếc thứ hai: <b>deadlock</b>.", "Everyone grabs the left chopstick first, then waits for the right one without letting go. When all five are hungry at once, each holds one and waits for the second: <b>deadlock</b>."),
    seat: L("Chỉ được cầm đũa khi lấy được <b>cả hai chiếc cùng lúc</b>, nên không còn deadlock. Nhưng khi tranh chấp, người ngồi ghế số nhỏ luôn được ưu tiên. Theo dõi triết gia số 5: <b>starvation</b>.", "A philosopher may pick up chopsticks only if <b>both are available at once</b>, so deadlock is gone. But in a conflict the lowest seat number always wins. Watch philosopher 5: <b>starvation</b>."),
    fair: L("Vẫn phải lấy đủ hai chiếc cùng lúc, nhưng người đã đợi lâu nhất được ưu tiên. Không deadlock, không ai chết đói.", "Still both chopsticks at once, but whoever has waited longest goes first. No deadlock, nobody starves."),
  };
  let ph;
  function phReset() { ph = { pol: ph ? ph.pol : "left", t: 0, p: Array.from({ length: N }, () => ({ s: "hungry", t: 0, wait: 0, ate: 0, maxWait: 0 })), c: Array(N).fill(null), dead: false }; }
  const L_ = (i) => i, R_ = (i) => (i + 1) % N;
  function phStep() {
    if (ph.dead) return false;
    ph.t++;
    ph.p.forEach((p) => { if (p.s === "think") { p.t--; if (p.t <= 0) p.s = "hungry"; } });
    ph.p.forEach((p, i) => { if (p.s === "eat") { p.t--; if (p.t <= 0) { ph.c[L_(i)] = null; ph.c[R_(i)] = null; p.s = "think"; p.t = THINK; p.ate++; } } });
    const order = [...Array(N).keys()];
    if (ph.pol === "fair") order.sort((a, b) => ph.p[b].wait - ph.p[a].wait || a - b);
    const ateNow = new Set();
    order.forEach((i) => {
      const p = ph.p[i];
      if (p.s !== "hungry") return;
      if (ph.pol === "left") {
        if (ph.c[L_(i)] === null) ph.c[L_(i)] = i;
        else if (ph.c[L_(i)] === i && ph.c[R_(i)] === null) { ph.c[R_(i)] = i; p.s = "eat"; p.t = EAT; ateNow.add(i); }
      } else if (ph.c[L_(i)] === null && ph.c[R_(i)] === null) { ph.c[L_(i)] = i; ph.c[R_(i)] = i; p.s = "eat"; p.t = EAT; ateNow.add(i); }
    });
    ph.p.forEach((p, i) => { if (p.s === "hungry") { p.wait++; p.maxWait = Math.max(p.maxWait, p.wait); } else if (ateNow.has(i)) p.wait = 0; });
    if (ph.pol === "left" && ph.p.every((p, i) => p.s === "hungry" && ph.c[L_(i)] === i && ph.c[R_(i)] !== i)) ph.dead = true;
    renderPh();
    return !ph.dead;
  }
  function phState(p) {
    if (p.s === "eat") return ["b-eat", L("Đang ăn", "Eating")];
    if (p.s === "think") return ["b-think", L("Đang nghĩ", "Thinking")];
    if (p.wait >= STARVE) return ["b-starve", L("Chết đói", "Starving")];
    return ["b-hungry", L("Đói, chờ đũa", "Hungry, waiting")];
  }
  function renderPh() {
    pressGroup($("#phPol"), "p", ph.pol);
    $("#phNote").innerHTML = PHNOTE[ph.pol];
    const starving = ph.p.map((p, i) => i).filter((i) => ph.p[i].wait >= STARVE);
    $("#phBanner").innerHTML = ph.dead ? `<p class="banner bad">${L(`DEADLOCK ở nhịp ${ph.t}: mỗi người cầm một chiếc đũa và chờ chiếc của người bên cạnh. Không ai ăn được nữa.`, `DEADLOCK at tick ${ph.t}: everyone holds one chopstick and waits for their neighbour's. Nobody can eat again.`)}</p>`
      : starving.length ? `<p class="banner bad">${L(`STARVATION: triết gia ${starving.map((i) => i + 1).join(", ")} đã đợi ${Math.max(...starving.map((i) => ph.p[i].wait))} nhịp. Hai người bên cạnh thay nhau ăn nên không bao giờ có đủ hai đũa.`, `STARVATION: philosopher ${starving.map((i) => i + 1).join(", ")} has waited ${Math.max(...starving.map((i) => ph.p[i].wait))} ticks. The two neighbours take turns eating, so both chopsticks are never free together.`)}</p>`
      : ph.t >= 12 && ph.pol === "fair" ? `<p class="banner good">${L("Ai cũng được ăn đều. Ưu tiên người đợi lâu nhất đã chặn starvation.", "Everyone eats evenly. Giving priority to the longest waiter prevents starvation.")}</p>` : "";
    $("#phTable").innerHTML = ph.p.map((p, i) => { const [c, t] = phState(p); return `<tr><td>${L("Triết gia", "Philosopher")} ${i + 1}</td><td><span class="pbadge ${c}">${t}</span></td><td class="num">${p.ate}</td><td class="num">${p.s === "hungry" ? p.wait + L(" nhịp", " ticks") : "–"}</td></tr>`; }).join("");
    const meals = ph.p.reduce((s, p) => s + p.ate, 0);
    $("#phStats").innerHTML = [[ph.t, L("Nhịp", "Ticks")], [meals, L("Tổng bữa đã ăn", "Total meals")], [Math.max(...ph.p.map((p) => p.maxWait)), L("Đợi lâu nhất", "Longest wait")]].map((s) => `<div class="stat"><b>${s[0]}</b><span>${s[1]}</span></div>`).join("");
    const cx = 170, cy = 170, pos = (a, r) => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
    let g = `<circle cx="${cx}" cy="${cy}" r="92" fill="var(--sunk)" stroke="var(--line)" stroke-width="2"/>
    <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-size="13" fill="var(--muted)">${L("bát cơm", "rice")}</text>`;
    const angP = (i) => -90 + i * 72;
    for (let i = 0; i < N; i++) { const [x, y] = pos(angP(i), 62); g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="15" fill="var(--surface)" stroke="var(--line)"/>`; }
    for (let j = 0; j < N; j++) {
      let a = -90 + (j - 0.5) * 72, r = 72;
      const o = ph.c[j];
      if (o !== null) { a = angP(o) + (j === L_(o) ? -17 : 17); r = 104; }
      const [x1, y1] = pos(a, r - 20), [x2, y2] = pos(a, r + 20);
      g += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${o !== null ? "var(--wait)" : "var(--muted)"}" stroke-width="5" stroke-linecap="round"/>`;
    }
    ph.p.forEach((p, i) => {
      const [x, y] = pos(angP(i), 138);
      const col = p.s === "eat" ? "var(--ok)" : p.s === "think" ? "var(--term)" : p.wait >= STARVE ? "var(--danger)" : "var(--wait)";
      g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="24" fill="${col}"/><text x="${x.toFixed(1)}" y="${(y + 1).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="17" font-weight="700" fill="#fff">${i + 1}</text>`;
    });
    $("#phSvg").innerHTML = g;
    $("#phStep").disabled = ph.dead;
  }
  $("#phStep").addEventListener("click", phStep);
  const phAuto = autoRunner($("#phAuto"), phStep, 700);
  $("#phReset").addEventListener("click", () => { phAuto.stop(); phReset(); renderPh(); });
  $("#phPol").addEventListener("click", (e) => { const b = e.target.closest("[data-p]"); if (!b) return; phAuto.stop(); ph.pol = b.dataset.p; phReset(); renderPh(); });
  phReset(); renderPh();

  /* =========================================================
     6. AI STACK
     ========================================================= */
  const AIL = [
    { id: "nb", name: "Jupyter Notebook", kind: "Application" },
    { id: "torch", name: "PyTorch", kind: L("Application (framework)", "Application (framework)") },
    { id: "py", name: "Python 3.11", kind: "Runtime" },
    { id: "cuda", name: "CUDA + cuDNN", kind: L("Thư viện cấp hệ thống", "System-level library"), mis: true },
    { id: "drv", name: "NVIDIA GPU driver", kind: "Device driver" },
    { id: "os", name: "Linux (Ubuntu)", kind: L("Hệ điều hành", "Operating system") },
    { id: "hw", name: "GPU NVIDIA", kind: L("Phần cứng", "Hardware") },
  ];
  const PRE = { ok: {}, nodrv: { drv: "no" }, mis: { cuda: "mis" }, notorch: { torch: "no" }, nogpu: { hw: "no", drv: "no", cuda: "no" } };
  let ai = {};
  function aiSet(pre) { ai = {}; AIL.forEach((l) => (ai[l.id] = "ok")); Object.assign(ai, PRE[pre] || {}); }
  let aiTimer = null, aiFlag = {};
  function renderAIL() {
    $("#ailayers").innerHTML = AIL.map((l) => `<div class="ailayer ${aiFlag[l.id] === "e" ? "bad" : aiFlag[l.id] === "w" ? "warnl" : ""}"><div><b>${l.name}</b><div class="k">${l.kind}</div></div>
      <div class="tog" role="group" aria-label="${l.name}">
        <button data-l="${l.id}" data-v="ok" aria-pressed="${ai[l.id] === "ok"}">${L("Có", "Yes")}</button>
        <button class="no" data-l="${l.id}" data-v="no" aria-pressed="${ai[l.id] === "no"}">${L("Thiếu", "Missing")}</button>
        ${l.mis ? `<button class="mis" data-l="${l.id}" data-v="mis" aria-pressed="${ai[l.id] === "mis"}">${L("Lệch bản", "Mismatch")}</button>` : ""}</div></div>`).join("");
  }
  function aiLines() {
    const out = [], F = {};
    let verdict = null;
    const add = (c, t) => out.push([c, t]);
    if (ai.os === "no") { add("e", L("Máy không khởi động: không có hệ điều hành nên không có shell, không chạy được lệnh nào.", "The machine does not boot: with no operating system there is no shell and no command can run.")); F.os = "e"; return { out, F, verdict: ["bad", L("Lỗi ở lớp Hệ điều hành. Không có OS thì mọi lớp phía trên đều vô nghĩa.", "The fault is in the Operating system layer. Without an OS every layer above is meaningless.")] }; }
    if (ai.nb === "no") { add("d", L("# Không có Jupyter: mở terminal và chạy trực tiếp. Lớp ứng dụng trên cùng có thể thay thế.", "# No Jupyter: open a terminal and run directly. The top application layer is replaceable.")); F.nb = "w"; }
    add("p", "$ python train.py");
    if (ai.py === "no") { add("e", "bash: python: command not found"); F.py = "e"; return { out, F, verdict: ["bad", L("Lỗi ở lớp Runtime: chưa cài Python. OS không tìm thấy chương trình tên python.", "The fault is in the Runtime layer: Python is not installed. The OS cannot find a program called python.")] }; }
    add("", "Python 3.11.9");
    if (ai.torch === "no") { add("e", "Traceback (most recent call last):\n  File \"train.py\", line 1, in <module>\n    import torch\nModuleNotFoundError: No module named 'torch'"); F.torch = "e"; return { out, F, verdict: ["bad", L("Lỗi ở lớp Application (framework): chưa pip install torch.", "The fault is in the Application (framework) layer: torch was never pip-installed.")] }; }
    if (ai.cuda === "no" && ai.hw === "ok" && ai.drv === "ok") { add("e", "OSError: libcudart.so.12: cannot open shared object file: No such file or directory"); F.cuda = "e"; return { out, F, verdict: ["bad", L("Lỗi ở lớp thư viện hệ thống: thiếu CUDA runtime nên PyTorch bản GPU không nạp được.", "The fault is in the system library layer: the CUDA runtime is missing, so the GPU build of PyTorch cannot load.")] }; }
    add("", L("torch 2.4.1 đã nạp", "torch 2.4.1 loaded"));
    let gpu = true;
    if (ai.hw === "no") { add("w", L("torch.cuda.is_available() = False: không tìm thấy GPU NVIDIA.", "torch.cuda.is_available() = False: no NVIDIA GPU found.")); F.hw = "w"; gpu = false; verdict = ["warn", L("Không lỗi, nhưng máy không có GPU nên phải huấn luyện bằng CPU, chậm hơn hàng chục lần. Giải pháp: dùng Colab hoặc server của lab.", "No error, but with no GPU training runs on the CPU, tens of times slower. Fix: use Colab or the lab server.")]; }
    else if (ai.drv === "no") { add("w", "UserWarning: Found no NVIDIA driver on your system. Please check that you have an NVIDIA GPU and installed a driver."); add("w", "torch.cuda.is_available() = False"); F.drv = "w"; gpu = false; verdict = ["warn", L("Lỗi ở lớp Device driver: có GPU nhưng OS không nói chuyện được với nó. PyTorch lặng lẽ chuyển sang CPU, chậm hơn hàng chục lần.", "The fault is in the Device driver layer: the GPU is there but the OS cannot talk to it. PyTorch silently falls back to the CPU, tens of times slower.")]; }
    else if (ai.cuda === "mis") { add("p", '>>> model.to("cuda")'); add("e", "RuntimeError: The NVIDIA driver on your system is too old (found version 11040).\nPlease update your GPU driver or install a PyTorch build compiled for an older CUDA version."); F.cuda = "e"; F.drv = "w"; return { out, F, verdict: ["bad", L("Lỗi lệch phiên bản giữa driver và CUDA. Đây là lỗi hay gặp nhất khi tự cài môi trường deep learning: cần cập nhật driver hoặc cài bản PyTorch khớp với CUDA.", "A version mismatch between driver and CUDA. This is the most common error when setting up a deep-learning environment yourself: update the driver or install a PyTorch build that matches CUDA.")] }; }
    add(gpu ? "o" : "w", "Device: " + (gpu ? "cuda:0 (NVIDIA GPU, 24 GB)" : "cpu"));
    const loss = [1.842, 1.215, 0.874, 0.652, 0.511], acc = [0.412, 0.583, 0.701, 0.768, 0.812];
    loss.forEach((l, i) => add("", `Epoch ${i + 1}/5   loss ${l.toFixed(3)}   acc ${acc[i].toFixed(3)}   ${gpu ? "38s" : "21m 05s"}`));
    add(gpu ? "o" : "w", gpu ? L("Huấn luyện xong sau 3 phút 10 giây.", "Training finished in 3 min 10 s.") : L("Huấn luyện xong sau 1 giờ 45 phút.", "Training finished in 1 h 45 min."));
    if (!verdict) verdict = ["good", L("Cả chồng phần mềm đủ và khớp nhau: Linux → driver → CUDA → Python → PyTorch → Jupyter. Mô hình chạy trên GPU.", "The whole stack is present and compatible: Linux → driver → CUDA → Python → PyTorch → Jupyter. The model trains on the GPU.")];
    return { out, F, verdict };
  }
  function aiRun() {
    clearTimeout(aiTimer);
    const r = aiLines();
    aiFlag = {}; renderAIL();
    const term = $("#aiOut");
    term.innerHTML = ""; $("#aiVerdict").innerHTML = "";
    let i = 0;
    (function tick() {
      if (i < r.out.length) {
        const [c, t] = r.out[i++];
        term.insertAdjacentHTML("beforeend", `<span class="${c}">${esc(t)}</span>\n`);
        term.scrollTop = term.scrollHeight;
        aiTimer = setTimeout(tick, i < 4 ? 260 : 200);
      } else { aiFlag = r.F; renderAIL(); $("#aiVerdict").innerHTML = `<p class="banner ${r.verdict[0]}">${r.verdict[1]}</p>`; }
    })();
  }
  $("#ailayers").addEventListener("click", (e) => { const b = e.target.closest("[data-v]"); if (!b) return; ai[b.dataset.l] = b.dataset.v; aiFlag = {}; renderAIL(); });
  $("#aistack").addEventListener("click", (e) => { const b = e.target.closest("[data-pre]"); if (!b) return; aiSet(b.dataset.pre); aiRun(); });
  $("#aiRun").addEventListener("click", aiRun);
  aiSet("ok"); renderAIL();
  $("#aiOut").innerHTML = `<span class="d">${L("# Chọn một tình huống mẫu hoặc tự bật tắt các lớp, rồi bấm Chạy.", "# Pick a sample setup or toggle the layers yourself, then press Run.")}</span>`;

  /* =========================================================
     7. TERMINAL
     ========================================================= */
  const files = [{ n: "bai_tap.txt", p: "rw-r--r--", s: 1204, d: false }, { n: "du_lieu", p: "rwxr-xr-x", s: 4096, d: true }, { n: "train.py", p: "rwxr-xr-x", s: 3380, d: false }];
  const toPerm = (o) => o.split("").map((d) => { d = +d; return (d & 4 ? "r" : "-") + (d & 2 ? "w" : "-") + (d & 1 ? "x" : "-"); }).join("");
  const ANN = {
    os: L("Hệ điều hành đang chạy là Linux, bản phân phối Ubuntu. Google Colab cũng chạy đúng loại máy này.", "The running OS is Linux, the Ubuntu distribution. Google Colab runs exactly this kind of machine."),
    uname: L("Kernel: phần lõi của Linux, nơi chứa memory, process, device và file manager.", "The kernel: the core of Linux, home of the memory, process, device and file managers."),
    whoami: L("Mỗi người dùng có tài khoản riêng. Đây là nền tảng của phân quyền trong file manager.", "Every user has their own account. This is the basis of permissions in the file manager."),
    ls: L("File manager: mỗi file có chủ sở hữu và ba nhóm quyền r (đọc), w (ghi), x (chạy) cho chủ, nhóm và người khác.", "File manager: every file has an owner and three sets of permissions, r (read), w (write), x (execute), for owner, group and others."),
    chmod: L("File manager vừa đổi quyền của file. Gõ ls -l để xem.", "The file manager just changed the file's permissions. Type ls -l to see."),
    free: L("Memory manager: RAM đã dùng và còn trống. Dòng Swap là phần ổ đĩa dùng làm virtual memory.", "Memory manager: RAM used and free. The Swap line is disk space used as virtual memory."),
    ps: L("Process manager: mỗi dòng là một process đang sống, kèm %CPU và %MEM nó đang chiếm.", "Process manager: every line is a live process, with the %CPU and %MEM it is using."),
    df: L("File manager và thiết bị lưu trữ: dung lượng từng phân vùng đĩa.", "File manager and storage devices: the size of each disk partition."),
    nvidiaOk: L("Device driver: lệnh này hỏi driver NVIDIA. Thấy bảng này nghĩa là OS đã nói chuyện được với GPU.", "Device driver: this command asks the NVIDIA driver. Seeing this table means the OS can talk to the GPU."),
    nvidiaNo: L("Không có GPU hoặc driver: đúng như slide 9, thiếu driver thì phần cứng coi như không dùng được.", "No GPU or driver: as slide 9 says, without the driver the hardware is as good as unusable."),
    py: L("Python là phần mềm ứng dụng chạy trên OS.", "Python is application software running on the OS."),
    denied: L("File manager chặn bạn: chủ file không còn quyền r. Gõ chmod 644 bai_tap.txt để mở lại.", "The file manager blocks you: the owner no longer has the r permission. Type chmod 644 bai_tap.txt to restore it."),
  };
  function runCmd(raw) {
    const cmd = raw.trim().replace(/\s+/g, " ");
    let out = "", ann = "", cls = "";
    if (!cmd) return null;
    if (cmd === "clear") { $("#tout").innerHTML = ""; return null; }
    if (cmd === "help") out = L("Các lệnh thử được:", "Commands to try:") + "\n  cat /etc/os-release   uname -a      whoami\n  ls -l                 chmod 644 bai_tap.txt   cat bai_tap.txt\n  free -h               ps aux        df -h\n  nvidia-smi            python3 --version       clear";
    else if (cmd === "cat /etc/os-release") { out = 'PRETTY_NAME="Ubuntu 22.04.4 LTS"\nNAME="Ubuntu"\nVERSION_ID="22.04"\nVERSION="22.04.4 LTS (Jammy Jellyfish)"\nID=ubuntu\nID_LIKE=debian'; ann = ANN.os; }
    else if (cmd === "uname -a" || cmd === "uname") { out = "Linux neu-lab 6.1.85+ #1 SMP PREEMPT_DYNAMIC x86_64 x86_64 x86_64 GNU/Linux"; ann = ANN.uname; }
    else if (cmd === "whoami") { out = "sinhvien"; ann = ANN.whoami; }
    else if (cmd === "ls -l" || cmd === "ls -la") { out = "total 12\n" + files.map((f) => `${f.d ? "d" : "-"}${f.p} 1 sinhvien sinhvien ${String(f.s).padStart(5)} Oct 12 09:30 ${f.n}`).join("\n"); ann = ANN.ls; }
    else if (cmd === "ls") out = files.map((f) => f.n).join("  ");
    else if (/^chmod /.test(cmd)) {
      const m = cmd.match(/^chmod ([0-7]{3}) (\S+)$/);
      if (!m) { out = L("chmod: cú pháp ví dụ: chmod 644 bai_tap.txt", "chmod: example syntax: chmod 644 bai_tap.txt"); cls = "e"; }
      else { const f = files.find((x) => x.n === m[2]); if (!f) { out = `chmod: cannot access '${m[2]}': No such file or directory`; cls = "e"; } else { f.p = toPerm(m[1]); ann = ANN.chmod; } }
    } else if (/^cat /.test(cmd)) {
      const n = cmd.slice(4), f = files.find((x) => x.n === n);
      if (!f) { out = `cat: ${n}: No such file or directory`; cls = "e"; }
      else if (f.d) { out = `cat: ${n}: Is a directory`; cls = "e"; }
      else if (f.p[0] !== "r") { out = `cat: ${n}: Permission denied`; cls = "e"; ann = ANN.denied; }
      else out = n === "train.py" ? 'import torch\nmodel = build_model()\nmodel.to("cuda")\n# ...' : L("Bài tập tuần: phân biệt program, job và process.\nNộp trên LMS trước Chủ nhật.", "Weekly assignment: tell program, job and process apart.\nSubmit on the LMS before Sunday.");
    } else if (cmd === "free -h" || cmd === "free") { out = "               total        used        free      shared  buff/cache   available\nMem:            12Gi       1.3Gi       8.4Gi       2.0Mi       2.3Gi        11Gi\nSwap:          2.0Gi          0B       2.0Gi"; ann = ANN.free; }
    else if (cmd === "ps aux" || cmd === "ps") { out = "USER       PID %CPU %MEM COMMAND\nroot         1  0.0  0.1 /sbin/init\nroot        78  0.1  0.3 /usr/bin/dockerd\nroot       212  0.0  0.2 /usr/sbin/sshd -D\nsinhvien   431  2.4  1.8 /usr/bin/python3 -m jupyter notebook\nsinhvien   587 38.6  9.7 python3 train.py\nsinhvien   602  0.0  0.0 ps aux"; ann = ANN.ps; }
    else if (cmd === "df -h") { out = "Filesystem      Size  Used Avail Use% Mounted on\noverlay         108G   39G   70G  36% /\ntmpfs            64M     0   64M   0% /dev\n/dev/sda1        79G   48G   31G  61% /content"; ann = ANN.df; }
    else if (cmd === "nvidia-smi") {
      if ($("#gpuOn").checked) { out = "+-----------------------------------------------------------------------------+\n| NVIDIA-SMI 535.104.05   Driver Version: 535.104.05   CUDA Version: 12.2     |\n|-------------------------------+----------------------+----------------------+\n| GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |\n|   0  Tesla T4            Off  | 00000000:00:04.0 Off |                    0 |\n| N/A   41C    P8    10W /  70W |      0MiB / 15360MiB |      0%      Default |\n+-------------------------------+----------------------+----------------------+"; ann = ANN.nvidiaOk; }
      else { out = "NVIDIA-SMI has failed because it couldn't communicate with the NVIDIA driver. Make sure that the latest NVIDIA driver is installed and running."; cls = "e"; ann = ANN.nvidiaNo; }
    } else if (cmd === "python3 --version" || cmd === "python --version") { out = "Python 3.11.13"; ann = ANN.py; }
    else { out = `${cmd.split(" ")[0]}: command not found\n` + L("Gõ help để xem các lệnh thử được.", "Type help to see the commands you can try."); cls = "e"; }
    return { cmd, out, ann, cls };
  }
  const hist = [];
  let hi = 0;
  function exec(raw) {
    const r = runCmd(raw);
    if (raw.trim()) { hist.push(raw.trim()); hi = hist.length; }
    if (!r) { $("#tin").value = ""; return; }
    $("#tout").insertAdjacentHTML("beforeend", `<span class="p">sinhvien@neu-lab:~$</span> ${esc(r.cmd)}\n${r.out ? `<span class="${r.cls}">${esc(r.out)}</span>\n` : ""}${r.ann ? `<span class="ann">${esc(r.ann)}</span>` : ""}`);
    $("#tin").value = "";
    const t = $("#term");
    t.scrollTop = t.scrollHeight;
  }
  const QUICK = ["cat /etc/os-release", "whoami", "ls -l", "free -h", "ps aux", "nvidia-smi", "chmod 000 bai_tap.txt", "cat bai_tap.txt", "chmod 644 bai_tap.txt", "df -h", "clear"];
  $("#cmds").innerHTML = QUICK.map((c) => `<button class="lbtn sm" data-c="${c}">${c}</button>`).join("");
  $("#cmds").addEventListener("click", (e) => { const b = e.target.closest("[data-c]"); if (b) exec(b.dataset.c); });
  $("#tin").addEventListener("keydown", (e) => {
    if (e.key === "Enter") exec(e.target.value);
    else if (e.key === "ArrowUp") { if (hi > 0) { hi--; e.target.value = hist[hi]; } e.preventDefault(); }
    else if (e.key === "ArrowDown") { if (hi < hist.length - 1) { hi++; e.target.value = hist[hi]; } else { hi = hist.length; e.target.value = ""; } e.preventDefault(); }
  });
  $("#term").addEventListener("click", () => { if (!window.getSelection().toString()) $("#tin").focus({ preventScroll: true }); });
  $("#tout").innerHTML = `<span class="d">${L("Ubuntu 22.04.4 LTS (giả lập). Bấm một lệnh mẫu ở trên hoặc tự gõ, ví dụ: help", "Ubuntu 22.04.4 LTS (simulated). Press a sample command above or type your own, for example: help")}</span>\n`;
  exec("cat /etc/os-release");

  /* =========================================================
     8. CHOOSE OS
     ========================================================= */
  const SC = [
    [L("Lab AI có 8 máy chủ GPU, cần chạy PyTorch và Docker cả ngày.", "An AI lab has 8 GPU servers and needs to run PyTorch and Docker all day."), "Linux", L("Linux miễn phí, CUDA và Docker hỗ trợ tốt nhất, và gần như mọi cluster AI và cloud đều chạy Linux.", "Linux is free, has the best CUDA and Docker support, and nearly every AI cluster and cloud runs Linux.")],
    [L("Bạn muốn làm một app cho iPhone.", "You want to build an app for the iPhone."), "macOS", L("Xcode, công cụ build app iOS, chỉ chạy trên macOS.", "Xcode, the tool for building iOS apps, runs only on macOS.")],
    [L("Phòng kế toán dùng phần mềm chỉ có bản Windows.", "The accounting office uses software that only exists for Windows."), "Windows", L("Windows mạnh nhất về tương thích phần mềm thương mại.", "Windows is strongest on commercial software compatibility.")],
    [L("Dựng phim bằng Final Cut Pro cho câu lạc bộ truyền thông.", "Editing video in Final Cut Pro for the media club."), "macOS", L("Final Cut và Logic Pro là phần mềm sáng tạo độc quyền của Apple.", "Final Cut and Logic Pro are Apple-exclusive creative software.")],
    [L("Laptop cũ 4 GB RAM, chỉ cần lướt web và soạn văn bản.", "An old laptop with 4 GB RAM, used only for browsing and word processing."), "Linux", L("Các bản Linux nhẹ như Lubuntu chạy tốt trên máy cấu hình yếu, lại miễn phí.", "Lightweight Linux distributions such as Lubuntu run well on weak machines, and they are free.")],
    [L("Chơi game PC mới nhất cùng bạn bè.", "Playing the newest PC games with friends."), "Windows", L("Phần lớn game PC và driver đồ hoạ cho game ưu tiên Windows.", "Most PC games and gaming graphics drivers target Windows first.")],
    [L("Thuê một VPS giá rẻ để chạy web server cho đồ án.", "Renting a cheap VPS to run a web server for a course project."), "Linux", L("Server và cloud chủ yếu chạy Linux: nhẹ, ổn định, không tốn bản quyền.", "Servers and the cloud mostly run Linux: light, stable, no licence fee.")],
    [L("Sinh viên năm nhất khoa DS&AI, học văn phòng và học Python.", "A first-year DS&AI student doing office work and learning Python."), "*", L("Cả ba đều được. Quan trọng là quen terminal Linux, qua WSL, máy ảo hoặc Google Colab.", "Any of the three works. What matters is getting used to the Linux terminal, through WSL, a virtual machine or Google Colab.")],
  ];
  const chA = {};
  function renderCh() {
    $("#scenarios").innerHTML = SC.map((s, i) => {
      const a = chA[i];
      let cls = "", fb = "";
      if (a) { const ok = s[1] === "*" || a === s[1]; cls = ok ? "right" : "wrong"; fb = `<p class="fb"><b>${ok ? L("Hợp lý.", "Reasonable.") : L("Chưa phải lựa chọn tốt nhất", "Not the best choice") + (s[1] !== "*" ? ": " + s[1] + "." : ".")}</b> ${s[2]}</p>`; }
      return `<div class="sc ${cls}"><p class="q">${s[0]}</p><div class="seg">${["Windows", "Linux", "macOS"].map((o) => `<button class="chip" data-i="${i}" data-o="${o}" aria-pressed="${a === o}">${o}</button>`).join("")}</div>${fb}</div>`;
    }).join("");
    const d = Object.keys(chA).length, r = Object.entries(chA).filter(([i, a]) => SC[i][1] === "*" || SC[i][1] === a).length;
    $("#chScore").textContent = d ? L(`Hợp lý ${r}/${d} tình huống`, `${r}/${d} situations reasonable`) : L("Chọn một hệ điều hành cho mỗi tình huống.", "Pick an operating system for each situation.");
  }
  $("#scenarios").addEventListener("click", (e) => { const b = e.target.closest("[data-o]"); if (!b) return; chA[b.dataset.i] = b.dataset.o; renderCh(); });
  $("#chReset").addEventListener("click", () => { for (const k in chA) delete chA[k]; renderCh(); });
  renderCh();

  /* =========================================================
     Điều hướng: màn hình giới thiệu ↔ phòng lab
     ========================================================= */
  $("#sim-list").innerHTML = TABS.map((t, i) => `<li><button type="button" data-go="${t[0]}"><b>${i + 1}. ${esc(t[1])}</b><small>${esc(t[2])}</small></button></li>`).join("");
  function enter(id) { G.showScreen("play"); showTab(id || store.get("itgames:oslab-tab") || "layers"); }
  $("#sim-list").addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b) enter(b.dataset.go); });
  $("#btn-start").addEventListener("click", () => enter());
  // Cũng được gọi khi người chơi bấm Back: dừng mọi bộ chạy tự động và đoạn in giả lập của AI stack
  $("#btn-menu").addEventListener("click", () => { stops.forEach((f) => f()); clearTimeout(aiTimer); G.showScreen("start"); });
})();
