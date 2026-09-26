# 🌡️ Exponent Zones

> **Chủ đề:** Data, Information & Their Representation · **Phần:** 2. Data Storage · **Slide:** 2.3 Real numbers (overflow, underflow)
> **Trạng thái:** ✅ Đã chơi được · **Thời lượng:** 8–10 phút

## Mục tiêu học tập

- Cảm nhận giới hạn của số mũ: kéo quá phải thì **overflow → ∞**, kéo quá trái thì **underflow → 0**.
- Biết vùng **subnormal**: số vẫn khác 0 nhưng mất dần bit chính xác.
- Nhớ các con số quan trọng: float32 lớn nhất ≈ 3.4×10³⁸, float64 ≈ 1.8×10³⁰⁸.
- Liên hệ Data/AI: tích nhiều xác suất bị underflow (nên dùng **log-probability**), softmax bị overflow (nên **trừ max**).

## Lỗi sai nhắm tới

- Nghĩ rằng máy sẽ báo lỗi khi tràn số thực (thật ra ra `inf` hoặc `0.0` mà không báo gì).
- Nghĩ rằng đã tràn thành ∞ thì chia lại là về như cũ.
- Không biết vì sao Naive Bayes/language model dùng tổng log thay vì tích xác suất.

## Cách chơi

Có hai loại nhiệm vụ:

- **Thanh trượt:** kéo (hoặc bấm −1/+1, phím ←/→) tới vị trí đề bài yêu cầu, rồi bấm **📌 Chốt**. Màn hình hiện giá trị máy thật sự lưu, vùng (Normal/Subnormal/∞/0), số bit chính xác còn lại, và ba trường Sign/Exponent/Mantissa. Dải màu bên dưới cho thấy các vùng.
- **Dự đoán:** trắc nghiệm kèm đoạn code NumPy tương ứng. Trả lời đúng xong, trình duyệt **tính thật** biểu thức đó và in kết quả.

## Levels

| # | Tên | Nhiệm vụ |
| --- | --- | --- |
| 1 | Tìm biên float32 | 1.5 × 2ᵏ: k lớn nhất chưa ∞ (127), k nhỏ nhất ≠ 0 (−150), ranh giới normal/subnormal (−126), câu hỏi về subnormal |
| 2 | Dự đoán | 3e38 × 10, 1e−45 ÷ 10, (inf) ÷ 10, ∞ − ∞, 2²⁴ + 1 trong float32 |
| 3 | Float64 | k lớn nhất (1023), k nhỏ nhất ≠ 0 (−1075), float64 max, vì sao deep learning dùng float32 |
| 4 | Cứu dữ liệu Data/AI | N nhỏ nhất để 0.01ᴺ về 0 trong float32 (23), mẹo log, x lớn nhất để e^x chưa tràn (88), mẹo softmax trừ max |

Các đáp án của nhiệm vụ thanh trượt **không viết cứng trong code**. Game quét cả thanh trượt và tính bằng `Math.fround` (float32) hoặc số double của JavaScript (float64).

## Tính điểm

- Thanh trượt: +15 nếu chốt đúng ngay lần đầu, +5 nếu đúng sau đó (có gợi ý hướng khi sai).
- Dự đoán: +10 nếu đúng ngay lần đầu.

## Gợi ý dùng trên lớp

- Demo trực tiếp trên Python: `np.float32(3e38) * 10`, `np.exp(np.float32(89))`, `np.prod(np.full(30, 0.01, dtype=np.float32))`.
- Level 4 là cầu nối tốt sang các môn Machine Learning.

## Ghi chú kỹ thuật

- Với float64, số rất nhỏ được tính qua bước trung gian `1.5 × 2^(k+200) × 2^−200` để chỉ làm tròn một lần.
- Số bit chính xác trong vùng subnormal = ⌊log₂(v / min_subnormal)⌋ + 1.

## Ý tưởng mở rộng

- Thêm float16/bfloat16 (mô phỏng bằng cách làm tròn thủ công) để so sánh dải giá trị trong deep learning.
- Nhiệm vụ "machine epsilon": tìm số nhỏ nhất mà 1 + ε ≠ 1.
