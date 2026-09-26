# 💡 Bit Flip

> **Chủ đề:** Data, Information & Their Representation · **Phần:** 1. Number Systems · **Slide:** 1.1–1.4 Positional notation
> **Trạng thái:** ✅ Đã chơi được · **Thời lượng:** 3–5 phút/level

## Mục tiêu học tập

Sau khi chơi, sinh viên:

- Hiểu giá trị một chữ số phụ thuộc vào **vị trí**: trọng số = cơ số^vị trí.
- Đổi nhanh hệ 2/8/16 sang hệ 10 bằng cách cộng trọng số, không cần học thuộc công thức.
- Có phản xạ "xét trọng số lớn nhất trước" (thuật toán tham lam), dùng lại được khi đổi từ hệ 10 sang hệ 2.

## Lỗi sai nhắm tới

- Nhầm thứ tự trọng số (cho bit trái nhất trọng số 1).
- Nghĩ rằng hệ 8/16 cũng chỉ có chữ số 0/1 ở mỗi vị trí. Level bánh xe cho thấy mỗi vị trí có `r` giá trị.

## Cách chơi

- Màn hình cho một số thập phân mục tiêu.
- **Hệ 2:** 4 hoặc 8 bóng đèn, mỗi bóng ghi trọng số (128, 64, …, 1). Bấm bóng để bật hoặc tắt. Phím `1`–`8` bật/tắt bóng từ trái sang.
- **Hệ 8/16:** mỗi vị trí là một bánh xe 0–7 hoặc 0–F. Dùng ▲/▼, bấm vào mặt số, hoặc cuộn chuột.
- Khi tổng đúng bằng mục tiêu, vòng tự kết thúc và hiện khai triển, ví dụ `128 + 32 + 8 + 4 + 2 = 174`.
- Hết giờ thì game hiện đáp án và đánh dấu các ô cần bật.

## Levels

| # | Tên | Cơ số | Số ô | Vòng | Giây/vòng | Hiện tổng |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Khởi động | 2 | 4 | 6 | 30 | ✔ |
| 2 | Một byte | 2 | 8 | 8 | 30 | ✔ |
| 3 | Không nhìn tổng | 2 | 8 | 8 | 35 | ✘ |
| 4 | Bánh xe bát phân | 8 | 3 | 6 | 40 | ✔ |
| 5 | Bánh xe hex | 16 | 2 | 6 | 40 | ✔ |
| 6 | Hex 3 chữ số | 16 | 3 | 6 | 50 | ✘ |

Muốn sửa level thì chỉnh mảng `LEVELS` ở đầu [game.js](game.js).

## Tính điểm

Mỗi vòng đúng được `10 + số giây còn lại`. Kỷ lục từng level được lưu trong `localStorage` của trình duyệt.

## Gợi ý dùng trên lớp

- Cho chơi level 1–2 ngay sau slide positional notation, trước khi giảng công thức Σ dᵢ·rⁱ.
- Level 3 (ẩn tổng) hợp làm thi đấu nhanh giữa các nhóm.
- Câu hỏi thảo luận sau khi chơi: *"Vì sao 8 bóng chỉ biểu diễn được tối đa 255?"* Câu này dẫn sang khái niệm byte và tràn số.

## Ghi chú kỹ thuật

| File | Vai trò |
| --- | --- |
| `index.html` | Khung trang: 3 màn hình `start` / `play` / `end` và hộp thoại hướng dẫn |
| `style.css` | Giao diện bóng đèn và bánh xe |
| `game.js` | `LEVELS`, trạng thái `S`, logic vòng chơi |

- Mục tiêu được chọn ngẫu nhiên, không lặp trong một level. Với hệ 8/16, game loại các số chỉ có một chữ số.
- Chỉ dùng helper chung trong `assets/js/common.js` (`G.Timer`, `G.progress`, `G.toast`, …).

## Ý tưởng mở rộng

- Chế độ ngược: cho sẵn dãy bóng, sinh viên gõ số thập phân.
- Level "phần thập phân" với trọng số 2⁻¹, 2⁻², … để nối sang Bit Fishing.
