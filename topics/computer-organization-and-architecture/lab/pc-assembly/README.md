# 🛠️ Xưởng Lắp Ráp PC 3D (3D PC Assembly Workshop)

> **Chủ đề:** Computer Organization & Architecture · **Phần:** Phòng lab · **Tham chiếu:** Forouzan chương 5 (5.2–5.4: CPU, main memory, I/O subsystem)
> **Trạng thái:** ✅ Đã chơi được · **Thời lượng:** 5–15 phút · **Công nghệ:** Three.js 0.160 (WebGL) nạp từ CDN, cần mạng

## Mục tiêu học tập

Sau khi chơi, sinh viên:

- Gọi tên và chỉ đúng vị trí của 16 thành phần: CPU, tản nhiệt, RAM, SSD M.2, HDD, card đồ họa, bo mạch chủ, bộ nguồn, tấm chắn I/O, các cáp nguồn, màn hình, bàn phím và chuột.
- Biết thứ tự lắp và lý do: tấm chắn I/O trước bo mạch chủ, tản nhiệt sau CPU, cáp 8-pin sau tản nhiệt, màn hình sau card đồ họa.
- Phân biệt thiết bị **nhập** (bàn phím, chuột, nối USB trên tấm I/O) với thiết bị **xuất** (màn hình, nối vào card đồ họa), và các thành phần thuộc CPU, main memory, lưu trữ (I/O subsystem), nguồn điện.
- Hiểu luồng gió trong thùng máy: khí mát vào ở mặt trước, khí nóng ra ở quạt xả sau và qua bộ nguồn.

## Lỗi sai nhắm tới

- Nghĩ lắp linh kiện thế nào cũng được, bỏ qua thứ tự phụ thuộc (I/O shield, keo tản nhiệt, cáp nguồn CPU).
- Bỏ qua chống tĩnh điện khi chạm vào linh kiện.
- Nhầm RAM (bộ nhớ tạm, mất khi tắt máy) với SSD/HDD (lưu trữ lâu dài); quên cắm RAM vào cặp khe A2/B2 để chạy kênh đôi.
- Nghĩ NVMe M.2 cũng cần cáp dữ liệu SATA.
- Cắm màn hình vào cổng của bo mạch chủ thay vì card đồ họa rời.

## Cách chơi

1. Kéo linh kiện từ thảm chống tĩnh điện vào thùng máy, hoặc chạm để chọn rồi chạm vị trí lắp. Kéo trên khung 3D để xoay, cuộn hoặc chụm hai ngón để phóng to; các nút góc nhìn (Bàn làm việc, Hông trái, Mặt trước, Mặt sau, Từ trên) ở góc trên trái. Bàn phím: Tab vào thùng máy, mũi tên chọn vị trí, Enter để lắp.
2. Màn hình, bàn phím, chuột: thả chỗ nào trên **mặt bàn** bên trái thùng máy cũng được, thiết bị tự xếp vào vị trí và cáp tự nối vào cổng ở mặt sau (xoay sang góc "Mặt sau" để xem).
3. Ba chế độ:
   - **Học:** khối vàng nhấp nháy chỉ vị trí kế tiếp, thẻ hướng dẫn nêu cách lắp và lý do. Sai 3 lần liên tiếp thì máy lắp giúp.
   - **Kiểm tra:** không gợi ý, tính giờ, mỗi lần sai trừ 4 điểm. Điểm được lưu làm kỷ lục.
   - **Khám phá:** máy đã chạy sẵn, chạm vào linh kiện để xem thông số và vai trò.
4. Lắp đủ 16 thành phần thì bấm **Bật nguồn**: tiếng bíp POST, quạt quay, màn hình hiện **Hello IT** và luồng gió xanh (vào) chuyển cam (ra).

## Ghi chú kỹ thuật

- Bản gốc là Artifact `Xưởng lắp ráp PC 3D.html`. Bản trong repo đã chuyển sang khung chung (song ngữ, sáng/tối, kỷ lục) và thêm màn hình, bàn phím, chuột. Dữ liệu linh kiện ở mảng `PARTS` trong `game.js` (đơn vị cm; `needs` là các thành phần phải lắp trước; `c`, `s` là tâm và kích thước vùng thả). Thiết bị ngoại vi dùng `periph: true`, `at` (chỗ thiết bị tự trượt về) và cáp nằm trong `PCAB`.
- Game dùng Three.js qua import map từ `cdn.jsdelivr.net`, là ngoại lệ so với nguyên tắc "không framework" vì cần dựng 3D. Không tải được thì game báo lỗi và không chơi được.
- Bản 2D cũ (PixiJS) vẫn còn ở [`../pc-assembly-2d/`](../pc-assembly-2d/README.md) cho máy yếu hoặc dùng sau này.
- Một số bước được giản lược: cáp dữ liệu SATA và cáp nguồn phụ của card đồ họa không có.
