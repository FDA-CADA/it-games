/* Xưởng Lắp Ráp PC — lắp máy tính để bàn bằng PixiJS (WebGL), bật nguồn và xem luồng gió. Xem README.md. */
(function () {
  "use strict";
  const { $, L } = G;
  const GAME_ID = "pc-assembly-2d";
  const VB = { x: -56, y: -32, w: 716, h: 748 };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Tên linh kiện viết thường giữa câu, giữ nguyên tên viết tắt (CPU, RAM, SSD…)
  const nm = (p) => (/^[A-Z]{2}/.test(p.name) ? p.name : p.name.charAt(0).toLowerCase() + p.name.slice(1));

  /* ---------- Dữ liệu ---------- */
  const DESK = { x: -6, y: 560, w: 606, h: 156 };
  const PARTS = [
    { id: "esd", name: L("Vòng chống tĩnh điện", "Antistatic strap"), slotName: L("điểm nối đất trên khung", "grounding point on the frame"), slot: { x: 470, y: 38, w: 92, h: 58 }, needs: [],
      spec: L("Dây đeo cổ tay, điện trở 1 MΩ, kẹp cá sấu", "Wrist strap, 1 MΩ resistor, alligator clip"),
      role: L("Xả tĩnh điện trên người xuống khung máy.", "Drains static charge from your body into the chassis."),
      step: L("Đeo vòng vào cổ tay, rồi kéo thả vào điểm nối đất: tấm kim loại không sơn ở góc trên khung.", "Put the strap on your wrist, then drop it on the grounding point: the bare metal plate in the top corner of the frame."),
      why: L("Tĩnh điện trên người có thể lên tới vài nghìn vôn, đủ làm hỏng chip mà bạn không hề cảm thấy.", "Static on your body can reach several thousand volts, enough to kill a chip without you feeling anything.") },
    { id: "psu", name: L("Bộ nguồn (PSU)", "Power supply (PSU)"), slotName: L("khoang nguồn", "PSU bay"), slot: { x: 40, y: 392, w: 230, h: 90 }, needs: ["esd"],
      spec: L("ATX 650 W, 80 Plus Bronze", "ATX 650 W, 80 Plus Bronze"),
      role: L("Đổi điện xoay chiều 220 V thành các mức một chiều 12 V, 5 V và 3,3 V.", "Converts 220 V AC into 12 V, 5 V and 3.3 V DC rails."),
      step: L("Đặt bộ nguồn vào khoang dưới cùng, quạt quay xuống lưới lọc ở đáy thùng.", "Place the PSU in the bottom bay with its fan facing down toward the filter in the case floor."),
      why: L("Bộ nguồn nặng và cồng kềnh, nên lắp trước để không va vào các linh kiện khác.", "The PSU is heavy and bulky, so install it first so it does not knock into other parts.") },
    { id: "io", name: L("Tấm chắn I/O", "I/O shield"), slotName: L("ô I/O phía sau", "rear I/O cutout"), slot: { x: 40, y: 60, w: 24, h: 110 }, needs: ["esd"],
      spec: L("Đi kèm bo mạch chủ", "Comes with the motherboard"),
      role: L("Che kín và định vị các cổng I/O phía sau, chống bụi và nhiễu.", "Seals and locates the rear I/O ports, keeping out dust and interference."),
      step: L("Ấn tấm chắn I/O vào ô chữ nhật ở mặt sau thùng máy, ấn từ bên trong ra.", "Press the I/O shield into the rectangular cutout at the back of the case, pushing from the inside out."),
      why: L("Phải lắp trước bo mạch chủ. Khi bo mạch đã bắt vít thì không còn chỗ để ấn tấm chắn vào.", "It must go in before the motherboard. Once the board is screwed down there is no room left to press it in.") },
    { id: "mobo", name: L("Bo mạch chủ", "Motherboard"), slotName: L("vùng gắn bo mạch chủ", "motherboard mounting area"), slot: { x: 70, y: 50, w: 250, h: 320 }, needs: ["io"],
      spec: L("ATX 305 × 244 mm, socket LGA1700", "ATX 305 × 244 mm, LGA1700 socket"),
      role: L("Bảng mạch trung tâm, nối mọi linh kiện với nhau.", "The central circuit board that connects every other component."),
      step: L("Hạ bo mạch chủ vào khung sao cho cổng I/O khớp tấm chắn và lỗ vít trùng các chốt standoff.", "Lower the motherboard into the frame so the ports line up with the I/O shield and the screw holes meet the standoffs."),
      why: L("Ngoài đời, nhiều người lắp CPU, tản nhiệt và RAM lên bo mạch chủ trên bàn trước rồi mới đặt vào thùng.", "In real builds many people fit the CPU, cooler and RAM on the board on a bench first, then place it in the case.") },
    { id: "cpu", name: "CPU", slotName: L("socket CPU", "CPU socket"), slot: { x: 140, y: 95, w: 60, h: 60 }, needs: ["mobo"],
      spec: L("LGA1700, TDP 65 W", "LGA1700, TDP 65 W"),
      role: L("Bộ xử lý trung tâm, thực thi lệnh của chương trình.", "The central processor, which executes program instructions."),
      step: L("Nâng cần gạt socket, đặt CPU sao cho tam giác vàng trùng góc đánh dấu trên socket. Không ấn mạnh.", "Lift the socket lever and set the CPU so its gold triangle matches the marked corner of the socket. Do not force it."),
      why: L("Chân socket LGA rất mảnh. Cong một chân là có thể hỏng bo mạch chủ.", "LGA socket pins are very thin. Bending one can ruin the motherboard.") },
    { id: "cooler", name: L("Tản nhiệt CPU", "CPU cooler"), slotName: L("vị trí tản nhiệt CPU", "CPU cooler position"), slot: { x: 122, y: 77, w: 96, h: 96 }, needs: ["cpu"],
      spec: L("Tản khí, quạt 120 mm, kèm keo tản nhiệt", "Air cooler, 120 mm fan, thermal paste included"),
      role: L("Hút nhiệt từ CPU và thổi ra khỏi thùng máy.", "Pulls heat away from the CPU and blows it out of the case."),
      step: L("Bôi một lượng keo tản nhiệt bằng hạt đậu lên giữa CPU, đặt tản nhiệt lên và siết ốc theo đường chéo.", "Put a pea-sized dot of thermal paste on the middle of the CPU, set the cooler on top and tighten the screws in a cross pattern."),
      why: L("Không có keo và tản nhiệt, CPU quá nhiệt và tự tắt chỉ sau vài giây.", "Without paste and a cooler the CPU overheats and shuts itself off within seconds.") },
    { id: "ram", name: "RAM", slotName: L("khe RAM", "RAM slots"), slot: { x: 238, y: 70, w: 44, h: 132 }, needs: ["mobo"],
      spec: L("2 × 16 GB DDR5-5600, 288 chân", "2 × 16 GB DDR5-5600, 288 pins"),
      role: L("Bộ nhớ tạm cho dữ liệu đang xử lý, mất dữ liệu khi tắt máy.", "Working memory for data being processed; its contents vanish at power-off."),
      step: L("Mở lẫy hai đầu khe, căn khấc trên thanh RAM với gờ trong khe, ấn thẳng xuống đến khi lẫy tự khóa.", "Open the latches at both ends, align the notch on the module with the key in the slot and press straight down until the latches snap shut."),
      why: L("Khấc lệch tâm nên RAM chỉ cắm được một chiều. DDR4 và DDR5 có khấc ở vị trí khác nhau.", "The notch is off-centre, so RAM only fits one way. DDR4 and DDR5 have the notch in different places.") },
    { id: "m2", name: L("SSD M.2", "M.2 SSD"), slotName: L("khe M.2", "M.2 slot"), slot: { x: 130, y: 208, w: 120, h: 22 }, needs: ["mobo"],
      spec: L("M.2 2280 NVMe PCIe 4.0, 1 TB", "M.2 2280 NVMe PCIe 4.0, 1 TB"),
      role: L("Ổ lưu trữ chính để cài hệ điều hành, tốc độ đọc vài GB/s.", "Main storage for the operating system, reading at several GB/s."),
      step: L("Cắm SSD vào khe M.2 nghiêng khoảng 30°, ấn xuống rồi vặn ốc giữ ở đầu ổ.", "Insert the SSD into the M.2 slot at about 30°, press it down and fasten the retaining screw at the end."),
      why: L("Ổ NVMe chạy qua làn PCIe trên bo mạch nên không cần cáp dữ liệu hay cáp nguồn.", "An NVMe drive runs over PCIe lanes on the board, so it needs no data or power cable.") },
    { id: "gpu", name: L("Card đồ họa", "Graphics card"), slotName: L("khe PCIe x16", "PCIe x16 slot"), slot: { x: 66, y: 258, w: 380, h: 62 }, needs: ["mobo"],
      spec: L("PCIe 4.0 x16, 2 quạt, nguồn phụ 8-pin", "PCIe 4.0 x16, 2 fans, 8-pin auxiliary power"),
      role: L("Xử lý hình ảnh và xuất tín hiệu ra màn hình.", "Renders graphics and sends the signal to the monitor."),
      step: L("Tháo nắp chắn khe mở rộng, cắm card vào khe PCIe x16 trên cùng đến khi lẫy khóa, rồi vặn vít vào khung.", "Remove the expansion slot cover, push the card into the top PCIe x16 slot until the latch clicks, then screw it to the frame."),
      why: L("Card đồ họa dài và che các khe bên dưới, nên thường lắp sau các linh kiện khác trên bo mạch.", "The graphics card is long and covers the slots below it, so it usually goes in after the other parts on the board.") },
    { id: "hdd", name: L("Ổ cứng HDD 3,5\"", "3.5\" HDD"), slotName: L("khoang ổ 3,5\"", "3.5\" drive bay"), slot: { x: 452, y: 318, w: 108, h: 66 }, needs: ["esd"],
      spec: L("2 TB, 7200 vòng/phút, SATA III", "2 TB, 7200 RPM, SATA III"),
      role: L("Lưu trữ dung lượng lớn với giá rẻ, chậm hơn SSD.", "Cheap bulk storage, slower than an SSD."),
      step: L("Trượt ổ cứng vào khay ổ phía trước, cổng kết nối quay về phía bo mạch chủ.", "Slide the drive into the front tray with its connectors facing the motherboard."),
      why: L("Ổ cơ có đĩa quay bên trong, cần bắt chặt để giảm rung và tiếng ồn.", "A mechanical drive has spinning platters, so it must be fixed firmly to reduce vibration and noise.") },
    { id: "c24", name: L("Cáp nguồn 24-pin", "24-pin power cable"), slotName: L("cổng nguồn 24-pin trên bo mạch chủ", "24-pin power connector on the motherboard"), slot: { x: 296, y: 148, w: 22, h: 74 }, needs: ["psu", "mobo"],
      spec: L("ATX 24-pin (20+4)", "ATX 24-pin (20+4)"),
      role: L("Cấp nguồn chính cho bo mạch chủ.", "Supplies the motherboard's main power."),
      step: L("Cắm đầu 24-pin từ bộ nguồn vào cổng dài ở cạnh phải bo mạch chủ đến khi lẫy kêu tách.", "Plug the 24-pin lead from the PSU into the long connector on the right edge of the motherboard until the latch clicks."),
      why: L("Thiếu cáp này thì bấm nút nguồn máy cũng không lên.", "Without this cable pressing the power button does nothing.") },
    { id: "c8", name: L("Cáp nguồn CPU 8-pin", "8-pin CPU power cable"), slotName: L("cổng nguồn CPU 8-pin", "8-pin CPU power connector"), slot: { x: 80, y: 54, w: 44, h: 20 }, needs: ["psu", "cooler"],
      spec: L("EPS12V 8-pin (4+4)", "EPS12V 8-pin (4+4)"),
      role: L("Cấp nguồn riêng cho CPU qua mạch ổn áp VRM.", "Gives the CPU its own power through the VRM."),
      step: L("Luồn cáp 8-pin lên góc trên bên trái bo mạch chủ và cắm vào cổng nguồn CPU.", "Route the 8-pin cable to the top-left corner of the motherboard and plug it into the CPU power connector."),
      why: L("Lắp tản nhiệt trước rồi mới cắm cáp 8-pin, để cáp không vướng tay khi siết ốc tản nhiệt.", "Fit the cooler first and plug in the 8-pin afterwards so the cable does not get in the way while you tighten the cooler screws.") },
    { id: "sata", name: L("Cáp nguồn SATA", "SATA power cable"), slotName: L("cổng SATA trên ổ cứng", "SATA port on the hard drive"), slot: { x: 446, y: 328, w: 30, h: 46 }, needs: ["psu", "hdd"],
      spec: L("Đầu nguồn SATA 15 chân", "15-pin SATA power connector"),
      role: L("Cấp nguồn cho ổ cứng và SSD 2,5\".", "Powers the hard drive and 2.5\" SSDs."),
      step: L("Cắm đầu nguồn SATA hình chữ L vào ổ cứng, chú ý chiều của khấc chữ L.", "Plug the L-shaped SATA power connector into the drive, matching the direction of the L-shaped notch."),
      why: L("Ổ cứng cần cả cáp nguồn lẫn cáp dữ liệu SATA. Bản mô phỏng này gộp chung thành một bước.", "A hard drive needs both a power cable and a SATA data cable. This simulation merges them into one step.") },
    { id: "kb", periph: true, name: L("Bàn phím", "Keyboard"), slotName: L("mặt bàn", "desk"), zone: DESK, slot: { x: 30, y: 604, w: 200, h: 56 }, needs: ["mobo"],
      spec: L("Bàn phím cơ 104 phím, USB-A", "104-key mechanical keyboard, USB-A"),
      role: L("Thiết bị nhập: đổi mỗi phím bấm thành tín hiệu gửi cho CPU.", "Input device: turns every key press into a signal for the CPU."),
      step: L("Thả bàn phím lên mặt bàn (chỗ nào trên bàn cũng được, máy tự xếp vào vị trí), rồi cáp USB tự cắm vào cổng trên tấm I/O ở mặt sau thùng máy.", "Drop the keyboard anywhere on the desk (it settles into place by itself), and its USB cable plugs into a port on the I/O shield at the back of the case."),
      why: L("Bàn phím và chuột là thiết bị nhập, nối qua cổng USB của bo mạch chủ. Màn hình là thiết bị xuất, nối vào card đồ họa.", "The keyboard and mouse are input devices wired to the motherboard's USB ports. The monitor is an output device wired to the graphics card.") },
    { id: "ms", periph: true, name: L("Chuột", "Mouse"), slotName: L("mặt bàn", "desk"), zone: DESK, slot: { x: 246, y: 608, w: 28, h: 44 }, needs: ["mobo"],
      spec: L("Chuột quang 1600 DPI, USB-A", "1600 DPI optical mouse, USB-A"),
      role: L("Thiết bị nhập: gửi chuyển động và cú bấm cho CPU.", "Input device: sends movement and clicks to the CPU."),
      step: L("Thả chuột lên mặt bàn, cáp USB tự cắm vào cổng thứ hai trên tấm I/O.", "Drop the mouse on the desk and its USB cable plugs into the second port on the I/O shield."),
      why: L("Cả hai đều qua USB nên chuột và bàn phím có thể đổi cổng cho nhau.", "Both go over USB, so the mouse and keyboard ports are interchangeable.") },
    { id: "mon", periph: true, name: L("Màn hình", "Monitor"), slotName: L("mặt bàn", "desk"), zone: DESK, slot: { x: 300, y: 540, w: 260, h: 170 }, needs: ["gpu"],
      spec: L("24\" Full HD, 60 Hz, cổng HDMI", "24\" Full HD, 60 Hz, HDMI input"),
      role: L("Thiết bị xuất: hiển thị hình ảnh do card đồ họa gửi ra.", "Output device: shows the image the graphics card sends out."),
      step: L("Thả màn hình lên mặt bàn, cáp HDMI tự cắm vào cổng trên card đồ họa ở mặt sau thùng máy, không phải cổng của bo mạch chủ.", "Drop the monitor on the desk and its HDMI cable plugs into the port on the graphics card at the back of the case, not the motherboard's port."),
      why: L("Khi đã có card đồ họa rời, cắm nhầm vào cổng của bo mạch chủ thường không có tín hiệu: màn hình đen dù máy vẫn chạy.", "With a dedicated graphics card, plugging into the motherboard's port usually gives no signal: a black screen even though the PC is running.") },
  ];
  const zn = (p) => p.zone || p.slot; // vùng thả: thiết bị ngoại vi chỉ cần thả lên mặt bàn
  const byId = Object.fromEntries(PARTS.map((p) => [p.id, p]));
  const CABLES = {
    c24: { pts: [[252, 394], [345, 392], [350, 260], [318, 186]], color: "cable", w: 10, end: [298, 150, 18, 70] },
    c8: { pts: [[54, 394], [26, 300], [26, 120], [82, 64]], color: "cable", w: 7, end: [82, 56, 40, 16] },
    sata: { pts: [[262, 448], [360, 452], [420, 380], [452, 352]], color: "sata", w: 5, end: [448, 340, 12, 26] },
  };
  const Z = ["psu", "io", "mobo", "m2", "cpu", "cooler", "ram", "gpu", "hdd", "c24", "c8", "sata", "kb", "ms", "mon", "esd"];
  // Cáp thiết bị ngoại vi: đường gấp khúc từ thiết bị lên cổng ở mặt sau thùng máy
  const PCAB = {
    mon: { pts: [[430, 540], [430, 522], [-34, 522], [-34, 272], [-4, 272]], w: 5 },
    ms: { pts: [[260, 608], [260, 534], [-40, 534], [-40, 128], [-4, 128]], w: 3 },
    kb: { pts: [[130, 604], [130, 546], [-46, 546], [-46, 100], [-4, 100]], w: 3.5 },
  };

  /* ---------- Bảng màu từ CSS (đọc từ .pcasm) ---------- */
  const TOK = ["surface", "fg", "muted", "line", "on-mat", "on-mat-muted", "case", "case-edge", "case-deep", "pcb", "pcb-trace", "metal", "metal-dark", "gold", "plastic", "ram", "cable", "sata", "ssd", "pc-accent", "pc-accent-strong", "ok", "err", "air-cold", "air-hot"];
  const C = {};
  const camel = (k) => k.replace(/^pc-/, "").replace(/-(\w)/g, (_, c) => c.toUpperCase());
  function readPalette() {
    const cs = getComputedStyle($("#pcasm"));
    TOK.forEach((k) => { C[camel(k)] = parseInt(cs.getPropertyValue("--" + k).trim().replace("#", ""), 16) || 0; });
  }
  const F = { d: ["Chakra Petch", "Segoe UI", "sans-serif"], b: ["Be Vietnam Pro", "Segoe UI", "sans-serif"], m: ["JetBrains Mono", "Consolas", "monospace"] };
  const LIGHT = 0xe9eeee;

  let booted = false, api = null;
  async function boot() {
    /* ---------- DOM ---------- */
    const stageEl = $("#stage"), tray = $("#tray"), guide = $("#guide"), statusEl = $("#status"), donePanel = $("#donePanel");
    if (!window.PIXI) { stageEl.innerHTML = `<p class="nogl">${L("Không tải được thư viện PixiJS. Kiểm tra kết nối mạng rồi tải lại trang.", "Could not load the PixiJS library. Check your connection and reload the page.")}</p>`; return null; }

    try { await Promise.race([Promise.all([
      document.fonts.load('700 13px "Chakra Petch"', "MẶT SAU"), document.fonts.load('500 11px "Be Vietnam Pro"', "Nhìn từ hông"), // i18n-ok
      document.fonts.load('600 9px "JetBrains Mono"', "650W")]), new Promise((r) => setTimeout(r, 1800))]); } catch (e) { /* bỏ qua */ }

    readPalette();
    let app;
    try { app = new PIXI.Application({ backgroundAlpha: 0, antialias: true, resolution: Math.min(window.devicePixelRatio || 1, 2), autoDensity: true,
      width: stageEl.clientWidth || 700, height: stageEl.clientHeight || 545 }); }
    catch (e) { stageEl.innerHTML = `<p class="nogl">${L("Trình duyệt chưa bật WebGL nên không chạy được bản PixiJS. Hãy thử Chrome, Edge hoặc Firefox bản mới.", "WebGL is not enabled in this browser, so the PixiJS version cannot run. Try a recent Chrome, Edge or Firefox.")}</p>`; return null; }
    const view = app.view; view.tabIndex = 0; view.setAttribute("role", "application");
    view.setAttribute("aria-label", L("Thùng máy. Dùng phím mũi tên để chọn vị trí, Enter để lắp linh kiện đang chọn.", "PC case. Use the arrow keys to choose a slot and Enter to install the selected part."));
    stageEl.appendChild(view);

    const root = new PIXI.Container(), world = new PIXI.Container(); root.addChild(world); app.stage.addChild(root);
    let scale = 1, texts = [], fans = [], screens = [], partNodes = {}, sparks = [], air = [], tweens = [];
    let caseLayer, partsLayer, airLayer, slotLayer, fxLayer, slotG, labelBg, labelTxt, pwrGlow, led;

    /* ---------- Tiện ích vẽ ---------- */
    const Gfx = () => new PIXI.Graphics();
    function R(g, x, y, w, h, fill, o = {}) { g.lineStyle(o.stroke == null ? 0 : (o.sw || 1), o.stroke || 0, 1); g.beginFill(fill, o.alpha == null ? 1 : o.alpha);
      o.r ? g.drawRoundedRect(x, y, w, h, o.r) : g.drawRect(x, y, w, h); g.endFill(); g.lineStyle(0); return g; }
    function Ci(g, x, y, r, fill, o = {}) { g.lineStyle(o.stroke == null ? 0 : (o.sw || 1), o.stroke || 0, 1); g.beginFill(fill, o.alpha == null ? 1 : o.alpha); g.drawCircle(x, y, r); g.endFill(); g.lineStyle(0); return g; }
    function Ln(g, x1, y1, x2, y2, color, w = 1.5, a = 1) { g.lineStyle(w, color, a); g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineStyle(0); return g; }
    const textRes = () => Math.min(4, Math.max(1, app.renderer.resolution * scale * 1.25));
    function T(str, size, color, o = {}) { const t = new PIXI.Text(str, { fontFamily: o.family || F.m, fontSize: size, fill: color, fontWeight: o.weight || "600", letterSpacing: o.ls || 0 });
      if (o.anchor) t.anchor.set(o.anchor[0], o.anchor[1]); t.resolution = textRes(); texts.push(t); return t; }
    function fan(cx, cy, r, reg) {
      const c = new PIXI.Container(); c.position.set(cx, cy);
      c.addChild(Ci(Gfx(), 0, 0, r, C.plastic, { stroke: C.metalDark, sw: 1.5 }));
      const rot = new PIXI.Container(), b = Gfx(); b.beginFill(C.metalDark);
      for (let i = 0; i < 7; i++) { const a = i * Math.PI * 2 / 7;
        b.moveTo(Math.cos(a) * r * 0.25, Math.sin(a) * r * 0.25);
        b.quadraticCurveTo(Math.cos(a + 0.25) * r * 0.95, Math.sin(a + 0.25) * r * 0.95, Math.cos(a + 0.6) * r * 0.9, Math.sin(a + 0.6) * r * 0.9);
        b.lineTo(Math.cos(a + 0.35) * r * 0.25, Math.sin(a + 0.35) * r * 0.25); b.closePath(); }
      b.endFill(); Ci(b, 0, 0, r * 0.22, C.metal, { stroke: C.metalDark }); rot.addChild(b); c.addChild(rot);
      if (reg) fans.push(rot);
      return c;
    }

    /* ---------- Hình vẽ linh kiện ---------- */
    function art(id, reg) {
      const { w, h } = byId[id].slot, c = new PIXI.Container(), g = Gfx(); c.addChild(g);
      switch (id) {
        case "esd":
          R(g, w - 30, 10, 26, h - 20, C.metal, { r: 3, stroke: C.metalDark }); Ci(g, w - 17, h / 2, 5, C.metalDark);
          g.lineStyle(3, C.cable); g.moveTo(w - 24, h / 2); g.bezierCurveTo(w - 50, h / 2 + 20, 20, h / 2 + 16, 14, h / 2); g.lineStyle(0);
          R(g, w - 36, h / 2 - 6, 16, 12, C.gold, { r: 2 }); g.beginFill(C.plastic); g.drawEllipse(12, h / 2, 9, 14); g.endFill(); break;
        case "psu": {
          R(g, 0, 0, w, h, C.metal, { r: 4, stroke: C.metalDark }); const r = h / 2 - 10; c.addChild(fan(h / 2 + 6, h / 2, r, reg));
          const gr = Gfx(); for (let i = -3; i <= 3; i++) Ln(gr, h / 2 + 6 - r + 6, h / 2 + i * 8, h / 2 + 6 + r - 6, h / 2 + i * 8, C.metal, 1.5, 0.85); c.addChild(gr);
          R(g, w - 92, 16, 76, h - 32, C.surface, { r: 3, stroke: C.metalDark });
          const t1 = T("650W", 10, C.fg, { anchor: [0.5, 0.5] }); t1.position.set(w - 54, h / 2 - 6);
          const t2 = T("80+ BRONZE", 7, C.fg, { anchor: [0.5, 0.5] }); t2.position.set(w - 54, h / 2 + 9); c.addChild(t1, t2); break; }
        case "io":
          R(g, 0, 0, w, h, C.metal, { r: 2, stroke: C.metalDark });
          [10, 24, 38, 56, 70, 84].forEach((y, i) => R(g, 5, y, w - 10, i % 3 === 2 ? 10 : 8, C.metalDark, { r: 1 })); break;
        case "mobo": {
          R(g, 0, 0, w, h, C.pcb, { r: 4 });
          g.lineStyle(2, C.pcbTrace);
          [[[40, 120], [120, 120], [120, 150]], [[200, 150], [230, 150], [230, 240]], [[30, 200], [110, 200]], [[150, 290], [150, 300], [230, 300]], [[60, 300], [120, 300]], [[20, 240], [60, 240], [60, 270]]]
            .forEach((pl) => { g.moveTo(pl[0][0], pl[0][1]); pl.slice(1).forEach((p) => g.lineTo(p[0], p[1])); });
          g.lineStyle(0);
          [[8, 8], [w - 10, 8], [8, h - 10], [w - 10, h - 10], [w - 10, h / 2], [110, h / 2 + 40]].forEach(([x, y]) => Ci(g, x, y, 4, C.metal));
          g.lineStyle(1.5, C.metal, 0.75); g.drawRect(70, 45, 60, 60); g.lineStyle(0);
          g.beginFill(C.gold); g.drawPolygon([72, 103, 80, 103, 72, 95]); g.endFill();
          for (let i = 0; i < 4; i++) R(g, 171 + i * 10, 20, 6, 132, C.plastic, { stroke: C.metalDark });
          R(g, 8, 212, 226, 8, C.plastic, { stroke: C.metalDark }); R(g, 8, 282, 150, 6, C.plastic, { stroke: C.metalDark });
          g.lineStyle(1, C.metalDark); g.drawRect(60, 160, 120, 20); g.lineStyle(0); Ci(g, 176, 170, 3, C.metal);
          R(g, 228, 100, 18, 70, C.plastic, { stroke: C.metalDark }); R(g, 12, 6, 40, 16, C.plastic, { stroke: C.metalDark });
          R(g, 160, 240, 38, 38, C.metalDark, { r: 2 }); R(g, 2, 10, 10, 100, C.metal);
          const t1 = T("PCH", 7, LIGHT, { anchor: [0.5, 0.5] }); t1.position.set(179, 259);
          const t2 = T("ATX", 9, LIGHT, { anchor: [0.5, 0.5] }); t2.position.set(200, h - 16); c.addChild(t1, t2); break; }
        case "cpu": {
          R(g, 0, 0, w, h, C.gold, { r: 3 }); R(g, 6, 6, w - 12, h - 12, C.metal, { r: 4 }); g.beginFill(C.gold); g.drawPolygon([2, h - 2, 12, h - 2, 2, h - 12]); g.endFill();
          const t = T("LGA1700", 8, C.fg, { anchor: [0.5, 0.5] }); t.position.set(w / 2, h / 2); c.addChild(t); break; }
        case "cooler":
          R(g, 0, 0, w, h, C.metalDark, { r: 8 }); for (let i = 0; i < 4; i++) Ci(g, [8, w - 8][i % 2], [8, h - 8][i >> 1], 3, C.metal);
          c.addChild(fan(w / 2, h / 2, w / 2 - 9, reg)); break;
        case "ram":
          [2, 24].forEach((x) => { R(g, x, 0, 16, h, C.ram, { r: 2 }); R(g, x + 3, 10, 10, h - 20, C.metal, { r: 1, alpha: 0.5 }); R(g, x, h / 2 + 12, 16, 3, C.gold); }); break;
        case "m2":
          R(g, 0, 0, w, h, C.ssd, { r: 2 }); R(g, 0, 2, 6, h - 4, C.gold); [14, 44, 74].forEach((x) => R(g, x, 3, 24, h - 6, C.plastic, { r: 1 })); Ci(g, w - 6, h / 2, 3, C.metal); break;
        case "gpu": {
          R(g, 0, 0, w, h, C.plastic, { r: 6, stroke: C.metalDark }); R(g, 0, 0, 10, h, C.metal); R(g, 40, h - 4, 150, 4, C.gold);
          c.addChild(fan(110, h / 2, h / 2 - 6, reg), fan(230, h / 2, h / 2 - 6, reg));
          const g2 = Gfx(); R(g2, w - 70, 12, 56, h - 24, C.metalDark, { r: 3 }); c.addChild(g2);
          const t = T("GPU", 9, LIGHT, { anchor: [0.5, 0.5] }); t.position.set(w - 42, h / 2); c.addChild(t); break; }
        case "mon": {
          R(g, 0, 0, w, 150, C.plastic, { r: 8, stroke: C.metalDark }); R(g, 8, 8, w - 16, 134, 0x10161a, { r: 3 });
          R(g, w / 2 - 15, 150, 30, 12, C.metalDark); R(g, w / 2 - 50, 160, 100, 8, C.metal, { r: 3, stroke: C.metalDark });
          const scr = new PIXI.Container(), sg = Gfx(); R(sg, 8, 8, w - 16, 134, 0x0b2540, { r: 3 }); R(sg, 8, 8, w - 16, 134, 0x2f8fc4, { r: 3, alpha: 0.12 }); scr.addChild(sg);
          const t = T("Hello IT", 30, 0xcdeeff, { family: F.m, anchor: [0.5, 0.5] }); t.position.set(w / 2 - 8, 75); scr.addChild(t);
          const cur = Gfx(); R(cur, 0, 0, 5, 30, 0xcdeeff); cur.position.set(w / 2 + 84, 60); scr.addChild(cur); scr.cur = cur; scr.alpha = 0; c.addChild(scr); c.scr = scr;
          Ci(g, w - 18, 146, 2, C.metalDark); break; }
        case "kb": {
          R(g, 0, 0, w, h, C.plastic, { r: 5, stroke: C.metalDark });
          for (let r = 0; r < 4; r++) for (let k = 0; k < 14; k++) { if (r === 3 && (k < 2 || k > 11)) continue; R(g, 6 + k * 13.6, 6 + r * 11.5, r === 3 && k === 2 ? 70 : 11, 9, C.metal, { r: 1.5, alpha: 0.9 }); if (r === 3 && k === 2) k += 4; }
          break; }
        case "ms":
          R(g, 0, 0, w, h, C.plastic, { r: 13, stroke: C.metalDark }); Ln(g, 1, 17, w - 1, 17, C.metalDark, 1.5); Ln(g, w / 2, 3, w / 2, 17, C.metalDark, 1.5); R(g, w / 2 - 2, 8, 4, 8, C.metal, { r: 2 }); break;
        case "hdd": {
          R(g, 0, 0, w, h, C.metal, { r: 4, stroke: C.metalDark }); g.lineStyle(2, C.metalDark); g.drawCircle(w * 0.62, h / 2, h / 2 - 6); g.lineStyle(0);
          Ci(g, w * 0.62, h / 2, 4, C.metalDark); Ln(g, w - 10, h - 10, w * 0.62 + 6, h / 2 - 12, C.metalDark, 3); Ci(g, w - 10, h - 10, 4, C.metalDark);
          R(g, 8, 8, 34, h - 16, C.surface, { r: 2 }); const t = T("2TB", 8, C.fg, { anchor: [0.5, 0.5] }); t.position.set(25, h / 2); c.addChild(t); break; }
      }
      return c;
    }
    function trayArt(id) {
      if (id === "esd") { const c = new PIXI.Container(), g = Gfx(); c.addChild(g);
        g.lineStyle(6, C.onMat); g.drawEllipse(30, 30, 20, 16); g.lineStyle(3, C.onMatMuted); g.moveTo(50, 30); g.bezierCurveTo(64, 16, 76, 46, 88, 30); g.lineStyle(0);
        R(g, 86, 24, 12, 12, C.gold, { r: 2 }); return c; }
      if (CABLES[id]) { const c = new PIXI.Container(), g = Gfx(); c.addChild(g); const col = id === "sata" ? C.sata : C.cable;
        [[40, 14, 16], [48, 24, 26]].forEach(([y0, y1, y2]) => { g.lineStyle({ width: 6, color: col, cap: "round" }); g.moveTo(6, y0); g.bezierCurveTo(30, y0, 40, y1, 70, y2); });
        g.lineStyle(0); R(g, 68, 8, 26, 28, C.plastic, { r: 2, stroke: C.onMatMuted });
        const t = T(id === "c24" ? "24" : id === "c8" ? "8" : "SATA", 10, C.onMat, { anchor: [0.5, 0] }); t.position.set(81, 44); c.addChild(t); return c; }
      return art(id, false);
    }
    const bez = (p, t) => { const u = 1 - t; return [u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0], u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1]]; };
    function drawCable(node, id, t) {
      if (node.destroyed) return; const cb = CABLES[id], g = node.cableG; g.clear();
      const m = Math.max(2, Math.round(48 * t)); g.lineStyle({ width: cb.w, color: C[cb.color], cap: "round", join: "round" });
      const p0 = bez(cb.pts, 0); g.moveTo(p0[0], p0[1]); for (let i = 1; i <= m; i++) { const p = bez(cb.pts, t * i / m); g.lineTo(p[0], p[1]); }
      g.lineStyle(0);
      if (t >= 1) { const [x, y, w, h] = cb.end; R(g, x, y, w, h, C.plastic, { r: 2, stroke: C.metalDark }); }
      else { const p = bez(cb.pts, t); R(g, p[0] - 6, p[1] - 6, 12, 12, C.plastic, { r: 2, stroke: C.metalDark }); }
    }

    function drawPoly(g, id, t) {
      const cb = PCAB[id], { x: ox, y: oy } = byId[id].slot, P = cb.pts.map(([x, y]) => [x - ox, y - oy]); g.clear();
      let tot = 0; const seg = P.slice(1).map((p, i) => { const d = Math.hypot(p[0] - P[i][0], p[1] - P[i][1]); tot += d; return d; });
      let rem = tot * t; g.lineStyle({ width: cb.w, color: C.cable, cap: "round", join: "round" }); g.moveTo(P[0][0], P[0][1]);
      let end = P[0];
      for (let i = 0; i < seg.length && rem > 0; i++) { const k = Math.min(1, rem / seg[i]); end = [P[i][0] + (P[i + 1][0] - P[i][0]) * k, P[i][1] + (P[i + 1][1] - P[i][1]) * k]; g.lineTo(end[0], end[1]); rem -= seg[i]; }
      g.lineStyle(0); R(g, end[0] - 5, end[1] - 4, 10, 8, C.plastic, { r: 2, stroke: C.metalDark });
    }

    /* ---------- Thùng máy ---------- */
    function drawCase() {
      const g = Gfx(); caseLayer.addChild(g);
      const add = (t, x, y, rot) => { t.position.set(x, y); if (rot) t.rotation = rot; caseLayer.addChild(t); };
      add(T(L("Nhìn từ hông trái, đã tháo nắp hông", "Left side view, side panel removed"), 11, C.muted, { family: F.b, weight: "500" }), 20, -28);
      add(T(L("Luồng gió: vào ở mặt trước, ra ở mặt sau", "Airflow: in at the front, out at the back"), 11, C.muted, { family: F.b, weight: "500", anchor: [1, 0] }), 580, -28);
      for (let x = 572; x > 44; x -= 11) Ln(g, x, 4, Math.max(44, x - 6), 4, C.muted, 1.5);
      g.beginFill(C.muted); g.drawPolygon([30, 4, 42, -1, 42, 9]); g.endFill();

      R(g, DESK.x, DESK.y, DESK.w, DESK.h, C.caseDeep, { r: 8, stroke: C.caseEdge, sw: 1.5 });
      add(T(L("MẶT BÀN · thả màn hình, bàn phím, chuột vào đây", "DESK · drop the monitor, keyboard and mouse here"), 10, C.muted, { family: F.d, weight: "600", anchor: [0, 1], ls: 1 }), 6, DESK.y + DESK.h - 4);
      R(g, 20, 20, 560, 480, C.case, { r: 6, stroke: C.caseEdge, sw: 2 });
      R(g, 36, 56, 32, 118, C.caseDeep, { r: 2 });
      R(g, 440, 300, 132, 190, C.case, { r: 4, stroke: C.caseEdge, sw: 1.5 }); Ln(g, 440, 396, 572, 396, C.caseEdge, 1.5);
      add(T(L("khay ổ 3,5\"", "3.5\" bay"), 10, C.muted, { family: F.b, weight: "500", anchor: [0.5, 1] }), 506, 486);
      R(g, 30, 384, 250, 106, C.caseDeep, { r: 4 });
      R(g, 508, 44, 44, 50, C.metal, { r: 3, stroke: C.metalDark }); Ci(g, 530, 69, 6, C.metalDark);
      add(T(L("nối đất", "ground"), 10, C.muted, { family: F.b, weight: "500", anchor: [0.5, 0] }), 530, 98);
      // mặt sau
      R(g, 2, 20, 22, 480, C.metal, { r: 3, stroke: C.metalDark }); R(g, 6, 58, 14, 114, C.metalDark, { r: 1 });
      for (let i = 0; i < 5; i++) { R(g, 6, 262 + i * 24, 14, 20, C.metal, { r: 1, stroke: C.metalDark }); Ci(g, 13, 266 + i * 24, 2, C.metalDark); }
      R(g, 6, 394, 14, 88, C.plastic, { r: 1 }); R(g, 8, 408, 10, 16, C.metal, { r: 1 }); R(g, 9, 440, 8, 10, C.accentStrong, { r: 1 });
      R(g, 24, 186, 20, 62, C.plastic, { r: 2, stroke: C.metalDark }); Ln(g, 34, 192, 34, 242, C.metalDark, 1.5);
      // mặt trước
      R(g, 552, 118, 24, 84, C.plastic, { r: 3, stroke: C.metalDark }); Ln(g, 564, 124, 564, 196, C.metalDark, 1.5);
      R(g, 552, 208, 24, 84, C.plastic, { r: 3, stroke: C.metalDark }); Ln(g, 564, 214, 564, 286, C.metalDark, 1.5);
      R(g, 576, 14, 38, 492, C.plastic, { r: 10, stroke: C.caseEdge, sw: 1.5 });
      for (let i = 0; i < 34; i++) Ln(g, 584, 118 + i * 11, 606, 118 + i * 11, C.metalDark, 1.5);
      R(g, 588, 62, 14, 6, C.metal, { r: 1 }); R(g, 588, 72, 14, 6, C.metal, { r: 1 }); Ci(g, 590, 90, 3, C.metalDark); Ci(g, 600, 90, 3, C.metalDark);
      R(g, 40, 500, 44, 8, C.caseDeep, { r: 2, stroke: C.caseEdge }); R(g, 512, 500, 44, 8, C.caseDeep, { r: 2, stroke: C.caseEdge });
      pwrGlow = Gfx(); Ci(pwrGlow, 595, 42, 19, C.accentStrong, { alpha: 0.18 }); Ci(pwrGlow, 595, 42, 14, C.accentStrong, { alpha: 0.28 }); pwrGlow.alpha = 0; caseLayer.addChild(pwrGlow);
      const pb = Gfx(); Ci(pb, 595, 42, 10, C.metalDark, { stroke: C.accentStrong, sw: 2 });
      pb.lineStyle({ width: 2, color: C.accentStrong, cap: "round" }); pb.moveTo(595 + 6 * Math.cos(-0.84), 42.5 + 6 * Math.sin(-0.84)); pb.arc(595, 42.5, 6, -0.84, 3.98);
      pb.moveTo(595, 34); pb.lineTo(595, 41); pb.lineStyle(0); caseLayer.addChild(pb);
      led = Gfx(); caseLayer.addChild(led); drawLed(false);
      add(T(L("MẶT SAU · cổng kết nối, cắm điện", "BACK · ports, power inlet"), 13, C.fg, { family: F.d, weight: "700", anchor: [0.5, 0.5], ls: 1.5 }), -22, 125, -Math.PI / 2);
      add(T(L("MẶT TRƯỚC · nút nguồn, USB", "FRONT · power button, USB"), 13, C.fg, { family: F.d, weight: "700", anchor: [0.5, 0.5], ls: 1.5 }), 634, 260, Math.PI / 2);
    }
    function drawLed(on) { led.clear(); if (on) Ci(led, 595, 104, 6, C.ok, { alpha: 0.3 }); Ci(led, 595, 104, 3, on ? C.ok : C.metalDark); }

    /* ---------- Dựng cảnh ---------- */
    function buildLayers() {
      world.removeChildren().forEach((c) => c.destroy({ children: true }));
      texts = []; fans = []; screens = []; partNodes = {}; sparks = []; air = []; tweens = [];
      caseLayer = new PIXI.Container(); partsLayer = new PIXI.Container(); partsLayer.sortableChildren = true;
      airLayer = new PIXI.Container(); slotLayer = new PIXI.Container(); fxLayer = new PIXI.Container();
      world.addChild(caseLayer, partsLayer, airLayer, slotLayer, fxLayer);
      drawCase();
      slotG = Gfx(); labelBg = Gfx(); labelTxt = T("", 11, C.accent, { family: F.d, weight: "600", ls: 0.4 });
      slotLayer.addChild(slotG, labelBg, labelTxt); lastNext = undefined;
    }
    function layout() {
      const w = stageEl.clientWidth, h = stageEl.clientHeight; if (!w || !h) return;
      app.renderer.resize(w, h); scale = Math.min(w / VB.w, h / VB.h); root.scale.set(scale);
      root.position.set((w - VB.w * scale) / 2 - VB.x * scale, (h - VB.h * scale) / 2 - VB.y * scale);
      const r = textRes(); texts = texts.filter((t) => !t.destroyed); texts.forEach((t) => t.resolution = r);
    }

    /* ---------- Tween & hiệu ứng ---------- */
    const eOut = (k) => 1 - Math.pow(1 - k, 3), eBack = (k) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); },
      eInOut = (k) => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    const getP = (o, k) => k === "scale" ? o.scale.x : o[k], setP = (o, k, v) => k === "scale" ? o.scale.set(v) : (o[k] = v);
    function tween(o, to, dur, opt = {}) { const from = {}; for (const k in to) from[k] = getP(o, k); tweens.push({ o, from, to, dur: Math.max(1, dur), t: -(opt.delay || 0), ease: opt.ease || eOut, onUpdate: opt.onUpdate, onDone: opt.onDone }); }

    function addPartNode(id, anim) {
      if (CABLES[id]) {
        const node = new PIXI.Container(), g = Gfx(); node.addChild(g); node.cableG = g; node.zIndex = Z.indexOf(id); partsLayer.addChild(node); partNodes[id] = node;
        if (anim && !reduce) { const o = { t: 0 }; drawCable(node, id, 0); tween(o, { t: 1 }, 560, { ease: eInOut, onUpdate: () => drawCable(node, id, o.t), onDone: () => { drawCable(node, id, 1); snapFx(id); } }); }
        else drawCable(node, id, 1);
        return;
      }
      const { x, y, w, h } = byId[id].slot, node = art(id, true); node.pivot.set(w / 2, h / 2); node.zIndex = Z.indexOf(id);
      partsLayer.addChild(node); partNodes[id] = node; const tx = x + w / 2, ty = y + h / 2;
      let wire = null; if (PCAB[id]) { wire = Gfx(); node.addChild(wire); drawPoly(wire, id, reduce || !anim ? 1 : 0); }
      if (node.scr) screens.push(node.scr);
      const plug = () => { if (!wire || node.destroyed) return; if (reduce) return drawPoly(wire, id, 1); const o = { t: 0 }; tween(o, { t: 1 }, 650, { ease: eInOut, onUpdate: () => { if (!wire.destroyed) drawPoly(wire, id, o.t); }, onDone: () => { if (!wire.destroyed) drawPoly(wire, id, 1); } }); };
      if (anim && !reduce) {
        const from = anim.from;
        if (from) { node.position.set(from.x, from.y); node.alpha = 0.9; node.scale.set(1.06); node.rotation = 0.05; }
        else { node.position.set(tx, ty - 50); node.alpha = 0; }
        tween(node, { x: tx, y: ty, alpha: 1, scale: 1, rotation: 0 }, from ? 300 : 360, { ease: from ? eOut : eBack, onDone: () => {
          if (node.destroyed) return; tween(node, { scale: 0.965 }, 60, { onDone: () => { if (!node.destroyed) tween(node, { scale: 1 }, 140, { ease: eBack }); } }); snapFx(id); plug(); } });
      } else node.position.set(tx, ty);
    }
    function flashRect(x, y, w, h, color, a) { const f = Gfx(); R(f, x, y, w, h, color, { r: 4, alpha: 1 }); f.alpha = a; fxLayer.addChild(f);
      tween(f, { alpha: 0 }, reduce ? 200 : 450, { onDone: () => f.destroy() }); }
    function snapFx(id) {
      const s = byId[id].slot, cb = CABLES[id], r = cb ? { x: cb.end[0], y: cb.end[1], w: cb.end[2], h: cb.end[3] } : s;
      flashRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4, C.accentStrong, 0.45);
      if (reduce) return; const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      for (let i = 0; i < 16; i++) { const a = Math.random() * Math.PI * 2, v = 1.5 + Math.random() * 3, g = Ci(Gfx(), 0, 0, 1.4 + Math.random() * 1.4, i % 3 ? C.accentStrong : LIGHT);
        g.position.set(cx, cy); fxLayer.addChild(g); sparks.push({ g, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.2, life: 0, max: 420 + Math.random() * 260 }); }
    }
    let shakeT = 0;
    function failFx(pt, slotPart, ghostId) {
      if (slotPart && !S.installed.has(slotPart.id)) { const s = zn(slotPart); flashRect(s.x, s.y, s.w, s.h, C.err, 0.35); }
      const ring = Gfx(); ring.lineStyle(3, C.err); ring.drawCircle(0, 0, 18); ring.moveTo(-7, -7); ring.lineTo(7, 7); ring.moveTo(7, -7); ring.lineTo(-7, 7);
      ring.position.set(pt.x, pt.y); fxLayer.addChild(ring); ring.scale.set(0.5);
      tween(ring, { scale: 1.25, alpha: 0 }, reduce ? 250 : 520, { onDone: () => ring.destroy() });
      if (reduce) return; shakeT = 320;
      if (ghostId && !CABLES[ghostId] && ghostId !== "esd") { const { w, h } = byId[ghostId].slot, gh = art(ghostId, false); gh.pivot.set(w / 2, h / 2); gh.position.set(pt.x, pt.y); gh.alpha = 0.75; fxLayer.addChild(gh);
        tween(gh, { alpha: 0, scale: 0.82, y: pt.y + 18, rotation: -0.08 }, 380, { onDone: () => gh.destroy({ children: true }) }); }
    }

    /* ---------- Nguồn & luồng gió ---------- */
    let powered = false, fanSpeed = 0, airClock = 0, powerT = 0;
    function beep() { try { const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain();
      o.type = "square"; o.frequency.value = 880; g.gain.value = 0.04; o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 0.18); setTimeout(() => a.close(), 500); } catch (e) { /* bỏ qua */ } }
    function lerpColor(a, b, t) { const ar = a >> 16, ag = a >> 8 & 255, ab = a & 255, br = b >> 16, bg = b >> 8 & 255, bb = b & 255;
      return (Math.round(ar + (br - ar) * t) << 16) | (Math.round(ag + (bg - ag) * t) << 8) | Math.round(ab + (bb - ab) * t); }
    function spawnAir() {
      const lower = Math.random() < 0.25, y0 = lower ? 300 + Math.random() * 80 : 122 + Math.random() * 166;
      const g = Ci(Gfx(), 0, 0, 2.2, 0xffffff); airLayer.addChild(g);
      air.push({ g, y0, x0: 574, x1: lower ? 40 : 32, y1: lower ? 430 + Math.random() * 30 : 196 + Math.random() * 44, t: 0, dur: 2300 + Math.random() * 900, ph: Math.random() * 6 });
    }

    /* ---------- Trạng thái ---------- */
    const S = { mode: "learn", installed: new Set(), mistakes: 0, wrongStreak: 0, helped: 0, selected: null, start: null, timer: null, infoId: null };
    let hoverSlot = null, hoverPart = null, kbId = null, lastNext;
    const nextPart = () => PARTS.find((p) => !S.installed.has(p.id) && p.needs.every((n) => S.installed.has(n)));
    const viewSet = () => S.mode === "explore" ? new Set(Z) : S.installed;
    const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    const elapsed = () => S.start ? Math.floor((Date.now() - S.start) / 1000) : 0;
    const inside = (r, pt, pad = 0) => pt.x >= r.x - pad && pt.x <= r.x + r.w + pad && pt.y >= r.y - pad && pt.y <= r.y + r.h + pad;
    function slotAt(pt) { return PARTS.filter((p) => !S.installed.has(p.id) && inside(zn(p), pt, 4)).sort((a, b) => zn(a).w * zn(a).h - zn(b).w * zn(b).h)[0] || null; }
    function partAt(pt) { for (let i = Z.length - 1; i >= 0; i--) { const id = Z[i]; if (!viewSet().has(id)) continue; const cb = CABLES[id];
      const r = cb ? { x: cb.end[0], y: cb.end[1], w: cb.end[2], h: cb.end[3] } : byId[id].slot; if (inside(r, pt, cb ? 8 : 0)) return byId[id]; } return null; }
    function toLogical(cx, cy) { const r = view.getBoundingClientRect();
      return { x: (cx - r.left - root.x) / scale, y: (cy - r.top - root.y) / scale, inside: cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom }; }

    function syncParts(animId, anim) {
      const v = viewSet();
      for (const id in partNodes) if (!v.has(id)) { partNodes[id].destroy({ children: true }); delete partNodes[id]; }
      Z.forEach((id) => { if (v.has(id) && !partNodes[id]) addPartNode(id, id === animId ? anim : null); });
    }
    function updateNext() {
      const n = S.mode === "learn" ? nextPart() : null, id = n ? n.id : null; if (id === lastNext) return; lastNext = id;
      labelBg.clear(); labelTxt.text = ""; if (!n) return;
      const { x, y, w, h } = zn(n); labelTxt.text = n.slotName; labelTxt.style.fill = C.accent;
      const tw = labelTxt.width, th = labelTxt.height, lx = Math.min(Math.max(x + w / 2 - tw / 2, 24), 580 - tw), ly = y > 40 ? y - th - 8 : y + h + 6;
      labelTxt.position.set(lx, ly); R(labelBg, lx - 6, ly - 2, tw + 12, th + 4, C.surface, { r: 4, alpha: 0.94, stroke: C.accentStrong });
    }

    /* ---------- Khay linh kiện ---------- */
    const ICON = {};
    function buildIcons() { PARTS.forEach((p) => { const c = trayArt(p.id); try { ICON[p.id] = app.renderer.extract.canvas(c).toDataURL(); } catch (e) { ICON[p.id] = ""; } c.destroy({ children: true }); });
      texts = texts.filter((t) => !t.destroyed); }
    function drawTray() {
      tray.innerHTML = "";
      PARTS.forEach((p) => {
        const b = document.createElement("button"); b.type = "button"; b.className = "part"; b.dataset.id = p.id;
        const done = S.mode !== "explore" && S.installed.has(p.id); if (done) { b.classList.add("done"); b.setAttribute("aria-disabled", "true"); }
        b.setAttribute("aria-pressed", String(S.selected === p.id || (S.mode === "explore" && S.infoId === p.id)));
        b.innerHTML = `<img alt="" src="${ICON[p.id]}"><span class="nm">${p.name}</span>`; tray.appendChild(b);
      });
    }
    function drawGuide() {
      const n = PARTS.length, k = S.installed.size;
      $("#barFill").style.width = (S.mode === "explore" ? 100 : k / n * 100) + "%";
      $("#progTxt").textContent = S.mode === "explore" ? `${n}/${n}` : `${k}/${n}`;
      if (S.mode === "learn") { const p = nextPart();
        guide.innerHTML = p ? `<div class="eyebrow">${L(`Bước ${k + 1} / ${n} · Chế độ học`, `Step ${k + 1} / ${n} · Learn mode`)}</div><h2>${p.name}</h2><p>${p.step}</p><p class="tip">${p.why}</p>`
          : powered ? `<div class="eyebrow">${L("Đang chạy", "Running")}</div><h2>${L("Máy đã khởi động", "The PC has booted")}</h2><p>${L("Màn hình hiện Hello IT. Quạt CPU, quạt card đồ họa và quạt nguồn đang quay. Các chấm chuyển từ xanh sang cam là khí mát đi vào ở mặt trước và khí nóng đi ra ở mặt sau.", "The monitor shows Hello IT. The CPU fan, graphics card fans and PSU fan are spinning. The dots shifting from blue to orange are cool air entering at the front and hot air leaving at the back.")}</p>`
          : `<div class="eyebrow">${L("Hoàn tất", "Complete")}</div><h2>${L("Máy đã lắp xong", "The PC is built")}</h2><p>${L("Bấm nút bật nguồn để chạy thử.", "Press the power button to test it.")}</p>`; }
      else if (S.mode === "test") {
        guide.innerHTML = `<div class="eyebrow">${L("Chế độ kiểm tra", "Test mode")}</div><h2>${L("Tự lắp hoàn chỉnh máy", "Build the whole PC yourself")}</h2><p>${L("Không có gợi ý vị trí. Mỗi lần lắp sai bị trừ 4 điểm.", "No slot hints. Every wrong install costs 4 points.")}</p>
          <div class="stats"><div><b id="tTime">${fmtTime(elapsed())}</b><span>${L("thời gian", "time")}</span></div><div><b>${S.mistakes}</b><span>${L("lần sai", "mistakes")}</span></div><div><b>${Math.max(0, 100 - S.mistakes * 4)}</b><span>${L("điểm", "score")}</span></div></div>`; }
      else { const p = S.infoId && byId[S.infoId];
        guide.innerHTML = p ? `<div class="eyebrow">${L("Khám phá", "Explore")}</div><h2>${p.name}</h2><p class="spec">${p.spec}</p><p>${p.role}</p><p class="tip">${L("Vị trí", "Location")}: ${p.slotName}. ${p.why}</p>`
          : `<div class="eyebrow">${L("Chế độ khám phá", "Explore mode")}</div><h2>${L("Máy đang chạy", "The PC is running")}</h2><p>${L("Chạm vào một linh kiện trong thùng máy hoặc trên thảm để xem thông số. Các chấm chuyển từ xanh sang cam là khí mát đi vào và khí nóng đi ra.", "Tap a part in the case or on the mat to read its specs. The dots shifting from blue to orange are cool air coming in and hot air going out.")}</p>`; }
      $("#matHint").textContent = S.mode === "explore" ? L("Chạm để xem thông tin", "Tap to see details") : L("Kéo linh kiện vào thùng máy, hoặc chạm để chọn rồi chạm vị trí lắp", "Drag a part into the case, or tap to select and then tap the slot");
    }
    function say(msg, kind) { statusEl.textContent = msg; statusEl.className = kind || ""; }
    function renderAll(animId, anim) { syncParts(animId, anim); updateNext(); drawTray(); drawGuide(); }

    /* ---------- Luật lắp ráp ---------- */
    function attempt(id, pt, anim) {
      const p = byId[id]; if (S.installed.has(id)) return;
      if (!inside(zn(p), pt, 10)) {
        const other = PARTS.filter((o) => o.id !== id && inside(zn(o), pt, 4)).sort((a, b) => zn(a).w * zn(a).h - zn(b).w * zn(b).h)[0];
        return fail(id, other ? L(`Chỗ này là ${other.slotName}, không phải chỗ lắp ${nm(p)}.`, `This is the ${other.slotName}, not where the ${nm(p)} goes.`) : L(`Đây không phải vị trí lắp ${nm(p)}.`, `This is not where the ${nm(p)} goes.`), pt, other, anim);
      }
      if (id !== "esd" && !p.periph && !S.installed.has("esd")) return fail(id, L("Hãy đeo vòng chống tĩnh điện và kẹp vào khung máy trước khi chạm vào linh kiện.", "Put on the antistatic strap and clip it to the frame before touching any part."), pt, p, anim);
      const missing = p.needs.filter((n) => !S.installed.has(n));
      if (missing.length) return fail(id, L(`Chưa lắp được ${nm(p)}: cần lắp ${missing.map((m) => nm(byId[m])).join(" và ")} trước.`, `Cannot install the ${nm(p)} yet: install the ${missing.map((m) => nm(byId[m])).join(" and the ")} first.`) + (S.mode === "learn" ? " " + p.why : ""), pt, p, anim);
      install(id, L(`Đã lắp ${nm(p)}.`, `Installed the ${nm(p)}.`), anim);
    }
    function install(id, msg, anim) {
      S.installed.add(id); S.wrongStreak = 0; S.selected = null; say(msg, "ok"); G.sound.play("pop"); renderAll(id, anim || "drop");
      if (S.installed.size === PARTS.length) setTimeout(finish, reduce ? 0 : 750);
    }
    function fail(id, msg, pt, slotPart, anim) {
      S.mistakes++; S.wrongStreak++; failFx(pt, slotPart, anim && anim.from ? id : null); G.sound.play("bad");
      if (S.mode === "learn" && S.wrongStreak >= 3) { const n = nextPart();
        if (n) { S.helped++; install(n.id, L(`Sai 3 lần liên tiếp nên mình lắp giúp bước này: ${nm(n)}. ${n.step}`, `Three wrong tries in a row, so I installed this step for you: ${nm(n)}. ${n.step}`), "drop"); statusEl.className = "info"; return; } }
      say(msg, "err"); drawGuide();
    }
    function finish() {
      clearInterval(S.timer); const t = fmtTime(elapsed()), score = Math.max(0, 100 - S.mistakes * 4);
      if (S.mode === "test") G.progress.record(GAME_ID, 0, score, 1);
      G.sound.play("win");
      donePanel.innerHTML = S.mode === "test"
        ? `<div class="eyebrow">${L("Hoàn thành bài kiểm tra", "Test complete")}</div><h2>${L(`${score} điểm`, `${score} points`)}</h2><p>${L(`Thời gian ${t} · ${S.mistakes} lần lắp sai`, `Time ${t} · ${S.mistakes} wrong installs`)}</p><div class="row"><button class="pbtn primary" type="button" data-act="power">${L("Bật nguồn", "Power on")}</button><button class="pbtn" type="button" data-act="again">${L("Làm lại", "Try again")}</button></div>`
        : `<div class="eyebrow">${L("Hoàn thành", "Complete")}</div><h2>${L("Máy sẵn sàng bật nguồn", "Ready to power on")}</h2><p>${L(`${S.mistakes} lần sai`, `${S.mistakes} mistakes`)}${S.helped ? L(`, được lắp giúp ${S.helped} bước`, `, ${S.helped} steps installed for you`) : ""}.</p><div class="row"><button class="pbtn primary" type="button" data-act="power">${L("Bật nguồn", "Power on")}</button><button class="pbtn" type="button" data-act="test">${L("Làm bài kiểm tra", "Take the test")}</button></div>`;
      donePanel.hidden = false; donePanel.querySelector('[data-act="power"]').focus();
    }
    function powerOn(withBeep) { powered = true; powerT = time; drawLed(true); if (withBeep) beep(); drawGuide();
      say(L("Đã bật nguồn. POST thành công với một tiếng bíp ngắn, các quạt bắt đầu quay và màn hình hiện Hello IT. Khí mát vào ở mặt trước, khí nóng ra ở mặt sau.", "Powered on. POST succeeds with one short beep, the fans start spinning and the monitor shows Hello IT. Cool air comes in at the front, hot air leaves at the back."), "ok"); }
    donePanel.addEventListener("click", (e) => { const a = e.target.closest("[data-act]"); if (!a) return;
      if (a.dataset.act === "power") { donePanel.hidden = true; powerOn(true); } else if (a.dataset.act === "again") setMode(S.mode); else setMode(a.dataset.act); });

    function setMode(m) {
      S.mode = m; S.installed = new Set(); S.mistakes = 0; S.wrongStreak = 0; S.helped = 0; S.selected = null; S.infoId = null; S.start = null; kbId = null;
      clearInterval(S.timer); donePanel.hidden = true; powered = false; drawLed(false);
      air.forEach((a) => a.g.destroy()); air = [];
      if (m === "test") { S.start = Date.now(); S.timer = setInterval(() => { const el = $("#tTime"); if (el) el.textContent = fmtTime(elapsed()); }, 1000); }
      document.querySelectorAll(".pcasm .seg button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === m)));
      renderAll();
      if (m === "explore") { powered = true; powerT = time; drawLed(true); say(""); }
      else say(m === "learn" ? L("Bắt đầu từ bước 1. Vị trí cần lắp được đánh dấu bằng khung vàng nhấp nháy.", "Start at step 1. The slot to fill is marked with a pulsing yellow frame.") : L("Đã bắt đầu tính giờ.", "The clock is running."), "info");
    }
    document.querySelectorAll(".pcasm .seg button").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
    $("#resetBtn").addEventListener("click", () => setMode(S.mode));

    /* ---------- Kéo thả từ thảm ---------- */
    let drag = null, suppressClick = false;
    tray.addEventListener("pointerdown", (e) => {
      const b = e.target.closest(".part"); if (!b || S.mode === "explore" || S.installed.has(b.dataset.id)) return;
      drag = { id: b.dataset.id, sx: e.clientX, sy: e.clientY, on: false, pid: e.pointerId }; b.setPointerCapture(e.pointerId);
    });
    tray.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.pid) return;
      if (!drag.on && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) {
        drag.on = true; const gh = document.createElement("div"); gh.className = "ghost"; gh.innerHTML = `<img alt="" src="${ICON[drag.id]}">`; document.body.appendChild(gh); drag.ghost = gh;
        S.selected = null; tray.querySelectorAll(".part").forEach((x) => x.setAttribute("aria-pressed", "false"));
      }
      if (drag.on) { drag.ghost.style.transform = `translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%)`;
        const pt = toLogical(e.clientX, e.clientY); hoverSlot = pt.inside ? slotAt(pt) : null; }
    });
    function endDrag(e, cancel) {
      if (!drag || e.pointerId !== drag.pid) return; const d = drag; drag = null;
      if (!d.on) return; d.ghost.remove(); suppressClick = true; hoverSlot = null;
      if (cancel) return; const pt = toLogical(e.clientX, e.clientY);
      if (pt.inside) attempt(d.id, pt, { from: { x: pt.x, y: pt.y } }); else say(L("Thả linh kiện vào trong thùng máy.", "Drop the part inside the case."), "info");
    }
    tray.addEventListener("pointerup", (e) => endDrag(e, false));
    tray.addEventListener("pointercancel", (e) => endDrag(e, true));
    tray.addEventListener("click", (e) => {
      const b = e.target.closest(".part"); if (!b) return; if (suppressClick) { suppressClick = false; return; }
      const id = b.dataset.id;
      if (S.mode === "explore") { S.infoId = id; drawTray(); drawGuide(); return; }
      if (S.installed.has(id)) return;
      S.selected = S.selected === id ? null : id;
      tray.querySelectorAll(".part").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.id === S.selected)));
      if (S.selected) say(L(`Đã chọn ${nm(byId[id])}. Chạm vào vị trí lắp trên thùng máy.`, `Selected the ${nm(byId[id])}. Tap its slot in the case.`), "info");
    });

    /* ---------- Thao tác trên khung máy ---------- */
    view.addEventListener("pointermove", (e) => {
      const pt = toLogical(e.clientX, e.clientY);
      if (S.mode === "explore") { hoverPart = partAt(pt); view.style.cursor = hoverPart ? "pointer" : "default"; }
      else if (S.selected) { hoverSlot = slotAt(pt); view.style.cursor = "crosshair"; }
      else view.style.cursor = "default";
    });
    view.addEventListener("pointerleave", () => { hoverPart = null; if (!drag) hoverSlot = null; });
    view.addEventListener("click", (e) => {
      const pt = toLogical(e.clientX, e.clientY);
      if (S.mode === "explore") { const p = partAt(pt); if (p) { S.infoId = p.id; drawTray(); drawGuide(); } return; }
      if (!S.selected) { if (slotAt(pt)) say(L("Chọn một linh kiện trên thảm trước, rồi chạm vào vị trí này.", "Pick a part on the mat first, then tap this slot."), "info"); return; }
      attempt(S.selected, pt, "drop"); hoverSlot = null;
    });
    view.addEventListener("keydown", (e) => {
      const list = S.mode === "explore" ? Z.map((id) => byId[id]) : PARTS.filter((p) => !S.installed.has(p.id)); if (!list.length) return;
      if (e.key.startsWith("Arrow")) { e.preventDefault(); const d = (e.key === "ArrowRight" || e.key === "ArrowDown") ? 1 : -1;
        let i = list.findIndex((p) => p.id === kbId); i = i < 0 ? (d > 0 ? 0 : list.length - 1) : ((i + d) % list.length + list.length) % list.length; kbId = list[i].id;
        say(S.mode === "explore" ? list[i].name : L(`Vị trí: ${list[i].slotName}`, `Slot: ${list[i].slotName}`), "info"); }
      else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!kbId) return; const p = byId[kbId];
        if (S.mode === "explore") { S.infoId = kbId; drawTray(); drawGuide(); return; }
        if (!S.selected) { say(L("Chọn một linh kiện trên thảm trước.", "Pick a part on the mat first."), "info"); return; }
        attempt(S.selected, { x: zn(p).x + zn(p).w / 2, y: zn(p).y + zn(p).h / 2 }, "drop"); }
      else if (e.key === "Escape") { S.selected = null; drawTray(); }
    });

    /* ---------- Vòng lặp khung hình ---------- */
    let time = 0;
    app.ticker.add(() => {
      const dt = Math.min(50, app.ticker.deltaMS), f = dt / 16.67; time += dt;
      for (let i = tweens.length - 1; i >= 0; i--) { const tw = tweens[i]; tw.t += dt; if (tw.t < 0) continue; const k = Math.min(1, tw.t / tw.dur), e = tw.ease(k);
        if (!tw.o.destroyed) for (const key in tw.to) setP(tw.o, key, tw.from[key] + (tw.to[key] - tw.from[key]) * e);
        if (tw.onUpdate) tw.onUpdate(e); if (k >= 1) { tweens.splice(i, 1); if (tw.onDone) tw.onDone(); } }
      for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.life += dt; s.vy += 0.12 * f; s.g.x += s.vx * f; s.g.y += s.vy * f; s.g.alpha = 1 - s.life / s.max;
        if (s.life >= s.max) { s.g.destroy(); sparks.splice(i, 1); } }
      fanSpeed += ((powered ? 0.24 : 0) - fanSpeed) * Math.min(1, 0.025 * f);
      fans = fans.filter((r) => !r.destroyed); fans.forEach((r) => r.rotation += fanSpeed * f);
      if (powered && !reduce) { airClock += dt; while (airClock > 70 && air.length < 70) { airClock -= 70; spawnAir(); } }
      for (let i = air.length - 1; i >= 0; i--) { const a = air[i]; a.t += dt / a.dur;
        if (a.t >= 1 || !powered) { a.g.destroy(); air.splice(i, 1); continue; }
        const s = a.t * a.t * (3 - 2 * a.t); a.g.x = a.x0 + (a.x1 - a.x0) * a.t; a.g.y = a.y0 + (a.y1 - a.y0) * s + Math.sin(a.t * 7 + a.ph) * 4;
        a.g.tint = lerpColor(C.airCold, C.airHot, a.t); a.g.alpha = Math.sin(Math.PI * a.t) * 0.75; }
      screens = screens.filter((s) => !s.destroyed);
      screens.forEach((s) => { const on = powered && time - powerT > 900; s.alpha += ((on ? 1 : 0) - s.alpha) * Math.min(1, 0.08 * f); s.cur.visible = Math.floor(time / 500) % 2 === 0; });
      pwrGlow.alpha = powered ? 0.7 + 0.3 * Math.sin(time * 0.004) : 0;
      if (shakeT > 0) { shakeT = Math.max(0, shakeT - dt); world.x = Math.sin(shakeT * 0.09) * 5 * (shakeT / 320); } else world.x = 0;
      // khung gợi ý
      slotG.clear();
      const n = S.mode === "learn" ? nextPart() : null;
      if (n) { const { x, y, w, h } = zn(n), k = (Math.sin(time * 0.005) + 1) / 2;
        slotG.beginFill(C.accentStrong, 0.07 + 0.1 * k); slotG.drawRoundedRect(x, y, w, h, 4); slotG.endFill();
        slotG.lineStyle(2, C.accentStrong, 0.45 + 0.5 * k); slotG.drawRoundedRect(x, y, w, h, 4);
        const o = 3 + 4 * k, len = Math.min(14, w / 2.5, h / 2.5); slotG.lineStyle({ width: 3, color: C.accentStrong, cap: "round" });
        [[x - o, y - o, 1, 1], [x + w + o, y - o, -1, 1], [x - o, y + h + o, 1, -1], [x + w + o, y + h + o, -1, -1]].forEach(([cx, cy, sx, sy]) => { slotG.moveTo(cx + len * sx, cy); slotG.lineTo(cx, cy); slotG.lineTo(cx, cy + len * sy); });
        slotG.lineStyle(0); }
      if (hoverSlot && !S.installed.has(hoverSlot.id)) { const { x, y, w, h } = zn(hoverSlot); slotG.beginFill(C.fg, 0.07); slotG.lineStyle(2, C.fg, 0.8); slotG.drawRoundedRect(x, y, w, h, 4); slotG.endFill(); slotG.lineStyle(0); }
      if (S.mode === "explore") { const p = hoverPart || (S.infoId && byId[S.infoId]); if (p) { const cb = CABLES[p.id], r = cb ? { x: cb.end[0], y: cb.end[1], w: cb.end[2], h: cb.end[3] } : p.slot;
        slotG.lineStyle(2, C.accentStrong, 1); slotG.drawRoundedRect(r.x - 3, r.y - 3, r.w + 6, r.h + 6, 5); slotG.lineStyle(0); } }
      if (kbId && document.activeElement === view && (S.mode === "explore" || !S.installed.has(kbId))) { const r = zn(byId[kbId]);
        slotG.lineStyle(2, C.fg, 1); slotG.drawRoundedRect(r.x - 5, r.y - 5, r.w + 10, r.h + 10, 6); slotG.lineStyle(0); }
    });

    /* ---------- Khởi tạo & đổi giao diện sáng/tối ---------- */
    function rebuild() {
      readPalette(); buildLayers(); layout(); syncParts(); updateNext(); buildIcons(); drawTray();
      drawLed(powered);
    }
    rebuild();
    new ResizeObserver(() => layout()).observe(stageEl);
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", rebuild);
    new MutationObserver(rebuild).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    setMode("learn");
    return {
      reset() { setMode(S.mode); },
      stop() { clearInterval(S.timer); if (drag && drag.ghost) drag.ghost.remove(); drag = null; hoverSlot = null; },
    };
  }

  /* ---------- Vào / thoát màn hình chơi ---------- */
  // Nhớ đang ở trong xưởng để F5 (hoặc đổi ngôn ngữ) không đẩy người chơi về màn hình đầu
  const KEY = "itgames:pc-assembly-2d-open";
  const flag = (v) => { try { v ? sessionStorage.setItem(KEY, "1") : sessionStorage.removeItem(KEY); } catch (e) { /* bỏ qua */ } };
  async function enter() {
    flag(true);
    G.showScreen("play");
    if (!booted) { booted = true; api = await boot(); if (!api) booted = false; }
    else if (api) api.reset();
  }
  $("#btn-start").addEventListener("click", enter);
  // Cũng được gọi khi người chơi bấm Back giữa chừng: dừng đồng hồ và kéo thả đang dở
  $("#btn-menu").addEventListener("click", () => { flag(false); if (api) api.stop(); G.showScreen("start"); });
  try { const nav = performance.getEntriesByType("navigation")[0]; if (nav && nav.type === "reload" && sessionStorage.getItem(KEY)) enter(); } catch (e) { /* bỏ qua */ }
})();
