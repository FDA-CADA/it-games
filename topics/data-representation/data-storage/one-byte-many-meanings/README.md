# 🔍 One Byte, Many Meanings

> **Chủ đề:** Data, Information & Their Representation · **Phần:** 2. Data Storage · **Slide:** 2.1 Data types (slide 40, 46)
> **Trạng thái:** ✅ Đã chơi được · **Thời lượng:** 5 phút

## Mục tiêu học tập

- Hiểu ý chính của slide 40 và 46: **bit không tự mang ý nghĩa**. Cùng một bit pattern, cách diễn giải khác nhau cho ý nghĩa khác nhau.
- Đọc một byte theo 4 cách: unsigned, two's complement, ASCII, pixel xám 8-bit.
- Nhận ra khi nào unsigned và two's complement trùng nhau (bit dấu = 0) và khi nào khác nhau.

## Lỗi sai nhắm tới

| Lỗi | Cách game bắt |
| --- | --- |
| Đọc two's complement như sign-and-magnitude (`10000101` → −5) | Nhận diện riêng và nhắc lại quy tắc "unsigned − 256" |
| Bỏ qua bit đầu khi đọc ASCII cho byte ≥ 128 | Đáp án nhiễu là ký tự của `v & 0x7F` |
| Nhầm hoa/thường trong ASCII | Đáp án nhiễu `v ^ 0x20` |
| Nghĩ 0 là trắng, 255 là đen | Đáp án nhiễu `255 − v` ở kính pixel xám |

## Cách chơi

- Mỗi vòng cho một byte (có ghi trọng số 128 … 1 dưới từng bit, bit dấu được tô viền).
- Sinh viên điền cả 4 "kính": gõ số unsigned, gõ số two's complement, chọn ký tự ASCII (hoặc "không có ký tự in được"), chọn ô xám.
- Bấm **Kiểm tra** (`Enter`): mỗi kính hiện ✓/✗ kèm lời giải, và game nhắc lại ý chính "cùng pattern, bốn ý nghĩa".

## Levels

| # | Tên | Byte được chọn | Vòng |
| --- | --- | --- | --- |
| 1 | Byte dương | 0–127, chủ yếu chữ cái và chữ số | 5 |
| 2 | Bit dấu bật | 128–255 | 5 |
| 3 | Hỗn hợp | 0–255, có cả ký tự điều khiển (LF, TAB…) | 6 |
| 4 | Không tra bảng | Như level 3 nhưng ẩn bảng tra nhanh | 6 |

## Tính điểm

+5 mỗi kính đúng, +5 thưởng nếu đúng cả 4 kính.

## Gợi ý dùng trên lớp

- Chiếu một byte, cho mỗi nhóm "đeo" một kính rồi đọc giá trị của nhóm mình.
- Liên hệ Data/AI: `np.frombuffer(b, dtype=np.uint8)` và `dtype=np.int8` cho ra hai mảng khác nhau từ cùng một dữ liệu. Đọc sai `dtype` là một lỗi thực tế.

## Ghi chú kỹ thuật

- Dùng `G.bits(v)` và `G.signed(bits)` trong `assets/js/common.js`.
- Đáp án nhiễu của ASCII và pixel xám được lọc để không trùng nhau (các ô xám cách nhau tối thiểu 40 mức).

## Ý tưởng mở rộng

- Thêm kính thứ 5: 2 chữ số BCD, hoặc một phần của số float.
- Chế độ ngược: cho ký tự 'A', hỏi byte đó là số âm hay dương theo two's complement.
