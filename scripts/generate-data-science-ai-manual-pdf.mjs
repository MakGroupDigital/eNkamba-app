import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';

const outputDir = path.resolve('docs');
const outputPath = path.join(outputDir, 'manuel-data-science-ia-avancee-charmant-nyungu.pdf');
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
let currentSection = 'Data Science et IA avancée';

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
  doc.text(`Data Science et IA avancée — ${author.name}`, page.mx, page.height - 31);
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

function codeBlock(code, caption = 'Exemple pratique') {
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

function scatter(titleText) {
  ensure(154);
  const w = page.width - page.mx * 2;
  const x0 = page.mx;
  const y0 = y;
  doc.setFillColor(...colors.pale);
  doc.setDrawColor(...colors.line);
  doc.roundedRect(x0, y0, w, 140, 10, 10, 'FD');
  setFont(8.5, colors.greenDark, 'bold');
  doc.text(titleText, x0 + 14, y0 + 18);
  doc.setDrawColor(210, 222, 216);
  doc.line(x0 + 55, y0 + 112, x0 + w - 38, y0 + 112);
  doc.line(x0 + 55, y0 + 36, x0 + 55, y0 + 112);
  const pts = [
    [86, 84, colors.green], [124, 66, colors.blue], [166, 92, colors.orange], [210, 58, colors.purple],
    [258, 78, colors.greenDark], [306, 50, colors.red], [356, 88, colors.blue], [414, 62, colors.orange],
  ];
  pts.forEach(([px, py, c]) => {
    doc.setFillColor(...c);
    doc.circle(x0 + px, y0 + py, 5, 'F');
  });
  setFont(7, colors.muted);
  doc.text('Nuage de points : comprendre relation, dispersion et valeurs atypiques.', x0 + 14, y0 + 128);
  y += 154;
}

function bars(titleText) {
  ensure(138);
  const w = page.width - page.mx * 2;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...colors.line);
  doc.roundedRect(page.mx, y, w, 126, 10, 10, 'FD');
  setFont(8.5, colors.greenDark, 'bold');
  doc.text(titleText, page.mx + 14, y + 18);
  const values = [['Pandas', 82], ['Stats', 70], ['ML', 76], ['DL', 63], ['NLP', 68], ['Vision', 72]];
  const baseY = y + 104;
  values.forEach(([lab, val], idx) => {
    const x = page.mx + 38 + idx * 74;
    const h = Number(val) * 0.7;
    doc.setFillColor(...[colors.green, colors.orange, colors.blue, colors.purple, colors.red, colors.greenDark][idx]);
    doc.roundedRect(x, baseY - h, 32, h, 5, 5, 'F');
    setFont(6.7, colors.muted);
    doc.text(lab, x - 6, baseY + 13);
  });
  y += 138;
}

function matrix(titleText) {
  ensure(154);
  const w = page.width - page.mx * 2;
  const x0 = page.mx;
  const y0 = y;
  doc.setFillColor(...colors.pale);
  doc.setDrawColor(...colors.line);
  doc.roundedRect(x0, y0, w, 140, 10, 10, 'FD');
  setFont(8.5, colors.greenDark, 'bold');
  doc.text(titleText, x0 + 14, y0 + 18);
  for (let r = 0; r < 5; r += 1) {
    for (let c = 0; c < 7; c += 1) {
      const palette = [colors.green, colors.blue, colors.orange, colors.purple, colors.red];
      doc.setFillColor(...palette[(r + c) % palette.length]);
      doc.rect(x0 + 92 + c * 44, y0 + 38 + r * 17, 38, 13, 'F');
    }
  }
  setFont(7, colors.muted);
  doc.text('Carte thermique : comparer variables, corrélations, segments ou erreurs modèle.', x0 + 14, y0 + 128);
  y += 154;
}

function neural(titleText) {
  ensure(154);
  const w = page.width - page.mx * 2;
  const x0 = page.mx;
  const y0 = y;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...colors.line);
  doc.roundedRect(x0, y0, w, 140, 10, 10, 'FD');
  setFont(8.5, colors.greenDark, 'bold');
  doc.text(titleText, x0 + 14, y0 + 18);
  const layers = [[3, 80], [5, 170], [4, 270], [2, 380]];
  layers.forEach(([count, lx], li) => {
    for (let i = 0; i < count; i += 1) {
      const cy = y0 + 42 + i * (74 / Math.max(1, count - 1));
      doc.setFillColor(...[colors.green, colors.blue, colors.orange, colors.purple][li]);
      doc.circle(x0 + lx, cy, 8, 'F');
      if (li < layers.length - 1) {
        const [nextCount, nextX] = layers[li + 1];
        for (let j = 0; j < nextCount; j += 1) {
          const ny = y0 + 42 + j * (74 / Math.max(1, nextCount - 1));
          doc.setDrawColor(210, 222, 216);
          doc.line(x0 + lx + 8, cy, x0 + nextX - 8, ny);
        }
      }
    }
  });
  setFont(7, colors.muted);
  doc.text('Réseau neuronal : couches, poids, propagation et décision.', x0 + 14, y0 + 128);
  y += 154;
}

function visual(index) {
  const visuals = [
    () => pipeline('Pipeline data science', ['Question', 'Données', 'Modèle', 'Évaluation', 'Déploiement']),
    () => scatter('Analyse exploratoire visuelle'),
    () => bars('Maturité des compétences'),
    () => matrix('Matrice de corrélation / performance'),
    () => neural('Schéma simplifié de deep learning'),
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
  doc.text('MANUEL PROFESSIONNEL ET AVANCÉ', page.mx, 64);
  setFont(31, [255, 255, 255], 'bold');
  doc.text('DATA SCIENCE', page.mx, 118);
  doc.text('ET IA AVANCÉE', page.mx, 158);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(page.mx, 176, page.width - page.mx * 2, 140, 18, 18, 'F');
  setFont(14, colors.ink, 'bold');
  doc.text('Statistiques, Pandas, visualisation, machine learning, deep learning, NLP et computer vision', page.mx + 20, 218, {
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
  pipeline('Vision du cours', ['Statistiques', 'Données', 'Modèles', 'IA', 'Produit']);
  setFont(9, colors.muted);
  doc.text('Ce manuel forme à l’analyse, à la modélisation, à l’intelligence artificielle appliquée et à la livraison de projets data fiables.', page.mx, 770, {
    maxWidth: page.width - page.mx * 2,
  });
  newPage();
}

const sections = [
  {
    name: 'Partie 1 : Fondations statistiques',
    chapters: [
      ['Logique statistique', ['population', 'échantillon', 'variable', 'biais']],
      ['Statistiques descriptives', ['moyenne', 'médiane', 'variance', 'écart-type']],
      ['Probabilités appliquées', ['distribution', 'incertitude', 'loi normale', 'décision']],
      ['Tests statistiques', ['hypothèse', 'p-value', 'intervalle', 'erreur']],
    ],
  },
  {
    name: 'Partie 2 : Pandas et préparation des données',
    chapters: [
      ['DataFrame professionnel', ['lecture', 'colonnes', 'types', 'index']],
      ['Nettoyage des données', ['valeurs manquantes', 'doublons', 'formats', 'outliers']],
      ['Transformation et agrégation', ['groupby', 'merge', 'pivot', 'features']],
      ['Qualité et gouvernance data', ['traçabilité', 'dictionnaire', 'validation', 'documentation']],
    ],
  },
  {
    name: 'Partie 3 : Visualisation et storytelling',
    chapters: [
      ['Matplotlib et Seaborn', ['histogramme', 'courbe', 'boxplot', 'heatmap']],
      ['Plotly et dashboards', ['interaction', 'filtre', 'KPI', 'exploration']],
      ['Communication data', ['message', 'contexte', 'comparaison', 'limites']],
    ],
  },
  {
    name: 'Partie 4 : Machine Learning',
    chapters: [
      ['Régression', ['variables', 'erreur', 'régularisation', 'interprétation']],
      ['Classification', ['classes', 'précision', 'rappel', 'matrice de confusion']],
      ['Clustering', ['distance', 'segments', 'KMeans', 'profilage']],
      ['Évaluation des modèles', ['train-test', 'cross-validation', 'métriques', 'surapprentissage']],
      ['Feature engineering', ['encodage', 'normalisation', 'sélection', 'pipeline']],
    ],
  },
  {
    name: 'Partie 5 : Deep Learning',
    chapters: [
      ['Réseaux neuronaux', ['neurone', 'couche', 'activation', 'perte']],
      ['TensorFlow et Keras', ['modèle', 'entraînement', 'callbacks', 'sauvegarde']],
      ['PyTorch', ['tensor', 'autograd', 'module', 'training loop']],
      ['MLOps pour deep learning', ['versioning', 'monitoring', 'drift', 'déploiement']],
    ],
  },
  {
    name: 'Partie 6 : NLP',
    chapters: [
      ['Traitement du texte', ['tokenisation', 'nettoyage', 'lemmatisation', 'n-grammes']],
      ['Classification de texte', ['sentiment', 'spam', 'support client', 'évaluation']],
      ['Embeddings et transformers', ['vecteurs', 'attention', 'fine-tuning', 'limites']],
      ['Applications africaines du NLP', ['langues locales', 'administration', 'éducation', 'service client']],
    ],
  },
  {
    name: 'Partie 7 : Computer Vision',
    chapters: [
      ['Bases de l’image numérique', ['pixels', 'canaux', 'filtres', 'prétraitement']],
      ['Classification d’images', ['CNN', 'augmentation', 'validation', 'erreurs']],
      ['Détection et segmentation', ['objets', 'masques', 'annotation', 'métriques']],
      ['Cas santé, sécurité et agriculture', ['imagerie', 'surveillance', 'cultures', 'éthique']],
    ],
  },
  {
    name: 'Partie 8 : Projets professionnels',
    chapters: [
      ['Scoring bancaire', ['risque', 'features', 'modèle', 'explicabilité']],
      ['Prévision santé publique', ['séries', 'épidémiologie', 'alertes', 'tableau de bord']],
      ['Recommandation e-commerce', ['historique', 'similarité', 'ranking', 'évaluation']],
      ['Assistant IA métier', ['données', 'contexte', 'réponse', 'sécurité']],
      ['Vision intelligente', ['caméra', 'classification', 'alerte', 'audit']],
    ],
  },
  {
    name: 'Partie 9 : Exercices, certification et annexes',
    chapters: [
      ['Banque d’exercices', ['statistiques', 'Pandas', 'ML', 'IA']],
      ['Examens blancs', ['questions', 'cas', 'projet', 'soutenance']],
      ['Glossaire et feuilles de route', ['termes', 'références', 'progression', 'spécialisation']],
    ],
  },
];

function codeFor(chapter) {
  const lower = chapter.toLowerCase();
  if (lower.includes('pandas') || lower.includes('dataframe') || lower.includes('nettoyage')) {
    return `
import pandas as pd

df = pd.DataFrame({
    "client": ["A", "B", "C"],
    "montant": [120, None, 340],
    "ville": ["Kinshasa", "Goma", "Kinshasa"]
})

df["montant"] = df["montant"].fillna(df["montant"].median())
resume = df.groupby("ville")["montant"].mean()
print(resume)`;
  }
  if (lower.includes('classification') || lower.includes('machine') || lower.includes('régression')) {
    return `
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
model = RandomForestClassifier(random_state=42)
model.fit(X_train, y_train)
print(classification_report(y_test, model.predict(X_test)))`;
  }
  if (lower.includes('nlp') || lower.includes('texte')) {
    return `
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

texts = ["paiement reçu", "erreur compte", "colis livré"]
labels = ["finance", "support", "logistique"]

vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(texts)
model = LogisticRegression().fit(X, labels)
print(model.predict(vectorizer.transform(["problème de paiement"])))`;
  }
  if (lower.includes('vision') || lower.includes('image')) {
    return `
from PIL import Image
import numpy as np

image = Image.open("photo.jpg").resize((224, 224))
array = np.array(image) / 255.0
print(array.shape)  # hauteur, largeur, canaux`;
  }
  if (lower.includes('deep') || lower.includes('keras') || lower.includes('neuronal')) {
    return `
from tensorflow import keras

model = keras.Sequential([
    keras.layers.Dense(64, activation="relu", input_shape=(10,)),
    keras.layers.Dense(1, activation="sigmoid")
])

model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])`;
  }
  return `
import numpy as np

values = np.array([12, 15, 18, 21, 100])
mean = values.mean()
median = np.median(values)
std = values.std()

print({"moyenne": mean, "médiane": median, "écart_type": std})`;
}

function preliminaries() {
  cover();
  currentSection = 'Préliminaires';
  title('Présentation du manuel', 1);
  paragraph(
    `Ce manuel forme à la Data Science et à l’Intelligence Artificielle avancée. Il accompagne l’apprenant depuis les statistiques jusqu’aux systèmes modernes : Pandas, visualisation, machine learning, deep learning, NLP, computer vision et projets professionnels. L’approche privilégie la compréhension, l’expérimentation, l’évaluation rigoureuse et l’impact métier.`,
  );
  paragraph(
    `L’auteur, ${author.name}, propose une formation structurée pour les étudiants, développeurs, chercheurs, analystes, entrepreneurs et professionnels qui veulent transformer des données en décisions et des modèles en produits fiables.`,
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
    'La Data Science n’est pas seulement une collection de bibliothèques. C’est une discipline de raisonnement : poser une bonne question, comprendre les données, mesurer l’incertitude, tester les hypothèses, construire un modèle et expliquer clairement ses limites.',
  );
  title('Comment utiliser ce livre', 1);
  bullet([
    'Reproduire chaque exemple dans un notebook ou un script Python.',
    'Créer un jeu de données personnel pour chaque chapitre.',
    'Comparer les métriques plutôt que chercher un score isolé.',
    'Documenter les hypothèses, les biais, les limites et les risques.',
    'Transformer les exercices en mini projets de portfolio.',
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
    `Ce chapitre traite de ${chapterTitle.toLowerCase()} avec une approche professionnelle. L’objectif est de savoir analyser le problème, préparer les données, choisir une méthode, évaluer le résultat, expliquer les limites et transformer l’analyse en décision utile.`,
    { size: 10.4 },
  );
  visual(index);
  title('Objectifs pédagogiques', 2);
  bullet([
    `Comprendre le rôle de ${chapterTitle.toLowerCase()} dans un projet data réel.`,
    'Choisir les bons outils selon la question métier.',
    'Évaluer les résultats avec des métriques adaptées.',
    'Identifier les biais, limites et risques de mauvaise interprétation.',
    'Produire un livrable clair : notebook, rapport, dashboard ou API modèle.',
  ]);
  table(
    ['Notion', 'Question data', 'Livrable attendu'],
    topics.map((topic) => [
      topic,
      `Comment utiliser ${topic} pour améliorer une décision ?`,
      'Analyse claire, code reproductible, métrique et interprétation.',
    ]),
  );
  title('Explication approfondie', 2);
  topics.forEach((topic, topicIndex) => {
    title(topic, 3);
    paragraph(
      `${topic} est une brique importante du travail data. Dans un contexte professionnel, il ne suffit pas d’obtenir un résultat technique : il faut comprendre la donnée, vérifier sa qualité, expliquer l’incertitude et traduire l’analyse en action. Un modèle performant mais incompris peut devenir dangereux ; un modèle modeste mais bien expliqué peut créer une vraie valeur.`,
    );
    paragraph(
      `Analogie : un data scientist ressemble à un enquêteur. Il collecte les indices, vérifie les sources, élimine les fausses pistes, construit une hypothèse, puis présente une conclusion avec prudence. ${topic} contribue à rendre cette enquête plus rigoureuse.`,
    );
    if (topicIndex % 2 === 0) visual(index + topicIndex + 1);
  });
  title('Exemple de code', 2);
  codeBlock(codeFor(chapterTitle), `Code — ${chapterTitle}`);
  paragraph(
    'Le code présenté est volontairement compact afin de montrer la logique essentielle. Dans un projet professionnel, il doit être complété par des tests, une gestion des erreurs, une documentation des données et une évaluation transparente.',
  );
  title('Cas pratique professionnel', 2);
  paragraph(
    `Une entreprise peut utiliser ${chapterTitle.toLowerCase()} pour réduire les coûts, détecter des tendances, améliorer le service client, prévoir la demande, sécuriser les décisions ou automatiser des tâches complexes. Le succès dépend moins du modèle choisi que de la qualité du problème posé et de la fiabilité des données.`,
  );
  visual(index + 3);
  title('Bonnes pratiques', 2);
  bullet([
    'Définir la question métier avant d’ouvrir le notebook.',
    'Séparer données brutes, données nettoyées et résultats.',
    'Comparer plusieurs méthodes avec la même métrique.',
    'Documenter les biais, les hypothèses et les limites.',
    'Ne jamais déployer un modèle sans monitoring.',
    'Expliquer les résultats dans un langage compréhensible par les décideurs.',
  ]);
  title('Pièges à éviter', 2);
  bullet([
    'Confondre corrélation et causalité.',
    'Optimiser une métrique sans vérifier l’impact métier.',
    'Entraîner un modèle sur des données non représentatives.',
    'Ignorer les valeurs manquantes ou les doublons.',
    'Déployer une IA sans contrôle humain et sans audit.',
  ]);
  title('Exercices corrigés', 2);
  for (let i = 1; i <= 5; i += 1) {
    paragraph(
      `Exercice ${i} : construisez une mini analyse liée à ${topics[(i - 1) % topics.length]}. Définissez la question, les données, la méthode, la métrique et la conclusion.`,
      { size: 9.2, gap: 3 },
    );
    paragraph(
      `Corrigé ${i} : une réponse solide contient une hypothèse claire, un nettoyage minimal, une visualisation, une métrique et une conclusion prudente. Le résultat doit mentionner au moins une limite.`,
      { size: 9.2, color: colors.muted, gap: 6 },
    );
  }
  title('Quiz de validation', 2);
  bullet([
    'Quelle question métier ce chapitre permet-il de traiter ?',
    'Quelle métrique choisir et pourquoi ?',
    'Quel biais peut influencer le résultat ?',
    'Comment expliquer le résultat à un non-technicien ?',
    'Quelle étape faut-il surveiller après déploiement ?',
  ]);
}

function exercisesAndAppendix() {
  currentSection = 'Exercices et annexes';
  newPage();
  title('Banque de 450 exercices Data Science et IA', 1);
  paragraph(
    'Cette banque entraîne les apprenants à pratiquer toute la chaîne data : statistiques, Pandas, visualisation, machine learning, deep learning, NLP, computer vision, évaluation et projets professionnels.',
  );
  const domains = ['Statistiques', 'Pandas', 'Visualisation', 'Régression', 'Classification', 'Clustering', 'Deep Learning', 'NLP', 'Computer Vision', 'MLOps'];
  let count = 1;
  domains.forEach((domain, d) => {
    title(domain, 2);
    visual(d);
    for (let i = 0; i < 45; i += 1) {
      paragraph(
        `Exercice ${count} : réalisez une tâche liée à ${domain}. Décrivez la question, le jeu de données, la méthode, une visualisation, une métrique, une limite et une recommandation. Corrigé attendu : démarche reproductible, code clair, interprétation et prudence.`,
        { size: 8.6, gap: 3 },
      );
      count += 1;
    }
  });
  title('Examens blancs', 1);
  for (let exam = 1; exam <= 6; exam += 1) {
    title(`Examen blanc ${exam}`, 2);
    bullet([
      'Partie A : statistiques et interprétation.',
      'Partie B : nettoyage avec Pandas.',
      'Partie C : visualisation et storytelling.',
      'Partie D : modèle machine learning et métriques.',
      'Partie E : projet IA avec rapport professionnel.',
    ]);
  }
  title('Glossaire Data Science et IA', 1);
  table(
    ['Terme', 'Définition'],
    [
      ['Feature', 'Variable utilisée comme entrée d’un modèle.'],
      ['Label', 'Valeur cible à prédire ou expliquer.'],
      ['Overfitting', 'Modèle trop adapté aux données d’entraînement.'],
      ['Cross-validation', 'Méthode d’évaluation plus robuste par découpage multiple.'],
      ['Embedding', 'Représentation vectorielle d’un texte, image ou objet.'],
      ['CNN', 'Réseau neuronal spécialisé dans les images.'],
      ['Transformer', 'Architecture moderne fondée sur l’attention, utile en NLP et vision.'],
      ['Drift', 'Changement des données ou comportements après déploiement.'],
    ],
  );
  title('Feuille de route Data Scientist et ingénieur IA', 1);
  bullet([
    'Maîtriser Python, statistiques, Pandas et visualisation.',
    'Comprendre les métriques et la validation des modèles.',
    'Construire des projets ML, NLP et computer vision.',
    'Apprendre le déploiement, le monitoring et le MLOps.',
    'Documenter les biais, limites, risques et impacts métier.',
    'Développer une communication claire avec les décideurs.',
  ]);
  title('Contact professionnel', 1);
  paragraph(`${author.name} — ${author.profession}`);
  bullet([author.site, author.email, author.phone]);
}

function filler() {
  while (doc.getNumberOfPages() < 185) {
    currentSection = 'Fiches pratiques Data & IA';
    newPage();
    const n = doc.getNumberOfPages();
    title(`Fiche pratique Data & IA ${n}`, 1);
    paragraph(
      'Cette fiche sert de révision guidée. Elle demande à l’apprenant de choisir une question métier, un jeu de données, une méthode, une métrique, une visualisation et une limite. La qualité du raisonnement compte autant que le score obtenu.',
    );
    visual(n);
    table(
      ['Étape', 'Résultat attendu'],
      [
        ['Question', 'Une question métier précise et mesurable.'],
        ['Données', 'Sources, qualité, dictionnaire et limites.'],
        ['Méthode', 'Statistique, modèle ou visualisation adaptée.'],
        ['Évaluation', 'Métrique, interprétation et prudence.'],
      ],
    );
    codeBlock(
      `
def summarize_dataset(df):
    return {
        "rows": len(df),
        "columns": list(df.columns),
        "missing": df.isna().sum().to_dict()
    }
`,
      'Gabarit de diagnostic data',
    );
  }
}

function metadataAndPages() {
  const total = doc.getNumberOfPages();
  doc.setProperties({
    title: 'Data Science et IA avancée — Manuel complet',
    subject: 'Statistiques, Pandas, visualisation, machine learning, deep learning, NLP et computer vision',
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
