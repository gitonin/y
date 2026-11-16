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

L'arbre est **posé au sol**, dans une clairière de neige, au milieu des
montagnes du Yunnan. Trois réglages portent tout le paysage, et chacun a été
trouvé en regardant l'image :

- **la maille du sol est polaire**, et non carrée : les anneaux se resserrent
  géométriquement vers le centre — six centimètres d'écart au pied de
  l'arbre, quarante unités à l'horizon. Une grille carrée de deux cent
  soixante pas sur mille huit cents unités donnait sept unités par maille,
  soit deux sommets sous un arbre qui en fait quatre de large. Et l'on
  dessine quarante-huit mille triangles au lieu de cent trente-cinq mille.
- **le replat** : le relevé réel ne passe pas par zéro sous l'arbre, et une
  crête au milieu du tronc n'aurait pas de sens. Le sol est plat sur douze
  unités, puis rejoint le relief sur cent dix. Un replat de trois cents
  unités donnait une nappe blanche vide au premier plan.
- **le soleil d'hiver**. L'atlas le fait culminer à soixante-six degrés :
  c'est le Yunnan de toute l'année. Ici on est fin décembre, et à
  vingt-quatre degrés de latitude il ne monte qu'à quarante-deux. Au zénith,
  la lumière tombe à plat sur la neige et la montagne disparaît en nappe
  blanche ; rasante, elle lui rend ses versants. Tout le paysage tient à ce
  nombre.

Le ciel de jour est aussi **refroidi** par rapport à celui de l'atlas : une
neige blanche sur le crème du site ne faisait qu'un seul ton, et il n'y avait
plus d'horizon du tout.

## Ce qui vient de l'atlas

Le décor et l'heure sont ceux de l'atlas des variétés, et c'est voulu : deux
expériences du même site n'ont pas à avoir deux couchants différents.

- **Le relief** est le même relevé du Yunnan — `carte/relief.json` —, décodé par
  le même code (`outils/relief-commun.mjs`). L'atlas le garde en 380 × 380 parce
  qu'on y vole au ras du sol ; ici 192 suffit, puisqu'on n'en fait qu'un
  horizon : cent quarante kilos de moins dans la page.
  Il est posé neuf cents unités plus bas que l'île, et l'on n'en montre qu'un
  tiers en largeur — toute la province étalée sur un horizon se chiffonne comme
  du papier.
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
- **Secouer le téléphone** fait tomber les feuilles et les cerises. Les feuilles
  voltigent, puis une bourrasque les emporte et les efface au loin ; les cerises
  sont lourdes et tombent presque droit ; les vœux restent accrochés. Puis tout
  repousse, chacun à son tour, étalé sur près de quatre secondes — l'arbre se
  remplit au lieu de se rhabiller d'un coup. Six mille instances sont
  recomposées à la main pendant les neuf secondes de l'animation : 1 ms par
  image, et plus rien ensuite.
- **La visite guidée** (le bouton ▶) : l'arbre tourne, s'approche d'un vœu tiré
  au sort, le laisse lire, repart, en choisit un autre, lâche ses feuilles au
  vent, les laisse repousser, et recommence. Le premier geste du visiteur
  reprend la main.
- **Le gyroscope** déplace un peu le regard quand on incline l'appareil. Un peu
  seulement, et borné à quinze degrés : un téléphone posé sur une table ne doit
  pas emporter la caméra. Le bouton n'apparaît que là où les capteurs existent —
  sur un ordinateur, les événements existent mais ne se déclenchent jamais. Une
  invitation le propose une fois, au bas de l'écran, sur les appareils qui en
  ont un : dans une barre d'outils, un bouton ne se remarque pas.
- **La neige** tourne autour de celui qui regarde plutôt que d'exister partout :
  mille flocons dans un cylindre de vingt-deux unités, recollés de l'autre côté
  dès qu'ils en sortent. Le même nuage sert de poussière d'or la nuit.

## Ce qui reste à faire

**Les vœux ne sont pas encore partagés.** L'expérience a été écrite dans un
environnement qui fournissait une base de données. Tant que la constante `API`
est vide, chaque vœu reste dans le navigateur de celui qui l'a écrit, et l'arbre
montre les vingt-huit vœux de départ. Rien ne casse et rien ne ment : le message
« accroché sur cet appareil seulement » le dit.

Pour ouvrir l'arbre à tous, poser dans `API` l'adresse d'une petite API sur
Infomaniak (PHP et MySQL font l'affaire) :

    GET  → [{id, s, p, t, n, ts}, …]   les six cents derniers vœux
    POST → {id, s, p, t, n}            un vœu de plus

Côté serveur, trois choses à ne pas oublier : une limite de débit, une longueur
maximale, et **une modération du texte libre** — la page est signée Yunma, et ce
qui s'y accroche l'engage.

**Le chinois n'est pas relu par un locuteur natif** : l'interface et les
versions chinoises des vœux « Noël » et « café » sont à faire vérifier.

**Le gyroscope et la secousse n'ont pas été essayés sur un vrai téléphone.**
L'épreuve vérifie les nombres — les bornes de l'inclinaison, la chute, la
repousse —, mais le seuil de la secousse (trois dépassements de 22 m/s² en une
seconde) a été choisi, pas mesuré. À régler sur l'appareil.
