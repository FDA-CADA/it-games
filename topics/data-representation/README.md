# Data, Information & Their Representation (Tuần 2)

Tuần 2 bám theo slide _Data, Information, and Their Representation_, gồm 3 phần: Number Systems → Data Storage → Operations on Data.

## Trạng thái

| Phần | Game | Trạng thái | Tài liệu |
| --- | --- | --- | --- |
| 1. Number Systems | 💡 Bit Flip | ✅ | [README](number-systems/bit-flip/README.md) |
| | 🎨 Hex Color Mixer | ✅ | [README](number-systems/hex-color-mixer/README.md) |
| | 🧱 Remainder Tower | ✅ | [README](number-systems/remainder-tower/README.md) |
| | 🎣 Bit Fishing | ✅ | [README](number-systems/bit-fishing/README.md) |
| | 🧩 Bit Tetris | ✅ | [README](number-systems/bit-tetris/README.md) |
| | 🎯 Máy tính có lưu chính xác không? | ✅ | [README](number-systems/exact-or-approx/README.md) |
| 2. Data Storage | 🔍 One Byte, Many Meanings | ✅ | [README](data-storage/one-byte-many-meanings/README.md) |
|  | 🚗 Odometer Overflow | ✅ | [README](data-storage/odometer-overflow/README.md) |
|  | 🎡 Number Wheel | ✅ | [README](data-storage/number-wheel/README.md) |
|  | ⚙️ Negate Machine | ✅ | [README](data-storage/negate-machine/README.md) |
|  | 🏗️ Float Builder | ✅ | [README](data-storage/float-builder/README.md) |
|  | 🌡️ Exponent Zones | ✅ | [README](data-storage/exponent-zones/README.md) |
|  | 🕵️ ASCII Spy | ✅ | [README](data-storage/ascii-spy/README.md) |
|  | 🔊 Sample the Wave | ✅ | [README](data-storage/sample-the-wave/README.md) |
|  | 🔎 Zoom War | ✅ | [README](data-storage/zoom-war/README.md) |
|  | 💾 Storage Budget | ✅ | [README](data-storage/storage-budget/README.md) |
| 3. Operations on Data | 🎭 Mask Master | ✅ | [README](operations/mask-master/README.md) |
|  | ✉️ XOR Secret Messenger | ✅ | [README](operations/xor-messenger/README.md) |
|  | 📡 Find the Flipped Bit | ✅ | [README](operations/find-flipped-bit/README.md) |
|  | 🏭 Bit Conveyor | ✅ | [README](operations/bit-conveyor/README.md) |
|  | 🚨 Overflow Detective | ✅ | [README](operations/overflow-detective/README.md) |

**Thứ tự chơi gợi ý cho phần 1:** Bit Flip → Hex Color Mixer → Remainder Tower → Bit Fishing → Bit Tetris → Máy tính có lưu chính xác không?

**Thứ tự chơi gợi ý cho phần 2:** One Byte, Many Meanings → Odometer Overflow → Number Wheel → Negate Machine → Float Builder → Exponent Zones → ASCII Spy → Sample the Wave → Zoom War → Storage Budget

**Thứ tự chơi gợi ý cho phần 3:** Mask Master → XOR Secret Messenger → Find the Flipped Bit → Bit Conveyor → Overflow Detective

Toàn bộ 21 ý tưởng bên dưới đã được làm thành game. Phần ý tưởng được giữ lại làm tài liệu thiết kế gốc. Chi tiết của bản đã làm (level, cách tính điểm, ghi chú kỹ thuật) nằm trong README riêng của từng game.

---

# Ý tưởng game (thiết kế gốc)

## 1. Number Systems

**1.1–1.4 Positional notation (bin/oct/hex)**

- **Bit Flip:** Màn hình có 8 "bóng đèn", mỗi bóng ghi trọng số 128…1. Sinh viên bật/tắt bóng để đạt số thập phân mục tiêu trong thời gian giới hạn. Các level sau đổi sang base 8/16, lúc này mỗi ô là một "bánh xe" quay 0–7 hoặc 0–F. Game giúp các em _cảm_ được trọng số vị trí thay vì học thuộc công thức.
- **Hex Color Mixer:** Hiển thị một màu, sinh viên gõ mã `#RRGGBB` để khớp màu, có thanh đo "độ gần". Nối trực tiếp với ví dụ `#FF5733` trên slide và cho thấy hex được dùng thật ngoài đời.

**1.5 Conversion**

- **Remainder Tower (decimal → base r):** Mỗi lần chia, số dư rơi xuống thành một khối xếp chồng. Cuối cùng sinh viên phải chọn hướng đọc: từ dưới lên hay từ trên xuống. Game bắt đúng lỗi kinh điển là quên đảo ngược thứ tự số dư.
- **Bit Fishing (phần thập phân):** Mỗi lần nhân 2, phần nguyên "câu" được bit 0 hoặc 1. Với 0.26, câu mãi không hết, nên sinh viên phải quyết định dừng ở đâu. Đây là cách dẫn tự nhiên sang floating-point error.
- **Bit Tetris (bin ↔ oct/hex):** Dãy bit rơi xuống, người chơi cắt thành nhóm 3 hoặc 4 bit tính từ dấu chấm. Mỗi nhóm đúng sẽ "nổ" thành một chữ số oct/hex. Game luyện quy tắc nhóm từ phải sang trái cho phần nguyên và từ trái sang phải cho phần thập phân.
- **"Máy tính có lưu chính xác không?":** Dạng quick-fire, cho 0.5, 0.1, 0.375, 0.26… và sinh viên chọn _Exact_ hoặc _Approximate_. Qua vài vòng, các em tự phát hiện quy luật mẫu số là lũy thừa của 2. Kết thúc bằng màn reveal `0.1 + 0.2 = 0.30000000000000004`.

## 2. Data Storage

**2.1 Data types**

- **One Byte, Many Meanings:** Cho một byte, ví dụ `01000001`, và bốn "kính lọc": unsigned, two's complement, ASCII, pixel grayscale. Sinh viên đoán giá trị qua từng kính. Game minh họa ý chính của slide 40 và 46: cùng bit pattern, khác cách diễn giải thì khác ý nghĩa.

**2.2 Integers**

- **Odometer Overflow:** Đồng hồ công-tơ-mét 4-bit, sinh viên đặt cược kết quả của `11 + 9` trước khi xe chạy, rồi xem số nhảy vòng về 4.
- **Number Wheel:** Một vòng tròn 16 ô chứa các pattern 4-bit. Sinh viên kéo nhãn giá trị vào đúng ô theo chế độ sign-and-magnitude, rồi làm lại theo two's complement. Khi đặt hai chế độ cạnh nhau, các em thấy rõ vì sao có "−0" và vì sao dải two's complement lệch (−8..+7).
- **Negate Machine:** Một băng chuyền hai trạm là _Invert_ và _+1_. Sinh viên đưa số qua đúng thứ tự trạm để ra số âm, chơi tính giờ. Có level đảo ngược: cho `11110110`, tìm giá trị thập phân.

**2.3 Real numbers (IEEE 754)**

- **Float Builder:** Có 3 khu kéo thả là Sign (1), Exponent (8) và Mantissa (23), mục tiêu là lắp ra −6.75. Game có gợi ý từng bước theo đúng 5 bước trên slide 65, và chế độ decode làm ngược lại.
- **Exponent Zones:** Một thanh trượt exponent, khi kéo quá phải thì giá trị thành ∞, quá trái thì thành 0. Minh họa overflow và underflow bằng trực giác.

**2.4 Text, audio, image, video**

- **ASCII Spy:** Giải mã tin nhắn bí mật dạng bit. Ở level bonus, sinh viên phát hiện mẹo lật một bit (0x20) để đổi hoa ↔ thường. Level cuối yêu cầu gõ "Kinh tế Quốc dân" bằng ASCII và thấy thất bại, từ đó dẫn sang Unicode.
- **Sample the Wave:** Có sóng âm, hai thanh trượt _sampling rate_ và _bit depth_. Sinh viên nghe bản tái tạo qua Web Audio và xem dung lượng file nhảy theo. Nhiệm vụ: đạt chất lượng "chấp nhận được" với ngân sách dung lượng cố định.
- **Zoom War (raster vs vector):** Hai hình giống nhau, zoom liên tục; hình raster vỡ pixel còn hình vector vẫn nét.
- **Storage Budget:** Cho một clip với độ phân giải, fps, bit depth và thời lượng. Sinh viên ước lượng dung lượng, chọn đáp án đúng trong 4 phương án thuộc các "bậc" KB/MB/GB. Bài 640×480×24-bit×120fps×10s trên slide 81 dùng làm boss level được.

## 3. Operations on Data

**3.1 Logic operations**

- **Mask Master:** Cho byte ban đầu và byte mục tiêu. Sinh viên chọn toán tử (AND/OR/XOR) và tự viết mask để set, clear hoặc toggle đúng các bit, với số lượt giới hạn. Đây là game "puzzle" nhất, rất hợp cho phần applications.
- **XOR Secret Messenger:** Chơi theo cặp. Một bạn mã hóa bằng key, bạn kia giải mã bằng cách XOR lại cùng key.
- **Find the Flipped Bit:** Dữ liệu kèm parity bit truyền qua "kênh nhiễu". Sinh viên phát hiện gói tin nào bị lỗi.

**3.2 Shift operations**

- **Bit Conveyor:** Cho pattern ban đầu và pattern đích. Sinh viên chọn chuỗi thao tác logical, circular hoặc arithmetic shift với số bước ít nhất. Game có màn so sánh arithmetic right shift với logical right shift trên −42 để thấy sign bit được giữ lại.

**3.3 Arithmetic (two's complement)**

- **Overflow Detective:** Hiện phép cộng hoặc trừ 4-bit/6-bit. Sinh viên dự đoán kết quả _và_ bật cờ overflow nếu có. Phép trừ bắt buộc làm qua bước "cộng số bù 2", đúng với ý chính của slide 107 là phần cứng chỉ cần một mạch cộng.

## Gợi ý triển khai

- **Nếu cần chọn ít, nên ưu tiên:** Remainder Tower, Number Wheel, Float Builder và Mask Master. Bốn phần này sinh viên hay sai nhất, và cũng khó hiểu nhất nếu chỉ nhìn slide.
- Mỗi game làm thành một trang HTML độc lập, chơi 5–10 phút. Có thể đặt ngay sau các slide _Assignment_: các em chơi game trước rồi mới làm bài tập giấy.
