/**
 * L'état « épuisé » d'un café, et surtout : la garantie qu'il ne change rien
 * tant que personne ne l'active.
 *
 *   npm run test:rupture
 *
 * Trois constructions sont comparées :
 *
 *   1. celle de `dist/`, telle que publiée aujourd'hui — aucune variante n'est
 *      marquée épuisée, et le test vérifie qu'aucune trace de l'état de rupture
 *      n'apparaît nulle part. C'est la garantie : la fonctionnalité est là,
 *      dormante, et le site reste exactement celui d'avant ;
 *
 *   2. une construction où un seul café est marqué épuisé, pour vérifier que
 *      l'état s'affiche bien — dans les trois langues — et qu'il ne déborde pas
 *      sur les autres références ;
 *
 *   3. la même, avec un service de liste d'attente configuré, pour vérifier que
 *      le champ de saisie remplace alors le courriel pré-rempli, et qu'il
 *      transmet vraiment l'adresse.
 *
 * Le fichier de contenu est remis en état quoi qu'il arrive, y compris si le
 * test échoue en cours de route.
 */
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, statSync, rmSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENU = join(RACINE, 'contenu', 'produits.json');
const PORT = 4400;

/* Le café que l'on marque épuisé, et celui qui doit rester intact à côté. */
const EPUISE = 'drip-bags-catimor';
const TEMOIN = 'yun-lan-estate';

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

/* ------------------------------------------------------------------ */

/**
 * Astro inline les petits scripts dans la page : leurs sélecteurs
 * (`[data-attente-form]`, `[data-add-to-cart]`…) se retrouvent donc dans le
 * HTML même quand l'élément correspondant n'est pas rendu. Les vérifications
 * ci-dessous cherchent l'élément — balise comprise — et non la chaîne.
 */
const lire = (dist, ...parties) => {
  const p = join(RACINE, dist, ...parties, 'index.html');
  if (!existsSync(p)) throw new Error(`page absente : ${p}`);
  return readFileSync(p, 'utf8');
};

const construire = (sortie, env = {}) => {
  rmSync(join(RACINE, sortie), { recursive: true, force: true });
  execFileSync('npx', ['astro', 'build', '--outDir', sortie], {
    cwd: RACINE,
    stdio: 'pipe',
    env: { ...process.env, ...env },
  });
};

/** Passe toutes les variantes d'un café à « indisponible ». */
const marquerEpuise = (slug) => {
  const data = JSON.parse(readFileSync(CONTENU, 'utf8'));
  const liste = Array.isArray(data) ? data : (data.produits ?? []);
  const cible = liste.find((p) => p.slug === slug);
  if (!cible) throw new Error(`café introuvable dans le contenu : ${slug}`);
  cible.variants.forEach((v) => {
    v.available = false;
  });
  writeFileSync(CONTENU, JSON.stringify(data, null, 2) + '\n');
};

const original = readFileSync(CONTENU, 'utf8');
const restaurer = () => writeFileSync(CONTENU, original);

/* ------------------------------------------------------------------ */

const textes = JSON.parse(readFileSync(join(RACINE, 'contenu', 'textes.json'), 'utf8')).site;
/* Les entités HTML de l'apostrophe typographique : le rendu peut échapper. */
const contient = (html, texte) =>
  html.replace(/&#8217;|&rsquo;|&#39;/g, '’').includes(texte.replace(/'/g, '’'));

let serveur;

try {
  /* ============ 1. La garantie ============ */
  titre('Rien ne change tant qu’aucun café n’est marqué épuisé');

  if (!existsSync(join(RACINE, 'dist'))) {
    console.error('dist/ est absent — lancez `npm run build` d’abord.');
    process.exit(1);
  }

  for (const lang of LANGUES) {
    const fiche = lire('dist', lang, 'cafes', TEMOIN);
    const catalogue = lire('dist', lang, 'cafes');
    const t = textes[lang].product.rupture;

    check(`${lang} — aucun bloc de rupture sur la fiche`, /<section[^>]*data-rupture/.test(fiche), false);
    check(`${lang} — aucune mention au catalogue`, /<p[^>]*pcard__rupture/.test(catalogue), false);
    check(`${lang} — le badge n’apparaît nulle part`, contient(catalogue, t.badge), false);
    check(`${lang} — le bouton d’achat est bien là`, /<button[^>]*data-add-to-cart/.test(fiche));
    check(`${lang} — la promesse d’expédition est intacte`, contient(fiche, textes[lang].product.shipping));
  }

  /* ============ 2. L'état de rupture ============ */
  titre('Un café marqué épuisé, dans les trois langues');

  marquerEpuise(EPUISE);
  construire('dist-rupture');

  for (const lang of LANGUES) {
    const fiche = lire('dist-rupture', lang, 'cafes', EPUISE);
    const t = textes[lang].product.rupture;

    check(`${lang} — le bloc de rupture est présent`, /<section[^>]*data-rupture/.test(fiche));
    check(`${lang} — le titre est traduit`, contient(fiche, t.titre));
    check(`${lang} — l’explication est traduite`, contient(fiche, t.texte));
    check(`${lang} — l’appel à l’action est traduit`, contient(fiche, t.cta));
    check(`${lang} — plus de bouton d’achat`, /<button[^>]*data-add-to-cart/.test(fiche), false);
    check(`${lang} — plus de sélecteur de quantité`, /<input[^>]*data-qty-input/.test(fiche), false);
    check(`${lang} — la promesse d’expédition a disparu`, contient(fiche, textes[lang].product.shipping), false);
    check(`${lang} — « torréfié à la commande » reste`, contient(fiche, textes[lang].product.freshness));
  }

  titre('Sans service configuré, le relais est un courriel qui part vraiment');

  for (const lang of LANGUES) {
    const fiche = lire('dist-rupture', lang, 'cafes', EPUISE);
    check(`${lang} — lien mailto présent`, /href="mailto:[^"]+\?subject=/.test(fiche));
    check(`${lang} — aucun champ de saisie`, /<form[^>]*data-attente-form/.test(fiche), false);

    /* L'objet du courriel doit nommer le café, sinon la demande arrive nue. */
    const m = fiche.match(/href="mailto:[^"?]+\?subject=([^"]+)"/);
    const sujet = m ? decodeURIComponent(m[1]) : '';
    const nom = JSON.parse(readFileSync(CONTENU, 'utf8'));
    const liste = Array.isArray(nom) ? nom : (nom.produits ?? []);
    const cafe = liste.find((p) => p.slug === EPUISE).name[lang];
    check(`${lang} — l’objet nomme le café`, sujet.includes(cafe));
  }

  titre('Les autres références ne bougent pas');

  for (const lang of LANGUES) {
    const temoin = lire('dist-rupture', lang, 'cafes', TEMOIN);
    check(`${lang} — le témoin garde son bouton d’achat`, /<button[^>]*data-add-to-cart/.test(temoin));
    check(`${lang} — le témoin n’a pas de bloc de rupture`, /<section[^>]*data-rupture/.test(temoin), false);
  }

  titre('Le catalogue porte la mention');

  for (const lang of LANGUES) {
    const catalogue = lire('dist-rupture', lang, 'cafes');
    const t = textes[lang].product.rupture;
    check(`${lang} — une seule mention au catalogue`, (catalogue.match(/<p[^>]*pcard__rupture/g) ?? []).length, 1);
    check(`${lang} — le badge est traduit`, contient(catalogue, t.badge));
  }

  /* ============ 3. Avec un service de liste d'attente ============ */
  titre('Service configuré : le champ de saisie remplace le courriel');

  const STUB = `http://localhost:${PORT}/stub-attente`;
  construire('dist-attente', { PUBLIC_LISTE_ATTENTE_URL: STUB });

  for (const lang of LANGUES) {
    const fiche = lire('dist-attente', lang, 'cafes', EPUISE);
    const t = textes[lang].product.rupture;
    check(`${lang} — le formulaire est présent`, /<form[^>]*data-attente-form/.test(fiche));
    check(`${lang} — le champ est un champ e-mail`, /<input[^>]*type="email"/.test(fiche));
    check(`${lang} — le libellé du champ est traduit`, contient(fiche, t.champLabel));
    check(`${lang} — plus de lien mailto`, /href="mailto:/.test(fiche), false);
  }

  /* L'envoi lui-même, dans un vrai navigateur et contre un service factice :
     c'est la seule partie qui ne se lit pas dans le HTML. */
  titre('L’adresse part vraiment et la confirmation s’affiche');

  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.log('  —     envoi non vérifié : Playwright absent (npm i -D playwright)');
  }

  if (chromium) {
    const DIST = join(RACINE, 'dist-attente');
    const TYPES = {
      '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
      '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
      '.txt': 'text/plain', '.xml': 'application/xml', '.ico': 'image/x-icon',
    };
    const recues = [];

    serveur = createServer((req, res) => {
      if (req.url.startsWith('/stub-attente')) {
        let corps = '';
        req.on('data', (c) => (corps += c));
        req.on('end', () => {
          try {
            recues.push(JSON.parse(corps));
          } catch {
            recues.push(null);
          }
          res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
          res.end('{"ok":true}');
        });
        return;
      }
      let p = join(DIST, decodeURIComponent(req.url.split('?')[0]));
      if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
      if (!existsSync(p)) {
        res.writeHead(404);
        return res.end('404');
      }
      res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream' });
      res.end(readFileSync(p));
    });
    await new Promise((r) => serveur.listen(PORT, r));

    const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
    const page = await nav.newPage();
    await page.goto(`http://localhost:${PORT}/fr/cafes/${EPUISE}/`, { waitUntil: 'networkidle' });

    await page.fill('[data-attente-form] input[name="email"]', 'essai@yunma.fr');
    await page.click('[data-attente-form] button[type="submit"]');
    await page.waitForSelector('[data-attente-reponse]:not([hidden])', { timeout: 5000 });

    const t = textes.fr.product.rupture;
    const reponse = await page.textContent('[data-attente-reponse]');
    check('la confirmation s’affiche', contient(reponse, t.confirmation));
    check('le champ disparaît une fois l’adresse prise', await page.isHidden('[data-attente-form] input[name="email"]'));
    check('le service a reçu l’adresse', recues[0]?.email, 'essai@yunma.fr');
    check('le service sait de quel café il s’agit', recues[0]?.produit, EPUISE);
    check('le service sait dans quelle langue répondre', recues[0]?.langue, 'fr');

    await nav.close();
  }
} finally {
  restaurer();
  if (serveur) serveur.close();
  rmSync(join(RACINE, 'dist-rupture'), { recursive: true, force: true });
  rmSync(join(RACINE, 'dist-attente'), { recursive: true, force: true });
}

console.log(`\n${ok} vérifications passées, ${echecs.length} en échec`);
if (echecs.length) {
  echecs.forEach((e) => console.log(`  — ${e}`));
  process.exit(1);
}
