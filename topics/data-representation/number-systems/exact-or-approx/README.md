# 🎯 Máy tính có lưu chính xác không?

> **Chủ đề:** Data, Information & Their Representation · **Phần:** 1. Number Systems · **Slide:** 1.5 (giới hạn biểu diễn), dẫn sang 2.3 IEEE 754
> **Trạng thái:** ✅ Đã chơi được · **Thời lượng:** 3–5 phút

## Mục tiêu học tập

- Tự **phát hiện** quy luật: một số thập phân được lưu chính xác trong hệ 2 khi và chỉ khi phân số tối giản của nó có **mẫu là lũy thừa của 2**.
- Hiểu hậu quả thực tế: `0.1 + 0.2 != 0.3`.
- Với sinh viên Data/AI: biết dùng `math.isclose` / `np.isclose` thay cho `==`, và dùng `Decimal` hoặc số nguyên cho tiền tệ.

## Lỗi sai nhắm tới

- Tin rằng số có ít chữ số (0.1) thì máy lưu chính xác.
- Nghĩ lỗi `0.30000000000000004` là bug của Python/JavaScript chứ không phải bản chất của hệ 2.

## Cách chơi

1. **Quick-fire:** mỗi câu hiện một số. Chọn **Chính xác** (`←`/`E`) hoặc **Gần đúng** (`→`/`A`) trước khi hết giờ. Sau mỗi câu có giải thích, ví dụ `0.375 = 3/8, mẫu 8 = 2³ → 0.011₂`.
2. **Đoán quy luật:** chọn 1 trong 4 giả thuyết. Chọn sai sẽ nhận **phản ví dụ** cụ thể.
3. **Reveal:**
   - Bấm ▶ Chạy để trình duyệt tự tính `0.1 + 0.2` và `0.1 + 0.2 == 0.3` (JS dùng double IEEE 754, giống Python).
   - Hiện giá trị **thật sự** được lưu cho 0.1: `0.1000000000000000055511151231257827…`, phần lệch tô đỏ.
   - *Thử số của bạn:* gõ bất kỳ số nào để xem phân số, dạng nhị phân, giá trị máy lưu, và sai số.

Có nút *"Vào thẳng phòng thí nghiệm"* để giảng viên demo phần reveal mà không cần chơi.

## Levels

| # | Tên | Số câu | Giây/câu |
| --- | --- | --- | --- |
| 1 | Quick-fire | 12 (6 exact + 6 approx) | 8 |
| 2 | Siêu tốc | 16 (8 + 8) | 5 |

Ngân hàng câu hỏi nằm trong `EXACT` và `APPROX` ở đầu [game.js](game.js).

## Tính điểm

- Mỗi câu đúng: `10 + số giây còn lại`.
- Đoán đúng quy luật ngay lần đầu: +20.

## Gợi ý dùng trên lớp

- Chơi sau Bit Fishing: sinh viên đã "câu" 0.1 và thấy nó không hết.
- Mở Python ngay trên lớp: `0.1 + 0.2`, `sum([0.1] * 10) == 1.0`, `round(2.675, 2)` (ra 2.67!).

## Ghi chú kỹ thuật

- `storedParts(x)` đọc 64 bit của số double qua `DataView`, rồi tính **chính xác** giá trị thập phân bằng `BigInt` (m·2^e = m·5^−e / 10^−e). Không có bước làm tròn nào.
- Phân số và dạng nhị phân dùng `BigInt` để an toàn với số dài.

## Ý tưởng mở rộng

- Thêm câu "bẫy" dạng phân số (1/3, 3/16) và số rất lớn (2⁵³ + 1).
- Hiển thị 64 bit sign/exponent/mantissa của số vừa thử, nối sang game Float Builder.
