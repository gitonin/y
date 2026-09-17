# Thème de renvoi Shopify

Ce dossier n'est pas une partie du site : c'est un **thème Shopify** à installer
dans la boutique. Il n'affiche aucune page de vente. Son seul rôle est de
rattraper les visiteurs que Shopify envoie sur son propre domaine et de les
renvoyer sur le site Yunma.

## Le problème qu'il résout

La boutique est « headless » : Shopify tient le catalogue, les stocks et le
paiement, mais l'affichage est entièrement le nôtre. Shopify, lui, continue de
fabriquer des liens vers sa propre vitrine — celle que personne n'est censé
voir :

- le bouton **« Acheter à nouveau »** de l'espace client ;
- le retour à la boutique **à la fin du paiement** ;
- les liens produits des **courriels de commande**.

Aucun de ces liens ne peut être corrigé depuis le site : c'est Shopify qui les
écrit, et le site est un ensemble de fichiers statiques, sans serveur pour les
intercepter. Le renvoi doit donc avoir lieu là où ils aboutissent — chez
Shopify. C'est ce que fait ce thème.

Le cas d'« Acheter à nouveau » mérite un mot. Son lien a la forme
`…/cart?cart_link_id=om1OmUXR` : un identifiant opaque, que seuls les serveurs
de Shopify savent traduire. Le site n'avait aucun moyen de deviner ce qu'il
désigne. Le thème, lui, n'a pas ce problème : Shopify résout d'abord le panier,
**puis** affiche la page — et à cet instant le contenu de la commande est connu.
C'est `templates/cart.liquid` qui s'en sert pour viser la bonne fiche.

## Installation

1. Télécharger `theme-renvoi-yunma.zip` (à la racine de ce dossier).
2. Dans l'administration Shopify : **Boutique en ligne › Thèmes**.
3. **Ajouter un thème › Importer un fichier zip**.
4. Sur le thème importé : **Personnaliser › Réglages du thème › Site Yunma**,
   et vérifier l'**adresse du site**.
5. Revenir à la liste et **Publier** le thème.

L'étape 5 est celle qui compte : tant que le thème n'est pas publié, il ne se
passe rien.

## Réglage

Une seule valeur, dans les réglages du thème :

| Réglage | Valeur |
|---|---|
| Adresse du site | `https://gitonin.github.io/y/v4` |

Sans barre oblique finale. Le jour du vrai domaine, remplacer par
`https://yunma.fr` — c'est le seul changement à faire, et il ne demande pas de
réinstaller le thème.

## Ce qui est renvoyé, et où

| Page Shopify | Destination sur le site |
|---|---|
| Accueil, page, 404, mot de passe | `/` |
| Produit | `/products/{handle}/` |
| Collection, recherche | `/collections/all/` |
| Panier — une seule référence | `/products/{handle}/` |
| Panier — plusieurs références | `/collections/all/` |
| Blog, article | `/journal/` |

Ces adresses sont les **passerelles** du site (`src/pages/products/`,
`src/pages/collections/`, `src/pages/journal.astro`). Elles reçoivent la forme
que Shopify sait écrire et renvoient vers la vraie page, dans la langue du
visiteur. Le renvoi fonctionne aussi sans JavaScript.

## Ce qui n'est PAS renvoyé, volontairement

**Les pages de compte** (`templates/customers/`). Le site renvoie « Mon compte »
vers l'espace client Shopify ; si le thème renvoyait l'espace client vers le
site, les deux se renverraient la balle indéfiniment. Ces pages restent donc
chez Shopify.

**La carte cadeau** (`templates/gift_card.liquid`). Son code n'existe que sur
cette page : l'envoyer ailleurs reviendrait à le faire disparaître.

**Le paiement.** Les pages `/checkouts/…` n'appartiennent pas au thème et ne
sont pas touchées. Publier ce thème ne modifie en rien le parcours d'achat.

## À savoir avant de publier

Une fois ce thème publié, `yunma-2.myshopify.com` ne montre plus de boutique :
tout visiteur est renvoyé sur le site. C'est bien l'effet recherché pour une
boutique headless — mais si quelque chose dépend encore de la vitrine Shopify,
il faut le régler avant.

Le thème actuel n'est pas supprimé : il reste dans la bibliothèque, et republier
l'ancien annule tout.
