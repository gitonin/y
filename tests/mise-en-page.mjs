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

/* --------------------------------- 4. blocs de fin partagés */
titre('La bande pro et l’image de fin closent aussi la page des cafés');
{
  const releve = async (pg, chemin) => {
    await pg.goto(B + chemin, { waitUntil: 'networkidle' });
    await pg.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight * 0.5) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 100));
      }
      window.scrollTo(0, document.body.scrollHeight);
    });
    await pg.waitForTimeout(900);
    return pg.evaluate(() => {
      const decrire = (el) => el && {
        hauteur: Math.round(el.getBoundingClientRect().height),
        fond: getComputedStyle(el).backgroundColor,
        texte: el.innerText.replace(/\s+/g, ' ').trim(),
        lien: el.querySelector('a')?.getAttribute('href'),
      };
      const pro = document.querySelector('.pro-band');
      const fin = document.querySelector('.closing');
      const pied = document.querySelector('footer');
      return {
        pro: decrire(pro),
        fin: decrire(fin),
        /* l'infolettre vit dans le pied de page : les deux blocs la précèdent */
        avantLePied: !!pro && !!fin && !!pied
          && !!(pro.compareDocumentPosition(pied) & Node.DOCUMENT_POSITION_FOLLOWING)
          && !!(fin.compareDocumentPosition(pied) & Node.DOCUMENT_POSITION_FOLLOWING)
          && !!(pro.compareDocumentPosition(fin) & Node.DOCUMENT_POSITION_FOLLOWING),
      };
    });
  };

  for (const [w, h, appareil] of [[1440, 900, 'ordinateur'], [390, 844, 'mobile']]) {
    const pg = await (await navigateur.newContext({ viewport: { width: w, height: h } })).newPage();
    const accueil = await releve(pg, '/fr/');
    const cafes = await releve(pg, '/fr/cafes/');
    for (const [nom, cle] of [['bande pro', 'pro'], ['image de fin', 'fin']]) {
      check(`${appareil} — ${nom} présente sur la page des cafés`, !!cafes[cle], true);
      check(`${appareil} — ${nom}, même hauteur qu’à l’accueil`, cafes[cle]?.hauteur, accueil[cle]?.hauteur);
      check(`${appareil} — ${nom}, même fond`, cafes[cle]?.fond, accueil[cle]?.fond);
      check(`${appareil} — ${nom}, même texte`, cafes[cle]?.texte, accueil[cle]?.texte);
      check(`${appareil} — ${nom}, même lien`, cafes[cle]?.lien, accueil[cle]?.lien);
    }
    check(`${appareil} — les deux blocs précèdent l’infolettre`, cafes.avantLePied, true);
    await pg.close();
  }
}

/* --------------------------------- 5. signature défilante */
titre('La signature défile en bas de chaque page');
{
  const decalage = (pg) => pg.evaluate(() => {
    const m = new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.sig__piste')).transform);
    return m.m41;
  });

  for (const [w, h, appareil] of [[1440, 900, 'ordinateur'], [390, 844, 'mobile']]) {
    const pg = await (await navigateur.newContext({ viewport: { width: w, height: h } })).newPage();
    /* la bande vit dans le pied de page : elle doit être là sur toutes les pages */
    for (const chemin of ['/fr/', '/fr/cafes/', '/fr/origine/', '/fr/journal/', '/en/cafes/', '/zh/']) {
      await pg.goto(B + chemin, { waitUntil: 'domcontentloaded' });
      await pg.waitForTimeout(200);
      const etat = await pg.evaluate(() => {
        const sig = document.querySelector('.sig');
        const piste = document.querySelector('.sig__piste');
        const groupes = document.querySelectorAll('.sig__groupe');
        const base = document.querySelector('.ft__base');
        return sig && piste && base ? {
          groupes: groupes.length,
          identiques: groupes[0]?.innerHTML === groupes[1]?.innerHTML,
          groupePlusLargeQueLEcran: groupes[0].getBoundingClientRect().width > window.innerWidth,
          avantLeCopyright: !!(sig.compareDocumentPosition(base) & Node.DOCUMENT_POSITION_FOLLOWING),
          debordement: document.documentElement.scrollWidth > window.innerWidth,
        } : null;
      });
      check(`${appareil} — ${chemin} : bande présente, avant le copyright`, !!etat?.avantLeCopyright, true);
      check(`${appareil} — ${chemin} : deux groupes identiques (boucle sans couture)`, etat?.groupes === 2 && etat?.identiques, true);
      check(`${appareil} — ${chemin} : un groupe couvre l’écran`, etat?.groupePlusLargeQueLEcran, true);
      check(`${appareil} — ${chemin} : pas de débordement horizontal`, etat?.debordement, false);
    }

    /* vitesse réelle, mesurée sur deux secondes */
    await pg.goto(`${B}/fr/`, { waitUntil: 'networkidle' });
    await pg.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await pg.waitForTimeout(500);
    const avant = await decalage(pg);
    await pg.waitForTimeout(2000);
    const apres = await decalage(pg);
    const vitesse = (avant - apres) / 2;
    check(`${appareil} — défile vers la gauche à ${vitesse.toFixed(0)} px/s (entre 18 et 35)`, vitesse > 18 && vitesse < 35, true);

    /* Le lettrage fourni par la marque, une fois par motif ; les répétitions
       sont séparées par un large blanc. */
    const motif = await pg.evaluate(() => {
      const m = document.querySelector('.sig__motif');
      const signe = m.querySelector('.sig__signe');
      return {
        signes: m.querySelectorAll('.sig__signe').length,
        vectoriel: !!signe && signe.getAttribute('src').endsWith('.svg') && signe.naturalWidth > 0,
        blanc: parseFloat(getComputedStyle(m).paddingRight),
        texte: parseFloat(getComputedStyle(m).fontSize),
      };
    });
    check(`${appareil} — un seul lettrage par motif`, motif.signes, 1);
    check(`${appareil} — le lettrage est le SVG de la marque, bien chargé`, motif.vectoriel, true);
    check(`${appareil} — le blanc entre motifs dépasse deux cadratins (${motif.blanc.toFixed(0)} px)`, motif.blanc > motif.texte * 2, true);
    await pg.close();
  }

  /* immobile pour qui a demandé à réduire les animations */
  const calme = await (await navigateur.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })).newPage();
  await calme.goto(`${B}/fr/`, { waitUntil: 'networkidle' });
  await calme.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await calme.waitForTimeout(400);
  const a = await decalage(calme);
  await calme.waitForTimeout(1200);
  const b2 = await decalage(calme);
  check('animations réduites — la bande reste immobile', Math.abs(b2 - a) < 1, true);
  /* et le texte n'est annoncé qu'une fois */
  const lecture = await calme.evaluate(() => ({
    annonce: document.querySelector('.sig .visually-hidden')?.textContent.trim(),
    masquee: document.querySelector('.sig__piste')?.getAttribute('aria-hidden'),
  }));
  check('le texte est annoncé une seule fois', lecture.annonce, 'Slow Coffee — Slow Life');
  check('les répétitions sont masquées aux lecteurs d’écran', lecture.masquee, 'true');

  /* Le logo est désormais vectoriel, à l'identique en taille. */
  const logos = await calme.evaluate(() =>
    [...document.querySelectorAll('.hd__logo img, .ft__logo img')].map((i) => ({
      svg: i.getAttribute('src').endsWith('.svg'),
      charge: i.naturalWidth > 0,
    })),
  );
  check('les logos sont vectoriels', logos.length > 0 && logos.every((l) => l.svg), true);
  check('les logos sont bien chargés', logos.every((l) => l.charge), true);

  /* Le logo du pied de page a été agrandi de moitié : 54 px à l'origine. */
  const hauteurLogo = await calme.evaluate(() => Math.round(document.querySelector('.ft__logo img').getBoundingClientRect().height));
  check('logo du pied de page agrandi de 50 %', hauteurLogo, 81);
  await calme.close();
}

console.log(`\n${ok} vérifications passées, ${echecs.length} en échec`);
if (echecs.length) echecs.forEach((e) => console.log('  ·', e));
await navigateur.close();
serveur.close();
process.exit(echecs.length ? 1 : 0);
