/**
 * Vérifie le thème de renvoi Shopify (`boutique-shopify/`) en exécutant
 * réellement ses modèles Liquid.
 *
 * Ce thème est la seule pièce capable de rattraper les liens que Shopify
 * fabrique vers sa propre vitrine — « Acheter à nouveau », le retour après
 * paiement, les courriels de commande. Il vit chez Shopify, hors de portée des
 * tests du site, d'où ce banc d'essai.
 *
 * Il tourne sans réseau : liquidjs tient lieu de moteur, et les quelques
 * filtres propres à Shopify qu'emploie le thème sont redéfinis à l'identique.
 * Ce n'est donc pas Shopify qui répond, mais la logique testée est bien celle
 * qui s'exécutera là-bas.
 *
 *   npm run test:theme
 */
import { Liquid } from 'liquidjs';
import { readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const THEME = join(RACINE, 'boutique-shopify');

const moteur = new Liquid({ root: THEME, extname: '.liquid', partials: join(THEME, 'snippets') });

/* Filtres Shopify employés par le thème, reproduits fidèlement. `remove_last`
   retire la dernière occurrence où qu'elle soit — c'est précisément ce piège
   que le thème doit contourner, il faut donc le reproduire tel quel. */
moteur.registerFilter('remove_last', (s, m) => {
  const v = String(s ?? '');
  const i = v.lastIndexOf(m);
  return i === -1 ? v : v.slice(0, i) + v.slice(i + m.length);
});
moteur.registerFilter('money', (v) => `${Number(v ?? 0) / 100} €`);
moteur.registerFilter('format_code', (v) => String(v ?? ''));
/* `layout none` court-circuite le gabarit ; c'est déjà le comportement ici. */
moteur.registerTag('layout', { parse() {}, render: () => '' });

const R = 'https://yunma.fr';
const settings = { adresse_site: R };
const ligne = (handle) => ({ product: { handle } });

let ok = 0;
const echecs = [];
const verifier = (nom, reussi, detail = '') => {
  if (reussi) { ok++; console.log(`  ok    ${nom}`); }
  else { echecs.push(nom); console.log(`  ÉCHEC ${nom}${detail ? `\n        ${detail}` : ''}`); }
};

/* ------------------------------------------------ ce qui doit être renvoyé */

const RENVOIS = [
  ['index', {}, `${R}/`],
  ['page', {}, `${R}/`],
  ['404', {}, `${R}/`],
  ['password', {}, `${R}/`],
  ['search', {}, `${R}/collections/all/`],
  ['collection', {}, `${R}/collections/all/`],
  ['list-collections', {}, `${R}/collections/all/`],
  ['blog', {}, `${R}/journal/`],
  ['article', {}, `${R}/journal/`],
  ['product', { product: { handle: 'yun-lan-estate' } }, `${R}/products/yun-lan-estate/`],

  /* Le panier décide d'après son contenu : c'est là qu'aboutit « Acheter à
     nouveau », une fois que Shopify a résolu son identifiant de panier. */
  ['cart', { cart: { items: [ligne('torch-estate-lot-01')] } }, `${R}/products/torch-estate-lot-01/`],
  ['cart', { cart: { items: [ligne('drip-bags-catimor'), ligne('drip-bags-catimor')] } }, `${R}/products/drip-bags-catimor/`],
  ['cart', { cart: { items: [ligne('yun-lan-estate'), ligne('coffret-decouverte')] } }, `${R}/collections/all/`],
  ['cart', { cart: { items: [] } }, `${R}/`],
];

console.log('— renvois attendus —');
for (const [modele, contexte, attendu] of RENVOIS) {
  const html = await moteur.renderFile(`templates/${modele}`, { settings, ...contexte });
  const trouve = (html.match(/content="0; url=([^"]+)"/) || [])[1] ?? '(aucun renvoi)';
  /* Les deux moyens doivent viser la même adresse : la balise « refresh » pour
     les navigateurs sans JavaScript, location.replace() pour les autres. */
  const jsOk = html.includes(`location.replace(${JSON.stringify(attendu)})`);
  const nom = modele === 'cart' ? `cart, ${contexte.cart.items.length} ligne(s)` : modele;
  verifier(`${nom.padEnd(22)} → ${trouve}`, trouve === attendu && jsOk, `attendu : ${attendu}`);
}

/* -------------------------------------- ce qui ne doit surtout PAS renvoyer */

console.log('\n— sans renvoi, volontairement —');
const comptes = readdirSync(join(THEME, 'templates/customers')).map((f) => `customers/${f.replace('.liquid', '')}`);
for (const modele of [...comptes, 'gift_card']) {
  const html = await moteur.renderFile(`templates/${modele}`, {
    settings, gift_card: { balance: 2500, code: 'XXXX-XXXX' },
  });
  const renvoie = /http-equiv="refresh"/.test(html) || /location\.replace/.test(html);
  verifier(`${modele.padEnd(30)} reste chez Shopify`, !renvoie, 'ce modèle renvoie alors qu’il ne devrait pas');
}

/* ------------------------------------------------------------- garde-fous */

console.log('\n— garde-fous —');

const sansAdresse = await moteur.renderFile('templates/index', { settings: {} });
verifier(
  "adresse absente → message, aucun renvoi",
  !/http-equiv="refresh"/.test(sansAdresse) && sansAdresse.includes("n'est pas renseignée"),
);

/* Une adresse contenant un sous-dossier est le cas qui casse : `remove_last`
   appliqué sans garde transforme « …/y/v4 » en « …/yv4 ». */
const FORMES = [
  ['barre finale en trop', `${R}/`, `${R}/`],
  ['espaces autour', `  ${R}  `, `${R}/`],
  ['sous-dossier intact', R, `${R}/`],
  ['domaine nu', 'https://yunma.fr', 'https://yunma.fr/'],
  ['domaine nu, barre finale', 'https://yunma.fr/', 'https://yunma.fr/'],
];
for (const [libelle, valeur, attendu] of FORMES) {
  const html = await moteur.renderFile('templates/index', { settings: { adresse_site: valeur } });
  const trouve = (html.match(/content="0; url=([^"]+)"/) || [])[1] ?? '(aucun renvoi)';
  verifier(`${libelle.padEnd(26)} → ${trouve}`, trouve === attendu, `attendu : ${attendu}`);
}

console.log(`\n${ok} vérifications passées, ${echecs.length} en échec`);
process.exit(echecs.length ? 1 : 0);
