from __future__ import annotations

import os
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
PALE = colors.HexColor("#F6FBF8")
LINE = colors.HexColor("#DCE8E2")
BLUE = colors.HexColor("#236FDA")
PURPLE = colors.HexColor("#7C50DA")
RED = colors.HexColor("#DA3A3A")
YELLOW = colors.HexColor("#F5B035")

AUTHOR = "Charmant Nyungu"
CONTACT = "www.charmantnyungu.com • consultant@charmantnyungu.com • +243 835 137 837"


pdfmetrics.registerFont(TTFont("ArialUnicode", FONT_REGULAR))
pdfmetrics.registerFont(TTFont("ArialUnicode-Bold", FONT_BOLD))


def text(c, x, y, value, size=9, color=INK, bold=False, max_width=None):
    c.setFont("ArialUnicode-Bold" if bold else "ArialUnicode", size)
    c.setFillColor(color)
    if not max_width:
        c.drawString(x, y, value)
        return
    words = value.split()
    lines = []
    line = ""
    for word in words:
        candidate = f"{line} {word}".strip()
        if c.stringWidth(candidate, "ArialUnicode-Bold" if bold else "ArialUnicode", size) <= max_width:
            line = candidate
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    for idx, line in enumerate(lines[:4]):
        c.drawString(x, y - idx * (size + 3), line)


def footer(c, page_no, course):
    w, _ = A4
    c.setStrokeColor(LINE)
    c.line(46, 42, w - 46, 42)
    text(c, 46, 28, f"Atlas de diagrammes — {course}", 7, MUTED)
    text(c, 46, 17, f"{AUTHOR} • {CONTACT}", 7, MUTED)
    text(c, w - 74, 22, f"Atlas {page_no}", 7, MUTED)


def new_page(c, course, title, page_no):
    w, h = A4
    c.setFillColor(PALE)
    c.rect(0, 0, w, h, fill=1, stroke=0)
    c.setFillColor(GREEN_DARK)
    c.rect(0, h - 74, w, 74, fill=1, stroke=0)
    text(c, 46, h - 35, title, 18, colors.white, True)
    text(c, 46, h - 56, course, 8.5, colors.white)
    c.setFillColor(ORANGE)
    c.roundRect(w - 110, h - 58, 64, 18, 8, fill=1, stroke=0)
    text(c, w - 98, h - 52, "VISUEL", 7, colors.white, True)
    footer(c, page_no, course)


def card(c, x, y, w, h, title):
    c.setFillColor(colors.white)
    c.setStrokeColor(LINE)
    c.roundRect(x, y, w, h, 12, fill=1, stroke=1)
    text(c, x + 14, y + h - 22, title, 9.5, GREEN_DARK, True)
    c.setStrokeColor(LINE)
    c.line(x + 14, y + h - 30, x + w - 14, y + h - 30)


def box(c, x, y, w, h, label, fill=GREEN, color=colors.white):
    c.setFillColor(fill)
    c.setStrokeColor(fill)
    c.roundRect(x, y, w, h, 8, fill=1, stroke=1)
    text(c, x + 8, y + h / 2 - 3, label, 7.4, color, True, w - 14)


def arrow(c, x1, y1, x2, y2, color=MUTED):
    c.setStrokeColor(color)
    c.setLineWidth(1.2)
    c.line(x1, y1, x2, y2)
    if x2 >= x1:
        c.line(x2, y2, x2 - 6, y2 + 4)
        c.line(x2, y2, x2 - 6, y2 - 4)
    else:
        c.line(x2, y2, x2 + 6, y2 + 4)
        c.line(x2, y2, x2 + 6, y2 - 4)


def diagram_pipeline(c, x, y, w, h, title, steps):
    card(c, x, y, w, h, title)
    gap = 9
    box_w = (w - 28 - gap * (len(steps) - 1)) / len(steps)
    yy = y + h / 2 - 13
    palette = [GREEN, ORANGE, BLUE, PURPLE, RED]
    for idx, step in enumerate(steps):
        bx = x + 14 + idx * (box_w + gap)
        box(c, bx, yy, box_w, 28, step, palette[idx % len(palette)])
        if idx < len(steps) - 1:
            arrow(c, bx + box_w + 1, yy + 14, bx + box_w + gap - 2, yy + 14)


def diagram_layers(c, x, y, w, h, title, layers):
    card(c, x, y, w, h, title)
    palette = [GREEN, BLUE, ORANGE, PURPLE, GREEN_DARK, RED]
    layer_h = 20
    start_y = y + h - 62
    for idx, layer in enumerate(layers):
        inset = idx * 9
        box(c, x + 24 + inset, start_y - idx * 26, w - 48 - inset * 2, layer_h, layer, palette[idx % len(palette)])


def diagram_matrix(c, x, y, w, h, title, labels=("faible", "moyen", "élevé")):
    card(c, x, y, w, h, title)
    start_x = x + 76
    start_y = y + 28
    cell_w = 52
    cell_h = 25
    for r in range(3):
        for col in range(3):
            fill = GREEN if r + col < 2 else YELLOW if r + col < 4 else RED
            box(c, start_x + col * (cell_w + 6), start_y + r * (cell_h + 7), cell_w, cell_h, f"{labels[r]}\n{labels[col]}", fill)
    text(c, x + 16, y + 18, "Lecture : probabilité × impact / effort × valeur / complexité × risque.", 7, MUTED)


def diagram_tree(c, x, y, w, h, title, root="50", left="20", right="80"):
    card(c, x, y, w, h, title)
    cx = x + w / 2
    top = y + h - 62
    box(c, cx - 23, top, 46, 24, root, GREEN)
    box(c, cx - 116, top - 52, 54, 24, left, BLUE)
    box(c, cx + 62, top - 52, 54, 24, right, ORANGE)
    arrow(c, cx - 2, top, cx - 88, top - 28)
    arrow(c, cx + 2, top, cx + 88, top - 28)
    text(c, x + 16, y + 18, "Structure hiérarchique : diviser l’espace de recherche.", 7, MUTED)


def diagram_bars(c, x, y, w, h, title, labels):
    card(c, x, y, w, h, title)
    base = y + 32
    max_h = h - 72
    palette = [GREEN, ORANGE, BLUE, PURPLE, RED, GREEN_DARK]
    gap = 13
    bar_w = (w - 42 - gap * (len(labels) - 1)) / len(labels)
    for idx, (label_text, value) in enumerate(labels):
        bh = max_h * value
        bx = x + 20 + idx * (bar_w + gap)
        c.setFillColor(palette[idx % len(palette)])
        c.roundRect(bx, base, bar_w, bh, 5, fill=1, stroke=0)
        text(c, bx, base - 12, label_text, 6.4, MUTED)


def diagram_flow(c, x, y, w, h, title):
    card(c, x, y, w, h, title)
    mid = y + h / 2 - 6
    box(c, x + 24, mid, 58, 25, "Début", GREEN)
    box(c, x + 112, mid, 78, 25, "Condition ?", ORANGE)
    box(c, x + 224, mid + 26, 72, 25, "Oui", BLUE)
    box(c, x + 224, mid - 28, 72, 25, "Non", PURPLE)
    box(c, x + 330, mid, 54, 25, "Fin", GREEN_DARK)
    arrow(c, x + 82, mid + 12, x + 112, mid + 12)
    arrow(c, x + 190, mid + 12, x + 224, mid + 38)
    arrow(c, x + 190, mid + 12, x + 224, mid - 16)
    arrow(c, x + 296, mid + 38, x + 330, mid + 12)
    arrow(c, x + 296, mid - 16, x + 330, mid + 12)


def diagram_network(c, x, y, w, h, title):
    card(c, x, y, w, h, title)
    layers = [(3, x + 72), (5, x + 170), (4, x + 270), (2, x + 370)]
    for li, (count, lx) in enumerate(layers):
        for i in range(count):
            cy = y + 40 + i * ((h - 70) / max(1, count - 1))
            c.setFillColor([GREEN, BLUE, ORANGE, PURPLE][li])
            c.circle(lx, cy, 7, fill=1, stroke=0)
            if li < len(layers) - 1:
                next_count, next_x = layers[li + 1]
                for j in range(next_count):
                    ny = y + 40 + j * ((h - 70) / max(1, next_count - 1))
                    c.setStrokeColor(LINE)
                    c.line(lx + 8, cy, next_x - 8, ny)


def diagram_erd(c, x, y, w, h, title):
    card(c, x, y, w, h, title)
    box(c, x + 30, y + 55, 92, 42, "clients\nid, nom", GREEN)
    box(c, x + 176, y + 55, 100, 42, "commandes\nid, client_id", BLUE)
    box(c, x + 330, y + 55, 92, 42, "paiements\ncommande_id", ORANGE)
    arrow(c, x + 122, y + 76, x + 176, y + 76)
    arrow(c, x + 276, y + 76, x + 330, y + 76)
    text(c, x + 140, y + 88, "1→n", 7, MUTED)
    text(c, x + 292, y + 88, "1→1", 7, MUTED)


COURSES = [
    {
        "file": "manuel-python-professionnel-charmant-nyungu.pdf",
        "course": "Python professionnel",
        "pages": [
            [
                ("Pipeline d’exécution Python", diagram_pipeline, ["Code source", "Interpréteur", "Bytecode", "Runtime", "Résultat"]),
                ("Pile d’appels de fonctions", diagram_layers, ["main()", "service()", "validation()", "calcul()", "retour"]),
                ("Architecture OOP simple", diagram_erd, None),
                ("Pipeline Data/IA avec Python", diagram_pipeline, ["CSV/API", "Pandas", "Modèle", "Évaluation", "Rapport"]),
            ],
            [
                ("API web Python", diagram_pipeline, ["Client", "Route", "Service", "Base", "Réponse"]),
                ("Priorité d’apprentissage", diagram_bars, [("Syntaxe", .82), ("POO", .68), ("Data", .74), ("Web", .70), ("IA", .62)]),
                ("Décision dans un programme", diagram_flow, None),
                ("Arbre de modules", diagram_tree, ("app", "services", "models")),
            ],
        ],
    },
    {
        "file": "manuel-architecture-logicielle-charmant-nyungu.pdf",
        "course": "Architecture logicielle",
        "pages": [
            [
                ("Architecture en couches", diagram_layers, ["UI", "Application", "Domaine", "Infrastructure", "Données"]),
                ("Flux MVC", diagram_pipeline, ["Utilisateur", "Contrôleur", "Modèle", "Vue", "Interface"]),
                ("Hexagonale : ports/adaptateurs", diagram_pipeline, ["API", "Port", "Domaine", "Repository", "DB"]),
                ("Matrice décisionnelle", diagram_matrix, None),
            ],
            [
                ("Monolithe modulaire", diagram_erd, None),
                ("Cycle qualité", diagram_pipeline, ["Code", "Review", "Tests", "CI/CD", "Prod"]),
                ("Dette technique", diagram_bars, [("Dup.", .72), ("Tests", .48), ("Docs", .52), ("Sécur.", .65), ("Perf.", .58)]),
                ("Arbre des dépendances", diagram_tree, ("core", "ui", "infra")),
            ],
        ],
    },
    {
        "file": "manuel-cybersecurite-defensive-charmant-nyungu.pdf",
        "course": "Cybersécurité défensive",
        "pages": [
            [
                ("Défense en profondeur", diagram_layers, ["Identité", "Application", "Données", "Réseau", "Logs"]),
                ("Réponse à incident", diagram_pipeline, ["Détecter", "Qualifier", "Contenir", "Corriger", "Apprendre"]),
                ("Matrice de risque", diagram_matrix, None),
                ("Chaîne de logs", diagram_pipeline, ["Collecte", "Normalisation", "Corrélation", "Alerte", "Audit"]),
            ],
            [
                ("Contrôle d’accès", diagram_flow, None),
                ("Maturité des contrôles", diagram_bars, [("MFA", .8), ("Logs", .75), ("Patch", .66), ("Backup", .78), ("Audit", .62)]),
                ("Protection des données", diagram_pipeline, ["Classer", "Chiffrer", "Limiter", "Surveiller", "Purger"]),
                ("Arbre d’escalade", diagram_tree, ("Incident", "Support", "RSSI")),
            ],
        ],
    },
    {
        "file": "manuel-data-science-ia-avancee-charmant-nyungu.pdf",
        "course": "Data Science et IA avancée",
        "pages": [
            [
                ("Pipeline Data Science", diagram_pipeline, ["Question", "Données", "Features", "Modèle", "Décision"]),
                ("Réseau neuronal", diagram_network, None),
                ("Matrice modèle/métrique", diagram_matrix, ("faible", "correct", "fort")),
                ("Maturité data", diagram_bars, [("Stats", .75), ("Pandas", .82), ("ML", .70), ("DL", .58), ("NLP", .64)]),
            ],
            [
                ("Pipeline NLP", diagram_pipeline, ["Texte", "Tokens", "Vecteurs", "Modèle", "Classe"]),
                ("Pipeline vision", diagram_pipeline, ["Image", "Prétrait.", "CNN", "Score", "Alerte"]),
                ("Arbre de décision", diagram_tree, ("risque", "oui", "non")),
                ("Flux MLOps", diagram_pipeline, ["Train", "Registry", "Deploy", "Monitor", "Drift"]),
            ],
        ],
    },
    {
        "file": "manuel-bases-de-donnees-charmant-nyungu.pdf",
        "course": "Bases de données",
        "pages": [
            [
                ("Diagramme relationnel", diagram_erd, None),
                ("Cycle SQL", diagram_pipeline, ["Modèle", "Table", "Requête", "Index", "Backup"]),
                ("Arbre d’index", diagram_tree, ("50", "20", "80")),
                ("Matrice SQL / NoSQL", diagram_matrix, ("simple", "mixte", "complexe")),
            ],
            [
                ("Sauvegarde restauration", diagram_pipeline, ["Dump", "Vérifier", "Stocker", "Restaurer", "Tester"]),
                ("Flux transactionnel", diagram_pipeline, ["BEGIN", "UPDATE", "CHECK", "COMMIT", "LOG"]),
                ("Maturité DBA", diagram_bars, [("SQL", .85), ("Index", .74), ("Sécur.", .70), ("Backup", .82), ("NoSQL", .64)]),
                ("Relations métier", diagram_erd, None),
            ],
        ],
    },
    {
        "file": "manuel-algorithmique-logique-programmation-charmant-nyungu.pdf",
        "course": "Algorithmique et logique de programmation",
        "pages": [
            [
                ("Organigramme conditionnel", diagram_flow, None),
                ("Tableau et indices", diagram_bars, [("0", .25), ("1", .42), ("2", .65), ("3", .52), ("4", .88), ("5", .35)]),
                ("Recherche binaire", diagram_tree, ("milieu", "gauche", "droite")),
                ("Méthode de résolution", diagram_pipeline, ["Lire", "Découper", "Coder", "Tester", "Améliorer"]),
            ],
            [
                ("Complexité comparative", diagram_bars, [("O(1)", .2), ("log", .35), ("n", .58), ("n²", .9), ("2ⁿ", 1)]),
                ("Tri par étapes", diagram_pipeline, ["Comparer", "Échanger", "Avancer", "Répéter", "Fin"]),
                ("Récursivité", diagram_layers, ["appel 1", "appel 2", "appel 3", "cas base", "retour"]),
                ("Parcours de graphe", diagram_tree, ("A", "B", "C")),
            ],
        ],
    },
]


def create_atlas_pdf(course_def, output_path):
    c = canvas.Canvas(str(output_path), pagesize=A4)
    page_no = 1
    for diagrams in course_def["pages"]:
        new_page(c, course_def["course"], "Atlas de diagrammes pédagogiques", page_no)
        positions = [(46, 486, 238, 160), (312, 486, 238, 160), (46, 278, 238, 160), (312, 278, 238, 160)]
        for (title_text, fn, payload), (x, y, w, h) in zip(diagrams, positions):
            if payload is None:
                fn(c, x, y, w, h, title_text)
            elif isinstance(payload, tuple) and fn is diagram_tree:
                fn(c, x, y, w, h, title_text, *payload)
            elif fn is diagram_bars:
                fn(c, x, y, w, h, title_text, payload)
            elif fn in (diagram_pipeline, diagram_layers):
                fn(c, x, y, w, h, title_text, payload)
            elif fn is diagram_matrix:
                fn(c, x, y, w, h, title_text, payload)
            else:
                fn(c, x, y, w, h, title_text)
        text(c, 46, 232, "Note pédagogique : chaque diagramme est volontairement séparé dans une carte dédiée afin d’éviter tout chevauchement et de faciliter la lecture en projection ou impression.", 8.2, MUTED, False, 500)
        c.showPage()
        page_no += 1
    c.save()


def append_atlas(course_def):
    pdf_path = DOCS / course_def["file"]
    if not pdf_path.exists():
        raise FileNotFoundError(pdf_path)
    with NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        atlas_path = Path(tmp.name)
    create_atlas_pdf(course_def, atlas_path)

    reader = PdfReader(str(pdf_path))
    atlas = PdfReader(str(atlas_path))
    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    for page in atlas.pages:
        writer.add_page(page)

    backup = pdf_path.with_suffix(".before-diagrams.pdf")
    if not backup.exists():
        backup.write_bytes(pdf_path.read_bytes())

    with NamedTemporaryFile(suffix=".pdf", delete=False) as merged_tmp:
        merged_path = Path(merged_tmp.name)
    with merged_path.open("wb") as handle:
        writer.write(handle)
    pdf_path.write_bytes(merged_path.read_bytes())
    atlas_path.unlink(missing_ok=True)
    merged_path.unlink(missing_ok=True)
    return len(reader.pages), len(atlas.pages), len(writer.pages), pdf_path.stat().st_size


def main():
    results = []
    for course in COURSES:
        before, added, after, size = append_atlas(course)
        results.append({
            "file": course["file"],
            "before_pages": before,
            "added_diagram_pages": added,
            "after_pages": after,
            "bytes": size,
        })
    for result in results:
        print(result)


if __name__ == "__main__":
    main()
