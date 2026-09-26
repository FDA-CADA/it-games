# ⚙️ Negate Machine

> **Chủ đề:** Data, Information & Their Representation · **Phần:** 2. Data Storage · **Slide:** 2.2 Integers (two's complement)
> **Trạng thái:** ✅ Đã chơi được · **Thời lượng:** 5–8 phút

## Mục tiêu học tập

- Đổi dấu một số two's complement: **Invert rồi +1** (hoặc tương đương: −1 rồi Invert).
- Tự tay làm phép cộng 1 có nhớ trên 8 bit.
- Giải mã pattern âm như `11110110` → −10.
- Hiểu hai trường hợp đặc biệt: −0 = 0, và máy vẫn chạy được khi đầu vào là số âm.

## Lỗi sai nhắm tới

| Lỗi | Cách game bắt |
| --- | --- |
| Chỉ lật bit dấu (cách của sign-and-magnitude) | Trạm gây nhiễu "Lật bit dấu", có giải thích riêng |
| Chỉ đảo bit (one's complement) | Nhận diện kết quả "thiếu 1" |
| Làm sai thứ tự (+1 trước, Invert sau) | Nhận diện riêng |
| Đọc pattern âm như số unsigned hoặc sign-and-magnitude | Nhận diện trong level giải mã |
| Quên xử lý phần nhớ khi +1 | Level tự vận hành tô đỏ đúng các bit sai |

## Cách chơi

- **Lắp máy:** kho có 4 trạm (Invert, +1, −1, Lật bit dấu). Chạm để đưa trạm lên băng chuyền (tối đa 3), chạm trạm trên băng chuyền để gỡ ra, rồi bấm **▶ Chạy** để xem byte đi qua từng trạm. Vòng 4 có đầu vào âm, vòng 5 có đầu vào là 0.
- **Tự vận hành:** bấm từng bit để tự đảo (trạm 1), rồi tự cộng 1 (trạm 2). Có giới hạn 30 giây.
- **Giải mã ngược:** cho pattern 8 bit, gõ giá trị thập phân. Câu đầu luôn là `11110110`. Mỗi câu 20 giây.
- **Tổng lực:** 90 giây, trộn câu giải mã và câu mã hóa (−x → 8 bit).

## Levels

| # | Tên | Kiểu | Giới hạn thời gian |
| --- | --- | --- | --- |
| 1 | Lắp máy | Chọn trạm | Không |
| 2 | Tự vận hành | Bấm bit | 30 s/vòng |
| 3 | Giải mã ngược | Gõ số thập phân | 20 s/câu |
| 4 | Tổng lực 90 giây | Giải mã + mã hóa | 90 s cả level |

## Tính điểm

- Lắp máy: +10 nếu đúng ngay lần chạy đầu, +4 nếu phải sửa.
- Tự vận hành và giải mã: 10 + số giây còn lại.
- Tổng lực: +10 mỗi câu, cộng thêm +2 cho mỗi câu đúng liên tiếp.

## Gợi ý dùng trên lớp

- Level 1 để giới thiệu, level 2 cho sinh viên tự tay làm, level 4 làm cuộc thi cuối giờ.
- Câu hỏi mở: *"Chạy −128 qua máy thì ra gì?"* (Vẫn là −128. Vì sao?)

## Ghi chú kỹ thuật

- Mỗi trạm là một hàm trên số 0–255 trong `OPS`. Game chấp nhận **mọi** chuỗi trạm cho ra kết quả đúng.
- Giá trị có dấu dùng `G.signed(G.bits(u))`.

## Ý tưởng mở rộng

- Trạm "Shift" để nối sang Bit Conveyor.
- Level 16-bit.
