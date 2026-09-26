# IT Games: web game cho học phần Nhập môn Công nghệ thông tin

Bộ web game tương tác giúp sinh viên khối ngành **Khoa học dữ liệu và Trí tuệ nhân tạo** hiểu bài nhanh hơn. Mỗi game ngắn (5–10 phút) và nhắm vào **một lỗi sai hay gặp**, không chỉ để luyện tập.

🎮 **Chơi ngay:** `https://<github-username>.github.io/<tên-repo>/` (cập nhật link sau khi bật GitHub Pages)

## Danh sách game

| Chủ đề | Phần | Game | Luyện kỹ năng |
| --- | --- | --- | --- |
| [Data, Information & Their Representation](topics/data-representation/README.md) (Tuần 2) | Number Systems | [💡 Bit Flip](topics/data-representation/number-systems/bit-flip/README.md) | Trọng số vị trí hệ 2/8/16 |
| | | [🎨 Hex Color Mixer](topics/data-representation/number-systems/hex-color-mixer/README.md) | Hex qua mã màu `#RRGGBB` |
| | | [🧱 Remainder Tower](topics/data-representation/number-systems/remainder-tower/README.md) | Thập phân → hệ r, hướng đọc số dư |
| | | [🎣 Bit Fishing](topics/data-representation/number-systems/bit-fishing/README.md) | Phần thập phân → nhị phân, số lặp vô hạn |
| | | [🧩 Bit Tetris](topics/data-representation/number-systems/bit-tetris/README.md) | Nhóm bit bin ↔ oct/hex |
| | | [🎯 Máy tính có lưu chính xác không?](topics/data-representation/number-systems/exact-or-approx/README.md) | Exact vs approximate, `0.1 + 0.2` |
| | Data Storage | [🔍 One Byte, Many Meanings](topics/data-representation/data-storage/one-byte-many-meanings/README.md) | Một byte, bốn cách diễn giải |
| |  | [🚗 Odometer Overflow](topics/data-representation/data-storage/odometer-overflow/README.md) | Tràn số không dấu, mod 2ⁿ |
| |  | [🎡 Number Wheel](topics/data-representation/data-storage/number-wheel/README.md) | Sign-and-magnitude vs two's complement |
| |  | [⚙️ Negate Machine](topics/data-representation/data-storage/negate-machine/README.md) | Đổi dấu: Invert rồi +1 |
| |  | [🏗️ Float Builder](topics/data-representation/data-storage/float-builder/README.md) | Mã hóa và giải mã IEEE 754 |
| |  | [🌡️ Exponent Zones](topics/data-representation/data-storage/exponent-zones/README.md) | Overflow, underflow, subnormal |
| |  | [🕵️ ASCII Spy](topics/data-representation/data-storage/ascii-spy/README.md) | ASCII, mẹo 0x20, Unicode/UTF-8 |
| |  | [🔊 Sample the Wave](topics/data-representation/data-storage/sample-the-wave/README.md) | Sampling rate, bit depth, Nyquist |
| |  | [🔎 Zoom War](topics/data-representation/data-storage/zoom-war/README.md) | Raster vs vector |
| |  | [💾 Storage Budget](topics/data-representation/data-storage/storage-budget/README.md) | Dung lượng ảnh, âm thanh, video |

Các game đang ở dạng ý tưởng được liệt kê trong README của từng chủ đề và trong [`assets/js/catalog.js`](assets/js/catalog.js) (`status: "planned"`).

## Cấu trúc thư mục

```text
.
├── index.html                  # Trang chủ, tự sinh danh sách game từ catalog.js
├── .nojekyll                   # Báo GitHub Pages phục vụ file tĩnh nguyên trạng
├── assets/
│   ├── css/base.css            # Giao diện chung: token màu sáng/tối, nút, card, HUD…
│   ├── js/common.js            # Tiện ích chung (namespace G): header, timer, điểm, âm thanh…
│   ├── js/catalog.js           # ⭐ DANH MỤC mọi chủ đề, phần và game
│   └── favicon.svg
├── topics/                     # Mỗi chủ đề (chương) một thư mục
│   └── data-representation/
│       ├── README.md           # Tổng quan chủ đề, trạng thái, ý tưởng game
│       └── number-systems/     # Mỗi phần của chủ đề một thư mục
│           └── bit-flip/       # Mỗi game một thư mục, độc lập
│               ├── index.html
│               ├── style.css
│               ├── game.js
│               └── README.md   # Mục tiêu, lỗi sai nhắm tới, luật, level, ghi chú kỹ thuật
├── templates/game/             # Khung để copy khi tạo game mới
└── docs/
    └── adding-a-game.md        # Hướng dẫn thêm game và chủ đề, API dùng chung
```

Vì sao chọn cấu trúc này:

- **`topics/<chủ-đề>/<phần>/<game>/`** bám theo cấu trúc bài giảng, nên dễ tìm game theo slide. Mọi game đều sâu đúng 4 cấp, nên đường dẫn `../../../../assets/` giống hệt nhau và copy template là chạy.
- **Mỗi game một thư mục kèm README riêng**, nên sửa một game không ảnh hưởng game khác, và tài liệu nằm ngay cạnh code.
- **Một file `catalog.js` duy nhất** là nguồn sự thật cho trang chủ, header và nút "Game tiếp theo". Thêm game chỉ cần thêm một mục vào đây.
- **HTML/CSS/JS thuần, không build step:** push là GitHub Pages phục vụ ngay, ai cũng sửa được.

## Chạy trên máy

```bash
python3 -m http.server 8000
# mở http://localhost:8000
```

Mở trực tiếp file `index.html` bằng trình duyệt cũng chạy được, nhưng nên dùng server để giống môi trường thật.

## Deploy lên GitHub Pages

1. Tạo repo mới trên GitHub (ví dụ `intro-to-it-games`), **không** tick "Add a README".
2. Đẩy code lên:

   ```bash
   git remote add origin https://github.com/<github-username>/intro-to-it-games.git
   git push -u origin main
   ```

3. Trên GitHub: **Settings → Pages → Build and deployment**
   - *Source:* **Deploy from a branch**
   - *Branch:* `main`, thư mục `/ (root)` → **Save**
4. Khoảng 1 phút sau, site chạy tại `https://<github-username>.github.io/intro-to-it-games/`. Cập nhật link ở đầu README này.

Từ đó, mỗi lần `git push` lên `main`, Pages tự cập nhật. Nếu trình duyệt còn giữ bản cũ, bấm Ctrl+Shift+R để tải lại.

## Thêm game mới

Xem [docs/adding-a-game.md](docs/adding-a-game.md). Tóm tắt:

1. `cp -r templates/game topics/<chủ-đề>/<phần>/<game-id>`
2. Sửa `data-game`, `LEVELS` và logic trong `game.js`, viết `README.md`.
3. Thêm mục vào `assets/js/catalog.js` với `status: "ready"`.

## Quyền riêng tư

Game không có backend và không thu thập dữ liệu. Tiến độ và kỷ lục chỉ lưu trong `localStorage` trên trình duyệt của từng sinh viên.
