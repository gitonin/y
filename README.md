# Yunma — boutique en ligne

Site vitrine et boutique de **Yunma**, cafés de spécialité du Yunnan.
Statique (Astro), trilingue **français / anglais / chinois simplifié**, paiement et
expédition délégués à **Shopify** (API Storefront).

```bash
npm install
npm run dev      # http://localhost:4321  → redirige vers /fr/
npm run build    # génère dist/
npm run preview  # prévisualise dist/
```

---

## 1. Structure

```
src/
├─ consts.ts                 Coordonnées, réseaux sociaux, config Shopify
├─ data/
│  ├─ products.ts            LES 5 PRODUITS (textes 3 langues, prix, IDs Shopify)
│  └─ legal.ts               Mentions légales & CGV (3 langues)
├─ i18n/
│  ├─ fr.ts / en.ts / zh.ts  TOUS LES TEXTES DU SITE (même structure dans les 3)
│  └─ utils.ts               Helpers de langue et d'URL
├─ content/journal/
│  ├─ fr/ en/ zh/            LE BLOG : un fichier Markdown par article et par langue
├─ components/               Header + navigation, panier, packshots, visuels…
├─ layouts/Base.astro        <head>, SEO, transitions de page
└─ pages/[lang]/             Toutes les pages, générées dans les 3 langues
```

### Pages générées (× 3 langues)

| Page | URL |
| --- | --- |
| Accueil | `/fr/` |
| Tous les cafés | `/fr/cafes/` |
| Fiche produit | `/fr/cafes/<slug>/` |
| Origine | `/fr/origine/` |
| Savoir-faire | `/fr/savoir-faire/` |
| Notre histoire | `/fr/a-propos/` |
| Espace pro (B2B) | `/fr/pro/` |
| Journal (blog) | `/fr/journal/` et `/fr/journal/<slug>/` |
| FAQ | `/fr/faq/` |
| Contact | `/fr/contact/` |
| Mentions légales / CGV | `/fr/mentions-legales/`, `/fr/conditions-generales/` |

`/` détecte la langue du navigateur et redirige (repli : français).

---

## 2. Brancher Shopify (paiement + expédition)

Les boutons « Ajouter au panier » et le panier utilisent l'**API Storefront de Shopify**
(GraphQL, Cart API). Tant que la boutique n'est pas connectée, le site tourne en
**mode démonstration** : le panier fonctionne visuellement, le bouton « Passer commande »
reste inactif.

1. Dans Shopify : **Paramètres → Applications → Développer des applications →
   Créer une application**, puis activez l'**API Storefront** avec les portées
   `unauthenticated_read_product_listings`, `unauthenticated_write_checkouts`,
   `unauthenticated_read_checkouts`.
2. Copiez `.env.example` vers `.env` et renseignez :

   ```
   PUBLIC_SHOPIFY_DOMAIN=votre-boutique.myshopify.com
   PUBLIC_SHOPIFY_STOREFRONT_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
   PUBLIC_SHOPIFY_ACCOUNT_URL=https://votre-boutique.myshopify.com/account
   ```

3. Créez les 5 produits dans Shopify, puis reportez l'**ID de variante** dans
   `src/data/products.ts` (champ `shopifyVariantId`, format
   `gid://shopify/ProductVariant/1234567890`). On le trouve dans l'URL de la variante
   dans l'admin Shopify, ou via l'API Storefront.
4. `npm run build` : le panier bascule automatiquement en mode réel et
   « Passer commande » ouvre le tunnel de paiement Shopify (CB, Apple Pay, PayPal,
   Shop Pay…), qui gère aussi les frais et étiquettes d'expédition.

> Les prix affichés sur le site viennent de `products.ts` (affichage). Les prix
> réellement facturés sont ceux de Shopify : gardez-les synchronisés.

---

## 3. Modifier le contenu

### Par document (recommandé pour les textes rédactionnels)

`contenu/textes-yunma-fr.docx` (et sa version texte `.md`) rassemble les 338 textes
du site en français, chacun précédé d'un code stable entre crochets, par exemple
`[accueil.heroTitle]`. On modifie le texte sous le code, on renvoie le document,
et les modifications sont réinjectées au bon endroit puis traduites.

Le document se régénère depuis les fichiers du site — il ne se périme donc jamais :

```bash
node scripts/export-textes.mjs
```

### Directement dans le code

**Un texte de page** → `src/i18n/fr.ts` (puis `en.ts` et `zh.ts` : même structure,
mêmes clés). Les retours à la ligne `\n` dans les titres créent les lignes animées.

**Un produit** → `src/data/products.ts`. Chaque produit contient son nom, sa
description, son histoire, sa fiche technique et ses conseils d'extraction dans les
trois langues, plus ses variantes (prix + ID Shopify).

**Un article de journal** → créer trois fichiers portant **le même nom** :

```
src/content/journal/fr/mon-article.md
src/content/journal/en/mon-article.md
src/content/journal/zh/mon-article.md
```

```md
---
title: 'Titre de l’article'
description: 'Résumé affiché dans les listes et sur Google (150-160 caractères).'
date: 2025-09-01
tags: ['Yunnan', 'Récolte']
scene: terraces      # ridges | terraces | cherries | canopy | counter | portrait
tone: warm           # warm | cool | deep
draft: false
---

Le corps de l’article en Markdown.
```

Le slug identique dans les trois dossiers relie automatiquement les versions
linguistiques (`hreflang`). Un article publié dans une seule langue reste valide :
les autres langues pointent vers le journal.

**Coordonnées, e-mails, adresse** → `src/consts.ts`.

> Le formulaire de contact compose un e-mail dans le client de l'utilisateur et le
> champ newsletter n'enregistre rien : branchez le service de votre choix
> (Formspree, Basin, Brevo, Shopify Forms…) dans `src/pages/[lang]/contact.astro`
> et `src/components/Footer.astro` quand vous le souhaitez.
**Mentions légales / CGV** → `src/data/legal.ts` (modèles à compléter avec vos
informations définitives : SIREN, RCS, TVA, hébergeur).

---

## 4. Charte et visuels

### Typographie et couleurs

Aucune police n'est chargée depuis le réseau : le site utilise **Helvetica Neue,
Helvetica, puis Arial** en repli, avec les graisses disponibles (`--w-regular`,
`--w-medium`, `--w-bold`, plus `--w-light` là où Helvetica Neue la propose).
Tailles, graisses et interlettrages sont centralisés dans les variables du haut de
`src/styles/global.css`.

Le fond principal est le beige crème **#ebe7de**, décliné en variante claire
(`--paper-soft`, classe `.panel--soft`) et sourde (`--paper-2`, classe `.panel`)
pour donner du rythme d'une section à l'autre. Les textes et tous les noirs sont en
**#212121** (`--ink`), avec l'orangé **#b95f2c** en accent et l'olive **#565a41**
pour les bandeaux professionnels.

### Photographies

Les photographies vivent dans `src/assets/photos/` et sont déclarées une seule fois
dans `src/data/photos.ts` — avec leur texte alternatif dans les trois langues et leur
cadrage par défaut (`object-position`, utile quand une image verticale est affichée
dans un cadre large).

| Clé | Utilisée pour |
| --- | --- |
| `cretes-brumeuses` | Accueil (bandeau), menu ouvert, Origine, clôture « Notre histoire » |
| `recolte-cueilleurs` | Accueil (Notre origine), Origine, Notre histoire |
| `cerises-branche` | Accueil (Notre approche) |
| `sechage-lits` | Savoir-faire, Origine |
| `tabouret-terrasse` | Espace pro, clôture de l'accueil |

Pour remplacer une image : déposez le nouveau fichier dans `src/assets/photos/` et
changez l'import correspondant dans `src/data/photos.ts`. Rien d'autre à modifier.
Pour en ajouter une : ajoutez une entrée dans ce même fichier, puis
`<Photo name="ma-photo" lang={lang} />` là où vous la voulez.

Astro génère automatiquement les versions WebP responsives (5 largeurs, `srcset`
et `sizes`), avec chargement différé partout sauf sur l'image d'en-tête de chaque page.

### Icônes

`src/components/Icon.astro` contient un jeu d'icônes vectorielles dessinées d'après
la planche de la charte : tracés fins, épaisseur constante, angles arrondis.
Usage : `<Icon name="cherries" size={24} />`.

Elles sont employées **avec parcimonie**, à quatre endroits seulement, là où elles
aident à lire ou soulignent un engagement :

- la fiche technique d'un café (séchage, récolte, torréfaction) ;
- les six étapes de la page Savoir-faire ;
- les engagements des pages À propos et Espace pro ;
- la mention de paiement sécurisé, en pied de page.

Ajouter une icône = ajouter un tracé dans l'objet `paths` du composant. Merci de
garder cette discipline : l'icône doit apporter une information, jamais décorer.

### Packagings

Les visuels produits sont pour l'instant des **packshots CSS**
(`src/components/Packshot.astro`) portant le logo, dans les tons de la marque. Quand
vous aurez les photos de packaging, elles remplacent le composant dans
`ProductCard.astro` et sur la fiche produit — la mise en page ne change pas.

Le logo est décliné dans `public/brand/` (lockup, mark, wordmark, favicon, icône 512,
image Open Graph dans `public/og/`).

## 5. Référencement (Google + IA)

- Balises `title` / `description` rédigées par page et par langue.
- `hreflang` complet (fr-FR, en, zh-Hans, `x-default`) sur chaque page + sitemap.
- Données structurées JSON-LD : `Organization`, `WebSite`, `Product` + `Offer`,
  `BlogPosting`, `FAQPage`, `HowTo`, `BreadcrumbList`, `CollectionPage`.
- `sitemap-index.xml` généré au build.
- `robots.txt` autorisant explicitement les robots des moteurs de réponse
  (GPTBot, ClaudeBot, PerplexityBot, Google-Extended…).
- **`/llms.txt`** : résumé structuré de la marque, des produits et des pages,
  destiné aux IA (ChatGPT, Claude, Perplexity). Il est généré automatiquement à
  partir de `products.ts` et des dictionnaires — il reste donc toujours à jour.
- HTML sémantique, contenu rendu côté serveur (pas de JS requis pour lire le site).

Après mise en ligne : déclarez `https://votre-domaine/sitemap-index.xml` dans la
Search Console et vérifiez les rich results produits.

---

## 6. Aperçu en ligne (GitHub Pages)

Un aperçu public est publié automatiquement à chaque push :

**https://gitonin.github.io/y/**

Le workflow `.github/workflows/preview.yml` construit le site et le déploie sur
GitHub Pages. Il se déclenche sur `main`, sur les branches `claude/**`, et
manuellement (onglet **Actions → Aperçu GitHub Pages → Run workflow**).

**À faire une seule fois**, avant le premier déploiement :
**Settings → Pages → Build and deployment → Source : « GitHub Actions »**.
Le jeton du workflow n'a pas le droit d'activer Pages lui-même ; tant que ce n'est
pas fait, le job s'arrête sur `Create Pages site failed`. Une fois activé, relancez
le workflow (**Actions → Aperçu GitHub Pages → Run workflow**, ou *Re-run all jobs*
sur l'exécution échouée).

Si le déploiement est ensuite refusé parce qu'il ne vient pas de la branche par
défaut : **Settings → Environments → github-pages → Deployment branches** et
autorisez `claude/*` (ou « All branches »).

L'aperçu est servi dans un sous-dossier (`/y/`). Le site en tient compte via la
variable `BASE_PATH`, renseignée automatiquement par le workflow : tous les liens,
images et données structurées sont préfixés. En production à la racine d'un
domaine, il n'y a rien à faire — `BASE_PATH` reste vide.

Sur l'aperçu, le panier tourne en mode démonstration. Pour tester le vrai tunnel
Shopify, ajoutez les secrets `PUBLIC_SHOPIFY_DOMAIN`,
`PUBLIC_SHOPIFY_STOREFRONT_TOKEN` et `PUBLIC_SHOPIFY_ACCOUNT_URL` dans
**Settings → Secrets and variables → Actions** : le workflow les utilise au build.

> Autre option, sans publication : ouvrez le dépôt dans **GitHub Codespaces**
> (bouton *Code → Codespaces → Create codespace*), puis `npm install && npm run dev`.
> GitHub vous donne une URL de prévisualisation privée, avec rechargement à chaud.

---

## 7. Mise en ligne

Site 100 % statique : `npm run build` produit `dist/`, déployable sur Netlify,
Vercel, Cloudflare Pages, o2switch, etc.

- Variables d'environnement de build : `SITE_URL=https://votre-domaine`
  (URLs canoniques, sitemap, données structurées) et, uniquement si le site n'est
  pas servi à la racine du domaine, `BASE_PATH=/sous-dossier`.
- `public/_redirects` redirige `/` vers `/fr/` sur Netlify et Cloudflare Pages.
  Sur un autre hébergeur, la redirection est assurée côté client par `/index.html`.

---

## 8. Accessibilité et performances

- Navigation clavier complète, focus visible, piège de focus dans le menu et le panier.
- `prefers-reduced-motion` respecté (toutes les animations sont neutralisées).
- Aucune police distante, aucun script bloquant : le texte s'affiche immédiatement.
- Contenu visible sans JavaScript (les animations d'apparition se désactivent).
