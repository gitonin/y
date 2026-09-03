/**
 * Exporte les articles du journal (français) dans un document relisible et
 * modifiable, avec un code stable entre crochets devant chaque texte.
 *
 *   node scripts/export-journal.mjs
 *
 * Un article se découpe en blocs : intertitres, paragraphes et listes, dans
 * l'ordre où ils apparaissent. Chaque bloc garde son code, ce qui permet de
 * réinjecter les modifications sans se soucier de la mise en forme.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { ecrire } from './lib/document.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE = path.join(ROOT, 'src/content/journal/fr');
const OUT = path.join(ROOT, 'contenu');

/* ------------------------------------------------------------ lecture */
/** Sépare l'en-tête (métadonnées) du corps de l'article. */
function separer(brut) {
  const m = brut.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { meta: {}, corps: brut.trim() };
  const meta = {};
  for (const ligne of m[1].split('\n')) {
    const c = ligne.indexOf(':');
    if (c === -1) continue;
    const cle = ligne.slice(0, c).trim();
    let valeur = ligne.slice(c + 1).trim();
    if (/^'.*'$/.test(valeur) || /^".*"$/.test(valeur)) valeur = valeur.slice(1, -1);
    meta[cle] = valeur;
  }
  return { meta, corps: brut.slice(m[0].length).trim() };
}

/** Découpe le corps en blocs : intertitre, paragraphe ou liste. */
function blocs(corps) {
  const sortie = [];
  for (const bloc of corps.split(/\n{2,}/)) {
    const lignes = bloc.split('\n').filter((l) => l.trim() !== '');
    if (!lignes.length) continue;
    if (lignes[0].startsWith('## ')) {
      sortie.push({ genre: 'intertitre', lignes: [lignes[0].replace(/^##\s+/, '')] });
    } else if (/^[-*+]\s/.test(lignes[0])) {
      sortie.push({ genre: 'puces', lignes: lignes.map((l) => l.replace(/^[-*+]\s+/, '')) });
    } else if (/^\d+\.\s/.test(lignes[0])) {
      sortie.push({ genre: 'numeros', lignes: lignes.map((l) => l.replace(/^\d+\.\s+/, '')) });
    } else {
      sortie.push({ genre: 'paragraphe', lignes: [lignes.join(' ')] });
    }
  }
  return sortie;
}

const LIBELLES = {
  intertitre: 'Intertitre',
  paragraphe: 'Paragraphe',
  puces: 'Liste à puces — une ligne par point',
  numeros: 'Liste numérotée — une ligne par point',
};
const PHOTOS = ['recolte-cueilleurs', 'cretes-brumeuses', 'cerises-branche', 'sechage-lits', 'tabouret-terrasse'];

/* ------------------------------------------------------------ plan */
const doc = [];
const chapter = (title) => doc.push({ type: 'chapter', title });
const section = (title) => doc.push({ type: 'section', title });
const note = (text) => doc.push({ type: 'note', text });
const field = (code, valeur, label) => {
  if (valeur === undefined || valeur === null || valeur === '') return;
  doc.push({ type: 'field', code, label, lines: String(valeur).split('\n') });
};

chapter('Comment utiliser ce document');
note(
  'Ce document contient les articles du journal en français. Modifiez-les librement, puis renvoyez-moi le fichier : je les réinjecte dans le site et je m’occupe des traductions anglaise et chinoise.'
);
note('Les règles sont les mêmes que pour le document des textes du site :');
note('1. Ne touchez pas au code entre crochets. C’est lui qui me dit où va chaque texte.');
note('2. Écrivez sous le code, à la place du texte existant. Vous pouvez tout réécrire, rallonger, raccourcir.');
note('3. Dans une liste, gardez une ligne par point. Le nombre de points peut changer.');
note(
  'Pour supprimer un bloc, écrivez « SUPPRIMER » à la place. Pour ajouter un paragraphe ou un article entier, écrivez-le à la fin du document en me disant où il va : je m’occupe du reste.'
);
note('Le titre et la description comptent double : ce sont eux qui s’affichent dans Google et dans la liste des articles.');
note(
  'Les mots entourés de deux étoiles, comme **ceci**, s’affichent en gras sur le site. Gardez les étoiles si vous voulez garder le gras, retirez-les sinon.'
);

const fichiers = (await readdir(SOURCE)).filter((f) => f.endsWith('.md')).sort();
const articles = [];
for (const fichier of fichiers) {
  const slug = fichier.replace(/\.md$/, '');
  const { meta, corps } = separer(await readFile(path.join(SOURCE, fichier), 'utf8'));
  articles.push({ slug, meta, blocs: blocs(corps) });
}
articles.sort((a, b) => String(a.meta.date).localeCompare(String(b.meta.date)));

articles.forEach((article, i) => {
  const { slug, meta } = article;
  const c = `article.${slug}`;
  chapter(`Article ${i + 1} — ${meta.title}`);
  section('Fiche de l’article');
  field(`${c}.titre`, meta.title, 'Titre de l’article');
  field(`${c}.description`, meta.description, 'Description affichée dans Google (≈ 155 signes)');
  field(`${c}.date`, meta.date, 'Date de publication (année-mois-jour)');
  field(`${c}.auteur`, meta.author, 'Signature');
  field(`${c}.motsCles`, (meta.tags ?? '').replace(/[[\]']/g, ''), 'Mots-clés, séparés par des virgules');
  field(`${c}.photo`, meta.photo, `Photo d’en-tête — au choix : ${PHOTOS.join(', ')}`);
  section('Texte de l’article');
  article.blocs.forEach((bloc, n) => {
    field(`${c}.bloc.${n + 1}`, bloc.lignes.join('\n'), LIBELLES[bloc.genre]);
  });
});

const { champs, word } = await ecrire(doc, {
  dossier: OUT,
  nom: 'journal-yunma-fr',
  titre: 'Yunma — articles du journal (français)',
  consigne: 'Modifiez les textes sous les codes entre crochets, sans toucher aux codes eux-mêmes.',
});
console.log(`${articles.length} articles · ${champs} textes exportés · contenu/journal-yunma-fr.md${word ? ' + .docx' : ''}`);
