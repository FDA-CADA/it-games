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

1. `index.html`: sửa `<title>`, `data-game="number-wheel"`, nội dung màn hình start và hộp thoại hướng dẫn (viết cả tiếng Việt lẫn tiếng Anh, xem mục [Đa ngôn ngữ](#đa-ngôn-ngữ-việt--anh)).
2. `game.js`: sửa `GAME_ID`, `LEVELS`, logic trong `nextRound()` / `answer()`. Mọi chữ hiển thị viết dạng `L("tiếng Việt", "English")`.
3. [`assets/js/catalog.js`](../assets/js/catalog.js): thêm (hoặc sửa) mục của game:

```js
{
  id: "number-wheel", title: "Number Wheel", icon: "🎡", status: "ready",
  path: "topics/data-representation/data-storage/number-wheel/",
  tags: ["bù 2", "số âm", "sign magnitude", "negative"],
  skill: "2.2 Integers",
  desc: {
    vi: "Một câu mô tả hiện trên thẻ ở trang chủ.",
    en: "One sentence shown on the home page card.",
  },
},
```

`title`, `skill`, `desc` có thể là chuỗi (giống nhau ở mọi ngôn ngữ) hoặc object `{ vi, en }`.

`tags` (tuỳ chọn) là từ khoá cho ô tìm kiếm ở trang chủ. Chúng không hiển thị nên không cần dịch, nhưng nên có cả tiếng Việt lẫn tiếng Anh: sinh viên gõ "bù 2", "tràn số" hay "overflow" đều phải ra game. Ô tìm kiếm đã tự đọc `title`, `skill`, `desc` và tên chương/phần; `tags` dành cho khái niệm hoặc tên gọi khác không có sẵn trong mấy trường đó. Tìm kiếm không phân biệt dấu và khớp từ đầu một từ ("bu 2" ra "bù 2", nhưng "bu" không ra "bước").

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
- [ ] Chơi thử ở cả hai ngôn ngữ: thêm `?lang=en` hoặc `?lang=vi` vào cuối URL.
- [ ] `python3 tools/i18n_lint.py` báo 0 chỗ chưa dịch.
- [ ] Game đã có trong `catalog.js` với `status: "ready"`.

## Đa ngôn ngữ (Việt / Anh)

Mọi trang đều có nút **EN / VI** trên header. Lựa chọn được lưu trên trình duyệt. Có thể gửi link mở thẳng một ngôn ngữ bằng `?lang=en` hoặc `?lang=vi`. Mặc định là tiếng Việt.

`assets/js/lang.js` (nạp trong `<head>`) chọn ngôn ngữ **trước khi trang hiển thị**, đặt `<html lang="vi|en">`, nên không bị nháy chữ. Nguyên tắc chung: **bản tiếng Việt và tiếng Anh luôn nằm cạnh nhau** ngay tại chỗ dùng, không có file từ điển riêng, nên sửa câu nào thì thấy ngay bản dịch cần sửa theo.

| Loại chữ | Cách viết |
| --- | --- |
| Câu ngắn trong HTML (nút, nhãn HUD, tiêu đề) | `<button data-en="Next round →">Vòng tiếp →</button>` |
| Đoạn dài trong HTML (có thẻ `<b>`, `<code>`…) | Hai khối cạnh nhau: `<p data-lang="vi">…</p>` và `<p data-lang="en">…</p>` |
| Thuộc tính | `placeholder` + `data-en-placeholder`, `title` + `data-en-title`, `aria-label` + `data-en-aria` |
| Chữ sinh ra trong JS | `L("Vòng tiếp →", "Next round →")`, hoặc template: ``L(`Đúng ${n} câu.`, `${n} correct.`)`` |
| Dữ liệu trong `catalog.js` | `{ vi: "…", en: "…" }`, đọc bằng `G.tr(x)` |
| Nội dung cố ý giữ tiếng Việt (vd. câu "Kinh tế Quốc dân" trong ASCII Spy) | Bọc trong `data-i18n-skip`. Trong JS thì thêm chú thích `// i18n-ok` cuối dòng |

Lưu ý khi viết JS:

- `L()` được gọi lúc game chạy, nên có thể dùng ngay trong mảng `LEVELS`, câu hỏi, đáp án.
- **Không đặt tên biến cục bộ là `L`**, vì nó sẽ che mất hàm dịch. Lỗi này từng xảy ra với `const L = S.level`.
- Nếu đáp án được so khớp theo chữ (ví dụ nút "+ Dương" / "− Âm"), hãy lưu chuỗi đã dịch vào biến rồi dùng biến đó cho cả nút lẫn phép so sánh.
- Đổi ngôn ngữ sẽ tải lại trang (có hỏi xác nhận nếu đang chơi dở), nên game không cần tự vẽ lại giao diện.

Kiểm tra: `python3 tools/i18n_lint.py` liệt kê mọi chữ tiếng Việt chưa có bản tiếng Anh, trả mã lỗi 1 nếu còn sót.

## Thêm chủ đề mới (chương mới)

1. Tạo `topics/<chủ-đề>/README.md` mô tả chủ đề và danh sách ý tưởng game.
2. Thêm một object vào `CATALOG.topics` trong `catalog.js`:

```js
{
  id: "computer-architecture",
  title: "Computer Architecture",
  label: { vi: "Tuần 3", en: "Week 3" },
  summary: { vi: "CPU, bộ nhớ và chu trình fetch–decode–execute.", en: "The CPU, memory and the fetch–decode–execute cycle." },
  sections: [
    { id: "cpu", title: "CPU", games: [ /* ... */ ] },
  ],
},
```

Game ở dạng ý tưởng dùng `status: "planned"` (không cần `path`). Chúng không hiện trong danh sách mặc định mà nằm ở bộ lọc "Sắp có" (bộ lọc này chỉ xuất hiện khi có ít nhất một game planned).

Trang chủ không cần sửa khi thêm chương: cột "Chương" bên trái, chip lọc theo phần, bộ đếm và ô tìm kiếm đều tự sinh từ `catalog.js`. Để gửi sinh viên link thẳng tới một chương hoặc một phần, dùng `#games?topic=<id-chủ-đề>` hoặc `#games?topic=<id-chủ-đề>&section=<id-phần>`, ví dụ `…/#games?topic=data-representation&section=operations`. Thêm `&q=xor` để mở sẵn kết quả tìm kiếm, `&lang=en` đặt trước dấu `#` để mở bản tiếng Anh.

## Nguyên tắc thiết kế

- **Một game, một lỗi sai.** Game ngắn (5–10 phút), tập trung vào một hiểu lầm cụ thể thay vì ôn cả chương.
- **Phản hồi phải giải thích**, không chỉ báo đúng/sai. Khi sai, cho sinh viên thấy hậu quả của cách làm sai (ví dụ Remainder Tower đọc ngược rồi đổi về hệ 10 để thấy ra số khác).
- **Tăng dần độ khó** qua các level, bỏ dần "phao cứu sinh" (ẩn tổng, giảm thời gian, …).
- **Không cần backend.** Tiến độ lưu trong `localStorage` qua `G.progress`. Mọi thứ phải chạy được dưới dạng file tĩnh trên GitHub Pages.
- **Không build step, không framework.** HTML/CSS/JS thuần, để giảng viên hoặc trợ giảng nào cũng sửa được.

## Thoát level giữa chừng

Khi người chơi bấm Back (hoặc "← Chọn level" trên header) lúc đang ở giữa level, `common.js` bấm hộ nút `#btn-menu` ("Chọn level khác") của game. Vì vậy handler của `#btn-menu` phải dọn mọi thứ riêng của game đang chạy ngầm: `setTimeout` tự viết, `requestAnimationFrame`, cờ kiểu `S.active`. `G.Timer` và `G.wait` được dọn tự động nên không cần làm gì thêm.

## Tiện ích dùng chung (`assets/js/common.js`)

| API | Dùng để |
| --- | --- |
| `G.$`, `G.$$`, `G.el(tag, attrs, children)` | Truy vấn và tạo DOM |
| `G.showScreen("start" \| "play" \| "end")` | Chuyển màn hình (`[data-screen]`). Rời "start" thì nút Back của trình duyệt và nút "← Chọn level" trên header sẽ quay về danh sách level (xem bên dưới) |
| `G.renderLevels(container, LEVELS, onPick)` | Vẽ danh sách level kèm kỷ lục |
| `G.Timer(seconds, onTick, onEnd)` + `G.renderTimerBar(bar, ratio)` | Đếm ngược (tự dừng khi người chơi thoát level) |
| `G.wait(ms)` | `await` chờ; nếu người chơi thoát level trong lúc chờ thì đoạn code sau không chạy nữa |
| `G.progress.record(gameId, levelIdx, score, totalLevels)` | Lưu kỷ lục, trả về `{ best, isNew }` |
| `G.toast(msg, type)`, `G.confetti()`, `G.shake(node)` | Hiệu ứng phản hồi |
| `G.sound.play("good" \| "bad" \| "pop" \| "tick" \| "win")` | Âm thanh ngắn (có nút tắt trên header) |
| `G.randInt`, `G.pick`, `G.shuffle` | Ngẫu nhiên |
| `G.toBase`, `G.digitChar`, `G.digitValue`, `G.SUP`, `G.based` | Hệ cơ số và định dạng hiển thị |
| `G.gcd`, `G.parseFraction`, `G.isPowerOfTwo` | Phân số |
| `G.bits(v, n)`, `G.signed(bits)` | Số → chuỗi n bit (số âm theo bù 2), chuỗi bit → số có dấu |
| `G.formatBytes(bytes)`, `G.fmtInt(n)` | "1.03 GB" (1 KB = 1024 B), "1 105 920 000" |
| `G.L(vi, en)` (cũng có sẵn là `L`), `G.tr({ vi, en })`, `G.lang` | Đa ngôn ngữ |
| `G.bitRow(v, n, { onToggle, mark, bad, cls })` | Vẽ một hàng n bit (bấm được nếu có `onToggle(i)`), dùng class `.bitrow` trong base.css |
| `G.mountNextLink(container)` | Nút "Game tiếp theo" |

CSS dùng chung (`assets/css/base.css`): `.card`, `.btn` (`.ghost`, `.good`, `.bad`, `.lg`, `.sm`), `.hud .stat`, `.timer-bar`, `.feedback` (`.good`, `.bad`, `.warn`), `.badge`, `.row`, `.muted`, `.mono`. Màu dùng token `var(--accent)`, `var(--good)`, … để tự hỗ trợ chế độ tối.
