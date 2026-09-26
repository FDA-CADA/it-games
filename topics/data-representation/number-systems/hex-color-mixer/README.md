# 🎨 Hex Color Mixer

> **Chủ đề:** Data, Information & Their Representation · **Phần:** 1. Number Systems · **Slide:** 1.3 Hexadecimal (ví dụ `#FF5733`)
> **Trạng thái:** ✅ Đã chơi được · **Thời lượng:** 5–8 phút

## Mục tiêu học tập

- Thấy hex được dùng thật ngoài đời: mã màu web `#RRGGBB`.
- Hiểu một byte = 2 chữ số hex, chữ số trái có trọng số 16 và chữ số phải có trọng số 1 (`0x57 = 5×16 + 7 = 87`).
- Ước lượng được độ lớn của một giá trị hex: `00` là tắt hẳn, `80` là khoảng một nửa, `FF` là tối đa.

## Lỗi sai nhắm tới

- Đảo thứ tự kênh (đọc thành B-G-R). Đáp án nhiễu trong chế độ *Đọc mã* được tạo có chủ đích để bắt lỗi này.
- Coi hai chữ số hex trong một byte là ngang giá trị (đổi `1E` thành `E1` mà không thấy khác biệt).

## Cách chơi

**Pha màu (level 1, 3, 4):** game cho một màu mẫu. Sinh viên chỉnh 6 chữ số hex bằng ▲/▼, cuộn chuột, hoặc gõ thẳng `#RRGGBB`. Bấm **Kiểm tra** (`Enter`) để xem:
- thanh *Độ gần* (khoảng cách Euclid trong không gian RGB, quy về %);
- gợi ý ↑/↓ cho từng kênh.

**Đọc mã (level 2, 5):** game cho một mã hex và 4 ô màu. Chọn ô đúng bằng chuột hoặc phím `1`–`4`.

## Levels

| # | Tên | Kiểu | Giá trị mỗi kênh | Điều kiện qua |
| --- | --- | --- | --- | --- |
| 1 | Màu thuần | Pha | `00` hoặc `FF` | Khớp tuyệt đối |
| 2 | Đọc mã | Đọc | bội của `33` | — |
| 3 | Bậc 0x33 | Pha | `00, 33, 66, 99, CC, FF` | Khớp tuyệt đối |
| 4 | Màu tự do | Pha | bất kỳ (vòng 1 luôn là `#FF5733`) | Độ gần ≥ 95% |
| 5 | Đọc mã khó | Đọc | bất kỳ, đáp án nhiễu gần nhau hơn | — |

## Tính điểm

- Pha màu: `max(10, 50 − 8 × (số lần kiểm tra − 1))` mỗi vòng.
- Đọc mã: 10 điểm mỗi câu đúng.

## Gợi ý dùng trên lớp

- Mở DevTools của trình duyệt, chỉnh màu một phần tử bất kỳ để cho thấy đây là kỹ năng thật.
- Câu hỏi thảo luận: *"Có bao nhiêu màu khác nhau có thể viết bằng #RRGGBB?"* (2²⁴ ≈ 16,7 triệu, tức "24-bit color", dẫn sang phần 2.4 Image.)

## Ghi chú kỹ thuật

- `distractors()` sinh đáp án nhiễu theo thứ tự ưu tiên: đảo R↔B, đảo 2 chữ số trong một kênh, nhầm kênh, màu bù. Game loại các đáp án quá gần nhau (khoảng cách < 70, hoặc < 45 ở level khó).
- Ở level có đòi hỏi độ gần, dung sai gợi ý ±12 cho mỗi kênh.

## Ý tưởng mở rộng

- Thêm kênh alpha `#RRGGBBAA`.
- Chế độ "đoán mã": nhìn màu, gõ mã, chấm theo độ gần (không có gợi ý).
