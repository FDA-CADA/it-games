# 🚗 Odometer Overflow

> **Chủ đề:** Data, Information & Their Representation · **Phần:** 2. Data Storage · **Slide:** 2.2 Integers (unsigned, overflow)
> **Trạng thái:** ✅ Đã chơi được · **Thời lượng:** 5 phút

## Mục tiêu học tập

- Số nguyên không dấu *n* bit chỉ chứa được 0 … 2ⁿ − 1.
- Khi tràn, kết quả **quay vòng**: (a ± b) mod 2ⁿ. Bit nhớ thứ n+1 bị mất.
- Máy tính **không báo lỗi** khi tràn số không dấu. Đây là nguồn gốc của nhiều bug thực tế.

## Lỗi sai nhắm tới

- Nghĩ rằng 11 + 9 trên 4 bit vẫn là 20 (đáp án của toán học).
- Nghĩ rằng giá trị sẽ "kẹt" ở số lớn nhất (15) hoặc máy sẽ báo lỗi.
- Với phép trừ: không hình dung được 3 − 5 trên số không dấu ra 14.

## Cách chơi

1. Đề bài: đồng hồ *n*-bit đang ở `a`, xe chạy thêm (hoặc lùi lại) `b` km.
2. **Đặt cược** kết quả: level 1 chọn 1 trong 4 dự đoán (đáp án đúng, đáp án toán học, "kẹt ở max", "máy báo lỗi"); các level sau tự gõ số.
3. Bấm **🏁 Cho xe chạy**: đồng hồ quay từng km, đèn *carry* sáng và game báo khi đồng hồ quay vòng qua 0000.
4. Lời giải hiện phép cộng nhị phân với bit nhớ bị gạch bỏ.

Khoảng 65% số vòng có tràn, số còn lại không tràn, để sinh viên không trả lời theo thói quen.

## Levels

| # | Tên | Bit | Phép toán | Kiểu trả lời | Vòng |
| --- | --- | --- | --- | --- | --- |
| 1 | Đặt cược 4-bit | 4 | + (vòng 1 luôn là 11 + 9) | Chọn | 6 |
| 2 | Tự gõ 4-bit | 4 | + | Gõ | 6 |
| 3 | Một byte | 8 | + | Gõ | 6 |
| 4 | Chạy lùi | 4/8 | − (vòng 1 luôn là 3 − 5) | Gõ | 6 |
| 5 | Hỗn hợp | 4/8 | ± | Gõ | 8 |

## Tính điểm

Thắng cược +10, cộng +2 cho mỗi lần thắng liên tiếp.

## Gợi ý dùng trên lớp

- Chơi vòng đầu (11 + 9) cả lớp cùng lúc, biểu quyết trước khi cho xe chạy.
- Chuyện thật để kể: bộ đếm lượt xem YouTube phải nâng lên 64-bit khi video *Gangnam Style* vượt 2 147 483 647 lượt (giới hạn số nguyên 32-bit có dấu); lỗi "Năm 2038" của Unix time.

## Ghi chú kỹ thuật

- Tốc độ quay tự điều chỉnh để mỗi chuyến chạy khoảng 2–3 giây, kể cả khi `b` lớn (8-bit).
- Hàm `result()` = `((a ± b) % 2ⁿ + 2ⁿ) % 2ⁿ`.

## Ý tưởng mở rộng

- Đồng hồ two's complement: 0111 + 1 ra −8 (nối sang Number Wheel và Overflow Detective).
- Đồng hồ thập phân 3 chữ số để so sánh: mod 1000 thay vì mod 2ⁿ.
