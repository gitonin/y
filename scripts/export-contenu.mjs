/**
 * Exporte, en un seul document, tous les textes du site ET les articles du
 * journal, en français, avec un code stable entre crochets devant chacun.
 *
 *   node scripts/export-contenu.mjs
 *
 * C'est le document à relire et à corriger : on modifie le texte sous le code,
 * on renvoie le fichier, et les modifications repartent au bon endroit — dans
 * `contenu/textes.json`, `contenu/produits.json` ou `contenu/journal/`.
 */
import path from 'node:path';
import { ecrire } from './lib/document.mjs';
import { doc as planSite } from './export-textes.mjs';
import { doc as planJournal, nombreArticles } from './export-journal.mjs';

const OUT = path.join(path.resolve(import.meta.dirname, '..'), 'contenu');

const doc = [];
const chapter = (title) => doc.push({ type: 'chapter', title });
const note = (text) => doc.push({ type: 'note', text });

chapter('Comment utiliser ce document');
note(
  'Ce document contient tout ce qui s’écrit sur le site, en français : les textes des pages, les fiches produits, les mentions légales et les articles du journal. Modifiez-les librement, puis renvoyez-moi le fichier : je les réinjecte dans le site et je m’occupe des traductions anglaise et chinoise.'
);
note('Quatre règles, et c’est tout :');
note(
  '1. Ne touchez pas au code entre crochets, par exemple [accueil.titre]. C’est lui qui me dit où va chaque texte. Si un code disparaît, je ne sais plus où placer le texte.'
);
note('2. Écrivez sous le code, à la place du texte existant. Vous pouvez tout réécrire, rallonger, raccourcir.');
note(
  '3. Quand un texte est sur plusieurs lignes, les retours à la ligne sont volontaires : ils dessinent la coupe d’un titre. Gardez-en le nombre, ou dites-moi si vous voulez en changer.'
);
note('4. Dans une liste, gardez une ligne par point. Le nombre de points, lui, peut changer.');
note(
  'Pour supprimer un texte, écrivez « SUPPRIMER » à la place. Pour en ajouter un qui n’existe pas encore — un paragraphe, une question de la FAQ, un article entier — écrivez-le à la fin du document en me disant où il va : je m’occupe du reste.'
);
note(
  'Les mots entourés de deux étoiles, comme **ceci**, s’affichent en gras sur le site. Gardez les étoiles pour garder le gras, retirez-les sinon.'
);
note(
  'Les titres et descriptions « affichés dans Google » comptent double : ce sont eux que l’on lit dans les résultats de recherche, avant même d’ouvrir la page. Les longueurs indiquées sont ce que Google affiche sans couper.'
);
note(
  'Le document est en deux parties : d’abord les textes du site, puis les articles du journal. Le sommaire du fichier Word permet de sauter de l’une à l’autre.'
);

chapter('Première partie — les textes du site');
doc.push(...planSite);

chapter('Seconde partie — les articles du journal');
doc.push(...planJournal);

const { champs, word } = await ecrire(doc, {
  dossier: OUT,
  nom: 'yunma-contenu-fr',
  titre: 'Yunma — tout le contenu du site (français)',
  consigne: 'Modifiez les textes sous les codes entre crochets, sans toucher aux codes eux-mêmes.',
});
console.log(
  `${champs} textes exportés, dont ${nombreArticles} articles de journal · contenu/yunma-contenu-fr.md${word ? ' + .docx' : ''}`
);
