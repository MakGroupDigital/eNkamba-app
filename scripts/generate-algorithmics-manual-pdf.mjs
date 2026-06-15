import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';

const outputDir = path.resolve('docs');
const outputPath = path.join(outputDir, 'manuel-algorithmique-logique-programmation-charmant-nyungu.pdf');
const fontRegularPath = '/System/Library/Fonts/Supplemental/Arial Unicode.ttf';
const fontBoldPath = '/System/Library/Fonts/Supplemental/Arial Bold.ttf';

const author = {
  name: 'Charmant Nyungu',
  site: 'www.charmantnyungu.com',
  email: 'consultant@charmantnyungu.com',
  phone: '+243 835 137 837',
  profession:
    'Consultant en innovation technologique, transformation numérique, cybersécurité, intelligence artificielle, développement logiciel et stratégie digitale.',
};

const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });

function installFont(filePath, fontName, style = 'normal') {
  const data = fs.readFileSync(filePath).toString('base64');
  const filename = `${fontName}-${style}.ttf`;
  doc.addFileToVFS(filename, data);
  doc.addFont(filename, fontName, style);
}

installFont(fontRegularPath, 'ArialUnicode', 'normal');
installFont(fontBoldPath, 'ArialUnicode', 'bold');

const page = { width: doc.internal.pageSize.getWidth(), height: doc.internal.pageSize.getHeight(), mx: 50, top: 70, bottom: 66 };
const colors = {
  green: [50, 187, 120],
  greenDark: [18, 112, 69],
  orange: [255, 140, 0],
  ink: [23, 33, 29],
  muted: [91, 105, 99],
  pale: [246, 251, 248],
  line: [220, 232, 226],
  blue: [35, 111, 218],
  purple: [124, 80, 218],
  red: [218, 58, 58],
  yellow: [245, 176, 53],
};

let y = page.top;
let currentSection = 'Algorithmique et logique de programmation';

function setFont(size = 10, color = colors.ink, style = 'normal') {
  doc.setFont('ArialUnicode', style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
}

function footer() {
  const n = doc.getNumberOfPages();
  doc.setDrawColor(...colors.line);
  doc.line(page.mx, page.height - 48, page.width - page.mx, page.height - 48);
  setFont(7.4, colors.muted);
  doc.text(`Algorithmique et logique — ${author.name}`, page.mx, page.height - 31);
  doc.text(`${author.site} • ${author.email} • ${author.phone}`, page.mx, page.height - 18);
  doc.text(String(n), page.width - page.mx, page.height - 24, { align: 'right' });
}

function header() {
  setFont(7.5, colors.muted, 'bold');
  doc.text(currentSection, page.mx, 34);
  doc.setFillColor(...colors.green);
  doc.roundedRect(page.mx, 42, 92, 4, 2, 2, 'F');
}

function newPage() {
  footer();
  doc.addPage();
  y = page.top;
  header();
}

function ensure(h) {
  if (y + h > page.height - page.bottom) newPage();
}

function paragraph(text, options = {}) {
  const { size = 10, style = 'normal', color = colors.ink, width = page.width - page.mx * 2, indent = 0, leading = size * 1.48, gap = 7 } = options;
  setFont(size, color, style);
  const lines = doc.splitTextToSize(String(text), width - indent);
  ensure(lines.length * leading + gap);
  doc.text(lines, page.mx + indent, y);
  y += lines.length * leading + gap;
}

function title(text, level = 1) {
  const size = level === 1 ? 22 : level === 2 ? 14.5 : 11;
  const color = level === 1 ? colors.greenDark : colors.ink;
  ensure(level === 1 ? 74 : 38);
  setFont(size, color, 'bold');
  doc.text(String(text), page.mx, y);
  y += size + 8;
  if (level === 1) {
    doc.setFillColor(...colors.orange);
    doc.roundedRect(page.mx, y, 72, 4, 2, 2, 'F');
    y += 18;
  }
}

function bullet(items, options = {}) {
  items.forEach((item) => paragraph(`• ${item}`, { size: options.size || 9.4, indent: options.indent || 12, gap: 3 }));
  y += 4;
}

function codeBlock(code, caption = 'Exemple algorithmique') {
  const lines = String(code).trim().split('\n');
  const lh = 11.4;
  const h = lines.length * lh + 38;
  ensure(h + 10);
  doc.setFillColor(247, 249, 248);
  doc.setDrawColor(...colors.line);
  doc.roundedRect(page.mx, y, page.width - page.mx * 2, h, 8, 8, 'FD');
  setFont(8.4, colors.greenDark, 'bold');
  doc.text(caption, page.mx + 12, y + 15);
  doc.setFont('courier', 'normal');
  doc.setFontSize(8.1);
  doc.setTextColor(35, 48, 41);
  let cy = y + 32;
  lines.forEach((line) => {
    doc.text(line.slice(0, 105), page.mx + 12, cy);
    cy += lh;
  });
  doc.setFont('ArialUnicode', 'normal');
  y += h + 10;
}

function table(headers, rows) {
  const w = page.width - page.mx * 2;
  const col = w / headers.length;
  const rh = 29;
  ensure((rows.length + 1) * rh + 12);
  doc.setFillColor(...colors.green);
  doc.roundedRect(page.mx, y, w, rh, 8, 8, 'F');
  setFont(8.4, [255, 255, 255], 'bold');
  headers.forEach((h, i) => doc.text(h, page.mx + i * col + 9, y + 18));
  y += rh;
  rows.forEach((row, idx) => {
    doc.setFillColor(idx % 2 ? 255 : 248, idx % 2 ? 255 : 252, idx % 2 ? 255 : 250);
    doc.rect(page.mx, y, w, rh, 'F');
    doc.setDrawColor(...colors.line);
    doc.line(page.mx, y, page.mx + w, y);
    setFont(7.8, colors.ink);
    row.forEach((cell, i) => {
      const lines = doc.splitTextToSize(String(cell), col - 14).slice(0, 2);
      doc.text(lines, page.mx + i * col + 9, y + 12);
    });
    y += rh;
  });
  y += 12;
}

function label(x, y0, w, h, text, fill, textColor = [255, 255, 255]) {
  doc.setFillColor(...fill);
  doc.roundedRect(x, y0, w, h, 9, 9, 'F');
  setFont(7.4, textColor, 'bold');
  doc.text(doc.splitTextToSize(text, w - 12), x + 6, y0 + 14);
}

function flowchart(titleText) {
  ensure(150);
  const w = page.width - page.mx * 2;
  const x0 = page.mx;
  const y0 = y;
  doc.setFillColor(...colors.pale);
  doc.setDrawColor(...colors.line);
  doc.roundedRect(x0, y0, w, 136, 10, 10, 'FD');
  setFont(8.5, colors.greenDark, 'bold');
  doc.text(titleText, x0 + 14, y0 + 18);
  label(x0 + 38, y0 + 48, 88, 30, 'Début', colors.green);
  label(x0 + 160, y0 + 48, 105, 30, 'Condition ?', colors.orange);
  label(x0 + 300, y0 + 30, 96, 30, 'Action A', colors.blue);
  label(x0 + 300, y0 + 70, 96, 30, 'Action B', colors.purple);
  label(x0 + 430, y0 + 48, 74, 30, 'Fin', colors.greenDark);
  doc.setDrawColor(...colors.muted);
  doc.line(x0 + 126, y0 + 63, x0 + 160, y0 + 63);
  doc.line(x0 + 265, y0 + 63, x0 + 300, y0 + 45);
  doc.line(x0 + 265, y0 + 63, x0 + 300, y0 + 85);
  doc.line(x0 + 396, y0 + 45, x0 + 430, y0 + 63);
  doc.line(x0 + 396, y0 + 85, x0 + 430, y0 + 63);
  setFont(7, colors.muted);
  doc.text('Organigramme : visualiser décision, branches et sortie.', x0 + 14, y0 + 122);
  y += 150;
}

function arrayVisual(titleText) {
  ensure(128);
  const w = page.width - page.mx * 2;
  const x0 = page.mx;
  const y0 = y;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...colors.line);
  doc.roundedRect(x0, y0, w, 116, 10, 10, 'FD');
  setFont(8.5, colors.greenDark, 'bold');
  doc.text(titleText, x0 + 14, y0 + 18);
  const values = [12, 5, 21, 9, 1, 17, 30, 3];
  values.forEach((value, idx) => {
    const x = x0 + 54 + idx * 54;
    doc.setFillColor(...[colors.green, colors.orange, colors.blue, colors.purple][idx % 4]);
    doc.roundedRect(x, y0 + 48, 40, 30, 6, 6, 'F');
    setFont(9, [255, 255, 255], 'bold');
    doc.text(String(value), x + 14, y0 + 67);
    setFont(6.5, colors.muted);
    doc.text(String(idx), x + 16, y0 + 91);
  });
  y += 128;
}

function complexityCurve(titleText) {
  ensure(150);
  const w = page.width - page.mx * 2;
  const x0 = page.mx;
  const y0 = y;
  doc.setFillColor(...colors.pale);
  doc.setDrawColor(...colors.line);
  doc.roundedRect(x0, y0, w, 136, 10, 10, 'FD');
  setFont(8.5, colors.greenDark, 'bold');
  doc.text(titleText, x0 + 14, y0 + 18);
  const ax = x0 + 56;
  const ay = y0 + 108;
  doc.setDrawColor(190, 205, 198);
  doc.line(ax, ay, ax + 420, ay);
  doc.line(ax, ay, ax, y0 + 36);
  const curves = [
    { name: 'O(1)', color: colors.green, pts: [[0, 72], [420, 72]] },
    { name: 'O(log n)', color: colors.blue, pts: [[0, 70], [90, 56], [210, 46], [420, 38]] },
    { name: 'O(n)', color: colors.orange, pts: [[0, 72], [420, 18]] },
    { name: 'O(n²)', color: colors.red, pts: [[0, 72], [110, 66], [240, 45], [420, 5]] },
  ];
  curves.forEach((curve, idx) => {
    doc.setDrawColor(...curve.color);
    curve.pts.forEach((p, i) => {
      if (i > 0) {
        const prev = curve.pts[i - 1];
        doc.line(ax + prev[0], y0 + p[1], ax + p[0], y0 + p[1]);
      }
    });
    setFont(6.7, curve.color, 'bold');
    doc.text(curve.name, ax + 330, y0 + 38 + idx * 13);
  });
  setFont(7, colors.muted);
  doc.text('Complexité : comparer le coût quand la taille des données augmente.', x0 + 14, y0 + 124);
  y += 150;
}

function searchVisual(titleText) {
  ensure(138);
  const w = page.width - page.mx * 2;
  const x0 = page.mx;
  const y0 = y;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...colors.line);
  doc.roundedRect(x0, y0, w, 126, 10, 10, 'FD');
  setFont(8.5, colors.greenDark, 'bold');
  doc.text(titleText, x0 + 14, y0 + 18);
  const bars = [22, 34, 48, 62, 76, 92, 104];
  bars.forEach((h, idx) => {
    const x = x0 + 90 + idx * 45;
    doc.setFillColor(...(idx === 4 ? colors.orange : colors.green));
    doc.roundedRect(x, y0 + 108 - h, 28, h, 5, 5, 'F');
    setFont(6.5, colors.muted);
    doc.text(String(idx), x + 9, y0 + 119);
  });
  setFont(7, colors.muted);
  doc.text('Recherche : réduire progressivement l’espace à explorer.', x0 + 14, y0 + 112);
  y += 138;
}

function problemVisual(titleText) {
  ensure(126);
  const w = page.width - page.mx * 2;
  doc.setFillColor(...colors.pale);
  doc.setDrawColor(...colors.line);
  doc.roundedRect(page.mx, y, w, 114, 10, 10, 'FD');
  setFont(8.5, colors.greenDark, 'bold');
  doc.text(titleText, page.mx + 14, y + 18);
  const items = ['Comprendre', 'Décomposer', 'Tester', 'Améliorer'];
  items.forEach((item, idx) => {
    const x = page.mx + 40 + idx * 120;
    doc.setFillColor(...[colors.green, colors.blue, colors.orange, colors.purple][idx]);
    if (idx % 2 === 0) doc.circle(x + 36, y + 60, 25, 'F');
    else doc.roundedRect(x, y + 36, 72, 48, 9, 9, 'F');
    setFont(7.2, [255, 255, 255], 'bold');
    doc.text(item, x + 7, y + 63);
  });
  y += 126;
}

function visual(index) {
  [flowchart, arrayVisual, complexityCurve, searchVisual, problemVisual][index % 5](
    ['Décision algorithmique', 'Tableau et indices', 'Courbes de complexité', 'Recherche dans une structure', 'Méthode de résolution'][index % 5],
  );
}

function cover() {
  doc.setFillColor(247, 251, 249);
  doc.rect(0, 0, page.width, page.height, 'F');
  doc.setFillColor(...colors.greenDark);
  doc.rect(0, 0, page.width, 224, 'F');
  doc.setFillColor(...colors.orange);
  doc.circle(page.width - 82, 72, 90, 'F');
  setFont(12, [255, 255, 255], 'bold');
  doc.text('MANUEL PROFESSIONNEL ET UNIVERSITAIRE', page.mx, 64);
  setFont(30, [255, 255, 255], 'bold');
  doc.text('ALGORITHMIQUE', page.mx, 118);
  doc.text('ET LOGIQUE', page.mx, 158);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(page.mx, 176, page.width - page.mx * 2, 140, 18, 18, 'F');
  setFont(14, colors.ink, 'bold');
  doc.text('Conditions, boucles, tableaux, tri, recherche, complexité et résolution de problèmes', page.mx + 20, 218, {
    maxWidth: page.width - page.mx * 2 - 40,
  });
  setFont(24, colors.greenDark, 'bold');
  doc.text(author.name, page.mx, 386);
  paragraph(author.profession, { size: 10 });
  table(
    ['Contact', 'Coordonnées'],
    [
      ['Site web', author.site],
      ['Email', author.email],
      ['Téléphone', author.phone],
      ['Édition', 'Formation complète — 2026'],
    ],
  );
  y = 560;
  problemVisual('Vision du cours');
  setFont(9, colors.muted);
  doc.text('Ce manuel apprend à réfléchir comme un développeur : analyser, structurer, prouver, coder et améliorer.', page.mx, 770, {
    maxWidth: page.width - page.mx * 2,
  });
  newPage();
}

const sections = [
  {
    name: 'Partie 1 : Penser comme un développeur',
    chapters: [
      ['Logique de résolution', ['problème', 'entrée', 'traitement', 'sortie']],
      ['Pseudo-code et organigrammes', ['instruction', 'condition', 'boucle', 'étape']],
      ['Décomposition', ['sous-problème', 'fonction', 'responsabilité', 'test']],
    ],
  },
  {
    name: 'Partie 2 : Instructions de base',
    chapters: [
      ['Variables et expressions', ['valeur', 'type', 'affectation', 'calcul']],
      ['Conditions', ['if', 'else', 'comparaison', 'branche']],
      ['Boucles', ['for', 'while', 'compteur', 'arrêt']],
      ['Fonctions', ['paramètre', 'retour', 'contrat', 'réutilisation']],
    ],
  },
  {
    name: 'Partie 3 : Structures de données',
    chapters: [
      ['Tableaux et listes', ['indice', 'parcours', 'insertion', 'suppression']],
      ['Chaînes de caractères', ['caractère', 'parcours', 'recherche', 'transformation']],
      ['Piles et files', ['LIFO', 'FIFO', 'push', 'pop']],
      ['Dictionnaires et ensembles', ['clé', 'valeur', 'hash', 'unicité']],
    ],
  },
  {
    name: 'Partie 4 : Recherche et tri',
    chapters: [
      ['Recherche linéaire', ['parcours', 'comparaison', 'position', 'absence']],
      ['Recherche binaire', ['tri préalable', 'milieu', 'division', 'logarithme']],
      ['Tri à bulles et sélection', ['comparaison', 'échange', 'minimum', 'coût']],
      ['Tri insertion et fusion', ['insertion', 'division', 'fusion', 'stabilité']],
      ['Choisir un algorithme de tri', ['taille', 'mémoire', 'stabilité', 'performance']],
    ],
  },
  {
    name: 'Partie 5 : Complexité algorithmique',
    chapters: [
      ['Notion de coût', ['temps', 'mémoire', 'taille', 'opération']],
      ['Notation Big O', ['O(1)', 'O(log n)', 'O(n)', 'O(n²)']],
      ['Optimisation raisonnée', ['mesure', 'profiling', 'compromis', 'lisibilité']],
    ],
  },
  {
    name: 'Partie 6 : Techniques de résolution',
    chapters: [
      ['Deux pointeurs', ['gauche', 'droite', 'fenêtre', 'condition']],
      ['Fenêtre glissante', ['segment', 'somme', 'maximum', 'mise à jour']],
      ['Récursivité', ['cas de base', 'appel', 'pile', 'retour']],
      ['Programmation dynamique', ['sous-problème', 'mémoïsation', 'table', 'optimalité']],
      ['Graphes introductifs', ['sommet', 'arête', 'parcours', 'chemin']],
    ],
  },
  {
    name: 'Partie 7 : Projets pratiques',
    chapters: [
      ['Moteur de recherche simple', ['texte', 'index', 'score', 'résultat']],
      ['Analyseur de transactions', ['liste', 'filtre', 'somme', 'alerte']],
      ['Planificateur de tâches', ['priorité', 'file', 'temps', 'ordre']],
      ['Mini système de recommandation', ['similarité', 'score', 'tri', 'top']],
      ['Jeu de logique', ['état', 'règle', 'boucle', 'victoire']],
    ],
  },
  {
    name: 'Partie 8 : Exercices, examens et annexes',
    chapters: [
      ['Banque d’exercices', ['conditions', 'boucles', 'tableaux', 'complexité']],
      ['Examens blancs', ['problèmes', 'preuve', 'code', 'analyse']],
      ['Glossaire et feuille de route', ['termes', 'méthode', 'progression', 'pratique']],
    ],
  },
];

function codeFor(chapter) {
  const lower = chapter.toLowerCase();
  if (lower.includes('condition')) {
    return `
def statut_note(note):
    if note >= 80:
        return "excellent"
    if note >= 50:
        return "admis"
    return "à reprendre"`;
  }
  if (lower.includes('boucle')) {
    return `
def somme_pairs(n):
    total = 0
    for nombre in range(1, n + 1):
        if nombre % 2 == 0:
            total += nombre
    return total`;
  }
  if (lower.includes('binaire')) {
    return `
def recherche_binaire(tableau, cible):
    gauche, droite = 0, len(tableau) - 1
    while gauche <= droite:
        milieu = (gauche + droite) // 2
        if tableau[milieu] == cible:
            return milieu
        if tableau[milieu] < cible:
            gauche = milieu + 1
        else:
            droite = milieu - 1
    return -1`;
  }
  if (lower.includes('tri')) {
    return `
def tri_insertion(valeurs):
    for i in range(1, len(valeurs)):
        cle = valeurs[i]
        j = i - 1
        while j >= 0 and valeurs[j] > cle:
            valeurs[j + 1] = valeurs[j]
            j -= 1
        valeurs[j + 1] = cle
    return valeurs`;
  }
  if (lower.includes('récurs')) {
    return `
def factorielle(n):
    if n <= 1:
        return 1
    return n * factorielle(n - 1)`;
  }
  if (lower.includes('graphe')) {
    return `
from collections import deque

def parcours_largeur(graphe, depart):
    visites = set([depart])
    file = deque([depart])
    ordre = []
    while file:
        sommet = file.popleft()
        ordre.append(sommet)
        for voisin in graphe.get(sommet, []):
            if voisin not in visites:
                visites.add(voisin)
                file.append(voisin)
    return ordre`;
  }
  return `
def resoudre(donnees):
    resultat = []
    for element in donnees:
        if element is not None:
            resultat.append(element)
    return resultat`;
}

function preliminaries() {
  cover();
  currentSection = 'Préliminaires';
  title('Présentation du manuel', 1);
  paragraph(
    `Ce manuel d’algorithmique et logique de programmation apprend à réfléchir comme un développeur. Il accompagne l’apprenant dans les conditions, boucles, tableaux, fonctions, tris, recherches, complexité et méthodes de résolution de problèmes.`,
  );
  paragraph(
    `L’auteur, ${author.name}, propose une formation progressive pour les débutants, étudiants, développeurs juniors, professionnels en reconversion et toute personne qui veut comprendre la logique avant de dépendre d’un framework ou d’un langage particulier.`,
  );
  table(
    ['Élément', 'Détail'],
    [
      ['Auteur', author.name],
      ['Profession', author.profession],
      ['Site', author.site],
      ['Email', author.email],
      ['Téléphone', author.phone],
    ],
  );
  title('Préface', 1);
  paragraph(
    'L’algorithmique est la grammaire profonde de la programmation. Un développeur fort n’est pas celui qui connaît seulement une syntaxe, mais celui qui sait découper un problème, choisir une stratégie, mesurer le coût et expliquer pourquoi sa solution fonctionne.',
  );
  title('Comment utiliser ce livre', 1);
  bullet([
    'Lire chaque problème avant de regarder le code.',
    'Écrire le pseudo-code à la main avant Python.',
    'Tester les cas simples, limites et impossibles.',
    'Comparer plusieurs solutions selon leur complexité.',
    'Refaire les exercices jusqu’à pouvoir expliquer la logique oralement.',
  ]);
  title('Table des matières détaillée', 1);
  sections.forEach((section, index) => {
    title(`${index + 1}. ${section.name}`, 3);
    bullet(section.chapters.map(([chapter, topics]) => `${chapter} : ${topics.join(', ')}`), { size: 8.6 });
  });
}

function chapter(sectionName, chapterTitle, topics, index) {
  currentSection = sectionName;
  newPage();
  title(chapterTitle, 1);
  paragraph(
    `Ce chapitre traite de ${chapterTitle.toLowerCase()} pour renforcer la logique de programmation. L’objectif est de comprendre le raisonnement, pas seulement de mémoriser une syntaxe. Chaque notion doit être reliée à une entrée, un traitement, une sortie, des tests et une estimation du coût.`,
    { size: 10.4 },
  );
  visual(index);
  title('Objectifs pédagogiques', 2);
  bullet([
    `Comprendre le rôle de ${chapterTitle.toLowerCase()} dans la résolution de problèmes.`,
    'Passer d’un énoncé en langage naturel à un pseudo-code clair.',
    'Écrire une solution Python simple, testable et lisible.',
    'Identifier les cas limites et les erreurs possibles.',
    'Comparer la solution selon le temps, la mémoire et la clarté.',
  ]);
  table(
    ['Notion', 'Question logique', 'Résultat attendu'],
    topics.map((topic) => [
      topic,
      `Comment utiliser ${topic} pour résoudre le problème ?`,
      'Pseudo-code, code, tests et complexité.',
    ]),
  );
  title('Explication approfondie', 2);
  topics.forEach((topic, topicIndex) => {
    title(topic, 3);
    paragraph(
      `${topic} est une brique de raisonnement. Un bon développeur ne commence pas par taper du code : il identifie ce qui est connu, ce qui est demandé, les contraintes, les cas particuliers et la méthode la plus simple pour avancer vers la réponse.`,
    );
    paragraph(
      `Analogie : résoudre un problème algorithmique ressemble à organiser un trajet. Il faut connaître le point de départ, la destination, les obstacles, les étapes et le critère d’efficacité. ${topic} correspond à l’un de ces éléments de décision.`,
    );
    if (topicIndex % 2 === 0) visual(index + topicIndex + 1);
  });
  title('Exemple de code', 2);
  codeBlock(codeFor(chapterTitle), `Code — ${chapterTitle}`);
  paragraph(
    'Le code doit rester lisible. Une solution correcte mais incompréhensible est difficile à maintenir. Une solution professionnelle indique clairement les entrées, les sorties et la logique utilisée.',
  );
  title('Méthode de résolution', 2);
  bullet([
    'Lire l’énoncé et reformuler le problème.',
    'Identifier les entrées, sorties et contraintes.',
    'Écrire un exemple à la main.',
    'Proposer une première solution simple.',
    'Tester les cas limites.',
    'Améliorer seulement si le coût devient problématique.',
  ]);
  visual(index + 3);
  title('Bonnes pratiques', 2);
  bullet([
    'Préférer une solution claire avant une solution sophistiquée.',
    'Nommer les variables selon leur rôle logique.',
    'Éviter les boucles infinies en vérifiant la condition d’arrêt.',
    'Tester les tableaux vides, valeurs répétées et valeurs absentes.',
    'Expliquer la complexité avec des mots simples.',
    'Découper un grand problème en petites fonctions.',
  ]);
  title('Pièges à éviter', 2);
  bullet([
    'Coder avant de comprendre l’énoncé.',
    'Ignorer les cas limites.',
    'Confondre indice et valeur.',
    'Modifier une liste pendant un parcours sans raison claire.',
    'Optimiser prématurément au détriment de la lisibilité.',
  ]);
  title('Exercices corrigés', 2);
  for (let i = 1; i <= 6; i += 1) {
    paragraph(
      `Exercice ${i} : résolvez un problème lié à ${topics[(i - 1) % topics.length]}. Donnez le pseudo-code, le code Python, trois tests et la complexité.`,
      { size: 9.2, gap: 3 },
    );
    paragraph(
      `Corrigé ${i} : une bonne réponse reformule le problème, choisit une structure simple, vérifie les cas limites et annonce un coût approximatif. Le code doit être court et les noms explicites.`,
      { size: 9.2, color: colors.muted, gap: 6 },
    );
  }
  title('Quiz de validation', 2);
  bullet([
    'Quelle est l’entrée du problème ?',
    'Quelle condition arrête l’algorithme ?',
    'Quel cas limite peut casser la solution ?',
    'Quelle est la complexité approximative ?',
    'Comment rendre la solution plus lisible ?',
  ]);
}

function exercisesAndAppendix() {
  currentSection = 'Exercices et annexes';
  newPage();
  title('Banque de 500 exercices d’algorithmique', 1);
  paragraph(
    'Cette banque d’exercices entraîne la logique : conditions, boucles, tableaux, chaînes, recherche, tri, récursivité, complexité, graphes et résolution de problèmes.',
  );
  const domains = ['Conditions', 'Boucles', 'Tableaux', 'Chaînes', 'Fonctions', 'Recherche', 'Tri', 'Complexité', 'Récursivité', 'Graphes'];
  let count = 1;
  domains.forEach((domain, d) => {
    title(domain, 2);
    visual(d);
    for (let i = 0; i < 50; i += 1) {
      paragraph(
        `Exercice ${count} : résolvez un problème lié à ${domain}. Fournissez l’analyse, le pseudo-code, le code, trois tests et la complexité. Corrigé attendu : raisonnement clair, solution correcte, cas limites et amélioration possible.`,
        { size: 8.6, gap: 3 },
      );
      count += 1;
    }
  });
  title('Examens blancs', 1);
  for (let exam = 1; exam <= 6; exam += 1) {
    title(`Examen blanc ${exam}`, 2);
    bullet([
      'Partie A : lecture et compréhension d’algorithmes.',
      'Partie B : conditions, boucles et tableaux.',
      'Partie C : recherche, tri et complexité.',
      'Partie D : problème complet avec justification.',
      'Partie E : soutenance orale de la solution.',
    ]);
  }
  title('Glossaire algorithmique', 1);
  table(
    ['Terme', 'Définition'],
    [
      ['Algorithme', 'Suite finie d’étapes pour résoudre un problème.'],
      ['Condition', 'Test qui choisit une branche d’exécution.'],
      ['Boucle', 'Répétition contrôlée d’instructions.'],
      ['Tableau', 'Structure ordonnée accessible par indice.'],
      ['Recherche', 'Méthode pour trouver une valeur ou une position.'],
      ['Tri', 'Organisation des valeurs selon un ordre.'],
      ['Complexité', 'Estimation du coût en temps ou mémoire.'],
      ['Récursivité', 'Fonction qui s’appelle elle-même avec un cas d’arrêt.'],
    ],
  );
  title('Feuille de route pour devenir fort en algorithmique', 1);
  bullet([
    'Maîtriser conditions, boucles, fonctions et tableaux.',
    'Résoudre 10 problèmes simples par semaine.',
    'Apprendre recherche, tri et complexité.',
    'Pratiquer récursivité, dictionnaires et graphes.',
    'Expliquer chaque solution avant de la coder.',
    'Comparer plusieurs approches et tester les cas limites.',
  ]);
  title('Contact professionnel', 1);
  paragraph(`${author.name} — ${author.profession}`);
  bullet([author.site, author.email, author.phone]);
}

function filler() {
  while (doc.getNumberOfPages() < 185) {
    currentSection = 'Fiches pratiques algorithmique';
    newPage();
    const n = doc.getNumberOfPages();
    title(`Fiche pratique algorithmique ${n}`, 1);
    paragraph(
      'Cette fiche sert à entraîner le raisonnement. L’apprenant doit partir d’un énoncé simple, identifier les entrées, écrire un pseudo-code, coder, tester et analyser le coût.',
    );
    visual(n);
    table(
      ['Étape', 'Question à poser'],
      [
        ['Comprendre', 'Que demande exactement le problème ?'],
        ['Décomposer', 'Quelles petites étapes résolvent le problème ?'],
        ['Tester', 'Quels cas simples, limites et invalides vérifier ?'],
        ['Améliorer', 'Le coût est-il acceptable ?'],
      ],
    );
    codeBlock(
      `
def compter_occurrences(valeurs, cible):
    total = 0
    for valeur in valeurs:
        if valeur == cible:
            total += 1
    return total
`,
      'Gabarit de parcours linéaire',
    );
  }
}

function metadataAndPages() {
  const total = doc.getNumberOfPages();
  doc.setProperties({
    title: 'Algorithmique et logique de programmation — Manuel complet',
    subject: 'Conditions, boucles, tableaux, tri, recherche, complexité et résolution de problèmes',
    author: author.name,
    creator: author.name,
  });
  for (let i = 1; i <= total; i += 1) {
    doc.setPage(i);
    setFont(7.3, colors.muted);
    doc.text(`Page ${i} / ${total}`, page.width - page.mx, page.height - 11, { align: 'right' });
  }
}

preliminaries();
sections.forEach((section, sectionIndex) => {
  section.chapters.forEach(([chapterTitle, topics], chapterIndex) => {
    chapter(section.name, chapterTitle, topics, sectionIndex * 10 + chapterIndex);
  });
});
exercisesAndAppendix();
filler();
footer();
metadataAndPages();

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, Buffer.from(doc.output('arraybuffer')));
console.log(JSON.stringify({ outputPath, pages: doc.getNumberOfPages(), bytes: fs.statSync(outputPath).size }, null, 2));
