# 🧱 Remainder Tower

> **Chủ đề:** Data, Information & Their Representation · **Phần:** 1. Number Systems · **Slide:** 1.5 Conversion (decimal → base r)
> **Trạng thái:** ✅ Đã chơi được · **Thời lượng:** 5–8 phút · ⭐ Ưu tiên cao (lỗi sai phổ biến nhất)

## Mục tiêu học tập

- Thực hiện đúng thuật toán chia liên tiếp cho r.
- Hiểu **vì sao** phải đọc số dư từ dưới lên: số dư đầu tiên là chữ số hàng r⁰.
- Viết đúng chữ số A–F cho số dư 10–15 trong hệ 16.

## Lỗi sai nhắm tới

1. **Quên đảo ngược thứ tự số dư.** Đây là lỗi kinh điển và là trọng tâm của game.
2. Viết số dư `11` thay vì `B` trong hệ 16.
3. Dừng chia quá sớm (khi thương < r thay vì khi thương = 0).

## Cách chơi

1. Đề bài có dạng *"Đổi 156₁₀ sang hệ 2"*.
2. Mỗi dòng của thang chia là `d ÷ r = [thương] dư [số dư]`. Sinh viên nhập cả hai rồi nhấn `Enter`. Có tùy chọn *"Tự tính thương"* để chỉ nhập số dư.
3. Mỗi dòng đúng thì số dư rơi thành một khối trong cột *Số dư*, và thương trở thành số bị chia của dòng sau.
4. Khi thương = 0, sinh viên chọn **⬆ Đọc từ dưới lên** hoặc **⬇ Đọc từ trên xuống**.
   - Chọn sai: game đọc thử theo hướng đó và đổi ngược về hệ 10 để cho thấy kết quả **khác** số ban đầu, ví dụ `00111001₂ = 57 ≠ 156`.
   - Chọn đúng: các khối sáng lần lượt từ dưới lên, mỗi khối được gắn nhãn `× rⁱ`, rồi hiện dòng kiểm tra `1×2⁷ + … = 156 ✓`.

Game chỉ chọn những số mà đọc xuôi và đọc ngược cho kết quả khác nhau (không chọn số đối xứng như `101₂`), nên chọn sai hướng luôn bị lộ.

## Levels

| # | Tên | Cơ số | Khoảng số | Vòng |
| --- | --- | --- | --- | --- |
| 1 | Nhị phân nhỏ | 2 | 10–63 | 4 |
| 2 | Một byte | 2 | 64–255 | 4 |
| 3 | Bát phân | 8 | 65–999 | 4 |
| 4 | Thập lục phân | 16 | 200–4095 | 4 |
| 5 | Hỗn hợp | 2/8/16 | 100–2000 | 5 |

## Tính điểm

- +5 cho mỗi dòng chia đúng ngay lần đầu.
- +15 nếu chọn đúng hướng đọc ngay lần đầu.
- Màn kết thúc đếm số vòng "hoàn hảo" (không sai bước nào).

## Gợi ý dùng trên lớp

- Chiếu game, cho cả lớp biểu quyết hướng đọc trước khi bấm.
- Sau khi chơi, hỏi: *"Nếu chia cho 10 liên tiếp, các số dư là gì?"* (Là các chữ số của chính số đó, từ hàng đơn vị trở lên. Đây là lời giải thích trực quan nhất.)

## Ghi chú kỹ thuật

- `S.steps` lưu toàn bộ lời giải `{d, q, r}` ngay từ đầu vòng.
- Ô số dư chấp nhận cả chữ số thập phân (`11`) lẫn chữ cái (`B`). Nếu sinh viên gõ `11` trong hệ 16, game vẫn chấp nhận nhưng nhắc cách viết đúng.
- Tùy chọn "Tự tính thương" được lưu trong `localStorage` (`remainder-tower:auto`).

## Ý tưởng mở rộng

- Level "ngược": cho sẵn tháp số dư, sinh viên suy ra số ban đầu.
- Đổi sang cơ số lạ (3, 5, 7) để kiểm tra sinh viên hiểu thuật toán chứ không chỉ học thuộc cho hệ 2.
