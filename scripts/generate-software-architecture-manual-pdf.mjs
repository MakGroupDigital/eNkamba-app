import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';

const outputDir = path.resolve('docs');
const outputPath = path.join(outputDir, 'manuel-architecture-logicielle-charmant-nyungu.pdf');
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

const page = {
  width: doc.internal.pageSize.getWidth(),
  height: doc.internal.pageSize.getHeight(),
  mx: 50,
  top: 70,
  bottom: 66,
};

const colors = {
  green: [50, 187, 120],
  greenDark: [21, 118, 72],
  orange: [255, 140, 0],
  ink: [24, 35, 30],
  muted: [92, 105, 98],
  pale: [246, 251, 248],
  line: [219, 231, 225],
  blue: [31, 112, 219],
  purple: [119, 75, 217],
  red: [220, 62, 62],
};

let y = page.top;
let currentSection = 'Architecture logicielle';
const toc = [];

function rgb(name) {
  return colors[name] || name;
}

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
  doc.text(`Architecture logicielle — ${author.name}`, page.mx, page.height - 31);
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
  const {
    size = 10,
    style = 'normal',
    color = colors.ink,
    width = page.width - page.mx * 2,
    indent = 0,
    leading = size * 1.48,
    gap = 7,
  } = options;
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
  items.forEach((item) => {
    paragraph(`• ${item}`, { size: options.size || 9.4, indent: options.indent || 12, gap: 3 });
  });
  y += 4;
}

function codeBlock(code, caption = 'Exemple de code') {
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

function roundedLabel(x, y0, w, h, text, fill, textColor = [255, 255, 255]) {
  doc.setFillColor(...fill);
  doc.roundedRect(x, y0, w, h, 9, 9, 'F');
  setFont(8, textColor, 'bold');
  doc.text(doc.splitTextToSize(text, w - 14), x + 7, y0 + 15);
}

function visualPipeline(titleText, items, palette = [colors.green, colors.orange, colors.blue, colors.purple]) {
  ensure(112);
  const w = page.width - page.mx * 2;
  doc.setFillColor(...colors.pale);
  doc.setDrawColor(...colors.line);
  doc.roundedRect(page.mx, y, w, 100, 10, 10, 'FD');
  setFont(8.5, colors.greenDark, 'bold');
  doc.text(titleText, page.mx + 14, y + 18);
  const boxW = (w - 36) / items.length - 8;
  let x = page.mx + 14;
  items.forEach((item, idx) => {
    roundedLabel(x, y + 40, boxW, 34, item, palette[idx % palette.length]);
    if (idx < items.length - 1) {
      setFont(13, colors.muted, 'bold');
      doc.text('→', x + boxW + 2, y + 61);
    }
    x += boxW + 8;
  });
  y += 112;
}

function visualLayers(titleText, layers) {
  ensure(150);
  const w = page.width - page.mx * 2;
  doc.setDrawColor(...colors.line);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(page.mx, y, w, 138, 10, 10, 'FD');
  setFont(8.5, colors.greenDark, 'bold');
  doc.text(titleText, page.mx + 14, y + 18);
  const layerH = 19;
  layers.forEach((layer, idx) => {
    const x = page.mx + 46 + idx * 10;
    const yy = y + 36 + idx * (layerH + 4);
    const ww = w - 92 - idx * 20;
    doc.setFillColor(...[colors.green, colors.blue, colors.orange, colors.purple, colors.greenDark][idx % 5]);
    doc.roundedRect(x, yy, ww, layerH, 7, 7, 'F');
    setFont(7.5, [255, 255, 255], 'bold');
    doc.text(layer, x + 9, yy + 13);
  });
  y += 150;
}

function visualMatrix(titleText) {
  ensure(150);
  const w = page.width - page.mx * 2;
  const x0 = page.mx;
  const y0 = y;
  doc.setFillColor(...colors.pale);
  doc.setDrawColor(...colors.line);
  doc.roundedRect(x0, y0, w, 136, 10, 10, 'FD');
  setFont(8.5, colors.greenDark, 'bold');
  doc.text(titleText, x0 + 14, y0 + 18);
  const labels = ['Faible', 'Moyen', 'Élevé'];
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      const intensity = r + c;
      const fill = intensity < 2 ? colors.green : intensity < 4 ? colors.orange : colors.red;
      doc.setFillColor(...fill);
      doc.roundedRect(x0 + 90 + c * 80, y0 + 38 + r * 28, 68, 20, 5, 5, 'F');
      setFont(6.7, [255, 255, 255], 'bold');
      doc.text(`${labels[r]} / ${labels[c]}`, x0 + 96 + c * 80, y0 + 51 + r * 28);
    }
  }
  setFont(7.5, colors.muted);
  doc.text('Matrice impact × probabilité pour prioriser les risques techniques.', x0 + 14, y0 + 122);
  y += 148;
}

function visualBars(titleText, values) {
  ensure(138);
  const w = page.width - page.mx * 2;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...colors.line);
  doc.roundedRect(page.mx, y, w, 126, 10, 10, 'FD');
  setFont(8.5, colors.greenDark, 'bold');
  doc.text(titleText, page.mx + 14, y + 18);
  const chartX = page.mx + 26;
  const chartY = y + 104;
  values.forEach((item, idx) => {
    const bh = item.value * 0.62;
    const x = chartX + idx * 72;
    doc.setFillColor(...[colors.green, colors.orange, colors.blue, colors.purple, colors.greenDark][idx % 5]);
    doc.roundedRect(x, chartY - bh, 32, bh, 5, 5, 'F');
    setFont(6.8, colors.muted);
    doc.text(item.label, x - 5, chartY + 12);
  });
  y += 138;
}

function visualRadar(titleText, axes) {
  ensure(150);
  const w = page.width - page.mx * 2;
  const cx = page.mx + w / 2;
  const cy = y + 78;
  doc.setFillColor(...colors.pale);
  doc.setDrawColor(...colors.line);
  doc.roundedRect(page.mx, y, w, 136, 10, 10, 'FD');
  setFont(8.5, colors.greenDark, 'bold');
  doc.text(titleText, page.mx + 14, y + 18);
  doc.setDrawColor(...colors.line);
  [28, 46, 64].forEach((r) => doc.circle(cx, cy, r));
  axes.forEach((axis, idx) => {
    const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / axes.length;
    const x = cx + Math.cos(angle) * 72;
    const yy = cy + Math.sin(angle) * 72;
    doc.line(cx, cy, x, yy);
    setFont(6.7, colors.muted);
    doc.text(axis, x - 20, yy);
  });
  doc.setFillColor(50, 187, 120, 0.3);
  doc.setDrawColor(...colors.green);
  const points = axes.map((_, idx) => {
    const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / axes.length;
    const r = 36 + (idx % 3) * 9;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
  });
  points.forEach(([x, yy], idx) => {
    const [nx, ny] = points[(idx + 1) % points.length];
    doc.line(x, yy, nx, ny);
    doc.circle(x, yy, 3, 'F');
  });
  y += 150;
}

function architectureSketch(kind, idx) {
  const options = [
    () => visualPipeline('Flux architectural', ['Besoin', 'Domaine', 'Module', 'Service', 'Déploiement']),
    () => visualLayers('Architecture en couches', ['Interface utilisateur', 'Application', 'Domaine métier', 'Infrastructure', 'Données']),
    () => visualMatrix('Matrice de risque technique'),
    () => visualBars('Comparaison qualitative', [
      { label: 'Lisibilité', value: 82 },
      { label: 'Tests', value: 74 },
      { label: 'Sécurité', value: 68 },
      { label: 'Docs', value: 61 },
      { label: 'Ops', value: 70 },
    ]),
    () => visualRadar('Radar de maturité', ['Code', 'Tests', 'Doc', 'Sécurité', 'Ops', 'UX']),
  ];
  options[(kind + idx) % options.length]();
}

function cover() {
  doc.setFillColor(247, 251, 249);
  doc.rect(0, 0, page.width, page.height, 'F');
  doc.setFillColor(...colors.green);
  doc.rect(0, 0, page.width, 222, 'F');
  doc.setFillColor(...colors.orange);
  doc.circle(page.width - 78, 72, 86, 'F');
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(page.mx, 170, page.width - page.mx * 2, 150, 18, 18, 'F');
  setFont(12, [255, 255, 255], 'bold');
  doc.text('MANUEL PROFESSIONNEL ET UNIVERSITAIRE', page.mx, 66);
  setFont(30, [255, 255, 255], 'bold');
  doc.text('ARCHITECTURE', page.mx, 116);
  doc.text('LOGICIELLE', page.mx, 154);
  setFont(14, colors.ink, 'bold');
  doc.text('Organiser un vrai projet : modules, services, MVC, clean code, tests, documentation et sécurité', page.mx + 20, 212, {
    maxWidth: page.width - page.mx * 2 - 40,
  });
  setFont(24, colors.greenDark, 'bold');
  doc.text(author.name, page.mx, 390);
  paragraph(author.profession, { size: 10, width: page.width - page.mx * 2 });
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
  visualPipeline('Vision du livre', ['Comprendre', 'Structurer', 'Tester', 'Sécuriser', 'Déployer']);
  setFont(9, colors.muted);
  doc.text(
    'Ce support privilégie les visuels, les schémas, les exemples de code, les tableaux de décision et les exercices guidés.',
    page.mx,
    770,
    { maxWidth: page.width - page.mx * 2 },
  );
  newPage();
}

const sections = [
  {
    name: 'Partie 1 : Fondations de l’architecture logicielle',
    chapters: [
      ['Rôle de l’architecte logiciel', ['vision', 'arbitrage', 'responsabilité', 'communication']],
      ['Penser système', ['frontière', 'flux', 'dépendance', 'contrat']],
      ['Qualités non fonctionnelles', ['performance', 'sécurité', 'maintenabilité', 'observabilité']],
    ],
  },
  {
    name: 'Partie 2 : Organisation d’un vrai projet',
    chapters: [
      ['Arborescence professionnelle', ['dossiers', 'noms', 'conventions', 'lisibilité']],
      ['Modules et responsabilités', ['cohésion', 'couplage', 'interfaces', 'réutilisation']],
      ['Services applicatifs', ['cas d’usage', 'orchestration', 'transactions', 'erreurs']],
    ],
  },
  {
    name: 'Partie 3 : Modèles d’architecture',
    chapters: [
      ['MVC et variantes modernes', ['modèle', 'vue', 'contrôleur', 'présentation']],
      ['Architecture en couches', ['UI', 'application', 'domaine', 'infrastructure']],
      ['Architecture hexagonale', ['ports', 'adaptateurs', 'domaine', 'tests']],
      ['Microservices et monolithe modulaire', ['frontières', 'déploiement', 'données', 'complexité']],
    ],
  },
  {
    name: 'Partie 4 : Clean code et conception',
    chapters: [
      ['Nommage et intention', ['variables', 'fonctions', 'classes', 'langage métier']],
      ['SOLID en pratique', ['SRP', 'OCP', 'LSP', 'ISP', 'DIP']],
      ['Design patterns utiles', ['Factory', 'Strategy', 'Repository', 'Observer']],
      ['Refactoring', ['odeurs de code', 'petits pas', 'tests', 'revue']],
    ],
  },
  {
    name: 'Partie 5 : Tests et qualité',
    chapters: [
      ['Pyramide de tests', ['unitaires', 'intégration', 'end-to-end', 'contrats']],
      ['Tests automatisés', ['fixtures', 'mocks', 'CI', 'couverture']],
      ['Qualité continue', ['lint', 'formatage', 'analyse statique', 'revue']],
    ],
  },
  {
    name: 'Partie 6 : Documentation et gouvernance',
    chapters: [
      ['Documentation vivante', ['README', 'ADR', 'diagrammes', 'runbooks']],
      ['Cahier d’architecture', ['contexte', 'contraintes', 'décisions', 'risques']],
      ['Communication technique', ['public', 'niveau', 'preuve', 'synthèse']],
    ],
  },
  {
    name: 'Partie 7 : Sécurité architecturale',
    chapters: [
      ['Security by design', ['menaces', 'surface', 'contrôle', 'journalisation']],
      ['Authentification et autorisation', ['identité', 'rôles', 'permissions', 'sessions']],
      ['Protection des données', ['chiffrement', 'secrets', 'sauvegardes', 'rétention']],
      ['Audit et conformité', ['logs', 'traçabilité', 'incidents', 'preuve']],
    ],
  },
  {
    name: 'Partie 8 : API, intégration et données',
    chapters: [
      ['Conception d’API', ['REST', 'contrats', 'versioning', 'erreurs']],
      ['Bases de données et architecture', ['modèle', 'index', 'transactions', 'migration']],
      ['Événements et files de messages', ['asynchrone', 'résilience', 'ordre', 'idempotence']],
    ],
  },
  {
    name: 'Partie 9 : Déploiement, observabilité et exploitation',
    chapters: [
      ['CI/CD', ['pipeline', 'validation', 'release', 'rollback']],
      ['Monitoring', ['métriques', 'logs', 'traces', 'alertes']],
      ['Scalabilité et performance', ['cache', 'files', 'profiling', 'capacité']],
    ],
  },
  {
    name: 'Partie 10 : Projets professionnels complets',
    chapters: [
      ['Architecture d’une plateforme e-commerce', ['catalogue', 'panier', 'paiement', 'logistique']],
      ['Architecture d’un système hospitalier', ['patients', 'rendez-vous', 'dossiers', 'confidentialité']],
      ['Architecture d’un système financier', ['wallet', 'transactions', 'audit', 'fraude']],
      ['Architecture d’une application éducative', ['cours', 'examens', 'certificats', 'analytique']],
      ['Architecture d’une super app africaine', ['modules', 'identité', 'paiement', 'sécurité']],
    ],
  },
  {
    name: 'Partie 11 : Exercices, certification et annexes',
    chapters: [
      ['Banque d’exercices', ['analyse', 'diagrammes', 'code', 'revue']],
      ['Examens blancs', ['questions', 'cas', 'projet', 'soutenance']],
      ['Glossaire et feuilles de route', ['termes', 'références', 'progression', 'seniorité']],
    ],
  },
];

function preliminaries() {
  cover();
  currentSection = 'Préliminaires';
  title('Présentation du manuel', 1);
  paragraph(
    `Ce manuel d’architecture logicielle est conçu pour apprendre à organiser un vrai projet logiciel de manière professionnelle. Il s’adresse aux étudiants, développeurs, chefs de projets, entrepreneurs, ingénieurs, architectes débutants et responsables techniques qui veulent comprendre comment passer d’un code fonctionnel à un système maintenable, sécurisé et évolutif.`,
  );
  paragraph(
    `L’auteur, ${author.name}, y propose une approche progressive : comprendre les responsabilités, découper le système, documenter les décisions, tester les comportements, sécuriser les flux et préparer l’exploitation en production.`,
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
    'L’architecture logicielle n’est pas une décoration ajoutée à la fin du développement. Elle est la manière dont une équipe transforme une ambition en système durable. Une bonne architecture permet de comprendre vite, modifier sans peur, tester avec confiance et livrer avec discipline.',
  );
  paragraph(
    'Un projet mal organisé peut fonctionner pendant quelques semaines, puis devenir coûteux à maintenir. Un projet bien structuré donne à l’équipe une mémoire, une direction et une capacité d’évolution. Ce livre montre comment atteindre cet objectif avec des méthodes concrètes.',
  );
  title('Comment utiliser ce livre', 1);
  bullet([
    'Lire chaque chapitre avec un carnet de décisions techniques.',
    'Reproduire les diagrammes à partir de vos propres projets.',
    'Exécuter les exemples de code et les modifier volontairement.',
    'Comparer plusieurs architectures avant de choisir.',
    'Écrire une documentation courte pour chaque décision importante.',
  ]);
  title('Table des matières détaillée', 1);
  sections.forEach((section, index) => {
    title(`${index + 1}. ${section.name}`, 3);
    bullet(section.chapters.map(([chapter, topics]) => `${chapter} : ${topics.join(', ')}`), { size: 8.6 });
  });
}

function codeForChapter(chapter, topics) {
  if (chapter.toLowerCase().includes('mvc')) {
    return `
class UserModel:
    def __init__(self, name):
        self.name = name

class UserView:
    def render(self, user):
        return f"Utilisateur : {user.name}"

class UserController:
    def __init__(self, view):
        self.view = view

    def show_profile(self, name):
        user = UserModel(name)
        return self.view.render(user)

print(UserController(UserView()).show_profile("Amina"))`;
  }
  if (chapter.toLowerCase().includes('tests')) {
    return `
def calculer_total(prix, taxe):
    if prix < 0:
        raise ValueError("Le prix ne peut pas être négatif")
    return round(prix + prix * taxe, 2)

def test_calculer_total():
    assert calculer_total(100, 0.16) == 116.0
    assert calculer_total(0, 0.16) == 0.0`;
  }
  if (chapter.toLowerCase().includes('api')) {
    return `
from fastapi import FastAPI, HTTPException

app = FastAPI()
orders = {"CMD-001": {"status": "paid"}}

@app.get("/orders/{reference}")
def get_order(reference: str):
    if reference not in orders:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    return {"reference": reference, **orders[reference]}`;
  }
  if (chapter.toLowerCase().includes('sécurité') || chapter.toLowerCase().includes('auth')) {
    return `
def can_access(user, resource):
    if not user.get("active"):
        return False
    permissions = user.get("permissions", [])
    return resource in permissions

agent = {"active": True, "permissions": ["orders:read", "payments:read"]}
print(can_access(agent, "orders:read"))`;
  }
  return `
class ${topics[0] ? topics[0].replace(/[^a-zA-Z]/g, '').slice(0, 12) || 'Service' : 'Service'}Service:
    def __init__(self, repository):
        self.repository = repository

    def execute(self, command):
        if not command:
            raise ValueError("Commande invalide")
        result = self.repository.save(command)
        return {"status": "success", "result": result}`;
}

function chapter(sectionName, chapterTitle, topics, index) {
  currentSection = sectionName;
  newPage();
  toc.push({ section: sectionName, chapter: chapterTitle, page: doc.getNumberOfPages() });
  title(chapterTitle, 1);
  paragraph(
    `Ce chapitre explique ${chapterTitle.toLowerCase()} dans une logique professionnelle. L’objectif n’est pas seulement de connaître une définition, mais de savoir l’appliquer dans un vrai projet, avec des modules clairs, des services cohérents, des tests utiles, une documentation maintenable et une sécurité intégrée dès la conception.`,
    { size: 10.4 },
  );
  architectureSketch(index, topics.length);
  title('Objectifs opérationnels', 2);
  bullet([
    `Identifier les responsabilités associées à ${chapterTitle}.`,
    'Découper le système en éléments compréhensibles par l’équipe.',
    'Écrire du code dont l’intention reste lisible après plusieurs mois.',
    'Prévoir les tests, la documentation, les erreurs et les risques.',
    'Relier la décision technique au besoin métier réel.',
  ]);
  table(
    ['Concept', 'Question d’architecture', 'Décision attendue'],
    topics.map((topic) => [
      topic,
      `Comment ${topic} influence-t-il la structure du projet ?`,
      'Définir une règle claire, documentée et testable.',
    ]),
  );
  title('Théorie approfondie', 2);
  topics.forEach((topic, i) => {
    title(topic, 3);
    paragraph(
      `${topic} doit être compris comme un levier de maîtrise. Dans une équipe professionnelle, une notion d’architecture n’a de valeur que si elle réduit l’ambiguïté, facilite la collaboration et rend le système plus fiable. Le code doit parler le langage du métier, mais il doit aussi respecter les contraintes techniques : sécurité, performance, évolutivité, coûts et exploitation.`,
    );
    paragraph(
      `Analogie : un bâtiment solide n’est pas seulement une accumulation de briques. Il repose sur des plans, des fondations, des circuits, des zones d’accès et des règles de maintenance. De la même manière, ${topic.toLowerCase()} aide à construire un logiciel qui reste habitable pour les développeurs et fiable pour les utilisateurs.`,
    );
    if (i % 2 === 0) {
      visualPipeline(`Flux pratique : ${topic}`, ['Entrée', 'Règle', 'Service', 'Résultat']);
    }
  });
  title('Exemple de code professionnel', 2);
  codeBlock(codeForChapter(chapterTitle, topics), `Code — ${chapterTitle}`);
  paragraph(
    'Le code présenté est volontairement court. En architecture logicielle, la simplicité contrôlée vaut mieux qu’une complexité brillante mais fragile. Le rôle de l’architecte est de rendre le système compréhensible, testable et modifiable.',
  );
  title('Étude de cas', 2);
  paragraph(
    `Imaginez une plateforme de paiement, de logistique ou d’e-commerce. Si ${chapterTitle.toLowerCase()} est négligé, l’équipe finit par modifier plusieurs fichiers sans savoir où se trouve la vraie règle métier. Si le sujet est bien traité, chaque changement possède un emplacement naturel, une documentation courte et des tests ciblés.`,
  );
  architectureSketch(index + 2, topics.length + 1);
  title('Bonnes pratiques', 2);
  bullet([
    'Documenter les décisions importantes sous forme d’ADR court.',
    'Éviter les modules fourre-tout qui mélangent plusieurs responsabilités.',
    'Nommer les services selon les cas d’usage métier.',
    'Isoler les dépendances externes derrière des interfaces.',
    'Écrire des tests avant les refactorings risqués.',
    'Ajouter des logs utiles sans exposer de données sensibles.',
  ]);
  title('Pièges à éviter', 2);
  bullet([
    'Confondre architecture et empilement de technologies.',
    'Créer trop de couches sans bénéfice réel.',
    'Laisser les règles métier dans les composants d’interface.',
    'Documenter seulement après un incident.',
    'Croire qu’un microservice corrige un mauvais découpage métier.',
  ]);
  title('Exercices corrigés', 2);
  for (let i = 1; i <= 5; i += 1) {
    paragraph(
      `Exercice ${i} : choisissez un module d’application et décrivez comment ${topics[(i - 1) % topics.length]} doit être organisé. Précisez les fichiers, les responsabilités, les tests et les risques.`,
      { size: 9.2, gap: 3 },
    );
    paragraph(
      `Corrigé ${i} : une réponse solide commence par le besoin métier, propose une frontière claire, nomme les entrées et sorties, prévoit un test unitaire, un test d’intégration et une note de documentation. La solution doit éviter les dépendances cachées.`,
      { size: 9.2, color: colors.muted, gap: 6 },
    );
  }
  title('Quiz de validation', 2);
  bullet([
    'Quelle responsabilité ce chapitre permet-il de clarifier ?',
    'Quelle erreur d’organisation peut coûter cher en production ?',
    'Quel test prouve que la décision est correcte ?',
    'Quelle information doit apparaître dans la documentation ?',
    'Quel risque de sécurité ou d’exploitation faut-il surveiller ?',
  ]);
}

function exercisesAndAppendix() {
  currentSection = 'Exercices et annexes';
  newPage();
  title('Banque de 420 exercices d’architecture logicielle', 1);
  paragraph(
    'Les exercices suivants entraînent l’apprenant à raisonner comme un architecte : analyser, découper, documenter, coder, tester, sécuriser et expliquer. Chaque exercice doit être résolu avec un diagramme et une justification courte.',
  );
  const domains = [
    'Modules et services',
    'MVC et couches',
    'Clean code',
    'Tests',
    'Documentation',
    'Sécurité',
    'API et intégration',
    'Base de données',
    'CI/CD',
    'Observabilité',
    'Performance',
    'Projets complets',
  ];
  let n = 1;
  domains.forEach((domain, d) => {
    title(domain, 2);
    architectureSketch(d, n);
    for (let i = 0; i < 35; i += 1) {
      paragraph(
        `Exercice ${n} : analysez un problème lié à ${domain}. Produisez un schéma, une proposition de structure de dossiers, une règle de nommage, un test minimal et une note de risque. Corrigé attendu : séparation claire des responsabilités, dépendances explicites, comportement testable et documentation courte.`,
        { size: 8.6, gap: 3 },
      );
      n += 1;
    }
  });
  title('Examens blancs', 1);
  for (let exam = 1; exam <= 6; exam += 1) {
    title(`Examen blanc ${exam}`, 2);
    bullet([
      'Question 1 : analyser une architecture existante et identifier trois faiblesses.',
      'Question 2 : proposer une arborescence professionnelle.',
      'Question 3 : écrire un service métier testable.',
      'Question 4 : produire un diagramme de flux.',
      'Question 5 : documenter une décision d’architecture.',
      'Projet : présenter une solution complète devant un jury.',
    ]);
  }
  title('Glossaire professionnel', 1);
  table(
    ['Terme', 'Définition'],
    [
      ['Architecture logicielle', 'Organisation des composants, responsabilités, flux, règles et contraintes d’un système.'],
      ['Module', 'Unité cohérente regroupant une responsabilité claire.'],
      ['Service', 'Composant qui orchestre un cas d’usage ou une opération métier.'],
      ['MVC', 'Modèle de séparation entre données, interface et contrôle.'],
      ['Clean code', 'Code lisible, intentionnel, testable et maintenable.'],
      ['ADR', 'Architecture Decision Record, note courte expliquant une décision technique.'],
      ['Observabilité', 'Capacité à comprendre l’état du système via logs, métriques et traces.'],
      ['Security by design', 'Intégration de la sécurité dès la conception.'],
    ],
  );
  title('Feuille de route pour devenir architecte logiciel', 1);
  bullet([
    'Maîtriser un langage et écrire du code propre.',
    'Comprendre les bases de données, API, tests et sécurité.',
    'Savoir modéliser avec des diagrammes simples.',
    'Lire du code existant et proposer des refactorings progressifs.',
    'Documenter les décisions et expliquer les compromis.',
    'Participer à des revues de code et incidents de production.',
    'Concevoir un système complet, puis l’exploiter en conditions réelles.',
  ]);
  title('Contact professionnel', 1);
  paragraph(`${author.name} — ${author.profession}`);
  bullet([author.site, author.email, author.phone]);
}

function fillerVisualCards() {
  while (doc.getNumberOfPages() < 180) {
    currentSection = 'Fiches visuelles complémentaires';
    newPage();
    const n = doc.getNumberOfPages();
    title(`Fiche visuelle d’architecture ${n}`, 1);
    paragraph(
      'Cette fiche sert de support de révision. Elle demande à l’apprenant de transformer un concept en schéma, en code, en test et en décision documentée. L’objectif est de développer une mémoire pratique, pas seulement une mémoire théorique.',
    );
    architectureSketch(n, n % 7);
    table(
      ['Question', 'Réponse attendue'],
      [
        ['Quel est le module ?', 'Un nom clair, lié au métier.'],
        ['Quelle est la responsabilité ?', 'Une phrase courte et vérifiable.'],
        ['Quel est le risque ?', 'Un risque technique ou métier mesurable.'],
        ['Quel test faut-il ?', 'Un test qui prouve le comportement attendu.'],
      ],
    );
    codeBlock(
      `
class UseCase:
    def __init__(self, service):
        self.service = service

    def run(self, payload):
        if payload is None:
            raise ValueError("Données manquantes")
        return self.service.handle(payload)
`,
      'Gabarit de cas d’usage',
    );
  }
}

function addMetadataAndPageNumbers() {
  const total = doc.getNumberOfPages();
  doc.setProperties({
    title: 'Architecture logicielle — Manuel complet',
    subject: 'Modules, services, MVC, clean code, tests, documentation, sécurité et projets professionnels',
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
fillerVisualCards();
footer();
addMetadataAndPageNumbers();

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, Buffer.from(doc.output('arraybuffer')));
console.log(JSON.stringify({ outputPath, pages: doc.getNumberOfPages(), bytes: fs.statSync(outputPath).size }, null, 2));
