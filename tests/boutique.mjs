/**
 * Vérifie le parcours d'achat dans un vrai navigateur : prix affichés, choix du
 * format, panier, quantités, persistance, et cohérence entre les trois langues.
 *
 *   npm run build
 *   npm i -D playwright        (une seule fois)
 *   node tests/boutique.mjs
 *
 * Le site est servi depuis dist/ : ce sont les pages réellement publiées qui
 * sont testées, pas un rendu de développement.
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

/* Le format monétaire français emploie une espace fine insécable, et plusieurs
   libellés sont mis en capitales par la CSS : on compare le texte, pas sa casse
   ni la nature de ses espaces. */
const norm = (v) => String(v).replace(/[\s  ]+/g, ' ').trim().toLocaleLowerCase('fr');

let ok = 0;
const echecs = [];
const check = (nom, reel, attendu) => {
  if (norm(reel) === norm(attendu)) {
    ok++;
    console.log(`  ok    ${nom} = ${String(reel).replace(/\s+/g, ' ').trim()}`);
  } else {
    echecs.push(nom);
    console.log(`  ÉCHEC ${nom}\n        attendu : ${attendu}\n        obtenu  : ${reel}`);
  }
};
const titre = (t) => console.log(`\n— ${t}`);

/* Les prix de référence, tels qu'ils doivent apparaître au client. */
const CATALOGUE = [
  { slug: 'torch-estate-lot-01', formats: [['200 g', 15]] },
  { slug: 'torch-estate-lot-02', formats: [['200 g', 15]] },
  { slug: 'yun-lan-estate', formats: [['200 g', 17]] },
  { slug: 'drip-bags-x8', formats: [['Boîte de 8', 16.5]] },
  {
    slug: 'drip-bags-a-composer',
    formats: [['8 × Catimor', 15], ['8 × Bourbon jaune', 18], ['4 × Catimor + 4 × Bourbon jaune', 16.5]],
  },
  { slug: 'coffret-decouverte', formats: [['Coffret complet', 60]] },
];
const euros = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

serveur.listen(PORT);
const navigateur = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await navigateur.newContext({ viewport: { width: 1280, height: 900 } });
const pg = await ctx.newPage();
pg.on('pageerror', (e) => { echecs.push(`erreur JS : ${e.message}`); console.log('  ERREUR JS :', e.message); });

const fermerPanier = async () => {
  if (await pg.locator('[data-cart]').isVisible()) {
    await pg.locator('.cart__close').click();
    await pg.waitForTimeout(650);
  }
};
const viderPanier = async () => {
  await pg.evaluate(() => { localStorage.removeItem('yunma:cart-demo'); localStorage.removeItem('yunma:cart-id'); });
  await pg.reload({ waitUntil: 'networkidle' });
};

/* ---------------------------------------------------------------- 1. prix */
titre('Prix affichés sur chaque fiche produit');
for (const { slug, formats } of CATALOGUE) {
  await pg.goto(`${B}/fr/cafes/${slug}/`, { waitUntil: 'networkidle' });
  const chips = pg.locator('.buy__chips .chip');
  check(`${slug} — nombre de formats`, await chips.count(), formats.length > 1 ? formats.length : 0);
  for (const [i, [libelle, prix]] of formats.entries()) {
    if (formats.length > 1) {
      await chips.nth(i).click();
      await pg.waitForTimeout(120);
      check(`${slug} — libellé du format ${i + 1}`, await chips.nth(i).innerText(), libelle);
    }
    check(`${slug} — prix affiché (${libelle})`, await pg.locator('.pdp__price').innerText(), euros(prix));
    check(`${slug} — prix de l'encart (${libelle})`, await pg.locator('.buy__price').innerText(), euros(prix));
    check(`${slug} — prix transmis au panier (${libelle})`, Number(await pg.locator('[data-add-to-cart]').getAttribute('data-price')), prix);
  }
}

/* ------------------------------------------------- 2. panier, trois formats */
titre('Panier — les trois formats de la boîte à composer');
await pg.goto(`${B}/fr/cafes/drip-bags-a-composer/`, { waitUntil: 'networkidle' });
await viderPanier();
const chips = pg.locator('.buy__chips .chip');
const ajouter = async (i, qte = 1) => {
  await chips.nth(i).click();
  await pg.waitForTimeout(100);
  await pg.fill('[data-qty-input]', String(qte));
  await pg.dispatchEvent('[data-qty-input]', 'change');
  await pg.click('[data-add-to-cart]');
  await pg.waitForTimeout(450);
  await fermerPanier();
};
await ajouter(0, 1);
await ajouter(1, 1);
await ajouter(2, 2);
await pg.click('[data-cart-toggle]');
await pg.waitForTimeout(500);

const lignes = pg.locator('.cline');
check('lignes distinctes', await lignes.count(), 3);
for (const [i, libelle, montant] of [[0, '8 × Catimor', 15], [1, '8 × Bourbon jaune', 18], [2, '4 × Catimor + 4 × Bourbon jaune', 33]]) {
  check(`ligne ${i + 1} — format`, await lignes.nth(i).locator('.cline__meta').innerText(), libelle);
  check(`ligne ${i + 1} — montant`, await lignes.nth(i).locator('.cline__price').innerText(), euros(montant));
}
check('total', await pg.locator('[data-cart-total]').innerText(), euros(66));
check('compteur', await pg.locator('[data-cart-count]').first().innerText(), 4);

titre('Le même format ajouté deux fois ne crée pas de doublon');
await fermerPanier();
await ajouter(1, 1);
await pg.click('[data-cart-toggle]');
await pg.waitForTimeout(400);
check('lignes après le second ajout', await pg.locator('.cline').count(), 3);
check('ligne « Bourbon » regroupée', await pg.locator('.cline').nth(1).locator('.cline__price').innerText(), euros(36));
check('total après regroupement', await pg.locator('[data-cart-total]').innerText(), euros(84));

titre('Quantités et suppression depuis le panier');
await pg.locator('.cline').nth(1).locator('[data-line-dec]').click();
await pg.waitForTimeout(250);
check('après −1', await pg.locator('.cline').nth(1).locator('.cline__price').innerText(), euros(18));
await pg.locator('.cline').nth(1).locator('[data-line-remove]').click();
await pg.waitForTimeout(250);
check('lignes après suppression', await pg.locator('.cline').count(), 2);
check('total après suppression', await pg.locator('[data-cart-total]').innerText(), euros(48));

titre('Panier conservé d’une page à l’autre et d’une langue à l’autre');
await pg.goto(`${B}/fr/cafes/`, { waitUntil: 'networkidle' });
await pg.waitForTimeout(300);
check('compteur sur le catalogue', await pg.locator('[data-cart-count]').first().innerText(), 3);
await pg.goto(`${B}/en/cafes/`, { waitUntil: 'networkidle' });
await pg.waitForTimeout(300);
check('compteur après passage en anglais', await pg.locator('[data-cart-count]').first().innerText(), 3);

titre('Paiement indisponible tant que Shopify n’est pas connecté');
await pg.click('[data-cart-toggle]');
await pg.waitForTimeout(400);
check('mention « boutique en cours de connexion »', await pg.locator('[data-cart-demo]').isVisible(), true);
check('bouton de paiement neutralisé', await pg.locator('[data-cart-checkout]').getAttribute('href'), '#');
await pg.keyboard.press('Escape');
await pg.waitForTimeout(600);
check('panier fermé par Échap', await pg.locator('[data-cart]').isVisible(), false);

/* ------------------------------------------------ 3. mention « à partir de » */
titre('Catalogue — « à partir de » réservé aux produits à plusieurs prix');
const mentions = { fr: 'À partir de 15,00 €', en: 'From €15.00', zh: '起价 €15.00' };
const reperes = { fr: 'Composez', en: 'Build', zh: '自选' };
for (const lang of ['fr', 'en', 'zh']) {
  await pg.goto(`${B}/${lang}/cafes/`, { waitUntil: 'networkidle' });
  const carte = pg.locator('.pcard').filter({ hasText: reperes[lang] }).first();
  check(`carte à plusieurs prix (${lang})`, await carte.locator('.pcard__price').innerText(), mentions[lang]);
  const unique = pg.locator('.pcard').filter({ hasText: 'Yun Lan' }).first();
  const attendu = lang === 'fr' ? '17,00 €' : '€17.00';
  check(`carte à prix unique (${lang})`, await unique.locator('.pcard__price').innerText(), attendu);
}

/* ------------------------------------------------- 4. données structurées */
titre('Données structurées : ce que Google lira');
for (const { slug, formats } of CATALOGUE) {
  await pg.goto(`${B}/fr/cafes/${slug}/`, { waitUntil: 'networkidle' });
  const brut = await pg.evaluate(() => document.querySelector('script[type="application/ld+json"]').textContent);
  const noeuds = JSON.parse(brut);
  const produit = (noeuds['@graph'] ?? noeuds).find((n) => n['@type'] === 'Product');
  const offres = produit.offers;
  if (formats.length > 1) {
    check(`${slug} — type d’offre`, offres['@type'], 'AggregateOffer');
    check(`${slug} — fourchette`, `${offres.lowPrice} – ${offres.highPrice}`, `${Math.min(...formats.map((f) => f[1])).toFixed(2)} – ${Math.max(...formats.map((f) => f[1])).toFixed(2)}`);
    check(`${slug} — prix de chaque format`, offres.offers.map((o) => o.price).join(' '), formats.map(([, p]) => p.toFixed(2)).join(' '));
  } else {
    check(`${slug} — type d’offre`, offres['@type'], 'Offer');
    check(`${slug} — prix`, offres.price, formats[0][1].toFixed(2));
  }
}

/* --------------------------------------------------------- 5. sélecteur */
titre('Choix du format au clavier');
await pg.goto(`${B}/fr/cafes/drip-bags-a-composer/`, { waitUntil: 'networkidle' });
await pg.locator('.buy__chips input').first().focus();
await pg.keyboard.press('ArrowRight');
await pg.waitForTimeout(150);
check('flèche droite sélectionne le format suivant', await pg.locator('.pdp__price').innerText(), euros(18));
await pg.keyboard.press('ArrowRight');
await pg.waitForTimeout(150);
check('flèche droite sélectionne le troisième', await pg.locator('.pdp__price').innerText(), euros(16.5));

titre('Bornes de la quantité');
await pg.fill('[data-qty-input]', '99');
await pg.dispatchEvent('[data-qty-input]', 'change');
check('quantité plafonnée à 20', await pg.locator('[data-qty-input]').inputValue(), '20');
await pg.fill('[data-qty-input]', '0');
await pg.dispatchEvent('[data-qty-input]', 'change');
check('quantité minimale de 1', await pg.locator('[data-qty-input]').inputValue(), '1');

console.log(`\n${ok} vérifications passées, ${echecs.length} en échec`);
if (echecs.length) echecs.forEach((e) => console.log('  ·', e));
await navigateur.close();
serveur.close();
process.exit(echecs.length ? 1 : 0);
