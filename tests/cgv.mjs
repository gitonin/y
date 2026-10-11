/**
 * Les conditions générales, et leur acceptation avant le paiement.
 *
 *   npm run test:cgv
 *
 * Trois choses, qui tiennent ensemble :
 *
 *   1. les deux documents — vente et utilisation — existent, dans les trois
 *      langues, avec leur texte français et l'avertissement qui le dit ;
 *   2. le pied de page y mène ;
 *   3. le paiement reste fermé tant que la case n'est pas cochée. C'est le
 *      point qui compte : les CGV exigent une acceptation expresse, et un
 *      bouton qu'on peut atteindre sans cocher ne vaut rien.
 *
 * Shopify est simulé sur un domaine inexistant, pour que le panier ait un
 * contenu et une adresse de paiement sans rien demander à la vraie boutique.
 */
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { readFileSync, rmSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SORTIE = 'dist-cgv';
const PORT = 4406;
const DOMAINE = 'boutique-simulee.invalid';
const PAIEMENT = 'https://boutique-simulee.invalid/checkout/abc';
const LANGUES = ['fr', 'en', 'zh'];

const contenu = JSON.parse(readFileSync(join(RACINE, 'contenu', 'textes.json'), 'utf8'));
const textes = contenu.site;

let ok = 0;
const echecs = [];
const check = (nom, reel, attendu = true) => {
  if (reel === attendu) { ok++; console.log(`  ok    ${nom}`); }
  else { echecs.push(nom); console.log(`  ÉCHEC ${nom}\n        attendu : ${attendu}\n        obtenu  : ${reel}`); }
};
const titre = (t) => console.log(`\n— ${t}`);

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

const PANIER = {
  id: 'gid://shopify/Cart/1',
  checkoutUrl: PAIEMENT,
  totalQuantity: 1,
  cost: { subtotalAmount: { amount: '15.0', currencyCode: 'EUR' } },
  lines: { nodes: [{
    id: 'gid://shopify/CartLine/1',
    quantity: 1,
    merchandise: {
      id: 'gid://shopify/ProductVariant/59384683823429',
      title: '200 g',
      price: { amount: '15.0', currencyCode: 'EUR' },
      product: { title: 'Torch Estate, Lot 01', handle: 'torch-estate-lot-01' },
    },
  }] },
};

const main = async () => {
  let chromium;
  try { ({ chromium } = await import('playwright')); }
  catch { console.log('\nPlaywright est absent — contrôle ignoré.'); return; }

  console.log('Construction avec une boutique simulée…');
  rmSync(join(RACINE, SORTIE), { recursive: true, force: true });
  execFileSync('npx', ['astro', 'build', '--outDir', SORTIE], {
    cwd: RACINE, stdio: 'pipe',
    env: { ...process.env, PUBLIC_SHOPIFY_DOMAIN: DOMAINE, PUBLIC_SHOPIFY_STOREFRONT_TOKEN: 'jeton-de-test' },
  });

  const serveur = createServer(async (req, res) => {
    let p = join(RACINE, SORTIE, decodeURIComponent(req.url.split('?')[0]));
    if (p.endsWith('/')) p += 'index.html';
    try {
      const buf = await readFile(p);
      res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream' });
      res.end(buf);
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise((r) => serveur.listen(PORT, r));

  const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  try {
    titre('Les deux documents existent dans les trois langues');
    for (const lang of LANGUES) {
      const page = await nav.newPage({ viewport: { width: 1280, height: 900 } });
      for (const [nom, chemin, cle] of [
        ['vente', 'conditions-generales', 'conditionsGenerales'],
        ['utilisation', 'conditions-utilisation', 'conditionsUtilisation'],
      ]) {
        const rep = await page.goto(`http://localhost:${PORT}/${lang}/${chemin}/`, { waitUntil: 'domcontentloaded' });
        check(`${lang} — la page ${nom} répond`, rep.status(), 200);

        /* Le corps est français quelle que soit la page : sans cette
           déclaration, un lecteur d'écran le prononcerait de travers. */
        check(`${lang} — le corps est déclaré français`, await page.locator('.legal div[lang]').getAttribute('lang'), 'fr');

        const attendus = contenu[cle].filter((s) => s.title).length;
        check(`${lang} — les ${attendus} sections sont là`, await page.locator('.legal__section h2').count(), attendus);

        /* Le lecteur non francophone est averti avant de commencer. */
        const avis = page.locator('.legal__avis');
        if (lang === 'fr') check(`${lang} — aucun avertissement`, await avis.count(), 0);
        else check(`${lang} — l’avertissement est dans sa langue`, (await avis.textContent()).trim(), textes[lang].legal.enFrancais);
      }
      await page.close();
    }

    titre('Le pied de page mène aux deux');
    for (const lang of LANGUES) {
      const page = await nav.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(`http://localhost:${PORT}/${lang}/`, { waitUntil: 'domcontentloaded' });
      for (const [nom, chemin, cle] of [['vente', 'conditions-generales', 'cgv'], ['utilisation', 'conditions-utilisation', 'cgu']]) {
        const lien = page.locator(`.ft__legal > li > a[href$="/${lang}/${chemin}/"]`);
        check(`${lang} — le lien ${nom} est au pied de page`, await lien.count(), 1);
        check(`${lang} — son libellé est traduit`, (await lien.textContent()).trim(), textes[lang].footer[cle]);
      }
      await page.close();
    }

    titre('Le paiement reste fermé tant que la case n’est pas cochée');
    {
      const page = await nav.newPage({ viewport: { width: 1280, height: 900 } });
      await page.route(`**://${DOMAINE}/api/**`, (route) =>
        route.fulfill({ status: 200, contentType: 'application/json',
          body: JSON.stringify({ data: { cart: PANIER, cartCreate: { cart: PANIER, userErrors: [] } } }) }));

      await page.goto(`http://localhost:${PORT}/fr/`, { waitUntil: 'networkidle' });
      await page.evaluate(() => localStorage.setItem('yunma:cart-id', 'gid://shopify/Cart/1'));
      await page.reload({ waitUntil: 'networkidle' });
      await page.click('[data-cart-toggle]');
      await page.waitForTimeout(600);

      const bouton = page.locator('[data-cart-checkout]');
      const cgv = page.locator('[data-cart-cgv]');
      const atteignable = async () => (await bouton.evaluate((e) => getComputedStyle(e).pointerEvents)) !== 'none';

      check('le panier porte bien une ligne', (await page.locator('[data-cart-lines] li, [data-cart-lines] > *').count()) > 0);
      check('la case est décochée au départ', await cgv.isChecked(), false);
      check('le paiement est fermé', await atteignable(), false);
      check('et ne mène nulle part', await bouton.getAttribute('href'), '#');

      await cgv.check();
      await page.waitForTimeout(300);
      check('cochée, le paiement s’ouvre', await atteignable());
      check('et mène à la caisse', await bouton.getAttribute('href'), PAIEMENT);

      await cgv.uncheck();
      await page.waitForTimeout(300);
      check('décochée de nouveau, il se referme', await atteignable(), false);
      await page.close();
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
