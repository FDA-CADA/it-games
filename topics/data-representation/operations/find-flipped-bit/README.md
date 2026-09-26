# 📡 Find the Flipped Bit

> **Chủ đề:** Data, Information & Their Representation · **Phần:** 3. Operations on Data · **Slide:** 3.1 Logic operations (XOR, ứng dụng parity)
> **Trạng thái:** ✅ Đã chơi được · **Thời lượng:** 8 phút

## Mục tiêu học tập

- Tính **even parity** cho một gói tin (parity = XOR các bit dữ liệu).
- Phát hiện gói tin bị lật 1 bit ở phía nhận.
- Hiểu giới hạn: parity chỉ phát hiện số **lẻ** bit lỗi và không biết lỗi nằm ở đâu.
- Thấy parity 2 chiều **sửa** được lỗi 1 bit, dẫn tới khái niệm mã sửa lỗi (Hamming, ECC, mã QR).

## Lỗi sai nhắm tới

- Đếm số bit 1 mà quên tính cả bit parity khi kiểm tra.
- Tin rằng parity OK nghĩa là dữ liệu chắc chắn đúng.
- Nghĩ rằng phát hiện lỗi đồng nghĩa với sửa được lỗi.

## Cách chơi

- **Tính parity:** 4 gói, mỗi gói 7 bit dữ liệu và 1 bit parity (viền cam). Bấm bit parity để tổng số bit 1 là số chẵn.
- **Trạm kiểm tra:** 6 gói đi qua "kênh nhiễu", một vài gói bị lật bit. Bấm để đánh dấu ✅ OK hoặc ❌ Lỗi. Sau khi kiểm tra, game hiện gói gốc và gạch chân các bit bị lật.
- **Lỗi 2 bit:** như trên nhưng có gói bị lật 2 bit. Đánh dấu theo những gì parity báo. Kết quả sẽ lộ ra gói "lọt lưới". Cuối level có câu hỏi tổng kết.
- **Parity 2 chiều:** lưới 4×4 kèm parity của từng hàng và từng cột. Một bit bị lật, bấm vào đúng ô đó để sửa. Chọn sai thì hàng và cột bị lẻ được khoanh đỏ.

## Levels

| # | Tên | Nội dung | Vòng |
| --- | --- | --- | --- |
| 1 | Tính parity | Bên gửi đặt parity | 4 |
| 2 | Trạm kiểm tra | 1–3 gói lỗi 1 bit trong 6 gói | 4 |
| 3 | Lỗi 2 bit | Có gói lỗi 2 bit + câu hỏi tổng kết | 3 + 1 |
| 4 | Parity 2 chiều | Tìm và sửa bit lỗi trong lưới 4×4 | 4 |

## Tính điểm

- Level 1–3: +3 mỗi gói đúng, +5 nếu cả vòng đúng ngay lần đầu.
- Câu hỏi và parity 2 chiều: +10 nếu đúng ngay lần đầu, +4 nếu đúng sau đó.

## Gợi ý dùng trên lớp

- Trò ảo thuật parity 2 chiều: sinh viên xếp lưới thẻ, giảng viên quay đi, một bạn lật một thẻ, giảng viên chỉ ra ngay thẻ bị lật.
- Liên hệ: RAM ECC trong máy chủ, mã QR vẫn đọc được khi bị bẩn một góc, checksum khi tải file.

## Ghi chú kỹ thuật

- Gói tin = 7 bit dữ liệu << 1 | parity. Các bit bị lật được chọn ngẫu nhiên và không trùng nhau.
- Ở level 3, sinh viên được chấm theo **điều parity báo** (tổng số bit 1 lẻ hay chẵn), để câu chuyện "lọt lưới" là hậu quả của công cụ, không phải lỗi của người chơi.

## Ý tưởng mở rộng

- Mã Hamming (7,4): 3 bit kiểm tra, tự chỉ ra vị trí lỗi.
- Checksum / CRC đơn giản cho chuỗi byte.
