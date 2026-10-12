# Computer Software & Operating Systems (Chủ đề 3)

Chủ đề bám theo bài giảng _Computer Software and Operating Systems_ và Forouzan, _Foundations of Computer Science_, chương 7: các lớp phần mềm, bốn khối của hệ điều hành (memory, process, device, file), deadlock, starvation, AI stack và cách chọn hệ điều hành.

## Trạng thái

| Phần | Game | Trạng thái | Tài liệu |
| --- | --- | --- | --- |
| Phòng lab | 🖥️ Phòng Lab Hệ Điều Hành | ✅ | [README](lab/os-lab/README.md) |

Phòng Lab gồm 8 bàn thí nghiệm trong một trang, xếp theo thứ tự của script bài giảng. Bản Artifact gốc là `Phòng Lab Hệ Điều Hành.html`; bản trong repo đã chuyển sang khung chung (giao diện sáng/tối, song ngữ, lưu tiến độ). Sửa nội dung thì sửa ở `lab/os-lab/`.

## Ý tưởng tách thành game riêng

Nếu muốn mỗi bàn thí nghiệm thành một game ngắn, có điểm số:

- **Paging Puzzle:** nạp chương trình vào RAM chỉ có 12 frame, ít page fault nhất thì thắng.
- **Scheduler Showdown:** chọn chính sách (FIFO, SJF, round robin) để thời gian chờ trung bình thấp nhất.
- **Break the Deadlock:** cho một đồ thị cấp phát tài nguyên, tìm điều kiện nào cần phá.
- **Stack Doctor:** đọc log lỗi huấn luyện và chỉ ra lớp nào của AI stack bị hỏng.
