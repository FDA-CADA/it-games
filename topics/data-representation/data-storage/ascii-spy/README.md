# 🕵️ ASCII Spy

> **Chủ đề:** Data, Information & Their Representation · **Phần:** 2. Data Storage · **Slide:** 2.4 Text (ASCII, Unicode)
> **Trạng thái:** ✅ Đã chơi được · **Thời lượng:** 8–10 phút

## Mục tiêu học tập

- Đọc văn bản dạng bit/hex bằng bảng ASCII, dùng các mốc 'A' = 65, 'a' = 97, '0' = 48.
- Phát hiện mẹo **0x20**: chữ hoa và chữ thường chỉ khác đúng một bit (trọng số 32).
- Thấy giới hạn của ASCII với tiếng Việt, rồi hiểu Unicode/UTF-8: **số ký tự ≠ số byte**.
- Nhận ra lỗi font `Kinh táº¿ Quá»‘c dÃ¢n` là do đọc sai encoding (rất hay gặp khi đọc CSV tiếng Việt).

## Lỗi sai nhắm tới

- Nhầm hoa/thường khi tra ASCII (game nhắc riêng).
- Nghĩ rằng đổi hoa ↔ thường cần tra bảng, trong khi chỉ cần lật một bit.
- Nghĩ rằng mỗi ký tự luôn là 1 byte (`len(s)` bằng số byte).
- Không biết lỗi font là do encoding chứ không phải do thiếu font.

## Cách chơi

- **Giải mã:** mỗi byte là một ô, gõ ký tự tương ứng (con trỏ tự nhảy sang ô sau), rồi bấm **Giải mã**. Bảng ASCII 32–126 mở sẵn ở level 1–2.
- **Mẹo 0x20:** trước tiên so sánh 'A' và 'a' rồi bấm vào bit khác nhau. Sau đó đổi `hello → HELLO`, `DATA → data`, `NeU → nEu` bằng cách lật bit, càng ít lần càng tốt.
- **Kinh tế Quốc dân:** bảng mã hóa trực tiếp (sửa được nội dung) gồm ký tự, mã Unicode, ASCII 7 bit (❌ nếu > 127), các byte UTF-8, và dòng chữ lỗi khi đọc nhầm bằng Windows-1252. Sau đó trả lời 5 câu hỏi.

## Levels

| # | Tên | Nội dung | Số nhiệm vụ |
| --- | --- | --- | --- |
| 1 | Giải mã nhị phân | Từ 2–5 ký tự (HI, NEU, DATA, CR7…) | 4 |
| 2 | Giải mã hex | Có chữ thường và dấu câu (Hi, Spy, x=42…) | 4 |
| 3 | Mẹo 0x20 | Tìm bit khác nhau + 3 bài lật bit | 4 |
| 4 | Kinh tế Quốc dân | Bảng Unicode/UTF-8 + 5 câu hỏi | 5 |

## Tính điểm

- Giải mã: +2 mỗi ký tự, +5 nếu đúng cả tin nhắn ngay lần đầu.
- Tìm bit 0x20: +10. Lật bit: +15 nếu số lần lật đúng bằng mức tối thiểu, trừ 2 cho mỗi lần lật thừa (tối thiểu +5).
- Câu hỏi: +10 mỗi câu đúng ngay lần đầu.

## Gợi ý dùng trên lớp

- Trong Python: `ord('A')`, `chr(97)`, `'Quốc'.encode()`, `len('Quốc')` so với `len('Quốc'.encode())`.
- Với pandas: `pd.read_csv(f, encoding='utf-8')` và hỏi *"Nếu dùng `encoding='latin-1'` thì sao?"*.

## Ghi chú kỹ thuật

- Bảng mã hóa dùng `TextEncoder` (UTF-8) và `TextDecoder('windows-1252')` của trình duyệt, nên dòng chữ lỗi là lỗi **thật**, không phải viết sẵn.
- Đáp án câu hỏi về số byte cũng được tính bằng `TextEncoder`.

## Ý tưởng mở rộng

- Emoji và ký tự 4 byte (😀 = F0 9F 98 80), cặp surrogate trong JavaScript.
- Chế độ hai người: gửi tin nhắn bit cho nhau (kết hợp với XOR Secret Messenger).
