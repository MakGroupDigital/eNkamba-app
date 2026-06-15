from __future__ import annotations

from pathlib import Path
from tempfile import NamedTemporaryFile

from pypdf import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
FONT_REGULAR = "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

GREEN = colors.HexColor("#32BB78")
GREEN_DARK = colors.HexColor("#157648")
INK = colors.HexColor("#17211D")
MUTED = colors.HexColor("#5B6963")
PALE = colors.HexColor("#F8FCFA")
LINE = colors.HexColor("#DCE8E2")

COURSE_TITLES = {
    "manuel-python-professionnel-charmant-nyungu.pdf": "Python professionnel",
    "manuel-architecture-logicielle-charmant-nyungu.pdf": "Architecture logicielle",
    "manuel-cybersecurite-defensive-charmant-nyungu.pdf": "Cybersécurité défensive",
    "manuel-data-science-ia-avancee-charmant-nyungu.pdf": "Data Science et IA avancée",
    "manuel-bases-de-donnees-charmant-nyungu.pdf": "Bases de données",
    "manuel-algorithmique-logique-programmation-charmant-nyungu.pdf": "Algorithmique et logique de programmation",
}

AUTHOR = "Charmant Nyungu"


pdfmetrics.registerFont(TTFont("ArialUnicode", FONT_REGULAR))
pdfmetrics.registerFont(TTFont("ArialUnicode-Bold", FONT_BOLD))


def make_header_overlay(title: str, page_number: int, total_pages: int) -> Path:
    tmp = NamedTemporaryFile(suffix=".pdf", delete=False)
    tmp_path = Path(tmp.name)
    tmp.close()

    c = canvas.Canvas(str(tmp_path), pagesize=A4)
    width, height = A4

    # The internal body of the manuals starts lower than this band.
    # Keeping the overlay to 58pt avoids covering chapter content.
    c.setFillColor(PALE)
    c.rect(0, height - 58, width, 58, fill=1, stroke=0)
    c.setStrokeColor(LINE)
    c.line(46, height - 58, width - 46, height - 58)

    c.setFillColor(GREEN)
    c.roundRect(46, height - 42, 66, 4, 2, fill=1, stroke=0)

    c.setFont("ArialUnicode-Bold", 9.2)
    c.setFillColor(GREEN_DARK)
    c.drawString(46, height - 27, title)

    c.setFont("ArialUnicode", 7.2)
    c.setFillColor(MUTED)
    c.drawString(46, height - 44, AUTHOR)
    c.drawRightString(width - 46, height - 34, f"Page {page_number} / {total_pages}")

    c.save()
    return tmp_path


def fix_pdf(pdf_path: Path, title: str) -> tuple[int, int]:
    reader = PdfReader(str(pdf_path))
    writer = PdfWriter()
    total = len(reader.pages)

    backup = pdf_path.with_suffix(".before-header-fix.pdf")
    if not backup.exists():
        backup.write_bytes(pdf_path.read_bytes())

    for index, page in enumerate(reader.pages, start=1):
        # Keep the cover intact; it has its own title layout.
        if index == 1:
            writer.add_page(page)
            continue

        overlay_path = make_header_overlay(title, index, total)
        overlay = PdfReader(str(overlay_path)).pages[0]
        page.merge_page(overlay)
        writer.add_page(page)
        overlay_path.unlink(missing_ok=True)

    out = NamedTemporaryFile(suffix=".pdf", delete=False)
    out_path = Path(out.name)
    out.close()
    with out_path.open("wb") as handle:
        writer.write(handle)
    pdf_path.write_bytes(out_path.read_bytes())
    out_path.unlink(missing_ok=True)
    return total, pdf_path.stat().st_size


def main() -> None:
    for filename, title in COURSE_TITLES.items():
        pdf_path = DOCS / filename
        if not pdf_path.exists():
            print({"file": filename, "status": "missing"})
            continue
        pages, size = fix_pdf(pdf_path, title)
        print({"file": filename, "pages": pages, "bytes": size, "status": "header-fixed"})


if __name__ == "__main__":
    main()
