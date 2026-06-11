import os
from pathlib import Path
from typing import Optional
import weasyprint


def get_outputs_dir() -> Path:
    app_data = os.environ.get("APPDATA", str(Path.home()))
    out_dir = Path(app_data) / "ReviewBot" / "outputs"
    out_dir.mkdir(parents=True, exist_ok=True)
    return out_dir


def markdown_to_html(markdown_text: str, title: str = "") -> str:
    # Simple markdown → HTML conversion without extra dependencies
    import re

    html = markdown_text
    # Headers
    html = re.sub(r"^#### (.+)$", r"<h4>\1</h4>", html, flags=re.MULTILINE)
    html = re.sub(r"^### (.+)$", r"<h3>\1</h3>", html, flags=re.MULTILINE)
    html = re.sub(r"^## (.+)$", r"<h2>\1</h2>", html, flags=re.MULTILINE)
    html = re.sub(r"^# (.+)$", r"<h1>\1</h1>", html, flags=re.MULTILINE)
    # Bold / italic
    html = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", html)
    html = re.sub(r"\*(.+?)\*", r"<em>\1</em>", html)
    # Bullets
    html = re.sub(r"^[-*] (.+)$", r"<li>\1</li>", html, flags=re.MULTILINE)
    html = re.sub(r"(<li>.*</li>)", r"<ul>\1</ul>", html, flags=re.DOTALL)
    # Paragraphs
    parts = re.split(r"\n\n+", html)
    parts = [
        f"<p>{p.strip()}</p>" if not p.strip().startswith("<") else p.strip()
        for p in parts
        if p.strip()
    ]
    body = "\n".join(parts)

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>{title}</title>
<style>
  body {{ font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 0 20px;
         color: #111; line-height: 1.6; }}
  h1 {{ font-size: 2em; border-bottom: 2px solid #333; padding-bottom: 0.2em; }}
  h2 {{ font-size: 1.5em; margin-top: 1.5em; color: #1a1a2e; }}
  h3 {{ font-size: 1.2em; color: #333; }}
  ul {{ padding-left: 1.5em; }}
  li {{ margin-bottom: 0.3em; }}
  strong {{ color: #1a1a2e; }}
  p {{ margin: 0.8em 0; }}
</style>
</head>
<body>
{body}
</body>
</html>"""


def generate_pdf(content_markdown: str, filename: str, title: str = "") -> str:
    html = markdown_to_html(content_markdown, title)
    out_path = get_outputs_dir() / filename
    weasyprint.HTML(string=html).write_pdf(str(out_path))
    return str(out_path)
