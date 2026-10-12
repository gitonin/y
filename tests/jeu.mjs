/**
 * Le jeu du cheval des nuages : son dossier se tient-il tout seul ?
 *
 *   npm run test:jeu
 *
 * Le jeu n'appartient pas au site. Il ne figure dans aucun menu, dans aucun
 * plan du site, et aucune page n'y mène : on y entre par un lien que l'on
 * partage. Surtout, il doit se corriger seul — redéposer `jeu/` sur le
 * serveur, sans reconstruire ni retoucher les cent fichiers du site.
 *
 * C'est exactement ce que vérifie ce fichier, en trois temps :
 *
 *   1. le dossier est clos : rien n'y pointe vers l'extérieur, sauf le lien
 *      de retour à la boutique, et il n'emprunte aucun fichier à empreinte
 *      du site, dont le nom changerait à la prochaine construction ;
 *   2. les bonnes réponses ne sont pas servies. Elles ne sont ni dans la
 *      page, ni dans le script, ni dans un fichier que l'on peut demander —
 *      sans quoi il suffisait d'ouvrir une adresse pour gagner ;
 *   3. une partie se joue vraiment : deux téléphones, un code, dix
 *      questions, un podium. PHP sert le dossier tel qu'il sera déposé.
 *
 * Le troisième temps est le seul qui prouve quelque chose d'utile : un
 * dossier qui a l'air autonome et qui ne tourne pas ne vaut rien.
 */
import { execFileSync, spawn } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync, rmSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const JEU = join(RACINE, 'public', 'jeu');
const SORTIE = 'dist-jeu';
const PORT = 4408;
const LANGUES = ['fr', 'en', 'zh'];

let ok = 0;
const echecs = [];
const check = (nom, reel, attendu = true) => {
  if (reel === attendu) {
    ok++;
    console.log(`  ok    ${nom}`);
  } else {
    echecs.push(nom);
    console.log(`  ÉCHEC ${nom}\n        attendu : ${attendu}\n        obtenu  : ${reel}`);
  }
};
const titre = (t) => console.log(`\n— ${t}`);

const lire = (...p) => readFile(join(...p), 'utf8');

/** Tous les fichiers du dossier, chemins relatifs, dossiers compris. */
async function fichiers(base, prefixe = '') {
  const sortie = [];
  for (const e of await readdir(base, { withFileTypes: true })) {
    const rel = prefixe ? `${prefixe}/${e.name}` : e.name;
    if (e.isDirectory()) sortie.push(...(await fichiers(join(base, e.name), rel)));
    else sortie.push(rel);
  }
  return sortie.sort();
}

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

const main = async () => {
  /* Le dossier est fabriqué, jamais suivi : on le refait avant de le juger. */
  execFileSync('node', ['outils/construire-jeu.mjs'], { cwd: RACINE, stdio: 'pipe' });

  /* ================================================================ *
   * 1. Le dossier est-il clos ?
   * ================================================================ */
  titre('Ce que contient le dossier');
  const presents = await fichiers(JEU);
  for (const f of [
    '.htaccess',
    'api.php',
    'questions.php',
    'index.html',
    'jeu.css',
    'jeu.js',
    'poincon.svg',
    'favicon-96.png',
    ...LANGUES.map((l) => `${l}/index.html`),
  ]) {
    check(f, presents.includes(f));
  }
  check('rien de plus', presents.length, 11);
  check('plus de questions.json servi', presents.includes('questions.json'), false);

  titre('Les pages ne sortent pas du dossier');
  const pages = {};
  for (const langue of LANGUES) pages[langue] = await lire(JEU, langue, 'index.html');
  const porte = await lire(JEU, 'index.html');
  const js = await lire(JEU, 'jeu.js');
  const css = await lire(JEU, 'jeu.css');

  for (const [langue, html] of Object.entries(pages)) {
    /* Une adresse absolue briserait le dossier dès qu'il changerait de place
       — et il vit déjà à deux endroits, la racine du domaine et /y/v4/. */
    const absolues = [...html.matchAll(/(?:src|href)="(\/[^"]*)"/g)].map((m) => m[1]);
    check(`${langue} — aucune adresse absolue`, absolues.join(', '), '');
    /* Un fichier à empreinte du site changerait de nom à la construction
       suivante : le jeu ne tiendrait plus sans redéposer le site entier. */
    check(`${langue} — rien d'emprunté à _astro`, html.includes('_astro'), false);
    check(`${langue} — aucune clé laissée en place`, /\{\{\w+\}\}/.test(html), false);
    check(`${langue} — hors des moteurs`, html.includes('name="robots" content="noindex, nofollow"'));
    check(`${langue} — sa feuille et son script`, html.includes('../jeu.css') && html.includes('../jeu.js'));
    check(`${langue} — son serveur voisin`, html.includes('data-api="../api.php"'));
  }
  check('la porte reste dans le dossier', /(?:src|href)="\//.test(porte), false);
  check('le script ne cherche rien dehors', js.includes('_astro'), false);
  check('la feuille porte la charte du site', css.includes('--paper: #efebe2'));
  check('et les styles du jeu', css.includes('.jeu__grand-code'));

  titre('Les trois langues sont bien les trois langues');
  const contenu = JSON.parse(await lire(RACINE, 'contenu', 'textes.json'));
  for (const langue of LANGUES) {
    const j = contenu.site[langue].jeu;
    check(`${langue} — son titre`, pages[langue].includes(j.titre.replace(/&/g, '&amp;')));
    check(`${langue} — sa langue déclarée`, pages[langue].includes(`lang="${contenu.site[langue].meta.htmlLang}"`));
    check(`${langue} — ses textes pour le script`, pages[langue].includes(JSON.stringify(j.classement).slice(1, -1)));
  }

  /* ================================================================ *
   * 2. Les bonnes réponses restent au serveur
   * ================================================================ */
  titre('Les bonnes réponses ne sont pas servies');
  const jeuJson = JSON.parse(await lire(RACINE, 'contenu', 'jeu.json'));
  const premiere = jeuJson.questions[0];
  const bonne = premiere.reponses[premiere.bonne].fr;
  check('aucun énoncé dans la page', pages.fr.includes(premiere.enonce.fr), false);
  check('aucune réponse dans la page', pages.fr.includes(bonne), false);
  check('aucune réponse dans le script', js.includes(bonne), false);
  check('les questions sont du PHP, pas du JSON', (await lire(JEU, 'questions.php')).startsWith('<?php'));

  /* ================================================================ *
   * 3. Le site, lui, ignore le jeu
   * ================================================================ */
  titre('Le site ne mène pas au jeu');
  execFileSync('npx', ['astro', 'build', '--outDir', SORTIE], {
    cwd: RACINE,
    stdio: 'pipe',
    env: { ...process.env, SITE_URL: 'https://yunma.fr' },
  });
  const dist = join(RACINE, SORTIE);
  const htmls = (await fichiers(dist)).filter((f) => f.endsWith('.html') && !f.startsWith('jeu/'));
  let liens = 0;
  for (const f of htmls) {
    const html = await lire(dist, f);
    if (/href="[^"]*\/jeu\//.test(html)) {
      liens++;
      console.log(`        ${f} mène au jeu`);
    }
  }
  check(`aucun lien vers le jeu dans ${htmls.length} pages`, liens, 0);
  const plan = await lire(dist, 'sitemap-0.xml');
  check('absent du plan du site', plan.includes('/jeu/'), false);
  check('le dossier part avec le site', existsSync(join(dist, 'jeu', 'api.php')));
  check('et son serveur aussi', existsSync(join(dist, 'jeu', 'questions.php')));

  /* ================================================================ *
   * 4. Une partie se joue
   * ================================================================ */
  titre('Deux téléphones, une partie');
  rmSync(join(JEU, 'parties.sqlite'), { force: true });
  const serveur = spawn('php', ['-S', `127.0.0.1:${PORT}`, '-t', JEU], { cwd: JEU, stdio: 'pipe' });
  const { chromium } = await import('playwright');
  const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  try {
    await attendre(700);
    const base = `http://127.0.0.1:${PORT}`;

    /* L'hôte crée la partie et donne son prénom. */
    const hote = await (await nav.newContext({ locale: 'fr-FR' })).newPage();
    await hote.goto(`${base}/fr/`);
    check('la page du jeu s’ouvre', await hote.locator('[data-ecran="accueil"] h1').isVisible());
    await hote.click('[data-creer]');
    await hote.fill('#jeu-nom', 'Antonin');
    await hote.click('[data-form-nom] button');
    await hote.waitForSelector('[data-ecran="salon"]:not([hidden])', { timeout: 8000 });
    const code = (await hote.locator('[data-code]').textContent()).trim();
    check('un code de quatre signes', /^[A-Z2-9]{4}$/.test(code), true);

    /* Le second entre avec le code. */
    const amie = await (await nav.newContext({ locale: 'fr-FR' })).newPage();
    await amie.goto(`${base}/fr/?p=${code}`);
    await amie.waitForSelector('[data-ecran="nom"]:not([hidden])', { timeout: 8000 });
    check('le lien d’invitation saute l’accueil', await amie.locator('[data-ecran="accueil"]').isVisible(), false);
    check('et rappelle le code', (await amie.locator('[data-code-rappel]').textContent()).trim(), code);
    await amie.fill('#jeu-nom', 'Camille');
    await amie.click('[data-form-nom] button');
    await amie.waitForSelector('[data-ecran="salon"]:not([hidden])', { timeout: 8000 });

    await hote.waitForFunction(
      () => document.querySelectorAll('[data-joueurs] .jeu__joueur').length === 2,
      null,
      { timeout: 8000 },
    );
    check('l’hôte voit les deux joueurs', await hote.locator('[data-joueurs] .jeu__joueur').count(), 2);
    check('et lui seul peut lancer', await hote.locator('[data-lancer]').isVisible());
    check('l’invitée attend', await amie.locator('[data-lancer]').isVisible(), false);

    /* La partie entière, dix questions, chacun répondant à son tour. */
    await hote.click('[data-lancer]');
    let posees = 0;
    for (let n = 1; n <= 10; n++) {
      for (const page of [hote, amie]) {
        await page.waitForSelector('[data-ecran="question"]:not([hidden])', { timeout: 10000 });
      }
      posees++;
      const enonce = await hote.locator('[data-enonce]').textContent();
      check(`question ${n} — un énoncé`, enonce.trim().length > 10);
      /* L'hôte prend la première réponse, l'invitée la deuxième : l'un des
         deux a raison, et les scores doivent finir par les séparer. */
      await hote.locator('[data-reponses] .jeu__reponse').nth(0).click();
      await amie.locator('[data-reponses] .jeu__reponse').nth(1).click();
      for (const page of [hote, amie]) {
        await page.waitForSelector('[data-ecran="revelation"]:not([hidden])', { timeout: 10000 });
      }
      check(`question ${n} — la bonne réponse est dite`, (await hote.locator('[data-bonne]').textContent()).trim().length > 0);
      /* Le même bouton enchaîne et conclut : seul son texte change. */
      await hote.click('[data-suivante]');
    }
    check('dix questions, pas plus', posees, 10);

    for (const page of [hote, amie]) {
      await page.waitForSelector('[data-ecran="fin"]:not([hidden])', { timeout: 10000 });
    }
    check('le podium s’affiche', await hote.locator('[data-podium] .jeu__joueur').count(), 2);
    check('avec un niveau', (await hote.locator('[data-niveau]').textContent()).trim().length > 0);
    const scores = await hote.locator('[data-podium] .jeu__score').allTextContents();
    check('et des scores', scores.length, 2);
    check('le retour à la boutique reste relatif', await hote.locator('[data-ecran="fin"] a.link').getAttribute('href'), '../../fr/cafes/');

    /* Les réponses ne doivent pas se demander en passant par la bande. */
    const direct = await hote.evaluate(async () => {
      const r = await fetch('../questions.php');
      return { code: r.status, texte: (await r.text()).slice(0, 200) };
    });
    check('questions.php ne rend pas les réponses', direct.texte.includes('bonne'), false);

    /* Une panne du serveur doit rester du JSON. Le téléphone n'attend que
       cela : une page d'erreur de PHP le laisserait sur « Connexion perdue »
       sans fin, et sans que personne sache pourquoi. On casse donc la base
       pour de bon — un dossier à la place du fichier — et l'on regarde ce
       qui sort. */
    titre('Une panne reste du JSON');
    serveur.kill();
    await attendre(300);
    /* La partie qu'on vient de jouer a laissé sa base : on la remplace par un
       dossier du même nom, que SQLite ne saura pas ouvrir. */
    for (const suffixe of ['', '-wal', '-shm']) {
      rmSync(join(JEU, `parties.sqlite${suffixe}`), { recursive: true, force: true });
    }
    mkdirSync(join(JEU, 'parties.sqlite'));
    const casse = spawn('php', ['-S', `127.0.0.1:${PORT + 1}`, '-t', JEU], { cwd: JEU, stdio: 'pipe' });
    try {
      await attendre(700);
      const rep = await fetch(`http://127.0.0.1:${PORT + 1}/api.php?a=creer`, { method: 'POST', body: '{}' });
      check('le serveur refuse proprement', rep.status, 500);
      check('et le dit en JSON', rep.headers.get('content-type')?.startsWith('application/json'));
      const corps = await rep.json();
      check('avec une phrase pour le joueur', typeof corps.erreur === 'string' && corps.erreur.length > 10);
      check('et sans détail technique', /SQLSTATE|PDO|Fatal|Stack trace/.test(JSON.stringify(corps)), false);
    } finally {
      casse.kill();
      rmSync(join(JEU, 'parties.sqlite'), { recursive: true, force: true });
    }
  } finally {
    await nav.close();
    serveur.kill();
    rmSync(join(RACINE, SORTIE), { recursive: true, force: true });
    rmSync(join(JEU, 'parties.sqlite'), { force: true });
    rmSync(join(JEU, 'parties.sqlite-wal'), { force: true });
    rmSync(join(JEU, 'parties.sqlite-shm'), { force: true });
  }

  console.log(`\n${ok} vérifications passées, ${echecs.length} en échec`);
  process.exit(echecs.length ? 1 : 0);
};

main();
