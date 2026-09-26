# 🔎 Zoom War

> **Chủ đề:** Data, Information & Their Representation · **Phần:** 2. Data Storage · **Slide:** 2.4 Image (raster vs vector)
> **Trạng thái:** ✅ Đã chơi được · **Thời lượng:** 5–8 phút

## Mục tiêu học tập

- Phân biệt ảnh **raster** (lưới pixel) và **vector** (mô tả hình học).
- Hiểu vì sao raster vỡ pixel khi phóng to còn vector thì không.
- Tính dung lượng ảnh raster, và biết phóng to 4 lần cần gấp 16 lần số pixel.
- Chọn đúng định dạng cho từng tình huống: ảnh chụp, logo, biểu đồ, icon, font, dữ liệu cho CNN.

## Lỗi sai nhắm tới

- Nghĩ rằng vector luôn tốt hơn (thật ra ảnh chụp không thể lưu bằng vector một cách hiệu quả).
- Nghĩ rằng phóng to 4 lần thì dung lượng raster tăng 4 lần (thật ra 16 lần).
- Quên nhân 3 kênh màu, hoặc quên chia 8, khi tính dung lượng ảnh.

## Cách chơi

- **Ai vỡ trước?** Hai ô A và B hiện cùng một hình: một ô là SVG, một ô là bản raster của chính hình đó. Kéo thanh zoom (tới 32×) hoặc bấm **▶ Zoom liên tục**, rồi chọn ô nào là raster. Độ phân giải raster tăng dần qua các vòng (200 → 2000 px), nên càng về sau càng phải zoom sâu. Trả lời xong sẽ thấy dung lượng của hai loại.
- **Dung lượng:** 5 câu trắc nghiệm (ảnh 512², phóng to 4 lần, file SVG, ảnh chụp, MNIST).
- **Chọn định dạng:** 7 tình huống, chọn Raster hoặc Vector.

## Levels

| # | Tên | Số câu |
| --- | --- | --- |
| 1 | Ai vỡ trước? | 5 vòng zoom (ngôi sao, logo chữ, biểu đồ, biểu tượng) |
| 2 | Dung lượng | 5 câu |
| 3 | Chọn định dạng | 7 tình huống |

## Tính điểm

+10 mỗi câu đúng ngay lần đầu.

## Gợi ý dùng trên lớp

- Mở một file SVG bằng Notepad để sinh viên thấy nó chỉ là văn bản.
- Liên hệ Data/AI: `plt.savefig("fig.svg")` cho báo cáo; ảnh đưa vào CNN là tensor raster `H × W × C`.

## Ghi chú kỹ thuật

- Bản raster được tạo bằng cách vẽ **chính file SVG** vào canvas có độ phân giải thấp. Khi zoom, game phóng to bằng nearest-neighbor (`imageSmoothingEnabled = false`) để thấy rõ từng pixel.
- Bản vector zoom bằng cách thu nhỏ `viewBox` quanh một điểm cạnh của hình (`focus`).
- Dung lượng SVG hiển thị là số byte thật của đoạn markup.

## Ý tưởng mở rộng

- Thêm ảnh chụp thật (JPEG) để thấy vector hóa ảnh chụp thất bại ra sao.
- Level nén: PNG (không mất dữ liệu) vs JPEG (mất dữ liệu) ở các mức chất lượng khác nhau.
