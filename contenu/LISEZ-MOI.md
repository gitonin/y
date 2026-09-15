# Le contenu du site

Tout ce qui s'écrit sur le site vit dans ce dossier. Le code n'en contient plus
une ligne : il se contente de lire ces fichiers au moment de publier.

Pour mettre le site à jour, il suffit donc de modifier un fichier d'ici et de le
téléverser sur GitHub. La publication se relance toute seule.

```
contenu/
├── textes.json      tous les textes du site, en français, anglais et chinois
├── produits.json    les cafés : prix, formats, fiches techniques, fermes
└── journal/         un article = un fichier, dans fr/ en/ et zh/
```

---

## Avant toute chose : le vérificateur

Une virgule oubliée suffit à empêcher la publication. Pour éviter la mauvaise
surprise, une vérification tourne automatiquement avant chaque mise en ligne, et
dit en français ce qui ne va pas — le fichier, la ligne, la nature du problème.

Pour la lancer vous-même :

```bash
npm run verifier-contenu
```

Tant qu'elle signale un problème, rien n'est publié : le site en ligne reste
celui d'avant. Il n'y a donc aucun risque à essayer.

---

## 1. `textes.json` — les textes du site

Le fichier est découpé en trois blocs :

- **`site`** : les textes des pages, dans les trois langues (`fr`, `en`, `zh`).
- **`mentionsLegales`** et **`conditionsGenerales`** : les deux pages légales,
  en sections titre + paragraphes.

Chaque texte porte le même chemin dans les trois langues. Par exemple le grand
titre de l'accueil :

```json
"site": {
  "fr": { "home": { "heroTitle": "Cafés de spécialité\ndu Yunnan." } },
  "en": { "home": { "heroTitle": "Specialty coffee\nfrom Yunnan." } },
  "zh": { "home": { "heroTitle": "云南精品咖啡" } }
}
```

Trois règles, et c'est tout :

1. **Ne changez que ce qui est entre guillemets, à droite des deux-points.** Ce
   qui est à gauche est le nom du texte : c'est lui qui dit au site où le poser.
2. **Les trois langues doivent avoir exactement les mêmes noms de texte.** Si
   vous en ajoutez un en français, ajoutez-le aussi en anglais et en chinois. La
   vérification vous le rappellera nommément.
3. **`\n` est un retour à la ligne voulu** dans un titre : il dessine la coupe
   des lignes animées. Gardez-en le nombre, ou changez-le en connaissance de
   cause.

Pour écrire un guillemet droit `"` à l'intérieur d'un texte, faites-le précéder
d'une barre oblique inverse : `\"`. Les apostrophes typographiques `’` et les
guillemets français `« »` ne demandent rien de particulier.

---

## 2. `produits.json` — les cafés

Deux blocs : les **fermes**, décrites une seule fois, et les **produits**, qui y
renvoient par leur clé.

```json
"fermes": {
  "torch-estate": {
    "nom": "Torch Estate",
    "place": { "fr": "Pu’er, Yunnan", "en": "…", "zh": "…" },
    "text":  { "fr": "…", "en": "…", "zh": "…" },
    "photo": "ferme-torch-estate"
  }
}
```

Un produit reprend cette clé dans son champ `ferme`, et peut lui donner un autre
nom d'affichage avec `fermeNom` si l'étiquette du sachet en porte un autre.

Les champs à connaître :

| Champ | À quoi il sert |
| --- | --- |
| `slug` | l'adresse de la fiche : `/fr/cafes/<slug>/`. Minuscules, chiffres et traits d'union. Le changer casse les liens déjà partagés. |
| `category` | `grain`, `drip` ou `set` — sert aux filtres de la page Cafés. |
| `visual` | le sachet dessiné de repli, si aucune photographie n'est fournie. |
| `ambiance` | la photographie pleine largeur de la fiche (voir la liste plus bas). |
| `variants` | les formats en vente : libellé, prix, poids, disponibilité. |
| `specs` | la fiche technique, reprise mot pour mot de l'étiquette. |
| `related` | les trois suggestions de bas de fiche, par leur `slug`. |

**Les prix s'écrivent en nombres**, sans symbole et avec un point décimal :
`15` ou `15.50`, jamais `"15 €"`. **`available`** vaut `true` ou `false`, sans
guillemets.

> Les prix réellement facturés restent ceux de Shopify. Ceux d'ici ne servent
> qu'à l'affichage : gardez les deux en accord.

**Ajouter un café** : recopiez un bloc produit entier, changez son `slug`, ses
textes et ses prix, et déposez sa photographie de packaging dans
`src/assets/produits/` sous le nom `<slug>.png`.

---

## 3. `journal/` — les articles

Un article = un fichier Markdown, **portant le même nom dans les trois
dossiers** `fr/`, `en/` et `zh/`. C'est ce nom commun qui relie les versions
entre elles pour Google.

```
contenu/journal/fr/carnet-de-recolte-baoshan.md
contenu/journal/en/carnet-de-recolte-baoshan.md
contenu/journal/zh/carnet-de-recolte-baoshan.md
```

Chaque fichier commence par un en-tête entre deux lignes de trois tirets :

```md
---
title: 'Carnet de récolte : trois semaines à Baoshan'
description: 'Le résumé affiché dans les listes et sur Google — 150 signes environ.'
date: 2025-02-18
tags: ['Yunnan', 'Récolte']
photo: recolte-cueilleurs
draft: false
---

Le corps de l'article, en Markdown : un titre de paragraphe commence par `##`,
un mot important s'entoure de deux astérisques, un lien s'écrit [ainsi](https://…).
```

`draft: true` garde un article hors ligne le temps de l'écrire. Un article
publié dans une seule langue reste valide : les deux autres renvoient au
journal.

---

## Les photographies disponibles

Les champs `photo` et `ambiance` ne peuvent prendre que ces valeurs. Chaque
photographie porte déjà son texte alternatif dans les trois langues.

`recolte-cueilleurs` · `cretes-brumeuses` · `cerises-branche` · `sechage-lits` ·
`tabouret-terrasse` · `ferme-torch-estate` · `ferme-yun-lan-estate` ·
`ferme-gaosheng` · `producteur-torch-estate` · `producteur-yun-lan-estate` ·
`producteur-gaosheng`

Pour en ajouter une : déposez le fichier dans `src/assets/photos/` et décrivez-la
dans `src/data/photos.ts` — c'est le seul endroit du code où il faut passer,
parce qu'une photographie sans texte alternatif est une photographie perdue pour
les moteurs de recherche et illisible pour les lecteurs d'écran.

---

## Ce qui n'est pas ici

- **Coordonnées, adresse, e-mails, seuil de livraison offerte** → `src/consts.ts`.
- **Textes alternatifs des photographies** → `src/data/photos.ts` et
  `src/data/packshots.ts`.

---

## L'autre façon de faire : le document Word

Si vous préférez relire les textes dans Word plutôt que dans un fichier
technique, `textes-yunma-fr.docx` et `journal-yunma-fr.docx` rassemblent les
mêmes textes en français, chacun précédé d'un code entre crochets. Vous
modifiez, vous renvoyez le document, et son contenu est réinjecté dans
`textes.json` puis traduit.

```bash
node scripts/export-textes.mjs          # régénère le document depuis le site
python3 scripts/importer-textes.py contenu/textes-yunma-fr.docx --essai
```

Les deux chemins mènent au même endroit. Le fichier JSON va plus vite quand on
sait où l'on va ; le document Word est plus confortable pour une relecture au
long cours.
