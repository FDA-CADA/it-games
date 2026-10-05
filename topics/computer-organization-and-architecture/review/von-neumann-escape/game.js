/* Mật Thất Von Neumann — escape room 5 cửa ôn cả chương Computer Organization. Xem README.md. */
(function () {
  "use strict";
  const { $, L } = G;
  const GAME_ID = "von-neumann-escape";

  /* ================= tiện ích ================= */
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const h2 = (n) => n.toString(16).toUpperCase().padStart(2, "0");
  const h4 = (n) => n.toString(16).toUpperCase().padStart(4, "0");
  const fmtNum = (n) => n.toLocaleString(G.lang === "en" ? "en-US" : "vi-VN");
  function parseDec(s) {
    s = String(s).trim().replace(/\s+/g, "").replace(",", ".");
    return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : null;
  }
  /** Nhận "42", "0042", "0x42", "42h", "(42)16", "42₁₆". */
  function parseHex(s) {
    s = String(s).trim().toUpperCase().replace(/\s+/g, "").replace(/^0X/, "").replace(/₁₆$|^\((.*)\)16$/, "$1").replace(/H$/, "");
    return /^[0-9A-F]+$/.test(s) ? parseInt(s, 16) : null;
  }

  /* ================= bộ lệnh Simple Computer (rút gọn) ================= */
  const ISA = [
    ["0", "HALT", "0 0 0 0", L("Dừng chương trình", "Stop the program")],
    ["1", "LOAD", "1 R M M", "R ← M[MM]"],
    ["2", "STORE", "2 M M R", "M[MM] ← R"],
    ["3", "ADDI", "3 D S T", "R_D ← R_S + R_T"],
    ["A", "INC", "A R 0 0", "R ← R + 1"],
    ["B", "DEC", "B R 0 0", "R ← R − 1"],
    ["D", "JUMP", "D R M M", L("Nếu R0 ≠ R thì PC ← MM", "If R0 ≠ R then PC ← MM")],
  ];
  const KBD = L("  (bàn phím)", "  (keyboard)");
  const SCREEN = L("  (màn hình)", "  (screen)");

  function decode(w) {
    const op = w >> 12, a = (w >> 8) & 15, b = (w >> 4) & 15, c = w & 15, mm = w & 255, md = (w >> 4) & 255;
    switch (op) {
      case 0: return { name: "HALT", text: L("HALT — dừng", "HALT — stop") };
      case 1: return { name: "LOAD", rd: a, ms: mm, text: `LOAD  R${a} ← M${h2(mm)}` + (mm === 0xfe ? KBD : "") };
      case 2: return { name: "STORE", md, rs: c, text: `STORE M${h2(md)} ← R${c}` + (md === 0xff ? SCREEN : "") };
      case 3: return { name: "ADDI", rd: a, s: b, t: c, text: `ADDI  R${a} ← R${b} + R${c}` };
      case 10: return { name: "INC", r: a, text: `INC   R${a} ← R${a} + 1` };
      case 11: return { name: "DEC", r: a, text: `DEC   R${a} ← R${a} − 1` };
      case 13: return { name: "JUMP", r: a, md: mm, text: L(`JUMP  nếu R0 ≠ R${a} thì PC ← ${h2(mm)}`, `JUMP  if R0 ≠ R${a} then PC ← ${h2(mm)}`) };
      default: return { name: "?", text: L(`Opcode ${h2(op).slice(1)} không có trong bộ lệnh`, `Opcode ${h2(op).slice(1)} is not in the instruction set`) };
    }
  }

  /** Đọc văn bản dạng "40: 0012" hoặc từng word hex liên tiếp → [[địa chỉ, giá trị]]. */
  function parseMem(text) {
    const words = [], errs = [];
    let addr = 0;
    String(text).split("\n").forEach((line, i) => {
      line = line.replace(/;.*/, "").trim();
      if (!line) return;
      const m = line.match(/^([0-9a-fA-F]{1,2})\s*:\s*(.*)$/);
      if (m) { addr = parseInt(m[1], 16); line = m[2].trim(); }
      line.split(/\s+/).forEach((tok) => {
        if (!tok) return;
        const t = tok.replace(/^0x/i, "");
        if (!/^[0-9a-fA-F]{1,4}$/.test(t)) { errs.push(L(`Dòng ${i + 1}: "${tok}" không phải số hex 4 chữ số`, `Line ${i + 1}: "${tok}" is not a 4-digit hex number`)); return; }
        if (addr > 255) { errs.push(L(`Dòng ${i + 1}: vượt quá địa chỉ FF`, `Line ${i + 1}: past address FF`)); return; }
        words.push([addr, parseInt(t, 16)]);
        addr++;
      });
    });
    return { words, errs };
  }

  function newMachine(progText, dataText, kbdText) {
    const mem = new Array(256).fill(0), errs = [], progAddrs = new Set();
    const d = parseMem(dataText || "");
    d.words.forEach(([a, v]) => { mem[a] = v; });
    errs.push(...d.errs.map((e) => L("Dữ liệu — ", "Data — ") + e));
    const p = parseMem(progText || "");
    p.words.forEach(([a, v]) => { mem[a] = v; progAddrs.add(a); });
    errs.push(...p.errs.map((e) => L("Chương trình — ", "Program — ") + e));
    const kbd = String(kbdText || "").split(/[,\s]+/).filter(Boolean).map(Number)
      .filter((n) => Number.isFinite(n)).map((n) => ((Math.trunc(n) % 65536) + 65536) % 65536);
    return {
      mem, R: new Array(16).fill(0), PC: 0, IR: 0, phase: "fetch", cycles: 0, halted: false, out: [], kbd, kp: 0,
      err: errs[0] || null, parseErr: errs.length > 0, dec: null, curAddr: null, flashR: -1, flashM: -1,
      progAddrs, progLen: p.words.length, dataAddrs: new Set(d.words.map((w) => w[0])),
    };
  }
  // Ô FE là bàn phím, ô FF là màn hình (memory-mapped I/O)
  function rd(m, a) {
    if (a === 0xfe) {
      if (m.kp >= m.kbd.length) { m.err = L("Bàn phím hết số để đọc. Thêm số vào hàng đợi bàn phím.", "The keyboard has no numbers left. Add more to the keyboard queue."); m.halted = true; return 0; }
      return m.kbd[m.kp++];
    }
    return a === 0xff ? 0 : m.mem[a];
  }
  function wr(m, a, v) {
    v &= 0xffff;
    if (a === 0xff) m.out.push(v); else m.mem[a] = v;
    m.flashM = a;
  }
  /** Chạy một pha: fetch → decode → execute. */
  function phaseStep(m) {
    if (m.halted) return;
    m.flashR = -1; m.flashM = -1;
    if (m.phase === "fetch") { m.curAddr = m.PC; m.IR = m.mem[m.PC]; m.PC = (m.PC + 1) & 255; m.dec = null; m.phase = "decode"; return; }
    if (m.phase === "decode") { m.dec = decode(m.IR); m.phase = "execute"; return; }
    const d = m.dec;
    m.cycles++;
    switch (d.name) {
      case "HALT": m.halted = true; break;
      case "LOAD": { const v = rd(m, d.ms); if (!m.halted) { m.R[d.rd] = v; m.flashR = d.rd; } break; }
      case "STORE": wr(m, d.md, m.R[d.rs]); break;
      case "ADDI": m.R[d.rd] = (m.R[d.s] + m.R[d.t]) & 0xffff; m.flashR = d.rd; break;
      case "INC": m.R[d.r] = (m.R[d.r] + 1) & 0xffff; m.flashR = d.r; break;
      case "DEC": m.R[d.r] = (m.R[d.r] + 65535) & 0xffff; m.flashR = d.r; break;
      case "JUMP": if (m.R[0] !== m.R[d.r]) m.PC = d.md; break;
      default:
        m.err = L(`Không thực thi được lệnh ${h4(m.IR)} ở địa chỉ ${h2(m.curAddr)}.`, `Cannot execute instruction ${h4(m.IR)} at address ${h2(m.curAddr)}.`);
        m.halted = true;
    }
    m.phase = "fetch";
  }
  function cycleStep(m) { if (m.halted) return; do phaseStep(m); while (m.phase !== "fetch" && !m.halted); }
  function runAll(m, limit = 500) {
    while (!m.halted && m.cycles < limit) cycleStep(m);
    if (!m.halted) { m.err = L(`Đã chạy ${limit} chu kỳ mà chưa gặp HALT. Có thể chương trình lặp vô hạn.`, `Ran ${limit} cycles without reaching HALT. The program may loop forever.`); m.halted = true; }
  }

  /* ================= cache 2 dòng, LRU ================= */
  function simCache(seq, lines = 2, bs = 4) {
    const cache = [], rows = [];
    let hits = 0;
    seq.forEach((a, i) => {
      const b = Math.floor(a / bs), k = cache.indexOf(b);
      let res;
      if (k >= 0) { hits++; res = "HIT"; cache.splice(k, 1); cache.push(b); }
      else { res = "MISS"; if (cache.length >= lines) cache.shift(); cache.push(b); }
      rows.push({ i: i + 1, a, b, res, state: cache.slice() });
    });
    return { rows, hits };
  }

  /* ================= các phòng ================= */
  const P3 = `00: 1040   ; R0 ← M40
01: 1141   ; R1 ← M41
02: 3201   ; R2 ← R0 + R1
03: A200   ; INC R2
04: 2422   ; M42 ← R2
05: 0000   ; HALT`;
  const P3DATA = `40: 0012
41: 002F`;
  const P4START = L(`; Viết chương trình D = A + B + C ở đây.
; Mỗi dòng một lệnh hex 4 chữ số, bắt đầu từ địa chỉ 00.
; Bàn phím ở ô FE, màn hình ở ô FF.
`, `; Write the program D = A + B + C here.
; One 4-digit hex instruction per line, starting at address 00.
; The keyboard is cell FE, the screen is cell FF.
`);
  const CHOOSE = L("— chọn —", "— choose —");
  const SUBS = [["", CHOOSE], ["cpu", "CPU"], ["cache", "Cache"], ["main", "Main memory"], ["io", "I/O subsystem"]];
  const FLYNN = [["", CHOOSE], ["sisd", "SISD"], ["simd", "SIMD"], ["misd", "MISD"], ["mimd", "MIMD"]];

  const ROOMS = [
    {
      name: L("Cổng địa chỉ", "Address Gate"), title: L("Hết số nhà", "Out of house numbers"), letter: "F", bench: "pow",
      story: L("Bạn tỉnh dậy giữa một cỗ máy Von Neumann. Cánh cổng đầu tiên nối với một address bus bị đứt. Người thợ sửa máy bỏ lại ba mảnh giấy tính dở.",
        "You wake up inside a Von Neumann machine. The first gate is wired to a broken address bus. The repair technician left three half-finished calculations behind."),
      tasks: [
        L("Bộ nhớ 256 MB, mỗi word 8 byte. Cần bao nhiêu bit để đánh địa chỉ từng word?", "Memory is 256 MB and each word is 8 bytes. How many bits are needed to address each word?"),
        L("Address bus có 32 dây, mỗi ô nhớ 1 byte. Bộ nhớ tối đa là bao nhiêu GB?", "The address bus has 32 lines and each cell holds 1 byte. What is the maximum memory in GB?"),
        L("Máy có 20 bit địa chỉ, mỗi word 2 byte. Dung lượng bộ nhớ là bao nhiêu MB?", "A machine has 20 address bits and 2-byte words. How many MB of memory does it have?"),
      ],
      fields: [
        { id: "a", label: L("Câu 1 · số bit", "Q1 · bits"), type: "dec", ans: 25 },
        { id: "b", label: L("Câu 2 · số GB", "Q2 · GB"), type: "dec", ans: 4 },
        { id: "c", label: L("Câu 3 · số MB", "Q3 · MB"), type: "dec", ans: 2 },
      ],
      hints: [
        L("Đổi mọi thứ về lũy thừa của 2: 1 KB = 2¹⁰, 1 MB = 2²⁰, 1 GB = 2³⁰ byte.", "Turn everything into powers of 2: 1 KB = 2¹⁰, 1 MB = 2²⁰, 1 GB = 2³⁰ bytes."),
        L("Câu 1 đánh địa chỉ cho word, không phải cho byte: lấy 2²⁸ byte chia cho 2³ byte mỗi word. Câu 3: 2²⁰ word × 2 byte.", "Q1 addresses words, not bytes: divide 2²⁸ bytes by 2³ bytes per word. Q3: 2²⁰ words × 2 bytes."),
      ],
      debrief: () => L("Số bit địa chỉ = log₂(số vị trí). Khi đánh địa chỉ theo word, số vị trí = dung lượng ÷ kích thước word, nên 2²⁸ ÷ 2³ = 2²⁵ → 25 bit. 32 dây địa chỉ chỉ đủ cho 2³² byte = 4 GB, đó là lý do máy 32-bit không dùng hết 8 GB RAM.",
        "Address bits = log₂(number of locations). With word addressing, locations = capacity ÷ word size, so 2²⁸ ÷ 2³ = 2²⁵ → 25 bits. 32 address lines only reach 2³² bytes = 4 GB, which is why a 32-bit machine cannot use all of 8 GB of RAM."),
    },
    {
      name: L("Kho bộ nhớ", "Memory Store"), title: L("Đúng ngăn, đúng tầng", "Right shelf, right level"), letter: "E", bench: "cache", wide: true,
      story: L("Kho chứa linh kiện bị đảo lộn. Người gác kho chỉ mở cửa khi mọi linh kiện về đúng subsystem và bạn đếm đúng số lần cache \"trúng\".",
        "The parts store has been turned upside down. The keeper opens the door only when every part is back in the right subsystem and you count the cache hits correctly."),
      tasks: [
        L("Xếp mỗi linh kiện vào đúng chỗ theo mô hình của Forouzan.", "Put each part in the right place according to Forouzan's model."),
        L("Cache có 2 dòng, mỗi dòng chứa 1 block 4 word (block 0 = word 0–3, block 1 = word 4–7…), thay dòng ít dùng gần nhất (LRU), ban đầu rỗng. CPU đọc lần lượt các word 0, 1, 2, 3, 8, 9, 0, 1, 16, 0. Có bao nhiêu lần hit?",
          "The cache has 2 lines, each holding one 4-word block (block 0 = words 0–3, block 1 = words 4–7…), replaces the least recently used line (LRU) and starts empty. The CPU reads words 0, 1, 2, 3, 8, 9, 0, 1, 16, 0 in order. How many hits are there?"),
      ],
      fields: [
        { id: "pc", label: "Program Counter (PC)", type: "select", opts: SUBS, ans: "cpu" },
        { id: "sram", label: L("SRAM nằm giữa CPU và RAM", "SRAM sitting between the CPU and RAM"), type: "select", opts: SUBS, ans: "cache" },
        { id: "dram", label: L("Thanh DRAM 16 GB", "A 16 GB DRAM stick"), type: "select", opts: SUBS, ans: "main" },
        { id: "rom", label: L("ROM chứa chương trình khởi động", "ROM holding the boot program"), type: "select", opts: SUBS, ans: "main" },
        { id: "ssd", label: L("Ổ SSD 1 TB", "A 1 TB SSD"), type: "select", opts: SUBS, ans: "io" },
        { id: "usb", label: "USB controller", type: "select", opts: SUBS, ans: "io" },
        { id: "hits", label: L("Số lần cache hit", "Number of cache hits"), type: "dec", ans: 7 },
      ],
      hints: [
        L("Theo Forouzan, main memory gồm cả RAM và ROM. Ổ lưu trữ và mọi controller đều thuộc I/O subsystem.", "In Forouzan's model, main memory includes both RAM and ROM. Storage drives and every controller belong to the I/O subsystem."),
        L("Word 16 thuộc block 4. Khi nó vào cache, block nào bị đuổi ra? Block đó có được đọc lại nữa không? Có thể nhập chuỗi vào bàn mô phỏng để kiểm tra.", "Word 16 is in block 4. When it enters the cache, which block is evicted? Is that block read again? You can type the sequence into the simulator to check."),
      ],
      debrief: () => L("Chỉ 3 lần miss (block 0, 2, 4), 7 lần hit, tỷ lệ hit 70%. Cache hiệu quả nhờ chép cả block: đọc word 0 là có sẵn word 1, 2, 3. Đây là quy tắc 80–20 trong slide. Ổ SSD lưu trữ lâu dài nhưng vẫn thuộc I/O, vì CPU phải đi qua controller để đọc nó.",
        "Only 3 misses (blocks 0, 2, 4) and 7 hits, a 70% hit rate. A cache works because it copies whole blocks: reading word 0 brings in words 1, 2 and 3 as well. This is the 80–20 rule from the slides. An SSD stores data permanently but still belongs to I/O, because the CPU must go through a controller to read it."),
    },
    {
      name: L("Phòng điều khiển", "Control Room"), title: L("Đóng vai CPU", "Be the CPU"), letter: "T", bench: "sim3",
      story: L("Bảng điều khiển hiện một chương trình và hai ô dữ liệu. Cửa chỉ mở khi bạn đoán đúng trạng thái máy sau khi chương trình chạy xong. Hãy trace bằng tay trước, rồi dùng bàn mô phỏng để kiểm tra từng pha.",
        "The control panel shows a program and two data cells. The door opens only when you predict the machine's state after the program finishes. Trace it by hand first, then use the simulator to check each phase."),
      code: P3, codeNote: L("Dữ liệu: M40 = (0012)₁₆, M41 = (002F)₁₆", "Data: M40 = (0012)₁₆, M41 = (002F)₁₆"),
      tasks: [
        L("Giá trị cuối cùng của R2, viết ở hệ hex.", "The final value of R2, in hex."),
        L("Giá trị của ô nhớ M42 sau khi chạy, viết ở hệ thập phân.", "The value of memory cell M42 afterwards, in decimal."),
        L("Chương trình chạy hết bao nhiêu machine cycle?", "How many machine cycles does the program take?"),
      ],
      fields: [
        { id: "r2", label: "R2 (hex)", type: "hex", ans: 0x42 },
        { id: "m42", label: L("M42 (thập phân)", "M42 (decimal)"), type: "dec", ans: 66 },
        { id: "cy", label: L("Số machine cycle", "Machine cycles"), type: "dec", ans: 6 },
      ],
      hints: [
        L("Lệnh A200 là INC R2: cộng thêm 1 vào R2. Lệnh 2422 là STORE: ô đích 42, register nguồn R2.", "A200 is INC R2: add 1 to R2. 2422 is STORE: destination cell 42, source register R2."),
        L("0012 + 002F = 0041 (hex). Mỗi lệnh, kể cả HALT, tốn đúng một machine cycle.", "0012 + 002F = 0041 (hex). Every instruction, HALT included, takes exactly one machine cycle."),
      ],
      debrief: () => L("18 + 47 + 1 = 66 = (0042)₁₆. Sáu lệnh nên sáu machine cycle, mỗi cycle gồm fetch, decode, execute. Để ý PC tăng ngay sau fetch, nên khi đang execute lệnh ở 02 thì PC đã là 03.",
        "18 + 47 + 1 = 66 = (0042)₁₆. Six instructions, so six machine cycles, each made of fetch, decode and execute. Notice that PC is incremented right after fetch, so while the instruction at 02 executes, PC is already 03."),
    },
    {
      name: L("Lò lập trình", "Programming Forge"), title: "D = A + B + C", letter: "C", bench: "sim4", custom: true,
      story: L("Cửa này là một máy tính trống. Viết một chương trình đọc ba số từ bàn phím và in tổng của chúng ra màn hình. Ổ khóa sẽ tự chạy chương trình với ba bộ dữ liệu thử.",
        "This door is an empty computer. Write a program that reads three numbers from the keyboard and prints their sum on the screen. The lock runs your program on three test cases."),
      tasks: [
        L("Đọc A, B, C từ bàn phím (ô FE).", "Read A, B, C from the keyboard (cell FE)."),
        L("In D = A + B + C ra màn hình (ô FF).", "Print D = A + B + C on the screen (cell FF)."),
        L("Kết thúc bằng HALT.", "Finish with HALT."),
      ],
      fields: [],
      hints: [
        L("Đọc bàn phím là LOAD từ ô FE: lệnh 10FE đưa số gõ đầu tiên vào R0. Mỗi lần LOAD từ FE lấy số tiếp theo.", "Reading the keyboard is a LOAD from cell FE: 10FE puts the first typed number into R0. Each LOAD from FE takes the next number."),
        L("ADDI chỉ cộng hai register, nên cần hai lệnh cộng. In ra màn hình là STORE vào ô FF, theo thứ tự 2 · địa chỉ · register, ví dụ 2FF4.", "ADDI adds only two registers, so you need two additions. Printing is a STORE to cell FF, in the order 2 · address · register, e.g. 2FF4."),
      ],
      debrief: () => {
        const n = S.p4len;
        return n <= 7
          ? L(`Chương trình của bạn có ${n} lệnh, ngắn như lời giải gọn nhất. Lời giải trong sách lưu A, B, C vào bộ nhớ trước rồi mới LOAD lại, dài hơn nhưng cũng đúng.`,
            `Your program has ${n} instructions, as short as the tightest solution. The textbook solution stores A, B, C in memory first and LOADs them back, which is longer but also correct.`)
          : L(`Chương trình của bạn có ${n} lệnh. Lời giải gọn nhất cần 7 lệnh: ba LOAD, hai ADDI, một STORE, một HALT. Lời giải trong sách lưu A, B, C vào bộ nhớ trước rồi mới LOAD lại, dài hơn nhưng cũng đúng.`,
            `Your program has ${n} instructions. The tightest solution needs 7: three LOADs, two ADDIs, one STORE and one HALT. The textbook solution stores A, B, C in memory first and LOADs them back, which is longer but also correct.`);
      },
    },
    {
      name: L("Dây chuyền", "Assembly Line"), title: L("Nhanh hơn nữa", "Even faster"), letter: "H", bench: "pipe", wide: true,
      story: L("Cánh cửa cuối là một dây chuyền ba tầng: Fetch, Decode, Execute. Muốn mở nó, bạn phải tính được dây chuyền chạy nhanh đến đâu và gọi đúng tên các kiểu máy song song.",
        "The last door is a three-stage assembly line: Fetch, Decode, Execute. To open it you must work out how fast the line runs and name the kinds of parallel machines correctly."),
      tasks: [
        L("20 lệnh, pipeline 3 tầng, không có lệnh jump. Mất bao nhiêu đơn vị thời gian?", "20 instructions, a 3-stage pipeline, no jumps. How many time units does it take?"),
        L("10 lệnh, pipeline 3 tầng, có đúng 1 lệnh jump. Mỗi jump làm bỏ đi 2 lệnh đã nạp sau nó. Mất bao nhiêu đơn vị thời gian?", "10 instructions, a 3-stage pipeline, exactly 1 jump. Each jump throws away the 2 instructions fetched after it. How many time units does it take?"),
        L("Theo Flynn, mỗi hệ thống sau thuộc loại nào?", "Under Flynn's taxonomy, which class is each system?"),
      ],
      fields: [
        { id: "p1", label: L("Câu 1 · đơn vị thời gian", "Q1 · time units"), type: "dec", ans: 22 },
        { id: "p2", label: L("Câu 2 · đơn vị thời gian", "Q2 · time units"), type: "dec", ans: 14 },
        { id: "f1", label: L("Một GPU nhân ma trận trọng số của mạng nơ-ron", "One GPU multiplying a neural network's weight matrices"), type: "select", opts: FLYNN, ans: "simd" },
        { id: "f2", label: L("Cụm 512 GPU cùng train một mô hình ngôn ngữ", "A cluster of 512 GPUs training one language model"), type: "select", opts: FLYNN, ans: "mimd" },
        { id: "f3", label: L("Simple Computer ở phòng 3", "The Simple Computer from room 3"), type: "select", opts: FLYNN, ans: "sisd" },
      ],
      hints: [
        L("Có pipeline: n lệnh qua k tầng mất n + k − 1 đơn vị thời gian. Mỗi lệnh bị bỏ cộng thêm 1.", "With a pipeline, n instructions through k stages take n + k − 1 time units. Each discarded instruction adds 1."),
        L("GPU: một lệnh chạy trên hàng nghìn số cùng lúc. Cụm nhiều GPU: mỗi GPU có luồng lệnh riêng. Simple Computer: một control unit, một ALU.", "A GPU runs one instruction on thousands of numbers at once. In a multi-GPU cluster each GPU has its own instruction stream. The Simple Computer has one control unit and one ALU."),
      ],
      debrief: () => L("20 + 3 − 1 = 22, so với 60 nếu không có pipeline. Với jump: 10 + 2 + 2 = 14, vì hai ô bị bỏ là thời gian chết. GPU là SIMD; nhiều GPU chạy cùng nhau là MIMD; Simple Computer là SISD, đúng mô hình Von Neumann cổ điển.",
        "20 + 3 − 1 = 22, versus 60 without a pipeline. With a jump: 10 + 2 + 2 = 14, because the two discarded slots are dead time. A GPU is SIMD; many GPUs working together are MIMD; the Simple Computer is SISD, the classic Von Neumann model."),
    },
  ];

  /* ================= trạng thái ================= */
  const PEN = 60; // giây phạt cho mỗi gợi ý
  const TESTS = [[3, 5, 7], [100, 200, 50], [1000, 0, 24]];
  let S = null;
  const M = { sim3: null, sim4: null };

  function fresh() {
    return {
      cur: 0, solved: [false, false, false, false, false], hints: [0, 0, 0, 0, 0], wrong: [0, 0, 0, 0, 0], scores: [0, 0, 0, 0, 0],
      elapsed: 0, running: false, finished: false, inputs: ROOMS.map(() => ({})), p4len: 0,
      b: {
        pow: { v: "64", u: "MB" }, cache: { seq: "0, 1, 2, 3, 4, 5, 0, 1" },
        sim3: { prog: P3, data: P3DATA, kbd: "" }, sim4: { prog: P4START, data: "", kbd: "3, 5, 7" },
        pipe: { n: "5", k: "3", j: "" },
      },
    };
  }
  function resetSim(key) { const b = S.b[key]; M[key] = newMachine(b.prog, b.data, b.kbd); }

  /* ---------- đồng hồ: chạy từ lần thao tác đầu, dừng khi rời màn hình chơi ---------- */
  let lastTick = 0;
  function startClock() { if (!S.running && !S.finished) { S.running = true; lastTick = Date.now(); } }
  function pauseClock() {
    if (!S || !S.running) return;
    S.elapsed += Date.now() - lastTick;
    S.running = false;
  }
  setInterval(() => {
    if (!S || !S.running) return;
    const now = Date.now();
    S.elapsed += now - lastTick; lastTick = now;
    hud();
  }, 250);
  const mmss = (ms) => { const s = Math.floor(ms / 1000); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };
  const penalty = () => S.hints.reduce((a, b) => a + b, 0) * PEN;
  function hud() {
    $("#hud-clock").textContent = mmss(S.elapsed);
    const p = penalty();
    $("#hud-pen").textContent = "+" + Math.floor(p / 60) + ":" + String(p % 60).padStart(2, "0");
    $("#hud-done").textContent = S.solved.filter(Boolean).length + "/5";
  }

  /* ================= cửa ================= */
  function renderDoors() {
    const nav = $("#doors");
    nav.innerHTML = "";
    ROOMS.forEach((r, i) => {
      const unlocked = i === 0 || S.solved[i - 1];
      const label = L(`Cửa ${i + 1}`, `Door ${i + 1}`);
      const state = S.solved[i] ? L(" — đã mở", " — open") : unlocked ? "" : L(" — đang khóa", " — locked");
      nav.append(G.el("button", {
        type: "button", class: "door" + (S.cur === i ? " current" : "") + (S.solved[i] ? " solved" : ""),
        disabled: !unlocked, "aria-label": `${label}: ${r.name}${state}`,
        html: `<span class="n">${label}</span><span class="t">${esc(r.name)}</span><span class="slot">${S.solved[i] ? r.letter : "?"}</span>`,
        onclick: () => { S.cur = i; render(); },
      }));
    });
  }

  /* ================= phòng ================= */
  function fieldHTML(i, f) {
    const v = S.inputs[i][f.id] ?? "", id = `f_${i}_${f.id}`;
    if (f.type === "select") {
      return `<div class="field"><label for="${id}">${esc(f.label)}</label><select id="${id}" data-f="${f.id}">${f.opts.map(([k, t]) => `<option value="${k}"${k === v ? " selected" : ""}>${esc(t)}</option>`).join("")}</select></div>`;
    }
    return `<div class="field"><label for="${id}">${esc(f.label)}</label><input type="text" id="${id}" data-f="${f.id}" value="${esc(v)}" autocomplete="off" inputmode="${f.type === "dec" ? "decimal" : "text"}"></div>`;
  }
  function codeHTML(t) {
    return t.split("\n").map((line) => {
      const [c, cm] = line.split(";");
      const m = c.match(/^(\w+:)(.*)$/);
      return (m ? `<span class="a">${m[1]}</span>${esc(m[2])}` : esc(c)) + (cm !== undefined ? `<span class="c">;${esc(cm)}</span>` : "");
    }).join("\n");
  }

  function renderRoom() {
    const el = $("#room"), i = S.cur, r = ROOMS[i];
    let h = `<div><div class="eyebrow">${L(`Cửa ${i + 1}`, `Door ${i + 1}`)} · ${esc(r.name)}</div><h2>${esc(r.title)}</h2></div>
      <p class="story">${esc(r.story)}</p>`;
    if (r.code) h += `<pre class="code">${codeHTML(r.code)}</pre><p class="small muted" style="margin:0">${esc(r.codeNote)}</p>`;
    h += `<div><h3 class="sub-h">${L("Nhiệm vụ", "Tasks")}</h3><ol class="task">${r.tasks.map((t) => `<li>${esc(t)}</li>`).join("")}</ol></div>`;
    if (S.solved[i]) {
      h += `<div class="debrief"><div class="eyebrow">${L(`Cửa đã mở · chữ ${r.letter}`, `Door open · letter ${r.letter}`)}</div><p>${esc(r.debrief())}</p></div>
        <div class="row"><button class="btn" id="go-next">${i < 4 ? L(`Sang cửa ${i + 2} →`, `On to door ${i + 2} →`) : L("Mở két thoát hiểm 🔓", "Open the escape vault 🔓")}</button></div>`;
    } else if (r.custom) {
      h += `<form class="lock" id="lock"><p class="small" style="margin:0">${L("Viết chương trình trên bàn lập trình bên cạnh. Ổ khóa chạy nó với ba bộ (A, B, C): (3, 5, 7), (100, 200, 50) và (1000, 0, 24).", "Write the program on the programming bench. The lock runs it on three (A, B, C) cases: (3, 5, 7), (100, 200, 50) and (1000, 0, 24).")}</p>
        <div class="row"><button class="btn" type="submit">${L("Chạy kiểm thử", "Run the tests")}</button></div><div id="tests"></div><p class="msg" id="msg" aria-live="polite"></p></form>`;
    } else {
      h += `<form class="lock" id="lock"><div class="fields${r.wide ? " wide" : ""}">${r.fields.map((f) => fieldHTML(i, f)).join("")}</div>
        <div class="row"><button class="btn" type="submit">${L("Thử mở khóa", "Try the lock")}</button></div><p class="msg" id="msg" aria-live="polite"></p></form>`;
    }
    if (!S.solved[i]) {
      const used = S.hints[i];
      h += `<div class="hints">${r.hints.slice(0, used).map((t, k) => `<div class="hint"><b>${L("Gợi ý", "Hint")} ${k + 1}</b>${esc(t)}</div>`).join("")}</div>`;
      if (used < r.hints.length) h += `<div class="row"><button class="btn ghost sm" id="btn-hint">${L(`Xem gợi ý ${used + 1} (+60 giây)`, `Show hint ${used + 1} (+60 seconds)`)}</button></div>`;
    }
    el.innerHTML = h;

    const next = $("#go-next");
    if (next) next.addEventListener("click", () => { if (i < 4) { S.cur = i + 1; render(); } else finish(); });
    const hintBtn = $("#btn-hint");
    if (hintBtn) hintBtn.addEventListener("click", () => { startClock(); S.hints[i]++; hud(); renderRoom(); });
    el.querySelectorAll("[data-f]").forEach((inp) => {
      inp.addEventListener(inp.tagName === "SELECT" ? "change" : "input", () => {
        startClock();
        S.inputs[i][inp.dataset.f] = inp.value;
        inp.classList.remove("bad-in", "good-in");
      });
    });
    const form = $("#lock");
    if (form) form.addEventListener("submit", (e) => { e.preventDefault(); startClock(); if (r.custom) checkProgram(); else checkRoom(i); });
  }

  function checkRoom(i) {
    const r = ROOMS[i];
    let bad = 0, empty = 0;
    r.fields.forEach((f) => {
      const raw = S.inputs[i][f.id] ?? "", inp = $(`#f_${i}_${f.id}`);
      let ok = false;
      if (String(raw).trim() === "") empty++;
      else if (f.type === "select") ok = raw === f.ans;
      else if (f.type === "hex") ok = parseHex(raw) === f.ans;
      else { const v = parseDec(raw); ok = v !== null && Math.abs(v - f.ans) < 1e-9; }
      inp.classList.toggle("good-in", ok);
      inp.classList.toggle("bad-in", !ok);
      if (!ok) bad++;
    });
    if (bad === 0) return solve(i);
    const msg = $("#msg");
    if (empty < r.fields.length) S.wrong[i]++; // khóa trống trơn thì không tính là thử sai
    msg.className = "msg bad";
    msg.textContent = empty === r.fields.length
      ? L("Ổ khóa chưa nhận được đáp án nào.", "The lock has not received any answers yet.")
      : L(`Còn ${bad} ô chưa đúng`, `${bad} box(es) still wrong`) + (empty ? L(` (${empty} ô để trống)`, ` (${empty} left empty)`) : "") + L(". Xem lại các ô viền đỏ.", ". Check the boxes outlined in red.");
    G.sound.play("bad");
    G.shake($("#lock"));
  }

  function checkProgram() {
    const b = S.b.sim4, res = [];
    let pass = 0, parseErr = null;
    TESTS.forEach((t) => {
      const m = newMachine(b.prog, "", t.join(","));
      if (m.parseErr) { parseErr = m.err; return; }
      if (m.progLen === 0) { parseErr = L("Chương trình đang trống.", "The program is empty."); return; }
      runAll(m, 300);
      const sum = (t[0] + t[1] + t[2]) & 0xffff;
      const got = m.out.length ? m.out[m.out.length - 1] : null;
      const ok = !m.err && got === sum && m.out.length === 1;
      const note = m.err ? m.err
        : got === null ? L("Không in gì ra màn hình.", "Nothing was printed on the screen.")
        : m.out.length > 1 ? L(`In ${m.out.length} số, cần đúng 1.`, `Printed ${m.out.length} numbers, exactly 1 needed.`)
        : got !== sum ? L(`In ra ${got}, cần ${sum}.`, `Printed ${got}, expected ${sum}.`)
        : L(`In ra ${got} sau ${m.cycles} cycle.`, `Printed ${got} after ${m.cycles} cycles.`);
      if (ok) pass++;
      res.push(`<tr><td>(${t.join(", ")})</td><td class="${ok ? "hit" : "miss"}">${ok ? L("ĐÚNG", "PASS") : L("SAI", "FAIL")}</td><td style="white-space:normal">${esc(note)}</td></tr>`);
    });
    const msg = $("#msg");
    if (parseErr) {
      $("#tests").innerHTML = "";
      msg.className = "msg bad"; msg.textContent = parseErr;
      S.wrong[3]++; G.sound.play("bad");
      return;
    }
    $("#tests").innerHTML = `<div class="tw"><table class="t"><thead><tr><th>A, B, C</th><th>${L("Kết quả", "Result")}</th><th>${L("Chi tiết", "Details")}</th></tr></thead><tbody>${res.join("")}</tbody></table></div>`;
    if (pass === TESTS.length) {
      S.p4len = newMachine(b.prog, "", "").progLen;
      msg.className = "msg ok"; msg.textContent = L("Cả ba bộ thử đều đúng.", "All three tests pass.");
      G.wait(700).then(() => solve(3));
    } else {
      S.wrong[3]++;
      msg.className = "msg bad";
      msg.textContent = L(`Đúng ${pass}/${TESTS.length} bộ thử. Chạy từng bước trên bàn lập trình để tìm chỗ sai.`, `${pass}/${TESTS.length} tests pass. Step through it on the programming bench to find the bug.`);
      G.sound.play("bad");
    }
  }

  /** Điểm một cửa: 100, −25 mỗi gợi ý, −10 mỗi lần thử sai, tối thiểu 20. */
  const doorScore = (i) => Math.max(20, 100 - 25 * S.hints[i] - 10 * S.wrong[i]);
  function solve(i) {
    if (S.solved[i]) return;
    S.solved[i] = true;
    S.scores[i] = doorScore(i);
    G.progress.record(GAME_ID, i, S.scores[i], ROOMS.length);
    G.sound.play("good");
    G.toast(L(`🔓 Cửa ${i + 1} đã mở: chữ ${ROOMS[i].letter}`, `🔓 Door ${i + 1} open: letter ${ROOMS[i].letter}`), "good");
    hud();
    render();
  }

  /* ================= két thoát hiểm (màn hình end) ================= */
  function finish() {
    pauseClock();
    S.finished = true;
    const tot = S.elapsed + penalty() * 1000, wrong = S.wrong.reduce((a, b) => a + b, 0);
    const score = S.scores.reduce((a, b) => a + b, 0);
    $("#vault-code").innerHTML = ROOMS.map((r) => `<span>${r.letter}</span>`).join("");
    const stat = (k, v, cls = "") => `<div class="reg"><div class="k">${k}</div><div class="v ${cls}">${v}</div></div>`;
    $("#vault-stats").innerHTML = stat(L("Thời gian giải", "Solving time"), mmss(S.elapsed))
      + stat(L("Phạt gợi ý", "Hint penalty"), "+" + mmss(penalty() * 1000), "pen")
      + stat(L("Tổng", "Total"), mmss(tot))
      + stat(L("Lần thử sai", "Wrong attempts"), wrong);
    $("#end-score").textContent = score;
    $("#end-detail").textContent = L(`Điểm: ${score}/500 (100 mỗi cửa, trừ khi dùng gợi ý hoặc thử sai).`, `Score: ${score}/500 (100 per door, less for hints and wrong attempts).`);
    G.showScreen("end");
    G.confetti(); G.sound.play("win");
    G.mountNextLink($("#next-game"));
  }

  /* ================= bàn thí nghiệm ================= */
  function renderBench() {
    const el = $("#bench"), kind = ROOMS[S.cur].bench;
    if (kind === "pow") benchPow(el);
    else if (kind === "cache") benchCache(el);
    else if (kind === "pipe") benchPipe(el);
    else benchSim(el, kind);
  }
  const head = (eb, title, sub) => `<div><div class="eyebrow">${eb}</div><h2>${title}</h2></div>${sub ? `<p class="small muted" style="margin:0">${sub}</p>` : ""}`;

  function benchPow(el) {
    const b = S.b.pow;
    const units = [["1 KB", "1 024", "2¹⁰"], ["1 MB", "1 048 576", "2²⁰"], ["1 GB", "1 073 741 824", "2³⁰"],
      [L("1 word 2 byte", "1 word of 2 bytes"), "2", "2¹"], [L("1 word 4 byte", "1 word of 4 bytes"), "4", "2²"], [L("1 word 8 byte", "1 word of 8 bytes"), "8", "2³"]];
    el.innerHTML = head(L("Bàn nháp", "Scratch bench"), L("Máy đổi lũy thừa 2", "Power-of-two converter"),
      L("Nhập một dung lượng để xem nó bằng bao nhiêu byte và có phải lũy thừa của 2 không. Việc chia cho kích thước word là của bạn.", "Enter a capacity to see how many bytes it is and whether it is a power of 2. Dividing by the word size is up to you."))
      + `<div class="fields"><div class="field"><label for="pv">${L("Giá trị", "Value")}</label><input type="text" id="pv" value="${esc(b.v)}" inputmode="decimal"></div>
        <div class="field"><label for="pu">${L("Đơn vị", "Unit")}</label><select id="pu">${["B", "KB", "MB", "GB", "TB"].map((u) => `<option${u === b.u ? " selected" : ""}>${u}</option>`).join("")}</select></div></div>
        <div class="decoded" id="pout"></div>
        <div class="tw"><table class="t"><thead><tr><th>${L("Đơn vị", "Unit")}</th><th>Byte</th><th>${L("Lũy thừa", "Power")}</th></tr></thead><tbody>
        ${units.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("")}</tbody></table></div>`;
    const upd = () => {
      b.v = $("#pv").value; b.u = $("#pu").value;
      const v = parseDec(b.v), ex = { B: 0, KB: 10, MB: 20, GB: 30, TB: 40 }[b.u];
      if (v === null || v <= 0) { $("#pout").textContent = L("Nhập một số dương.", "Enter a positive number."); return; }
      const bytes = v * 2 ** ex, k = Math.log2(bytes);
      $("#pout").textContent = `${v} ${b.u} = ${fmtNum(bytes)} byte` + (Number.isInteger(k) ? ` = 2^${k} byte` : L(" (không phải lũy thừa của 2)", " (not a power of 2)"));
    };
    $("#pv").addEventListener("input", () => { startClock(); upd(); });
    $("#pu").addEventListener("change", () => { startClock(); upd(); });
    upd();
  }

  function benchCache(el) {
    const b = S.b.cache;
    el.innerHTML = head(L("Bàn mô phỏng", "Simulator"), L("Cache 2 dòng · LRU", "2-line cache · LRU"),
      L("Mỗi dòng giữ 1 block 4 word. Block của word n là ⌊n ÷ 4⌋. Nhập dãy địa chỉ word, cách nhau bằng dấu phẩy.", "Each line holds one 4-word block. Word n is in block ⌊n ÷ 4⌋. Enter a sequence of word addresses separated by commas."))
      + `<div class="field"><label for="cseq">${L("Dãy word CPU đọc", "Words the CPU reads")}</label><input type="text" id="cseq" value="${esc(b.seq)}"></div>
        <div class="chips" id="csum"></div><div class="tw" id="ctab"></div>`;
    const upd = () => {
      b.seq = $("#cseq").value;
      const seq = b.seq.split(/[,\s]+/).filter(Boolean).map(Number).filter((n) => Number.isInteger(n) && n >= 0).slice(0, 40);
      if (!seq.length) { $("#ctab").innerHTML = `<p class="small muted">${L("Chưa có địa chỉ hợp lệ.", "No valid addresses yet.")}</p>`; $("#csum").innerHTML = ""; return; }
      const { rows, hits } = simCache(seq);
      $("#csum").innerHTML = `<span class="chip ok">Hit ${hits}</span><span class="chip warn">Miss ${seq.length - hits}</span><span class="chip">${L("Tỷ lệ hit", "Hit rate")} ${Math.round(hits / seq.length * 100)}%</span>`;
      $("#ctab").innerHTML = `<table class="t"><thead><tr><th>#</th><th>Word</th><th>Block</th><th>${L("Kết quả", "Result")}</th><th>${L("Cache sau đó", "Cache after")}</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${r.i}</td><td>${r.a}</td><td>B${r.b}</td><td class="${r.res === "HIT" ? "hit" : "miss"}">${r.res}</td><td>${r.state.map((x) => `B${x} (${x * 4}–${x * 4 + 3})`).join(" · ")}</td></tr>`).join("")}</tbody></table>`;
    };
    $("#cseq").addEventListener("input", () => { startClock(); upd(); });
    upd();
  }

  function benchPipe(el) {
    const b = S.b.pipe;
    el.innerHTML = head(L("Bàn mô phỏng", "Simulator"), L("Dây chuyền lệnh", "Instruction pipeline"),
      L("Mỗi lệnh jump làm bỏ đi k − 1 lệnh đã nạp sau nó (ô gạch đỏ).", "Each jump throws away the k − 1 instructions fetched after it (red hatched cells)."))
      + `<div class="fields"><div class="field"><label for="pn">${L("Số lệnh n (1–16)", "Instructions n (1–16)")}</label><input type="text" id="pn" value="${esc(b.n)}" inputmode="numeric"></div>
        <div class="field"><label for="pk">${L("Số tầng k (2–5)", "Stages k (2–5)")}</label><input type="text" id="pk" value="${esc(b.k)}" inputmode="numeric"></div>
        <div class="field"><label for="pj">${L("Lệnh jump (vd: 2, 5)", "Jump instructions (e.g. 2, 5)")}</label><input type="text" id="pj" value="${esc(b.j)}"></div></div>
        <div class="chips" id="psum"></div><div class="tw" id="ptab"></div>`;
    const upd = () => {
      b.n = $("#pn").value; b.k = $("#pk").value; b.j = $("#pj").value;
      const n = parseInt(b.n, 10), k = parseInt(b.k, 10);
      if (!(n >= 1 && n <= 16 && k >= 2 && k <= 5)) { $("#ptab").innerHTML = `<p class="small muted">${L("n từ 1 đến 16, k từ 2 đến 5.", "n from 1 to 16, k from 2 to 5.")}</p>`; $("#psum").innerHTML = ""; return; }
      const J = new Set(b.j.split(/[,\s]+/).map(Number).filter((x) => Number.isInteger(x) && x >= 1 && x < n));
      const LAB = { 2: ["F", "E"], 3: ["F", "D", "E"], 4: ["F", "D", "E", "W"], 5: ["F", "D", "E", "M", "W"] }[k];
      const rows = [];
      let t = 1;
      for (let i = 1; i <= n; i++) {
        rows.push({ lab: `I${i}`, start: t, len: k, jump: J.has(i) });
        if (J.has(i)) { for (let g = 1; g < k; g++) rows.push({ lab: "✕", start: t + g, len: k - g, ghost: true }); t += k; }
        else t += 1;
      }
      const T = rows.filter((r) => !r.ghost).reduce((m, r) => Math.max(m, r.start + r.len - 1), 0);
      let h = `<table class="pipe"><thead><tr><th></th>${Array.from({ length: T }, (_, x) => `<th>t${x + 1}</th>`).join("")}</tr></thead><tbody>`;
      rows.forEach((r) => {
        h += `<tr><td class="lab">${r.lab}${r.jump ? " jump" : ""}</td>`;
        for (let x = 1; x <= T; x++) {
          const s = x - r.start;
          h += s >= 0 && s < r.len ? `<td class="${r.ghost ? "gh" : "st" + (r.jump ? " j" : "")}">${r.ghost ? "✕" : LAB[s]}</td>` : "<td></td>";
        }
        h += "</tr>";
      });
      $("#ptab").innerHTML = h + "</tbody></table>";
      $("#psum").innerHTML = `<span class="chip ok">${L("Có pipeline", "Pipelined")}: ${T}</span><span class="chip">${L("Không pipeline", "No pipeline")}: ${n * k}</span><span class="chip">${L("Nhanh hơn", "Speed-up")} ×${(n * k / T).toFixed(2)}</span>`;
    };
    ["#pn", "#pk", "#pj"].forEach((id) => $(id).addEventListener("input", () => { startClock(); upd(); }));
    upd();
  }

  function benchSim(el, key) {
    const b = S.b[key];
    if (!M[key]) resetSim(key);
    const isLab = key === "sim4";
    el.innerHTML = head(isLab ? L("Bàn lập trình", "Programming bench") : L("Bàn mô phỏng", "Simulator"), "Simple Computer",
      isLab ? L("Viết chương trình, bấm Nạp lại, rồi chạy từng pha để xem máy làm gì.", "Write the program, press Reload, then step through the phases to see what the machine does.")
        : L("Chương trình của phòng này đã được nạp. Bấm Pha tiếp để đi qua fetch, decode, execute.", "This room's program is already loaded. Press Next phase to step through fetch, decode, execute."))
      + `<div class="io">
          <div class="field"><label for="sprog">${L("Chương trình (bắt đầu từ 00)", "Program (starts at 00)")}</label><textarea id="sprog" rows="${isLab ? 9 : 7}" spellcheck="false">${esc(b.prog)}</textarea></div>
          <div class="col">
            <div class="field"><label for="sdata">${L("Dữ liệu (dạng 40: 0012)", "Data (as 40: 0012)")}</label><textarea id="sdata" rows="3" spellcheck="false">${esc(b.data)}</textarea></div>
            <div class="field"><label for="skbd">${L("Hàng đợi bàn phím (số thập phân)", "Keyboard queue (decimal numbers)")}</label><input type="text" id="skbd" value="${esc(b.kbd)}"></div>
          </div>
        </div>
        <div class="row">
          <button class="btn ghost sm" id="s-reset">${L("Nạp lại", "Reload")}</button>
          <button class="btn sm" id="s-phase">${L("Pha tiếp", "Next phase")}</button>
          <button class="btn ghost sm" id="s-cycle">${L("Hết 1 cycle", "Finish 1 cycle")}</button>
          <button class="btn ghost sm" id="s-run">${L("Chạy đến HALT", "Run to HALT")}</button>
        </div>
        <div id="sview" class="stack"></div>
        <details class="isa"><summary>${L("Bộ lệnh", "Instruction set")}</summary><div class="tw"><table class="t"><thead><tr><th>Opcode</th><th>${L("Lệnh", "Instruction")}</th><th>${L("Dạng", "Format")}</th><th>${L("Ý nghĩa", "Meaning")}</th></tr></thead><tbody>${ISA.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${esc(r[3])}</td></tr>`).join("")}</tbody></table></div>
        <p class="small muted">${L("Ô FE là bàn phím, ô FF là màn hình (memory-mapped I/O).", "Cell FE is the keyboard, cell FF is the screen (memory-mapped I/O).")}</p></details>`;
    const sync = () => { b.prog = $("#sprog").value; b.data = $("#sdata").value; b.kbd = $("#skbd").value; };
    ["#sprog", "#sdata", "#skbd"].forEach((id) => $(id).addEventListener("input", () => { startClock(); sync(); }));
    const act = (fn) => () => { startClock(); fn(); drawSim(key); };
    $("#s-reset").addEventListener("click", act(() => { sync(); resetSim(key); }));
    $("#s-phase").addEventListener("click", act(() => phaseStep(M[key])));
    $("#s-cycle").addEventListener("click", act(() => cycleStep(M[key])));
    $("#s-run").addEventListener("click", act(() => runAll(M[key])));
    drawSim(key);
  }

  function drawSim(key) {
    const m = M[key], v = $("#sview");
    if (!v) return;
    const shownPhase = m.halted ? null : m.phase;
    let h = `<div class="chips"><span class="small muted">${L("Pha kế tiếp:", "Next phase:")}</span>${["fetch", "decode", "execute"].map((p) => `<span class="chip${p === shownPhase ? " on" : ""}">${p}</span>`).join("")}${m.halted ? `<span class="chip ${m.err ? "warn" : "ok"}">${m.err ? L("lỗi", "error") : L("đã HALT", "halted")}</span>` : ""}</div>
      <div class="cpu">
        <div class="reg"><div class="k">PC</div><div class="v">${h2(m.PC)}</div><div class="d">${L("địa chỉ lệnh kế", "next instruction address")}</div></div>
        <div class="reg"><div class="k">IR</div><div class="v">${m.curAddr === null ? "——" : h4(m.IR)}</div><div class="d">${m.curAddr === null ? L("chưa fetch", "not fetched yet") : L("từ ô ", "from cell ") + h2(m.curAddr)}</div></div>
        <div class="reg"><div class="k">Machine cycle</div><div class="v">${m.cycles}</div><div class="d">${L("lệnh đã xong", "instructions done")}</div></div>
      </div>
      <div class="decoded">${m.dec ? esc(m.dec.text) : m.curAddr !== null && m.phase === "decode" ? L("Đã fetch, chờ decode…", "Fetched, waiting for decode…") : `<span class="small muted">${L("Kết quả decode hiện ở đây", "The decoded instruction appears here")}</span>`}</div>
      ${m.err ? `<p class="err">${esc(m.err)}</p>` : ""}
      <div><h3 class="sub-h">Registers</h3><div class="regs">${m.R.map((r, i) => `<div class="r${m.flashR === i ? " flash" : ""}"><span>R${i}</span>${h4(r)}</div>`).join("")}</div></div>`;
    const pa = [...m.progAddrs].sort((a, b) => a - b);
    const da = [...new Set([...m.dataAddrs, 0x40, 0x41, 0x42, 0x43, ...(m.flashM >= 0 && m.flashM < 0xfe ? [m.flashM] : [])])]
      .filter((a) => !m.progAddrs.has(a)).sort((a, b) => a - b);
    const nextAddr = m.halted ? -1 : (m.phase === "fetch" ? m.PC : m.curAddr);
    const left = Math.max(0, m.kbd.length - m.kp);
    h += `<div class="mem">
        <div><h3 class="sub-h">${L("Bộ nhớ chương trình", "Program memory")}</h3><div class="mcol">${pa.length ? pa.map((a) => `<div class="mrow${a === nextAddr ? " pc" : ""}"><span class="ad">${h2(a)}</span><span>${h4(m.mem[a])}</span><span class="dc">${esc(decode(m.mem[a]).name)}</span></div>`).join("") : `<p class="small muted">${L("Chưa có lệnh nào.", "No instructions yet.")}</p>`}</div></div>
        <div><h3 class="sub-h">${L("Bộ nhớ dữ liệu &amp; I/O", "Data memory &amp; I/O")}</h3><div class="mcol">${da.map((a) => `<div class="mrow${m.flashM === a ? " flash" : ""}"><span class="ad">${h2(a)}</span><span>${h4(m.mem[a])}</span><span class="dc">= ${m.mem[a]}</span></div>`).join("")}
          <div class="mrow"><span class="ad">FE</span><span class="dc">${L(`bàn phím · còn ${left} số`, `keyboard · ${left} left`)}${m.kp < m.kbd.length ? ": " + m.kbd.slice(m.kp).join(", ") : ""}</span></div>
          <div class="mrow${m.flashM === 0xff ? " flash" : ""}"><span class="ad">FF</span><span class="dc">${L("màn hình · ", "screen · ")}${m.out.length ? m.out.map((x) => `${x} (${h4(x)})`).join(", ") : L("trống", "empty")}</span></div>
        </div></div>
      </div>`;
    v.innerHTML = h;
  }

  /* ================= điều hướng ================= */
  function render() { renderDoors(); renderRoom(); renderBench(); hud(); }

  function newRun() {
    S = fresh();
    resetSim("sim3"); resetSim("sim4");
    enterPlay();
  }
  function enterPlay() {
    G.showScreen("play");
    render();
  }
  function showStart() {
    pauseClock();
    const canResume = !!S && !S.finished && (S.elapsed > 0 || S.solved.some(Boolean));
    $("#btn-resume").hidden = !canResume;
    $("#btn-start").textContent = canResume ? L("Chơi lại từ đầu", "Start over") : L("Vào trong máy →", "Enter the machine →");
    G.showScreen("start");
  }

  $("#btn-start").addEventListener("click", newRun);
  $("#btn-resume").addEventListener("click", enterPlay);
  $("#btn-again").addEventListener("click", newRun);
  // Cũng được gọi khi người chơi bấm Back giữa chừng: dừng đồng hồ, giữ nguyên tiến độ để "Chơi tiếp"
  $("#btn-menu").addEventListener("click", showStart);
})();
