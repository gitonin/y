/**
 * Récupère les identifiants Shopify des six références et les écrit dans
 * `contenu/produits.json`.
 *
 * Sans ces identifiants, le panier ne peut rien faire : il crée le panier
 * Shopify à partir de `shopifyVariantId`, et ceux-ci sont vides tant que la
 * boutique n'a pas été branchée. C'est la seule étape qui ne peut pas être
 * devinée depuis le code.
 *
 * L'outil n'a besoin que du jeton **Storefront**, qui est public et en lecture
 * seule. Il n'utilise jamais l'API Admin, et n'a donc aucun moyen de modifier
 * quoi que ce soit dans la boutique.
 *
 *   # lecture seule : dit ce qu'il trouve, ne touche à rien
 *   PUBLIC_SHOPIFY_DOMAIN=xxxx.myshopify.com \
 *   PUBLIC_SHOPIFY_STOREFRONT_TOKEN=xxxxxxxx \
 *   node outils/ids-shopify.mjs
 *
 *   # puis, une fois le rapport relu, l'écriture
 *   node outils/ids-shopify.mjs --ecrire
 *
 * Les deux variables peuvent aussi vivre dans un fichier `.env` à la racine.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const FICHIER = 'contenu/produits.json';
const VERSION_API = '2024-10';
const ecrire = process.argv.includes('--ecrire');

/* ------------------------------------------------------------- identifiants */

/** Lit `.env` sans dépendance : une ligne `CLE=valeur`, les # sont ignorés. */
const lireEnv = () => {
  if (!existsSync('.env')) return {};
  const out = {};
  for (const ligne of readFileSync('.env', 'utf8').split('\n')) {
    const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
};

const env = { ...lireEnv(), ...process.env };
const domaine = env.PUBLIC_SHOPIFY_DOMAIN?.trim();
const jeton = env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN?.trim();

if (!domaine || !jeton) {
  console.error(
    "Il manque le domaine ou le jeton.\n\n" +
      "  PUBLIC_SHOPIFY_DOMAIN=xxxx.myshopify.com \\\n" +
      "  PUBLIC_SHOPIFY_STOREFRONT_TOKEN=xxxxxxxx \\\n" +
      "  node outils/ids-shopify.mjs\n\n" +
      "Le jeton attendu est celui de l'API **Storefront** (public, lecture seule).\n" +
      "Jamais celui de l'API Admin, qui commence par shpat_ et ne doit sortir de nulle part."
  );
  process.exit(1);
}

if (jeton.startsWith('shpat_')) {
  console.error(
    "Ce jeton est un jeton d'API **Admin** (shpat_), pas un jeton Storefront.\n" +
      "Il donne un accès en écriture à toute la boutique : ne le collez nulle part,\n" +
      "révoquez-le dans l'administration Shopify, et créez un jeton Storefront à la place."
  );
  process.exit(1);
}

/* ------------------------------------------------------------------ requête */

const REQUETE = `
  query($handle: String!) {
    product(handle: $handle) {
      id
      title
      handle
      variants(first: 20) {
        nodes {
          id
          title
          availableForSale
          price { amount currencyCode }
        }
      }
    }
  }`;

async function chercher(handle) {
  const res = await fetch(`https://${domaine}/api/${VERSION_API}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': jeton,
    },
    body: JSON.stringify({ query: REQUETE, variables: { handle } }),
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error(
      `${res.status} — ce jeton n'est pas accepté par l'API Storefront.\n` +
        "      Soit ce n'est pas un jeton Storefront, soit l'application n'a pas\n" +
        "      l'autorisation de lire les produits. Vérifiez dans l'administration\n" +
        '      Shopify que le jeton vient bien de la section « API Storefront ».'
    );
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const { data, errors } = await res.json();
  if (errors?.length) throw new Error(errors.map((e) => e.message).join(' · '));
  return data?.product ?? null;
}

/* -------------------------------------------------------------------- corps */

/* Une requête d'essai avant tout le reste : si le jeton ne convient pas, mieux
   vaut le dire une fois clairement que six fois de suite, une par produit. */
try {
  const res = await fetch(`https://${domaine}/api/${VERSION_API}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': jeton },
    body: JSON.stringify({ query: '{ shop { name } }' }),
  });
  if (res.status === 401 || res.status === 403) {
    console.error(
      `Shopify refuse ce jeton (${res.status}).\n\n` +
        "Ce n'est pas un jeton d'API Storefront, ou l'application qui l'a émis n'a pas\n" +
        "l'autorisation de lire le catalogue. Dans l'administration Shopify, ouvrez votre\n" +
        'application, onglet « Identifiants d\'API », et prenez le jeton affiché sous\n' +
        '« API Storefront » — pas celui affiché sous « API Admin ».'
    );
    process.exit(1);
  }
  if (!res.ok) {
    console.error(`La boutique ${domaine} répond ${res.status} ${res.statusText}. Domaine correct ?`);
    process.exit(1);
  }
  const { data } = await res.json();
  if (data?.shop?.name) console.log(`Connecté à « ${data.shop.name} ».`);
} catch (e) {
  console.error(`Impossible de joindre ${domaine} : ${e.message}`);
  process.exit(1);
}

const contenu = JSON.parse(readFileSync(FICHIER, 'utf8'));
const avertissements = [];
let trouves = 0;

console.log(`Boutique : ${domaine}\n`);

for (const produit of contenu.produits) {
  const handle = produit.shopifyHandle;
  let distant;
  try {
    distant = await chercher(handle);
  } catch (e) {
    console.log(`✗ ${produit.slug}\n    la requête a échoué : ${e.message}`);
    avertissements.push(`${produit.slug} : ${e.message}`);
    continue;
  }

  if (!distant) {
    console.log(`✗ ${produit.slug}\n    aucun produit Shopify avec le handle « ${handle} »`);
    avertissements.push(`${produit.slug} : handle « ${handle} » introuvable dans la boutique`);
    continue;
  }

  trouves++;
  console.log(`✓ ${produit.slug}  →  ${distant.title}`);
  produit.shopifyProductId = distant.id;

  const variantes = distant.variants.nodes;
  if (variantes.length !== produit.variants.length) {
    const m = `${produit.slug} : ${produit.variants.length} format(s) sur le site, ${variantes.length} chez Shopify`;
    console.log(`    ⚠ ${m}`);
    avertissements.push(m);
  }

  produit.variants.forEach((variante, i) => {
    const distante = variantes[i];
    if (!distante) return;
    variante.shopifyVariantId = distante.id;
    variante.available = distante.availableForSale;

    const prixShopify = Number(distante.price.amount);
    const accord = Math.abs(prixShopify - variante.price) < 0.005;
    console.log(
      `    ${variante.label.fr.padEnd(18)} ${distante.id}` +
        `  ${prixShopify.toFixed(2)} ${distante.price.currencyCode}` +
        (accord ? '' : `  ⚠ le site affiche ${variante.price.toFixed(2)}`) +
        (distante.availableForSale ? '' : '  ⚠ en rupture chez Shopify')
    );
    if (!accord) {
      avertissements.push(
        `${produit.slug} / ${variante.label.fr} : ${variante.price.toFixed(2)} sur le site, ` +
          `${prixShopify.toFixed(2)} chez Shopify — c'est Shopify qui fait foi au paiement`
      );
    }
  });
}

console.log(`\n${trouves} référence(s) sur ${contenu.produits.length} retrouvée(s) dans la boutique.`);

if (avertissements.length) {
  console.log('\nÀ regarder :');
  for (const a of avertissements) console.log('  ·', a);
}

if (!ecrire) {
  console.log(`\nRien n'a été écrit. Relancez avec --ecrire pour reporter les identifiants dans ${FICHIER}.`);
  process.exit(0);
}

if (trouves !== contenu.produits.length) {
  console.error(
    `\nÉcriture annulée : ${contenu.produits.length - trouves} référence(s) manquent encore.\n` +
      "Mieux vaut compléter la boutique d'abord qu'écrire un fichier à moitié rempli."
  );
  process.exit(1);
}

writeFileSync(FICHIER, `${JSON.stringify(contenu, null, 2)}\n`);
console.log(`\n${FICHIER} mis à jour.`);
