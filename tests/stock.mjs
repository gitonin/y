/**
 * Le stock réel, lu chez Shopify après l'affichage.
 *
 *   npm run test:stock
 *
 * Le site est construit une fois, Shopify vend en continu : le drapeau de
 * disponibilité écrit dans le contenu vieillit dès la première vente. La page
 * demande donc à Shopify ce qu'il reste, et redessine l'encart d'achat.
 *
 * Ce contrôle se passe dans un vrai navigateur, avec Shopify simulé : on
 * décide ce que l'API répond, et l'on regarde ce que le visiteur voit — pas ce
 * que le HTML contient. Quatre situations :
 *
 *   1. Shopify dit « épuisé »      → le bloc de rupture paraît, l'achat s'efface
 *   2. Shopify dit « disponible »  → rien ne bouge
 *   3. Shopify ne répond pas       → rien ne bouge non plus (on échoue ouvert :
 *                                    une coupure de réseau ne doit pas barrer
 *                                    la boutique, et la caisse reste le dernier
 *                                    rempart)
 *   4. au catalogue                → seule la carte concernée porte la mention
 */
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { existsSync, rmSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SORTIE = 'dist-stock';
const PORT = 4402;

/* Un domaine qui n'existe pas : aucune requête ne doit sortir d'ici, et si
   l'interception tombait en panne le test échouerait au lieu de réussir en
   silence contre la vraie boutique. */
const DOMAINE = 'boutique-simulee.invalid';
const EPUISE = 'drip-bags-catimor';
const TEMOIN = 'yun-lan-estate';

let ok = 0;
const echecs = [];
const check = (nom, reel, attendu = true) => {
  if (reel === attendu) { ok++; console.log(`  ok    ${nom}`); }
  else { echecs.push(nom); console.log(`  ÉCHEC ${nom}\n        attendu : ${attendu}\n        obtenu  : ${reel}`); }
};
const titre = (t) => console.log(`\n— ${t}`);

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.xml': 'application/xml' };

const main = async () => {
  let chromium;
  try { ({ chromium } = await import('playwright')); }
  catch { console.log('\nPlaywright est absent — contrôle ignoré.'); return; }

  console.log('Construction avec une boutique simulée…');
  rmSync(join(RACINE, SORTIE), { recursive: true, force: true });
  execFileSync('npx', ['astro', 'build', '--outDir', SORTIE], {
    cwd: RACINE,
    stdio: 'pipe',
    env: {
      ...process.env,
      PUBLIC_SHOPIFY_DOMAIN: DOMAINE,
      PUBLIC_SHOPIFY_STOREFRONT_TOKEN: 'jeton-de-test',
    },
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

  /* Ouvre une page dont les appels à Shopify sont joués par `repondre`.
     `repondre` reçoit les identifiants demandés et rend soit une réponse, soit
     null pour simuler une panne. */
  const ouvrir = async (chemin, repondre) => {
    const page = await nav.newPage({ viewport: { width: 1280, height: 900 } });
    let interroge = false;
    await page.route(`**://${DOMAINE}/**`, async (route) => {
      const corps = JSON.parse(route.request().postData() ?? '{}');
      /* Seule la requête de stock nous intéresse ; le panier suit son cours. */
      if (!/availableForSale/.test(corps.query ?? '')) return route.fulfill({ status: 200, body: JSON.stringify({ data: { cart: null } }) });
      interroge = true;
      const reponse = repondre(corps.variables?.ids ?? []);
      if (reponse === null) return route.abort('failed');
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { nodes: reponse } }) });
    });
    await page.goto(`http://localhost:${PORT}${chemin}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(250);
    return { page, aInterroge: () => interroge };
  };

  const tous = (dispo) => (ids) => ids.map((id) => ({ id, availableForSale: dispo }));

  try {
    /* ============ 1. Shopify dit « épuisé » ============ */
    titre('Shopify annonce un café épuisé');
    {
      const { page, aInterroge } = await ouvrir(`/fr/cafes/${EPUISE}/`, tous(false));
      check('Shopify a bien été interrogé', aInterroge());
      check('le bloc de rupture est visible', await page.locator('[data-buy-rupture]').isVisible());
      check('l’encart d’achat a disparu', await page.locator('[data-buy-achat]').isVisible(), false);
      check('le bouton d’achat n’est plus cliquable', await page.locator('[data-add-to-cart]').isVisible(), false);
      check('la promesse d’expédition s’est retirée', await page.locator('[data-buy-expedition]').isVisible(), false);
      check('« torréfié à la commande » demeure', await page.locator('.buy__reassure li').first().isVisible());
      await page.close();
    }

    /* ============ 2. Shopify dit « disponible » ============ */
    titre('Shopify confirme la disponibilité');
    {
      const { page } = await ouvrir(`/fr/cafes/${EPUISE}/`, tous(true));
      check('l’encart d’achat est intact', await page.locator('[data-buy-achat]').isVisible());
      check('aucun bloc de rupture', await page.locator('[data-buy-rupture]').isVisible(), false);
      check('le bouton reste actif', await page.locator('[data-add-to-cart]').isEnabled());
      await page.close();
    }

    /* ============ 3. Shopify ne répond pas ============ */
    titre('Shopify est injoignable — on échoue ouvert');
    {
      const { page } = await ouvrir(`/fr/cafes/${EPUISE}/`, () => null);
      check('l’encart d’achat reste affiché', await page.locator('[data-buy-achat]').isVisible());
      check('aucun bloc de rupture n’apparaît', await page.locator('[data-buy-rupture]').isVisible(), false);
      check('le bouton reste actif', await page.locator('[data-add-to-cart]').isEnabled());
      await page.close();
    }

    /* ============ 4. Le catalogue ============ */
    titre('Au catalogue, seule la carte concernée porte la mention');
    {
      const epuiseIds = JSON.parse(
        await readFile(join(RACINE, 'contenu', 'produits.json'), 'utf8'),
      ).produits.find((p) => p.slug === EPUISE).variants.map((v) => v.shopifyVariantId);

      const { page } = await ouvrir('/fr/cafes/', (ids) =>
        ids.map((id) => ({ id, availableForSale: !epuiseIds.includes(id) })),
      );
      const carte = (slug) => page.locator(`[data-stock-cible]:has(a[href$="/cafes/${slug}/"])`);
      check('la carte du café épuisé porte la mention', await carte(EPUISE).locator('[data-card-rupture]').isVisible());
      check('la carte témoin n’en porte pas', await carte(TEMOIN).locator('[data-card-rupture]').isVisible(), false);
      const visibles = await page.locator('[data-card-rupture]:visible').count();
      check('une seule mention sur toute la page', visibles, 1);
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
