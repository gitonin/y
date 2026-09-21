/**
 * Vérifie, dans un vrai navigateur, que les blocs « sur-titre / titre / texte »
 * ont partout les mêmes intervalles.
 *
 * La règle tient en deux mesures, posées dans `src/styles/global.css` :
 *
 *   · sur-titre → titre : --espace-surtitre, soit 12 px ;
 *   · titre → texte     : --espace-titre,    soit 20 px ;
 *
 * et, dans une carte ou une fiche, où la typographie est plus petite, le même
 * empilement se resserre à --espace-carte, soit 8 px, mais reste identique
 * d'une carte à l'autre.
 *
 * Le test parcourt toutes les pages, relève chaque empilement réel et le
 * compare à l'une de ces deux valeurs. Un écart isolé signale une page qui a
 * repris la main sur le réglage commun.
 *
 *   npm run build
 *   node tests/blocs-de-texte.mjs
 */
let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('Playwright est nécessaire pour ce test :  npm i -D playwright');
  process.exit(1);
}
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(RACINE, 'dist');
const PORT = 4399;
const B = `http://localhost:${PORT}`;
const TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.txt': 'text/plain', '.xml': 'application/xml', '.ico': 'image/x-icon',
};
const serveur = createServer((req, res) => {
  let p = join(DIST, decodeURIComponent(req.url.split('?')[0]));
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!existsSync(p)) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream' });
  res.end(readFileSync(p));
});

let ok = 0;
const echecs = [];
const check = (nom, reel, attendu) => {
  if (String(reel) === String(attendu)) { ok++; console.log(`  ok    ${nom} = ${reel}`); }
  else { echecs.push(nom); console.log(`  ÉCHEC ${nom}\n        attendu : ${attendu}\n        obtenu  : ${reel}`); }
};

/* Les deux empilements admis, en pixels. On mesure des cadres, non des marges :
   un grand titre est composé serré (interligne 1,06), si bien que son cadre
   mord de deux ou trois pixels sur ses propres jambages. La tolérance absorbe
   cet écart optique — elle laisse passer un titre serré, jamais une page qui
   aurait repris le réglage à son compte. */
const SECTION = { surtitre: 12, texte: 20 };
const CARTE = { surtitre: 8, texte: 8 };
const TOLERANCE = 3;
const admis = (mesure, cle) =>
  Math.abs(mesure - SECTION[cle]) <= TOLERANCE || Math.abs(mesure - CARTE[cle]) <= TOLERANCE;

/* Le panier et les listes de caractéristiques d'une fiche produit ne sont pas
   des blocs de texte : ce sont des paires libellé / valeur, réglées à part. */
const HORS_PORTEE = '.cart, dl, .specs';

const PAGES = [
  '/fr/', '/fr/cafes/', '/fr/cafes/torch-estate-lot-01/', '/fr/origine/',
  '/fr/pro/', '/fr/contact/', '/fr/journal/', '/fr/journal/pourquoi-le-cafe-du-yunnan/', '/fr/faq/',
  '/en/', '/en/origine/', '/zh/', '/zh/origine/',
];

serveur.listen(PORT);
const navigateur = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

for (const largeur of [390, 1280]) {
  console.log(`\n— ${largeur} px`);
  const pg = await (await navigateur.newContext({ viewport: { width: largeur, height: 900 } })).newPage();

  for (const chemin of PAGES) {
    await pg.goto(B + chemin, { waitUntil: 'domcontentloaded' });
    /* Les blocs arrivent en fondu : on les pose d'emblée pour mesurer au repos. */
    await pg.evaluate(() =>
      document.querySelectorAll('[data-reveal], .reveal-lines').forEach((e) => e.classList.add('is-visible')));
    await pg.waitForTimeout(450);

    const releves = await pg.evaluate((HORS_PORTEE) => {
      const sortie = [];
      const texte = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 28);
      for (const label of document.querySelectorAll('.label')) {
        if (label.closest(HORS_PORTEE)) continue;
        const titre = label.nextElementSibling;
        if (!titre) continue;
        const a = label.getBoundingClientRect();
        const b = titre.getBoundingClientRect();
        /* Côte à côte, et non empilés : ce n'est pas le cas que l'on mesure. */
        if (b.top < a.bottom - 4) continue;
        /* Un sur-titre qui est lui-même un titre de niveau (h2, h3) n'annonce
           pas un titre mais tout un contenu : l'écart attendu est le second. */
        const entete = /^H[1-6]$/.test(label.tagName);
        sortie.push({ cle: entete ? 'texte' : 'surtitre', px: Math.round(b.top - a.bottom), quoi: texte(label) });
        if (entete) continue;

        const suite = titre.nextElementSibling;
        if (!suite) continue;
        const c = suite.getBoundingClientRect();
        if (c.top < b.bottom - 4) continue;
        sortie.push({ cle: 'texte', px: Math.round(c.top - b.bottom), quoi: texte(titre) });
      }
      return sortie;
    }, HORS_PORTEE);

    const fautifs = releves.filter((r) => !admis(r.px, r.cle));
    check(
      `${chemin} — ${releves.length} empilements au réglage commun`,
      fautifs.map((f) => `« ${f.quoi} » : ${f.px} px`).join(' · ') || 'aucun écart',
      'aucun écart',
    );
  }
  await pg.close();
}

console.log(`\n${ok} vérifications passées, ${echecs.length} en échec`);
if (echecs.length) echecs.forEach((e) => console.log('  ·', e));
await navigateur.close();
serveur.close();
process.exit(echecs.length ? 1 : 0);
