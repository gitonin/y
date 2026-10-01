/**
 * Vérifie qu'un changement de langue garde la page où l'on est.
 *
 * Le piège est le sous-dossier de déploiement. En production le site vit à la
 * racine du domaine et tout va bien ; sur l'aperçu il vit sous « /y/v4/ », et
 * un code qui cherche la langue en tête du chemin brut ne la trouve plus. Il
 * prend alors chaque page pour une page hors structure et renvoie à l'accueil.
 *
 * Ce contrôle est donc à passer sur un dossier construit AVEC un sous-dossier :
 *
 *   BASE_PATH=/y/v4/ npm run build && node tests/langues.mjs
 *
 * Il se passe de toute connaissance du préfixe : il compare le chemin d'une
 * page à celui que ses renvois de langue désignent, et n'exige un renvoi que
 * lorsque la page existe vraiment dans l'autre langue.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'dist');
const LANGUES = ['fr', 'en', 'zh'];

let ok = 0;
const echecs = [];

/* Toutes les pages rangées sous une langue : les passerelles Shopify, la 404 et
   la planche des composants n'ont pas de version traduite. */
const pages = [];
(function parcourir(d) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) parcourir(p);
    else if (e === 'index.html') {
      const rel = p.slice(DIST.length).replace(/\\/g, '/').replace(/index\.html$/, '');
      const m = rel.match(/^(.*\/)(fr|en|zh)\/(.*)$/);
      if (m) pages.push({ rel, base: m[1], lang: m[2], reste: m[3], html: readFileSync(p, 'utf8') });
    }
  }
})(DIST);

console.log(`— ${pages.length} pages rangées sous une langue`);
if (pages.length === 0) {
  console.log('  ÉCHEC aucune page trouvée : le dossier dist est-il construit ?');
  process.exit(1);
}

/* Les deux endroits où l'on change de langue portent la même marque : un
   attribut hreflang. On les lit ensemble — l'en-tête, le menu, et les balises
   que lisent les moteurs. */
const renvois = (html) => [
  ...[...html.matchAll(/<a href="([^"]+)" hreflang="([^"]+)"/g)].map((m) => m[1]),
  ...[...html.matchAll(/<link rel="alternate" hreflang="[^"]+" href="([^"]+)"/g)].map((m) => m[1]),
];

let verifies = 0;
let renvoyeuses = 0;
for (const p of pages) {
  const cibles = renvois(p.html).map((h) => h.replace(/^https?:\/\/[^/]+/, ''));
  const sien = `/${p.lang}/${p.reste}`;

  /* Le sous-dossier de déploiement n'existe que dans les adresses écrites : le
     dossier construit, lui, commence à la racine. On le déduit du renvoi que la
     page fait vers elle-même, plutôt que de le recevoir en paramètre — ainsi le
     contrôle vaut pour la production comme pour n'importe quel aperçu. */
  const propre = cibles.find((c) => c.endsWith(sien));
  if (!propre) {
    /* Les anciennes adresses conservées ne sont que des renvois : une balise
       refresh et rien d'autre, ni en-tête ni sélecteur de langue. Les exiger
       ici reviendrait à leur demander d'être des pages. */
    if (/<meta http-equiv="refresh"/.test(p.html)) { renvoyeuses++; continue; }
    echecs.push(`${p.rel} ne se désigne pas elle-même`);
    console.log(`  ÉCHEC ${p.rel} n'a aucun renvoi vers sa propre langue`);
    continue;
  }
  const prefixe = propre.slice(0, propre.length - sien.length);

  for (const autre of LANGUES.filter((l) => l !== p.lang)) {
    const chemin = `/${autre}/${p.reste}`;
    /* On n'exige le renvoi que si la page existe dans l'autre langue : un
       article non traduit mène légitimement ailleurs. */
    if (!existsSync(join(DIST, chemin, 'index.html'))) continue;
    const attendu = prefixe + chemin;
    if (cibles.includes(attendu)) { verifies++; continue; }
    const vus = [...new Set(cibles.filter((c) => c.includes(`/${autre}/`)))].join(', ') || 'aucun';
    echecs.push(`${p.rel} → ${autre}`);
    console.log(`  ÉCHEC ${p.rel}\n        attendu : ${attendu}\n        obtenu  : ${vus}`);
  }
  ok++;
}

console.log(`  ${verifies} renvois de langue vérifiés, chacun sur la page où l'on est`);
console.log(`  ${renvoyeuses} anciennes adresses écartées : ce sont de simples renvois`);
console.log(`\n${ok + verifies} vérifications passées, ${echecs.length} en échec`);
process.exit(echecs.length ? 1 : 0);
