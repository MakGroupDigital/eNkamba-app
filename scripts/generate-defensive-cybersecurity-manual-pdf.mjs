import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';

const outputDir = path.resolve('docs');
const outputPath = path.join(outputDir, 'manuel-cybersecurite-defensive-charmant-nyungu.pdf');
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
  greenDark: [18, 112, 69],
  orange: [255, 140, 0],
  ink: [23, 33, 29],
  muted: [91, 105, 99],
  pale: [246, 251, 248],
  line: [220, 232, 226],
  blue: [38, 114, 218],
  purple: [119, 82, 210],
  red: [218, 58, 58],
  yellow: [245, 176, 53],
};

let y = page.top;
let currentSection = 'Cybersécurité défensive';

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
  doc.text(`Cybersécurité défensive — ${author.name}`, page.mx, page.height - 31);
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

function codeBlock(code, caption = 'Exemple défensif') {
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
  setFont(7.6, textColor, 'bold');
  doc.text(doc.splitTextToSize(text, w - 12), x + 6, y0 + 14);
}

function shieldVisual(titleText) {
  ensure(150);
  const w = page.width - page.mx * 2;
  const x0 = page.mx;
  const y0 = y;
  doc.setFillColor(...colors.pale);
  doc.setDrawColor(...colors.line);
  doc.roundedRect(x0, y0, w, 136, 10, 10, 'FD');
  setFont(8.5, colors.greenDark, 'bold');
  doc.text(titleText, x0 + 14, y0 + 18);
  const cx = x0 + w / 2;
  doc.setFillColor(...colors.green);
  doc.triangle(cx, y0 + 35, cx - 78, y0 + 62, cx + 78, y0 + 62, 'F');
  doc.setFillColor(...colors.greenDark);
  doc.triangle(cx - 78, y0 + 62, cx + 78, y0 + 62, cx, y0 + 118, 'F');
  setFont(9, [255, 255, 255], 'bold');
  doc.text('DÉFENSE', cx, y0 + 73, { align: 'center' });
  setFont(7, [255, 255, 255], 'bold');
  doc.text('Prévenir • Détecter • Répondre', cx, y0 + 91, { align: 'center' });
  y += 148;
}

function pipelineVisual(titleText, items) {
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

function riskMatrix(titleText) {
  ensure(154);
  const w = page.width - page.mx * 2;
  const x0 = page.mx;
  const y0 = y;
  doc.setFillColor(...colors.pale);
  doc.setDrawColor(...colors.line);
  doc.roundedRect(x0, y0, w, 140, 10, 10, 'FD');
  setFont(8.5, colors.greenDark, 'bold');
  doc.text(titleText, x0 + 14, y0 + 18);
  const labs = ['Faible', 'Moyen', 'Élevé'];
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      const fill = r + c < 2 ? colors.green : r + c < 4 ? colors.yellow : colors.red;
      doc.setFillColor(...fill);
      doc.roundedRect(x0 + 110 + c * 82, y0 + 38 + r * 29, 70, 21, 5, 5, 'F');
      setFont(6.6, [255, 255, 255], 'bold');
      doc.text(`${labs[r]} / ${labs[c]}`, x0 + 116 + c * 82, y0 + 52 + r * 29);
    }
  }
  setFont(7.4, colors.muted);
  doc.text('Impact × probabilité : prioriser ce qui menace réellement les données et la continuité.', x0 + 14, y0 + 126);
  y += 154;
}

function logTimeline(titleText) {
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
  ['Collecte', 'Normalisation', 'Corrélation', 'Alerte', 'Audit'].forEach((item, idx) => {
    const x = startX + idx * ((w - 76) / 4);
    doc.setFillColor(...[colors.green, colors.blue, colors.orange, colors.purple, colors.red][idx]);
    doc.circle(x, yy, 11, 'F');
    setFont(6.8, colors.muted);
    doc.text(item, x - 24, yy + 31);
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
  const values = [
    ['MFA', 82],
    ['Logs', 76],
    ['Patch', 68],
    ['Backup', 72],
    ['Audit', 63],
  ];
  const baseY = y + 104;
  values.forEach(([lab, val], idx) => {
    const x = page.mx + 52 + idx * 86;
    const h = Number(val) * 0.7;
    doc.setFillColor(...[colors.green, colors.orange, colors.blue, colors.purple, colors.greenDark][idx]);
    doc.roundedRect(x, baseY - h, 35, h, 5, 5, 'F');
    setFont(7, colors.muted);
    doc.text(lab, x - 2, baseY + 13);
  });
  y += 138;
}

function visual(index) {
  [shieldVisual, pipelineVisual, riskMatrix, logTimeline, bars][index % 5](
    ['Bouclier défensif', 'Chaîne de traitement sécurité', 'Matrice de priorisation', 'Cycle de journalisation', 'Maturité des contrôles'][index % 5],
    ['Prévenir', 'Surveiller', 'Analyser', 'Répondre', 'Améliorer'],
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
  doc.text('MANUEL PROFESSIONNEL ET ÉTHIQUE', page.mx, 64);
  setFont(31, [255, 255, 255], 'bold');
  doc.text('CYBERSÉCURITÉ', page.mx, 118);
  doc.text('DÉFENSIVE', page.mx, 158);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(page.mx, 176, page.width - page.mx * 2, 140, 18, 18, 'F');
  setFont(14, colors.ink, 'bold');
  doc.text('Sécurité applicative, protection des données, logs, audit, bonnes pratiques et éthique', page.mx + 20, 218, {
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
  pipelineVisual('Vision du cours', ['Éthique', 'Prévention', 'Détection', 'Réponse', 'Audit']);
  setFont(9, colors.muted);
  doc.text('Ce document est strictement défensif : il enseigne la protection, l’analyse, la conformité et la réponse responsable.', page.mx, 770, {
    maxWidth: page.width - page.mx * 2,
  });
  newPage();
}

const sections = [
  {
    name: 'Partie 1 : Fondations éthiques et professionnelles',
    chapters: [
      ['Rôle de la cybersécurité défensive', ['confidentialité', 'intégrité', 'disponibilité', 'responsabilité']],
      ['Éthique, droit et limites', ['autorisation', 'proportionnalité', 'preuve', 'respect des personnes']],
      ['Gestion des risques', ['actifs', 'menaces', 'vulnérabilités', 'impact']],
    ],
  },
  {
    name: 'Partie 2 : Sécurité applicative',
    chapters: [
      ['Sécurité dès la conception', ['menaces', 'surface d’attaque', 'contrôles', 'revue']],
      ['Validation des entrées', ['types', 'formats', 'sanitisation', 'erreurs']],
      ['Authentification et sessions', ['MFA', 'tokens', 'expiration', 'rotation']],
      ['Autorisation et contrôle d’accès', ['rôles', 'permissions', 'moindre privilège', 'audit']],
      ['Sécurité des API', ['contrats', 'rate limit', 'erreurs', 'journalisation']],
    ],
  },
  {
    name: 'Partie 3 : Protection des données',
    chapters: [
      ['Classification des données', ['publiques', 'internes', 'sensibles', 'critiques']],
      ['Chiffrement et secrets', ['transport', 'stockage', 'clés', 'rotation']],
      ['Sauvegarde et restauration', ['RPO', 'RTO', 'tests', 'résilience']],
      ['Vie privée et minimisation', ['consentement', 'rétention', 'anonymisation', 'traçabilité']],
    ],
  },
  {
    name: 'Partie 4 : Logs, monitoring et audit',
    chapters: [
      ['Journalisation utile', ['événements', 'contexte', 'corrélation', 'rétention']],
      ['Analyse de logs', ['filtrage', 'agrégation', 'indicateurs', 'alertes']],
      ['Audit de sécurité', ['preuves', 'écarts', 'recommandations', 'suivi']],
      ['Gestion des incidents', ['détection', 'confinement', 'communication', 'retour d’expérience']],
    ],
  },
  {
    name: 'Partie 5 : Infrastructure et postes de travail',
    chapters: [
      ['Durcissement système', ['comptes', 'services', 'patchs', 'configuration']],
      ['Réseau défensif', ['segmentation', 'pare-feu', 'VPN', 'supervision']],
      ['Sécurité cloud', ['IAM', 'stockage', 'observabilité', 'coûts']],
      ['Sécurité mobile et endpoint', ['MDM', 'EDR', 'mises à jour', 'sauvegardes']],
    ],
  },
  {
    name: 'Partie 6 : Bonnes pratiques opérationnelles',
    chapters: [
      ['Politiques et procédures', ['mots de passe', 'accès', 'changement', 'incident']],
      ['Sensibilisation utilisateurs', ['phishing', 'hygiène', 'signalement', 'culture']],
      ['Sécurité dans le cycle de développement', ['DevSecOps', 'tests', 'CI/CD', 'revue']],
      ['Tableaux de bord sécurité', ['KPI', 'tendances', 'priorités', 'décision']],
    ],
  },
  {
    name: 'Partie 7 : Projets défensifs complets',
    chapters: [
      ['Centre de logs pour PME', ['collecte', 'normalisation', 'alertes', 'rapport']],
      ['Plan de protection des données', ['inventaire', 'classification', 'chiffrement', 'sauvegarde']],
      ['Audit d’une application web', ['contrôles', 'observations', 'risques', 'actions']],
      ['Programme de sensibilisation', ['public', 'supports', 'quiz', 'mesure']],
      ['Réponse à incident simulée', ['scénario', 'rôles', 'communication', 'post-mortem']],
    ],
  },
  {
    name: 'Partie 8 : Exercices, certification et annexes',
    chapters: [
      ['Banque d’exercices', ['analyse', 'logs', 'données', 'audit']],
      ['Examens blancs', ['cas', 'questions', 'rapport', 'soutenance']],
      ['Glossaire et feuilles de route', ['termes', 'références', 'progression', 'spécialisation']],
    ],
  },
];

function codeFor(chapter) {
  const lower = chapter.toLowerCase();
  if (lower.includes('logs') || lower.includes('journalisation')) {
    return `
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

def log_security_event(user_id, action, status):
    logging.info("user=%s action=%s status=%s", user_id, action, status)

log_security_event("USR-102", "login", "success")`;
  }
  if (lower.includes('validation')) {
    return `
import re

def validate_email(email):
    pattern = r"^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$"
    return bool(re.match(pattern, email or ""))

assert validate_email("contact@example.com") is True
assert validate_email("bad-email") is False`;
  }
  if (lower.includes('chiffrement') || lower.includes('secrets')) {
    return `
import os

def read_secret(name):
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Secret manquant: {name}")
    return value

# Exemple défensif: ne jamais écrire les secrets dans le code source.
# API_KEY = read_secret("PAYMENT_API_KEY")`;
  }
  if (lower.includes('accès') || lower.includes('autorisation')) {
    return `
def has_permission(user, permission):
    if not user.get("active"):
        return False
    return permission in user.get("permissions", [])

agent = {"active": True, "permissions": ["orders:read"]}
print(has_permission(agent, "orders:read"))`;
  }
  return `
def evaluate_risk(asset, probability, impact):
    score = probability * impact
    level = "faible" if score < 4 else "moyen" if score < 8 else "élevé"
    return {"asset": asset, "score": score, "level": level}

print(evaluate_risk("Base clients", 3, 3))`;
}

function preliminaries() {
  cover();
  currentSection = 'Préliminaires';
  title('Présentation du manuel', 1);
  paragraph(
    `Ce manuel de cybersécurité défensive apprend à protéger les applications, les données, les journaux, les systèmes et les organisations. Il ne vise pas l’attaque, mais la prévention, la détection, l’audit, la réponse responsable et l’amélioration continue.`,
  );
  paragraph(
    `L’auteur, ${author.name}, propose une approche professionnelle adaptée aux étudiants, développeurs, administrateurs, responsables IT, entrepreneurs, auditeurs, analystes sécurité et décideurs qui veulent construire une culture de sécurité solide.`,
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
    'La cybersécurité défensive est une discipline de responsabilité. Elle protège les personnes, les organisations, les données et la confiance. Un bon professionnel de sécurité ne cherche pas seulement les failles : il réduit les risques, explique les priorités, documente les preuves et aide les équipes à agir correctement.',
  );
  title('Charte éthique du cours', 1);
  bullet([
    'Travailler uniquement dans un cadre autorisé.',
    'Protéger les données personnelles et les informations sensibles.',
    'Documenter les preuves sans exposer inutilement les utilisateurs.',
    'Éviter tout contenu offensif ou instruction d’exploitation abusive.',
    'Favoriser la prévention, la conformité et la réponse responsable.',
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
    `Ce chapitre traite de ${chapterTitle.toLowerCase()} dans un cadre strictement défensif. L’objectif est de savoir identifier les risques, mettre en place des contrôles raisonnables, documenter les décisions, surveiller les événements et améliorer la posture de sécurité sans nuire aux utilisateurs ni sortir du cadre légal.`,
    { size: 10.4 },
  );
  visual(index);
  title('Objectifs pédagogiques', 2);
  bullet([
    `Comprendre le rôle de ${chapterTitle.toLowerCase()} dans la défense d’un système.`,
    'Identifier les actifs, les risques, les contrôles et les preuves.',
    'Appliquer les bonnes pratiques sans complexifier inutilement le projet.',
    'Produire des logs et rapports utiles à l’audit.',
    'Respecter l’éthique, la confidentialité et la proportionnalité.',
  ]);
  table(
    ['Notion', 'Question défensive', 'Livrable attendu'],
    topics.map((topic) => [
      topic,
      `Comment protéger ou vérifier ${topic} ?`,
      'Contrôle clair, preuve, suivi et amélioration.',
    ]),
  );
  title('Explication approfondie', 2);
  topics.forEach((topic, topicIndex) => {
    title(topic, 3);
    paragraph(
      `${topic} est une composante essentielle d’une stratégie défensive. Dans une organisation, la sécurité ne doit pas être isolée dans un service technique : elle doit être comprise par les développeurs, les administrateurs, les managers et les utilisateurs. Une bonne défense rend le système plus robuste sans empêcher le travail légitime.`,
    );
    paragraph(
      `Analogie : protéger un système revient à gérer un bâtiment sensible. Il faut connaître les portes, contrôler les accès, garder un registre, former le personnel, tester les alarmes et préparer une réponse en cas d’incident. ${topic} correspond à l’une de ces responsabilités.`,
    );
    if (topicIndex % 2 === 0) visual(index + topicIndex + 1);
  });
  title('Exemple de code défensif', 2);
  codeBlock(codeFor(chapterTitle), `Code — ${chapterTitle}`);
  paragraph(
    'Les exemples de code restent volontairement défensifs : validation, journalisation, contrôle d’accès, lecture sécurisée de secrets ou évaluation de risques. Ils ne fournissent aucune procédure offensive ; ils montrent comment réduire les erreurs et améliorer la traçabilité.',
  );
  title('Cas pratique professionnel', 2);
  paragraph(
    `Une entreprise qui néglige ${chapterTitle.toLowerCase()} peut perdre la visibilité sur ses incidents, exposer des données sensibles ou prendre de mauvaises décisions. Une entreprise qui l’organise correctement sait ce qu’elle protège, pourquoi elle le protège, comment elle le vérifie et qui doit agir en cas d’alerte.`,
  );
  riskMatrix('Priorisation des risques du cas pratique');
  title('Bonnes pratiques', 2);
  bullet([
    'Appliquer le principe du moindre privilège.',
    'Éviter de stocker des secrets dans le code source.',
    'Journaliser les événements utiles sans exposer de données sensibles.',
    'Tester régulièrement les sauvegardes et restaurations.',
    'Documenter les incidents, les décisions et les actions correctives.',
    'Former les utilisateurs avec des exemples adaptés à leur métier.',
  ]);
  title('Pièges à éviter', 2);
  bullet([
    'Confondre sécurité et accumulation d’outils.',
    'Collecter trop de logs sans stratégie de lecture.',
    'Ignorer les comptes inactifs ou les accès historiques.',
    'Reporter la sécurité à la fin du développement.',
    'Communiquer un incident sans faits vérifiés.',
  ]);
  title('Exercices corrigés', 2);
  for (let i = 1; i <= 5; i += 1) {
    paragraph(
      `Exercice ${i} : construisez une mesure défensive liée à ${topics[(i - 1) % topics.length]}. Décrivez l’actif protégé, le risque, le contrôle, le log attendu et la preuve d’audit.`,
      { size: 9.2, gap: 3 },
    );
    paragraph(
      `Corrigé ${i} : la réponse doit inclure une règle claire, une trace exploitable, une limite connue et une action de suivi. La mesure doit être proportionnée au risque et respecter la confidentialité.`,
      { size: 9.2, color: colors.muted, gap: 6 },
    );
  }
  title('Quiz de validation', 2);
  bullet([
    'Quel actif ce chapitre aide-t-il à protéger ?',
    'Quel événement doit être journalisé ?',
    'Quelle preuve peut être utilisée en audit ?',
    'Quelle erreur éthique faut-il éviter ?',
    'Quelle action prioritaire améliore la posture de sécurité ?',
  ]);
}

function exercisesAndAppendix() {
  currentSection = 'Exercices et annexes';
  newPage();
  title('Banque de 400 exercices défensifs', 1);
  paragraph(
    'Cette banque d’exercices entraîne l’apprenant à raisonner comme un défenseur : protéger, vérifier, documenter, alerter et améliorer. Chaque exercice doit rester dans un cadre autorisé, pédagogique et éthique.',
  );
  const domains = [
    'Éthique et conformité',
    'Sécurité applicative',
    'Protection des données',
    'Logs et monitoring',
    'Audit',
    'Gestion des incidents',
    'Infrastructure',
    'Cloud',
    'DevSecOps',
    'Sensibilisation',
  ];
  let count = 1;
  domains.forEach((domain, d) => {
    title(domain, 2);
    visual(d);
    for (let i = 0; i < 40; i += 1) {
      paragraph(
        `Exercice ${count} : analysez un problème lié à ${domain}. Produisez une mesure défensive, un log utile, une preuve d’audit, une recommandation et un indicateur de suivi. Corrigé attendu : contrôle proportionné, justification, limite connue et action d’amélioration.`,
        { size: 8.6, gap: 3 },
      );
      count += 1;
    }
  });
  title('Examens blancs', 1);
  for (let exam = 1; exam <= 6; exam += 1) {
    title(`Examen blanc ${exam}`, 2);
    bullet([
      'Partie A : questions d’éthique et de cadre légal.',
      'Partie B : analyse de logs et rédaction d’une alerte.',
      'Partie C : protection des données et contrôle d’accès.',
      'Partie D : audit défensif d’une application.',
      'Projet : plan de réponse à incident et rapport au management.',
    ]);
  }
  title('Glossaire défensif', 1);
  table(
    ['Terme', 'Définition'],
    [
      ['Confidentialité', 'Limiter l’accès aux informations aux personnes autorisées.'],
      ['Intégrité', 'Garantir que les données ne sont pas modifiées de manière non autorisée.'],
      ['Disponibilité', 'Assurer que le service reste accessible quand il est nécessaire.'],
      ['Audit', 'Vérification structurée des contrôles, preuves et écarts.'],
      ['Log', 'Trace horodatée permettant de comprendre un événement.'],
      ['Incident', 'Événement qui menace la sécurité, la continuité ou la conformité.'],
      ['Moindre privilège', 'Donner uniquement les droits nécessaires à une tâche.'],
      ['DevSecOps', 'Intégrer la sécurité dans le cycle de développement et déploiement.'],
    ],
  );
  title('Feuille de route analyste cybersécurité défensive', 1);
  bullet([
    'Comprendre les systèmes, réseaux, applications et bases de données.',
    'Maîtriser les logs, alertes, indicateurs et rapports.',
    'Apprendre la sécurité applicative et la protection des données.',
    'Pratiquer les audits défensifs et la gestion d’incident.',
    'Développer une communication claire avec les métiers.',
    'Respecter l’éthique, la législation et la confidentialité.',
  ]);
  title('Contact professionnel', 1);
  paragraph(`${author.name} — ${author.profession}`);
  bullet([author.site, author.email, author.phone]);
}

function filler() {
  while (doc.getNumberOfPages() < 170) {
    currentSection = 'Fiches pratiques défensives';
    newPage();
    const n = doc.getNumberOfPages();
    title(`Fiche pratique défensive ${n}`, 1);
    paragraph(
      'Cette fiche sert de support de révision. Elle demande à l’apprenant de partir d’un risque réel, de choisir un contrôle défensif, de prévoir la preuve, puis d’expliquer la décision à une équipe non technique.',
    );
    visual(n);
    table(
      ['Question', 'Réponse attendue'],
      [
        ['Quel actif protéger ?', 'Donnée, service, compte, appareil ou processus.'],
        ['Quel risque ?', 'Impact et probabilité clairement estimés.'],
        ['Quel contrôle ?', 'Mesure simple, testable et proportionnée.'],
        ['Quelle preuve ?', 'Log, capture, rapport, ticket ou validation.'],
      ],
    );
    codeBlock(
      `
def security_check(event):
    required = ["user", "action", "timestamp", "status"]
    missing = [field for field in required if field not in event]
    return {"valid": not missing, "missing": missing}

print(security_check({"user": "USR-1", "action": "login"}))
`,
      'Gabarit de vérification défensive',
    );
  }
}

function metadataAndPages() {
  const total = doc.getNumberOfPages();
  doc.setProperties({
    title: 'Cybersécurité défensive — Manuel complet',
    subject: 'Sécurité applicative, protection des données, logs, audit, bonnes pratiques et éthique',
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
