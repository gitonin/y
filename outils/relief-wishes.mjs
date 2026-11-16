/**
 * Pose le relief du Yunnan dans l'arbre à souhaits.
 *
 *   node outils/relief-wishes.mjs
 *
 * Même relevé que l'atlas — `carte/relief.json` —, même décodage, mais pas
 * le même usage : l'atlas en fait le sol qu'on survole de près, l'arbre à
 * souhaits n'en fait qu'un horizon, derrière une île qui flotte. On ne verra
 * jamais une crête de plus près que quelques centaines d'unités.
 *
 * D'où une finesse plus basse : 192 × 192 au lieu de 380. À cette distance
 * la différence ne se voit pas, et la page économise cent quarante kilos —
 * ce qui compte pour une expérience qu'on ouvre sur un téléphone, un soir de
 * fête, sur le réseau de quelqu'un d'autre.
 *
 * Le résultat est écrit dans `wishes/index.html`, à la place de la ligne
 * `const RELIEF=…`. C'est une donnée, pas une sortie de construction : elle
 * est versionnée, et la page reste ouvrable seule.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dans, ligneRelief, direTaille } from './relief-commun.mjs';

const SORTIE = 192;      /* un horizon : la moitié de la finesse de l'atlas suffit */
const PASSES = 2;        /* passes de lissage gaussien */

const { ligne, min, max } = await ligneRelief({ sortie: SORTIE, passes: PASSES });

const page = dans('wishes', 'index.html');
let html = await readFile(page, 'utf8');
const marque = /const RELIEF=\{[^\n]*\};/;
if (marque.test(html)) {
  html = html.replace(marque, ligne);
} else {
  const ancre = '/* ------------------------------------------------------------------ 3D */';
  if (!html.includes(ancre)) throw new Error('impossible de placer le relief : la section « 3D » est introuvable');
  html = html.replace(ancre,
    '/* Relief du Yunnan — relevé réel, lissé, fabriqué par\n'
    + '   outils/relief-wishes.mjs depuis carte/relief.json. Une altitude par\n'
    + '   maille, de `min` à `max` mètres, du coin sud-ouest au coin nord-est.\n'
    + '   Donnée versionnée : ne pas la modifier à la main. */\n'
    + ligne + '\n\n' + ancre);
}
await writeFile(page, html);
console.log('  ' + await direTaille(ligne, min, max, SORTIE));
