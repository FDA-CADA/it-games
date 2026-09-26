# 🏗️ Float Builder

> **Chủ đề:** Data, Information & Their Representation · **Phần:** 2. Data Storage · **Slide:** 2.3 Real numbers (IEEE 754, 5 bước ở slide 65)
> **Trạng thái:** ✅ Đã chơi được · **Thời lượng:** 8–12 phút · ⭐ Ưu tiên cao

## Mục tiêu học tập

- Mã hóa một số thực sang IEEE 754 single precision theo 5 bước: dấu, đổi nhị phân, chuẩn hóa, exponent lệch 127, mantissa.
- Giải mã ngược: (−1)<sup>S</sup> × 1.M × 2<sup>Exp − 127</sup>.
- Hiểu hai điểm khó: **bias 127** và **số 1 ẩn** không được lưu.

## Lỗi sai nhắm tới

| Lỗi | Cách game bắt |
| --- | --- |
| Lưu E trực tiếp, quên cộng 127 | Chế độ tự lắp nhận diện exponent bằng E |
| Chép cả số 1 đứng trước dấu chấm vào mantissa | Nhận diện riêng |
| Giải mã quên trừ 127 | Chế độ giải mã nhanh nhận diện đáp án bằng 1.M × 2<sup>Exp</sup> |
| Sai dấu | Nhận diện khi độ lớn đúng mà dấu sai |
| Exponent toàn bit 1 | Giải thích đây là mã dành riêng cho ∞/NaN |

## Cách chơi

- 32 bit chia làm 3 khu có màu riêng: **Sign** (1), **Exponent** (8), **Mantissa** (23). Bấm bit để bật/tắt.
- **Chế độ có hướng dẫn:** 5 bước hiện lần lượt. Bước nào cần chỉnh bit thì chỉ khu đó được mở. Bước nào cần gõ thì có ô nhập. Bước chưa tới chỉ hiện tiêu đề, để không lộ đáp án của bước trước. Nút 💡 hiện gợi ý (−2 điểm).
- **Chế độ tự do:** tự bật đủ 32 bit rồi kiểm tra. Nếu sai, game báo sai ở khu nào và 32 bit hiện tại đang biểu diễn số mấy.
- Hoàn thành vòng thì hiện đủ dạng hex (`0xC0D80000`) và công thức kiểm tra.

## Levels

| # | Tên | Chế độ | Vòng |
| --- | --- | --- | --- |
| 1 | Lắp có hướng dẫn | Mã hóa, 5 bước (vòng 1 luôn là −6.75) | 4 |
| 2 | Tự lắp | Mã hóa, không có từng bước | 4 |
| 3 | Giải mã có hướng dẫn | Giải mã, 5 bước | 4 |
| 4 | Giải mã nhanh | Nhìn 32 bit, gõ giá trị | 6 |

Số mục tiêu có dạng ±1.f × 2<sup>E</sup> với E ∈ [−3, 6] và f tối đa 5 bit, nên luôn biểu diễn chính xác và có dạng thập phân ngắn (ví dụ 0.375, −15.25, 96).

## Tính điểm

- Có hướng dẫn: +4 mỗi bước đúng ngay lần đầu, +5 khi xong vòng, gợi ý −2.
- Tự lắp: 20 − 5 × (số lần kiểm tra − 1), tối thiểu 5.
- Giải mã nhanh: +10 nếu đúng ngay lần đầu, +4 nếu đúng sau đó.

## Gợi ý dùng trên lớp

- Làm mẫu vòng −6.75 trên máy chiếu cùng slide 65, rồi cho sinh viên tự làm vòng 2–4.
- Bài tập về nhà: level 2 và level 4, chụp màn hình kết quả để nộp.

## Ghi chú kỹ thuật

- Kết quả được đối chiếu với float32 thật qua `DataView.setFloat32` / `getFloat32`.
- Ô nhập nhị phân chấp nhận `110.11`, `.011`, và cả số 0 thừa ở cuối.

## Ý tưởng mở rộng

- Kéo thả từng khối bit (thay cho bấm từng bit) trên màn hình lớn.
- Level double precision (11 + 52 bit).
- Số không biểu diễn chính xác được (0.1): cho sinh viên thấy bước làm tròn mantissa.
