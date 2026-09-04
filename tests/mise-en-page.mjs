/**
 * Vérifie la tenue du haut de page dans un vrai navigateur :
 *
 *   · le titre de l'accueil se cale exactement comme celui des autres pages
 *     (même hauteur, même retrait à gauche, même corps, même couleur) ;
 *   · il reste lisible sur la photographie, quelle que soit la forme de la
 *     fenêtre — c'est le cadrage de l'image qui change, pas la lisibilité ;
 *   · l'invitation à défiler est présente sur mobile comme sur ordinateur.
 *
 *   npm run build
 *   npm i -D playwright        (une seule fois)
 *   node tests/mise-en-page.mjs
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
const PORT = 4398;
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
const titre = (t) => console.log(`\n— ${t}`);

/* Luminance relative et rapport de contraste, tels que définis par les WCAG. */
const lum = (r, g, b) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contraste = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const ENCRE = lum(33, 33, 33);

serveur.listen(PORT);
const navigateur = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

/* --------------------------------- 1. le titre de l'accueil et celui des autres pages */
titre('Le titre de l’accueil se cale comme celui des autres pages');
const repere = async (pg, chemin) => {
  await pg.goto(B + chemin, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(250);
  return pg.evaluate(() => {
    const h1 = document.querySelector('h1');
    const r = h1.getBoundingClientRect();
    const ligne = h1.querySelector('span span') ?? h1;
    return {
      haut: Math.round(r.top),
      gauche: Math.round(r.left),
      corps: getComputedStyle(ligne).fontSize,
      couleur: getComputedStyle(h1).color,
    };
  });
};
for (const largeur of [360, 390, 600, 768, 900, 1024, 1280, 1440, 1920]) {
  const pg = await (await navigateur.newContext({ viewport: { width: largeur, height: 900 } })).newPage();
  const accueil = await repere(pg, '/fr/');
  const autre = await repere(pg, '/fr/origine/');
  /* Deux pixels de tolérance : les deux mises en page empilent des marges
     élastiques dont les paliers ne tombent pas tout à fait au même endroit. */
  const ecart = Math.abs(accueil.haut - autre.haut);
  check(`${largeur} px — hauteur du titre (écart ${ecart} px)`, ecart <= 2, true);
  check(`${largeur} px — retrait à gauche`, accueil.gauche, autre.gauche);
  check(`${largeur} px — corps du titre`, accueil.corps, autre.corps);
  check(`${largeur} px — couleur du titre`, accueil.couleur, autre.couleur);
  await pg.close();
}

/* --------------------------------- 2. lisibilité du titre sur la photographie */
titre('Le titre reste lisible sur la photographie');
const enPixels = (pg, base64) => pg.evaluate(async (d) => {
  const img = new Image();
  img.src = 'data:image/png;base64,' + d;
  await img.decode();
  const cv = document.createElement('canvas');
  cv.width = img.width; cv.height = img.height;
  cv.getContext('2d').drawImage(img, 0, 0);
  return Array.from(cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data);
}, base64);

for (const [w, h] of [[390, 844], [390, 667], [768, 1024], [1024, 768], [1440, 900], [1440, 700], [1920, 1080]]) {
  const pg = await (await navigateur.newContext({ viewport: { width: w, height: h } })).newPage();
  await pg.goto(`${B}/fr/`, { waitUntil: 'networkidle' });
  await pg.waitForTimeout(700);
  const zone = await pg.evaluate(() => {
    const t = document.querySelector('h1').getBoundingClientRect();
    const c = document.querySelector('.hero__cta').getBoundingClientRect();
    return { x: Math.round(t.x), y: Math.round(t.y), width: Math.round(Math.max(t.width, c.width)), height: Math.round(c.bottom - t.top) };
  });
  const avec = await enPixels(pg, (await pg.screenshot({ clip: zone })).toString('base64'));
  await pg.evaluate(() => { document.querySelector('.hero__inner').style.visibility = 'hidden'; });
  await pg.waitForTimeout(120);
  const sans = await enPixels(pg, (await pg.screenshot({ clip: zone })).toString('base64'));

  let pire = Infinity;
  for (let i = 0; i < avec.length; i += 4) {
    /* Un pixel appartient à une lettre si le masquage du texte l'a changé. */
    const diff = Math.abs(avec[i] - sans[i]) + Math.abs(avec[i + 1] - sans[i + 1]) + Math.abs(avec[i + 2] - sans[i + 2]);
    if (diff < 90) continue;                       // on écarte les bords adoucis
    pire = Math.min(pire, contraste(ENCRE, lum(sans[i], sans[i + 1], sans[i + 2])));
  }
  check(`${w}×${h} — contraste minimal ${pire.toFixed(2)}:1 (seuil 4,5)`, pire >= 4.5, true);
  await pg.close();
}

/* --------------------------------- 3. invitation à défiler */
titre('L’invitation à défiler accompagne la première page');
for (const [w, h, appareil] of [[390, 844, 'mobile'], [768, 1024, 'tablette'], [1440, 900, 'ordinateur']]) {
  const pg = await (await navigateur.newContext({ viewport: { width: w, height: h } })).newPage();
  await pg.goto(`${B}/fr/`, { waitUntil: 'networkidle' });
  await pg.waitForTimeout(400);
  const cue = pg.locator('.hero__scroll');
  check(`${appareil} — repère « défiler » affiché`, await cue.isVisible(), true);
  const anime = await cue.evaluate((el) => getComputedStyle(el).animationName);
  check(`${appareil} — repère animé`, anime !== 'none', true);
  await pg.close();
}

console.log(`\n${ok} vérifications passées, ${echecs.length} en échec`);
if (echecs.length) echecs.forEach((e) => console.log('  ·', e));
await navigateur.close();
serveur.close();
process.exit(echecs.length ? 1 : 0);
