# Thêm game mới

Hướng dẫn này dành cho người muốn thêm game vào repo, dù cho chủ đề đã có hay chủ đề mới.

## 1. Tạo thư mục từ template

```bash
# Ví dụ: game "Number Wheel" thuộc phần Data Storage của chủ đề data-representation
cp -r templates/game topics/data-representation/data-storage/number-wheel
```

Quy ước đặt tên:

- **Thư mục và id game:** `kebab-case`, tiếng Anh, không dấu, ví dụ `number-wheel`.
- **Cấu trúc:** `topics/<chủ-đề>/<phần>/<game>/`. Luôn đủ 4 cấp để đường dẫn tương đối `../../../../` về gốc site giống nhau ở mọi game.

## 2. Sửa 3 chỗ bắt buộc

1. `index.html`: sửa `<title>`, `data-game="number-wheel"`, nội dung màn hình start và hộp thoại hướng dẫn.
2. `game.js`: sửa `GAME_ID`, `LEVELS`, logic trong `nextRound()` / `answer()`.
3. [`assets/js/catalog.js`](../assets/js/catalog.js): thêm (hoặc sửa) mục của game:

```js
{
  id: "number-wheel", title: "Number Wheel", icon: "🎡", status: "ready",
  path: "topics/data-representation/data-storage/number-wheel/",
  skill: "2.2 Integers",
  desc: "Một câu mô tả hiện trên thẻ ở trang chủ.",
},
```

Trang chủ, header của game ("← Tất cả game", tên phần) và nút "Game tiếp theo" đều tự sinh từ `catalog.js`.

## 3. Viết README.md cho game

Điền theo khung có sẵn trong template. Phần quan trọng nhất là **Lỗi sai nhắm tới**: mỗi game phải trả lời được câu *"game này sửa lỗi hiểu sai nào của sinh viên?"*.

Cập nhật luôn bảng trạng thái trong README của chủ đề (ví dụ [topics/data-representation/README.md](../topics/data-representation/README.md)).

## 4. Chạy thử

```bash
python3 -m http.server 8000
# mở http://localhost:8000
```

Checklist trước khi push:

- [ ] Không có lỗi trong Console của DevTools.
- [ ] Chơi hết ít nhất một level, thấy màn hình kết thúc.
- [ ] Thử ở chiều rộng điện thoại (DevTools → Toggle device toolbar, 360–390px): không bị cuộn ngang.
- [ ] Thử ở chế độ tối (DevTools → Rendering → `prefers-color-scheme: dark`).
- [ ] Chơi được bằng bàn phím cho các thao tác chính (`Enter` để kiểm tra / sang vòng tiếp).
- [ ] Game đã có trong `catalog.js` với `status: "ready"`.

## Thêm chủ đề mới (chương mới)

1. Tạo `topics/<chủ-đề>/README.md` mô tả chủ đề và danh sách ý tưởng game.
2. Thêm một object vào `CATALOG.topics` trong `catalog.js`:

```js
{
  id: "computer-architecture",
  title: "Computer Architecture",
  label: "Tuần 3",
  summary: "CPU, bộ nhớ và chu trình fetch–decode–execute.",
  sections: [
    { id: "cpu", title: "CPU", games: [ /* ... */ ] },
  ],
},
```

Game ở dạng ý tưởng dùng `status: "planned"` (không cần `path`). Chúng hiện trên trang chủ khi bật "Hiện cả các game sắp ra mắt".

## Nguyên tắc thiết kế

- **Một game, một lỗi sai.** Game ngắn (5–10 phút), tập trung vào một hiểu lầm cụ thể thay vì ôn cả chương.
- **Phản hồi phải giải thích**, không chỉ báo đúng/sai. Khi sai, cho sinh viên thấy hậu quả của cách làm sai (ví dụ Remainder Tower đọc ngược rồi đổi về hệ 10 để thấy ra số khác).
- **Tăng dần độ khó** qua các level, bỏ dần "phao cứu sinh" (ẩn tổng, giảm thời gian, …).
- **Không cần backend.** Tiến độ lưu trong `localStorage` qua `G.progress`. Mọi thứ phải chạy được dưới dạng file tĩnh trên GitHub Pages.
- **Không build step, không framework.** HTML/CSS/JS thuần, để giảng viên hoặc trợ giảng nào cũng sửa được.

## Tiện ích dùng chung (`assets/js/common.js`)

| API | Dùng để |
| --- | --- |
| `G.$`, `G.$$`, `G.el(tag, attrs, children)` | Truy vấn và tạo DOM |
| `G.showScreen("start" \| "play" \| "end")` | Chuyển màn hình (`[data-screen]`) |
| `G.renderLevels(container, LEVELS, onPick)` | Vẽ danh sách level kèm kỷ lục |
| `G.Timer(seconds, onTick, onEnd)` + `G.renderTimerBar(bar, ratio)` | Đếm ngược |
| `G.progress.record(gameId, levelIdx, score, totalLevels)` | Lưu kỷ lục, trả về `{ best, isNew }` |
| `G.toast(msg, type)`, `G.confetti()`, `G.shake(node)` | Hiệu ứng phản hồi |
| `G.sound.play("good" \| "bad" \| "pop" \| "tick" \| "win")` | Âm thanh ngắn (có nút tắt trên header) |
| `G.randInt`, `G.pick`, `G.shuffle` | Ngẫu nhiên |
| `G.toBase`, `G.digitChar`, `G.digitValue`, `G.SUP`, `G.based` | Hệ cơ số và định dạng hiển thị |
| `G.gcd`, `G.parseFraction`, `G.isPowerOfTwo` | Phân số |
| `G.mountNextLink(container)` | Nút "Game tiếp theo" |

CSS dùng chung (`assets/css/base.css`): `.card`, `.btn` (`.ghost`, `.good`, `.bad`, `.lg`, `.sm`), `.hud .stat`, `.timer-bar`, `.feedback` (`.good`, `.bad`, `.warn`), `.badge`, `.row`, `.muted`, `.mono`. Màu dùng token `var(--accent)`, `var(--good)`, … để tự hỗ trợ chế độ tối.
