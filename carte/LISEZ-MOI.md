# La carte du relief

Le relief de la ceinture caféière du Yunnan en trois dimensions, par tranches
d'altitude, avec les trois fermes dont viennent nos cafés.

Comme le jeu, la carte **ne fait pas partie du site** : aucun menu n'y mène,
elle ne figure pas au plan du site, et on y entre par un lien que l'on partage.

    https://yunma.fr/carte/

Cette adresse oriente vers la langue du navigateur. Les trois sont accessibles
directement : `/carte/fr/`, `/carte/en/`, `/carte/zh/`.

Contrairement au jeu, **elle ne demande aucun serveur** : tout est statique.
Elle fonctionne donc aussi sur l'aperçu GitHub Pages.

## La modifier sans toucher au site

Tout tient sous `/carte/`, et aucun fichier n'y porte d'empreinte dans son nom.
On corrige, on redépose ce seul dossier.

| Pour changer… | On modifie… |
| --- | --- |
| les textes (titre, légende, mentions) | `contenu/textes.json`, section `carte` |
| les fiches des fermes | `contenu/produits.json` — la carte les y lit |
| la zone, la finesse, les paliers | `outils/relever-relief.mjs`, puis on le relance |
| la rampe d'altitude, la mise en page | `carte/carte.css` |
| la scène, la caméra, les repères | `carte/carte.ts` |

    npm run relever-relief     # seulement si la zone ou les paliers changent
    npm run construire-carte   # fabrique public/carte/
    npm run test:carte         # vérifie, et mesure la capture

Puis on dépose `public/carte/` dans `/carte/` sur le serveur.

## Ce qui est envoyé, et ce qui est calculé

La page ne reçoit **pas** un relief en trois dimensions. Elle reçoit une grille
de 192 × 192 entiers — un palier d'altitude par maille, un octet chacun, 17 Ko
une fois compressés — et fabrique les 113 000 triangles elle-même, en quelques
dizaines de millisecondes. Un maillage déjà triangulé coûterait cent fois plus
pour le même résultat.

Le relevé vit dans `carte/relief.json`, qui **est versionné** : c'est une
mesure, pas une sortie de construction. `outils/relever-relief.mjs` est le seul
outil du projet qui ait besoin du réseau, et on ne le relance que pour changer
la zone ou les paliers. Il garde les tuiles dans `.cache/`, non versionné.

## Trois choses à ne pas défaire

**La rampe d'altitude est une rampe.** Une seule teinte — l'orange de la charte
— dont la clarté décroît, six paliers écartés d'au moins 0,06 en clarté, et le
plus clair se détache du papier à 2:1. Une altitude est une grandeur : elle se
lit dans l'ordre, ce qu'un dégradé à plusieurs teintes interdit. La ceinture
caféière est signalée par une annotation sur la légende, **jamais** par une
couleur à part. Les six valeurs sont écrites dans `carte.css` et reprises dans
`carte.ts` ; la construction échoue si les deux divergent.

**Les repères ne prennent pas la couleur de la rampe.** Ils sont blancs, cerclés
d'encre. En orange — la couleur de la marque — deux des trois fermes étaient
invisibles sur un relief orange. Une couleur qui désigne ne peut pas être une
couleur qui mesure.

**La position des fermes est approchée, et la page le dit.** Le site donne la
préfecture et l'altitude, jamais les coordonnées des parcelles. Le relevé place
donc chaque ferme sur la maille la plus proche du chef-lieu dont l'altitude
tombe dans la fourchette annoncée. C'est ce qui évite l'erreur grossière :
Jinghong, chef-lieu du Xishuangbanna, est à 555 m, quand Yun Lan cultive entre
1 600 et 1 800 — la ferme est posée dans les hauteurs, à 18 km de la ville. Si
les coordonnées réelles arrivent un jour, elles remplacent ce calcul.

## Ce qui est fabriqué, ce qui est écrit

Les sources sont ici, dans `carte/`. `public/carte/` est fabriqué de bout en
bout par `outils/construire-carte.mjs` et n'est pas versionné : on ne le
modifie jamais à la main.
