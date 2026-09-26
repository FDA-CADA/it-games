/* ==========================================================================
   catalog.js — DANH MỤC TẤT CẢ GAME. Trang chủ tự sinh từ file này.
   Thêm game mới: thêm một mục vào đúng section, đặt status:
     "ready"    đã chơi được (bắt buộc có path)
     "planned"  mới là ý tưởng, hiển thị "Sắp có"
   path luôn tính từ thư mục gốc của site và kết thúc bằng "/".
   ========================================================================== */
window.CATALOG = {
  course: "Nhập môn Công nghệ thông tin",
  audience: "Sinh viên khối ngành Khoa học dữ liệu & Trí tuệ nhân tạo",
  topics: [
    {
      id: "data-representation",
      title: "Data, Information & Their Representation",
      label: "Tuần 2",
      summary: "Hệ đếm, cách máy tính lưu trữ dữ liệu và các phép toán trên bit.",
      sections: [
        {
          id: "number-systems",
          title: "Number Systems",
          games: [
            {
              id: "bit-flip", title: "Bit Flip", icon: "💡", status: "ready",
              path: "topics/data-representation/number-systems/bit-flip/",
              skill: "1.1–1.4 Positional notation",
              desc: "Bật/tắt bóng đèn có trọng số để ra số thập phân mục tiêu. Level sau chuyển sang bánh xe hệ 8 và 16.",
            },
            {
              id: "hex-color-mixer", title: "Hex Color Mixer", icon: "🎨", status: "ready",
              path: "topics/data-representation/number-systems/hex-color-mixer/",
              skill: "1.3 Hexadecimal",
              desc: "Pha mã #RRGGBB cho khớp màu mẫu và đọc mã hex ra màu, như lập trình viên web vẫn làm.",
            },
            {
              id: "remainder-tower", title: "Remainder Tower", icon: "🧱", status: "ready",
              path: "topics/data-representation/number-systems/remainder-tower/",
              skill: "1.5 Decimal → base r",
              desc: "Chia liên tiếp, xếp số dư thành tháp rồi chọn đúng hướng đọc kết quả.",
            },
            {
              id: "bit-fishing", title: "Bit Fishing", icon: "🎣", status: "ready",
              path: "topics/data-representation/number-systems/bit-fishing/",
              skill: "1.5 Phần thập phân → nhị phân",
              desc: "Nhân 2 để câu từng bit. Có con cá câu mãi không hết. Bạn dừng ở đâu?",
            },
            {
              id: "bit-tetris", title: "Bit Tetris", icon: "🧩", status: "ready",
              path: "topics/data-representation/number-systems/bit-tetris/",
              skill: "1.5 Binary ↔ Octal/Hex",
              desc: "Cắt dãy bit đang rơi thành nhóm 3 hoặc 4 tính từ dấu chấm, mỗi nhóm nổ thành một chữ số.",
            },
            {
              id: "exact-or-approx", title: "Máy tính có lưu chính xác không?", icon: "🎯", status: "ready",
              path: "topics/data-representation/number-systems/exact-or-approx/",
              skill: "1.5 Giới hạn biểu diễn",
              desc: "Quick-fire: Exact hay Approximate? Tự tìm ra quy luật, rồi xem vì sao 0.1 + 0.2 ≠ 0.3.",
            },
          ],
        },
        {
          id: "data-storage",
          title: "Data Storage",
          games: [
            {
              id: "one-byte-many-meanings", title: "One Byte, Many Meanings", icon: "🔍", status: "ready",
              path: "topics/data-representation/data-storage/one-byte-many-meanings/",
              skill: "2.1 Data types",
              desc: "Cùng một byte, nhìn qua 4 kính lọc: unsigned, two's complement, ASCII, pixel xám.",
            },
            {
              id: "odometer-overflow", title: "Odometer Overflow", icon: "🚗", status: "ready",
              path: "topics/data-representation/data-storage/odometer-overflow/",
              skill: "2.2 Unsigned overflow",
              desc: "Đặt cược kết quả 11 + 9 trên đồng hồ 4-bit rồi xem số nhảy vòng.",
            },
            {
              id: "number-wheel", title: "Number Wheel", icon: "🎡", status: "ready",
              path: "topics/data-representation/data-storage/number-wheel/",
              skill: "2.2 Sign-magnitude vs two's complement",
              desc: "Xếp nhãn giá trị vào vòng 16 pattern 4-bit. Vì sao có −0? Vì sao −8..+7?",
            },
            {
              id: "negate-machine", title: "Negate Machine", icon: "⚙️", status: "ready",
              path: "topics/data-representation/data-storage/negate-machine/",
              skill: "2.2 Two's complement",
              desc: "Lắp và vận hành băng chuyền Invert → +1, rồi giải mã số âm như 11110110.",
            },
            {
              id: "float-builder", title: "Float Builder", icon: "🏗️", status: "ready",
              path: "topics/data-representation/data-storage/float-builder/",
              skill: "2.3 IEEE 754",
              desc: "Lắp Sign, Exponent, Mantissa để ra −6.75 theo 5 bước, và giải mã ngược lại.",
            },
            {
              id: "exponent-zones", title: "Exponent Zones", icon: "🌡️", status: "ready",
              path: "topics/data-representation/data-storage/exponent-zones/",
              skill: "2.3 Overflow & underflow",
              desc: "Kéo số mũ tới ∞ và về 0. Tìm biên, dự đoán kết quả, cứu xác suất khỏi underflow.",
            },
            {
              id: "ascii-spy", title: "ASCII Spy", icon: "🕵️", status: "ready",
              path: "topics/data-representation/data-storage/ascii-spy/",
              skill: "2.4 Text",
              desc: "Giải mã tin nhắn bit, mẹo lật bit 0x20, và vì sao ASCII không gõ được “Quốc dân”.",
            },
            {
              id: "sample-the-wave", title: "Sample the Wave", icon: "🔊", status: "ready",
              path: "topics/data-representation/data-storage/sample-the-wave/",
              skill: "2.4 Audio",
              desc: "Chỉnh sampling rate và bit depth, nghe thử, đạt chất lượng với ngân sách dung lượng.",
            },
            {
              id: "zoom-war", title: "Zoom War", icon: "🔎", status: "ready",
              path: "topics/data-representation/data-storage/zoom-war/",
              skill: "2.4 Image",
              desc: "Zoom liên tục: raster vỡ pixel, vector vẫn nét. Khi nào dùng loại nào?",
            },
            {
              id: "storage-budget", title: "Storage Budget", icon: "💾", status: "ready",
              path: "topics/data-representation/data-storage/storage-budget/",
              skill: "2.4 Image, audio, video",
              desc: "Ước lượng dung lượng ảnh, âm thanh, video. Boss: 640×480×24-bit×120fps×10s.",
            },
          ],
        },
        {
          id: "operations",
          title: "Operations on Data",
          games: [
            { id: "mask-master", title: "Mask Master", icon: "🎭", status: "planned", skill: "3.1 Logic", desc: "Dùng AND/OR/XOR và mask để set, clear, toggle bit." },
            { id: "xor-messenger", title: "XOR Secret Messenger", icon: "✉️", status: "planned", skill: "3.1 Logic", desc: "Mã hóa và giải mã theo cặp bằng XOR." },
            { id: "find-flipped-bit", title: "Find the Flipped Bit", icon: "📡", status: "planned", skill: "3.1 Logic", desc: "Parity bit và kênh nhiễu." },
            { id: "bit-conveyor", title: "Bit Conveyor", icon: "🏭", status: "planned", skill: "3.2 Shift", desc: "Logical, circular và arithmetic shift." },
            { id: "overflow-detective", title: "Overflow Detective", icon: "🚨", status: "planned", skill: "3.3 Arithmetic", desc: "Dự đoán kết quả và cờ overflow của phép cộng/trừ bù 2." },
          ],
        },
      ],
    },
  ],
};
