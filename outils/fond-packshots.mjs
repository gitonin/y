/**
 * Relève la couleur de fond de chaque packshot.
 *
 * La fiche produit ouvre sur une bande pleine largeur ; pour que le raccord
 * entre la photographie et la bande ne se voie pas, la bande reprend la
 * couleur du fond de la photographie. Les six visuels n'ont pas tout à fait le
 * même beige, d'où ce relevé, référence par référence.
 *
 * À relancer après tout remplacement d'un visuel produit, puis reporter les
 * valeurs dans `src/data/packshots.ts` :
 *
 *   node outils/fond-packshots.mjs
 */
import sharp from 'sharp';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const DOSSIER = 'src/assets/produits';

/* Les quatre coins plutôt qu'un seul : un packshot porte souvent une ombre
   portée d'un côté, et la moyenne d'un unique coin la ferait passer pour le
   fond. La médiane des quatre l'écarte. */
const COIN = 48;

const mediane = (valeurs) => {
  const tri = [...valeurs].sort((a, b) => a - b);
  const m = tri.length >> 1;
  return tri.length % 2 ? tri[m] : Math.round((tri[m - 1] + tri[m]) / 2);
};

const fichiers = readdirSync(DOSSIER).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
console.log('Couleurs de fond relevées :\n');

for (const fichier of fichiers.sort()) {
  const image = sharp(join(DOSSIER, fichier));
  const { width, height } = await image.metadata();
  const coins = [
    { left: 0, top: 0 },
    { left: width - COIN, top: 0 },
    { left: 0, top: height - COIN },
    { left: width - COIN, top: height - COIN },
  ];

  const releves = [];
  for (const coin of coins) {
    const { channels } = await image.clone().extract({ ...coin, width: COIN, height: COIN }).stats();
    releves.push(channels.slice(0, 3).map((c) => c.mean));
  }

  const rgb = [0, 1, 2].map((i) => mediane(releves.map((r) => Math.round(r[i]))));
  const hex = `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  console.log(`  '${fichier.replace(/\.[^.]+$/, '')}': '${hex}',`);
}

console.log('\nÀ reporter dans la table `fonds` de src/data/packshots.ts.');
