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

- **le terrain de l'atlas**, le même relevé du Yunnan, posé neuf cents
  unités plus bas que l'île et montré sur un tiers de sa largeur : toute la
  province étalée sur un horizon se chiffonne comme du papier ;
- **la brume linéaire**, dont le début et la fin suivent la distance de la
  caméra : l'île reste nette quand on s'en approche, et l'horizon reste
  lointain quand on s'en éloigne ;
- **le flottement** : l'île monte et descend de sept centièmes d'unité. Vu
  de près, c'est un sixième de l'écran — d'où le rattrapage de la visée
  décrit plus bas, sans quoi le mot qu'on lit ne tiendrait pas en place.

## Le cadrage

Le premier regard doit porter l'ensemble : la cime dans l'écran, et le
dessous de l'île **au-dessus du bouton d'appel**, qui mange le bas. On
encadre donc une hauteur connue — du bout des racines au sommet de l'arbre
—, on retire de l'écran utile la bande prise par l'appel, et l'on vise sous
le milieu de ce qui reste. La distance se déduit du champ, en hauteur comme
en largeur : sur un téléphone, c'est la largeur qui commande.

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
- **Souffler sur l'appareil** fait voler les feuilles. Secouer le téléphone
  demandait un capteur de mouvement, une autorisation, et un geste que tout le
  monde ne fait pas spontanément ; souffler, si — et c'est le même geste que le
  vent. On écoute le micro et l'on y cherche un souffle, pas un bruit : un
  souffle est fort *et* grave, il a de l'énergie sous trois cents hertz et
  presque rien au-dessus de deux mille, et il tient un quart de seconde. Une
  voix, une pièce calme, un grondement lointain et un coup bref ne déclenchent
  rien — c'est vérifié. Rien n'est enregistré et rien ne sort de l'appareil :
  on ne lit qu'un niveau, et on l'oublie aussitôt. Le micro existe aussi sur un
  ordinateur : l'entrée du menu n'est pas réservée au téléphone.
- **Rien ne se sélectionne**, sauf les champs de saisie, le lien qu'on copie et
  l'image de la carte, qu'un appui long doit pouvoir enregistrer. Sur un
  téléphone, un appui un peu long ouvrait sinon une sélection bleue avec ses
  poignées, et la loupe du système par-dessus la scène.
- **Le vent** — l'entrée « Faire voler les feuilles » du menu, ou un souffle
  dans le micro — fait tomber les feuilles et les cerises. Les feuilles
  voltigent, puis une bourrasque les emporte et les efface au loin ; les cerises
  sont lourdes et tombent presque droit ; les vœux restent accrochés. Puis tout
  repousse, chacun à son tour, étalé sur près de quatre secondes — l'arbre se
  remplit au lieu de se rhabiller d'un coup. Six mille instances sont
  recomposées à la main pendant les neuf secondes de l'animation : 1 ms par
  image, et plus rien ensuite.
- **La visite guidée** : l'arbre tourne, s'approche d'un vœu tiré au sort, le
  laisse lire, repart, en choisit un autre, lâche ses feuilles au vent, les
  laisse repousser, et recommence. Le premier geste du visiteur reprend la main.
- **La poussière d'or** tourne autour de celui qui regarde plutôt que d'exister
  partout : deux cent soixante grains dans un cylindre de vingt-deux unités,
  recollés de l'autre côté dès qu'ils en sortent.

## Toucher un vœu

Toucher une étiquette **s'en approche, et rien de plus**. Le mot est écrit
dessus ; le redire dans un panneau par-dessus la scène n'ajoute rien et cache
l'arbre. La fiche reste pour les deux vœux qui ont quelque chose à dire de plus
— celui qu'on vient d'accrocher, et celui qu'on vous a envoyé —, et alors la
visée remonte au-dessus d'elle, de la hauteur qu'elle occupe.

Trois réglages font que l'on arrive **sur le mot** :

- **l'angle**. Celui qui touche une étiquette l'a vue : son angle est forcément
  dégagé, et l'on se contente d'avancer — faire le tour de l'arbre pour revenir
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

## Le menu

Le haut de l'écran portait cinq pilules, et le logo s'écrasait entre elles. Il
n'en reste que deux — le son, et le menu —, et les actions sont passées dans un
panneau : la langue, la visite guidée, faire voler les feuilles, et souffler
pour les faire voler là où le micro existe. Le partage est resté en bas, à côté
de « Accrocher un vœu » : ce sont les deux gestes qui comptent, et ils ne se
cachent pas dans un menu.

## Envoyer un vœu

**Le vœu tient dans le lien.** C'est ce qui permet de l'envoyer aujourd'hui,
sans base de données : `…/wishes#v-<vœu encodé>`. Celui qui l'ouvre le voit
accroché à l'arbre, à son nom, carte ouverte — la caméra y va toute seule.

Le lien part par mail, par SMS, ou se copie, depuis le bouton **Envoyer** de la
carte d'un vœu. Et c'est lui que porte le **QR code** de la carte à
télécharger : il menait à l'arbre nu, il mène maintenant au bon mot.

Le codeur de QR code a dû grandir pour cela. Il s'arrêtait à la version 6, soit
cent six signes ; un vœu écrit à la main les dépasse. Il monte maintenant à la
version 9 — jusqu'à deux cent trente signes — en passant du niveau de
correction M au niveau L au-delà de la version 6 : mieux vaut un code un peu
moins robuste qui mène au bon mot qu'un code parfait qui mène à l'arbre nu. Les
versions 7 à 9 en L sont les seules au-delà de 6 dont les blocs sont tous de
même taille, et c'est ce que ce codeur sait faire. Les codes produits sont
relus par un décodeur tiers dans la suite d'épreuves : c'est la seule preuve
qu'ils mènent quelque part.

Un lien `…#w-<identifiant>` désigne un vœu de la base partagée. Il est reconnu,
mais il ne mènera à quelque chose que le jour où cette base existera.

## Ce qui reste à faire

**Les vœux ne sont pas encore partagés** — au sens où l'arbre de l'un n'est pas
l'arbre de l'autre. Un vœu envoyé arrive bien (voir ci-dessus), mais il ne reste
pas : il n'apparaît pas à ceux qui viendront ensuite. Tant que la constante
`API` est vide, chaque vœu accroché reste dans le navigateur de celui qui l'a
écrit, et le message « accroché sur cet appareil seulement » le dit.

Pour que l'arbre se remplisse vraiment, poser dans `API` l'adresse d'une petite
API sur Infomaniak (PHP et MySQL font l'affaire) :

    GET  → [{id, s, p, t, n, ts}, …]   les six cents derniers vœux
    POST → {id, s, p, t, n}            un vœu de plus

Côté serveur, trois choses à ne pas oublier : une limite de débit, une longueur
maximale, et **une modération du texte libre** — la page est signée Yunma, et ce
qui s'y accroche l'engage.

**Le chinois n'est pas relu par un locuteur natif** : l'interface et les
versions chinoises des vœux « Noël » et « café » sont à faire vérifier.

**Le souffle n'a pas été essayé sur un vrai appareil.** L'épreuve vérifie les
nombres — la chute, la repousse, et le détecteur nourri de faux spectres —, mais
les seuils ont été choisis, pas mesurés : des graves au-dessus de −52 dB, treize
décibels de plus que les aigus, tenus un quart de seconde. À régler sur
l'appareil.

Un avertissement qui a coûté du temps : **une page publiée comme artefact
claude.ai ne peut atteindre ni le micro, ni les capteurs de mouvement** — le
cadre les refuse sans même poser la question. Un essai qui y échoue ne prouve
donc rien sur le souffle ; il faut déposer le dossier pour le juger.

Le gyroscope a été essayé, puis retiré : agiter le téléphone ne faisait rien de
sûr, l'autorisation s'ajoutait à celle du micro, et le geste n'était évident
pour personne. Souffler fait le même travail, et c'est le geste du vent.
