#!/usr/bin/env python3
"""Tìm chữ tiếng Việt chưa có bản tiếng Anh trong các game.

Dùng:
    python3 tools/i18n_lint.py                       # quét mọi game + trang chủ
    python3 tools/i18n_lint.py topics/.../game.js    # quét file cụ thể

Quy ước (xem docs/adding-a-game.md, mục "Đa ngôn ngữ"):
  - HTML: chữ tiếng Việt phải nằm trong phần tử có data-en="…", trong khối
    data-lang="vi" (kèm khối data-lang="en"), hoặc trong vùng data-i18n-skip
    (nội dung cố ý giữ tiếng Việt, ví dụ câu "Kinh tế Quốc dân").
  - JS: chuỗi tiếng Việt phải là đối số đầu của L("vi", "en") hoặc giá trị
    của khóa vi: trong { vi, en }. Dòng cố ý giữ tiếng Việt thêm // i18n-ok.
Trả về mã lỗi 1 nếu còn chỗ chưa dịch (tiện gắn vào CI).
"""
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VI = re.compile(r"[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]", re.I)
ATTRS = {"placeholder": "data-en-placeholder", "title": "data-en-title", "aria-label": "data-en-aria"}
VOID = {"meta", "link", "input", "br", "img", "source", "hr"}


class _HtmlLint(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack, self.bad = [], []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        for k, en in ATTRS.items():
            if a.get(k) and VI.search(a[k]) and en not in a:
                self.bad.append(f"<{tag} {k}={a[k]!r}> thiếu {en}")
        if tag not in VOID:
            self.stack.append((tag, a))

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        if not VI.search(data):
            return
        ok = any(a.get("data-lang") == "vi" or "data-en" in a or "data-i18n-skip" in a for _, a in self.stack)
        if not ok and not any(t in ("script", "style", "title") for t, _ in self.stack):
            self.bad.append(data.strip()[:90])


def lint_html(path):
    s = path.read_text(encoding="utf-8")
    body = re.sub(r"<script>.*?</script>", "", s[s.find("<body"):], flags=re.S)
    p = _HtmlLint()
    p.feed(body)
    return p.bad


def lint_js(path):
    src = path.read_text(encoding="utf-8")
    keep = lambda m: "\n" * m.group(0).count("\n")  # giữ nguyên số dòng
    src = re.sub(r"/\*.*?\*/", keep, src, flags=re.S)
    src = "\n".join("" if "i18n-ok" in l else re.sub(r"(?<!:)//.*$", "", l) for l in src.split("\n"))
    string = r"(`(?:[^`\\]|\\.|\$\{[^}]*\})*`|\"(?:[^\"\\]|\\.)*\"|'(?:[^'\\]|\\.)*')"
    src = re.sub(r"L\(\s*" + string, lambda m: "L(" + keep(m), src, flags=re.S)
    src = re.sub(r"vi:\s*" + string, lambda m: "vi:" + keep(m), src, flags=re.S)
    src = re.sub(r"<(\w+)[^>]*data-i18n-skip[^>]*>.*?</\1>", keep, src, flags=re.S)
    return [f"dòng {n}: {line.strip()[:100]}" for n, line in enumerate(src.split("\n"), 1) if VI.search(line)]


def main(args):
    files = [ROOT / a for a in args] if args else sorted(
        [ROOT / "index.html", ROOT / "assets/js/common.js", ROOT / "assets/js/catalog.js"]
        + list(ROOT.glob("topics/*/*/*/index.html")) + list(ROOT.glob("topics/*/*/*/game.js")))
    total = 0
    for f in files:
        bad = lint_html(f) if f.suffix == ".html" else lint_js(f)
        if bad:
            print(f"✗ {f.relative_to(ROOT)}: {len(bad)} chỗ chưa dịch")
            for b in bad:
                print("    " + b)
        total += len(bad)
    print(f"{'✓' if not total else '✗'} {len(files)} file, {total} chỗ chưa dịch")
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
