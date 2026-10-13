/* Xưởng Lắp Ráp PC 3D — lắp máy tính để bàn bằng Three.js, nối màn hình, bàn phím, chuột, bật nguồn. Xem README.md. */
const { L } = G;
const GAME_ID = "pc-assembly";
const stageEl = document.getElementById("stage"), tray = document.getElementById("tray"), guide = document.getElementById("guide"),
  statusEl = document.getElementById("status"), donePanel = document.getElementById("donePanel"), labelsEl = document.getElementById("labels");

/* ---------- Vào / thoát màn hình chơi (đăng ký trước khi tải Three.js để nút luôn hoạt động) ---------- */
const hooks = { reset() {}, stop() {} };
const KEY = "itgames:pc-assembly-open";
const flag = (v) => { try { v ? sessionStorage.setItem(KEY, "1") : sessionStorage.removeItem(KEY); } catch (e) { /* bỏ qua */ } };
function enter() { flag(true); G.showScreen("play"); hooks.reset(); }
document.getElementById("btn-start").addEventListener("click", enter);
// Cũng được gọi khi người chơi bấm Back giữa chừng: dừng đồng hồ và kéo thả đang dở
document.getElementById("btn-menu").addEventListener("click", () => { flag(false); hooks.stop(); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); setFs(false); G.showScreen("start"); });

/* ---------- Toàn màn hình (iOS không hỗ trợ Fullscreen API cho phần tử: dùng chế độ phủ kín trang) ---------- */
const fsEl = document.getElementById("pcasm"), fsBtn = document.getElementById("fsBtn");
const fsOn = () => fsEl.classList.contains("fs");
function setFs(on, pseudo = false) {
  fsEl.classList.toggle("fs", on); fsEl.classList.toggle("pseudo", on && pseudo); document.body.style.overflow = on && pseudo ? "hidden" : "";
  fsBtn.setAttribute("aria-pressed", String(on)); fsBtn.textContent = on ? L("✕ Thoát toàn màn hình", "✕ Exit fullscreen") : L("⛶ Toàn màn hình", "⛶ Fullscreen");
}
fsBtn.addEventListener("click", async () => {
  if (fsOn()) { if (document.fullscreenElement) await document.exitFullscreen().catch(() => {}); setFs(false); return; }
  try { if (!fsEl.requestFullscreen) throw 0; await fsEl.requestFullscreen(); setFs(true); } catch (e) { setFs(true, true); }
});
document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement && fsOn() && !fsEl.classList.contains("pseudo")) setFs(false); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && fsEl.classList.contains("pseudo")) setFs(false); });

let THREE, RoomEnvironment;
try { THREE = await import("three"); ({ RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js")); }
catch (e) { stageEl.insertAdjacentHTML("afterbegin", `<p class="nogl">${L("Không tải được thư viện Three.js. Kiểm tra kết nối mạng rồi tải lại trang.", "Could not load the Three.js library. Check your connection and reload the page.")}</p>`); throw e; }
const { Vector3 } = THREE;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
try { await Promise.race([Promise.all([document.fonts.load('600 40px "JetBrains Mono"', "ATX"), document.fonts.load('700 40px "Chakra Petch"', "GPU")]), new Promise((r) => setTimeout(r, 1500))]); } catch (e) { /* bỏ qua */ }

/* ================= Dữ liệu (đơn vị: cm) ================= */
const ZB = -9.22; // mặt trước bo mạch chủ
// Vùng thả của màn hình, bàn phím, chuột: cả mặt bàn bên trái thùng máy; mỗi thiết bị tự trượt về chỗ của nó
const DESK = { c: [-53.5, 0.7, 10], s: [55, 4, 48] };
const PARTS = [
  { id: "esd", name: L("Vòng chống tĩnh điện", "Antistatic strap"), slotName: L("điểm nối đất trên khung", "grounding point on the frame"), needs: [], c: [17.9, 33.2, -9.75], s: [3.4, 3.8, 0.3],
    spec: L("Dây đeo cổ tay, điện trở 1 MΩ, kẹp cá sấu", "Wrist strap, 1 MΩ resistor, alligator clip"),
    role: L("Xả tĩnh điện trên người xuống khung máy.", "Drains static charge from your body into the chassis."),
    step: L("Đeo vòng vào cổ tay, rồi kẹp vào điểm nối đất: tấm kim loại không sơn ở góc trên, phía mặt trước của khung.", "Put the strap on your wrist, then clip it to the grounding point: the bare metal plate in the top corner of the frame, towards the front."),
    why: L("Tĩnh điện trên người có thể lên tới vài nghìn vôn, đủ làm hỏng chip mà bạn không hề cảm thấy.", "Static on your body can reach several thousand volts, enough to kill a chip without you feeling anything.") },
  { id: "psu", name: L("Bộ nguồn (PSU)", "Power supply (PSU)"), slotName: L("khoang nguồn", "PSU bay"), needs: ["esd"], c: [-14.1, 4.9, 0], s: [15, 8.6, 14],
    spec: L("ATX 650 W, 80 Plus Bronze", "ATX 650 W, 80 Plus Bronze"),
    role: L("Đổi điện xoay chiều 220 V thành các mức một chiều 12 V, 5 V và 3,3 V.", "Converts 220 V AC into 12 V, 5 V and 3.3 V DC rails."),
    step: L("Đặt bộ nguồn vào khoang dưới cùng phía sau, quạt quay xuống lưới lọc ở đáy, ổ cắm điện quay ra mặt sau.", "Place the PSU in the bottom rear bay with its fan facing down toward the filter in the floor and the power socket facing the back of the case."),
    why: L("Bộ nguồn nặng và cồng kềnh, nên lắp trước để không va vào các linh kiện khác.", "The PSU is heavy and bulky, so install it first so it does not knock into other parts.") },
  { id: "io", name: L("Tấm chắn I/O", "I/O shield"), slotName: L("ô I/O ở mặt sau", "rear I/O cutout"), needs: ["esd"], c: [-21.55, 27.15, -7.0], s: [0.15, 15.9, 4.4],
    spec: L("Đi kèm bo mạch chủ", "Comes with the motherboard"),
    role: L("Che kín và định vị các cổng I/O phía sau, chống bụi và nhiễu.", "Seals and locates the rear I/O ports, keeping out dust and interference."),
    step: L("Ấn tấm chắn I/O vào ô chữ nhật ở mặt sau thùng máy, ấn từ bên trong ra. Xoay sang góc \"Mặt sau\" để thấy rõ ô này.", "Press the I/O shield into the rectangular cutout at the back of the case, pushing from the inside out. Switch to the \"Rear\" view to see this cutout clearly."),
    why: L("Phải lắp trước bo mạch chủ. Khi bo mạch đã bắt vít thì không còn chỗ để ấn tấm chắn vào.", "It must go in before the motherboard. Once the board is screwed down there is no room left to press it in.") },
  { id: "mobo", name: L("Bo mạch chủ", "Motherboard"), slotName: L("vùng gắn bo mạch chủ", "motherboard mounting area"), needs: ["io"], c: [-8.19, 22.62, -9.3], s: [19.5, 24.96, 0.16],
    spec: L("ATX, socket LGA1700, 4 khe DDR5", "ATX, LGA1700 socket, 4 DDR5 slots"),
    role: L("Bảng mạch trung tâm, nối mọi linh kiện với nhau.", "The central circuit board that connects every other component."),
    step: L("Hạ bo mạch chủ vào khung sao cho cổng I/O khớp tấm chắn và lỗ vít trùng các chốt standoff.", "Lower the motherboard into the frame so the ports line up with the I/O shield and the screw holes meet the standoffs."),
    why: L("Ngoài đời, nhiều người lắp CPU, tản nhiệt và RAM lên bo mạch chủ trên bàn trước rồi mới đặt vào thùng.", "In real builds many people fit the CPU, cooler and RAM on the board on a bench first, then place it in the case.") },
  { id: "cpu", name: "CPU", slotName: L("socket CPU", "CPU socket"), needs: ["mobo"], c: [-10.14, 29.25, ZB + 0.2], s: [4.5, 4.5, 0.4],
    spec: L("LGA1700, TDP 65 W", "LGA1700, TDP 65 W"),
    role: L("Bộ xử lý trung tâm, thực thi lệnh của chương trình.", "The central processor, which executes program instructions."),
    step: L("Nâng cần gạt socket, đặt CPU sao cho tam giác vàng trùng góc đánh dấu trên socket. Không ấn mạnh.", "Lift the socket lever and set the CPU so its gold triangle matches the marked corner of the socket. Do not force it."),
    why: L("Chân socket LGA rất mảnh. Cong một chân là có thể hỏng bo mạch chủ.", "LGA socket pins are very thin. Bending one can ruin the motherboard.") },
  { id: "cooler", name: L("Tản nhiệt CPU", "CPU cooler"), slotName: L("vị trí tản nhiệt CPU", "CPU cooler position"), needs: ["cpu"], c: [-8.84, 29.25, -2.2], s: [7.6, 12, 13.6],
    spec: L("Tản tháp, 4 ống đồng, quạt 120 mm", "Tower cooler, 4 copper heat pipes, 120 mm fan"),
    role: L("Hút nhiệt từ CPU qua ống đồng ra lá tản, quạt đẩy gió nóng về phía quạt xả sau.", "Draws heat from the CPU through the heat pipes into the fins; the fan pushes hot air towards the rear exhaust fan."),
    step: L("Bôi một lượng keo tản nhiệt bằng hạt đậu lên giữa CPU, đặt tản nhiệt lên với quạt hướng về mặt trước, siết ốc theo đường chéo.", "Put a pea-sized dot of thermal paste on the middle of the CPU, set the cooler on top with its fan facing the front, and tighten the screws in a cross pattern."),
    why: L("Quạt tản thổi từ trước ra sau, cùng chiều luồng gió của thùng máy. Lắp ngược chiều sẽ làm khí nóng quẩn trong thùng.", "The cooler fan blows front to back, the same direction as the case airflow. Fitting it backwards would trap hot air inside the case.") },
  { id: "ram", name: "RAM", slotName: L("khe RAM A2 và B2", "RAM slots A2 and B2"), needs: ["mobo"], c: [-3.2, 28.39, ZB + 1.65], s: [2.4, 10.3, 3.3],
    spec: L("2 × 16 GB DDR5-5600, 288 chân", "2 × 16 GB DDR5-5600, 288 pins"),
    role: L("Bộ nhớ tạm cho dữ liệu đang xử lý, mất dữ liệu khi tắt máy.", "Working memory for data being processed; its contents vanish at power-off."),
    step: L("Mở lẫy hai đầu khe, căn khấc trên thanh RAM với gờ trong khe, ấn thẳng xuống đến khi lẫy tự khóa. Với 2 thanh, dùng khe A2 và B2 (khe thứ 2 và thứ 4 tính từ CPU).", "Open the latches at both ends, align the notch on the module with the key in the slot and press straight down until the latches lock. With 2 modules use slots A2 and B2 (the 2nd and 4th slots counting from the CPU)."),
    why: L("Lắp đúng cặp khe A2/B2 để RAM chạy kênh đôi. Khấc lệch tâm nên RAM chỉ cắm được một chiều.", "Using the A2/B2 pair gives dual-channel operation. The notch is off-centre, so RAM only fits one way.") },
  { id: "m2", name: L("SSD M.2", "M.2 SSD"), slotName: L("khe M.2", "M.2 slot"), needs: ["mobo"], c: [-8.58, 21.92, ZB + 0.15], s: [8, 2.2, 0.3],
    spec: L("M.2 2280 NVMe PCIe 4.0, 1 TB", "M.2 2280 NVMe PCIe 4.0, 1 TB"),
    role: L("Ổ lưu trữ chính để cài hệ điều hành, tốc độ đọc vài GB/s.", "Main storage for the operating system, reading at several GB/s."),
    step: L("Cắm SSD vào khe M.2 nghiêng khoảng 30°, ấn xuống rồi vặn ốc giữ ở đầu ổ.", "Insert the SSD into the M.2 slot at about 30°, press it down and fasten the retaining screw at the end."),
    why: L("Ổ NVMe chạy qua làn PCIe trên bo mạch nên không cần cáp dữ liệu hay cáp nguồn.", "An NVMe drive runs over PCIe lanes on the board, so it needs no data or power cable.") },
  { id: "gpu", name: L("Card đồ họa", "Graphics card"), slotName: L("khe PCIe x16", "PCIe x16 slot"), needs: ["mobo"], c: [-3.3, 16.46, -3.4], s: [29.4, 4.8, 11.6],
    spec: L("PCIe 4.0 x16, 2 quạt, nguồn phụ 8-pin", "PCIe 4.0 x16, 2 fans, 8-pin auxiliary power"),
    role: L("Xử lý hình ảnh và xuất tín hiệu ra màn hình.", "Renders graphics and sends the signal to the monitor."),
    step: L("Tháo nắp chắn khe mở rộng ở mặt sau, cắm card vào khe PCIe x16 trên cùng đến khi lẫy khóa, rồi vặn vít giữ bracket vào khung.", "Remove the expansion slot cover at the back, push the card into the top PCIe x16 slot until the latch clicks, then screw the bracket to the frame."),
    why: L("Card đồ họa dài và che các khe bên dưới, nên thường lắp sau các linh kiện khác trên bo mạch.", "The graphics card is long and covers the slots below it, so it usually goes in after the other parts on the board.") },
  { id: "hdd", name: L("Ổ cứng HDD 3,5\"", "3.5\" HDD"), slotName: L("khay ổ 3,5\"", "3.5\" drive bay"), needs: ["esd"], c: [13.9, 11.6, 0], s: [10.2, 2.6, 14.7],
    spec: L("2 TB, 7200 vòng/phút, SATA III", "2 TB, 7200 RPM, SATA III"),
    role: L("Lưu trữ dung lượng lớn với giá rẻ, chậm hơn SSD.", "Cheap bulk storage, slower than an SSD."),
    step: L("Trượt ổ cứng vào khay ổ phía trước, cổng kết nối quay về phía bo mạch chủ.", "Slide the drive into the front tray with its connectors facing the motherboard."),
    why: L("Ổ cơ có đĩa quay bên trong, cần bắt chặt để giảm rung và tiếng ồn.", "A mechanical drive has spinning platters, so it must be fixed firmly to reduce vibration and noise.") },
  { id: "c24", name: L("Cáp nguồn 24-pin", "24-pin power cable"), slotName: L("cổng nguồn 24-pin trên bo mạch chủ", "24-pin power connector on the motherboard"), needs: ["psu", "mobo"], c: [0.95, 24.6, ZB + 1.7], s: [1.1, 5.4, 1.6],
    spec: L("ATX 24-pin (20+4)", "ATX 24-pin (20+4)"),
    role: L("Cấp nguồn chính cho bo mạch chủ.", "Supplies the motherboard's main power."),
    step: L("Cắm đầu 24-pin từ bộ nguồn vào cổng dài ở cạnh phải bo mạch chủ đến khi lẫy kêu tách.", "Plug the 24-pin lead from the PSU into the long connector on the right edge of the motherboard until the latch clicks."),
    why: L("Thiếu cáp này thì bấm nút nguồn máy cũng không lên.", "Without this cable pressing the power button does nothing.") },
  { id: "c8", name: L("Cáp nguồn CPU 8-pin", "8-pin CPU power cable"), slotName: L("cổng nguồn CPU 8-pin", "8-pin CPU power connector"), needs: ["psu", "cooler"], c: [-15.4, 34.0, ZB + 1.7], s: [2.1, 1.1, 1.6],
    spec: L("EPS12V 8-pin (4+4)", "EPS12V 8-pin (4+4)"),
    role: L("Cấp nguồn riêng cho CPU qua mạch ổn áp VRM.", "Gives the CPU its own power through the VRM."),
    step: L("Luồn cáp 8-pin dọc mặt sau lên góc trên bên trái bo mạch chủ và cắm vào cổng nguồn CPU.", "Route the 8-pin cable up behind the motherboard tray to the top-left corner of the board and plug it into the CPU power connector."),
    why: L("Lắp tản nhiệt trước rồi mới cắm cáp 8-pin, để cáp không vướng tay khi siết ốc tản nhiệt.", "Fit the cooler first and plug in the 8-pin afterwards so the cable does not get in the way while you tighten the cooler screws.") },
  { id: "sata", name: L("Cáp nguồn SATA", "SATA power cable"), slotName: L("cổng SATA trên ổ cứng", "SATA port on the hard drive"), needs: ["psu", "hdd"], c: [8.2, 11.6, 4.0], s: [1.2, 0.9, 2.4],
    spec: L("Đầu nguồn SATA 15 chân", "15-pin SATA power connector"),
    role: L("Cấp nguồn cho ổ cứng và SSD 2,5\".", "Powers the hard drive and 2.5\" SSDs."),
    step: L("Cắm đầu nguồn SATA hình chữ L vào ổ cứng, chú ý chiều của khấc chữ L.", "Plug the L-shaped SATA power connector into the drive, matching the direction of the L-shaped notch."),
    why: L("Ổ cứng cần cả cáp nguồn lẫn cáp dữ liệu SATA. Bản mô phỏng này gộp chung thành một bước.", "A hard drive needs both a power cable and a SATA data cable. This simulation merges them into one step.") },
  // Thiết bị ngoại vi: thả lên mặt bàn (c, s = vùng thả), at = chỗ thiết bị tự trượt về, fx = hộp để chớp sáng khi vào chỗ
  { id: "kb", periph: true, name: L("Bàn phím", "Keyboard"), slotName: L("mặt bàn", "desk"), needs: ["mobo"], c: DESK.c, s: DESK.s, at: [-55, -1.27, 22], fx: [37, 3, 13],
    spec: L("Bàn phím cơ 104 phím, USB-A", "104-key mechanical keyboard, USB-A"),
    role: L("Thiết bị nhập: đổi mỗi phím bấm thành tín hiệu gửi cho CPU.", "Input device: turns every key press into a signal for the CPU."),
    step: L("Thả bàn phím lên mặt bàn (chỗ nào trên bàn cũng được, máy tự xếp vào vị trí), rồi cáp USB tự cắm vào cổng trên tấm I/O ở mặt sau thùng máy.", "Drop the keyboard anywhere on the desk (it settles into place by itself), and its USB cable plugs into a port on the I/O shield at the back of the case."),
    why: L("Bàn phím và chuột là thiết bị nhập, nối qua cổng USB của bo mạch chủ. Màn hình là thiết bị xuất, nối vào card đồ họa.", "The keyboard and mouse are input devices wired to the motherboard's USB ports. The monitor is an output device wired to the graphics card.") },
  { id: "ms", periph: true, name: L("Chuột", "Mouse"), slotName: L("mặt bàn", "desk"), needs: ["mobo"], c: DESK.c, s: DESK.s, at: [-30, -1.27, 22], fx: [7, 3.4, 11],
    spec: L("Chuột quang 1600 DPI, USB-A", "1600 DPI optical mouse, USB-A"),
    role: L("Thiết bị nhập: gửi chuyển động và cú bấm cho CPU.", "Input device: sends movement and clicks to the CPU."),
    step: L("Thả chuột lên mặt bàn, cáp USB tự cắm vào cổng thứ hai trên tấm I/O.", "Drop the mouse on the desk and its USB cable plugs into the second port on the I/O shield."),
    why: L("Cả hai đều qua USB nên chuột và bàn phím có thể đổi cổng cho nhau.", "Both go over USB, so the mouse and keyboard ports are interchangeable.") },
  { id: "mon", periph: true, name: L("Màn hình", "Monitor"), slotName: L("mặt bàn", "desk"), needs: ["gpu"], c: DESK.c, s: DESK.s, at: [-55, -1.27, 8], fx: [43, 34, 10],
    spec: L("24\" Full HD, 60 Hz, cổng HDMI", "24\" Full HD, 60 Hz, HDMI input"),
    role: L("Thiết bị xuất: hiển thị hình ảnh do card đồ họa gửi ra.", "Output device: shows the image the graphics card sends out."),
    step: L("Thả màn hình lên mặt bàn, cáp HDMI tự cắm vào cổng trên card đồ họa ở mặt sau thùng máy, không phải cổng của bo mạch chủ.", "Drop the monitor on the desk and its HDMI cable plugs into the port on the graphics card at the back of the case, not the motherboard's port."),
    why: L("Khi đã có card đồ họa rời, cắm nhầm vào cổng của bo mạch chủ thường không có tín hiệu: màn hình đen dù máy vẫn chạy.", "With a dedicated graphics card, plugging into the motherboard's port usually gives no signal: a black screen even though the PC is running.") },
];
const byId = Object.fromEntries(PARTS.map((p) => [p.id, p]));
const CAB = {
  c24: { pts: [[-6.6, 6.5, 3], [-1, 7.5, 6], [4, 12, 6.5], [4.5, 20, 6], [1.6, 24.6, 4.4], [0.95, 24.6, -6.72]], r: 0.55, color: "cable" },
  c8: { pts: [[-8, 9.2, 4], [-12, 11, 6], [-19.3, 13, 4.2], [-20.2, 22, -3.6], [-19.6, 36.4, -3.6], [-15.4, 36.2, -5.5], [-15.4, 34, -6.72]], r: 0.35, color: "cable" },
  sata: { pts: [[-6.6, 3.5, 4], [0, 3, 6], [5, 6.5, 6], [7.0, 11.6, 4.6], [7.6, 11.6, 4.0]], r: 0.3, color: "sata" },
};
// Cáp thiết bị ngoại vi: từ thiết bị trên bàn lên cổng ở mặt sau thùng máy (plug = kích thước đầu cắm)
const PCAB = {
  mon: { pts: [[-55, 1.7, 5.2], [-55, -0.8, 2.5], [-46, -0.8, -1.5], [-34, -0.8, -4.6], [-25, 5, -4.3], [-23.2, 12.5, -4.0], [-22.3, 15.26, -4.0]], r: 0.3, plug: [2.2, 0.6, 1.4] },
  kb: { pts: [[-55, -0.7, 15.7], [-48, -0.8, 15], [-38, -0.8, 6], [-30, -0.8, -3], [-24.5, 10, -6.6], [-22.9, 24, -7.6], [-22.3, 25.95, -7.6]], r: 0.22, plug: [1.8, 0.8, 1.5] },
  ms: { pts: [[-30, -0.5, 17], [-30, -0.8, 8], [-27, -0.8, -1], [-24.3, 12, -6], [-22.9, 26, -6.4], [-22.3, 28.35, -6.4]], r: 0.18, plug: [1.8, 0.8, 1.5] },
};
const IOH = [[-6.2, 1.6, 2.8], [-3.6, 1.2, 2.6], [-1.2, 1.4, 3], [1.2, 1.4, 3], [3.6, 1.0, 1.6], [5.8, 1.8, 2.6]];
const Z = ["psu", "io", "mobo", "m2", "cpu", "cooler", "ram", "gpu", "hdd", "c24", "c8", "sata", "kb", "ms", "mon", "esd"];

/* ================= Renderer, cảnh, ánh sáng ================= */
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x000000, 0);
const view = renderer.domElement; view.tabIndex = 0; view.setAttribute("role", "application");
view.setAttribute("aria-label", L("Thùng máy 3D. Dùng phím mũi tên để chọn vị trí, Enter để lắp linh kiện đang chọn.", "3D PC case. Use the arrow keys to choose a slot and Enter to install the selected part."));
stageEl.prepend(view);
const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer); const envTex = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture; scene.environment = envTex;
scene.add(new THREE.HemisphereLight(0xffffff, 0x3a4a48, 0.55));
const sun = new THREE.DirectionalLight(0xffffff, 2.1); sun.position.set(6, 62, 46); sun.target.position.set(-22, 14, 0);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -78, right: 78, top: 60, bottom: -60, near: 1, far: 180 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; scene.add(sun, sun.target);
const fillL = new THREE.DirectionalLight(0xdfe9ff, 0.5); fillL.position.set(-60, 25, 30); scene.add(fillL);
const camera = new THREE.PerspectiveCamera(32, 4 / 3, 1, 500);

/* ================= Vật liệu & texture ================= */
const M = (color, r = 0.55, m = 0.1, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: r, metalness: m }, extra));
const mat = {
  case: M(0xd9dde0, 0.42, 0.35), caseIn: M(0xc8cdd0, 0.6, 0.3), bezel: M(0x1d2023, 0.7, 0.05), black: M(0x121416, 0.6), plastic: M(0x2a2e32, 0.62),
  metal: M(0xb9c0c4, 0.3, 0.85), alu: M(0xd3d8db, 0.3, 0.9), aluDark: M(0x4a5156, 0.35, 0.8), copper: M(0xb8733f, 0.3, 0.9), gold: M(0xd4a843, 0.25, 1),
  pcb: M(0x1b1f22, 0.6, 0.05), ram: M(0x34507f, 0.32, 0.65), ssd: M(0x23432e, 0.55), green: M(0x2f5d3e, 0.6), cable: M(0x17191b, 0.75), sata: M(0xb7352a, 0.55),
  white: M(0xe9ecee, 0.5), fan: M(0x2d3236, 0.55), blade: M(0x40474d, 0.45, 0.1), psu: M(0x2b2f33, 0.45, 0.5), strap: M(0x2a62a8, 0.6), band: M(0x1e2a3a, 0.85),
  slotGrey: M(0x8a939a, 0.5), key: M(0xdfe3e5, 0.55, 0.05), screen: M(0x090c0f, 0.15, 0.2),
};
const holeMat = new THREE.MeshBasicMaterial({ color: 0x050607 });
const pwrMat = M(0x6b737a, 0.35, 0.6, { emissive: 0xf0a81c, emissiveIntensity: 0 });
const ledMat = M(0x2a3a30, 0.4, 0.1, { emissive: 0x3ddc84, emissiveIntensity: 0 });
const monLed = M(0x2a3a30, 0.4, 0.1, { emissive: 0x3ddc84, emissiveIntensity: 0 });
function ctex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t; }
const mono = '"JetBrains Mono",Consolas,monospace', disp = '"Chakra Petch","Segoe UI",sans-serif';
const moboTex = ctex(975, 1248, (x, w, h) => {
  x.fillStyle = "#1b1f22"; x.fillRect(0, 0, w, h);
  const P = (lx, ly) => [(lx + 9.75) * 50, (12.48 - ly) * 50];
  x.strokeStyle = "#2e363b"; x.lineWidth = 3;
  const lines = [[[-1.95, 2], [-1.95, -1.5], [4, -1.5], [4, -6]], [[2, 6.6], [3, 6.6]], [[-6, 1], [-6, -10], [0, -10]], [[6, -2], [9, -2], [9, -11]], [[-8, -6], [-4, -6], [-4, -11]], [[1, 10], [8, 10], [8, 0]], [[-9, 9], [-6, 9]], [[2, -11], [7, -11]]];
  lines.forEach((l) => { x.beginPath(); l.forEach((p, i) => { const [a, b] = P(...p); i ? x.lineTo(a, b) : x.moveTo(a, b); }); x.stroke(); });
  for (let i = 0; i < 40; i++) { x.beginPath(); const [a, b] = P(-9 + ((i * 37) % 180) / 10, -11 + ((i * 53) % 230) / 10); x.moveTo(a, b); x.lineTo(a + 40 + (i % 5) * 12, b); x.stroke(); }
  x.fillStyle = "#e8ecee"; x.font = `600 22px ${mono}`; x.textBaseline = "middle";
  const T = (s, lx, ly, al = "left") => { x.textAlign = al; const [a, b] = P(lx, ly); x.fillText(s, a, b); };
  T("CPU", -1.95, 3.6, "center"); T("DIMM_A1  A2  B1  B2", 4.56, -0.8, "center"); T("PCIEX16_1", -2.86, -5.4, "center"); T("PCIEX1_1", -7, -9.6, "center");
  T("M.2_1", -0.39, 0.6, "center"); T("ATX_PWR", 7.6, -1.6, "right"); T("CPU_PWR1", -7.21, 10.4, "center"); T("CMOS", 2.5, -11.6, "center");
  x.font = `700 34px ${disp}`; T("ATX · LGA1700", 8.8, -11.5, "right");
  x.strokeStyle = "#e8ecee"; x.lineWidth = 2; const [sa, sb] = P(-4.75, 9.43); x.strokeRect(sa, sb, 280, 280);
});
const pcbEdge = M(0x2b3236, 0.6);
const psuTex = ctex(750, 430, (x) => { x.fillStyle = "#2b2f33"; x.fillRect(0, 0, 750, 430); x.fillStyle = "#eef1f2"; x.fillRect(150, 80, 450, 270);
  x.fillStyle = "#1b1e21"; x.textAlign = "center"; x.textBaseline = "middle"; x.font = `700 92px ${disp}`; x.fillText("650W", 375, 170);
  x.font = `600 30px ${mono}`; x.fillText("80 PLUS BRONZE", 375, 250); x.font = `500 22px ${mono}`; x.fillText("ATX12V · 100–240 V~", 375, 300); });
const gpuTex = ctex(1470, 200, (x, w, h) => { x.fillStyle = "#24282c"; x.fillRect(0, 0, w, h); x.fillStyle = "#e59a0c"; x.fillRect(0, h - 26, w, 10);
  x.fillStyle = "#d9dee1"; x.font = `700 64px ${disp}`; x.textBaseline = "middle"; x.fillText("GPU", 60, h / 2 - 10); x.font = `600 30px ${mono}`; x.fillText("PCIe 4.0 x16 · 8 GB", 230, h / 2 - 8); });
const hddTex = ctex(510, 735, (x) => { x.fillStyle = "#cfd5d8"; x.fillRect(0, 0, 510, 735); x.fillStyle = "#f4f6f7"; x.fillRect(40, 60, 430, 420);
  x.fillStyle = "#1b1e21"; x.textAlign = "center"; x.font = `700 110px ${disp}`; x.fillText("2TB", 255, 220);
  x.font = `600 34px ${mono}`; x.fillText("7200 RPM", 255, 300); x.fillText("SATA 6Gb/s", 255, 350);
  x.strokeStyle = "#8f989d"; x.lineWidth = 4; x.beginPath(); x.arc(255, 600, 90, 0, Math.PI * 2); x.stroke(); });
const cpuTex = ctex(180, 180, (x) => { x.fillStyle = "#c9cfd3"; x.fillRect(0, 0, 180, 180); x.fillStyle = "#3a4045"; x.textAlign = "center";
  x.font = `700 30px ${disp}`; x.fillText("CPU", 90, 80); x.font = `600 18px ${mono}`; x.fillText("LGA1700", 90, 112); });
const bezelTex = ctex(408, 765, (x, w, h) => { x.fillStyle = "#1d2023"; x.fillRect(0, 0, w, h); x.fillStyle = "#0a0b0c";
  for (let r = 0; r < 70; r++) for (let c = 0; c < 38; c++) { const cx = 14 + c * 10.4 + (r % 2) * 5.2, cy = 150 + r * 8.6; if (cy < h - 24) { x.beginPath(); x.arc(cx, cy, 3.1, 0, Math.PI * 2); x.fill(); } }
  x.fillStyle = "#2a2e32"; x.fillRect(0, 0, w, 130); });
const S_ = (t, base) => { const m = base.clone(); m.map = t; m.color.set(0xffffff); return m; };
const moboFace = S_(moboTex, mat.pcb), psuFace = S_(psuTex, mat.psu), gpuFace = S_(gpuTex, mat.plastic), hddFace = S_(hddTex, mat.alu), cpuFace = S_(cpuTex, mat.alu), bezelFace = S_(bezelTex, mat.bezel);
// Màn hình hiện "Hello IT" khi bật nguồn (vẽ lại theo nhịp con trỏ nhấp nháy)
const helloTex = ctex(820, 480, () => {});
function drawHello(cursor) {
  const cv = helloTex.image, x = cv.getContext("2d"), w = cv.width, h = cv.height;
  const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#0b2540"); g.addColorStop(1, "#14436f"); x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.font = `600 124px ${mono}`; x.textBaseline = "middle"; x.textAlign = "left";
  const tw = x.measureText("Hello IT").width, x0 = (w - tw) / 2 - 24;
  x.fillStyle = "#cfeeff"; x.fillText("Hello IT", x0, h / 2); if (cursor) x.fillRect(x0 + tw + 14, h / 2 - 62, 26, 124);
  helloTex.needsUpdate = true;
}
drawHello(true);
const helloMat = new THREE.MeshBasicMaterial({ map: helloTex, transparent: true, opacity: 0, toneMapped: false, depthWrite: false });

/* ================= Hàm dựng hình ================= */
function B(w, h, d, m, x = 0, y = 0, z = 0, p) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; if (p) p.add(o); return o; }
function Cy(r, h, m, x, y, z, p, axis = "y", seg = 24) { const g = new THREE.CylinderGeometry(r, r, h, seg); if (axis === "x") g.rotateZ(Math.PI / 2); if (axis === "z") g.rotateX(Math.PI / 2);
  const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; if (p) p.add(o); return o; }
let fans = [], screens = [];
function makeFan(size, { frame = true, reg = false, depth = 2.5 } = {}) {
  const g = new THREE.Group();
  if (frame) { const t = size * 0.07; B(size, t, depth, mat.fan, 0, size / 2 - t / 2, 0, g); B(size, t, depth, mat.fan, 0, -size / 2 + t / 2, 0, g); B(t, size, depth, mat.fan, size / 2 - t / 2, 0, 0, g); B(t, size, depth, mat.fan, -size / 2 + t / 2, 0, 0, g);
    g.add(new THREE.Mesh(new THREE.TorusGeometry(size * 0.47, size * 0.03, 8, 48), mat.fan));
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3, s = B(size * 0.46, size * 0.035, 0.18, mat.fan, Math.cos(a) * size * 0.23, Math.sin(a) * size * 0.23, -depth / 2 + 0.12, g); s.rotation.z = a; }
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => Cy(size * 0.03, depth + 0.05, mat.metal, a * size * 0.41, b * size * 0.41, 0, g, "z", 10)); }
  else g.add(new THREE.Mesh(new THREE.TorusGeometry(size * 0.5, size * 0.035, 8, 48), mat.aluDark));
  const rot = new THREE.Group(); g.add(rot);
  Cy(size * 0.16, depth * 0.6, mat.plastic, 0, 0, 0, rot, "z"); Cy(size * 0.11, 0.06, mat.white, 0, 0, depth * 0.3 + 0.03, rot, "z");
  B(size * 0.04, size * 0.09, 0.08, mat.gold, size * 0.06, 0, depth * 0.3 + 0.07, rot);
  const bg = new THREE.BoxGeometry(size * 0.33, size * 0.17, 0.1);
  for (let i = 0; i < 7; i++) { const a = i * Math.PI * 2 / 7, b = new THREE.Mesh(bg, mat.blade); b.position.set(Math.cos(a) * size * 0.29, Math.sin(a) * size * 0.29, 0); b.rotation.set(0, 0, a); b.rotateX(0.5); b.castShadow = true; rot.add(b); }
  if (reg) fans.push(rot); return g;
}
function tube(pts, r, m, seg = 120) { const curve = new THREE.CatmullRomCurve3(pts.map((p) => new Vector3(...p))); const geo = new THREE.TubeGeometry(curve, seg, r, 10, false);
  const o = new THREE.Mesh(geo, m); o.castShadow = true; return o; }
const rectHole = (sh, z0, z1, y0, y1) => { const p = new THREE.Path(); p.moveTo(-z1, y0); p.lineTo(-z0, y0); p.lineTo(-z0, y1); p.lineTo(-z1, y1); p.closePath(); sh.holes.push(p); };
const circHole = (sh, z, y, r) => { const p = new THREE.Path(); p.absarc(-z, y, r, 0, Math.PI * 2, true); sh.holes.push(p); };
function plate(zw, yh, depth, holesFn, m) { const sh = new THREE.Shape(); sh.moveTo(-zw / 2, -yh / 2); sh.lineTo(zw / 2, -yh / 2); sh.lineTo(zw / 2, yh / 2); sh.lineTo(-zw / 2, yh / 2); sh.closePath(); holesFn(sh);
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 12 }); g.rotateY(Math.PI / 2); g.translate(-depth / 2, 0, 0); const o = new THREE.Mesh(g, m); o.castShadow = o.receiveShadow = true; return o; }

function makeModel(id, reg) {
  const g = new THREE.Group(); g.userData.partId = id;
  switch (id) {
    case "esd": { const c = byId.esd.c;
      B(1.4, 0.7, 0.9, mat.gold, 0, 0, 0.5, g); B(0.5, 0.5, 1.4, mat.black, 0, 0, 1.4, g);
      const loc = (pt) => [pt[0] - c[0], pt[1] - c[1], pt[2] - c[2]];
      g.add(tube([[17.9, 33.2, -8.3], [16, 30, -3], [14.5, 22, 6], [13.5, 8, 12.5], [15, -0.6, 15.5], [18.2, -0.6, 16.4]].map(loc), 0.22, mat.strap, 80));
      const band = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.5, 12, 40), mat.band); band.rotation.x = Math.PI / 2; band.position.set(...loc([20.6, -0.72, 16.8])); band.castShadow = true; g.add(band);
      Cy(0.6, 0.3, mat.gold, ...loc([18.1, -0.5, 16.6]), g, "y"); break; }
    case "psu": {
      const body = new THREE.Mesh(new THREE.BoxGeometry(15, 8.6, 14), [mat.psu, mat.psu, mat.psu, mat.psu, psuFace, mat.psu]); body.castShadow = body.receiveShadow = true; g.add(body);
      B(0.2, 1.6, 2.6, mat.black, -7.55, 1.8, 3.5, g); B(0.3, 1, 0.8, mat.sata, -7.6, 1.8, 0.8, g); B(0.05, 6.2, 6.2, holeMat, -7.49, 0, -3.3, g);
      { const gr = plate(6.4, 6.4, 0.06, (sh) => { for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) { const z = (i + (j & 1) * 0.5) * 0.72, y = j * 0.64; if (Math.abs(z) < 2.8 && Math.abs(y) < 2.8) circHole(sh, z, y, 0.27); } }, mat.aluDark); gr.position.set(-7.56, 0, -3.3); g.add(gr); }
      [1.8, -0.2, -2.2].forEach((y) => B(0.2, 1.2, 2.2, mat.black, 7.55, y, 3.5, g)); B(0.2, 1.2, 1.4, mat.black, 7.55, 1.8, 0, g);
      Cy(5.9, 0.04, holeMat, 0, -4.32, 0, g, "y", 40); const f = makeFan(11.6, { frame: false, reg, depth: 0.8 }); f.rotation.x = Math.PI / 2; f.position.set(0, -4.0, 0); g.add(f); break; }
    case "io": {
      g.add(plate(4.4, 15.9, 0.15, (sh) => IOH.forEach(([y, h, w]) => rectHole(sh, -w / 2, w / 2, y - h / 2, y + h / 2)), mat.metal)); break; }
    case "mobo": {
      const board = new THREE.Mesh(new THREE.BoxGeometry(19.5, 24.96, 0.16), [pcbEdge, pcbEdge, pcbEdge, pcbEdge, moboFace, mat.pcb]); board.castShadow = board.receiveShadow = true; g.add(board);
      const fz = 0.08, sx = -1.95, sy = 6.63;
      B(5.2, 5.2, 0.3, mat.metal, sx, sy, fz + 0.15, g); B(4.0, 4.0, 0.32, mat.gold, sx, sy, fz + 0.14, g); Cy(0.08, 5, mat.metal, sx + 2.9, sy, fz + 0.3, g, "y", 8);
      B(6.5, 1.6, 1.3, mat.aluDark, sx, sy + 4.2, fz + 0.65, g); B(1.6, 6.5, 1.3, mat.aluDark, sx - 4.2, sy, fz + 0.65, g);
      [3.27, 4.13, 4.99, 5.85].forEach((x, i) => { B(0.5, 10.8, 0.7, i % 2 ? mat.slotGrey : mat.black, x, 5.77, fz + 0.35, g); B(0.56, 0.5, 0.8, mat.white, x, 5.77 + 5.55, fz + 0.4, g); B(0.56, 0.5, 0.8, mat.white, x, 5.77 - 5.55, fz + 0.4, g); });
      B(1.0, 5.3, 0.9, mat.black, 9.14, 1.98, fz + 0.45, g); B(2.0, 1.0, 0.9, mat.black, -7.21, 11.38, fz + 0.45, g);
      B(9.0, 0.9, 0.6, mat.metal, -2.86, -4.32, fz + 0.3, g); B(8.9, 0.8, 0.95, mat.black, -2.86, -4.32, fz + 0.5, g); B(2.5, 0.8, 0.9, mat.black, -7.0, -8.5, fz + 0.45, g);
      B(0.6, 2.2, 0.4, mat.black, -4.7, -0.7, fz + 0.2, g); Cy(0.2, 0.4, mat.gold, 3.6, -0.7, fz + 0.2, g, "z", 10);
      B(4, 4, 0.7, mat.aluDark, 5.2, -7.5, fz + 0.35, g); Cy(1, 0.3, mat.metal, 2.5, -10.4, fz + 0.15, g, "z");
      for (let i = 0; i < 6; i++) Cy(0.3, 0.8, mat.aluDark, sx + 3.2, sy - 2.4 + i * 0.9, fz + 0.4, g, "z", 12);
      B(3.6, 15, 4, mat.plastic, -11.3, 4.53, fz + 2, g); IOH.forEach(([y, h, w], i) => { B(0.4, h * 0.78, w * 0.82, [mat.metal, mat.black, mat.ram, mat.metal, mat.gold, mat.black][i], -13.0, 4.53 + y, fz + 2.22, g); }); B(3.62, 15.02, 0.4, mat.aluDark, -11.3, 4.53, fz + 3.8, g); break; }
    case "cpu": {
      B(4.5, 4.5, 0.12, mat.green, 0, 0, -0.14, g); const ihs = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.6, 0.28), [mat.alu, mat.alu, mat.alu, mat.alu, cpuFace, mat.alu]); ihs.position.z = 0.06; ihs.castShadow = true; g.add(ihs);
      const tri = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.03, 3), mat.gold); tri.rotation.x = Math.PI / 2; tri.position.set(-1.95, -1.95, -0.07); g.add(tri); break; }
    case "cooler": {
      B(4, 4, 0.8, mat.copper, -1.3, 0, -6.4, g);
      [-2.5, -1.7, -0.9, -0.1].forEach((x) => Cy(0.3, 12.4, mat.copper, x, 0, -0.2, g, "z", 12));
      const fins = new THREE.InstancedMesh(new THREE.BoxGeometry(5, 12, 0.05), mat.alu, 34); const m4 = new THREE.Matrix4();
      for (let i = 0; i < 34; i++) { m4.makeTranslation(-1.3, 0, -5.2 + i * 0.35); fins.setMatrixAt(i, m4); } fins.castShadow = fins.receiveShadow = true; g.add(fins);
      B(5.2, 12.2, 0.2, mat.black, -1.3, 0, 6.75, g);
      const f = makeFan(12, { reg }); f.rotation.y = Math.PI / 2; f.position.set(2.55, 0, 0.7); g.add(f); break; }
    case "ram":
      [-0.86, 0.86].forEach((x) => { B(0.7, 10.3, 3.1, mat.ram, x, 0, 0, g); B(0.72, 10.3, 0.25, mat.white, x, 0, 1.6, g); B(0.6, 10, 0.25, mat.gold, x, 0, -1.6, g); }); break;
    case "m2":
      B(8, 2.2, 0.1, mat.ssd, 0, 0, 0, g); [-0.6, 1.9].forEach((x) => B(2.0, 1.6, 0.14, mat.black, x, 0, 0.1, g)); B(1.2, 1.2, 0.14, mat.black, -2.6, 0, 0.1, g); B(0.4, 2.0, 0.12, mat.gold, -3.8, 0, 0, g); break;
    case "gpu": {
      const sh = new THREE.Mesh(new THREE.BoxGeometry(29.4, 4.0, 11.6), [mat.plastic, mat.plastic, mat.plastic, mat.plastic, gpuFace, mat.plastic]); sh.position.y = -0.4; sh.castShadow = sh.receiveShadow = true; g.add(sh);
      B(29.4, 0.16, 11.2, mat.pcb, 0, 1.75, 0, g); B(29.4, 0.25, 11.4, mat.aluDark, 0, 2.0, 0, g);
      [-5.5, 5.5].forEach((x) => { const f = makeFan(9.6, { frame: false, reg, depth: 1 }); f.rotation.x = Math.PI / 2; f.position.set(x, -2.6, 0); g.add(f); });
      B(0.15, 5.2, 12.2, mat.metal, -18.25, 0, 0.3, g); [[-1.2, -3], [-1.2, -0.6], [-1.2, 1.8], [1.2, -1.8]].forEach(([y, z]) => B(0.3, 0.9, 1.6, mat.black, -18.4, y, z, g));
      B(0.3, 4.6, 0.8, mat.metal, -15, 0, -5.4, g); B(8.9, 0.3, 0.3, mat.gold, -7.75, 1.75, -5.85, g); B(2, 0.8, 1, mat.black, 9, 2.5, 4, g); break; }
    case "hdd": {
      const body = new THREE.Mesh(new THREE.BoxGeometry(10.2, 2.6, 14.7), [mat.alu, mat.alu, hddFace, mat.alu, mat.alu, mat.alu]); body.castShadow = body.receiveShadow = true; g.add(body);
      B(0.5, 0.8, 2.2, mat.black, -5.3, 0, 4, g); B(0.5, 0.8, 1.2, mat.black, -5.3, 0, 1.8, g); break; }
    case "mon": { // gốc ở mặt bàn, màn hình quay về +z
      B(14, 0.8, 9.5, mat.aluDark, 0, 0.4, 0, g); B(3.4, 11, 1.4, mat.aluDark, 0, 6.3, -1.8, g);
      B(43, 26, 2.0, mat.bezel, 0, 24.3, -1.0, g);
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(41, 24), mat.screen); scr.position.set(0, 24.3, 0.02); g.add(scr);
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(41, 24), helloMat); glow.position.set(0, 24.3, 0.05); glow.renderOrder = 5; g.add(glow);
      B(0.7, 0.3, 0.1, monLed, 19.5, 11.9, 0.02, g);
      if (reg) screens.push(glow); break; }
    case "kb": {
      B(36, 1.4, 12.5, mat.plastic, 0, 0.7, 0, g);
      const keys = new THREE.InstancedMesh(new THREE.BoxGeometry(2.1, 0.7, 2.0), mat.key, 56); const m4 = new THREE.Matrix4(); let n = 0;
      for (let r = 0; r < 4; r++) for (let k = 0; k < 14; k++) { m4.makeTranslation(-16.25 + k * 2.5, 1.75, -4.8 + r * 2.4); keys.setMatrixAt(n++, m4); }
      keys.castShadow = keys.receiveShadow = true; g.add(keys);
      B(13, 0.7, 2, mat.key, 0, 1.75, 4.8, g); [-14.5, -12, -9.5, 9.5, 12, 14.5].forEach((x) => B(2.1, 0.7, 2, mat.key, x, 1.75, 4.8, g)); break; }
    case "ms": {
      const body = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat.plastic); body.scale.set(3.1, 1.7, 5.2); body.position.y = 1.0; body.castShadow = body.receiveShadow = true; g.add(body);
      B(0.12, 0.2, 3.4, mat.black, 0, 2.6, -2.3, g); B(5.6, 0.2, 0.12, mat.black, 0, 2.55, -0.6, g); Cy(0.4, 0.5, mat.metal, 0, 2.65, -1.5, g, "x", 12); break; }
  }
  return g;
}
function makeCable(id) {
  const cb = CAB[id], p = byId[id], g = new THREE.Group(); g.userData.partId = id;
  const t = tube(cb.pts, cb.r, mat[cb.color]); g.add(t); g.userData.tube = t;
  const plug = B(...p.s, mat.black, ...p.c, g);
  if (id !== "sata") B(p.s[0] * 0.9, p.s[1] * 0.9, 0.25, mat.plastic, p.c[0], p.c[1], p.c[2] + p.s[2] / 2 + 0.12, g);
  g.userData.plug = plug; return g;
}
function makeWire(id) {
  const cb = PCAB[id], g = new THREE.Group(); const t = tube(cb.pts, cb.r, mat.cable); g.add(t); g.userData.tube = t;
  const e = cb.pts[cb.pts.length - 1], plug = B(...cb.plug, mat.black, e[0] - cb.plug[0] / 2, e[1], e[2], g); g.userData.plug = plug; return g;
}

/* ================= Thùng máy ================= */
const W2 = 21.84, H = 37.44, D2 = 10;
const caseG = new THREE.Group(); scene.add(caseG);
let slotCovers = [];
function panel(holesFn, xPos) { const sh = new THREE.Shape(); sh.moveTo(-D2, 0); sh.lineTo(D2, 0); sh.lineTo(D2, H); sh.lineTo(-D2, H); sh.closePath(); holesFn(sh);
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.16, bevelEnabled: false, curveSegments: 20 }); g.rotateY(Math.PI / 2);
  const m = new THREE.Mesh(g, mat.case); m.position.x = xPos; m.castShadow = m.receiveShadow = true; caseG.add(m); return m; }
(function buildCase() {
  const c = caseG;
  B(2 * W2, 0.16, 2 * D2, mat.case, 0, -0.08, 0, c); B(2 * W2, 0.16, 2 * D2, mat.case, 0, H + 0.08, 0, c);
  B(2 * W2, H, 0.16, mat.caseIn, 0, H / 2, -D2 - 0.08, c);
  // Mặt sau: tấm thép đục lỗ thật (ô I/O, 5 khe mở rộng, cửa bộ nguồn, lưới tổ ong cho quạt xả)
  panel((sh) => { rectHole(sh, -9.2, -4.8, 19.2, 35.1); rectHole(sh, -6.6, 6.6, 0.9, 8.9);
    [18.2, 16.2, 14.2, 12.2, 10.2].forEach((y) => rectHole(sh, -8.4, 1.6, y - 0.7, y + 0.7));
    for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) { const z = 3.6 + (i + (j & 1) * 0.5) * 1.05, y = 30 + j * 0.91; if (Math.hypot(z - 3.6, y - 30) < 5.2) circHole(sh, z, y, 0.4); }
    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([a, b]) => circHole(sh, 3.6 + a * 5.25, 30 + b * 5.25, 0.22)); }, -W2 - 0.16);
  // Mặt trước: 2 lỗ tròn cho quạt hút
  panel((sh) => { circHole(sh, 0, 27, 5.6); circHole(sh, 0, 14.5, 5.6); }, W2);
  B(2 * W2, 0.5, 0.5, mat.case, 0, 0.25, D2 - 0.25, c); B(2 * W2, 0.5, 0.5, mat.case, 0, H - 0.25, D2 - 0.25, c); B(0.5, H, 0.5, mat.case, -W2 + 0.25, H / 2, D2 - 0.25, c); B(0.5, H, 0.5, mat.case, W2 - 0.25, H / 2, D2 - 0.25, c);
  const bez = new THREE.Mesh(new THREE.BoxGeometry(1.8, H + 0.8, 2 * D2 + 0.4), [bezelFace, mat.bezel, mat.bezel, mat.bezel, mat.bezel, mat.bezel]); bez.position.set(W2 + 1.06, H / 2, 0); bez.castShadow = bez.receiveShadow = true; c.add(bez);
  const fx = W2 + 1.96;
  Cy(1.0, 0.35, pwrMat, fx + 0.05, H - 2.6, 5, c, "x");
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.12, 8, 32), pwrMat); ring.rotation.y = Math.PI / 2; ring.position.set(fx + 0.06, H - 2.6, 5); c.add(ring);
  B(0.15, 0.5, 1.3, mat.black, fx, H - 2.6, 2.0, c); B(0.15, 0.5, 1.3, mat.black, fx, H - 2.6, 0.2, c); Cy(0.25, 0.1, mat.black, fx, H - 2.6, -1.8, c, "x", 12); Cy(0.25, 0.1, mat.black, fx, H - 2.6, -2.8, c, "x", 12);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), ledMat); led.position.set(fx, H - 2.6, 7.6); c.add(led);
  [[-17, -8], [-17, 8], [17, -8], [17, 8]].forEach(([x, z]) => B(4, 1.1, 2, mat.black, x, -0.71, z, c));
  slotCovers = [18.2, 16.2, 14.2, 12.2, 10.2].map((y) => { const g = new THREE.Group(); B(0.06, 1.6, 11, mat.metal, -W2 - 0.2, y, -3.4, g); Cy(0.18, 0.2, mat.metal, -W2 - 0.26, y, 2.4, g, "x", 10); c.add(g); return g; });
  const rf = makeFan(12, { reg: true }); rf.rotation.y = Math.PI / 2; rf.position.set(-20.4, 30, 3.6); c.add(rf);
  [27, 14.5].forEach((y) => { const f = makeFan(12, { reg: true }); f.rotation.y = Math.PI / 2; f.position.set(20.3, y, 0); c.add(f); });
  [8.6, 19.0].forEach((x) => [-7.6, 7.6].forEach((z) => B(0.3, 15.2, 0.3, mat.metal, x, 7.8, z, c)));
  [0.4, 15.4].forEach((y) => [-7.6, 7.6].forEach((z) => B(10.7, 0.3, 0.3, mat.metal, 13.8, y, z, c))); B(10.7, 0.15, 15.2, mat.metal, 13.8, 10.22, 0, c);
  B(14, 0.05, 12, mat.black, -14.1, 0.03, 0, c);
  B(3.4, 3.8, 0.12, mat.alu, 17.9, 33.2, -9.92, c);
  [[-17, 33.5], [-1, 33.5], [-17, 11], [-1, 11], [-9, 22], [1, 22]].forEach(([x, y]) => Cy(0.3, 0.6, mat.gold, x, y, -9.68, c, "z", 10));
})();
// Mặt bàn: tấm thảm chống tĩnh điện rộng, có thêm chỗ cho màn hình, bàn phím, chuột
const matTex = ctex(1760, 880, () => {}); const deskMat = new THREE.MeshStandardMaterial({ map: matTex, roughness: 0.92, metalness: 0 });
function paintMat() { const cs = getComputedStyle(document.documentElement), a = cs.getPropertyValue("--mat").trim() || "#25494c", b = cs.getPropertyValue("--mat-line").trim() || "#2f5a5e";
  const cv = matTex.image, x = cv.getContext("2d"); x.fillStyle = a; x.fillRect(0, 0, cv.width, cv.height); x.strokeStyle = b; x.lineWidth = 2;
  for (let i = 0; i <= cv.width; i += 24) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, cv.height); x.stroke(); } for (let j = 0; j <= cv.height; j += 24) { x.beginPath(); x.moveTo(0, j); x.lineTo(cv.width, j); x.stroke(); }
  matTex.needsUpdate = true; }
paintMat();
const desk = new THREE.Mesh(new THREE.PlaneGeometry(220, 110), deskMat); desk.rotation.x = -Math.PI / 2; desk.position.set(-30, -1.27, 10); desk.receiveShadow = true; scene.add(desk);

/* ================= Vùng lắp (proxy) & khung gợi ý ================= */
const ACC = 0xf0a81c, ERR = 0xe5553b;
const proxies = {};
PARTS.forEach((p) => { const s = p.s.map((v) => Math.max(v + 1.2, 2.4)); const m = new THREE.Mesh(new THREE.BoxGeometry(...s), new THREE.MeshBasicMaterial()); m.visible = false; m.position.set(...p.c); m.userData.id = p.id; scene.add(m); proxies[p.id] = m; });
const unitBox = new THREE.BoxGeometry(1, 1, 1), unitEdges = new THREE.EdgesGeometry(unitBox);
const hl = new THREE.Mesh(unitBox, new THREE.MeshBasicMaterial({ color: ACC, transparent: true, opacity: 0.15, depthWrite: false }));
const hlE = new THREE.LineSegments(unitEdges, new THREE.LineBasicMaterial({ color: ACC, transparent: true, depthTest: false })); hlE.renderOrder = 10;
const hovE = new THREE.LineSegments(unitEdges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthTest: false })); hovE.renderOrder = 11;
const kbE = new THREE.LineSegments(unitEdges, new THREE.LineBasicMaterial({ color: 0x7fd3ff, depthTest: false })); kbE.renderOrder = 12;
const infoBox = new THREE.Box3Helper(new THREE.Box3(), ACC); infoBox.material.depthTest = false; infoBox.renderOrder = 12;
[hl, hlE, hovE, kbE, infoBox].forEach((o) => { o.visible = false; scene.add(o); });
function fitBox(o, p, pad = 0.5) { o.position.set(...p.c); o.scale.set(p.s[0] + pad, p.s[1] + pad, p.s[2] + pad); }

/* ================= Hạt: tia lửa & luồng gió ================= */
const dotTex = ctex(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.4, "rgba(255,255,255,.6)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
function pointsPool(n, size) { const pos = new Float32Array(n * 3).fill(-999), col = new Float32Array(n * 3); const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  pts.frustumCulled = false; scene.add(pts); return { pts, pos, col, n, items: new Array(n).fill(null) }; }
const SP = pointsPool(260, 0.55), AIR = pointsPool(220, 0.7);
const cCold = new THREE.Color(0x47aef5), cHot = new THREE.Color(0xff6a3d), cSpark = new THREE.Color(ACC), tmpC = new THREE.Color();
function sparkBurst(at, count = 26) { if (reduce) return; for (let k = 0; k < count; k++) { const i = SP.items.findIndex((v) => !v); if (i < 0) return;
  const a = Math.random() * Math.PI * 2, e = Math.random() * 1.2 - 0.2, v = 0.08 + Math.random() * 0.16;
  SP.items[i] = { p: at.clone(), v: new Vector3(Math.cos(a) * Math.cos(e) * v, Math.sin(e) * v + 0.06, Math.sin(a) * Math.cos(e) * v + 0.05), life: 0, max: 450 + Math.random() * 350 }; } }
function spawnAir() { const i = AIR.items.findIndex((v) => !v); if (i < 0) return; const r = Math.random;
  if (r() < 0.22) { const z = r() * 10 - 5, x0 = -14 + r() * 10 - 5; AIR.items[i] = { kind: 1, a: new Vector3(x0, -0.9, z), b: new Vector3(-14, 7, z), c: new Vector3(-22.6, 4.9 + r() * 5 - 2.5, z * 0.8), t: 0, dur: 2000 + r() * 700 }; }
  else { AIR.items[i] = { kind: 0, a: new Vector3(21.2, 8 + r() * 25, r() * 10 - 5), c: new Vector3(-22.8, 30 + r() * 8 - 4, 3.6 + r() * 8 - 4), t: 0, dur: 2600 + r() * 1000, ph: r() * 6 }; } }

/* ================= Camera quay quanh ================= */
const HOME = { theta: 0.42, phi: 1.2, r: 165, t: [-22, 17.5, 4] };
const orb = { theta: HOME.theta, phi: HOME.phi, r: HOME.r, target: new Vector3(...HOME.t) };
const VIEWS = {
  home: HOME,
  side: { theta: 0, phi: 1.36, r: 98, t: [0, 17.5, 0] },
  front: { theta: Math.PI / 2, phi: 1.36, r: 98, t: [0, 17.5, 0] },
  rear: { theta: -Math.PI / 2 - 0.55, phi: 1.3, r: 80, t: [-20, 17.5, -3] },
  top: { theta: 0.15, phi: 0.22, r: 165, t: [-22, 10, 6] },
};
let shakeT = 0;
// Dịch tâm nhìn theo mặt phẳng màn hình (kéo chuột phải, Shift + kéo, hoặc hai ngón tay), giới hạn trong khu vực bàn
function panBy(dx, dy) {
  const k = 2 * orb.r * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / Math.max(1, view.clientHeight);
  const right = new Vector3().setFromMatrixColumn(camera.matrix, 0), up = new Vector3().setFromMatrixColumn(camera.matrix, 1);
  orb.target.addScaledVector(right, -dx * k).addScaledVector(up, dy * k);
  orb.target.set(THREE.MathUtils.clamp(orb.target.x, -85, 55), THREE.MathUtils.clamp(orb.target.y, -5, 60), THREE.MathUtils.clamp(orb.target.z, -40, 45));
}
function placeCamera() { const { theta, phi, r, target } = orb; camera.position.set(target.x + r * Math.sin(phi) * Math.sin(theta), target.y + r * Math.cos(phi), target.z + r * Math.sin(phi) * Math.cos(theta));
  if (shakeT > 0) { const k = shakeT / 320; camera.position.x += Math.sin(shakeT * 0.11) * 0.5 * k; camera.position.y += Math.cos(shakeT * 0.13) * 0.3 * k; }
  camera.lookAt(target); }
function goView(name) { const v = name === "center" ? { theta: orb.theta, phi: orb.phi, r: Math.min(orb.r, 105), t: [0, 17.5, 0] } : VIEWS[name]; let d = v.theta - orb.theta; d = Math.atan2(Math.sin(d), Math.cos(d));
  const f = { theta: orb.theta, phi: orb.phi, r: orb.r, t: orb.target.clone() }, to = { theta: orb.theta + d, phi: v.phi, r: v.r, t: new Vector3(...v.t) };
  anim(reduce ? 1 : 650, eInOut, (e) => { orb.theta = f.theta + (to.theta - f.theta) * e; orb.phi = f.phi + (to.phi - f.phi) * e; orb.r = f.r + (to.r - f.r) * e; orb.target.lerpVectors(f.t, to.t, e); }); }
document.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => goView(b.dataset.view)));

/* ================= Hoạt hình ================= */
const eOut = (k) => 1 - Math.pow(1 - k, 3), eIn = (k) => k * k * k, eInOut = (k) => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2, eBack = (k) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
let anims = [];
function anim(dur, ease, fn, done) { anims.push({ t: 0, dur: Math.max(1, dur), ease, fn, done }); }
function flash(p, color, op = 0.5) { const m = new THREE.Mesh(unitBox, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false })); fitBox(m, p, 0.7); scene.add(m);
  anim(reduce ? 150 : 460, eOut, (e) => m.material.opacity = op * (1 - e), () => { scene.remove(m); m.material.dispose(); }); }
function xMark(cx, cy) { const r = stageEl.getBoundingClientRect(), d = document.createElement("div"); d.className = "xmark"; d.textContent = "✕";
  d.style.left = (cx - r.left) + "px"; d.style.top = (cy - r.top) + "px"; stageEl.appendChild(d); setTimeout(() => d.remove(), 600); }
function disposeTree(o) { o.traverse((n) => { if (n.geometry && n.geometry !== unitBox) n.geometry.dispose(); }); }
const isLive = (o) => { while (o.parent) o = o.parent; return o === scene; };

const partsRoot = new THREE.Group(); scene.add(partsRoot);
let nodes = {};
// Cáp mọc dần theo đường đi rồi đầu cắm bật vào cổng
function growWire(wire, at, box) {
  const t = wire.userData.tube, plug = wire.userData.plug, total = t.geometry.index.count;
  if (reduce) return;
  t.geometry.setDrawRange(0, 0); plug.visible = false;
  anim(700, eInOut, (e) => t.geometry.setDrawRange(0, Math.floor(total * e / 3) * 3), () => { t.geometry.setDrawRange(0, Infinity); plug.visible = true;
    plug.scale.setScalar(0.2); anim(220, eBack, (e) => plug.scale.setScalar(0.2 + 0.8 * e)); sparkBurst(at); if (box) flash(box, ACC); });
}
function addNode(id, animOpt) {
  if (CAB[id]) { const g = makeCable(id); partsRoot.add(g); nodes[id] = g; const t = g.userData.tube, plug = g.userData.plug, total = t.geometry.index.count;
    if (animOpt && !reduce) { t.geometry.setDrawRange(0, 0); g.children.forEach((ch) => { if (ch !== t) ch.visible = false; });
      anim(700, eInOut, (e) => t.geometry.setDrawRange(0, Math.floor(total * e / 3) * 3), () => { t.geometry.setDrawRange(0, Infinity); g.children.forEach((ch) => ch.visible = true);
        plug.scale.setScalar(0.2); anim(220, eBack, (e) => plug.scale.setScalar(0.2 + 0.8 * e)); sparkBurst(new Vector3(...byId[id].c)); flash(byId[id], ACC); }); }
    return; }
  const p = byId[id], T = new Vector3(...(p.at || p.c)), dev = makeModel(id, true);
  let root = dev, wire = null;
  if (p.periph) { root = new THREE.Group(); root.userData.partId = id; root.userData.dev = dev; root.add(dev); wire = makeWire(id); root.add(wire); if (animOpt && !reduce) { wire.userData.tube.geometry.setDrawRange(0, 0); wire.userData.plug.visible = false; } }
  partsRoot.add(root); nodes[id] = root;
  const fxBox = p.periph ? { c: [T.x, T.y + p.fx[1] / 2, T.z], s: p.fx } : p;
  const end = wire ? new Vector3(...PCAB[id].pts[PCAB[id].pts.length - 1]) : null;
  const land = () => { if (wire) { wire.userData.tube.geometry.setDrawRange(0, Infinity); wire.userData.plug.visible = true; growWire(wire, end, null); } };
  if (animOpt && !reduce) {
    const start = animOpt.from ? animOpt.from.clone() : T.clone().add(new Vector3(0, 2, 20)), pre = T.clone().add(p.periph ? new Vector3(0, 6, 0) : new Vector3(0, 0, id === "io" ? 0 : 4.5));
    if (id === "io") pre.x += 4;
    dev.position.copy(start); dev.scale.setScalar(animOpt.from ? 1.04 : 1);
    anim(340, eOut, (e) => { dev.position.lerpVectors(start, pre, e); dev.scale.setScalar((animOpt.from ? 1.04 : 1) + ((1 - (animOpt.from ? 1.04 : 1)) * e)); }, () => {
      anim(170, eIn, (e) => dev.position.lerpVectors(pre, T, e), () => { dev.position.copy(T);
        const front = p.periph ? new Vector3(T.x, T.y + 2, T.z) : T.clone().add(new Vector3(0, 0, p.s[2] / 2 + 0.2)); if (id === "io") front.set(T.x + 0.3, T.y, T.z);
        sparkBurst(front); flash(fxBox, ACC); anim(200, eBack, (e) => dev.scale.setScalar(0.97 + 0.03 * e)); land(); }); });
  } else dev.position.copy(T);
}
function ghost(id, at) { if (reduce || CAB[id] || id === "esd") return; const g = makeModel(id, false); g.position.copy(at); scene.add(g);
  const s = at.clone(); anim(420, eOut, (e) => { g.position.set(s.x, s.y - 3 * e, s.z); g.scale.setScalar(1 - 0.4 * e); g.rotation.z = -0.25 * e; }, () => { scene.remove(g); disposeTree(g); }); }
function syncParts(animId, animOpt) {
  const v = viewSet();
  for (const id in nodes) if (!v.has(id)) { partsRoot.remove(nodes[id]); disposeTree(nodes[id]); delete nodes[id]; }
  fans = fans.filter((r) => isLive(r)); screens = screens.filter((s) => isLive(s));
  Z.forEach((id) => { if (v.has(id) && !nodes[id]) addNode(id, id === animId ? animOpt : null); });
  slotCovers.forEach((g, i) => g.visible = !(v.has("gpu") && i < 3));
}

/* ================= Trạng thái & luật ================= */
const S = { mode: "learn", installed: new Set(), mistakes: 0, wrongStreak: 0, helped: 0, selected: null, start: null, timer: null, infoId: null };
let powered = false, powerT = 0, fanSpeed = 0, hoverSlot = null, hoverPart = null, kbId = null;
const nextPart = () => PARTS.find((p) => !S.installed.has(p.id) && p.needs.every((n) => S.installed.has(n)));
const viewSet = () => S.mode === "explore" ? new Set(Z) : S.installed;
const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const elapsed = () => S.start ? Math.floor((Date.now() - S.start) / 1000) : 0;
const lc = (n) => /^.[A-ZĐ]/.test(n) ? n : n.charAt(0).toLowerCase() + n.slice(1); // i18n-ok
const vol = (p) => p.s[0] * p.s[1] * p.s[2];

const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function setRay(cx, cy) { const r = view.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera);
  return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom; }
function slotHits(cx, cy) { const inside = setRay(cx, cy); if (!inside) return null;
  const list = PARTS.filter((p) => !S.installed.has(p.id)).map((p) => proxies[p.id]); const hits = ray.intersectObjects(list, false);
  const ids = [...new Set(hits.map((h) => h.object.userData.id))];
  let point = hits[0] ? hits[0].point.clone() : null;
  if (!point) { const dh = ray.intersectObject(desk, false)[0]; point = dh ? dh.point.clone().add(new Vector3(0, 1, 0)) : ray.ray.at(40, new Vector3()); }
  return { ids, point, cx, cy }; }
function partHit(cx, cy) { if (!setRay(cx, cy)) return null; const h = ray.intersectObjects(partsRoot.children, true)[0]; if (!h) return null;
  let o = h.object; while (o && !o.userData.partId) o = o.parent; return o ? byId[o.userData.partId] : null; }
const smallest = (ids) => ids.map((i) => byId[i]).sort((a, b) => vol(a) - vol(b))[0];

function attempt(id, hit, animOpt) {
  const p = byId[id]; if (S.installed.has(id)) return;
  if (!hit.ids.includes(id)) {
    const other = smallest(hit.ids);
    return fail(id, other ? L(`Chỗ này là ${other.slotName}, không phải chỗ lắp ${lc(p.name)}.`, `This is the ${other.slotName}, not where the ${lc(p.name)} goes.`) : L(`Đây không phải vị trí lắp ${lc(p.name)}.`, `This is not where the ${lc(p.name)} goes.`), hit, other, animOpt);
  }
  if (id !== "esd" && !p.periph && !S.installed.has("esd")) return fail(id, L("Hãy đeo vòng chống tĩnh điện và kẹp vào khung máy trước khi chạm vào linh kiện.", "Put on the antistatic strap and clip it to the frame before touching any part."), hit, p, animOpt);
  const missing = p.needs.filter((n) => !S.installed.has(n));
  if (missing.length) return fail(id, L(`Chưa lắp được ${lc(p.name)}: cần lắp ${missing.map((m) => lc(byId[m].name)).join(" và ")} trước.`, `Cannot install the ${lc(p.name)} yet: install the ${missing.map((m) => lc(byId[m].name)).join(" and the ")} first.`) + (S.mode === "learn" ? " " + p.why : ""), hit, p, animOpt);
  install(id, L(`Đã lắp ${lc(p.name)}.`, `Installed the ${lc(p.name)}.`), animOpt);
}
function install(id, msg, animOpt) {
  S.installed.add(id); S.wrongStreak = 0; S.selected = null; say(msg, "ok"); G.sound.play("pop"); renderAll(id, animOpt || {});
  if (S.installed.size === PARTS.length) setTimeout(finish, reduce ? 0 : 900);
}
function fail(id, msg, hit, slotPart, animOpt) {
  S.mistakes++; S.wrongStreak++; G.sound.play("bad");
  if (slotPart && !S.installed.has(slotPart.id) && !slotPart.periph) flash(slotPart, ERR, 0.4);
  if (hit.cx != null) xMark(hit.cx, hit.cy); if (!reduce) shakeT = 320;
  if (animOpt && animOpt.from) ghost(id, hit.point);
  if (S.mode === "learn" && S.wrongStreak >= 3) { const n = nextPart();
    if (n) { S.helped++; install(n.id, L(`Sai 3 lần liên tiếp nên mình lắp giúp bước này: ${lc(n.name)}. ${n.step}`, `Three wrong tries in a row, so I installed this step for you: ${lc(n.name)}. ${n.step}`), {}); statusEl.className = "info"; return; } }
  say(msg, "err"); drawGuide();
}
function finish() {
  clearInterval(S.timer); const t = fmtTime(elapsed()), score = Math.max(0, 100 - S.mistakes * 4);
  if (S.mode === "test") G.progress.record(GAME_ID, 0, score, 1);
  G.sound.play("win");
  donePanel.innerHTML = S.mode === "test"
    ? `<div class="eyebrow">${L("Hoàn thành bài kiểm tra", "Test complete")}</div><h2>${L(`${score} điểm`, `${score} points`)}</h2><p>${L(`Thời gian ${t} · ${S.mistakes} lần lắp sai`, `Time ${t} · ${S.mistakes} wrong installs`)}</p><div class="row"><button class="pbtn primary" type="button" data-act="power">${L("Bật nguồn", "Power on")}</button><button class="pbtn" type="button" data-act="again">${L("Làm lại", "Try again")}</button></div>`
    : `<div class="eyebrow">${L("Hoàn thành", "Complete")}</div><h2>${L("Máy sẵn sàng bật nguồn", "Ready to power on")}</h2><p>${L(`${S.mistakes} lần sai`, `${S.mistakes} mistakes`)}${S.helped ? L(`, được lắp giúp ${S.helped} bước`, `, ${S.helped} steps installed for you`) : ""}.</p><div class="row"><button class="pbtn primary" type="button" data-act="power">${L("Bật nguồn", "Power on")}</button><button class="pbtn" type="button" data-act="test">${L("Làm bài kiểm tra", "Take the test")}</button></div>`;
  // Quy trình lắp chuẩn: đúng thứ tự của chế độ Học, kèm vị trí để ôn lại sau khi hoàn thành
  const steps = PARTS.map((p) => `<li><b>${p.name}</b><span>${p.slotName}</span></li>`).join("") + `<li><b>${L("Bật nguồn", "Power on")}</b><span>${L("POST, quạt quay, màn hình hiện Hello IT", "POST, fans spin, the monitor shows Hello IT")}</span></li>`;
  donePanel.insertAdjacentHTML("beforeend", `<details class="recap"><summary>${L("Xem quy trình lắp chuẩn", "See the standard build order")}</summary><ol>${steps}</ol></details>`);
  donePanel.hidden = false; donePanel.querySelector('[data-act="power"]').focus();
}
function beep() { try { const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain();
  o.type = "square"; o.frequency.value = 880; g.gain.value = 0.04; o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 0.18); setTimeout(() => a.close(), 500); } catch (e) { /* bỏ qua */ } }
function powerOn(withBeep) { powered = true; powerT = time; if (withBeep) beep(); drawGuide();
  say(L("Đã bật nguồn. POST thành công với một tiếng bíp ngắn, các quạt bắt đầu quay và màn hình hiện Hello IT. Khí mát vào ở mặt trước, khí nóng ra ở quạt xả sau và qua bộ nguồn.", "Powered on. POST succeeds with one short beep, the fans start spinning and the monitor shows Hello IT. Cool air comes in at the front, hot air leaves through the rear exhaust fan and the PSU."), "ok"); }
donePanel.addEventListener("click", (e) => { const a = e.target.closest("[data-act]"); if (!a) return;
  if (a.dataset.act === "power") { donePanel.hidden = true; powerOn(true); } else if (a.dataset.act === "again") setMode(S.mode); else setMode(a.dataset.act); });

/* ================= Khay linh kiện & thẻ hướng dẫn ================= */
const ICON = {};
function buildIcons() {
  const IW = 200, IH = 140, pr = renderer.getPixelRatio(), cv = document.createElement("canvas"); cv.width = IW * pr; cv.height = IH * pr; const cx = cv.getContext("2d");
  const isc = new THREE.Scene(); isc.environment = envTex; isc.add(new THREE.HemisphereLight(0xffffff, 0x667777, 1.6)); const dl = new THREE.DirectionalLight(0xffffff, 3.4); dl.position.set(20, 30, 40); isc.add(dl);
  const cam = new THREE.PerspectiveCamera(26, IW / IH, 0.1, 500), dir = new Vector3(0.38, 0.32, 1).normalize();
  const size = new THREE.Vector2(); renderer.getSize(size); if (size.x < IW || size.y < IH) renderer.setSize(Math.max(size.x, IW), Math.max(size.y, IH), false);
  renderer.setScissorTest(true); renderer.setViewport(0, 0, IW, IH); renderer.setScissor(0, 0, IW, IH);
  PARTS.forEach((p) => {
    let m;
    if (CAB[p.id]) { m = new THREE.Group(); const pts = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 3.2; pts.push([Math.cos(a) * 3, i * 0.12, Math.sin(a) * 3]); }
      m.add(tube(pts, CAB[p.id].r * 1.4, mat[CAB[p.id].color], 90)); B(p.s[0] * 1.6, p.s[1] * 1.6, p.s[2] * 1.6, mat.black, pts[40][0] + 1.5, pts[40][1] + 1, pts[40][2], m); }
    else if (p.id === "esd") { m = new THREE.Group(); const band = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.55, 12, 40), mat.band); band.rotation.x = 1.2; m.add(band);
      m.add(tube([[2.6, 0, 0], [4.5, 1.2, 0.5], [6, -0.8, 0], [7.6, 0.4, 0]], 0.22, mat.strap, 40)); B(1.4, 0.7, 0.9, mat.gold, 8.2, 0.4, 0, m); }
    else { m = makeModel(p.id, false); m.position.set(0, 0, 0); }
    isc.add(m); const sph = new THREE.Box3().setFromObject(m).getBoundingSphere(new THREE.Sphere());
    cam.position.copy(sph.center).addScaledVector(dir, sph.radius / Math.sin(THREE.MathUtils.degToRad(13)) * 1.02); cam.near = sph.radius * 0.2; cam.far = sph.radius * 10; cam.lookAt(sph.center); cam.updateProjectionMatrix();
    renderer.setClearColor(0, 0); renderer.clear(); renderer.render(isc, cam);
    cx.clearRect(0, 0, cv.width, cv.height); cx.drawImage(view, 0, view.height - IH * pr, IW * pr, IH * pr, 0, 0, cv.width, cv.height);
    try { ICON[p.id] = cv.toDataURL(); } catch (e) { ICON[p.id] = ""; }
    isc.remove(m); disposeTree(m);
  });
  renderer.setScissorTest(false); resize();
}
function drawTray() {
  tray.innerHTML = "";
  PARTS.forEach((p) => { const b = document.createElement("button"); b.type = "button"; b.className = "part"; b.dataset.id = p.id;
    const done = S.mode !== "explore" && S.installed.has(p.id); if (done) { b.classList.add("done"); b.setAttribute("aria-disabled", "true"); }
    b.setAttribute("aria-pressed", String(S.selected === p.id || (S.mode === "explore" && S.infoId === p.id)));
    b.innerHTML = `<img alt="" src="${ICON[p.id] || ""}"><span class="nm">${p.name}</span>`; tray.appendChild(b); });
}
function drawGuide() {
  const n = PARTS.length, k = S.installed.size;
  document.getElementById("barFill").style.width = (S.mode === "explore" ? 100 : k / n * 100) + "%";
  document.getElementById("progTxt").textContent = S.mode === "explore" ? `${n}/${n}` : `${k}/${n}`;
  if (S.mode === "learn") { const p = nextPart();
    guide.innerHTML = p ? `<div class="eyebrow">${L(`Bước ${k + 1} / ${n} · Chế độ học`, `Step ${k + 1} / ${n} · Learn mode`)}</div><h2>${p.name}</h2><p>${p.step}</p><p class="tip">${p.why}</p>`
      : powered ? `<div class="eyebrow">${L("Đang chạy", "Running")}</div><h2>${L("Máy đã khởi động", "The PC has booted")}</h2><p>${L("Màn hình hiện Hello IT. Các quạt đang quay. Hạt xanh là khí mát đi vào từ mặt trước, đổi sang cam khi nóng lên và thoát ra ở quạt xả sau và bộ nguồn. Xoay thùng máy để xem từ nhiều góc.", "The monitor shows Hello IT. The fans are spinning. Blue particles are cool air entering at the front, turning orange as it heats up and leaving through the rear exhaust fan and the PSU. Rotate the case to look from other angles.")}</p>`
      : `<div class="eyebrow">${L("Hoàn tất", "Complete")}</div><h2>${L("Máy đã lắp xong", "The PC is built")}</h2><p>${L("Bấm nút bật nguồn để chạy thử.", "Press the power button to test it.")}</p>`; }
  else if (S.mode === "test") {
    guide.innerHTML = `<div class="eyebrow">${L("Chế độ kiểm tra", "Test mode")}</div><h2>${L("Tự lắp hoàn chỉnh máy", "Build the whole PC yourself")}</h2><p>${L("Không có gợi ý vị trí. Mỗi lần lắp sai bị trừ 4 điểm. Có thể xoay thùng máy để nhìn rõ hơn.", "No slot hints. Every wrong install costs 4 points. You can rotate the case to see better.")}</p>
      <div class="stats"><div><b id="tTime">${fmtTime(elapsed())}</b><span>${L("thời gian", "time")}</span></div><div><b>${S.mistakes}</b><span>${L("lần sai", "mistakes")}</span></div><div><b>${Math.max(0, 100 - S.mistakes * 4)}</b><span>${L("điểm", "score")}</span></div></div>`; }
  else { const p = S.infoId && byId[S.infoId];
    guide.innerHTML = p ? `<div class="eyebrow">${L("Khám phá", "Explore")}</div><h2>${p.name}</h2><p class="spec">${p.spec}</p><p>${p.role}</p><p class="tip">${L("Vị trí", "Location")}: ${p.slotName}. ${p.why}</p>`
      : `<div class="eyebrow">${L("Chế độ khám phá", "Explore mode")}</div><h2>${L("Máy đang chạy", "The PC is running")}</h2><p>${L("Chạm vào một linh kiện trong thùng máy hoặc trên thảm để xem thông số. Hạt xanh chuyển sang cam là khí mát đi vào và khí nóng đi ra.", "Tap a part in the case or on the mat to read its specs. Blue particles turning orange are cool air coming in and hot air going out.")}</p>`; }
  document.getElementById("matHint").textContent = S.mode === "explore" ? L("Chạm để xem thông tin", "Tap to see details") : L("Kéo linh kiện vào thùng máy, hoặc chạm để chọn rồi chạm vị trí lắp", "Drag a part into the case, or tap to select and then tap the slot");
}
function say(msg, kind) { statusEl.textContent = msg; statusEl.className = kind || ""; }
function renderAll(animId, animOpt) { syncParts(animId, animOpt); drawTray(); drawGuide(); }
function setMode(m) {
  S.mode = m; S.installed = new Set(); S.mistakes = 0; S.wrongStreak = 0; S.helped = 0; S.selected = null; S.infoId = null; S.start = null; kbId = null;
  clearInterval(S.timer); donePanel.hidden = true; powered = m === "explore"; powerT = time;
  if (m === "test") { S.start = Date.now(); S.timer = setInterval(() => { const el = document.getElementById("tTime"); if (el) el.textContent = fmtTime(elapsed()); }, 1000); }
  document.querySelectorAll(".pcasm .seg button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === m)));
  renderAll();
  say(m === "learn" ? L("Bắt đầu từ bước 1. Vị trí cần lắp được đánh dấu bằng khối vàng nhấp nháy.", "Start at step 1. The slot to fill is marked with a pulsing yellow block.") : m === "test" ? L("Đã bắt đầu tính giờ.", "The clock is running.") : "", m === "explore" ? "" : "info");
}
document.querySelectorAll(".pcasm .seg button").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
document.getElementById("resetBtn").addEventListener("click", () => setMode(S.mode));

/* ================= Kéo thả từ thảm ================= */
let drag = null, suppressClick = false;
tray.addEventListener("pointerdown", (e) => { const b = e.target.closest(".part"); if (!b || S.mode === "explore" || S.installed.has(b.dataset.id)) return;
  drag = { id: b.dataset.id, sx: e.clientX, sy: e.clientY, on: false, pid: e.pointerId }; b.setPointerCapture(e.pointerId); });
tray.addEventListener("pointermove", (e) => { if (!drag || e.pointerId !== drag.pid) return;
  if (!drag.on && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) { drag.on = true; const gh = document.createElement("div"); gh.className = "ghost"; gh.innerHTML = `<img alt="" src="${ICON[drag.id]}">`; document.body.appendChild(gh); drag.ghost = gh;
    S.selected = null; tray.querySelectorAll(".part").forEach((x) => x.setAttribute("aria-pressed", "false")); }
  if (drag.on) { drag.ghost.style.transform = `translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%)`; const h = slotHits(e.clientX, e.clientY); hoverSlot = h && h.ids.length ? byId[h.ids.includes(drag.id) ? drag.id : smallest(h.ids).id] : null; } });
function endDrag(e, cancel) { if (!drag || e.pointerId !== drag.pid) return; const d = drag; drag = null; if (!d.on) return; d.ghost.remove(); suppressClick = true; hoverSlot = null;
  if (cancel) return; const h = slotHits(e.clientX, e.clientY); if (h) attempt(d.id, h, { from: h.point }); else say(L("Thả linh kiện vào trong thùng máy.", "Drop the part inside the case."), "info"); }
tray.addEventListener("pointerup", (e) => endDrag(e, false));
tray.addEventListener("pointercancel", (e) => endDrag(e, true));
tray.addEventListener("click", (e) => { const b = e.target.closest(".part"); if (!b) return; if (suppressClick) { suppressClick = false; return; }
  const id = b.dataset.id; if (S.mode === "explore") { S.infoId = id; drawTray(); drawGuide(); return; } if (S.installed.has(id)) return;
  S.selected = S.selected === id ? null : id; tray.querySelectorAll(".part").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.id === S.selected)));
  if (S.selected) say(L(`Đã chọn ${lc(byId[id].name)}. Chạm vào vị trí lắp trong thùng máy (màn hình, bàn phím, chuột: chạm lên mặt bàn).`, `Selected the ${lc(byId[id].name)}. Tap its slot in the case (monitor, keyboard, mouse: tap the desk).`), "info"); });

/* ================= Xoay, phóng to, chạm trên khung máy ================= */
const ptrs = new Map(); let press = null, pinch0 = 0;
view.addEventListener("contextmenu", (e) => e.preventDefault());
view.addEventListener("dblclick", () => goView("center"));
let pinchMid = null;
view.addEventListener("pointerdown", (e) => { view.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 1) press = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, moved: false, pan: e.button === 2 || e.shiftKey };
  else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); pinchMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; if (press) press.moved = true; } });
view.addEventListener("pointermove", (e) => {
  if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    if (pinch0) { orb.r = THREE.MathUtils.clamp(orb.r * pinch0 / d, 40, 200); } if (pinchMid) panBy(mid.x - pinchMid.x, mid.y - pinchMid.y); pinch0 = d; pinchMid = mid; return; }
  if (press && ptrs.size === 1) { const dx = e.clientX - press.lx, dy = e.clientY - press.ly;
    if (!press.moved && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 5) { press.moved = true; view.classList.add("grabbing"); }
    if (press.moved) { if (press.pan) panBy(dx, dy); else { orb.theta -= dx * 0.008; orb.phi = THREE.MathUtils.clamp(orb.phi - dy * 0.006, 0.18, 1.62); } }
    press.lx = e.clientX; press.ly = e.clientY; return; }
  if (S.mode === "explore") { hoverPart = partHit(e.clientX, e.clientY); view.style.cursor = hoverPart ? "pointer" : ""; }
  else if (S.selected) { const h = slotHits(e.clientX, e.clientY); hoverSlot = h && h.ids.length ? byId[h.ids.includes(S.selected) ? S.selected : smallest(h.ids).id] : null; view.style.cursor = "crosshair"; }
  else view.style.cursor = "";
});
function endPtr(e) { if (!ptrs.has(e.pointerId)) return; ptrs.delete(e.pointerId); view.classList.remove("grabbing");
  if (ptrs.size === 0) { const pr = press; press = null; pinch0 = 0; pinchMid = null; if (pr && !pr.moved && e.type === "pointerup") tap(e.clientX, e.clientY); } }
view.addEventListener("pointerup", endPtr); view.addEventListener("pointercancel", endPtr);
view.addEventListener("pointerleave", () => { hoverPart = null; if (!drag) hoverSlot = null; });
view.addEventListener("wheel", (e) => { e.preventDefault(); orb.r = THREE.MathUtils.clamp(orb.r * Math.exp(e.deltaY * 0.0012), 40, 200); }, { passive: false });
function tap(cx, cy) {
  if (S.mode === "explore") { const p = partHit(cx, cy); if (p) { S.infoId = p.id; drawTray(); drawGuide(); } return; }
  const h = slotHits(cx, cy); if (!h) return;
  if (!S.selected) { if (h.ids.length) say(L("Chọn một linh kiện trên thảm trước, rồi chạm vào vị trí này.", "Pick a part on the mat first, then tap this slot."), "info"); return; }
  attempt(S.selected, h, {}); hoverSlot = null;
}
function projectClient(v) { const p = v.clone().project(camera), r = view.getBoundingClientRect(); return [r.left + (p.x + 1) / 2 * r.width, r.top + (1 - p.y) / 2 * r.height]; }
view.addEventListener("keydown", (e) => {
  const list = S.mode === "explore" ? Z.map((id) => byId[id]) : PARTS.filter((p) => !S.installed.has(p.id)); if (!list.length) return;
  if (e.key.startsWith("Arrow")) { e.preventDefault(); const d = (e.key === "ArrowRight" || e.key === "ArrowDown") ? 1 : -1;
    let i = list.findIndex((p) => p.id === kbId); i = i < 0 ? (d > 0 ? 0 : list.length - 1) : ((i + d) % list.length + list.length) % list.length; kbId = list[i].id;
    say(S.mode === "explore" ? list[i].name : L(`Vị trí: ${list[i].slotName}`, `Slot: ${list[i].slotName}`), "info"); }
  else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!kbId) return; const p = byId[kbId];
    if (S.mode === "explore") { S.infoId = kbId; drawTray(); drawGuide(); return; }
    if (!S.selected) { say(L("Chọn một linh kiện trên thảm trước.", "Pick a part on the mat first."), "info"); return; }
    const [cx, cy] = projectClient(new Vector3(...p.c)); attempt(S.selected, { ids: [kbId], point: new Vector3(...p.c), cx, cy }, {}); }
  else if (e.key === "Escape") { S.selected = null; drawTray(); }
});

/* ================= Nhãn HTML gắn vào không gian 3D ================= */
function mkLabel(text, cls) { const d = document.createElement("div"); d.className = "lbl" + (cls ? " " + cls : ""); d.textContent = text; labelsEl.appendChild(d); return d; }
const LBL = [{ el: mkLabel(L("MẶT TRƯỚC", "FRONT")), p: new Vector3(W2 + 1, H + 3.2, 0), show: () => camera.position.x > -12 }, { el: mkLabel(L("MẶT SAU", "BACK")), p: new Vector3(-W2, H + 3.2, 0), show: () => camera.position.x < 12 }];
const slotLbl = mkLabel("", "slot");
function placeLabel(el, v, show = true) { if (!show) { el.hidden = true; return; } const p = v.clone().project(camera);
  if (p.z > 1) { el.hidden = true; return; } el.hidden = false; const w = view.clientWidth, h = view.clientHeight;
  el.style.transform = `translate(${(p.x + 1) / 2 * w}px,${(1 - p.y) / 2 * h}px) translate(-50%,-100%)`; }

/* ================= Vòng lặp ================= */
function resize() { const w = stageEl.clientWidth, h = stageEl.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(stageEl); resize();
let last = performance.now(), time = 0, airClock = 0, lastCursor = null;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(50, now - last); last = now; if (!stageEl.clientWidth) return; // màn hình chơi đang ẩn
  time += dt; const f = dt / 16.67;
  for (let i = anims.length - 1; i >= 0; i--) { const a = anims[i]; a.t += dt; const k = Math.min(1, a.t / a.dur); a.fn(a.ease(k)); if (k >= 1) { anims.splice(i, 1); a.done && a.done(); } }
  // tia lửa
  for (let i = 0; i < SP.n; i++) { const s = SP.items[i]; if (!s) continue; s.life += dt; s.v.y -= 0.004 * f; s.p.addScaledVector(s.v, f); const k = 1 - s.life / s.max;
    if (k <= 0) { SP.items[i] = null; SP.pos[i * 3 + 1] = -999; continue; } SP.pos.set([s.p.x, s.p.y, s.p.z], i * 3); tmpC.copy(cSpark).multiplyScalar(k); SP.col.set([tmpC.r, tmpC.g, tmpC.b], i * 3); }
  SP.pts.geometry.attributes.position.needsUpdate = SP.pts.geometry.attributes.color.needsUpdate = true;
  // quạt & luồng gió
  fanSpeed += ((powered ? 0.32 : 0) - fanSpeed) * Math.min(1, 0.022 * f); fans.forEach((r) => r.rotation.z += fanSpeed * f);
  if (powered && !reduce) { airClock += dt; while (airClock > 45) { airClock -= 45; spawnAir(); } }
  for (let i = 0; i < AIR.n; i++) { const a = AIR.items[i]; if (!a) continue; a.t += dt / a.dur;
    if (a.t >= 1 || !powered) { AIR.items[i] = null; AIR.pos[i * 3 + 1] = -999; continue; } const t = a.t; let x, y, z;
    if (a.kind === 1) { const u = 1 - t; x = u * u * a.a.x + 2 * u * t * a.b.x + t * t * a.c.x; y = u * u * a.a.y + 2 * u * t * a.b.y + t * t * a.c.y; z = u * u * a.a.z + 2 * u * t * a.b.z + t * t * a.c.z; }
    else { const s = t * t * (3 - 2 * t); x = a.a.x + (a.c.x - a.a.x) * t; y = a.a.y + (a.c.y - a.a.y) * s + Math.sin(t * 8 + a.ph) * 0.6; z = a.a.z + (a.c.z - a.a.z) * s + Math.cos(t * 6 + a.ph) * 0.5; }
    AIR.pos.set([x, y, z], i * 3); tmpC.copy(cCold).lerp(cHot, t).multiplyScalar(Math.sin(Math.PI * t) * 0.85); AIR.col.set([tmpC.r, tmpC.g, tmpC.b], i * 3); }
  AIR.pts.geometry.attributes.position.needsUpdate = AIR.pts.geometry.attributes.color.needsUpdate = true;
  pwrMat.emissiveIntensity = powered ? 0.9 + 0.4 * Math.sin(time * 0.004) : 0; ledMat.emissiveIntensity = powered ? 2.2 : 0;
  // màn hình: sau khoảng 0,9 giây kể từ lúc bật nguồn thì hiện Hello IT, con trỏ nhấp nháy
  const scrOn = powered && !!nodes.mon && time - powerT > 900;
  helloMat.opacity += ((scrOn ? 1 : 0) - helloMat.opacity) * Math.min(1, 0.08 * f); monLed.emissiveIntensity = powered && nodes.mon ? 2 : 0;
  if (scrOn) { const cur = Math.floor(time / 500) % 2 === 0; if (cur !== lastCursor) { lastCursor = cur; drawHello(cur); } }
  // khung gợi ý
  const n = S.mode === "learn" ? nextPart() : null;
  if (n) { const k = (Math.sin(time * 0.005) + 1) / 2; fitBox(hl, n, 0.4 + 0.5 * k); fitBox(hlE, n, 0.4 + 0.5 * k); hl.material.opacity = 0.1 + 0.16 * k; hlE.material.opacity = 0.55 + 0.45 * k; hl.visible = hlE.visible = true; }
  else hl.visible = hlE.visible = false;
  if (hoverSlot && !S.installed.has(hoverSlot.id)) { fitBox(hovE, hoverSlot, 0.9); hovE.visible = true; } else hovE.visible = false;
  if (kbId && document.activeElement === view && (S.mode === "explore" || !S.installed.has(kbId))) { fitBox(kbE, byId[kbId], 1.4); kbE.visible = true; } else kbE.visible = false;
  const ip = S.mode === "explore" && (hoverPart || (S.infoId && byId[S.infoId]));
  if (ip && nodes[ip.id]) { infoBox.box.setFromObject(CAB[ip.id] ? nodes[ip.id].userData.plug : (nodes[ip.id].userData.dev || nodes[ip.id])); infoBox.box.expandByScalar(0.3); infoBox.visible = true; } else infoBox.visible = false;
  if (shakeT > 0) shakeT = Math.max(0, shakeT - dt);
  placeCamera();
  LBL.forEach((l) => placeLabel(l.el, l.p, l.show()));
  if (n) { slotLbl.textContent = n.slotName; placeLabel(slotLbl, new Vector3(n.c[0], n.c[1] + n.s[1] / 2 + 1.2, n.c[2] + n.s[2] / 2)); } else slotLbl.hidden = true;
  renderer.render(scene, camera);
}

/* ================= Khởi động ================= */
placeCamera();
buildIcons();
setMode("learn");
requestAnimationFrame((t) => { last = t; frame(t); });
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", paintMat);
new MutationObserver(paintMat).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
hooks.reset = () => setMode(S.mode);
hooks.stop = () => { clearInterval(S.timer); if (drag && drag.ghost) drag.ghost.remove(); drag = null; hoverSlot = null; };
// F5 giữa chừng: vào lại thẳng màn hình chơi
try { const nav = performance.getEntriesByType("navigation")[0]; if (nav && nav.type === "reload" && sessionStorage.getItem(KEY)) enter(); } catch (e) { /* bỏ qua */ }
