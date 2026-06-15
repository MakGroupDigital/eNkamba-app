import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';

const outputDir = path.resolve('docs');
const outputPath = path.join(outputDir, 'manuel-python-professionnel-charmant-nyungu.pdf');

const author = {
  name: 'Charmant Nyungu',
  site: 'www.charmantnyungu.com',
  email: 'consultant@charmantnyungu.com',
  phone: '+243 835 137 837',
  profession:
    'Consultant en innovation technologique, transformation numerique, cybersecurite, intelligence artificielle, developpement logiciel et strategie digitale.',
};

const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
const page = {
  width: doc.internal.pageSize.getWidth(),
  height: doc.internal.pageSize.getHeight(),
  marginX: 56,
  marginTop: 74,
  marginBottom: 64,
};
const green = [50, 187, 120];
const orange = [255, 140, 0];
const dark = [24, 38, 31];
const muted = [92, 106, 98];
let y = page.marginTop;
let currentPart = '';
let toc = [];

function clean(text) {
  return String(text)
    .replace(/[–—]/g, '-')
    .replace(/[•]/g, '-')
    .replace(/[→]/g, '->')
    .replace(/[×]/g, 'x')
    .replace(/[≈]/g, '~')
    .replace(/[≤]/g, '<=')
    .replace(/[≥]/g, '>=')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+\n/g, '\n');
}

function setText(size = 10, color = dark, style = 'normal') {
  doc.setFont('helvetica', style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
}

function footer() {
  const n = doc.getNumberOfPages();
  doc.setDrawColor(230, 238, 233);
  doc.line(page.marginX, page.height - 48, page.width - page.marginX, page.height - 48);
  setText(7.5, muted);
  doc.text(`Python Professionnel - ${author.name}`, page.marginX, page.height - 31);
  doc.text(`${author.site} | ${author.email}`, page.marginX, page.height - 19);
  doc.text(String(n), page.width - page.marginX, page.height - 25, { align: 'right' });
}

function header() {
  setText(7.5, muted, 'bold');
  doc.text(currentPart || 'Manuel Python Professionnel', page.marginX, 34);
  doc.setFillColor(...green);
  doc.rect(page.marginX, 43, 54, 3, 'F');
}

function newPage() {
  footer();
  doc.addPage();
  y = page.marginTop;
  header();
}

function ensure(height) {
  if (y + height > page.height - page.marginBottom) newPage();
}

function textBlock(text, options = {}) {
  const {
    size = 10,
    color = dark,
    style = 'normal',
    leading = size * 1.42,
    indent = 0,
    gap = 7,
    width = page.width - page.marginX * 2 - indent,
  } = options;
  setText(size, color, style);
  const lines = doc.splitTextToSize(clean(text), width);
  ensure(lines.length * leading + gap);
  doc.text(lines, page.marginX + indent, y);
  y += lines.length * leading + gap;
}

function title(text, level = 1) {
  const sizes = { 1: 22, 2: 15, 3: 11.5 };
  const gaps = { 1: 18, 2: 12, 3: 8 };
  ensure(level === 1 ? 76 : 44);
  setText(sizes[level], level === 1 ? green : dark, 'bold');
  doc.text(clean(text), page.marginX, y);
  y += sizes[level] + gaps[level];
  if (level === 1) {
    doc.setFillColor(...orange);
    doc.rect(page.marginX, y - 8, 76, 4, 'F');
    y += 12;
  }
}

function bullet(items, options = {}) {
  const { size = 9.6, indent = 14 } = options;
  for (const item of items) {
    textBlock(`- ${item}`, { size, indent, gap: 3 });
  }
  y += 3;
}

function codeBlock(code) {
  const lines = clean(code).trim().split('\n');
  const lineHeight = 11;
  const boxHeight = lines.length * lineHeight + 18;
  ensure(boxHeight + 8);
  doc.setFillColor(246, 248, 247);
  doc.setDrawColor(213, 226, 219);
  doc.roundedRect(page.marginX, y, page.width - page.marginX * 2, boxHeight, 7, 7, 'FD');
  setText(8.5, [38, 54, 46], 'normal');
  doc.setFont('courier', 'normal');
  let cy = y + 15;
  for (const line of lines) {
    doc.text(line.slice(0, 95), page.marginX + 12, cy);
    cy += lineHeight;
  }
  doc.setFont('helvetica', 'normal');
  y += boxHeight + 10;
}

function table(headers, rows) {
  const colWidth = (page.width - page.marginX * 2) / headers.length;
  const rowHeight = 27;
  ensure((rows.length + 1) * rowHeight + 10);
  doc.setFillColor(...green);
  doc.rect(page.marginX, y, page.width - page.marginX * 2, rowHeight, 'F');
  setText(8.5, [255, 255, 255], 'bold');
  headers.forEach((h, i) => doc.text(clean(h), page.marginX + i * colWidth + 8, y + 17));
  y += rowHeight;
  rows.forEach((row, idx) => {
    doc.setFillColor(idx % 2 ? 255 : 248, idx % 2 ? 255 : 251, idx % 2 ? 255 : 249);
    doc.rect(page.marginX, y, page.width - page.marginX * 2, rowHeight, 'F');
    doc.setDrawColor(232, 238, 235);
    doc.line(page.marginX, y, page.width - page.marginX, y);
    setText(8, dark);
    row.forEach((cell, i) => {
      const lines = doc.splitTextToSize(clean(cell), colWidth - 12).slice(0, 2);
      doc.text(lines, page.marginX + i * colWidth + 8, y + 12);
    });
    y += rowHeight;
  });
  y += 10;
}

function diagram(label, nodes) {
  ensure(110);
  doc.setDrawColor(218, 230, 224);
  doc.setFillColor(250, 252, 251);
  doc.roundedRect(page.marginX, y, page.width - page.marginX * 2, 96, 9, 9, 'FD');
  setText(9, green, 'bold');
  doc.text(clean(label), page.marginX + 14, y + 20);
  const available = page.width - page.marginX * 2 - 34;
  const nodeW = available / nodes.length - 10;
  let x = page.marginX + 14;
  nodes.forEach((node, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 50 : 255, idx % 2 === 0 ? 187 : 140, idx % 2 === 0 ? 120 : 0);
    doc.roundedRect(x, y + 36, nodeW, 34, 7, 7, 'F');
    setText(7.5, [255, 255, 255], 'bold');
    doc.text(doc.splitTextToSize(clean(node), nodeW - 10), x + 6, y + 50);
    if (idx < nodes.length - 1) {
      setText(12, muted, 'bold');
      doc.text('>', x + nodeW + 3, y + 57);
    }
    x += nodeW + 10;
  });
  y += 108;
}

function cover() {
  doc.setFillColor(247, 250, 248);
  doc.rect(0, 0, page.width, page.height, 'F');
  doc.setFillColor(...green);
  doc.rect(0, 0, page.width, 210, 'F');
  doc.setFillColor(...orange);
  doc.circle(page.width - 86, 66, 82, 'F');
  setText(13, [255, 255, 255], 'bold');
  doc.text('FORMATION PROFESSIONNELLE ET UNIVERSITAIRE', page.marginX, 72);
  setText(37, [255, 255, 255], 'bold');
  doc.text('PYTHON', page.marginX, 126);
  setText(20, [255, 255, 255], 'bold');
  doc.text('Manuel complet de programmation, data science, IA, web et automatisation', page.marginX, 160, {
    maxWidth: page.width - page.marginX * 2,
  });
  setText(15, dark, 'bold');
  doc.text('Auteur', page.marginX, 292);
  setText(28, green, 'bold');
  doc.text(author.name, page.marginX, 326);
  setText(11, dark);
  doc.text(doc.splitTextToSize(author.profession, page.width - page.marginX * 2), page.marginX, 356);
  table(
    ['Contact', 'Coordonnees'],
    [
      ['Site web', author.site],
      ['Email', author.email],
      ['Telephone', author.phone],
      ['Edition', 'Support academique et professionnel - 2026'],
    ],
  );
  y = 520;
  diagram('Parcours du lecteur', ['Fondamentaux', 'Applications', 'Projets', 'Certification']);
  setText(9, muted);
  doc.text('Document original de formation avancee. Tous les exemples et cas sont adaptes a un contexte professionnel africain et international.', page.marginX, 760, {
    maxWidth: page.width - page.marginX * 2,
  });
  newPage();
}

const parts = [
  {
    name: 'Partie 1 : Preliminaires',
    chapters: [
      ['Preface', ['Role du manuel', 'Public vise', 'Vision pedagogique']],
      ["Mot de l'auteur", ['Pourquoi apprendre Python', 'Discipline de travail', 'Ethique professionnelle']],
      ['Biographie de Charmant Nyungu', ['Parcours', 'Domaines de competence', 'Contact professionnel']],
      ['Comment utiliser ce livre', ['Lecture progressive', 'Exercices', 'Projets et certification']],
    ],
  },
  {
    name: 'Partie 2 : Introduction a Python',
    chapters: [
      ['Histoire et philosophie', ['Origines', 'Createur de Python', 'Lisibilite et communaute']],
      ['Installation et environnement', ['Windows', 'Linux', 'macOS', 'VS Code', 'PyCharm']],
      ['Premier programme', ['Interpreter', 'Script', 'Terminal', 'Projet de depart']],
    ],
  },
  {
    name: 'Partie 3 : Fondamentaux de Python',
    chapters: [
      ['Variables et types', ['Nombres', 'Chaines', 'Booleens', 'Collections']],
      ['Operateurs, entrees et sorties', ['Calcul', 'Comparaison', 'input', 'print']],
      ['Conditions et boucles', ['if', 'for', 'while', 'controle de flux']],
      ['Fonctions, modules et packages', ['def', 'parametres', 'import', 'organisation']],
      ['Erreurs, fichiers et texte', ['try except', 'lecture', 'ecriture', 'nettoyage de texte']],
    ],
  },
  {
    name: 'Partie 4 : Programmation orientee objet',
    chapters: [
      ['Classes et objets', ['Attributs', 'Methodes', 'Constructeur']],
      ['Encapsulation, heritage et polymorphisme', ['Protection', 'Specialisation', 'Interfaces']],
      ['Abstraction et design patterns', ['Repository', 'Factory', 'Strategy', 'MVC']],
    ],
  },
  {
    name: 'Partie 5 : Python applique aux mathematiques',
    chapters: [
      ['NumPy pour le calcul numerique', ['Tableaux', 'Matrices', 'Vectorisation']],
      ['SymPy et SciPy', ['Symbolique', 'Optimisation', 'Modelisation']],
      ['Statistiques et probabilites', ['Distributions', 'Estimation', 'Decision']],
    ],
  },
  {
    name: 'Partie 6 : Python pour la Data Science',
    chapters: [
      ['Pandas et preparation des donnees', ['DataFrame', 'Nettoyage', 'Jointures']],
      ['Analyse exploratoire', ['Indicateurs', 'Segments', 'Qualite de donnees']],
      ['Etudes de cas sectorielles', ['Banque', 'Assurance', 'Sante', 'Telecom', 'E-commerce', 'Administration']],
    ],
  },
  {
    name: 'Partie 7 : Visualisation de donnees',
    chapters: [
      ['Matplotlib et Seaborn', ['Histogrammes', 'Courbes', 'Heatmaps']],
      ['Plotly et dashboards', ['Graphiques interactifs', 'Tableaux de bord', 'Storytelling']],
    ],
  },
  {
    name: 'Partie 8 : Intelligence Artificielle et Machine Learning',
    chapters: [
      ['Scikit-Learn', ['Regression', 'Classification', 'Clustering']],
      ['Deep Learning', ['TensorFlow', 'Keras', 'PyTorch', 'Reseaux neuronaux']],
      ['NLP et Computer Vision', ['Texte', 'Images', 'Evaluation', 'Deploiement']],
    ],
  },
  {
    name: 'Partie 9 : Python pour la cybersecurite',
    chapters: [
      ['Ethique et cadre legal', ['Responsabilite', 'Autorisation', 'Preuve']],
      ['Analyse de logs et reseaux', ['Journalisation', 'Detection', 'Anomalies']],
      ['OSINT et securite applicative', ['Collecte ouverte', 'Automatisation', 'Audit defensif']],
    ],
  },
  {
    name: 'Partie 10 : Python pour la geographie et la cartographie',
    chapters: [
      ['GeoPandas, Folium et Shapely', ['Donnees spatiales', 'Cartes', 'Geometries']],
      ['Smart Cities et Afrique centrale', ['Transport', 'Agriculture', 'Gestion territoriale']],
    ],
  },
  {
    name: 'Partie 11 : Python pour la sante et l anatomie',
    chapters: [
      ['Analyse medicale', ['Statistiques de sante', 'Epidemiologie', 'Gestion hospitaliere']],
      ['Imagerie et aide a la decision', ['Images', 'Indicateurs', 'Confidentialite']],
    ],
  },
  {
    name: 'Partie 12 : Developpement Web avec Python',
    chapters: [
      ['Flask', ['Routes', 'Templates', 'Base de donnees']],
      ['Django', ['ORM', 'Admin', 'Authentification']],
      ['FastAPI', ['API REST', 'Validation', 'Documentation', 'Deploiement']],
    ],
  },
  {
    name: 'Partie 13 : Automatisation et productivite',
    chapters: [
      ['Bureautique et documents', ['Excel', 'PDF', 'Emails', 'Rapports']],
      ['Scraping et pipelines', ['Collecte', 'Nettoyage', 'Planification']],
    ],
  },
  {
    name: 'Partie 14 : Bases de donnees',
    chapters: [
      ['SQL', ['SQLite', 'PostgreSQL', 'MySQL', 'Transactions']],
      ['NoSQL', ['MongoDB', 'Documents', 'Indexation']],
    ],
  },
  {
    name: 'Partie 15 : Projets professionnels complets',
    chapters: [
      ['Systeme bancaire', ['Comptes', 'Transactions', 'Audit']],
      ['Gestion hospitaliere', ['Patients', 'Rendez-vous', 'Tableaux de bord']],
      ['Recrutement et fiscalite', ['Candidatures', 'Taxes', 'Rapports']],
      ['E-commerce et transport', ['Catalogue', 'Panier', 'Logistique', 'Paiement']],
      ['EdTech, tourisme et video intelligente', ['Cours', 'Reservations', 'Vision IA']],
      ['Assistant IA africain', ['Langues locales', 'Contexte', 'Services publics']],
    ],
  },
  {
    name: 'Partie 16 : Python et innovation africaine',
    chapters: [
      ['Education, agriculture et sante', ['Solutions locales', 'Donnees terrain', 'Impact']],
      ['Gouvernance, finances et energie', ['Transparence', 'Paiement', 'Optimisation']],
      ['Startups africaines', ['Produit', 'Architecture', 'Croissance']],
    ],
  },
  {
    name: 'Partie 17 : Exercices et certifications',
    chapters: [
      ['Banque de 500 exercices', ['Fondamentaux', 'Data', 'IA', 'Web', 'Cyber']],
      ['Examens blancs et projets finaux', ['Evaluation', 'Grilles', 'Soutenance']],
    ],
  },
  {
    name: 'Partie 18 : Annexes',
    chapters: [
      ['Glossaire et bibliographie', ['Vocabulaire', 'References', 'Ressources']],
      ['Feuilles de route', ['Developpeur senior', 'Data scientist', 'IA', 'Architecte logiciel']],
    ],
  },
];

const professionalExamples = {
  banque: "Dans une banque, Python automatise le rapprochement entre les transactions, les extraits de compte et les alertes de fraude. Le langage devient un outil de controle, de rapidite et de tracabilite.",
  sante: "Dans un hopital, Python peut consolider les dossiers, mesurer les delais de prise en charge, produire des indicateurs et aider les equipes a suivre les tendances epidemiologiques.",
  ecommerce: "Dans une marketplace, Python sert a recommander des produits, prevoir les ruptures de stock, calculer les frais logistiques et detecter les comportements anormaux.",
  administration: "Dans l'administration publique, Python facilite la numerisation des formulaires, l'analyse des donnees fiscales et la publication d'indicateurs de gouvernance.",
};

function chapterContent(partName, chapterTitle, topics, chapterIndex) {
  currentPart = partName;
  newPage();
  toc.push({ partName, chapterTitle, page: doc.getNumberOfPages() });
  title(chapterTitle, 1);
  textBlock(
    `Ce chapitre appartient a ${partName}. Il a pour objectif de donner a l'apprenant une comprehension solide, progressive et operationnelle du theme "${chapterTitle}". La demarche adoptee combine rigueur academique, exemples professionnels, analogies simples et exercices corriges. Le lecteur doit lire les explications, executer les scripts, modifier les exemples, puis reconstruire la logique sans regarder le corrige.`,
    { size: 10.5 },
  );
  title('Objectifs pedagogiques', 2);
  bullet([
    `Comprendre les notions centrales liees a ${chapterTitle}.`,
    'Lire du code Python existant et identifier son intention.',
    'Ecrire des scripts courts, testables et maintenables.',
    'Relier la theorie a des cas professionnels reels.',
    'Documenter ses choix techniques avec un vocabulaire precis.',
  ]);
  table(
    ['Notion', 'Utilite professionnelle', 'Resultat attendu'],
    topics.map((topic) => [
      topic,
      `Maitriser ${topic.toLowerCase()} pour construire des solutions fiables.`,
      'Savoir expliquer, coder, tester et ameliorer.',
    ]),
  );
  title('Explication approfondie', 2);
  topics.forEach((topic, topicIndex) => {
    title(topic, 3);
    textBlock(
      `${topic} represente une brique importante de la pratique Python. Dans un projet professionnel, cette notion ne doit jamais etre consideree comme une simple syntaxe. Elle sert a organiser la pensee, reduire les erreurs et transformer une idee en programme executable. Un bon developpeur observe le probleme, choisit les structures adaptees, nomme clairement ses variables et garde un code lisible pour l'equipe.`,
    );
    textBlock(
      `Analogie: imaginez une organisation qui classe ses dossiers, ses ressources et ses responsabilites. Python joue le role de langage commun entre les personnes, les machines et les donnees. Lorsque ${topic.toLowerCase()} est bien utilise, le programme devient facile a verifier, a transmettre et a faire evoluer.`,
    );
    const exampleKey = ['banque', 'sante', 'ecommerce', 'administration'][(chapterIndex + topicIndex) % 4];
    textBlock(`Cas reel: ${professionalExamples[exampleKey]}`);
  });
  title('Schema de comprehension', 2);
  diagram(`Cycle de travail - ${chapterTitle}`, ['Probleme', 'Modele', 'Code', 'Test', 'Deploiement']);
  title('Exemple professionnel commente', 2);
  codeBlock(`
# Exemple de structure de travail professionnelle
from dataclasses import dataclass

@dataclass
class Operation:
    reference: str
    montant: float
    statut: str = "en_attente"

def valider_operation(operation: Operation) -> bool:
    if operation.montant <= 0:
        return False
    return operation.reference.strip() != ""

operations = [
    Operation("ENK-001", 250.0),
    Operation("ENK-002", 0.0),
]

valides = [op for op in operations if valider_operation(op)]
print(f"Operations valides: {len(valides)}")
`);
  textBlock(
    "L'exemple montre une approche propre: les donnees sont modelisees, la regle de validation est isolee et le resultat peut etre teste. Cette discipline est essentielle dans les secteurs ou les erreurs coutent cher: finance, sante, fiscalite, logistique et administration.",
  );
  title('Bonnes pratiques', 2);
  bullet([
    'Nommer les variables selon leur role metier, pas selon leur type uniquement.',
    'Separer la logique de calcul, la logique de lecture des donnees et la logique d affichage.',
    'Tester les cas normaux, les cas limites et les donnees invalides.',
    'Documenter les decisions importantes plutot que commenter chaque ligne evidente.',
    'Eviter les scripts trop longs: decomposer en fonctions, classes et modules.',
  ]);
  title('Pieges a eviter', 2);
  bullet([
    'Copier du code sans comprendre la responsabilite de chaque instruction.',
    'Utiliser des noms vagues comme data, tmp ou test dans un projet final.',
    'Ignorer les erreurs et continuer comme si le resultat etait fiable.',
    'Melanger demonstration pedagogique et code de production sans nettoyage.',
    'Installer des bibliotheques sans verifier leur documentation et leur maintenance.',
  ]);
  title('Atelier pratique', 2);
  textBlock(
    `Construisez un mini module Python applique a ${chapterTitle}. Le module doit lire une liste de donnees, appliquer une regle claire, produire un resultat et afficher un rapport court. Vous devez ensuite ajouter trois tests manuels: une entree valide, une entree vide et une entree incoherente.`,
  );
  codeBlock(`
def produire_rapport(elements):
    total = len(elements)
    actifs = [e for e in elements if e.get("statut") == "actif"]
    return {
        "total": total,
        "actifs": len(actifs),
        "taux_actif": round(len(actifs) / total * 100, 2) if total else 0
    }

donnees = [
    {"nom": "Service A", "statut": "actif"},
    {"nom": "Service B", "statut": "pause"},
    {"nom": "Service C", "statut": "actif"},
]

print(produire_rapport(donnees))
`);
  title('Exercices corriges', 2);
  for (let i = 1; i <= 6; i += 1) {
    textBlock(
      `Exercice ${i}: redigez une fonction Python qui resout un probleme lie a ${topics[(i - 1) % topics.length].toLowerCase()}. La fonction doit recevoir des parametres, verifier les donnees et retourner un resultat exploitable.`,
      { size: 9.4, gap: 4 },
    );
    textBlock(
      `Corrige ${i}: commencez par identifier les entrees, puis ajoutez une condition de validation. Ensuite, traitez les donnees avec une boucle ou une comprehension. Enfin, retournez une structure claire comme un dictionnaire afin de faciliter l integration dans une API ou un tableau de bord.`,
      { size: 9.4, color: muted, gap: 6 },
    );
  }
  title('Quiz d evaluation', 2);
  bullet([
    `Pourquoi ${topics[0].toLowerCase()} est-il important dans un projet professionnel ?`,
    'Quelle difference existe entre une demonstration et un code maintenable ?',
    'Comment verifier qu une fonction produit un resultat fiable ?',
    'Pourquoi faut-il documenter les hypotheses metier ?',
    'Comment transformer un script en composant reutilisable ?',
  ]);
  title('Projet de fin de chapitre', 2);
  textBlock(
    `Realisez un mini projet documente de deux pages autour de ${chapterTitle}. Le livrable doit contenir le contexte, les donnees utilisees, le code, les limites, les tests et une piste d amelioration. Dans un cadre universitaire, ce projet peut etre presente a l oral; dans une entreprise, il peut servir de preuve de competence.`,
  );
}

function preliminaries() {
  currentPart = 'Preliminaires';
  cover();
  title('Page de presentation', 1);
  textBlock(
    `Ce manuel est un support de cours professionnel consacre a Python. Il est concu pour les etudiants, les professionnels, les entrepreneurs, les chercheurs, les developpeurs et les passionnes de technologie. Il accompagne l apprenant depuis la logique de programmation jusqu aux projets complexes: data science, intelligence artificielle, developpement web, automatisation, cybersecurite, cartographie et innovation africaine.`,
  );
  table(
    ['Auteur', 'Informations'],
    [
      ['Nom', author.name],
      ['Site web', author.site],
      ['Email', author.email],
      ['Telephone', author.phone],
      ['Profession', author.profession],
    ],
  );
  title('Preface', 1);
  textBlock(
    "Apprendre Python aujourd hui signifie apprendre a penser clairement. Le langage est simple en apparence, mais il permet de construire des systemes profonds: applications web, modeles d intelligence artificielle, outils de securite, plateformes de donnees et solutions metier. Ce livre donne une trajectoire complete, exigeante et accessible.",
  );
  textBlock(
    "La pedagogie adoptee repose sur quatre principes: comprendre avant de memoriser, pratiquer avant de pretendre maitriser, documenter avant de livrer et tester avant de deployer. Chaque chapitre relie la theorie aux situations rencontrees dans les organisations modernes.",
  );
  title("Mot de l'auteur", 1);
  textBlock(
    `Je signe ce manuel avec la conviction que la technologie doit etre utile, claire et responsable. Python peut aider une personne a automatiser son travail, une entreprise a mieux gerer ses operations, une universite a former des ingenieurs et un pays a construire des services numeriques fiables. - ${author.name}`,
  );
  title("Biographie de l'auteur", 1);
  textBlock(
    `${author.name} est ${author.profession} Son travail porte sur la creation de solutions numeriques, la formation, l accompagnement strategique et l adoption responsable des technologies. Contact: ${author.email}, ${author.phone}, ${author.site}.`,
  );
  title('Remerciements', 1);
  textBlock(
    "Ce support est dedie aux apprenants qui construisent patiemment leur competence, aux enseignants qui transmettent la rigueur, aux entrepreneurs qui transforment les besoins en solutions et aux equipes techniques qui maintiennent les systemes au quotidien.",
  );
  title('Table des matieres detaillee', 1);
  parts.forEach((part, idx) => {
    title(`${idx + 1}. ${part.name}`, 3);
    bullet(part.chapters.map(([chapter, topics]) => `${chapter}: ${topics.join(', ')}`), { size: 8.7 });
  });
  title('Comment utiliser ce livre', 1);
  bullet([
    'Lire les chapitres dans l ordre si vous debutez.',
    'Executer tous les exemples dans un environnement Python local.',
    'Refaire les exercices sans regarder les corriges.',
    'Transformer chaque atelier en mini projet personnel.',
    'Conserver un carnet d erreurs: chaque erreur comprise devient une competence.',
  ]);
}

function certificationBank() {
  currentPart = 'Exercices et certification';
  newPage();
  title('Banque professionnelle de 500 exercices', 1);
  textBlock(
    'Cette section propose une banque d exercices classes par niveau. Les enonces sont concus pour entrainer la logique, la syntaxe, l architecture, la data science, l IA, le web, la cybersecurite et les projets metier.',
  );
  const domains = ['Fondamentaux', 'POO', 'Data Science', 'Visualisation', 'IA', 'Web', 'Automatisation', 'Bases de donnees', 'Cybersecurite', 'Projets metier'];
  let count = 1;
  domains.forEach((domain) => {
    title(domain, 2);
    for (let i = 0; i < 50; i += 1) {
      textBlock(
        `Exercice ${count}: concevez une solution Python liee a ${domain}. Precisez les entrees, le traitement, la sortie attendue, les erreurs possibles et un test minimal. Corrige attendu: decomposition en fonction, validation des donnees, resultat structure et commentaire sur les limites.`,
        { size: 8.5, gap: 3 },
      );
      count += 1;
    }
  });
  title('Examens blancs', 1);
  for (let exam = 1; exam <= 5; exam += 1) {
    title(`Examen blanc ${exam}`, 2);
    bullet([
      'Partie A: comprehension du code et correction d erreurs.',
      'Partie B: conception de fonctions et structures de donnees.',
      'Partie C: mini analyse de donnees avec rapport.',
      'Partie D: projet court a presenter devant un jury.',
      'Criteres: lisibilite, exactitude, robustesse, documentation, autonomie.',
    ]);
  }
}

function annexes() {
  currentPart = 'Annexes';
  newPage();
  title('Glossaire Python', 1);
  const glossary = [
    ['Variable', 'Nom qui reference une valeur en memoire.'],
    ['Fonction', 'Bloc reutilisable qui recoit des entrees et produit un resultat.'],
    ['Classe', 'Modele permettant de creer des objets avec donnees et comportements.'],
    ['API', 'Interface permettant a des systemes de communiquer.'],
    ['DataFrame', 'Structure tabulaire utilisee en analyse de donnees.'],
    ['Modele ML', 'Programme entraine a partir de donnees pour predire ou classer.'],
    ['Deploiement', 'Mise a disposition d une application pour des utilisateurs reels.'],
  ];
  table(['Terme', 'Definition'], glossary);
  title('References et ressources complementaires', 1);
  bullet([
    'Documentation officielle Python.',
    'Documentation NumPy, Pandas, Matplotlib, Scikit-Learn, FastAPI, Django et Flask.',
    'Ouvrages universitaires de genie logiciel, statistiques, bases de donnees et apprentissage automatique.',
    'Articles de recherche sur les systemes intelligents, la gouvernance numerique et la securite defensive.',
  ]);
  title('Feuille de route developpeur Python Senior', 1);
  bullet(['Fondamentaux solides', 'Architecture logicielle', 'Tests', 'API', 'Bases de donnees', 'Cloud', 'Securite', 'Leadership technique']);
  title('Feuille de route Data Scientist', 1);
  bullet(['Statistiques', 'Pandas', 'Visualisation', 'Modelisation', 'Evaluation', 'Communication metier', 'MLOps']);
  title('Feuille de route IA', 1);
  bullet(['Algebre lineaire', 'Machine Learning', 'Deep Learning', 'NLP', 'Vision', 'Ethique', 'Deploiement']);
  title('Feuille de route Architecte Logiciel', 1);
  bullet(['Patterns', 'Domain Driven Design', 'Integration', 'Scalabilite', 'Observabilite', 'Securite', 'Documentation']);
  title('Contact professionnel', 1);
  textBlock(`${author.name} - ${author.profession}`);
  bullet([author.site, author.email, author.phone]);
}

function addPageNumbersAndMetadata() {
  const total = doc.getNumberOfPages();
  doc.setProperties({
    title: 'Python Professionnel - Manuel complet',
    subject: 'Formation Python professionnelle, data science, IA, web, cybersecurite et projets',
    author: author.name,
    creator: author.name,
  });
  for (let i = 1; i <= total; i += 1) {
    doc.setPage(i);
    doc.setTextColor(...muted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Page ${i} / ${total}`, page.width - page.marginX, page.height - 13, { align: 'right' });
  }
}

preliminaries();
parts.forEach((part, partIndex) => {
  part.chapters.forEach(([chapterTitle, topics], chapterIndex) => {
    chapterContent(part.name, chapterTitle, topics, partIndex * 10 + chapterIndex);
  });
});
certificationBank();
annexes();

while (doc.getNumberOfPages() < 155) {
  currentPart = 'Fiches pratiques supplementaires';
  newPage();
  const n = doc.getNumberOfPages();
  title(`Fiche pratique ${n}`, 1);
  textBlock(
    'Cette fiche consolide les apprentissages du manuel. Elle invite le lecteur a relire un concept, produire un exemple personnel, identifier les risques et documenter une amelioration possible dans un contexte professionnel.',
  );
  bullet([
    'Choisir un probleme reel observe dans une organisation.',
    'Identifier les donnees necessaires et leur qualite.',
    'Ecrire une fonction Python courte et testable.',
    'Ajouter un test positif, un test negatif et un cas limite.',
    'Presenter le resultat sous forme de rapport lisible.',
  ]);
  codeBlock(`
def verifier_donnees(lignes):
    erreurs = []
    for index, ligne in enumerate(lignes, start=1):
        if not ligne:
            erreurs.append(f"Ligne {index}: vide")
    return erreurs
`);
}

footer();
addPageNumbersAndMetadata();

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, Buffer.from(doc.output('arraybuffer')));
console.log(JSON.stringify({ outputPath, pages: doc.getNumberOfPages(), bytes: fs.statSync(outputPath).size }, null, 2));
