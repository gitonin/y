# Éléments de marque

Logo, poinçon, signature et favicons. Contrairement aux photographies, ces
fichiers sont servis **tels quels** : le site ne les retaille pas, ne les
convertit pas. Ce que vous déposez est exactement ce que le visiteur reçoit.

## Comment déposer

Depuis GitHub, sur la branche `claude/yunma-site-v4` :
**Add file → Upload files**, ou directement par ce lien :
<https://github.com/gitonin/y/upload/claude/yunma-site-v4/public/brand>

Déposer un fichier sous un nom déjà présent le remplace, sans autre
modification.

## En service

| Fichier | Ce que c'est | Où il paraît |
| --- | --- | --- |
| `yunma-logo.svg` | Le logo complet, marque et lettrage | Barre de navigation, menu ouvert, pied de page |
| `yunma-mark.svg` | Le symbole seul, sans lettrage | Filigrane du panier |
| `yunma-poincon.svg` | Le poinçon, en séparateur | Entre deux blocs de texte, sur les pages longues |
| `yunma-signature.svg` | Le lettrage « Slow Coffee ✦ Slow Life » | Bande défilante, au-dessus du pied de page |
| `oro-yunnan.png` | Le logotype d'ORO Yunnan | Page Origine, bloc de soutien |
| `favicon-96.png` | L'icône de l'onglet | Toutes les pages |
| `icon-512.png` | L'icône d'application | Écran d'accueil mobile, manifeste |

## Format

- **SVG** pour le logo, le symbole, le poinçon et la signature : ils sont
  affichés de 22 px à 81 px de haut, un tracé vectoriel tient à toutes les
  tailles. Tracés vectorisés, sans texte vivant, sans police embarquée.
- **PNG** pour les icônes et le logotype partenaire, aux dimensions exactes
  indiquées ci-dessus.
- Fond **transparent** partout : le site est sur crème, un fond blanc s'y
  verrait.

Le fichier source dont le logo, la signature et le poinçon ont été extraits
vit dans `src/assets/marque/elements-yunma.svg`.

## Hors service

`yunma-logo.png`, `yunma-mark.png` et `yunma-wordmark.png` datent d'avant le
passage au SVG. Plus rien ne les affiche : ils peuvent être supprimés.

## Ailleurs

`public/og/yunma-og.png` (1200 × 630) est l'image de partage — celle qui
apparaît quand un lien du site est collé dans un message ou sur un réseau.
