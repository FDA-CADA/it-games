# 🖥️ Phòng Lab Hệ Điều Hành (Operating System Lab)

> **Chủ đề:** Computer Software & Operating Systems · **Phần:** Phòng lab · **Slide:** 5–13, 24–30 · Forouzan 7.3
> **Trạng thái:** ✅ Đã chơi được · **Thời lượng:** 15–30 phút (tám mô phỏng, xem theo nhu cầu)

## Mục tiêu học tập

Sau khi dùng, sinh viên:

- Mô tả được đường đi của một yêu cầu từ ứng dụng qua hệ điều hành xuống phần cứng, và phân biệt system software với application software.
- Phân biệt monoprogramming, paging và demand paging; giải thích page fault và virtual memory.
- Giải thích vì sao scheduler cần các trạng thái Hold, Ready, Running, Waiting, Terminated và so sánh FIFO, SJF, round robin.
- Nêu bốn điều kiện của deadlock, ba cách phá và cái giá của từng cách; phân biệt deadlock với starvation.
- Thấy rằng AI stack (OS → driver → CUDA → Python → PyTorch) thiếu hoặc lệch một lớp là hỏng.
- Biết chọn Windows, Linux hay macOS theo công việc.

## Lỗi sai nhắm tới

- Nghĩ ứng dụng ghi thẳng xuống đĩa mà không qua OS và driver.
- Nghĩ chương trình phải nằm liền một khối trong RAM mới chạy được.
- Nghĩ "đến trước chạy trước" luôn là công bằng nhất.
- Nhầm deadlock (không ai tiến được) với starvation (có người bị bỏ đói mãi).
- Nghĩ cài PyTorch là đủ để dùng GPU, quên driver và phiên bản CUDA.

## Các bàn thí nghiệm

| # | Tab | Nội dung | Tương tác |
| --- | --- | --- | --- |
| 1 | Các lớp phần mềm | Ctrl+S, In, xem video đi qua User → App → OS → HW; phân loại System/Application | Bước tiếp, tự chạy, 10 thẻ phân loại |
| 2 | Bộ nhớ & paging | 12 frame RAM, 4 chương trình, page table, đĩa | Nạp/gỡ, truy cập page ngẫu nhiên (demand paging) |
| 3 | Lập lịch tiến trình | 5 process, RAM chứa 3, FIFO / SJF / round robin, biểu đồ Gantt | Bước tiếp, đổi chính sách và time slot |
| 4 | Deadlock | Hai process, hai file, đồ thị cấp phát | Không phòng tránh, thu hồi, xin đủ một lần, xin theo thứ tự |
| 5 | Bữa tối triết gia | 5 triết gia, 5 đũa | Cầm đũa trái trước (deadlock), ưu tiên theo ghế (starvation), ưu tiên người đợi lâu |
| 6 | AI stack | Bật/tắt 7 lớp rồi chạy `python train.py` | 5 tình huống mẫu, log lỗi giả lập |
| 7 | Terminal Linux | Máy Ubuntu giả lập, mỗi lệnh có chú thích khối OS | `chmod 000` rồi `cat` để thấy Permission denied |
| 8 | Chọn hệ điều hành | 8 tình huống và bảng so sánh | Chọn Windows / Linux / macOS, đọc giải thích |

## Tính điểm

Không có điểm hay đồng hồ: đây là phòng lab để khám phá. Mỗi tab được ghi nhận là đã khám phá (100 điểm) khi sinh viên thao tác lần đầu trong tab đó, nên trang chủ hiện tiến độ `x/8`. Nếu cần chấm, yêu cầu sinh viên chụp màn hình các kết quả mong muốn (deadlock ở bàn 4, starvation ở bàn 5, lỗi lệch CUDA ở bàn 6).

## Gợi ý dùng trên lớp

- Chiếu từng tab theo đúng thứ tự slide; cho cả lớp dự đoán bước tiếp theo trước khi bấm.
- Bàn 3: chạy FIFO rồi SJF với cùng bộ process, so sánh "TB nhịp tới khi xong".
- Bàn 5: chạy chính sách "ưu tiên theo ghế" khoảng 30 nhịp để thấy triết gia 5 bị bỏ đói.
- Bàn 7: cho sinh viên tự đoán lệnh nào hỏi khối nào của OS trước khi đọc chú thích.

## Ghi chú kỹ thuật

| File | Vai trò |
| --- | --- |
| `index.html` | Màn hình giới thiệu (danh sách bàn thí nghiệm) và phòng lab 8 tab, hộp thoại hướng dẫn |
| `style.css` | Toàn bộ luật nằm dưới `.oslab`, màu bắc cầu từ token của `base.css` (sáng/tối) |
| `game.js` | Dữ liệu và mô phỏng của 8 tab, điều hướng tab, ghi tiến độ |

- Có nút `#btn-menu` ẩn: khi người chơi bấm Back, `common.js` bấm nút này để dừng mọi bộ chạy tự động và quay về màn hình giới thiệu. Trạng thái các mô phỏng được giữ nguyên.
- Mô phỏng process, deadlock, triết gia là tất định; paging dùng `Math.random` để chọn frame trống và page truy cập.
- Tab đang xem được nhớ trong `localStorage` (`itgames:oslab-tab`).
- Chuyển từ bản Artifact gốc `Phòng Lab Hệ Điều Hành.html`; tên class nút đổi thành `.lbtn` và `.pbadge` để không đụng `.btn`, `.badge` của `base.css`.
