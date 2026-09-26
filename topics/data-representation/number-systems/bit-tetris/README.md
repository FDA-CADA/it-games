# 🧩 Bit Tetris

> **Chủ đề:** Data, Information & Their Representation · **Phần:** 1. Number Systems · **Slide:** 1.5 Conversion (binary ↔ octal/hex)
> **Trạng thái:** ✅ Đã chơi được · **Thời lượng:** 5–8 phút

## Mục tiêu học tập

- Hiểu vì sao đổi bin ↔ oct/hex chỉ cần **nhóm bit**: 8 = 2³, 16 = 2⁴.
- Nắm quy tắc nhóm **tính từ dấu chấm**: phần nguyên nhóm từ phải sang trái, phần thập phân nhóm từ trái sang phải, thiếu thì đệm 0 ở phía ngoài.
- Đổi nhanh một nhóm 3/4 bit thành một chữ số và ngược lại.

## Lỗi sai nhắm tới

1. **Nhóm phần nguyên từ trái sang.** Game nhận diện riêng lỗi này và giải thích.
2. Nhóm phần thập phân từ phải sang (đệm 0 sai phía).
3. Khi đổi hex → bin, viết `1` thay vì `0001` cho các chữ số ở giữa, làm lệch toàn bộ vị trí.

## Cách chơi

Một "khối" số rơi dần trong giếng. Khối chạm đáy thì bị chất đống và sinh viên mất 1 mạng (có 3 mạng).

**Bin → Oct/Hex**
1. Bấm vào khe giữa hai bit để đặt hoặc bỏ vết cắt. Dấu chấm (mờ nếu là số nguyên) là mốc đếm.
2. Bấm **✂ Cắt** (`Enter`). Cắt đúng thì các nhóm hiện ra kèm số 0 đệm (in mờ).
3. Gõ chữ số cho từng nhóm (con trỏ tự nhảy sang ô sau) rồi bấm **💥 Nổ**.

**Oct/Hex → Bin**
- Gõ đủ 3 hoặc 4 bit cho từng chữ số rồi bấm **💥 Nổ**. Riêng chữ số đầu tiên được phép bỏ số 0 ở đầu.

Mỗi lần sai, khối bị đẩy xuống thêm 12% quãng đường. Chuyển sang tab khác thì khối tạm dừng rơi.

## Levels

| # | Tên | Hướng | Nhóm | Độ dài | Thời gian rơi |
| --- | --- | --- | --- | --- | --- |
| 1 | Bin → Oct | b→x | 3 | 5–9 bit, không có phần thập phân | 60 s |
| 2 | Bin → Hex | b→x | 4 | 6–10 bit, không có phần thập phân | 60 s |
| 3 | Có dấu chấm | b→x | 3/4 | 3–7 bit nguyên + 2–5 bit thập phân | 60 s |
| 4 | Oct/Hex → Bin | x→b | 3/4 | 2–3 chữ số nguyên + 0–2 chữ số thập phân | 55 s |
| 5 | Tổng lực | cả hai | 3/4 | trộn | 42 s |

Game ưu tiên sinh độ dài phần nguyên **không** chia hết cho k, để luôn phải đệm 0.

## Tính điểm

`10 + 2 × số nhóm + thưởng thời gian (0–10)` cho mỗi khối phá được.

## Gợi ý dùng trên lớp

- Trước khi chơi, cho sinh viên thử đổi `1101011.1₂` sang hệ 8 trên giấy để thấy lỗi nhóm từ trái.
- Liên hệ thực tế: địa chỉ bộ nhớ, quyền file Unix (`chmod 755`), màu hex.

## Ghi chú kỹ thuật

- Vết cắt được định danh theo **khoảng cách tới dấu chấm** (`i3` = phần nguyên, cách dấu chấm 3 bit). Nhờ vậy tập vết cắt đúng chỉ là `{j : j mod k = 0}` ở cả hai phía.
- Chuyển động rơi dùng `requestAnimationFrame`. Tiến độ = thời gian đã trôi / thời gian rơi + tổng phạt.

## Ý tưởng mở rộng

- Chế độ oct ↔ hex (đi qua bin làm trung gian).
- Bảng xếp hạng theo lớp (cần backend hoặc Google Sheet).
