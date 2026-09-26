# 🏭 Bit Conveyor

> **Chủ đề:** Data, Information & Their Representation · **Phần:** 3. Operations on Data · **Slide:** 3.2 Shift operations
> **Trạng thái:** ✅ Đã chơi được · **Thời lượng:** 6–8 phút

## Mục tiêu học tập

- Phân biệt ba kiểu dịch: **logical** (điền 0, bit rơi ra thì mất), **circular** (bit quay vòng), **arithmetic** dịch phải (điền bit dấu).
- Hiểu dịch trái = ×2, dịch phải = ÷2, và vì sao chia số âm phải dùng arithmetic shift.
- Lập kế hoạch chuỗi phép dịch với số bước ít nhất.

## Lỗi sai nhắm tới

- Dùng logical shift phải cho số âm: −42 = `11010110` → `01101011` = 107 (số dương!). Arithmetic shift cho ra −21.
- Nghĩ rằng dịch trái rồi dịch phải sẽ về như cũ (bit bị đẩy ra đã mất).
- Quay vòng theo chiều dài hơn cần thiết (quay trái k lần bằng quay phải 8 − k lần).

## Cách chơi

- Hai dòng **Hiện tại** và **Đích**, kèm giá trị thập phân (và giá trị có dấu nếu bit đầu là 1).
- Bấm nút dịch (phím `1`–`5`) để áp dụng ngay. ↶ hoàn tác và ↺ làm lại vẫn tính bước.
- Game cho biết số bước tối thiểu, được tính trước bằng BFS. Quá tối thiểu + 4 bước thì thua vòng.
- Level 3: bài chia số âm cho 2ᵏ, vòng đầu luôn là −42 ÷ 2. Nếu dùng logical shift trên số âm, game cảnh báo ngay.

## Levels

| # | Tên | Phép dịch | Vòng |
| --- | --- | --- | --- |
| 1 | Logical shift | SHL, SHR | 4 |
| 2 | Circular shift | ROL, ROR | 4 |
| 3 | Arithmetic vs logical | SHL, SHR, SAR | 4 (−42 ÷ 2, số âm ÷ 2ᵏ, một vòng số dương) |
| 4 | Tổng hợp | Cả 5 phép | 4 |

## Tính điểm

+15 nếu đạt số bước tối thiểu, −3 cho mỗi bước thừa (tối thiểu +5).

## Gợi ý dùng trên lớp

- Python: `-42 >> 1` ra −21 (Python dùng arithmetic shift cho số âm). Còn `(-42 & 0xFF) >> 1` ra 107, đúng như logical shift trên 8 bit.
- Liên hệ: dịch bit để tính nhanh ×2ⁿ, và để tách các trường trong gói tin mạng.

## Ghi chú kỹ thuật

- `OPS` định nghĩa 5 phép trên số 0–255. `bfs()` tìm số bước tối thiểu giữa hai byte với các phép được phép.
- Đề ngẫu nhiên được sinh bằng một chuỗi phép ngẫu nhiên rồi tính lại tối thiểu bằng BFS, nên luôn có lời giải.

## Ý tưởng mở rộng

- Dịch nhiều bit một lần (`<< k`) với chi phí khác nhau.
- Rotate qua cờ carry (RCL/RCR) như trong hợp ngữ x86.
