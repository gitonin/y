/**
 * La carte du relief : se tient-elle seule, et se voit-elle ?
 *
 *   npm run test:carte
 *
 * Comme le jeu, la carte n'appartient pas au site : aucun menu n'y mène, elle
 * ne figure pas au plan du site, et elle doit se redéposer seule. Mais elle a
 * une difficulté que le jeu n'avait pas — elle est dessinée, et un dessin peut
 * être présent, sans erreur, et illisible. Trois des quatre fautes trouvées en
 * la construisant étaient de ce genre : des repères de la couleur du relief,
 * une légende par-dessus le texte, un cadrage qui laissait les deux tiers de
 * l'écran vides. Aucune ne déclenchait la moindre erreur.
 *
 * On mesure donc la capture, et pas seulement le code :
 *
 *   1. le dossier est clos, et le site l'ignore ;
 *   2. les teintes du relief sont les mêmes dans la feuille et dans le
 *      script, et la carte reste monochrome : aucune couleur ne code
 *      l'altitude, ce sont les courbes et l'ombre qui la disent ;
 *   3. la carte s'affiche, sans erreur de console ;
 *   4. le relief occupe vraiment l'écran, en paysage comme en portrait ;
 *   5. les trois fermes se voient, et le toucher ouvre leur fiche.
 */
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { readFileSync, existsSync, statSync, rmSync, readdirSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CARTE = join(RACINE, 'public', 'carte');
const SORTIE = 'dist-carte';
const PORT = 4409;
const LANGUES = ['fr', 'en', 'zh'];
const PAPIER = [0xef, 0xeb, 0xe2];

let ok = 0;
const echecs = [];
const check = (nom, reel, attendu = true) => {
  if (reel === attendu) { ok++; console.log(`  ok    ${nom}`); }
  else { echecs.push(nom); console.log(`  ÉCHEC ${nom}\n        attendu : ${attendu}\n        obtenu  : ${reel}`); }
};
const titre = (t) => console.log(`\n— ${t}`);
const lire = (...p) => readFile(join(...p), 'utf8');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml' };

function fichiers(base, prefixe = '') {
  const sortie = [];
  for (const e of readdirSync(base, { withFileTypes: true })) {
    const rel = prefixe ? `${prefixe}/${e.name}` : e.name;
    if (e.isDirectory()) sortie.push(...fichiers(join(base, e.name), rel));
    else sortie.push(rel);
  }
  return sortie.sort();
}

/* ------------------------------------------------------------------ *
 * Couleur : OKLCH, pour vérifier que la rampe est une rampe
 * ------------------------------------------------------------------ */
const s2lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const hex2lin = (h) => [0, 2, 4].map((i) => s2lin(parseInt(h.replace('#', '').slice(i, i + 2), 16) / 255));
function oklch(hex) {
  const [r, g, b] = hex2lin(hex);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  return { L, C: Math.hypot(A, B), h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360 };
}

/**
 * Écart-type des luminances : combien l'image a de contenu.
 *
 * C'est la mesure qui dit si la caméra est entrée dans la montagne. Dedans,
 * tout l'écran est d'un seul ton et l'écart tombe à presque rien — sans la
 * moindre erreur de console, puisque le rendu, lui, se porte bien.
 */
async function relief(tampon) {
  const { data, info } = await sharp(tampon).greyscale().raw().toBuffer({ resolveWithObject: true });
  let somme = 0;
  for (let i = 0; i < data.length; i++) somme += data[i];
  const moyenne = somme / data.length;
  let carres = 0;
  for (let i = 0; i < data.length; i++) carres += (data[i] - moyenne) ** 2;
  return Math.sqrt(carres / data.length);
}

/** Part des pixels qui diffèrent entre deux captures. */
async function bouge(a, b) {
  const [x, y] = await Promise.all([
    sharp(a).greyscale().resize(160, 100, { fit: 'fill' }).raw().toBuffer(),
    sharp(b).greyscale().resize(160, 100, { fit: 'fill' }).raw().toBuffer(),
  ]);
  let n = 0;
  for (let i = 0; i < x.length; i++) if (Math.abs(x[i] - y[i]) > 8) n++;
  return (n / x.length) * 100;
}

/**
 * Part de la capture occupée par le relief, et part colorée — hors habillage.
 *
 * `interdits` écarte le titre, la légende, le pied et la fiche. La question
 * posée est « le relief reste-t-il monochrome », pas « la page est-elle en
 * noir et blanc » : le bouton de survol est un aplat à la couleur de la
 * marque, et il a le droit de l'être. Sans cette exclusion, il pesait à lui
 * seul 4,8 % de l'écran d'un téléphone et faisait tomber le contrôle.
 */
async function mesurer(tampon, interdits = [], echelle = 2) {
  const { data, info } = await sharp(tampon).raw().toBuffer({ resolveWithObject: true });
  const zones = interdits.map((z) => ({
    x0: z.x * echelle, y0: z.y * echelle,
    x1: (z.x + z.width) * echelle, y1: (z.y + z.height) * echelle,
  }));
  let dessin = 0, colore = 0, regardes = 0;
  for (let y = 0; y < info.height; y++) {
    if (zones.some((z) => y >= z.y0 && y <= z.y1 && z.x0 <= 0 && z.x1 >= info.width)) continue;
    for (let x = 0; x < info.width; x++) {
      if (zones.some((z) => x >= z.x0 && x <= z.x1 && y >= z.y0 && y <= z.y1)) continue;
      const i = (y * info.width + x) * info.channels;
      const [r, v, b] = [data[i], data[i + 1], data[i + 2]];
      regardes++;
      /* Seuil bas : le relief est presque de la couleur du papier — c'est le
         dessin voulu. À 45, comme du temps du relief brun, la moitié de la
         surface ne comptait plus. */
      if (Math.abs(r - PAPIER[0]) + Math.abs(v - PAPIER[1]) + Math.abs(b - PAPIER[2]) > 16) dessin++;
      /* Un pixel « coloré » est un pixel dont les trois composantes s'écartent
         nettement : du gris chaud n'en est pas, l'orange de la marque en est. */
      if (Math.max(r, v, b) - Math.min(r, v, b) > 52) colore++;
    }
  }
  const total = Math.max(1, regardes);
  return { dessin: (dessin / total) * 100, colore: (colore / total) * 100 };
}

/**
 * Centre du plus gros amas ORANGE ET ROND : un repère de ferme.
 *
 * La rondeur n'est pas une coquetterie. L'orange de la marque sert aussi au
 * lien du pied de page, dont les lettres font bien plus de pixels qu'une
 * bille : sans ce filtre, le test cliquait sur « Découvrir nos cafés ». Un
 * amas large et plat n'est pas un repère ; un amas qui remplit son cadre et
 * dont le cadre est carré, oui.
 *
 * `interdits` écarte les zones d'habillage. La pastille de la légende est
 * elle aussi ronde et orange : en portrait, où les repères sont plus petits
 * qu'elle, le test cliquait dessus et attendait une fiche qui ne venait pas.
 */
async function repereAccent(tampon, echelle, interdits = []) {
  const { data, info } = await sharp(tampon).raw().toBuffer({ resolveWithObject: true });
  const vus = new Uint8Array(info.width * info.height);
  /* L'accent #b95f2c : nettement rouge, peu bleu. */
  const accent = (x, y) => {
    const i = (y * info.width + x) * info.channels;
    const [r, v, b] = [data[i], data[i + 1], data[i + 2]];
    return r > 120 && r < 215 && r - v > 55 && r - b > 85;
  };
  let meilleur = null;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (vus[y * info.width + x] || !accent(x, y)) continue;
      const file = [[x, y]];
      vus[y * info.width + x] = 1;
      let sx = 0, sy = 0, n = 0, x0 = x, x1 = x, y0 = y, y1 = y;
      while (file.length) {
        const [a, b] = file.pop();
        sx += a; sy += b; n++;
        if (a < x0) x0 = a; if (a > x1) x1 = a;
        if (b < y0) y0 = b; if (b > y1) y1 = b;
        for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const u = a + da, v = b + db;
          if (u < 0 || v < 0 || u >= info.width || v >= info.height) continue;
          if (vus[v * info.width + u] || !accent(u, v)) continue;
          vus[v * info.width + u] = 1;
          file.push([u, v]);
        }
      }
      const larg = x1 - x0 + 1, haut = y1 - y0 + 1;
      const forme = Math.min(larg, haut) / Math.max(larg, haut);
      const remplissage = n / (larg * haut);
      if (n < 40 || forme < 0.7 || remplissage < 0.55) continue;
      const cx = sx / n / echelle, cy = sy / n / echelle;
      if (interdits.some((z) => cx >= z.x && cx <= z.x + z.width && cy >= z.y && cy <= z.y + z.height)) continue;
      if (!meilleur || n > meilleur.n) {
        meilleur = { n, forme, remplissage, x: cx, y: cy };
      }
    }
  }
  return meilleur;
}

const main = async () => {
  execFileSync('node', ['outils/construire-carte.mjs'], { cwd: RACINE, stdio: 'pipe' });

  /* ================================================================ *
   * 1. Le dossier
   * ================================================================ */
  titre('Ce que contient le dossier');
  const presents = fichiers(CARTE);
  for (const f of ['.htaccess', 'index.html', 'carte.css', 'carte.js', 'favicon-96.png', ...LANGUES.map((l) => `${l}/index.html`)]) {
    check(f, presents.includes(f));
  }
  check('rien de plus', presents.length, 8);

  const pages = {};
  for (const l of LANGUES) pages[l] = await lire(CARTE, l, 'index.html');
  const css = await lire(CARTE, 'carte.css');
  const js = await lire(CARTE, 'carte.js');

  titre('La carte ne sort pas de son dossier');
  for (const [l, html] of Object.entries(pages)) {
    const absolues = [...html.matchAll(/(?:src|href)="(\/[^"]*)"/g)].map((m) => m[1]);
    check(`${l} — aucune adresse absolue`, absolues.join(', '), '');
    check(`${l} — rien d'emprunté à _astro`, html.includes('_astro'), false);
    check(`${l} — aucune clé laissée en place`, /\{\{\w+\}\}/.test(html), false);
    check(`${l} — hors des moteurs`, html.includes('name="robots" content="noindex, nofollow"'));
    check(`${l} — la source est citée`, /terrarium|SRTM/i.test(html));
  }
  check('le script ne cherche rien dehors', js.includes('_astro'), false);

  /* ================================================================ *
   * 2. La rampe d'altitude
   * ================================================================ */
  titre('Les teintes du relief');
  const teintes = {};
  for (const cle of ['surface', 'ombre', 'trait']) {
    teintes[cle] = css.match(new RegExp(`--relief-${cle}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1]?.toLowerCase();
    check(`${cle} est déclarée dans la feuille`, !!teintes[cle]);
  }
  const source = await lire(RACINE, 'carte', 'carte.ts');
  for (const [cle, constante] of [['surface', 'SURFACE'], ['ombre', 'OMBRE'], ['trait', 'TRAIT']]) {
    const deTs = source.match(new RegExp(`const ${constante} = '(#[0-9a-f]{6})'`, 'i'))?.[1]?.toLowerCase();
    check(`${cle} : la feuille et le script disent la même`, deTs, teintes[cle]);
  }
  /* Le relief est une maquette de topographe : du papier, des traits. Si la
     surface ou l'ombre prenait de la couleur, on retomberait dans le relief
     brun des premières versions, que le dessin ne veut pas. */
  for (const cle of ['surface', 'ombre']) {
    const { C, L } = oklch(teintes[cle]);
    check(`${cle} reste quasi neutre (C ${C.toFixed(3)} ≤ 0,035)`, C <= 0.035);
    check(`${cle} reste claire (L ${L.toFixed(2)} ≥ 0,80)`, L >= 0.80);
  }
  /* L'équidistance et les bornes de la bande vivent dans le script : on
     vérifie qu'elles s'affichent dans la légende, et non en dur dans un
     texte qui dériverait. */
  const equid = Number(source.match(/const EQUIDISTANCE = (\d+)/)?.[1]);
  check('une équidistance est fixée', Number.isFinite(equid) && equid > 0);
  for (const l of LANGUES) {
    check(`${l} — la légende annonce l'équidistance`, pages[l].includes('data-equidistance'));
  }

  /* ================================================================ *
   * 3. Le site ignore la carte
   * ================================================================ */
  titre('Le site ne mène pas à la carte');
  execFileSync('npx', ['astro', 'build', '--outDir', SORTIE], {
    cwd: RACINE, stdio: 'pipe', env: { ...process.env, SITE_URL: 'https://yunma.fr' },
  });
  const dist = join(RACINE, SORTIE);
  const htmls = fichiers(dist).filter((f) => f.endsWith('.html') && !f.startsWith('carte/') && !f.startsWith('jeu/'));
  let liens = 0;
  for (const f of htmls) if (/href="[^"]*\/carte\//.test(readFileSync(join(dist, f), 'utf8'))) liens++;
  check(`aucun lien vers la carte dans ${htmls.length} pages`, liens, 0);
  check('absente du plan du site', (await lire(dist, 'sitemap-0.xml')).includes('/carte/'), false);
  check('le dossier part avec le site', existsSync(join(dist, 'carte', 'carte.js')));

  /* ================================================================ *
   * 4 et 5. Ce que l'on voit
   * ================================================================ */
  const serveur = createServer((req, rep) => {
    const chemin = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    for (const f of [join(dist, chemin), join(dist, chemin, 'index.html')]) {
      if (existsSync(f) && statSync(f).isFile()) {
        rep.writeHead(200, { 'Content-Type': TYPES[extname(f)] ?? 'application/octet-stream' });
        return rep.end(readFileSync(f));
      }
    }
    rep.writeHead(404).end('rien');
  });
  await new Promise((r) => serveur.listen(PORT, '127.0.0.1', r));

  const { chromium } = await import('playwright');
  const nav = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });

  try {
    for (const vue of [
      { nom: 'paysage', width: 1280, height: 800, mini: 25 },
      { nom: 'portrait', width: 390, height: 844, mini: 18 },
    ]) {
      titre(`Ce que l'on voit en ${vue.nom}`);
      const ctx = await nav.newContext({
        viewport: { width: vue.width, height: vue.height },
        deviceScaleFactor: 2, locale: 'fr-FR',
        isMobile: vue.nom === 'portrait', hasTouch: vue.nom === 'portrait',
      });
      const page = await ctx.newPage();
      const erreurs = [];
      page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
      page.on('pageerror', (e) => erreurs.push(e.message));
      await page.goto(`http://127.0.0.1:${PORT}/carte/fr/`, { waitUntil: 'load' });
      await page.waitForFunction(() => document.querySelector('[data-carte]')?.dataset.prete === '1', null, { timeout: 30000 });
      await page.waitForTimeout(1800);

      check('aucune erreur de console', erreurs.join(' | '), '');
      check('la 3D a démarré', await page.locator('[data-panne]').isHidden());
      const triangles = Number(await page.getAttribute('[data-carte]', 'data-triangles'));
      check(`le relief est construit (${triangles.toLocaleString('fr-FR')} triangles)`, triangles > 50000);

      const tampon = await page.screenshot();
      const interdits = await page.evaluate(() =>
        [...document.querySelectorAll('.carte__legende, .carte__pied, .carte__tete, .carte__fiche')]
          .map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }),
      );
      const { dessin, colore } = await mesurer(tampon, interdits);
      /* Un cadrage qui laisse l'écran vide ne déclenche aucune erreur : c'est
         pourquoi on le mesure. */
      check(`le relief occupe l'écran (${dessin.toFixed(0)} % ≥ ${vue.mini} %)`, dessin >= vue.mini);
      /* La carte est une maquette de papier : les seules taches colorées sont
         les trois repères et le lien de pied de page. Les premières versions
         teintaient tout le relief, et c'est précisément ce qu'on ne veut
         plus — une mesure l'attrape, un contrôle de code ne l'aurait pas. */
      check(`la carte reste monochrome (${colore.toFixed(1)} % coloré ≤ 2 %)`, colore <= 2);

      titre(`Les fermes, en ${vue.nom}`);
      const repère = await repereAccent(tampon, 2, interdits);
      /* L'orange de la marque ne sert qu'à désigner : il n'est nulle part
         ailleurs sur le relief, donc un repère se voit partout. Dans une
         version antérieure il reprenait la teinte du relief, et deux fermes
         sur trois étaient invisibles. */
      check('un repère se détache du relief', repère !== null && repère.n > 60);
      if (repère) {
        await page.mouse.click(Math.round(repère.x), Math.round(repère.y));
        await page.waitForTimeout(350);
        const fiche = page.locator('[data-fiche]');
        check('le toucher ouvre la fiche', await fiche.isVisible());
        const nom = (await page.locator('[data-fiche-nom]').textContent())?.trim() ?? '';
        const fermes = JSON.parse(readFileSync(join(RACINE, 'contenu', 'produits.json'), 'utf8')).fermes;
        check(`la fiche nomme une vraie ferme (« ${nom} »)`, Object.values(fermes).some((f) => f.nom === nom));
        /* Visible ne suffit pas : la fiche doit être DEVANT. Le pied de page,
           écrit après elle dans le document, se peignait par-dessus son texte
           sur un écran étroit — rien ne le signalait, la fiche étant bien
           « visible ». On demande donc au navigateur ce qu'il y a réellement
           sous quelques points de la fiche. */
        const devant = await page.evaluate(() => {
          const f = document.querySelector('[data-fiche]');
          const r = f.getBoundingClientRect();
          const points = [
            [r.left + r.width / 2, r.top + r.height * 0.3],
            [r.left + r.width / 2, r.top + r.height * 0.6],
            [r.left + r.width / 2, r.bottom - 12],
          ];
          return points.every(([x, y]) => f.contains(document.elementFromPoint(x, y)));
        });
        check('rien ne se peint par-dessus la fiche', devant);

        const cafes = await page.locator('[data-fiche-cafes] li').allTextContents();
        check('elle liste au moins un café', cafes.length >= 2);
        /* On ne laisse pas croire à une précision qu'on n'a pas. */
        check('elle dit que la position est approchée', cafes.some((t) => /approch|近似/i.test(t)));
        await page.locator('[data-fermer]').click();
        await page.waitForTimeout(250);
        check('et elle se referme', await fiche.isHidden());
      }

      titre(`La légende, en ${vue.nom}`);
      check('trois clés de lecture', await page.locator('.carte__cle').count(), 3);
      const equidTexte = (await page.locator('[data-equidistance]').textContent())?.trim() ?? '';
      check(`l'équidistance est annoncée (« ${equidTexte} »)`, new RegExp(`\\b${equid}\\b`).test(equidTexte));
      check('la bande du café est annotée', await page.locator('[data-ceinture]').isVisible());
      check('et les fermes aussi', await page.locator('[data-fermes]').isVisible());

      /* ---------------------------------------------------------------- *
       * Le survol
       * ---------------------------------------------------------------- */
      titre(`Le survol, en ${vue.nom}`);
      const bouton = page.locator('[data-survol]');
      const repos = (await bouton.textContent())?.trim() ?? '';
      check('un bouton de survol, au repos', await bouton.getAttribute('aria-pressed'), 'false');
      await bouton.click();
      await page.waitForTimeout(250);
      check('il s’enclenche', await bouton.getAttribute('aria-pressed'), 'true');
      check('et son intitulé change', (await bouton.textContent())?.trim() !== repos);

      await page.waitForTimeout(2200);
      const vol1 = await page.screenshot();
      await page.waitForTimeout(3200);
      const vol2 = await page.screenshot();

      const deplacement = await bouge(vol1, vol2);
      check(`la caméra se déplace (${deplacement.toFixed(0)} % de l'image change)`, deplacement > 12);
      /* Un vol qui traverse la montagne ne lève aucune erreur : l'écran
         devient simplement uni. On mesure donc le contenu de l'image. */
      for (const [k, t] of [[1, vol1], [2, vol2]]) {
        const ecart = await relief(t);
        check(`la caméra reste dehors (contenu ${ecart.toFixed(0)} ≥ 8) — vue ${k}`, ecart >= 8);
      }

      /* Toucher le relief doit rendre la main, sans quoi on ne peut plus
         reprendre la carte une fois le vol lancé. */
      await page.mouse.click(Math.round(vue.width * 0.5), Math.round(vue.height * 0.45));
      await page.waitForTimeout(300);
      check('un geste sur la carte l’arrête', await bouton.getAttribute('aria-pressed'), 'false');
      check('et l’intitulé revient', (await bouton.textContent())?.trim(), repos);

      await ctx.close();
    }
  } finally {
    await nav.close();
    serveur.close();
    rmSync(join(RACINE, SORTIE), { recursive: true, force: true });
  }

  console.log(`\n${ok} vérifications passées, ${echecs.length} en échec`);
  process.exit(echecs.length ? 1 : 0);
};

main();
