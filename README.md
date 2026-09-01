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

## 4. Visuels

Les images du site sont pour l'instant des **illustrations vectorielles générées**
(`src/components/Scene.astro`) et des **packshots CSS** (`src/components/Packshot.astro`),
dans les couleurs de la marque. Ils tiennent lieu de photographies en attendant les
visuels définitifs : remplacez un `<Scene … />` par une balise `<img>` (ou
`<Image>` d'Astro) sans rien changer d'autre à la mise en page.

Le logo est décliné dans `public/brand/` (lockup, mark, wordmark, favicon, icône 512,
image Open Graph dans `public/og/`).

---

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

## 6. Mise en ligne

Site 100 % statique : `npm run build` produit `dist/`, déployable sur Netlify,
Vercel, Cloudflare Pages, o2switch, etc.

- Variable d'environnement de build : `SITE_URL=https://votre-domaine`
  (utilisée pour les URLs canoniques, le sitemap et les données structurées).
- `public/_redirects` redirige `/` vers `/fr/` sur Netlify et Cloudflare Pages.
  Sur un autre hébergeur, la redirection est assurée côté client par `/index.html`.

---

## 7. Accessibilité et performances

- Navigation clavier complète, focus visible, piège de focus dans le menu et le panier.
- `prefers-reduced-motion` respecté (toutes les animations sont neutralisées).
- Aucune police ni script bloquant hors Google Fonts (Inter) ; les visuels sont
  vectoriels et inline.
- Contenu visible sans JavaScript (les animations d'apparition se désactivent).
