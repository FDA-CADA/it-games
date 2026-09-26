# 🎭 Mask Master

> **Chủ đề:** Data, Information & Their Representation · **Phần:** 3. Operations on Data · **Slide:** 3.1 Logic operations (applications)
> **Trạng thái:** ✅ Đã chơi được · **Thời lượng:** 8–10 phút · ⭐ Ưu tiên cao

## Mục tiêu học tập

- Dùng mask với phép logic: **OR để bật** (set), **AND để tắt** (clear), **XOR để đảo** (toggle) các bit được chọn.
- Biết bit nào của mask thì "giữ nguyên": OR 0, AND 1, XOR 0.
- Viết được mask **đúng cho mọi đầu vào** cho các việc thường gặp: lấy nibble, kiểm tra chẵn/lẻ, đổi hoa/thường, bật cờ quyền.

## Lỗi sai nhắm tới

- Dùng AND với mask có bit 1 ở chỗ cần tắt (ngược logic).
- Nghĩ rằng phải set/clear từng bit riêng lẻ, trong khi một mask xử lý nhiều bit cùng lúc.
- Viết mask chỉ đúng với một ví dụ chứ không đúng với mọi byte.

## Cách chơi

- Chọn phép toán **AND / OR / XOR** (level đầu chỉ mở một phép), bấm các bit của **Mask**. Dòng **Kết quả** cập nhật ngay, bit nào còn khác **Mục tiêu** thì được tô đỏ.
- Bấm **⚡ Áp dụng** (`Enter`) để dùng một lượt. Số lượt tối đa bằng số lượt tối thiểu + 2. Hết lượt thì game hiện lời giải.
- **Mask vạn năng:** game thử mask của bạn trên **toàn bộ** miền đầu vào (256 byte, hoặc 26 chữ thường), và hiện 4 ví dụ kèm ✓/✗. Mọi mask đúng đều được chấp nhận (ví dụ đổi chữ thường thành hoa: AND 0xDF hoặc XOR 0x20).

## Levels

| # | Tên | Phép toán | Lượt tối thiểu | Vòng |
| --- | --- | --- | --- | --- |
| 1 | Bật bit (set) | OR | 1 | 4 |
| 2 | Tắt bit (clear) | AND | 1 | 4 |
| 3 | Đảo bit (toggle) | XOR | 1 | 4 |
| 4 | Vừa bật vừa tắt | AND, OR | 2 | 4 |
| 5 | Mask vạn năng | AND, OR, XOR | 1 | 6 bài: nibble thấp, bật bit 7, đảo tất cả, chữ hoa, chẵn/lẻ, quyền ghi |

## Tính điểm

+15 nếu đạt số lượt tối thiểu, −4 cho mỗi lượt thừa (tối thiểu +5).

## Gợi ý dùng trên lớp

- Liên hệ: `chmod`/quyền file dùng bit flag; kiểm tra số lẻ `x & 1`; trong NumPy, lọc dữ liệu bằng boolean mask cũng cùng ý tưởng AND.
- Level 5 hợp làm bài tập nhóm: mỗi nhóm một bài, giải thích vì sao mask đúng với mọi byte.

## Ghi chú kỹ thuật

- Đề ở level 1–4 được sinh ngẫu nhiên nhưng luôn buộc phải đổi ít nhất 2 bit. Level 4 luôn cần cả bật lẫn tắt.
- `RULES` ở đầu `game.js`: mỗi bài gồm `f(x)` (kết quả mong muốn), `dom` (miền đầu vào) và `sol` (gợi ý hiện sau 3 lần sai).

## Ý tưởng mở rộng

- Thêm phép NOT và dịch bit để giải bài "lấy bit thứ k".
- Bài RGB: tách kênh G từ màu 24-bit bằng mask và shift.
