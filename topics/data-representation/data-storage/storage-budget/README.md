# 💾 Storage Budget

> **Chủ đề:** Data, Information & Their Representation · **Phần:** 2. Data Storage · **Slide:** 2.4 Image, audio, video (boss: slide 81)
> **Trạng thái:** ✅ Đã chơi được · **Thời lượng:** 5–8 phút

## Mục tiêu học tập

- Tính dung lượng chưa nén của ảnh, âm thanh, video.
- Có cảm giác về **bậc độ lớn** (KB, MB, GB): ảnh MNIST vài trăm byte, video vài GB.
- Hiểu vì sao video luôn phải nén.

## Lỗi sai nhắm tới

Mỗi câu có 4 đáp án, trong đó 3 đáp án sai được **sinh từ lỗi hay gặp**. Khi sinh viên chọn sai, game nói rõ lỗi đó là gì:

| Loại | Đáp án nhiễu |
| --- | --- |
| Ảnh | quên ÷ 8, tính như ảnh xám 8-bit, nhân 3 kênh hai lần, nhầm đơn vị (× hoặc ÷ 1024) |
| Âm thanh | quên ÷ 8, quên nhân 2 kênh, quên nhân thời lượng, nhầm phút thành giây, nhầm đơn vị |
| Video | quên ÷ 8, quên nhân fps, quên nhân thời lượng, chỉ tính 1 khung hình, nhầm đơn vị |

## Cách chơi

- Mỗi câu là một "clip" kèm thông số (độ phân giải, bit depth, sampling rate, số kênh, fps, thời lượng).
- Chọn 1 trong 4 đáp án (phím `1`–`4`) trong 40 giây.
- Trả lời xong sẽ thấy **lời giải từng bước**: pixel → bit → bit/giây → byte → đơn vị.

## Levels

| # | Tên | Nội dung |
| --- | --- | --- |
| 1 | Ảnh | 5 ảnh: MNIST, đầu vào ResNet, VGA, Full HD, 12 MP, PNG có alpha, scan đen trắng |
| 2 | Âm thanh | 5 file: cuộc gọi, bài hát CD, voice note, podcast, bản thu studio |
| 3 | Video | 5 clip: 720p, Full HD, GIF, camera an ninh 1 giờ, slow-motion 4K |
| 4 | Boss | Trộn 4 câu, câu cuối là bài trên slide 81: 640×480, 24-bit, 120 fps, 10 s ≈ 1.03 GB |

## Tính điểm

Mỗi câu đúng được 10 điểm + ⌊số giây còn lại ÷ 4⌋.

## Gợi ý dùng trên lớp

- Dùng level Boss để chữa bài tập slide 81 ngay trên lớp.
- Câu hỏi mở: *"Video Full HD 1 phút chưa nén hơn 10 GB. Vì sao file MP4 chỉ khoảng 100 MB?"* (Dẫn sang nén có mất dữ liệu.)

## Ghi chú kỹ thuật

- Quy ước 1 KB = 1024 B (`G.formatBytes`). Riêng câu Boss ghi thêm kết quả nếu tính theo 10⁹.
- Các đáp án nhiễu được lọc để khác nhau ít nhất 1.5 lần và hiển thị khác nhau.
- Thêm clip mới: thêm một object vào `IMAGES`, `AUDIOS` hoặc `VIDEOS`.

## Ý tưởng mở rộng

- Chế độ ngược: cho dung lượng và ngân sách, hỏi độ phân giải hoặc fps tối đa.
- Thêm tỉ lệ nén (JPEG ~10:1, MP3 ~11:1, H.264 ~100:1).
