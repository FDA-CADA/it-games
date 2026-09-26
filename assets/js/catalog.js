/* ==========================================================================
   catalog.js — DANH MỤC TẤT CẢ GAME. Trang chủ tự sinh từ file này.
   Thêm game mới: thêm một mục vào đúng section, đặt status:
     "ready"    đã chơi được (bắt buộc có path)
     "planned"  mới là ý tưởng, hiển thị "Sắp có"
   path luôn tính từ thư mục gốc của site và kết thúc bằng "/".
   Chữ hiển thị có thể là chuỗi (giống nhau ở mọi ngôn ngữ) hoặc { vi, en }.
   ========================================================================== */
window.CATALOG = {
  course: { vi: "Nhập môn Công nghệ thông tin", en: "Introduction to Information Technology" },
  audience: { vi: "Sinh viên khối ngành Khoa học dữ liệu & Trí tuệ nhân tạo", en: "Data Science & AI students" },
  topics: [
    {
      id: "data-representation",
      title: "Data, Information & Their Representation",
      label: { vi: "Tuần 2", en: "Week 2" },
      summary: {
        vi: "Hệ đếm, cách máy tính lưu trữ dữ liệu và các phép toán trên bit.",
        en: "Number systems, how computers store data, and operations on bits.",
      },
      sections: [
        {
          id: "number-systems",
          title: "Number Systems",
          games: [
            {
              id: "bit-flip", title: "Bit Flip", icon: "💡", status: "ready",
              path: "topics/data-representation/number-systems/bit-flip/",
              skill: "1.1–1.4 Positional notation",
              desc: {
                vi: "Bật/tắt bóng đèn có trọng số để ra số thập phân mục tiêu. Level sau chuyển sang bánh xe hệ 8 và 16.",
                en: "Switch weighted light bulbs on and off to hit a decimal target. Later levels use base-8 and base-16 dials.",
              },
            },
            {
              id: "hex-color-mixer", title: "Hex Color Mixer", icon: "🎨", status: "ready",
              path: "topics/data-representation/number-systems/hex-color-mixer/",
              skill: "1.3 Hexadecimal",
              desc: {
                vi: "Pha mã #RRGGBB cho khớp màu mẫu và đọc mã hex ra màu, như lập trình viên web vẫn làm.",
                en: "Mix #RRGGBB codes to match a colour and read hex codes as colours, just like web developers do.",
              },
            },
            {
              id: "remainder-tower", title: "Remainder Tower", icon: "🧱", status: "ready",
              path: "topics/data-representation/number-systems/remainder-tower/",
              skill: "1.5 Decimal → base r",
              desc: {
                vi: "Chia liên tiếp, xếp số dư thành tháp rồi chọn đúng hướng đọc kết quả.",
                en: "Divide repeatedly, stack the remainders into a tower, then pick the right reading direction.",
              },
            },
            {
              id: "bit-fishing", title: "Bit Fishing", icon: "🎣", status: "ready",
              path: "topics/data-representation/number-systems/bit-fishing/",
              skill: { vi: "1.5 Phần thập phân → nhị phân", en: "1.5 Fractions → binary" },
              desc: {
                vi: "Nhân 2 để câu từng bit. Có con cá câu mãi không hết. Bạn dừng ở đâu?",
                en: "Multiply by 2 to catch one bit at a time. Some fish never run out. Where do you stop?",
              },
            },
            {
              id: "bit-tetris", title: "Bit Tetris", icon: "🧩", status: "ready",
              path: "topics/data-representation/number-systems/bit-tetris/",
              skill: "1.5 Binary ↔ Octal/Hex",
              desc: {
                vi: "Cắt dãy bit đang rơi thành nhóm 3 hoặc 4 tính từ dấu chấm, mỗi nhóm nổ thành một chữ số.",
                en: "Cut falling bit strings into groups of 3 or 4 counted from the point. Each group explodes into one digit.",
              },
            },
            {
              id: "exact-or-approx", title: { vi: "Máy tính có lưu chính xác không?", en: "Exact or Approximate?" }, icon: "🎯", status: "ready",
              path: "topics/data-representation/number-systems/exact-or-approx/",
              skill: { vi: "1.5 Giới hạn biểu diễn", en: "1.5 Representation limits" },
              desc: {
                vi: "Quick-fire: Exact hay Approximate? Tự tìm ra quy luật, rồi xem vì sao 0.1 + 0.2 ≠ 0.3.",
                en: "Quick-fire: can the computer store it exactly? Discover the rule, then see why 0.1 + 0.2 ≠ 0.3.",
              },
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
              desc: {
                vi: "Cùng một byte, nhìn qua 4 kính lọc: unsigned, two's complement, ASCII, pixel xám.",
                en: "One byte through four lenses: unsigned, two's complement, ASCII and a grayscale pixel.",
              },
            },
            {
              id: "odometer-overflow", title: "Odometer Overflow", icon: "🚗", status: "ready",
              path: "topics/data-representation/data-storage/odometer-overflow/",
              skill: "2.2 Unsigned overflow",
              desc: {
                vi: "Đặt cược kết quả 11 + 9 trên đồng hồ 4-bit rồi xem số nhảy vòng.",
                en: "Bet on 11 + 9 on a 4-bit odometer, then watch the counter wrap around.",
              },
            },
            {
              id: "number-wheel", title: "Number Wheel", icon: "🎡", status: "ready",
              path: "topics/data-representation/data-storage/number-wheel/",
              skill: "2.2 Sign-magnitude vs two's complement",
              desc: {
                vi: "Xếp nhãn giá trị vào vòng 16 pattern 4-bit. Vì sao có −0? Vì sao −8..+7?",
                en: "Place value labels on a wheel of 16 four-bit patterns. Why is there a −0? Why −8..+7?",
              },
            },
            {
              id: "negate-machine", title: "Negate Machine", icon: "⚙️", status: "ready",
              path: "topics/data-representation/data-storage/negate-machine/",
              skill: "2.2 Two's complement",
              desc: {
                vi: "Lắp và vận hành băng chuyền Invert → +1, rồi giải mã số âm như 11110110.",
                en: "Build and run an Invert → +1 conveyor, then decode negatives such as 11110110.",
              },
            },
            {
              id: "float-builder", title: "Float Builder", icon: "🏗️", status: "ready",
              path: "topics/data-representation/data-storage/float-builder/",
              skill: "2.3 IEEE 754",
              desc: {
                vi: "Lắp Sign, Exponent, Mantissa để ra −6.75 theo 5 bước, và giải mã ngược lại.",
                en: "Assemble Sign, Exponent and Mantissa to build −6.75 in 5 steps, and decode the other way.",
              },
            },
            {
              id: "exponent-zones", title: "Exponent Zones", icon: "🌡️", status: "ready",
              path: "topics/data-representation/data-storage/exponent-zones/",
              skill: "2.3 Overflow & underflow",
              desc: {
                vi: "Kéo số mũ tới ∞ và về 0. Tìm biên, dự đoán kết quả, cứu xác suất khỏi underflow.",
                en: "Drag the exponent to ∞ and down to 0. Find the limits, predict results, rescue probabilities from underflow.",
              },
            },
            {
              id: "ascii-spy", title: "ASCII Spy", icon: "🕵️", status: "ready",
              path: "topics/data-representation/data-storage/ascii-spy/",
              skill: "2.4 Text",
              desc: {
                vi: "Giải mã tin nhắn bit, mẹo lật bit 0x20, và vì sao ASCII không gõ được “Quốc dân”.",
                en: "Decode bit messages, learn the 0x20 bit-flip trick, and see why ASCII cannot write “Quốc dân”.", // i18n-ok: tên riêng
              },
            },
            {
              id: "sample-the-wave", title: "Sample the Wave", icon: "🔊", status: "ready",
              path: "topics/data-representation/data-storage/sample-the-wave/",
              skill: "2.4 Audio",
              desc: {
                vi: "Chỉnh sampling rate và bit depth, nghe thử, đạt chất lượng với ngân sách dung lượng.",
                en: "Tune sampling rate and bit depth, listen, and hit the quality target within a storage budget.",
              },
            },
            {
              id: "zoom-war", title: "Zoom War", icon: "🔎", status: "ready",
              path: "topics/data-representation/data-storage/zoom-war/",
              skill: "2.4 Image",
              desc: {
                vi: "Zoom liên tục: raster vỡ pixel, vector vẫn nét. Khi nào dùng loại nào?",
                en: "Keep zooming: raster turns into pixels, vector stays sharp. When should you use which?",
              },
            },
            {
              id: "storage-budget", title: "Storage Budget", icon: "💾", status: "ready",
              path: "topics/data-representation/data-storage/storage-budget/",
              skill: "2.4 Image, audio, video",
              desc: {
                vi: "Ước lượng dung lượng ảnh, âm thanh, video. Boss: 640×480×24-bit×120fps×10s.",
                en: "Estimate the size of images, audio and video. Boss: 640×480×24-bit×120fps×10s.",
              },
            },
          ],
        },
        {
          id: "operations",
          title: "Operations on Data",
          games: [
            {
              id: "mask-master", title: "Mask Master", icon: "🎭", status: "ready",
              path: "topics/data-representation/operations/mask-master/",
              skill: "3.1 Logic operations",
              desc: {
                vi: "Dùng AND, OR, XOR và mask để set, clear, toggle đúng các bit với ít lượt nhất.",
                en: "Use AND, OR, XOR and a mask to set, clear and toggle exactly the right bits in as few moves as possible.",
              },
            },
            {
              id: "xor-messenger", title: "XOR Secret Messenger", icon: "✉️", status: "ready",
              path: "topics/data-representation/operations/xor-messenger/",
              skill: "3.1 XOR",
              desc: {
                vi: "Mã hóa và giải mã bằng XOR, phá khóa, và gửi tin mật cho bạn cùng bàn.",
                en: "Encrypt and decrypt with XOR, break a key, and send secret messages to your classmate.",
              },
            },
            {
              id: "find-flipped-bit", title: "Find the Flipped Bit", icon: "📡", status: "ready",
              path: "topics/data-representation/operations/find-flipped-bit/",
              skill: "3.1 Parity",
              desc: {
                vi: "Tính parity, bắt gói tin lỗi qua kênh nhiễu, và sửa lỗi bằng parity 2 chiều.",
                en: "Compute parity, catch corrupted packets from a noisy channel, and fix errors with 2D parity.",
              },
            },
            {
              id: "bit-conveyor", title: "Bit Conveyor", icon: "🏭", status: "ready",
              path: "topics/data-representation/operations/bit-conveyor/",
              skill: "3.2 Shift operations",
              desc: {
                vi: "Logical, circular, arithmetic shift: đưa pattern về đích với ít bước nhất.",
                en: "Logical, circular and arithmetic shifts: move a pattern to its target in the fewest steps.",
              },
            },
            {
              id: "overflow-detective", title: "Overflow Detective", icon: "🚨", status: "ready",
              path: "topics/data-representation/operations/overflow-detective/",
              skill: "3.3 Two's complement arithmetic",
              desc: {
                vi: "Cộng, trừ bù 2 trên 4 và 6 bit, rồi bật cờ overflow đúng lúc.",
                en: "Add and subtract in two's complement on 4 and 6 bits, and raise the overflow flag at the right time.",
              },
            },
          ],
        },
      ],
    },
  ],
};
