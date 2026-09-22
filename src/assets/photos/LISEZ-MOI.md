# Photographies : fermes, producteurs, ambiances

Déposez ici les photographies de reportage — paysages, gestes, portraits.

## Comment déposer

Depuis GitHub, sur la branche `claude/yunma-site-v4` :
**Add file → Upload files**, ou directement par ce lien :
<https://github.com/gitonin/y/upload/claude/yunma-site-v4/src/assets/photos>

Déposer un fichier sous un nom déjà présent le remplace : rien d'autre n'est à
modifier, le site reprend le nouveau visuel à la publication suivante. Le texte
alternatif, lui, vit dans `src/data/photos.ts` — dites-moi s'il doit changer.

## Ambiances

| Fichier | Sujet attendu | Où elle paraît |
| --- | --- | --- |
| `fondateurs-mer-de-nuages.jpg` | Jixuan et Antoine au-dessus d'une mer de nuages, au lever du jour | Origine (entre ORO et « Notre histoire ») — **photographie verticale**, donc fortement recadrée dans la bande 16/9 du grand écran |
| `cretes-brumeuses.jpg` | Crêtes et vallées du Yunnan dans la brume | Bannière d'accueil, ouverture d'Origine, menu ouvert, 404 |
| `recolte-cueilleurs.jpg` | Cueilleurs à la récolte, à flanc de montagne | Accueil (bloc « À l'origine »), Origine |
| `cerises-branche.jpg` | Branche chargée de cerises rouges et jaunes | Origine (« De décembre à mars »), fiche Catimor |
| `sechage-lits.jpg` | Séchage sur lits surélevés en bambou | Origine (avant le savoir-faire), fiche Lot 02 |
| `tabouret-terrasse.jpg` | Nature morte, terrasse face aux montagnes | Clôture d'Origine et de la page Cafés, Pro |
| `sachet-filtre-infusion.jpg` | Un sachet filtre posé sur une tasse, bouilloire à col de cygne | Article « Réussir sa tasse en sachet filtre » — en-tête et vignette |

## Fermes

| Fichier | Sujet | Où elle paraît |
| --- | --- | --- |
| `ferme-torch-estate.jpg` | Torch Estate, Pu'er | Bloc « La ferme » des Lots 01 et 02 |
| `ferme-yun-lan-estate.jpg` | Yun Lan Estate, Xishuangbanna | Fiche Yun Lan |
| `ferme-gaosheng.jpg` | Gaosheng Manor, Baoshan | Fiches Catimor et Bourbon jaune, Origine |

## Producteurs

| Fichier | Sujet | Où elle paraît |
| --- | --- | --- |
| `producteur-torch-estate.jpg` | Les producteurs de Torch Estate | Photographie d'ambiance du Lot 01, Origine |
| `producteur-yun-lan-estate.jpg` | Cueilleur de Yun Lan Estate | Photographie d'ambiance de la fiche Yun Lan |
| `producteur-gaosheng.jpg` | Tri des cerises au dépulpeur, Gaosheng | Photographie d'ambiance du Bourbon jaune |

## Format

- **JPEG qualité 85 à 95**, profil sRGB
- **3000 px de large au minimum** pour les paysages et les bannières,
  2000 px pour les portraits
- **Format paysage** (3/2 ou 16/9) pour les fermes et les bannières,
  **portrait ou carré** pour les producteurs
- Les fichiers d'origine, pas des versions réduites : le site fabrique
  lui-même toutes les tailles dont il a besoin, en WebP
- Laissez un peu d'air autour du sujet : les bannières recadrent selon la
  largeur de l'écran
- Pas de filigrane, pas de texte incrusté

## Droits

N'envoyez que des images dont vous détenez les droits, ou dont la licence
autorise un usage commercial. Précisez le crédit à porter, s'il y en a un.

## Ailleurs dans le projet

- `src/assets/produits/` — les visuels de packaging, un par référence
- `public/brand/` — logo, poinçon, signature, favicons
- `src/assets/marque/elements-yunma.svg` — le fichier source de la marque,
  d'où le logo, la signature et le poinçon ont été extraits
