# 🎡 Number Wheel

> **Chủ đề:** Data, Information & Their Representation · **Phần:** 2. Data Storage · **Slide:** 2.2 Integers (sign-and-magnitude, two's complement)
> **Trạng thái:** ✅ Đã chơi được · **Thời lượng:** 8–10 phút · ⭐ Ưu tiên cao

## Mục tiêu học tập

- Gán đúng giá trị cho 16 pattern 4-bit theo ba cách: unsigned, sign-and-magnitude, two's complement.
- Thấy tận mắt vì sao sign-and-magnitude có **hai số 0** (+0 = 0000, −0 = 1000), dải chỉ là −7 … +7, và nửa âm chạy **ngược chiều**.
- Thấy vì sao dải two's complement **lệch**: −8 … +7. Trên vòng two's complement, mỗi bước theo chiều kim đồng hồ luôn là +1, và chỗ tràn nằm giữa +7 và −8.
- Hiểu vì sao máy tính chọn two's complement: một mạch cộng dùng chung cho cả số âm lẫn số dương.

## Lỗi sai nhắm tới

- Đọc two's complement theo kiểu sign-and-magnitude (`1101` → −5 thay vì −3). Game nhận diện riêng lỗi này.
- Tin rằng dải two's complement đối xứng (−7 … +7 hoặc −8 … +8).
- Không phân biệt được pattern `1000` ở hai chế độ.

## Cách chơi

- 16 ô xếp thành vòng tròn, bắt đầu từ `0000` ở đỉnh, đi theo chiều kim đồng hồ. Bit đầu (bit dấu) được tô màu.
- Kéo nhãn giá trị từ khay vào ô (trên máy tính), hoặc chạm nhãn rồi chạm ô (trên điện thoại).
- Đặt đúng thì ô khóa lại và hiện công thức. Đặt sai thì ô rung lên, kèm giải thích.
- Xếp xong cả vòng, game đánh dấu điểm đặc biệt: hai số 0 (sign-and-magnitude), hoặc vạch tràn (unsigned, two's complement).

## Levels

| # | Tên | Nội dung |
| --- | --- | --- |
| 1 | Khởi động: Unsigned | Nhãn 0 … 15, làm quen với vòng. Vạch tràn giữa 1111 và 0000 |
| 2 | Sign-and-magnitude | Nhãn +0 … +7, −0 … −7 |
| 3 | Two's complement | Nhãn −8 … 7 |
| 4 | So sánh hai vòng | Hai vòng S&M và TC đặt cạnh nhau, 6 câu hỏi (−0, 1000, dải giá trị, chỗ tràn, 1111, vì sao dùng TC) |

## Tính điểm

- Level 1–3: +6 mỗi ô đặt đúng ngay lần đầu, +2 nếu đúng sau khi đã đặt nhầm nhãn đó.
- Level 4: +10 mỗi câu đúng ngay lần đầu.

## Gợi ý dùng trên lớp

- In hai vòng (level 4) ra khổ A3 để dán lên bảng khi giảng phần 2.2.
- Hỏi cả lớp: *"Đi một bước theo chiều kim đồng hồ từ 1111 thì ra số mấy, ở mỗi chế độ?"*

## Ghi chú kỹ thuật

- Mỗi chế độ là một object trong `MODES` gồm `label(v)` (nhãn đúng của pattern v) và `why(p)` (lời giải). Muốn thêm chế độ khác (ví dụ one's complement) chỉ cần thêm một object.
- Kéo thả dùng HTML5 Drag and Drop. Chạm-chọn là phương án thay thế cho điện thoại.
- Các ô được định vị bằng `transform`, nên có keyframe riêng (`slot-pop`, `slot-shake`) để hiệu ứng không làm lệch vị trí.

## Ý tưởng mở rộng

- Thêm chế độ one's complement (cũng có hai số 0).
- Vòng 8-bit thu gọn, chỉ hiện các điểm mốc.
