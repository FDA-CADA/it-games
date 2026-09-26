# 🚨 Overflow Detective

> **Chủ đề:** Data, Information & Their Representation · **Phần:** 3. Operations on Data · **Slide:** 3.3 Arithmetic operations (two's complement, slide 107)
> **Trạng thái:** ✅ Đã chơi được · **Thời lượng:** 8–10 phút

## Mục tiêu học tập

- Cộng hai số two's complement trên n bit và cắt kết quả còn n bit.
- Thực hiện phép trừ bằng cách **cộng số bù 2**: a − b = a + (−b). Đây là ý chính của slide 107: phần cứng chỉ cần một mạch cộng.
- Nhận biết **overflow**: cộng hai số cùng dấu mà kết quả khác dấu. Hai số khác dấu thì không bao giờ tràn.
- Phân biệt **carry** (bit nhớ rơi ra ngoài) với **overflow**.

## Lỗi sai nhắm tới

| Lỗi | Cách game bắt |
| --- | --- |
| Coi bit nhớ rơi ra ngoài là overflow | Có các vụ như −2 + −2: có carry nhưng không overflow, kèm giải thích |
| Trừ trực tiếp từng bit thay vì cộng số bù 2 | Phép trừ bắt buộc qua bước ghi −b |
| Không bật cờ khi hai số dương cộng ra số âm | Giải thích bằng quy tắc dấu |
| Tính sai −b (quên +1) | Bước 1 kiểm tra riêng, gợi ý cụ thể |

## Cách chơi

- Mỗi "vụ án" là một phép a ± b trên 4 hoặc 6 bit, kèm dải biểu diễn được.
- **Phép trừ, bước 1:** bấm bit để ghi −b. **Bước 2:** ghi kết quả vào dòng *Kết quả*.
- Bấm nút cờ để chuyển giữa 🏳️ Không overflow và 🚩 Có overflow, rồi **Kết luận** (`Enter`).
- Sau khi kết luận, game hiện hàng **nhớ** vào từng cột, bit nhớ rơi ra ngoài (nếu có), giá trị máy ghi ra, và lời giải.
- **Thám tử nhanh:** 60 giây, chỉ cần phán tràn hay không (phím ←/→). Đúng thì tự sang vụ tiếp.

## Levels

| # | Tên | Bit | Phép | Vụ |
| --- | --- | --- | --- | --- |
| 1 | Cộng 4-bit | 4 (−8 … 7) | + | 6 |
| 2 | Trừ 4-bit | 4 | − (qua bước −b) | 6 |
| 3 | 6-bit hỗn hợp | 6 (−32 … 31) | + và − xen kẽ | 6 |
| 4 | Thám tử nhanh | 6 | ± | 60 giây |

Khoảng một nửa số vụ có overflow, để không đoán mò được.

## Tính điểm

- Level 1–3: kết quả đúng +5, cờ đúng +5.
- Thám tử nhanh: +10 mỗi vụ, cộng thêm +2 cho mỗi vụ đúng liên tiếp.

## Gợi ý dùng trên lớp

- Chữa bài slide 107 bằng level 2.
- Hỏi: *"Vì sao −8 − 1 trên 4 bit lại ra +7?"*, và nối lại với vòng tròn của game Number Wheel.

## Ghi chú kỹ thuật

- Overflow được xác định theo giá trị toán học thật (a ± b nằm ngoài dải), còn quy tắc dấu chỉ dùng để giải thích.
- Không sinh đề trừ với b = −2ⁿ⁻¹ vì −b của nó không biểu diễn được.

## Ý tưởng mở rộng

- Hiện cả hai cờ C (carry) và V (overflow) như thanh ghi cờ của CPU.
- Level số không dấu để so sánh: ở đây carry chính là tràn.
