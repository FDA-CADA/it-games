# 🔐 Mật Thất Von Neumann (Von Neumann Escape Room)

> **Chủ đề:** Computer Organization & Architecture · **Phần:** Ôn tập chương · **Slide:** Forouzan chương 5 (5.2–5.8)
> **Trạng thái:** ✅ Đã chơi được · **Thời lượng:** 20–30 phút (dài hơn các game khác vì ôn cả chương)

## Mục tiêu học tập

Sau khi chơi, sinh viên:

- Tính được số bit địa chỉ và dung lượng bộ nhớ, phân biệt đánh địa chỉ theo **byte** và theo **word**.
- Xếp đúng linh kiện vào CPU, cache, main memory, I/O subsystem; đếm được hit/miss của một cache nhỏ dùng LRU.
- Trace được một chương trình mã máy của Simple Computer qua từng pha **fetch → decode → execute**.
- Tự viết được một chương trình mã máy có đọc bàn phím và ghi màn hình (memory-mapped I/O).
- Tính thời gian chạy có pipeline (n + k − 1), ảnh hưởng của lệnh jump, và phân loại SISD/SIMD/MIMD.

## Lỗi sai nhắm tới

- Dùng dung lượng tính bằng byte để ra số bit địa chỉ khi bộ nhớ được đánh địa chỉ theo word (ra 28 thay vì 25).
- Nghĩ ROM không thuộc main memory, hoặc SSD là "bộ nhớ" chứ không thuộc I/O subsystem.
- Nghĩ cache chỉ chép đúng một word, nên đếm thiếu hit (block 4 word nghĩa là đọc word 0 thì word 1–3 đã có sẵn).
- Đọc nhầm thứ tự trường trong lệnh STORE (`2 M M R`: địa chỉ trước, register sau), và quên PC tăng ngay sau fetch.
- Tính thời gian pipeline là n × k hoặc n, quên k − 1 đơn vị "làm đầy" dây chuyền.

## Cách chơi

1. Năm cửa mở lần lượt; cửa sau chỉ mở khi đã giải cửa trước. Mỗi cửa cho một chữ cái, ghép lại thành mật mã **FETCH**.
2. Bên trái là **phòng**: câu chuyện, nhiệm vụ và ổ khóa. Bên phải là **bàn thí nghiệm** để nháp và kiểm tra, không tự đưa đáp án.
3. Điền đáp án rồi bấm **Thử mở khóa** (`Enter`). Ô sai viền đỏ. Cửa 4 không có ô điền: ổ khóa chạy chương trình sinh viên viết với 3 bộ dữ liệu thử.
4. Mỗi cửa có 2 gợi ý, mỗi gợi ý cộng 60 giây vào tổng thời gian.
5. Bấm Back (hoặc "← Chọn level") giữa chừng: đồng hồ dừng, bấm **Chơi tiếp** để quay lại đúng chỗ cũ.

## Các cửa (levels)

| # | Cửa | Nội dung | Bàn thí nghiệm | Chữ |
| --- | --- | --- | --- | --- |
| 1 | Cổng địa chỉ | 3 bài số bit địa chỉ / dung lượng (25 bit, 4 GB, 2 MB) | Máy đổi lũy thừa 2 | F |
| 2 | Kho bộ nhớ | Xếp 6 linh kiện vào subsystem + đếm hit (cache 2 dòng, block 4 word, LRU → 7 hit) | Mô phỏng cache | E |
| 3 | Phòng điều khiển | Trace chương trình 6 lệnh: R2 = 0042₁₆, M42 = 66, 6 machine cycle | Simple Computer (chạy từng pha) | T |
| 4 | Lò lập trình | Viết chương trình D = A + B + C đọc từ FE, in ra FF | Simple Computer (soạn và chạy) | C |
| 5 | Dây chuyền | Pipeline 3 tầng (22 và 14 đơn vị thời gian) + phân loại Flynn | Biểu đồ pipeline | H |

Lời giải gọn nhất cho cửa 4 (7 lệnh):

```text
10FE   ; R0 ← bàn phím (A)
11FE   ; R1 ← bàn phím (B)
12FE   ; R2 ← bàn phím (C)
3301   ; R3 ← R0 + R1
3432   ; R4 ← R3 + R2
2FF4   ; màn hình ← R4
0000   ; HALT
```

## Tính điểm

- **Xếp hạng trên lớp:** theo **Tổng** thời gian = thời gian giải + 60 giây × số gợi ý. Màn hình két thoát hiểm hiện đủ các cột để sinh viên chụp màn hình nộp.
- **Điểm mỗi cửa** (lưu vào tiến độ trên trang chủ): 100, −25 mỗi gợi ý, −10 mỗi lần thử sai, tối thiểu 20. Tổng tối đa 500. Bấm thử khi chưa điền ô nào không bị tính là sai.

## Gợi ý dùng trên lớp

- Dùng cuối chương như một buổi "escape room" thi đua: chơi theo cặp, một bạn trace bằng tay, một bạn kiểm tra trên bàn mô phỏng.
- Cửa 4 hợp làm bài tập nộp: yêu cầu thêm phiên bản lưu A, B, C vào bộ nhớ trước như lời giải trong sách, rồi so sánh số lệnh.
- Câu hỏi thảo luận: vì sao máy 32-bit không dùng hết 8 GB RAM? Vì sao GPU (SIMD) hợp với deep learning?

## Ghi chú kỹ thuật

| File | Vai trò |
| --- | --- |
| `index.html` | Màn hình giới thiệu / chơi (dải cửa + phòng + bàn thí nghiệm) / két thoát hiểm, hộp thoại hướng dẫn |
| `style.css` | Bố cục hai cột, cửa, mô phỏng CPU, bảng pipeline. Dùng token màu của base.css (sáng/tối) |
| `game.js` | `ROOMS` (đề, đáp án, gợi ý, debrief), mô phỏng Simple Computer, cache LRU, pipeline, đồng hồ |

- Bộ lệnh là bản rút gọn của Simple Computer (Forouzan, chương 5): `0` HALT, `1` LOAD, `2` STORE, `3` ADDI, `A` INC, `B` DEC, `D` JUMP. Ô `FE` là bàn phím, `FF` là màn hình.
- Đáp án nằm trong trường `ans` của từng ô trong `ROOMS`. Đổi đề thì nhớ sửa luôn `hints` và `debrief`.
- Ổ khóa cửa 4 chạy chương trình với `TESTS` (tối đa 300 cycle mỗi bộ) và yêu cầu in **đúng một** số.
- Đồng hồ chỉ chạy khi đang ở màn hình chơi và đã có thao tác đầu tiên. Trạng thái ván chơi chỉ nằm trong bộ nhớ: tải lại trang hoặc đổi ngôn ngữ sẽ mất ván đang chơi (điểm các cửa đã mở vẫn được lưu).
- Game được chuyển từ bản Artifact gốc `Mật Thất Von Neumann.html` sang khung chung của repo: dùng `base.css`, `common.js`, song ngữ và lưu tiến độ.

## Ý tưởng mở rộng

- Đề ngẫu nhiên cho cửa 1 và 3 để mỗi nhóm một bộ số khác nhau.
- Thêm cửa về JUMP: viết vòng lặp đếm ngược bằng DEC và JUMP.
- Lưu kỷ lục thời gian tốt nhất trên trình duyệt.
