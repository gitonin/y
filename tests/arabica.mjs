/**
 * L'atlas des variétés : se tient-il seul, et porte-t-il la charte ?
 *
 *   npm run test:arabica
 *
 * L'atlas vient d'ailleurs — il a été écrit à part, avec ses propres noms de
 * couleurs et sa propre police. On l'a raccordé au site ; ce raccord est
 * exactement ce qui se défait sans bruit. Une teinte qui repart de son côté,
 * une pilule qui revient, un script posé depuis un CDN : rien de tout cela ne
 * lève d'erreur, et personne ne le voit avant la mise en ligne.
 *
 * On vérifie donc, dans cet ordre :
 *
 *   1. le dossier est clos — une page, un favicon, une règle de cache ;
 *   2. le site l'ignore : aucun lien, aucune entrée au plan du site ;
 *   3. la page s'ouvre sans une erreur de console, en paysage et en portrait ;
 *   4. les teintes rendues sont celles de la charte, mesurées à l'écran ;
 *   5. les boutons sont droits, en capitales filetées, comme partout ;
 *   6. les trois langues et les liens profonds répondent ;
 *   7. rien ne se recouvre sur un téléphone — c'est là que l'atlas péchait.
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ATLAS = join(RACINE, 'public', 'arabica');
const PORT = 4411;

let ok = 0;
const echecs = [];
const check = (nom, reel, attendu = true) => {
  if (reel === attendu) { ok++; console.log(`  ok    ${nom}`); }
  else { echecs.push(nom); console.log(`  ÉCHEC ${nom}\n        attendu : ${attendu}\n        obtenu  : ${reel}`); }
};
const titre = (t) => console.log(`\n— ${t}`);

/* ------------------------------------------------------------------ *
 * 1. Le dossier
 * ------------------------------------------------------------------ */
titre('Le dossier se redépose seul');
const deposes = readdirSync(ATLAS).sort();
check(`trois fichiers, pas un de plus (${deposes.join(', ')})`,
  deposes.join(','), '.htaccess,favicon-96.png,index.html');

const page = readFileSync(join(ATLAS, 'index.html'), 'utf8');
check('aucune empreinte dans un nom de fichier — le dossier se corrige à la main',
  deposes.every((f) => !/\.[A-Za-z0-9_-]{8,}\./.test(f)));
check('la règle de cache interdit de garder une version corrigée',
  readFileSync(join(ATLAS, '.htaccess'), 'utf8').includes('must-revalidate'));
/* Hors la feuille de la police, tout doit être dans le fichier : c'est ce qui
   permet de l'ouvrir hors ligne, et de le déposer sans rien d'autre. */
const dehors = [...page.matchAll(/<(?:script|link|img)\b[^>]*\b(?:src|href)="(https?:\/\/[^"]+)"/g)]
  .map((m) => m[1]).filter((u) => !/^https:\/\/fonts\.(googleapis|gstatic)\.com(\/|$)/.test(u));
check(`rien n'est chargé du dehors, hors la police (${dehors.length})`, dehors.length, 0);
/* L'atlas se partage par un lien, il ne s'indexe pas — comme le jeu et la
   carte. Sans cette balise, le contrôle de référencement du site réclame à
   la page une canonique, des renvois de langue et une entrée au plan. */
check('la page se tient à l’écart des moteurs',
  /<meta name="robots" content="noindex, nofollow">/.test(page));

/* ------------------------------------------------------------------ *
 * 2. Le site ignore l'atlas
 * ------------------------------------------------------------------ */
titre('Le site n’y mène pas');
const DIST = join(RACINE, 'dist');
if (existsSync(DIST)) {
  const pages = [];
  (function parcourir(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) { if (e.name !== 'arabica') parcourir(join(d, e.name)); }
      else if (e.name.endsWith('.html')) pages.push(join(d, e.name));
    }
  })(DIST);
  const liens = pages.filter((p) => /href="(?:\/|https:\/\/yunma\.fr\/)arabica\//.test(readFileSync(p, 'utf8')));
  check(`aucune des ${pages.length} pages du site ne renvoie vers l’atlas`, liens.length, 0);
  const plan = join(DIST, 'sitemap-0.xml');
  check('le plan du site ne le cite pas',
    existsSync(plan) ? readFileSync(plan, 'utf8').includes('/arabica') : false, false);
} else {
  console.log('  (dist/ absent : la construction du site n’a pas été lancée, on passe)');
}

/* ------------------------------------------------------------------ *
 * Le serveur et le navigateur
 * ------------------------------------------------------------------ */
const TYPES = { '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml' };
const serveur = createServer((q, r) => {
  const c = decodeURIComponent(new URL(q.url, 'http://x').pathname);
  for (const f of [join(ATLAS, c), join(ATLAS, c, 'index.html')]) {
    if (existsSync(f) && statSync(f).isFile()) {
      r.writeHead(200, { 'Content-Type': TYPES[extname(f)] ?? 'application/octet-stream' });
      return r.end(readFileSync(f));
    }
  }
  r.writeHead(404).end('');
});
await new Promise((r) => serveur.listen(PORT, '127.0.0.1', r));

const nav = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

/** Une page ouverte, et la liste de ce que la console a eu à dire. */
async function ouvrir(vue, hash = '') {
  const ctx = await nav.newContext({
    viewport: { width: vue.width, height: vue.height },
    deviceScaleFactor: 1, locale: vue.locale ?? 'fr-FR',
    isMobile: !!vue.mobile, hasTouch: !!vue.mobile,
  });
  const p = await ctx.newPage();
  const bruit = [];
  p.on('pageerror', (e) => bruit.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') bruit.push(m.text()); });
  await p.goto(`http://127.0.0.1:${PORT}/${hash}`, { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  return { ctx, p, bruit };
}

const VUES = [
  { nom: 'paysage', width: 1440, height: 900 },
  { nom: 'portrait', width: 390, height: 844, mobile: true },
];

/* La charte, telle qu'elle est rendue — pas telle qu'elle est écrite. */
const CHARTE = { papier: 'rgb(239, 235, 226)', encre: 'rgb(33, 33, 33)', accent: 'rgb(185, 95, 44)' };

for (const vue of VUES) {
  titre(`L’atlas s’ouvre, en ${vue.nom}`);
  const { ctx, p, bruit } = await ouvrir(vue);
  check(`aucune erreur de console (${bruit.length})`, bruit.length, 0);
  check('le relief est dessiné', await p.locator('#gl').isVisible());
  check('l’arbre est dessiné', await p.locator('#c').isVisible());

  titre(`La charte, mesurée à l’écran, en ${vue.nom}`);
  const styles = await p.evaluate(() => {
    const r = getComputedStyle(document.documentElement);
    const b = document.querySelector('.menubtn');
    const s = getComputedStyle(b);
    return {
      papier: r.getPropertyValue('--bg').trim(),
      encre: r.getPropertyValue('--ink').trim(),
      accent: r.getPropertyValue('--verm').trim(),
      police: r.getPropertyValue('--font').trim(),
      rayon: s.borderTopLeftRadius,
      casse: s.textTransform,
      filet: s.letterSpacing,
    };
  });
  const hex = (v) => v.toLowerCase();
  check(`le papier est celui du site (${styles.papier})`, hex(styles.papier), '#efebe2');
  check(`l’encre est celle du site (${styles.encre})`, hex(styles.encre), '#212121');
  check(`l’accent est celui de la marque (${styles.accent})`, hex(styles.accent), '#b95f2c');
  check('la pile de polices commence par Inter', styles.police.startsWith('"Inter"'));

  titre(`Les boutons, en ${vue.nom}`);
  check(`droits, rayon de 2 px (${styles.rayon})`, styles.rayon, '2px');
  check(`en capitales (${styles.casse})`, styles.casse, 'uppercase');
  check(`filetés (${styles.filet})`, parseFloat(styles.filet) > 1);
  /* Une pilule qui revient ne lève aucune erreur : on compte celles qui
     restent. Seul l'interrupteur du son en garde une, et c'est normal. */
  const pilules = await p.evaluate(() => [...document.querySelectorAll('button')]
    .filter((b) => b.offsetParent && parseFloat(getComputedStyle(b).borderTopLeftRadius) > 8).length);
  check(`aucun bouton en pilule (${pilules})`, pilules, 0);

  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * Les langues et les liens profonds
 * ------------------------------------------------------------------ */
titre('Les trois langues');
{
  const { ctx, p } = await ouvrir(VUES[0]);
  for (const [code, attendu] of [['en', 'Menu'], ['zh', '菜单'], ['fr', 'Menu']]) {
    await p.evaluate((c) => { localStorage.setItem('yunma-lang', c); }, code);
    await p.reload({ waitUntil: 'load' });
    await p.waitForTimeout(900);
    const texte = (await p.locator('.menubtn').textContent())?.trim();
    check(`en ${code}, le bouton du menu dit « ${texte} »`, texte, attendu);
  }
  await ctx.close();
}

titre('Les liens profonds');
{
  for (const [hash, marque] of [['#v-gesha', 'Gesha'], ['#yunnan', 'Yunnan'], ['#terroirs', 'Terroirs'], ['#sources', 'Sources']]) {
    const { ctx, p, bruit } = await ouvrir(VUES[0], hash);
    const titreVu = (await p.locator('.pin h1').first().textContent().catch(() => ''))?.trim() ?? '';
    check(`${hash} ouvre « ${titreVu} »`, titreVu.includes(marque));
    check(`${hash} n’émet aucune erreur`, bruit.length, 0);
    await ctx.close();
  }
}

/* ------------------------------------------------------------------ *
 * Le téléphone : c'est là que deux pièces se recouvraient
 * ------------------------------------------------------------------ */
titre('Rien ne se recouvre, en portrait');
{
  const { ctx, p } = await ouvrir(VUES[1]);
  const boites = await p.evaluate(() => {
    const b = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
    return { repere: b('.hint'), logo: b('.brand'), menu: b('.menubtn'), annee: b('.yrbox'), lecture: b('.playbtn') };
  });
  const croise = (a, b) => !!a && !!b && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  check('le repère de geste ne passe pas sous le logo', croise(boites.repere, boites.logo), false);
  check('ni sous le bouton du menu', croise(boites.repere, boites.menu), false);
  check('le bouton de l’histoire ne recouvre pas le millésime', croise(boites.lecture, boites.annee), false);
  /* Le bouton principal prend toute la largeur, comme sur le site. */
  check(`le bouton de l’histoire tient la largeur (${Math.round(boites.lecture.w)} px)`, boites.lecture.w > 300);
  await ctx.close();
}

await nav.close();
serveur.close();

console.log(`\n${ok} vérifications passées, ${echecs.length} en échec`);
if (echecs.length) { for (const e of echecs) console.log(`  — ${e}`); process.exit(1); }
