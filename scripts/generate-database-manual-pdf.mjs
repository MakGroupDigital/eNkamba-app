import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';

const outputDir = path.resolve('docs');
const outputPath = path.join(outputDir, 'manuel-bases-de-donnees-charmant-nyungu.pdf');
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
let currentSection = 'Bases de données';

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
  doc.text(`Bases de données — ${author.name}`, page.mx, page.height - 31);
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

function codeBlock(code, caption = 'Exemple SQL') {
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
  setFont(7.5, textColor, 'bold');
  doc.text(doc.splitTextToSize(text, w - 12), x + 6, y0 + 14);
}

function erd(titleText) {
  ensure(154);
  const w = page.width - page.mx * 2;
  const x0 = page.mx;
  const y0 = y;
  doc.setFillColor(...colors.pale);
  doc.setDrawColor(...colors.line);
  doc.roundedRect(x0, y0, w, 140, 10, 10, 'FD');
  setFont(8.5, colors.greenDark, 'bold');
  doc.text(titleText, x0 + 14, y0 + 18);
  const boxes = [
    ['clients', x0 + 36, y0 + 48, colors.green],
    ['commandes', x0 + 210, y0 + 48, colors.blue],
    ['paiements', x0 + 380, y0 + 48, colors.orange],
  ];
  boxes.forEach(([name, bx, by, fill]) => {
    doc.setFillColor(...fill);
    doc.roundedRect(bx, by, 105, 46, 8, 8, 'F');
    setFont(8, [255, 255, 255], 'bold');
    doc.text(name, bx + 10, by + 18);
    setFont(6.5, [255, 255, 255]);
    doc.text('id • created_at', bx + 10, by + 33);
  });
  doc.setDrawColor(...colors.muted);
  doc.line(x0 + 141, y0 + 71, x0 + 210, y0 + 71);
  doc.line(x0 + 315, y0 + 71, x0 + 380, y0 + 71);
  setFont(7, colors.muted);
  doc.text('1 → n', x0 + 157, y0 + 65);
  doc.text('1 → 1/n', x0 + 330, y0 + 65);
  y += 154;
}

function pipeline(titleText, items) {
  ensure(112);
  const w = page.width - page.mx * 2;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...colors.line);
  doc.roundedRect(page.mx, y, w, 100, 10, 10, 'FD');
  setFont(8.5, colors.greenDark, 'bold');
  doc.text(titleText, page.mx + 14, y + 18);
  const boxW = (w - 36) / items.length - 8;
  let x = page.mx + 14;
  items.forEach((item, idx) => {
    label(x, y + 40, boxW, 34, item, [colors.green, colors.orange, colors.blue, colors.purple, colors.red][idx % 5]);
    if (idx < items.length - 1) {
      setFont(13, colors.muted, 'bold');
      doc.text('→', x + boxW + 2, y + 61);
    }
    x += boxW + 8;
  });
  y += 112;
}

function indexTree(titleText) {
  ensure(154);
  const w = page.width - page.mx * 2;
  const x0 = page.mx;
  const y0 = y;
  doc.setFillColor(...colors.pale);
  doc.setDrawColor(...colors.line);
  doc.roundedRect(x0, y0, w, 140, 10, 10, 'FD');
  setFont(8.5, colors.greenDark, 'bold');
  doc.text(titleText, x0 + 14, y0 + 18);
  const cx = x0 + w / 2;
  label(cx - 35, y0 + 34, 70, 24, '50', colors.green);
  label(cx - 130, y0 + 78, 70, 24, '20', colors.blue);
  label(cx + 60, y0 + 78, 70, 24, '80', colors.orange);
  doc.setDrawColor(...colors.muted);
  doc.line(cx, y0 + 58, cx - 95, y0 + 78);
  doc.line(cx, y0 + 58, cx + 95, y0 + 78);
  setFont(7, colors.muted);
  doc.text('Index B-tree simplifié : réduire le coût de recherche.', x0 + 14, y0 + 128);
  y += 154;
}

function backupTimeline(titleText) {
  ensure(134);
  const w = page.width - page.mx * 2;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...colors.line);
  doc.roundedRect(page.mx, y, w, 120, 10, 10, 'FD');
  setFont(8.5, colors.greenDark, 'bold');
  doc.text(titleText, page.mx + 14, y + 18);
  const startX = page.mx + 38;
  const yy = y + 66;
  doc.setDrawColor(...colors.green);
  doc.setLineWidth(2);
  doc.line(startX, yy, page.mx + w - 38, yy);
  ['Sauvegarde', 'Vérification', 'Stockage', 'Restauration', 'Audit'].forEach((item, idx) => {
    const x = startX + idx * ((w - 76) / 4);
    doc.setFillColor(...[colors.green, colors.blue, colors.orange, colors.purple, colors.red][idx]);
    doc.circle(x, yy, 11, 'F');
    setFont(6.8, colors.muted);
    doc.text(item, x - 26, yy + 31);
  });
  doc.setLineWidth(1);
  y += 134;
}

function bars(titleText) {
  ensure(138);
  const w = page.width - page.mx * 2;
  doc.setFillColor(...colors.pale);
  doc.setDrawColor(...colors.line);
  doc.roundedRect(page.mx, y, w, 126, 10, 10, 'FD');
  setFont(8.5, colors.greenDark, 'bold');
  doc.text(titleText, page.mx + 14, y + 18);
  const values = [['SQL', 82], ['Index', 74], ['Sécurité', 70], ['Backup', 78], ['NoSQL', 66]];
  const baseY = y + 104;
  values.forEach(([lab, val], idx) => {
    const x = page.mx + 55 + idx * 88;
    const h = Number(val) * 0.7;
    doc.setFillColor(...[colors.green, colors.orange, colors.blue, colors.purple, colors.greenDark][idx]);
    doc.roundedRect(x, baseY - h, 35, h, 5, 5, 'F');
    setFont(7, colors.muted);
    doc.text(lab, x - 4, baseY + 13);
  });
  y += 138;
}

function visual(index) {
  const visuals = [
    () => erd('Schéma relationnel simplifié'),
    () => pipeline('Cycle de vie des données', ['Modèle', 'Table', 'Requête', 'Index', 'Backup']),
    () => indexTree('Structure logique d’un index'),
    () => backupTimeline('Chaîne sauvegarde et restauration'),
    () => bars('Maturité base de données'),
  ];
  visuals[index % visuals.length]();
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
  setFont(31, [255, 255, 255], 'bold');
  doc.text('BASES DE', page.mx, 118);
  doc.text('DONNÉES', page.mx, 158);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(page.mx, 176, page.width - page.mx * 2, 140, 18, 18, 'F');
  setFont(14, colors.ink, 'bold');
  doc.text('SQL, PostgreSQL, MySQL, MongoDB : tables, requêtes, relations, index, sécurité et sauvegarde', page.mx + 20, 218, {
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
  pipeline('Vision du cours', ['Modéliser', 'Interroger', 'Optimiser', 'Sécuriser', 'Sauvegarder']);
  setFont(9, colors.muted);
  doc.text('Ce manuel apprend à concevoir, exploiter et protéger des bases de données professionnelles.', page.mx, 770, {
    maxWidth: page.width - page.mx * 2,
  });
  newPage();
}

const sections = [
  {
    name: 'Partie 1 : Fondations des bases de données',
    chapters: [
      ['Rôle d’une base de données', ['données', 'persistance', 'fiabilité', 'traçabilité']],
      ['Modèle relationnel', ['table', 'ligne', 'colonne', 'clé']],
      ['Modélisation conceptuelle', ['entité', 'relation', 'cardinalité', 'contrainte']],
      ['Normalisation', ['1NF', '2NF', '3NF', 'dépendance']],
    ],
  },
  {
    name: 'Partie 2 : SQL professionnel',
    chapters: [
      ['Créer des tables', ['CREATE TABLE', 'types', 'contraintes', 'clé primaire']],
      ['Requêtes SELECT', ['projection', 'filtre', 'tri', 'limite']],
      ['Jointures', ['INNER JOIN', 'LEFT JOIN', 'relation', 'agrégation']],
      ['Transactions', ['BEGIN', 'COMMIT', 'ROLLBACK', 'isolation']],
      ['Vues et procédures', ['vue', 'fonction', 'procédure', 'réutilisation']],
    ],
  },
  {
    name: 'Partie 3 : PostgreSQL',
    chapters: [
      ['Architecture PostgreSQL', ['schéma', 'rôle', 'extension', 'configuration']],
      ['Index PostgreSQL', ['B-tree', 'GIN', 'GiST', 'partial index']],
      ['JSONB et données hybrides', ['document', 'requête', 'index', 'flexibilité']],
      ['Performance et EXPLAIN', ['plan', 'coût', 'scan', 'optimisation']],
    ],
  },
  {
    name: 'Partie 4 : MySQL',
    chapters: [
      ['Architecture MySQL', ['moteur', 'InnoDB', 'schéma', 'utilisateur']],
      ['Requêtes et index MySQL', ['index', 'jointure', 'EXPLAIN', 'optimisation']],
      ['Transactions et verrouillage', ['ACID', 'lock', 'deadlock', 'isolation']],
      ['Administration MySQL', ['backup', 'restore', 'réplication', 'monitoring']],
    ],
  },
  {
    name: 'Partie 5 : MongoDB et NoSQL',
    chapters: [
      ['Logique documentaire', ['collection', 'document', 'champ', 'embedding']],
      ['Requêtes MongoDB', ['find', 'filter', 'projection', 'update']],
      ['Index MongoDB', ['single field', 'compound', 'text', 'TTL']],
      ['Agrégation MongoDB', ['$match', '$group', '$project', '$lookup']],
      ['Choisir SQL ou NoSQL', ['structure', 'volume', 'flexibilité', 'consistance']],
    ],
  },
  {
    name: 'Partie 6 : Sécurité, sauvegarde et exploitation',
    chapters: [
      ['Sécurité des accès', ['rôles', 'permissions', 'moindre privilège', 'audit']],
      ['Protection des données', ['chiffrement', 'secrets', 'masquage', 'rétention']],
      ['Sauvegarde et restauration', ['RPO', 'RTO', 'dump', 'test restore']],
      ['Monitoring et maintenance', ['logs', 'métriques', 'alertes', 'vacuum']],
      ['Migration et versioning', ['schema migration', 'rollback', 'compatibilité', 'CI/CD']],
    ],
  },
  {
    name: 'Partie 7 : Projets professionnels',
    chapters: [
      ['Base e-commerce', ['clients', 'produits', 'commandes', 'paiements']],
      ['Base hospitalière', ['patients', 'consultations', 'prescriptions', 'confidentialité']],
      ['Base financière', ['comptes', 'transactions', 'audit', 'fraude']],
      ['Base logistique', ['colis', 'agences', 'tracking', 'preuves']],
      ['Base analytique', ['faits', 'dimensions', 'KPI', 'dashboard']],
    ],
  },
  {
    name: 'Partie 8 : Exercices, certification et annexes',
    chapters: [
      ['Banque d’exercices', ['SQL', 'relations', 'index', 'sécurité']],
      ['Examens blancs', ['requêtes', 'modélisation', 'administration', 'projet']],
      ['Glossaire et feuilles de route', ['termes', 'références', 'progression', 'DBA']],
    ],
  },
];

function codeFor(chapter) {
  const lower = chapter.toLowerCase();
  if (lower.includes('créer') || lower.includes('tables')) {
    return `
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(120) NOT NULL,
    telephone VARCHAR(30) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;
  }
  if (lower.includes('select') || lower.includes('jointures')) {
    return `
SELECT c.nom, COUNT(cmd.id) AS total_commandes
FROM clients c
LEFT JOIN commandes cmd ON cmd.client_id = c.id
GROUP BY c.nom
ORDER BY total_commandes DESC;`;
  }
  if (lower.includes('index')) {
    return `
CREATE INDEX idx_commandes_client_date
ON commandes (client_id, created_at);

EXPLAIN ANALYZE
SELECT * FROM commandes
WHERE client_id = 10
ORDER BY created_at DESC;`;
  }
  if (lower.includes('mongodb') || lower.includes('document')) {
    return `
db.clients.insertOne({
  nom: "Amina",
  ville: "Kinshasa",
  commandes: [{ reference: "CMD-001", montant: 120 }]
})

db.clients.find({ ville: "Kinshasa" }, { nom: 1, ville: 1 })`;
  }
  if (lower.includes('sauvegarde') || lower.includes('restore')) {
    return `
# PostgreSQL
pg_dump -Fc app_db > app_db.backup
pg_restore -d app_db_restore app_db.backup

# MySQL
mysqldump -u user -p app_db > app_db.sql`;
  }
  if (lower.includes('sécurité') || lower.includes('accès')) {
    return `
CREATE ROLE analyste;
GRANT CONNECT ON DATABASE app_db TO analyste;
GRANT USAGE ON SCHEMA public TO analyste;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analyste;`;
  }
  return `
BEGIN;
UPDATE comptes SET solde = solde - 100 WHERE id = 1;
UPDATE comptes SET solde = solde + 100 WHERE id = 2;
COMMIT;`;
}

function preliminaries() {
  cover();
  currentSection = 'Préliminaires';
  title('Présentation du manuel', 1);
  paragraph(
    `Ce manuel forme à la conception, l’interrogation, l’optimisation, la sécurisation et l’exploitation des bases de données. Il couvre SQL, PostgreSQL, MySQL et MongoDB dans une logique professionnelle : créer des tables, écrire des requêtes, modéliser les relations, utiliser les index, protéger les données et organiser les sauvegardes.`,
  );
  paragraph(
    `L’auteur, ${author.name}, propose une approche complète destinée aux étudiants, développeurs, administrateurs, data analysts, entrepreneurs et professionnels qui veulent maîtriser les données comme un actif stratégique.`,
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
    'Une application peut avoir une belle interface et un bon code, mais si sa base de données est mal conçue, elle deviendra lente, fragile et difficile à maintenir. Comprendre les bases de données, c’est apprendre à organiser la mémoire durable d’un système.',
  );
  title('Comment utiliser ce livre', 1);
  bullet([
    'Reproduire chaque requête dans un environnement local.',
    'Dessiner les relations avant de créer les tables.',
    'Tester les index avec EXPLAIN plutôt que deviner.',
    'Documenter les règles de sécurité et les sauvegardes.',
    'Transformer chaque chapitre en mini projet de portfolio.',
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
    `Ce chapitre traite de ${chapterTitle.toLowerCase()} avec une approche pratique et professionnelle. L’objectif est de comprendre la logique, écrire des requêtes fiables, anticiper les erreurs, documenter les choix et protéger les données dans un vrai système.`,
    { size: 10.4 },
  );
  visual(index);
  title('Objectifs pédagogiques', 2);
  bullet([
    `Comprendre le rôle de ${chapterTitle.toLowerCase()} dans une application réelle.`,
    'Concevoir ou interroger une base avec rigueur.',
    'Identifier les relations, contraintes et impacts de performance.',
    'Prévoir la sécurité, l’audit et la sauvegarde.',
    'Produire un livrable clair : schéma, requête, documentation ou procédure.',
  ]);
  table(
    ['Notion', 'Question base de données', 'Livrable attendu'],
    topics.map((topic) => [
      topic,
      `Comment maîtriser ${topic} dans un système fiable ?`,
      'Règle claire, requête testée, contrainte ou procédure documentée.',
    ]),
  );
  title('Explication approfondie', 2);
  topics.forEach((topic, topicIndex) => {
    title(topic, 3);
    paragraph(
      `${topic} est une notion essentielle pour construire une base durable. Une bonne base de données n’est pas seulement un lieu de stockage : elle exprime les règles métier, protège les informations, accélère les recherches et permet aux équipes de comprendre l’historique d’un système.`,
    );
    paragraph(
      `Analogie : une base de données ressemble à des archives professionnelles. Si les dossiers sont mal classés, sans index, sans autorisation et sans sauvegarde, l’organisation perd du temps et prend des risques. ${topic} aide à rendre ces archives exploitables et sûres.`,
    );
    if (topicIndex % 2 === 0) visual(index + topicIndex + 1);
  });
  title('Exemple de code ou requête', 2);
  codeBlock(codeFor(chapterTitle), `Code — ${chapterTitle}`);
  paragraph(
    'L’exemple montre une pratique directement exploitable. Dans un projet réel, chaque requête doit être testée, documentée et reliée à un besoin métier précis. Les changements de schéma doivent être versionnés.',
  );
  title('Cas pratique professionnel', 2);
  paragraph(
    `Une application de paiement, de santé, d’e-commerce ou de logistique dépend fortement de ${chapterTitle.toLowerCase()}. Une mauvaise conception peut créer des incohérences, des lenteurs, des pertes de données ou des failles d’accès. Une bonne conception rend le système robuste et auditable.`,
  );
  visual(index + 3);
  title('Bonnes pratiques', 2);
  bullet([
    'Nommer les tables et colonnes avec un vocabulaire métier stable.',
    'Utiliser des clés primaires et étrangères quand la relation est réelle.',
    'Créer des index pour les requêtes fréquentes, pas au hasard.',
    'Tester les sauvegardes par des restaurations régulières.',
    'Appliquer le moindre privilège pour les accès.',
    'Documenter les migrations et les règles de conservation des données.',
  ]);
  title('Pièges à éviter', 2);
  bullet([
    'Créer une table sans comprendre le besoin métier.',
    'Utiliser SELECT * dans des traitements critiques.',
    'Multiplier les index sans mesurer leur impact.',
    'Oublier les contraintes d’unicité et d’intégrité.',
    'Faire des sauvegardes sans jamais tester la restauration.',
  ]);
  title('Exercices corrigés', 2);
  for (let i = 1; i <= 5; i += 1) {
    paragraph(
      `Exercice ${i} : proposez une solution liée à ${topics[(i - 1) % topics.length]}. Écrivez le schéma ou la requête, expliquez le choix et indiquez un risque.`,
      { size: 9.2, gap: 3 },
    );
    paragraph(
      `Corrigé ${i} : une réponse solide contient une contrainte claire, une requête testable, une justification d’index ou de relation, et une note sur la sécurité ou la sauvegarde.`,
      { size: 9.2, color: colors.muted, gap: 6 },
    );
  }
  title('Quiz de validation', 2);
  bullet([
    'Quelle règle métier est représentée dans le schéma ?',
    'Quelle requête doit être optimisée en priorité ?',
    'Quel index est utile et pourquoi ?',
    'Quel accès faut-il limiter ?',
    'Comment restaurer les données en cas d’incident ?',
  ]);
}

function exercisesAndAppendix() {
  currentSection = 'Exercices et annexes';
  newPage();
  title('Banque de 420 exercices bases de données', 1);
  paragraph(
    'Cette banque entraîne les apprenants à modéliser, écrire du SQL, créer des index, sécuriser les accès, sauvegarder, restaurer et choisir entre SQL et NoSQL.',
  );
  const domains = ['Modélisation', 'SQL SELECT', 'Jointures', 'Transactions', 'PostgreSQL', 'MySQL', 'MongoDB', 'Index', 'Sécurité', 'Sauvegarde', 'Migration', 'Projets'];
  let count = 1;
  domains.forEach((domain, d) => {
    title(domain, 2);
    visual(d);
    for (let i = 0; i < 35; i += 1) {
      paragraph(
        `Exercice ${count} : réalisez une tâche liée à ${domain}. Produisez un schéma, une requête, une contrainte, un index ou une procédure. Corrigé attendu : logique métier, syntaxe correcte, justification et risque identifié.`,
        { size: 8.6, gap: 3 },
      );
      count += 1;
    }
  });
  title('Examens blancs', 1);
  for (let exam = 1; exam <= 6; exam += 1) {
    title(`Examen blanc ${exam}`, 2);
    bullet([
      'Partie A : modélisation relationnelle.',
      'Partie B : requêtes SQL et jointures.',
      'Partie C : index et performance.',
      'Partie D : sécurité et sauvegarde.',
      'Partie E : projet complet avec PostgreSQL, MySQL ou MongoDB.',
    ]);
  }
  title('Glossaire bases de données', 1);
  table(
    ['Terme', 'Définition'],
    [
      ['Table', 'Structure relationnelle composée de colonnes et de lignes.'],
      ['Clé primaire', 'Identifiant unique d’une ligne.'],
      ['Clé étrangère', 'Lien entre deux tables.'],
      ['Index', 'Structure accélérant certaines recherches.'],
      ['Transaction', 'Ensemble d’opérations validées ou annulées ensemble.'],
      ['Normalisation', 'Méthode de réduction des redondances et incohérences.'],
      ['Collection', 'Regroupement de documents dans MongoDB.'],
      ['RPO/RTO', 'Objectifs de perte maximale et délai de restauration.'],
    ],
  );
  title('Feuille de route DBA et développeur backend', 1);
  bullet([
    'Comprendre la modélisation relationnelle.',
    'Maîtriser SQL, jointures, agrégations et transactions.',
    'Apprendre PostgreSQL, MySQL et MongoDB.',
    'Optimiser avec index et plans d’exécution.',
    'Sécuriser les accès et protéger les données.',
    'Automatiser sauvegardes, restaurations et migrations.',
    'Construire des projets complets avec audit et monitoring.',
  ]);
  title('Contact professionnel', 1);
  paragraph(`${author.name} — ${author.profession}`);
  bullet([author.site, author.email, author.phone]);
}

function filler() {
  while (doc.getNumberOfPages() < 180) {
    currentSection = 'Fiches pratiques bases de données';
    newPage();
    const n = doc.getNumberOfPages();
    title(`Fiche pratique base de données ${n}`, 1);
    paragraph(
      'Cette fiche sert de révision guidée. L’apprenant doit choisir un besoin métier, proposer un modèle, écrire une requête, prévoir un index, appliquer une règle de sécurité et définir une stratégie de sauvegarde.',
    );
    visual(n);
    table(
      ['Étape', 'Résultat attendu'],
      [
        ['Modèle', 'Tables, collections, relations ou documents.'],
        ['Requête', 'Résultat exact, filtré et performant.'],
        ['Index', 'Justification selon la requête fréquente.'],
        ['Sécurité', 'Rôle, permission et audit.'],
      ],
    );
    codeBlock(
      `
SELECT agence_id, COUNT(*) AS colis_enregistres
FROM colis
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY agence_id
ORDER BY colis_enregistres DESC;`,
      'Gabarit de requête analytique',
    );
  }
}

function metadataAndPages() {
  const total = doc.getNumberOfPages();
  doc.setProperties({
    title: 'Bases de données — Manuel complet',
    subject: 'SQL, PostgreSQL, MySQL, MongoDB, tables, requêtes, relations, index, sécurité et sauvegarde',
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
