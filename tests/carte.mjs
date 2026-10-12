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
 *   2. la rampe d'altitude est la même dans la feuille et dans le script, et
 *      elle reste une rampe — une seule teinte, clarté décroissante ;
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

/** Part de la capture qui n'est pas le papier du fond. */
async function emprise(tampon) {
  const { data, info } = await sharp(tampon).raw().toBuffer({ resolveWithObject: true });
  let n = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const d = Math.abs(data[i] - PAPIER[0]) + Math.abs(data[i + 1] - PAPIER[1]) + Math.abs(data[i + 2] - PAPIER[2]);
    if (d > 45) n++;
  }
  return (n / (info.width * info.height)) * 100;
}

/** Centre du plus gros amas de pixels presque blancs : un repère de ferme. */
async function reperePresqueBlanc(tampon, echelle) {
  const { data, info } = await sharp(tampon).raw().toBuffer({ resolveWithObject: true });
  const vus = new Uint8Array(info.width * info.height);
  const blanc = (x, y) => {
    const i = (y * info.width + x) * info.channels;
    return data[i] > 236 && data[i + 1] > 232 && data[i + 2] > 226;
  };
  let meilleur = null;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (vus[y * info.width + x] || !blanc(x, y)) continue;
      /* Parcours en largeur, sans récursion : un amas peut faire mille pixels. */
      const file = [[x, y]];
      vus[y * info.width + x] = 1;
      let sx = 0, sy = 0, n = 0;
      while (file.length) {
        const [a, b] = file.pop();
        sx += a; sy += b; n++;
        for (const [da, db] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const u = a + da, v = b + db;
          if (u < 0 || v < 0 || u >= info.width || v >= info.height) continue;
          if (vus[v * info.width + u] || !blanc(u, v)) continue;
          vus[v * info.width + u] = 1;
          file.push([u, v]);
        }
      }
      if (!meilleur || n > meilleur.n) meilleur = { n, x: sx / n / echelle, y: sy / n / echelle };
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
  titre('La rampe reste une rampe');
  const deCss = [...css.matchAll(/--relief-\d:\s*(#[0-9a-f]{6})/gi)].map((m) => m[1].toLowerCase());
  check('six paliers dans la feuille', deCss.length, 6);
  const source = await lire(RACINE, 'carte', 'carte.ts');
  const deTs = [...(source.match(/const RAMPE = \[([^\]]*)\]/)?.[1] ?? '').matchAll(/#[0-9a-f]{6}/gi)].map((m) => m[0].toLowerCase());
  check('la feuille et le script disent la même', deCss.join(), deTs.join());

  const lch = deCss.map(oklch);
  let monotone = true, ecartMin = 1, teinteMax = 0;
  for (let k = 1; k < lch.length; k++) {
    if (lch[k].L >= lch[k - 1].L) monotone = false;
    ecartMin = Math.min(ecartMin, lch[k - 1].L - lch[k].L);
  }
  for (const c of lch) teinteMax = Math.max(teinteMax, Math.abs(c.h - lch[2].h));
  check('la clarté décroît sans exception', monotone);
  check(`les paliers se distinguent (ΔL min ${ecartMin.toFixed(3)} ≥ 0,06)`, ecartMin >= 0.06);
  check(`une seule teinte (écart ${teinteMax.toFixed(0)}° ≤ 20°)`, teinteMax <= 20);

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
      const part = await emprise(tampon);
      /* Un cadrage qui laisse l'écran vide ne déclenche aucune erreur : c'est
         pourquoi on le mesure. */
      check(`le relief occupe l'écran (${part.toFixed(0)} % ≥ ${vue.mini} %)`, part >= vue.mini);

      titre(`Les fermes, en ${vue.nom}`);
      const repère = await reperePresqueBlanc(tampon, 2);
      /* Les repères sont blancs ; la rampe d'altitude ne l'est jamais. S'ils
         reprenaient sa teinte, ils disparaîtraient — c'est arrivé. */
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
      check('des graduations en mètres', (await page.locator('.carte__cran').count()) >= 4);
      check('la ceinture caféière est annotée', await page.locator('.carte__ceinture-texte').isVisible());
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
