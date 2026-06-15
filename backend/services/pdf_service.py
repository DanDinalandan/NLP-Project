import os
import re
from pathlib import Path
from fpdf import FPDF


def get_outputs_dir() -> Path:
    app_data = os.environ.get("APPDATA", str(Path.home()))
    out_dir = Path(app_data) / "ReviewBot" / "outputs"
    out_dir.mkdir(parents=True, exist_ok=True)
    return out_dir


def _clean(text: str) -> str:
    """Strip inline markdown markers and coerce to Latin-1 (core font safe)."""
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"\*(.+?)\*", r"\1", text)
    return text.encode("latin-1", errors="replace").decode("latin-1")


# fpdf2 v2.x cursor reset args — keeps X at left margin and Y on next line after multi_cell
_NX = "LMARGIN"
_NY = "NEXT"


def generate_pdf(content_markdown: str, filename: str, title: str = "") -> str:
    pdf = FPDF()
    pdf.set_margins(20, 20, 20)
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    if title:
        pdf.set_font("Helvetica", "B", 16)
        pdf.multi_cell(0, 10, _clean(title), align="C", new_x=_NX, new_y=_NY)
        pdf.ln(6)

    for raw_line in content_markdown.splitlines():
        line = raw_line.rstrip()

        if line.startswith("#### "):
            pdf.set_font("Helvetica", "B", 11)
            pdf.multi_cell(0, 6, _clean(line[5:]), new_x=_NX, new_y=_NY)
            pdf.ln(1)
        elif line.startswith("### "):
            pdf.set_font("Helvetica", "B", 12)
            pdf.multi_cell(0, 7, _clean(line[4:]), new_x=_NX, new_y=_NY)
            pdf.ln(2)
        elif line.startswith("## "):
            pdf.set_font("Helvetica", "B", 14)
            pdf.multi_cell(0, 8, _clean(line[3:]), new_x=_NX, new_y=_NY)
            pdf.ln(3)
        elif line.startswith("# "):
            pdf.set_font("Helvetica", "B", 16)
            pdf.multi_cell(0, 10, _clean(line[2:]), new_x=_NX, new_y=_NY)
            pdf.ln(4)
        elif line.startswith("- ") or line.startswith("* "):
            pdf.set_font("Helvetica", "", 10)
            pdf.set_x(pdf.l_margin + 5)
            pdf.multi_cell(0, 5, "- " + _clean(line[2:]), new_x=_NX, new_y=_NY)
        elif not line.strip():
            pdf.ln(3)
        else:
            pdf.set_font("Helvetica", "", 10)
            pdf.multi_cell(0, 5, _clean(line), new_x=_NX, new_y=_NY)

    out_path = get_outputs_dir() / filename
    pdf.output(str(out_path))
    return str(out_path)
