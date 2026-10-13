# 🛠️ Xưởng Lắp Ráp PC, bản 2D (lưu trữ)

> **Bản lưu:** đã được thay bằng bản 3D ở [`../pc-assembly/`](../pc-assembly/README.md) và không còn trong catalog. Giữ lại để dùng sau (máy yếu không chạy được WebGL 3D, hoặc cần bản nhẹ). Vẫn mở được trực tiếp ở `lab/pc-assembly-2d/`; muốn đưa lại lên trang chủ thì thêm mục vào `assets/js/catalog.js` với `id: "pc-assembly-2d"`.


> **Chủ đề:** Computer Organization & Architecture · **Phần:** Phòng lab · **Tham chiếu:** Forouzan chương 5 (5.2–5.4: CPU, main memory, I/O subsystem)
> **Trạng thái:** ✅ Đã chơi được · **Thời lượng:** 5–15 phút · **Công nghệ:** PixiJS 7 (WebGL) nạp từ CDN, cần mạng

## Mục tiêu học tập

Sau khi chơi, sinh viên:

- Gọi tên và chỉ đúng vị trí của 16 linh kiện: CPU, tản nhiệt, RAM, SSD M.2, HDD, card đồ họa, bo mạch chủ, bộ nguồn, tấm chắn I/O và các cáp nguồn.
- Biết thứ tự lắp và lý do: tấm chắn I/O trước bo mạch chủ, tản nhiệt sau CPU, cáp 8-pin sau tản nhiệt.
- Phân biệt thành phần thuộc CPU, main memory, lưu trữ (I/O subsystem) và nguồn điện.
- Hiểu luồng gió trong thùng máy: khí mát vào ở mặt trước, khí nóng ra ở mặt sau.

## Lỗi sai nhắm tới

- Nghĩ lắp linh kiện thế nào cũng được, bỏ qua thứ tự phụ thuộc (I/O shield, keo tản nhiệt, cáp nguồn CPU).
- Bỏ qua chống tĩnh điện khi chạm vào linh kiện.
- Nhầm RAM (bộ nhớ tạm, mất khi tắt máy) với SSD/HDD (lưu trữ lâu dài), hay nhầm DDR4 với DDR5.
- Nghĩ NVMe M.2 cũng cần cáp dữ liệu SATA.

## Cách chơi

1. Kéo linh kiện từ thảm chống tĩnh điện vào thùng máy, hoặc chạm để chọn rồi chạm vị trí lắp. Bàn phím: Tab vào thùng máy, mũi tên chọn vị trí, Enter để lắp.
2. Ba chế độ:
   - **Học:** khung vàng nhấp nháy chỉ vị trí kế tiếp, thẻ hướng dẫn nêu cách lắp và lý do. Sai 3 lần liên tiếp thì máy lắp giúp.
   - **Kiểm tra:** không gợi ý, tính giờ, mỗi lần sai trừ 4 điểm. Điểm được lưu làm kỷ lục.
   - **Khám phá:** máy đã chạy sẵn, chạm vào linh kiện để xem thông số và vai trò.
3. Lắp đủ 16 linh kiện thì bấm **Bật nguồn**: tiếng bíp POST, quạt quay và luồng gió xanh (vào) chuyển cam (ra).

## Ghi chú kỹ thuật

- Bản gốc là Artifact `Xưởng lắp ráp PC.html`. Bản trong repo đã chuyển sang khung chung (song ngữ, sáng/tối, kỷ lục). Phần vẽ linh kiện và luật lắp nằm trong `game.js`; dữ liệu linh kiện ở mảng `PARTS` (mỗi phần tử có `needs` là các linh kiện phải lắp trước).
- Game dùng PixiJS từ `cdn.jsdelivr.net`, là ngoại lệ so với nguyên tắc "không framework" vì cần vẽ WebGL. Không tải được thì game báo lỗi và không chơi được.
- Một số bước được giản lược: cáp dữ liệu SATA và cáp nguồn phụ của card đồ họa không có.
