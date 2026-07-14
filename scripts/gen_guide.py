#!/usr/bin/env python3.11
"""将 GUIDE.md 渲染为 HTML 并写入 src/plugins/guideContent.js。

仅依赖仓库已预装的 Python `markdown` 包（含 tables / fenced_code / toc 扩展）。
重新生成：python3 scripts/gen_guide.py
"""
import json
import markdown
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "GUIDE.md")
OUT = os.path.join(ROOT, "src", "plugins", "guideContent.js")

with open(SRC, "r", encoding="utf-8") as f:
    md = f.read()

# 游戏内已有可用侧边目录，剔除文档中锚点已失效的手动「目录」段落
md = re.sub(r"## 目录.*?(?=\n## )", "", md, flags=re.S)

html = markdown.markdown(
    md,
    extensions=["tables", "fenced_code", "toc"],
    extension_configs={"toc": {"permalink": False}},
)

header = (
    "// AUTO-GENERATED from GUIDE.md — 请勿手改。重新生成: python3 scripts/gen_guide.py\n"
)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(header)
    f.write("export const guideHtml = " + json.dumps(html, ensure_ascii=False) + ";\n")

print("生成成功:", OUT, "HTML 长度:", len(html))
