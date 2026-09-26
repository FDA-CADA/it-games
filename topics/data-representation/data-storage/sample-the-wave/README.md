# 🔊 Sample the Wave

> **Chủ đề:** Data, Information & Their Representation · **Phần:** 2. Data Storage · **Slide:** 2.4 Audio (sampling, quantization)
> **Trạng thái:** ✅ Đã chơi được · **Thời lượng:** 8–10 phút · 🎧 Nên dùng tai nghe

## Mục tiêu học tập

- Hiểu hai tham số số hóa âm thanh: **sampling rate** và **bit depth**.
- Áp dụng **định lý Nyquist**: sampling rate ≥ 2 × tần số cao nhất. Thấp hơn thì bị **aliasing**.
- Biết mỗi bit thêm vào tăng khoảng 6 dB SNR, và làm dung lượng tăng tuyến tính.
- Tính dung lượng: rate × bit × kênh × giây ÷ 8. Tìm cấu hình tiết kiệm nhất đạt yêu cầu.

## Lỗi sai nhắm tới

- Nghĩ rằng cứ giảm sampling rate thì chỉ "hơi rè" (thật ra dưới Nyquist thì âm cao biến thành âm giả).
- Nhầm hai loại méo: aliasing (do sampling rate) và nhiễu lượng tử (do bit depth).
- Quên nhân số kênh (stereo) hoặc quên chia 8 khi tính dung lượng.

## Cách chơi

- **Hình sóng:** hiện một khung vài mili giây gồm sóng gốc (xám), các mẫu (chấm vàng), bản số hóa (nét đậm), và các mức lượng tử khi bit depth ≤ 5.
- **Hai thanh trượt:** sampling rate (2 kHz → 48 kHz) và bit depth (1 → 16 bit). Nhiệm vụ stereo có thêm nút chọn kênh.
- **Đồng hồ đo:** dung lượng 10 giây so với ngân sách, kiểm tra Nyquist, SNR ≈ 6.02 × bit + 1.76 dB, và nhãn chất lượng (Tệ, Chấp nhận được, Tốt, CD).
- **Nghe thử:** ▶ bản gốc và ▶ bản số hóa, mỗi bản 2.5 giây, tạo bằng Web Audio. Bản số hóa lấy mẫu **không qua bộ lọc chống aliasing**, nên aliasing nghe rõ thật.
- Bấm **📤 Nộp cấu hình**: game báo từng vấn đề (Nyquist, bit depth, ngân sách, stereo) và so với cấu hình tiết kiệm nhất.

## Levels

| # | Tên | Nội dung |
| --- | --- | --- |
| 1 | Kỹ sư âm thanh | 5 nhiệm vụ: giọng nói 80 KB, nhạc "Tốt" 250 KB, nhạc 150 KB (chỉ còn đúng một cách), podcast "Tốt" 100 KB, nhạc Hi-Fi stereo CD 1.8 MB |
| 2 | Câu hỏi Nyquist | 6 câu: tần số tối thiểu, vì sao 44.1 kHz, bit depth và dung lượng, dung lượng CD stereo, aliasing vs nhiễu lượng tử |

## Tính điểm

- Nhiệm vụ đạt yêu cầu: +20, cộng tới +10 theo tỉ lệ (dung lượng tối ưu ÷ dung lượng của bạn).
- Câu hỏi: +10 mỗi câu đúng ngay lần đầu.

## Gợi ý dùng trên lớp

- Chiếu nhiệm vụ 2, cho cả lớp nghe bản 8 kHz (aliasing) rồi 22 kHz.
- Liên hệ: mô hình nhận dạng giọng nói (Whisper) dùng âm thanh 16 kHz, ứng với Nyquist 8 kHz, đủ cho giọng người.

## Ghi chú kỹ thuật

- Chất lượng tính theo công thức lý thuyết (Nyquist + SNR của bộ lượng tử đều), không đo trên âm thanh, để nhất quán và dễ giải thích.
- Tín hiệu "giọng nói" là tổng các họa âm của 180 Hz có formant, tối đa 3.4 kHz. "Nhạc" có giai điệu cộng các thành phần 6 kHz và 9.5 kHz. "Hi-Fi" có thêm 15 kHz.
- Cấu hình tối ưu được tìm bằng cách thử hết mọi tổ hợp (`optimum()`).

## Ý tưởng mở rộng

- Vẽ phổ tần số (FFT) để *nhìn thấy* aliasing gập tần số.
- Ghi âm giọng của chính sinh viên bằng micro (`getUserMedia`) rồi số hóa lại.
