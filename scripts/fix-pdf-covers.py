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
ORANGE = colors.HexColor("#FF8C00")
INK = colors.HexColor("#17211D")
MUTED = colors.HexColor("#5B6963")
PALE = colors.HexColor("#F8FCFA")
LINE = colors.HexColor("#DCE8E2")
BLUE = colors.HexColor("#236FDA")
PURPLE = colors.HexColor("#7C50DA")

AUTHOR = "Charmant Nyungu"
PROFESSION = (
    "Consultant en innovation technologique, transformation numérique, cybersécurité, "
    "intelligence artificielle, développement logiciel et stratégie digitale."
)
SITE = "www.charmantnyungu.com"
EMAIL = "consultant@charmantnyungu.com"
PHONE = "+243 835 137 837"

COURSES = [
    {
        "file": "manuel-python-professionnel-charmant-nyungu.pdf",
        "label": "MANUEL PROFESSIONNEL ET UNIVERSITAIRE",
        "title": "PYTHON PROFESSIONNEL",
        "subtitle": "Programmation, automatisation, data science, IA, web, cybersécurité et projets réels.",
        "chips": ["Python", "Data", "IA", "Web", "Projets"],
    },
    {
        "file": "manuel-architecture-logicielle-charmant-nyungu.pdf",
        "label": "MANUEL PROFESSIONNEL ET UNIVERSITAIRE",
        "title": "ARCHITECTURE LOGICIELLE",
        "subtitle": "Modules, services, MVC, clean code, tests, documentation, sécurité et déploiement.",
        "chips": ["Modules", "MVC", "Tests", "Sécurité", "Clean code"],
    },
    {
        "file": "manuel-cybersecurite-defensive-charmant-nyungu.pdf",
        "label": "MANUEL PROFESSIONNEL ET ÉTHIQUE",
        "title": "CYBERSÉCURITÉ DÉFENSIVE",
        "subtitle": "Sécurité applicative, protection des données, logs, audit, bonnes pratiques et éthique.",
        "chips": ["AppSec", "Logs", "Audit", "Données", "Éthique"],
    },
    {
        "file": "manuel-data-science-ia-avancee-charmant-nyungu.pdf",
        "label": "MANUEL PROFESSIONNEL ET AVANCÉ",
        "title": "DATA SCIENCE ET IA AVANCÉE",
        "subtitle": "Statistiques, Pandas, visualisation, machine learning, deep learning, NLP et computer vision.",
        "chips": ["Stats", "Pandas", "ML", "NLP", "Vision"],
    },
    {
        "file": "manuel-bases-de-donnees-charmant-nyungu.pdf",
        "label": "MANUEL PROFESSIONNEL ET UNIVERSITAIRE",
        "title": "BASES DE DONNÉES",
        "subtitle": "SQL, PostgreSQL, MySQL, MongoDB : tables, requêtes, relations, index, sécurité et sauvegarde.",
        "chips": ["SQL", "PostgreSQL", "MySQL", "MongoDB", "Backup"],
    },
    {
        "file": "manuel-algorithmique-logique-programmation-charmant-nyungu.pdf",
        "label": "MANUEL PROFESSIONNEL ET UNIVERSITAIRE",
        "title": "ALGORITHMIQUE ET LOGIQUE",
        "subtitle": "Conditions, boucles, tableaux, tri, recherche, complexité et résolution de problèmes.",
        "chips": ["Logique", "Boucles", "Tri", "Recherche", "Complexité"],
    },
]


pdfmetrics.registerFont(TTFont("ArialUnicode", FONT_REGULAR))
pdfmetrics.registerFont(TTFont("ArialUnicode-Bold", FONT_BOLD))


def text(c, x, y, value, size=10, color=INK, bold=False, max_width=None, leading=None):
    font = "ArialUnicode-Bold" if bold else "ArialUnicode"
    c.setFont(font, size)
    c.setFillColor(color)
    if not max_width:
        c.drawString(x, y, value)
        return y - (leading or size + 4)

    words = value.split()
    lines = []
    line = ""
    for word in words:
        candidate = f"{line} {word}".strip()
        if c.stringWidth(candidate, font, size) <= max_width:
            line = candidate
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)

    step = leading or size + 5
    for idx, line in enumerate(lines):
        c.drawString(x, y - idx * step, line)
    return y - len(lines) * step


def make_cover(course):
    tmp = NamedTemporaryFile(suffix=".pdf", delete=False)
    cover_path = Path(tmp.name)
    tmp.close()

    c = canvas.Canvas(str(cover_path), pagesize=A4)
    width, height = A4

    c.setFillColor(PALE)
    c.rect(0, 0, width, height, fill=1, stroke=0)

    c.setFillColor(GREEN_DARK)
    c.rect(0, height - 245, width, 245, fill=1, stroke=0)
    c.setFillColor(ORANGE)
    c.circle(width - 70, height - 66, 88, fill=1, stroke=0)
    c.setFillColor(colors.Color(1, 1, 1, alpha=0.12))
    c.circle(82, height - 210, 92, fill=1, stroke=0)

    text(c, 52, height - 58, course["label"], 11.5, colors.white, True)
    c.setFillColor(colors.white)
    c.roundRect(52, height - 76, 118, 5, 2, fill=1, stroke=0)

    title_y = height - 120
    title_lines = course["title"].split(" ET ") if len(course["title"]) > 24 and " ET " in course["title"] else [course["title"]]
    for idx, line in enumerate(title_lines):
        text(c, 52, title_y - idx * 43, line if idx == 0 else f"ET {line}", 28, colors.white, True)

    # Subtitle card separated from the main title to remove overlap.
    card_y = height - 350
    c.setFillColor(colors.white)
    c.setStrokeColor(LINE)
    c.roundRect(52, card_y, width - 104, 118, 18, fill=1, stroke=1)
    text(c, 74, card_y + 82, "Objectif du cours", 10, GREEN_DARK, True)
    text(c, 74, card_y + 58, course["subtitle"], 11.5, INK, False, width - 148, 17)

    chip_x = 74
    for chip in course["chips"]:
        chip_w = max(58, c.stringWidth(chip, "ArialUnicode-Bold", 7.8) + 22)
        c.setFillColor(GREEN)
        c.roundRect(chip_x, card_y + 17, chip_w, 22, 11, fill=1, stroke=0)
        text(c, chip_x + 11, card_y + 23, chip, 7.8, colors.white, True)
        chip_x += chip_w + 8

    author_y = 355
    text(c, 52, author_y, "Auteur", 11, MUTED, True)
    text(c, 52, author_y - 38, AUTHOR, 25, GREEN_DARK, True)
    text(c, 52, author_y - 70, PROFESSION, 10.5, INK, False, width - 104, 16)

    info_y = 180
    c.setFillColor(colors.white)
    c.setStrokeColor(LINE)
    c.roundRect(52, info_y, width - 104, 104, 14, fill=1, stroke=1)
    rows = [("Site web", SITE), ("Email", EMAIL), ("Téléphone", PHONE), ("Édition", "Formation complète — 2026")]
    y = info_y + 76
    for label, value in rows:
        text(c, 76, y, label, 8.2, MUTED, True)
        text(c, 164, y, value, 9.2, INK)
        y -= 21

    c.setStrokeColor(LINE)
    c.line(52, 58, width - 52, 58)
    text(c, 52, 38, "Document original de formation professionnelle.", 8, MUTED)
    text(c, width - 180, 38, AUTHOR, 8, MUTED)

    c.save()
    return cover_path


def replace_cover(course):
    pdf_path = DOCS / course["file"]
    if not pdf_path.exists():
        print({"file": course["file"], "status": "missing"})
        return

    backup = pdf_path.with_suffix(".before-cover-fix.pdf")
    if not backup.exists():
        backup.write_bytes(pdf_path.read_bytes())

    reader = PdfReader(str(pdf_path))
    cover_path = make_cover(course)
    cover = PdfReader(str(cover_path)).pages[0]
    writer = PdfWriter()
    writer.add_page(cover)
    for page in reader.pages[1:]:
        writer.add_page(page)

    out = NamedTemporaryFile(suffix=".pdf", delete=False)
    out_path = Path(out.name)
    out.close()
    with out_path.open("wb") as handle:
        writer.write(handle)
    pdf_path.write_bytes(out_path.read_bytes())
    cover_path.unlink(missing_ok=True)
    out_path.unlink(missing_ok=True)
    print({"file": course["file"], "pages": len(writer.pages), "bytes": pdf_path.stat().st_size, "status": "cover-fixed"})


def main():
    for course in COURSES:
        replace_cover(course)


if __name__ == "__main__":
    main()
