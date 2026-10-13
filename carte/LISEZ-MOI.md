# La carte du relief

Le relief de la ceinture caféière du Yunnan en trois dimensions : une maquette
découpée dans du papier épais, et les trois fermes dont viennent nos cafés.

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
| la hauteur des marches, la scène, les repères | `carte/carte.ts`, `MARCHE` |
| la durée de l'ouverture | `carte/carte.ts`, `OUVERTURE` |
| le trajet et la lenteur du survol | `carte/carte.ts`, `GARDE` et `TOUR` |

    npm run relever-relief     # seulement si la zone ou les paliers changent
    npm run construire-carte   # fabrique public/carte/
    npm run test:carte         # vérifie, et mesure la capture

Puis on dépose `public/carte/` dans `/carte/` sur le serveur.

## Ce qui est envoyé, et ce qui est calculé

La page ne reçoit **pas** un relief en trois dimensions. Elle reçoit une grille
de 260 × 260 entiers — une altitude par maille, un octet chacun, une vingtaine
de kilooctets compressés — et fabrique les 143 000 triangles elle-même, en quelques
dizaines de millisecondes. Un maillage déjà triangulé coûterait cent fois plus
pour le même résultat.

Le relevé vit dans `carte/relief.json`, qui **est versionné** : c'est une
mesure, pas une sortie de construction. Il garde l'altitude en continu, un
octet par maille, soit un pas d'environ 11 m — l'équidistance des courbes n'y
est pas inscrite, elle est décidée à l'affichage et se change sans refaire le
relevé. `outils/relever-relief.mjs` est le seul outil du projet qui ait besoin
du réseau ; il garde les tuiles dans `.cache/`, non versionné.

## Six choses à ne pas défaire

**Les strates sont découpées sur la courbe, pas sur la grille.** Chaque strate
est la région située au-dessus d'une altitude. On en trace le contour réel par
marching squares — avec interpolation sur les arêtes, ce qui donne une courbe
lisse plutôt qu'un escalier — puis on l'extrude vers le bas avec un chanfrein,
qui arrondit la lèvre.

Une version antérieure empilait un bloc par maille : les contours suivaient
alors la grille en escalier et les arêtes étaient vives. Des cubes, pas des
strates. Elle était aussi dix fois plus lourde : 208 000 triangles contre
143 000 pour un dessin bien meilleur, parce qu'un contour est une courbe, pas
une surface.

Deux pièges s'y cachent, tous deux rencontrés :

Le champ doit être **bordé d'une couronne très basse**, sinon les contours
sortent du cadre, les anneaux ne se referment pas et la strate se brise en
morceaux.

Un anneau est un contour ou un trou **selon son imbrication**, jamais selon
son sens de parcours. Avec « intérieur à gauche » et un axe z vers le bas, un
grand contour a une aire négative : s'y fier faisait prendre toutes les
grandes strates pour des trous, et il n'en restait que des îlots. On compte
donc les anneaux qui en enveloppent un autre — pair, c'est un contour ;
impair, c'est un trou.

**C'est l'ombre qui dit le relief, rien d'autre.** Pas de couleur d'altitude,
pas de courbe de niveau tracée. Deux versions antérieures l'ont dit en
couleur — un relief brun en terrasses, une bande orange sur la moitié de la
carte — et une troisième traçait les courbes au nuanceur. Toutes abandonnées.
Les trois teintes du papier sont écrites dans `carte.css` et reprises dans
`carte.ts` ; la construction échoue si elles divergent.

**La carte d'ombres est dessinée avec les faces arrière** (`shadowSide =
BackSide`). Avec les faces avant, chaque marche s'ombrait elle-même et toute la
maquette se couvrait de hachures diagonales — l'acné d'ombre classique, que des
réglages de biais ne font que déplacer.

**L'orange de la marque ne sert qu'à désigner.** Les trois fermes, et rien
d'autre. Essayé sur les bornes de la bande du café : les deux altitudes sont
franchies partout, et l'orange s'est répandu sur tout le relief. Une couleur
qui désigne ne peut pas aussi mesurer. Le test mesure la part colorée de
l'image : au-delà de 2 %, il échoue.

**Les bords se fondent, et le mélange se fait AVANT la conversion
colorimétrique.** Sans le fondu, la maquette montre sa tranche et redevient un
objet posé sur une page. Et si l'on mélange après `colorspace_fragment`, la
couleur rendue est déjà en sRGB alors que la teinte du papier, comme toute
couleur de Three, est tenue en linéaire : le bord devenait une dalle pâle au
lieu de disparaître. La greffe porte aussi une `customProgramCacheKey` — sans
elle, les billes, qui sont du même type de matière, pouvaient compiler les
premières et le relief héritait de leur programme, sans le fondu.

**Les billes gardent une taille constante à l'écran.** Leur rayon suit la
distance à la caméra. Fixé dans le monde, il ne pouvait convenir aux deux
échelles de la page : un point invisible vu de haut, ou une boule plus haute
que l'altitude de vol une fois dans la vallée.

## L'ouverture et le survol

**L'ouverture déplie la carte.** On commence à l'aplomb, soleil au zénith :
rien ne porte d'ombre, et la maquette n'est qu'un dessin. Puis la caméra
descend, le soleil s'incline, et le volume apparaît. Un geste l'interrompt — et
ce geste-là ne désigne rien, puisque la caméra vient de sauter à sa place
définitive et que viser sur l'image d'avant n'aurait aucun sens.

**Le survol passe par les trois fermes**, au creux des vallées. Le trajet ne va
pas droit de l'une à l'autre : à chaque point il glisse vers le plus bas des
environs. Sans cette descente, la boucle coupait à travers les crêtes et le vol
passait son temps au-dessus, sans jamais s'y enfoncer. Ce n'est pas un mouvement
décoratif : le trajet est celui du café, et c'est de la vallée qu'on comprend ce
qu'une vue de dessus ne montre pas, que ces fermes sont dans la montagne.

Deux réglages gouvernent le vol, dans `carte.ts` : `GARDE`, la hauteur au-dessus
du sol, et `TOUR`, la durée d'une boucle.

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
