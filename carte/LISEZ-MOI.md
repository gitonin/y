# La carte du relief

Le relief de la ceinture caféière du Yunnan en trois dimensions, en courbes de
niveau, avec les trois fermes dont viennent nos cafés.

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
| la zone et la finesse du relevé | `outils/relever-relief.mjs`, puis on le relance |
| les teintes, la mise en page | `carte/carte.css` |
| l'équidistance, la scène, les repères | `carte/carte.ts` |
| le trajet et la lenteur du survol | `carte/carte.ts`, `GARDE` et `TOUR` |

    npm run relever-relief     # seulement si la zone ou les paliers changent
    npm run construire-carte   # fabrique public/carte/
    npm run test:carte         # vérifie, et mesure la capture

Puis on dépose `public/carte/` dans `/carte/` sur le serveur.

## Ce qui est envoyé, et ce qui est calculé

La page ne reçoit **pas** un relief en trois dimensions. Elle reçoit une grille
de 192 × 192 entiers — un palier d'altitude par maille, un octet chacun, 17 Ko
une fois compressés — et fabrique les 74 000 triangles elle-même, en quelques
dizaines de millisecondes. Un maillage déjà triangulé coûterait cent fois plus
pour le même résultat.

Le relevé vit dans `carte/relief.json`, qui **est versionné** : c'est une
mesure, pas une sortie de construction. Il garde l'altitude en continu, un
octet par maille, soit un pas d'environ 11 m — l'équidistance des courbes n'y
est pas inscrite, elle est décidée à l'affichage et se change sans refaire le
relevé. `outils/relever-relief.mjs` est le seul outil du projet qui ait besoin
du réseau ; il garde les tuiles dans `.cache/`, non versionné.

## Trois choses à ne pas défaire

**Aucune couleur ne code l'altitude.** Le dessin est celui d'une maquette de
topographe : du papier, une surface presque blanche, des courbes de niveau à
l'encre. Ce sont les courbes et l'ombre qui disent la hauteur. Deux versions
antérieures l'ont dit en couleur — un relief brun en terrasses, puis une bande
orange sur la moitié de la carte — et toutes deux ont été abandonnées. Les
trois teintes du relief sont écrites dans `carte.css` et reprises dans
`carte.ts` ; la construction échoue si elles divergent, et le test vérifie
qu'elles restent claires et quasi neutres.

**L'orange de la marque ne sert qu'à désigner.** Les trois fermes, et rien
d'autre. Essayé sur les bornes de la bande du café : les deux altitudes sont
franchies partout, et l'orange s'est répandu sur tout le relief au lieu de
montrer quoi que ce soit. Une couleur qui désigne ne peut pas aussi mesurer.
Le test mesure la part colorée de l'image : au-delà de 2 %, il échoue.

**Le survol passe par les trois fermes.** Le bouton lance une caméra qui suit
une boucle tracée sur les trois fermes, au ras du relief. Ce n'est pas un
mouvement décoratif : le trajet est celui du café, et c'est en rasant les
crêtes qu'on comprend ce qu'une vue de dessus ne montre pas, que ces fermes
sont dans la montagne.

Deux réglages gouvernent tout, dans `carte.ts` : `GARDE`, la hauteur au-dessus
du relief, et `TOUR`, la durée d'une boucle. La hauteur ne suit pas le sol sous
la caméra mais le plus haut d'un dixième du trajet devant elle — réglée plus
court, la caméra épousait chaque bosse et se retrouvait au niveau des crêtes
voisines : on rasait une pente sans jamais voir le paysage.

**Les courbes sont tracées par le nuanceur, pas par de la géométrie.** Là où
l'altitude franchit un multiple de l'équidistance, le pixel s'assombrit. Elles
gardent donc une finesse constante de loin comme de près, et changer
l'équidistance ne coûte rien — alors que des dizaines de milliers de segments
seraient à recalculer.

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
