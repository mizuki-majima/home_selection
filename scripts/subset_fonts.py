#!/usr/bin/env python3
"""サイトで使う文字だけを含むしっぽり明朝の woff2 を作る。

使い方: pip install fonttools brotli && npm run fonts
- src/ 以下のテキストから文字を集めて src/data/font-chars.txt に書き出す
- Google Fonts から元の TTF を取得し、public/fonts/ に woff2 のサブセットを出力する
文字を増やしたら再実行する（tests/unit/font-chars.test.ts が不足を検出する）。
"""
import pathlib
import string
import unicodedata
import urllib.request

from fontTools import subset

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
OUT = ROOT / "public" / "fonts"
CACHE = ROOT / "node_modules" / ".cache" / "fonts"
CHARS_FILE = SRC / "data" / "font-chars.txt"
WEIGHTS = {500: "VdGDAZweH5EbgHY6YExcZfDoj0B4L9am5A", 800: "VdGDAZweH5EbgHY6YExcZfDoj0B4e9Om5A"}
URL = "https://fonts.gstatic.com/s/shipporimincho/v17/{key}.ttf"
EXTS = {".astro", ".svelte", ".ts", ".yaml", ".css"}
# 数字・英字・記号は常に含める
BASE = set(string.printable.strip()) | set("　、。，．・：；？！゛゜´｀¨＾￣＿ヽヾゝゞ〃仝々〆〇ー―‐／＼～∥｜…‥‘’“”（）〔〕［］｛｝〈〉《》「」『』【】＋－±×÷＝≠＜＞≦≧∞∴♂♀°′″℃￥＄¢£％＃＆＊＠§☆★○●◎◇◆□■△▲▽▼※〒→←↑↓〓㎡㎠円万億年月日時分秒〜−")


def collect() -> str:
    chars = set(BASE)
    for path in SRC.rglob("*"):
        if path.suffix in EXTS and path.is_file():
            chars |= set(path.read_text(encoding="utf-8"))
    # 制御文字だけを除く（全角スペースなどの空白は残す）
    chars = {c for c in chars if unicodedata.category(c)[0] != "C"}
    return "".join(sorted(chars))


def main() -> None:
    text = collect()
    CHARS_FILE.write_text(text + "\n", encoding="utf-8")
    OUT.mkdir(parents=True, exist_ok=True)
    CACHE.mkdir(parents=True, exist_ok=True)
    for weight, key in WEIGHTS.items():
        ttf = CACHE / f"shippori-{weight}.ttf"
        if not ttf.exists():
            urllib.request.urlretrieve(URL.format(key=key), ttf)
        options = subset.Options()
        options.flavor = "woff2"
        options.layout_features = ["palt", "kern", "liga", "vert"]
        options.name_IDs = ["*"]
        font = subset.load_font(str(ttf), options)
        s = subset.Subsetter(options)
        s.populate(text=text)
        s.subset(font)
        out = OUT / f"shippori-mincho-{weight}.woff2"
        subset.save_font(font, str(out), options)
        print(f"{out.relative_to(ROOT)}: {out.stat().st_size // 1024} KB ({len(text)} chars)")


if __name__ == "__main__":
    main()
