# L'arbre à souhaits

Une expérience pour les fêtes de fin d'année : un caféier du Yunnan sur une île
qui flotte au-dessus des montagnes, auquel on accroche un vœu sur une étiquette
rouge. Adresse : `https://yunma.fr/wishes`.

    node outils/construire-wishes.mjs     fabrique public/wishes/
    npm run test:wishes                   construit, puis vérifie

## Le dossier

| Fichier | Rôle |
|---|---|
| `index.html` | Toute l'expérience : styles, textes, données, scène et son. |
| `three.min.js` | three.js r128, servi par le site. Déposé sous le nom `three-r128.min.js`, qui porte sa version : c'est ce qui permet de le garder un an en cache. |
| `assets/logo-yunma-transparent.png` | Le logo, à l'accueil et sur la carte. |
| `assets/carte-photo-1050x1480.jpg` | Le fond de la carte à télécharger. Chargé seulement quand quelqu'un ouvre sa carte. |
| `seeds.json` | Vingt-huit vœux de départ, à verser dans la base le jour où elle existera. La page ne les lit pas : tant qu'il n'y a pas de base, elle fabrique son décor à partir des vœux tout faits. Ce fichier n'est pas déposé. |
| `.htaccess` | Cache court sur la page, long sur la bibliothèque, compression. |

Comme l'atlas des variétés, ce dossier **se redépose seul** : aucun menu du site
n'y mène, il ne figure pas au plan du site, et l'on y entre par un lien qu'on
partage. Le corriger ne demande pas de reconstruire les cent fichiers du site.

## Le décor

L'arbre **flotte sur une île**, au-dessus des montagnes du Yunnan. Il avait
été posé au sol, dans une clairière de neige, le temps d'un essai : on est
revenu à l'île, qui tient mieux la promesse — un caféier suspendu, et la
province entière derrière.

Trois choses portent ce paysage :

- **le terrain de l'atlas**, le même relevé du Yunnan, posé très bas sous
  l'île — ses crêtes passent une trentaine d'unités au-dessus d'elle — et
  montré sur un tiers de sa largeur : toute la province étalée sur un
  horizon se chiffonne comme du papier ;
- **la brume linéaire**, dont le début et la fin suivent la distance de la
  caméra : l'île reste nette quand on s'en approche, et l'horizon reste
  lointain quand on s'en éloigne ;
- **le flottement** : l'île monte et descend de sept centièmes d'unité. Vu
  de près, c'est un sixième de l'écran — d'où le rattrapage de la visée
  décrit plus bas, sans quoi le mot qu'on lit ne tiendrait pas en place.

Sous l'île, il n'y a rien, et c'est voulu. Il y avait un disque d'ombre très
bas, qui devait la faire flotter : une ombre posée sur rien se lit comme une
tache. Et il y avait deux cent soixante grains de poussière d'or montant le
long de l'arbre : la profondeur de champ en faisait des pastilles de couleur,
et l'on ne voyait plus que cela. Les deux sont partis.

## Le cadrage

Le premier regard doit porter l'ensemble : la cime dans l'écran, et le
dessous de l'île **au-dessus du bouton d'appel**, qui mange le bas. On
encadre donc une hauteur connue — du bout des racines au sommet de l'arbre
—, on retire de l'écran utile la bande prise par l'appel, et l'on vise sous
le milieu de ce qui reste. La distance se déduit du champ, en hauteur comme
en largeur : sur un téléphone, c'est la largeur qui commande.

**L'œil est à l'horizontale**, ou presque. Il surplombait l'île de treize
degrés : on voyait l'arbre d'en haut, les montagnes s'écrasaient dans le bas
de l'image et l'horizon disparaissait. À hauteur d'homme, les crêtes
repassent derrière l'arbre, où elles doivent être — et le relief a été
remonté de soixante-quinze unités pour qu'elles y passent vraiment. La visée
est en outre portée un peu haut, ce qui fait descendre l'île dans l'image :
le ciel au-dessus d'elle lui donne sa place.

L'épreuve le vérifie sur trois écrans — large, carré, téléphone.

## Ce qui vient de l'atlas

Le décor et l'heure sont ceux de l'atlas des variétés, et c'est voulu : deux
expériences du même site n'ont pas à avoir deux couchants différents.

- **Le relief** est le même relevé du Yunnan — `carte/relief.json` —, décodé par
  le même code (`outils/relief-commun.mjs`). L'atlas le garde en 380 × 380 parce
  qu'on y vole au ras du sol ; ici 192 suffit, puisqu'on n'en fait qu'un
  horizon : cent quarante kilos de moins dans la page.
- **Le soleil** monte à la même hauteur que dans l'atlas. Il avait été rabaissé
  à quarante-deux degrés pour la neige de décembre, qui donnait sinon une nappe
  blanche sans versants ; la neige partie, le soleil est revenu.
- **Le cycle du jour** (`CIEL`) est recopié à la virgule près : une journée en
  deux heures, treize moments, les mêmes couleurs. `?heure=20` fige l'horloge,
  pour les épreuves.
- **Les teintes de nuit** de l'interface sont celles de l'atlas, qui ont déjà
  fait l'épreuve du contraste au plus noir.

## Ce qui est propre à cette expérience

- **La nuit allume les vœux.** Les étiquettes émettent leur propre texture :
  le papier rouge rougeoie, et les caractères dorés, qui en sont les pixels les
  plus clairs, s'allument davantage. Un halo derrière chacune, tous dans un seul
  tracé. Le fil d'or passe de réfléchir à émettre, et une lune froide prend le
  relais du soleil — sans elle, l'arbre disparaîtrait avec les vœux.
- **Le vœu est écrit en or**, et non plus à l'encre sombre. De jour, l'encre
  noire sur le rouge ne tenait que 2,8:1 ; l'or en tient 11,5. De nuit, c'est ce
  qui permet aux mots de briller au lieu de rester en silhouette.
- **Un caféier n'a qu'un tronc.** Il en avait quatre : une souche courte de
  rayon 0,30 d'où repartaient quatre tiges de 0,17, d'où la marche de
  circonférence qu'on voyait et le bouquet de perches. *Coffea arabica* pousse
  en monopode — un axe vertical unique, des rameaux horizontaux par paires
  opposées, de plus en plus courts vers le haut. C'est de là que vient sa
  silhouette en cône, qui tombe bien pour Noël.
- **Rien ne se sélectionne**, sauf les champs de saisie, le lien qu'on copie et
  l'image de la carte, qu'un appui long doit pouvoir enregistrer. Sur un
  téléphone, un appui un peu long ouvrait sinon une sélection bleue avec ses
  poignées, et la loupe du système par-dessus la scène.
- **Le vent** — le plan du vent de la visite guidée — fait tomber les feuilles
  et les cerises. Les feuilles voltigent, puis une bourrasque les emporte et les
  efface au loin ; les cerises sont lourdes et tombent presque droit ; les vœux
  restent accrochés. **L'arbre reste nu un moment** : la repousse ne commence
  qu'après cinq secondes et demie, s'étale sur dix, et chaque feuille met deux
  secondes à revenir. Elle partait quatre secondes après la bourrasque et
  s'étalait sur cinq : on n'avait pas le temps de voir l'arbre dépouillé que les
  feuilles étaient déjà revenues. Six mille instances sont recomposées à la main
  pendant les seize secondes de l'animation : 1 ms par image, et plus rien
  ensuite. La visite, elle, repart vers un vœu au bout de neuf secondes,
  pendant que l'arbre se remplit derrière.

## L'ouverture

**On n'entre pas par un plan large, on entre par un mot.** Le vœu de Yunma —
« Yunma vous souhaite de joyeuses fêtes », dans la langue du visiteur — est
accroché à la place la mieux dégagée de l'arbre : la plus éloignée du tronc, à
mi-hauteur, au bout du fil le plus long. La caméra s'y pose de tout près, avec
la profondeur de champ qui va avec ; sept secondes plus tard, la visite guidée
prend la main et s'en va de proche en proche.

Deux choses passent avant, et c'est voulu : un vœu reçu par un lien — c'est lui
qu'on est venu lire, et c'est de lui que la visite partira —, et le premier
geste du visiteur : il a pris la main, on ne la lui reprend pas tout de suite.

Ce vœu-là est toujours le premier de l'arbre, il garde sa place même si l'arbre
déborde, et il ne compte pas parmi les vœux du public.

## La visite guidée

Ce qu'on regarde, dans cet arbre, ce sont les mots. **Six plans sur neuf sont
donc des vœux**, et l'on y dérive lentement au lieu de s'y arrêter : la
caméra tourne autour du mot et respire un peu, le temps qu'on le lise.
Immobile, le plan serait une photographie ; ici, c'est un mouvement
d'appareil, et c'est la profondeur de champ qui fait le reste.

On va **de proche en proche** : le vœu suivant est tiré parmi les plus proches
voisins de celui qu'on quitte, et non au hasard dans tout l'arbre. On traverse
ainsi la ramure au lieu de sauter d'un bord à l'autre. Le premier de la visite
est celui de Yunma — c'est la maison qui accueille.

Les trois autres plans rappellent où l'on est :

- **la ronde large**, lente, à une hauteur et une distance tirées au sort ;
- **la plongée** ou **la contre-plongée**, en alternance : vu de haut, l'île
  devient un radeau ; vu d'en bas, on remonte le tronc, les étiquettes passent
  au-dessus et le ciel ferme l'image — c'est le plan qui donne sa taille à
  l'arbre ;
- **le vent** : on recule d'abord, car la bourrasque ne se voit pas le nez sur
  une étiquette, puis les feuilles s'envolent — et le ciel s'en mêle.

Le diaphragme s'ouvre pendant la visite : le flou n'y est plus un confort,
c'est ce qui dit où regarder.

**Elle n'a pas de bouton.** Elle se lance seule au bout de l'ouverture, le
premier geste du visiteur la lui reprend, et elle revient d'elle-même après dix
secondes sans un geste, rien d'ouvert par-dessus et aucun doigt sur l'écran.
C'est une veilleuse, pas un film qu'on lance.

## Le ciel a des habitants

Une veilleuse qui ne surprend jamais finit par ne plus rien montrer. Le ciel a
donc deux habitants, et ils passent d'eux-mêmes toutes les vingt ou trente
secondes — plus souvent pendant la visite guidée.

- **Des volutes d'air.** Trois rubans plats de soixante-quatre segments dont on
  recalcule la courbe à chaque image : deux ondulations qui ne tombent pas
  juste, l'une en hauteur, l'autre en profondeur, et une largeur qui s'éteint
  aux deux bouts. Ils sont **presque à plat** — quelques dixièmes d'unité
  d'ondulation sur vingt-six de long : ce n'est pas une arabesque, c'est un
  souffle. Ils traversent derrière l'île, montent d'un rien en passant comme
  l'air chaud, paraissent vite et s'en vont longuement : un souffle de vent ne
  s'éteint pas comme il s'allume.
  Un vol d'oiseaux passait ici : joli de près, mais à trente unités ce ne sont
  plus que des triangles sombres, et l'on ne savait pas ce qu'on voyait. Un
  courant d'air ne demande pas qu'on le reconnaisse.
- **Des étoiles filantes, la nuit** — deux fois sur trois, l'autre fois une
  volute : un trait et non un point, car c'est la traîne qui se voit. Elle
  s'allume, file, et s'éteint en une seconde et demie.

Les volutes sont **un trait d'encre le jour**, une lueur pâle la nuit. Dorées,
elles ne se voyaient pas : il n'y a pas trente pour cent d'écart entre un or
clair et le crème de ce ciel. L'encre, si — et c'est la matière du site, dont
le logo est fait de traits.

Les deux se placent **par rapport à la caméra** et non par rapport à l'île :
lâchés à un angle tiré au sort, ils traversaient le plus souvent hors champ. Et
la hauteur de l'étoile filante se mesure depuis l'œil — le ciel qu'on voit à
l'écran n'est qu'une bande de huit degrés au-dessus de l'horizontale, et posée
à trente unités de haut, elle filait au-dessus du cadre.

## La musique de Noël

Elle **part d'elle-même** : on entre dans une veillée, et la pilule du son
suffit à la faire taire. Rien n'est téléchargé ; les airs sont joués note à
note par les mêmes oscillateurs que le reste de la page.

**Quatre airs, tous du domaine public**, notés en demi-tons au-dessus du do et
en croches : *Douce nuit* (1818), *Carol of the Bells* (Leontovitch, 1914, dont
quatre notes font tout l'air), *We wish you a merry Christmas* (anglais
traditionnel) et *Vive le vent* (1857). Ils se relaient dans l'ordre, à partir
d'un air tiré au sort.

**Entre deux airs, une pause.** Un coup de gong, puis deux bols qui tournent :
on sort de la ritournelle, on respire, et l'air suivant n'arrive pas comme une
piste qui s'enchaîne. Le bol a des partiels qui ne tombent pas sur
l'harmonique, une attaque lente et deux voix désaccordées d'un souffle — c'est
ce battement-là qu'on entend tourner dans un bol. Le gong de fond de la scène,
lui, se tait pendant toute la musique : deux sources graves à la fois font une
soupe.

La voix de la mélodie est une cloche : une fondamentale, trois partiels, une
attaque sèche et une longue traîne, posée sur un coussin de tonique et de
quinte très graves.

Les notes sont programmées **une seconde et demie à l'avance**, et par un
battement de quart de seconde qui ne dépend pas de la boucle d'images : une
scène lourde saute des images par poignées, et la mélodie hoquetait. Si
l'horloge prend de l'avance — le son coupé, un onglet laissé de côté —, on
repart de l'instant présent, sans quoi toutes les notes du temps perdu
sonneraient ensemble.

**Quitter la page suspend l'horloge du son**, et c'est voulu : un arbre qui
chante dans un onglet qu'on a quitté est mal élevé. Le retour, lui, ne l'était
pas. « Reprendre » était demandé une fois, sans vérifier que cela avait pris —
or cela ne prend pas toujours : une page revenue d'arrière-plan n'a pas
toujours le droit de redémarrer son audio sans un geste, et le navigateur ne
dit rien, il laisse l'horloge arrêtée. On revenait d'Instagram sur un arbre
muet, et le bouton du son n'y changeait rien, puisqu'il ne fait que baisser un
volume.

Maintenant : on essaie au retour, on vérifie trois dixièmes de seconde plus
tard, et si l'horloge est toujours arrêtée on attend le premier geste du
visiteur pour réessayer — un seul suffit, et le secours se désarme derrière
lui. Le changement de visibilité, le retour depuis la mémoire du navigateur et
la reprise du focus mènent tous les trois au même endroit. La mélodie, elle,
n'a rien perdu : une horloge suspendue ne vieillit pas, et les notes déjà
programmées sont toujours devant nous.

L'épreuve joue les deux retours, celui qu'on accorde et celui qu'on refuse en
silence.

## Accrocher le sien

Un vœu qu'on vient d'accrocher s'annonçait par un cartouche qui surgissait
par-dessus la scène, le mot déjà écrit dessus et trois boutons dessous. On
voyait le panneau, pas l'étiquette.

Maintenant, c'est une affaire de temps :

- **la caméra part la première**, seule, vers la place où le vœu va paraître ;
- **une seconde plus tard, l'étiquette pousse et l'or éclate** : quatre-vingts
  grains partent du vœu et retombent — une direction prise au hasard sur la
  sphère, une vitesse qui l'est un peu moins (plus vers le haut, sans quoi la
  gerbe tombe comme un sac), un frein, une pesanteur, et chacun scintille à son
  rythme, car un grain d'or qui ne clignote pas n'est qu'un point jaune. Les
  deux partaient d'abord ensemble : le mot avait fini de pousser et l'or de
  retomber avant que la vue n'arrive, et l'on ne voyait rien ;
- **la fiche vient en dernier**, deux secondes et demie après la gerbe, quand
  on a vu : « Votre vœu », puis le mot, puis Envoyer, Carte et Retour. Le titre
  annonce le mot, il ne le suit pas — un titre se lit avant.

L'étiquette et sa gerbe suivent **la même horloge**, celle de la scène, et non
l'une la scène et l'autre la montre : sur une machine qui rame, elles
resteraient sinon à une seconde l'une de l'autre.

Et **rien ne s'affiche en noir par-dessus l'arbre**. « Vœu accroché sur cet
appareil seulement » était un aveu technique posé au moment précis où l'on
vient d'y mettre son mot : la seule chose qu'on y gagnait, c'était de gâcher ce
moment-là. Le vœu est enregistré, la gerbe le dit, et cette notice dit le
reste. Les seuls messages qui restent répondent à un geste explicite — un lien
copié, une carte enregistrée, un champ vide.

## Toucher un vœu

Toucher une étiquette **s'en approche**, et fait paraître une pilule discrète
au-dessus de l'appel : « Envoyer ce vœu ». S'approcher d'un mot donne envie de
l'envoyer, et il n'y a rien d'autre à proposer là — le mot est écrit sur
l'étiquette, le redire dans un panneau par-dessus la scène n'ajoute rien et
cache l'arbre. La pilule se tait pendant la visite guidée, où la caméra passe
de mot en mot.

La fiche, elle, reste pour les deux vœux qui ont quelque chose à dire de plus
— celui qu'on vient d'accrocher, et celui qu'on vous a envoyé —, et alors la
visée remonte au-dessus d'elle, de la hauteur qu'elle occupe.

**Tout vœu s'envoie**, le décor compris : ce sont des vœux comme les autres, et
le lien les reporte à l'identique chez celui qui l'ouvre. Seul celui de Yunma
n'a pas de lien à lui — son texte change avec la langue de qui le lit, et il
n'y a rien à figer dedans. Sa pilule ne paraît donc pas : elle n'aurait proposé
que de partager l'arbre, ce que l'icône à côté de l'appel fait déjà.

Trois réglages font que l'on arrive **sur le mot** :

- **l'angle**. Celui qui touche une étiquette l'a vue : son angle est forcément
  dégagé, et l'on se contente d'avancer — à ceci près que le rayon du doigt ne
  traverse que les étiquettes, de sorte qu'on peut en toucher une cachée
  derrière une feuille ; on regarde donc ce qu'il y a devant elle, et si
  quelque chose la couvre, on cherche un angle — faire le tour de l'arbre pour revenir
  sur le même mot désoriente, et rien ne le justifie. La visite guidée et un
  lien reçu, eux, n'ont pas d'angle choisi par quelqu'un : ils en cherchent un.
  Vingt et un angles sont essayés autour du vœu, cinq rayons chacun — le centre
  du mot, ses deux bords, son haut, son bas —, et l'on garde le premier qui ne
  traverse ni feuille ni cerise. Un seul rayon ne suffisait pas : une feuille
  qui couvre la moitié d'une étiquette ne croise pas son milieu. La recherche
  s'arrête au bout de trente millisecondes, et garde alors le moins mauvais :
  mieux vaut un angle imparfait tout de suite qu'un temps mort au doigt.
- **la distance** se déduit de la forme de l'écran, comme à l'accueil : deux
  unités et demie sur un ordinateur, trois et demie sur un téléphone, dont le
  champ est bien plus étroit. Deux et demie sur un téléphone mettaient le nez
  dans les feuilles.
- **le flottement**. L'île monte et descend ; vue de près, un vœu monterait et
  descendrait avec elle d'un sixième de l'écran. La visée suit donc l'île, et le
  mot ne bouge plus.

## Les textes tiennent la nuit

Tout bascule à la tombée du jour : l'encre devient claire, le crème devient
bleu de minuit, et l'interface suit sans qu'on s'en occupe — tant qu'elle est
écrite en variables. Ce qui se défait, ce sont les couleurs posées une fois
pour toutes.

Deux l'étaient. Le champ où l'on écrit son vœu s'éclaircissait au focus, d'un
blanc fixe : la nuit, l'encre étant claire elle aussi, on écrivait **en blanc
sur blanc** — un rapport de contraste de 1,05 contre 1, sur le seul endroit de
l'expérience où le visiteur a quelque chose à écrire. Et la fenêtre de la
story, dont le fond est sombre en tout temps, prenait ses textes au thème :
ils s'effaçaient le soir. Le texte de remplacement des champs, laissé au
navigateur, tombait lui à 3,5.

Le jour, lui, était pire que la nuit, et personne ne l'avait vu parce que
personne ne l'avait mesuré. Les textes seconds — le conseil du bas, les
transcriptions en pinyin, les notes sous les champs — étaient posés entre 45 et
65 % d'encre. Sur le crème du jour, cela tombe entre 2,6 et 4,6 contre 1, là où
les mêmes opacités tiennent 6 à 9 sur le bleu de nuit : de l'encre sombre sur
un fond clair perd beaucoup plus vite que l'inverse. Une transcription qu'on ne
peut pas lire ne sert personne ; ils sont remontés à 68-70 %, et restent
seconds par leur taille et leur interlettrage.

L'épreuve mesure maintenant, pour de bon, le rapport de contraste d'une
quarantaine de textes sur le fond réellement composé derrière eux — fonds
translucides empilés compris, et **texte translucide compris** : la première
version de cette mesure ne composait que le fond, de sorte qu'un texte à deux
dixièmes d'opacité lui paraissait parfaitement lisible. Elle certifiait ce
qu'elle était censée attraper. Tout est mesuré deux fois, à treize heures et à
vingt-deux heures, et le plus faible doit tenir 4,5 contre 1.

## Le logo

C'est un dessin noir sur fond transparent. Sur le bleu de minuit il
disparaissait : le thème l'inversait donc avec la nuit. Mais il disparaît aussi
**en plein jour dès qu'on s'approche de l'arbre**, où ce sont des feuilles
sombres qui passent derrière lui — et le thème, lui, est resté au jour.

On lit donc huit pixels sur huit à l'endroit même du logo, dans l'image qu'on
vient de dessiner, **deux fois par seconde** — de vraies secondes, et non
d'horloge de scène, qui est plafonnée par image et ne donnait plus qu'une mesure
toutes les dix secondes sur une machine lente. Clair ou sombre, l'inversion suit
par un fondu, avec une zone morte entre les deux seuils, sans quoi le logo
clignoterait sur un fond qui hésite. Et il ne redescend jamais sous ce que le
thème demande : la nuit, il reste blanc.

## Le haut de l'écran

Il portait cinq pilules, et le logo s'écrasait entre elles ; puis deux, dont un
menu. Le menu s'est vidé à mesure que les choix disparaissaient — la visite
guidée se lance seule, la musique part seule, les guirlandes n'existent plus —,
et un panneau pour une seule ligne est un panneau de trop. Il ne reste que **le
son et la langue**, trois lettres directement accessibles.

Le partage et « Accrocher un vœu » sont restés en bas : ce sont les deux gestes
qui comptent, et ils ne se cachent pas.

Le **conseil du bas** — « glisser pour tourner, pincer pour zoomer, toucher une
étiquette » — ne s'efface plus au bout de neuf secondes. Il disparaissait juste
au moment où l'on commençait à vouloir toucher quelque chose, et plus rien ne
disait comment.

Le **compteur des vœux** a été retiré : « un vœu accroché » sous un arbre qui
en porte trente n'annonçait rien, ni ce qu'on voit, ni ce qu'on peut faire.

## Envoyer un vœu

**Le vœu tient dans le lien.** C'est ce qui permet de l'envoyer aujourd'hui,
sans base de données : `…/wishes?v=<vœu encodé>`. Celui qui l'ouvre le voit
accroché à l'arbre, à son nom — la caméra y va toute seule, et **de bien plus
près que pour les autres** : c'est le seul mot qu'il soit venu lire, et il doit
remplir l'écran assez pour qu'on n'ait rien à faire pour le lire.

Il ne reçoit pas de cartouche. Une ligne suffit — « Camille vous envoie ce
message » —, et dessous les deux boutons de toujours. Le mot est écrit sur
l'étiquette, que la caméra montre ; un panneau qui le répète, avec ses propres
boutons, ne servait qu'à cacher l'arbre.

Le lien part par mail, par SMS, ou se copie, depuis le bouton **Envoyer** de la
carte d'un vœu, ou depuis la pilule « Envoyer ce vœu » quand on en regarde un de
près. Le partage de l'arbre lui-même, lui, s'annonce simplement :
« Partagez l'expérience ». Et c'est lui que porte le **QR code** de la carte à
télécharger : il menait à l'arbre nu, il mène maintenant au bon mot.

Le codeur de QR code a dû grandir pour cela. Il s'arrêtait à la version 6, soit
cent six signes ; un vœu écrit à la main les dépasse. Il monte maintenant à la
version 9 — jusqu'à deux cent trente signes — en passant du niveau de
correction M au niveau L au-delà de la version 6 : mieux vaut un code un peu
moins robuste qui mène au bon mot qu'un code parfait qui mène à l'arbre nu. Les
versions 7 à 9 en L sont les seules au-delà de 6 dont les blocs sont tous de
même taille, et c'est ce que ce codeur sait faire.

**Tout ce chemin est éprouvé d'un bout à l'autre**, et c'est la seule preuve
qui vaille : l'épreuve écrit un vœu comme un visiteur — une forme, des mots à
soi, un prénom —, l'accroche, ouvre l'envoi, vérifie que le brouillon de mail
et celui de SMS portent le vœu, le prénom et le lien, télécharge la carte, puis
compare le QR code produit à celui qu'une bibliothèque tierce fabrique pour le
même lien : module pour module, format et masque compris. Si les deux matrices
sont identiques, n'importe quel lecteur y trouvera le lien. Elle ouvre enfin ce
lien dans un autre navigateur et vérifie que le mot est là, au bon nom, la
caméra dessus et la carte ouverte.

**Pourquoi une question et non un dièse.** Le vœu voyageait d'abord après le
dièse, `…#v-<vœu>`. La différence ne se voit pas à l'œil, mais elle décide de
tout ce qui viendra : *ce qui suit un dièse n'arrive jamais au serveur*. Aucun
réseau social ne peut donc savoir de quel vœu il s'agit quand on lui colle le
lien, et la vignette qu'il affiche ne peut être que celle de l'arbre nu. Avec
une question ordinaire, le serveur pourra un jour fabriquer la vignette du vœu
lui-même. Le changement a été fait avant toute mise en ligne, tant qu'aucun
lien n'était parti ; les liens en `#v-…` restent lus, et l'épreuve le vérifie.

Un lien `…#w-<identifiant>` désigne un vœu de la base partagée. Il est reconnu,
mais il ne mènera à quelque chose que le jour où cette base existera.

## Suivre Yunma

Au bas de la fiche, sous un filet, une ligne : *« Janvier 2027, Yunma repart
au Yunnan chercher les nouveaux cafés. Suivez-nous »*, et une porte —
**suivre sur Instagram**.

**Le moment.** Quelqu'un qui vient d'écrire un vœu et de le voir s'accrocher a
donné quelque chose : c'est le seul instant de la visite où l'on peut demander
en retour. La ligne vit donc dans la fiche, et nulle part ailleurs — et la
fiche ne s'ouvre que là, ou lorsqu'on touche le vœu qu'un ami nous a envoyé.
Une fois qu'on a répondu, elle ne reparaît plus (`yw_abo` dans la mémoire du
navigateur). Demander deux fois, c'est harceler.

**On ne garde rien.** Pas d'adresse, pas de champ, pas de relais sur le
serveur, rien à écrire nulle part — le dossier reste entièrement statique. Le
compte est un lien ordinaire, `https://www.instagram.com/yunma.coffee`, ouvert
dans une autre page : pas un bouton de réseau qui pisterait, et rien n'est
chargé de chez eux. On ne saura jamais si la personne s'est abonnée, et ce
n'est pas grave : on a demandé une fois.

## La story

Sur Instagram, **un lien ne se clique pas**. Ce qui s'y partage est une image
ou un film ; le lien du vœu, lui, n'y sert à rien. La page fabrique donc le
film elle-même, à la demande, et le remet au système.

**Ce qu'on voit** : sept secondes au format vertical. La caméra part de six
unités, vient se poser sur le mot, l'or éclate au moment où elle arrive, et
elle continue d'avancer imperceptiblement jusqu'à la fin — c'est ce dernier
rien qui fait qu'une image est vivante et non figée.

Par-dessus, **tout ce qui signe se tient ensemble**, dans la bande calme du
bas : le vœu écrit en toutes lettres, le prénom, un filet, puis le nom de
l'expérience, le logo, « Cafés de spécialité du Yunnan » et **l'adresse du
site**. Cette dernière est le seul élément qui ramène quelqu'un — une story
repartagée par un ami ne porte aucun lien cliquable. Le nom était d'abord posé
en haut, sur le feuillage : il s'y lisait mal le jour et pas du tout la nuit.
Un nom de marque n'a rien à faire seul au milieu d'une image ; il va avec le
logo.

**Les couleurs suivent l'heure**, comme le reste de l'interface : voile crème
et encre noire le jour, voile de nuit et encre claire le soir. Une bande de
papier clair collée au bas d'une scène nocturne n'aurait trompé personne. Le
logo, qui est un dessin noir, est repeint à la teinte de l'encre dans une
toile de côté — une fois par teinte, et non trente fois par seconde.

**Trois choses commandent toute la fabrication.**

1. **Instagram ne prend pas le WebM.** Un navigateur qui ne sait encoder que
   cela ne nous sert à rien : on fabrique alors une image fixe, en
   1080 × 1920, qui passe partout. Le film, lui, est en MP4/H.264, en
   720 × 1280 — assez pour une story, assez léger pour partir d'un téléphone.
2. **La feuille de partage ne s'ouvre que sur un geste**, et sept secondes de
   tournage ont depuis longtemps épuisé celui du départ. On montre donc le
   film quand il est prêt, et c'est en touchant « Partager » qu'on ouvre la
   feuille. C'est de toute façon ce qu'on voudrait : voir avant d'envoyer.
   Là où la feuille ne prend pas de fichier — un ordinateur, un navigateur
   ancien —, le bouton devient « Enregistrer » et dit quoi faire ensuite.
3. **Un cadre vertical n'est pas un écran.** Le sujet n'y va pas au milieu,
   sinon il tombe dans le texte qui monte du bas : la visée descend d'un
   quart de demi-hauteur, mesuré sur la distance d'arrivée — mesuré sur la
   distance du large, il viserait vingt mètres sous l'arbre et la première
   image montrerait le dessous de l'île. Et rien d'important ne descend dans
   les deux cent cinquante derniers pixels : Instagram y pose son interface.

**Le film ne s'ouvre pas sur du noir.** L'enregistreur naissait avec la
toile, avant que la première image n'y soit peinte : son flux retenait donc
l'image d'avant — une toile vide, c'est-à-dire du noir, puis, une fois la
toile remplie de crème pour éviter ce noir, un rectangle crème. Dans les deux
cas le film s'ouvrait sur rien, et l'on ne savait pas ce qu'on regardait — or
c'est cette première image que les réseaux prennent pour vignette. Il naît
maintenant à la première image composée, sur une toile qui porte déjà la
scène ; le bandeau et le titre y sont à pleine force, et seuls le vœu et
l'adresse montent en fondu. L'horloge du film part elle aussi de cette
première image, et non du moment où l'on appuie : sur une machine lente, le
temps de passer au format d'une story aurait mangé l'ouverture.

L'épreuve mesure cette première image : sa clarté, qui écarte le noir, et
l'écart entre son point le plus sombre et le plus clair, qui écarte le fond
uni.

**Comment c'est fait.** Le rendu passe au format d'une story — même machinerie
que le redimensionnement de la fenêtre, cible du flou comprise —, la boucle
d'image écrit la trajectoire sur la montre et non sur l'horloge de la scène
(un film dure sept secondes pour celui qui le regarde, quelle que soit la
vitesse de la machine), chaque image est recopiée dans une toile où l'on écrit
par-dessus, et c'est cette toile que l'enregistreur filme. Le bandeau est là
dès la première image : c'est elle que les réseaux prennent pour vignette.
Pendant le tournage, la veilleuse ne part pas et l'île ne décale plus la
visée. À la fin, la scène est rendue à l'écran telle qu'elle était.

L'aperçu empile le film sur la toile, qui garde sa dernière image : un
navigateur qui sait encoder sans savoir décoder — cela existe — montrerait
sinon un rectangle noir à la place de ce qu'on vient de fabriquer.

**Ce que l'épreuve vérifie** : que le fichier est fabriqué, qu'il est bien un
MP4 nommé `voeu-yunma.mp4`, que sans encodeur c'est une image de 1080 × 1920,
que le format du rendu est pris puis rendu, et que l'arbre nu ne propose pas
de story — il n'a pas de mot à filmer. Le film produit a été ouvert hors du
navigateur : H.264, 720 × 1280, durée juste. **Ce qu'elle ne peut pas
vérifier, c'est qu'Instagram l'accepte** : cela se voit sur un téléphone.

## Ce qui reste à faire

**Les vœux ne sont pas encore partagés** — au sens où l'arbre de l'un n'est pas
l'arbre de l'autre. Un vœu envoyé arrive bien (voir ci-dessus), mais il ne reste
pas : il n'apparaît pas à ceux qui viendront ensuite. Tant que la constante
`API` est vide, chaque vœu accroché reste dans le navigateur de celui qui l'a
écrit. Rien ne le dit plus à l'écran — c'était un cartouche noir posé sur
l'arbre au pire moment ; c'est écrit ici, et cela suffit.

En attendant, **les trente vœux tout faits tiennent lieu de monde** : ils sont
signés, ils sont là dès la première visite, et ils restent quand on accroche le
sien. C'est une fiction assumée — un arbre vide donne envie de partir, et le
jour où la base existera, les vrais vœux viendront simplement par-dessus.

Pour que l'arbre se remplisse vraiment, poser dans `API` l'adresse d'une petite
API sur Infomaniak (PHP et MySQL font l'affaire) :

    GET  → [{id, s, p, t, n, ts}, …]   les six cents derniers vœux
    POST → {id, s, p, t, n}            un vœu de plus

Côté serveur, trois choses à ne pas oublier : une limite de débit, une longueur
maximale, et **une modération du texte libre** — la page est signée Yunma, et ce
qui s'y accroche l'engage.

**Le chinois n'est pas relu par un locuteur natif** : l'interface et les
versions chinoises des vœux « Noël » et « café » sont à faire vérifier.

**La musique n'a pas été écoutée.** L'épreuve vérifie que les notes sont
programmées, qu'elles le sont en avance et que l'air avance ; elle ne peut pas
dire si cela sonne juste. Les deux airs sont notés à la main, et le premier
écouteur sera le premier juge. De même, l'équilibre entre la cloche, le coussin
grave et le gong de fond est posé au jugé.

**Le gyroscope et le souffle ont été retirés.** Incliner le téléphone déplaçait
un peu le regard : joli sur le papier, invisible à l'usage. Souffler dans le
micro faisait voler les feuilles : joli aussi, mais cela demandait une
autorisation que personne n'accorde à un arbre — et une page publiée comme
artefact claude.ai ne peut atteindre ni le micro ni les capteurs de mouvement,
de sorte qu'on ne pouvait ni l'essayer ni le régler sans déposer le dossier.
Secouer le téléphone, qui ne demande rien à personne, en tient lieu.

**La story n'a jamais été publiée.** Elle est fabriquée, mesurée, ouverte hors
du navigateur — mais ni Instagram ni la feuille de partage d'un téléphone
n'existent ici. Trois choses se verront au premier essai sur un appareil :
qu'Instagram prend bien le fichier, que le film n'est pas saccadé sur un
téléphone modeste (la trajectoire dure sept secondes quelle que soit la
machine, mais une machine lente y met moins d'images), et que la feuille de
partage propose bien Stories, Reels et la publication.

**Les liens collés n'ont pas encore de vignette.** Facebook, X ou Threads vont
chercher dans la page l'image qu'ils affichent, et la page n'en déclare
aucune. Le lien est prêt pour cela depuis qu'il porte le vœu dans sa question
(voir « Pourquoi une question et non un dièse ») : il reste à poser une belle
vignette unique pour `/wishes`, puis, si les chiffres montrent que les liens
voyagent par copier-coller, une vignette par vœu fabriquée par le serveur.
