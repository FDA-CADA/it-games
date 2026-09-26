# 🎣 Bit Fishing

> **Chủ đề:** Data, Information & Their Representation · **Phần:** 1. Number Systems · **Slide:** 1.5 Conversion (phần thập phân)
> **Trạng thái:** ✅ Đã chơi được · **Thời lượng:** 5–8 phút

## Mục tiêu học tập

- Đổi phần thập phân sang hệ 2 bằng cách **nhân 2 liên tiếp** và lấy phần nguyên.
- Phân biệt số có biểu diễn nhị phân **hữu hạn** và số **lặp vô hạn**.
- Hiểu vì sao máy tính buộc phải cắt bớt bit và sinh ra **sai số làm tròn**. Đây là cầu nối sang game *"Máy tính có lưu chính xác không?"* và phần IEEE 754.

## Lỗi sai nhắm tới

- Nhầm với thuật toán phần nguyên: chia 2 thay vì nhân 2, hoặc đọc bit từ dưới lên. Ở phần thập phân, bit đầu tiên câu được đứng **ngay sau dấu chấm**.
- Quên bỏ phần nguyên sau mỗi lần nhân (lấy `1.25 × 2` thay vì `0.25 × 2`).
- Tin rằng số "ngắn" như 0.1 thì cũng có biểu diễn nhị phân ngắn.

## Cách chơi

- Phao hiện giá trị hiện tại *x*. Sinh viên nhẩm *x* × 2 rồi bấm **Câu được 0** hoặc **Câu được 1** (phím `0`/`1`).
- Câu đúng thì bit bay lên *Giỏ cá* (`0.101…`), phần thập phân còn lại thả xuống câu tiếp.
- Phần còn lại = 0: hết cá, biểu diễn chính xác.
- Nếu một giá trị **lặp lại**, game báo 🔁 chu kỳ và gạch trên (overline) phần bit lặp.
- Nút **Dừng câu** (`S`) cho sinh viên tự quyết định dừng. Màn tổng kết hiện giá trị xấp xỉ, sai số, và biểu diễn đầy đủ dạng `0.0(0011)₂`.
- Lưới chứa tối đa 24 bit.
- Mục *Nhật ký câu cá* ghi lại toàn bộ bảng tính, giống cách trình bày trên giấy.

## Levels

| # | Tên | Các số | Ghi chú |
| --- | --- | --- | --- |
| 1 | Cá cạn | 0.5, 0.75, 0.625, 0.375 | Hết sau ≤ 3 bit |
| 2 | Cá sâu | 0.8125, 0.4375, 0.90625, 0.203125 | Hết sau 4–6 bit |
| 3 | Cá vô tận | 0.1, 0.2, 0.3, 0.26 | Không bao giờ hết. 0.26 có chu kỳ 20 bit |
| 4 | Hỗn hợp | 0.6875, 0.1, 0.5625, 0.7, 0.4, 0.15625 (xáo trộn) | Tự nhận biết con nào hết |

## Tính điểm

- +2 cho mỗi bit đúng ngay lần đầu.
- +10 khi kết thúc vòng "đúng lúc":
  - hết cá (biểu diễn chính xác), **hoặc**
  - dừng trên số vô hạn sau khi đã thấy chu kỳ, **hoặc** khi sai số < 0.001.
- Dừng sớm trên số vẫn còn cá: không có thưởng.

## Gợi ý dùng trên lớp

- Sau level 3, hỏi: *"Số như thế nào thì hết cá?"* Để sinh viên tự đoán, rồi chuyển sang game *Máy tính có lưu chính xác không?* để kiểm chứng.
- Liên hệ: float32 có 23 bit mantissa, tương đương một "lưới" 23 bit.

## Ghi chú kỹ thuật

- Game tính bằng **phân số nguyên** `n/d` (từ `G.parseFraction`) chứ không dùng số thực, nên không bị chính lỗi làm tròn mà game đang dạy.
- Mọi phần dư đều có mẫu `d` chia hết 10^k, nên luôn hiển thị được chính xác dưới dạng thập phân (`decStr`).
- Phát hiện chu kỳ: `Map` từ tử số → bước đầu tiên xuất hiện.

## Ý tưởng mở rộng

- Số có cả phần nguyên (5.625): kết hợp Remainder Tower và Bit Fishing.
- Đổi sang hệ 8/16 (nhân 8, nhân 16).
- Chế độ "máy float": giới hạn đúng 23 bit và làm tròn bit cuối.
