# ✉️ XOR Secret Messenger

> **Chủ đề:** Data, Information & Their Representation · **Phần:** 3. Operations on Data · **Slide:** 3.1 Logic operations (XOR)
> **Trạng thái:** ✅ Đã chơi được · **Thời lượng:** 8–10 phút · 👥 Có chế độ chơi theo cặp

## Mục tiêu học tập

- Tính XOR từng bit (giống nhau ra 0, khác nhau ra 1).
- Hiểu tính chất (P ⊕ K) ⊕ K = P: **cùng một phép toán** dùng cho cả mã hóa lẫn giải mã.
- Thấy điểm yếu khi dùng lại khóa: biết một cặp (P, C) là suy ra K = P ⊕ C.
- Biết về one-time pad, và rằng XOR có mặt trong mật mã hiện đại.

## Lỗi sai nhắm tới

- Nhầm XOR với OR (1 ⊕ 1 = 0, không phải 1).
- Nghĩ rằng giải mã cần một phép "ngược" khác.
- Nghĩ rằng mã hóa XOR với khóa ngắn là an toàn.

## Cách chơi

- **Mã hóa / Giải mã / Tìm khóa:** hai hàng bit đã cho, bấm các bit của hàng thứ ba. Bit sai được tô đỏ khi kiểm tra.
- **Tin từ tổng bộ:** mỗi byte của từ (dạng hex và bit) đã XOR với khóa 1 ký tự. Giải mã từng byte rồi gõ ký tự vào ô.
- **Phá mã:** tìm khóa từ một cặp (tin gốc, bản mã), rồi phá cả tin nhắn khi chỉ biết chữ cái đầu tiên (kỹ thuật "crib").
- **👥 Chơi theo cặp** (nút ở màn hình đầu): tab *Gửi* mã hóa tin nhắn bằng khóa bí mật (lặp lại cho đủ độ dài) và cho ra chuỗi hex để sao chép. Tab *Nhận* dán hex và khóa để đọc tin. Gõ sai khóa sẽ thấy tin bị méo.

## Levels

| # | Tên | Nội dung | Nhiệm vụ |
| --- | --- | --- | --- |
| 1 | Mã hóa | C = P ⊕ K | 3 |
| 2 | Giải mã | P = C ⊕ K | 3 |
| 3 | Tin từ tổng bộ | Giải mã từ 3–5 ký tự | 3 |
| 4 | Phá mã | Tìm K, phá tin bằng crib, câu hỏi về dùng lại khóa | 3 |

## Tính điểm

+10 nếu đúng ngay lần đầu, +4 nếu đúng sau khi sửa.

## Gợi ý dùng trên lớp

- Chia cặp: một bạn gửi, một bạn nhận qua Zalo/Messenger. Thử để bạn thứ ba (không có khóa) đoán nội dung.
- Python: `bytes(a ^ b for a, b in zip(msg, key))`.

## Ghi chú kỹ thuật

- Chế độ cặp dùng `TextEncoder`/`TextDecoder`, nên gõ tiếng Việt có dấu vẫn chạy (mỗi ký tự có dấu thành nhiều byte, game có cảnh báo).
- Không gửi dữ liệu đi đâu: mọi thứ tính trên trình duyệt.

## Ý tưởng mở rộng

- Phá khóa lặp nhiều byte bằng phân tích tần suất chữ cái.
- Mã hóa ảnh bằng XOR và cho thấy dùng lại khóa làm lộ hình (hai ảnh XOR với nhau).
