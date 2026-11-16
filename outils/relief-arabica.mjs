/**
 * Pose le vrai relief du Yunnan dans l'atlas.
 *
 *   node outils/relief-arabica.mjs
 *
 * La source est `carte/relief.json` — le relevé fait une fois pour la carte
 * du relief, et versionné depuis. Le décodage, la réduction et l'écriture de
 * la ligne sont communs à l'atlas et à l'arbre à souhaits : ils vivent dans
 * outils/relief-commun.mjs. Ici, ce qui est propre à l'atlas : sa finesse,
 * et où poser la ligne.
 *
 * Le relevé fait 380 × 380, ce qui est plus fin que la maille de rendu de
 * l'atlas (250 à 440 selon la machine). On le garde entier : la maille de
 * rendu le vaut.
 *
 * Le résultat est écrit dans `arabica/index.html`, à la place de la ligne
 * `const RELIEF=…`. C'est une donnée, pas une sortie de construction : elle
 * est versionnée, et la page reste ouvrable seule.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dans, ligneRelief, direTaille } from './relief-commun.mjs';

const SORTIE = 380;      /* le relevé entier : la maille de rendu le vaut */
const PASSES = 2;        /* passes de lissage gaussien */

const { ligne, min, max } = await ligneRelief({ sortie: SORTIE, passes: PASSES });

const page = dans('arabica', 'index.html');
let html = await readFile(page, 'utf8');
const marque = /const RELIEF=\{[^\n]*\};/;
if (marque.test(html)) {
  html = html.replace(marque, ligne);
} else {
  const ancre = 'const GL3={ok:false};';
  if (!html.includes(ancre)) throw new Error('impossible de placer le relief : « const GL3 » introuvable');
  html = html.replace(ancre,
    '/* Relief du Yunnan — relevé réel, lissé, fabriqué par\n'
    + '   outils/relief-arabica.mjs depuis carte/relief.json. Une altitude par\n'
    + '   maille, de `min` à `max` mètres, du coin sud-ouest au coin nord-est.\n'
    + '   Donnée versionnée : ne pas la modifier à la main. */\n'
    + ligne + '\n' + ancre);
}
await writeFile(page, html);
console.log('  ' + await direTaille(ligne, min, max, SORTIE));
