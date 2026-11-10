# Yunma — Atlas des variétés de café

Atlas interactif en 3D de la généalogie des variétés de café, avec un accent sur le Yunnan. Trilingue FR / EN / 简体中文.

## Contenu du dossier

- `index.html` — **l'application complète, en un seul fichier** : styles, données, traductions, rendu 3D et son. Une seule chose vient du dehors, la feuille de la police Inter, celle du site ; sans elle la page s'affiche très bien, dans la police de secours. Tout le reste est dedans.
- `ILLUSTRATIONS.md` — la commande des illustrations : ce qu'il faudrait, planche par planche, avec un sujet prêt à coller dans un générateur d'images. **L'atlas n'en porte plus aucune** : il est entièrement textuel.
- `.htaccess` — la règle de cache du dossier.
- `assets/` — le logo Yunma vectorisé (version verticale, symbole seul, nom seul). Ces fichiers ne sont pas utilisés par `index.html`, qui contient déjà le logo en SVG, et ne sont pas déposés.

## Mise en ligne

L'atlas est servi à **yunma.fr/arabica**. `outils/construire-arabica.mjs` écrit
`public/arabica/` à chaque construction du site — la page, le favicon et le
`.htaccess` — et Astro le recopie tel quel dans `dist/`. Le dossier se
redépose seul, sans toucher au reste du site, exactement comme `/jeu/` et
`/carte/` : aucun nom de fichier ne porte d'empreinte.

La construction refuse de passer si la charte s'écarte de celle du site, si
la page se met à charger quelque chose du dehors, ou s'il manque une des
pièces maîtresses. `tests/arabica.mjs` reprend tout cela dans un navigateur,
et mesure en plus ce qui ne se voit pas dans le code : les teintes rendues,
la forme des boutons, les trois langues, les liens profonds, et le fait que
rien ne se recouvre sur un téléphone.

- **Hors du site** : aucun menu n'y mène, la page n'est pas au plan du site et
  elle porte `noindex, nofollow`. On y entre par un lien que l'on partage.
- **Liens directs** : voir plus bas. Ils fonctionnent tels quels dans l'adresse.
- **Pas d'iframe** : la page prend l'écran entier, et une iframe casserait les
  liens profonds — l'adresse de la page parente ne suivrait pas.
- **Liens directs** :
  - `#v-<id>` ouvre une fiche (exemple : `#v-gesha`, `#v-catimor`, `#v-dr132`) ;
  - `#varietes`, `#yunnan`, `#terroirs`, `#sources` ouvrent les pages correspondantes.
- **Stockage navigateur** : la langue et l'état du son (on/off) sont mémorisés dans le `localStorage`.

## Structure de `index.html`


| Lignes | Bloc |
|---|---|
| 13–299 | CSS : charte du site (`--bg #efebe2`, `--paper #fbfaf7`, `--ink #212121`, accent `#a84f26`, olive `#565a41`), Inter puis Helvetica. Boutons droits (2 px) en capitales filetées. Toutes les teintes dérivent de trois triplets (`--encre`, `--pap`, `--fond`) que le cycle jour/nuit réécrit |
| 300–364 | HTML : canvas WebGL `#gl` (décor) + canvas 2D `#c` (arbre), en-tête, menu, socle du temps, cartouche histoire, pages |
| 365–751 | i18n : `UI`, `LT_L`, `NODES_L` (EN/ZH des fiches), `REGIONS_L`, `EVENTS_L`, `STORY_L`… Le texte français est la source, dans les données plus bas |
| 752–767 | `IC` : les icônes de l'interface, en SVG inline |
| 768–921 | `AUD` : nappe ambiante, réverbération, et les notes des boutons (Web Audio, synthèse). `duck()` efface la nappe d'un souffle à chaque note, sans quoi elle les couvre. `reveiller()` la relance quand le système coupe les minuteurs |
| 922–1228 | **Données** : `GROUPS`, `LT` (types de liens), `SRC` (sources), `NODES` (65 variétés), `YLINKS` (arrivées au Yunnan), `EVENTS` (chronologie du Yunnan), `REGIONS` (terroirs), `LOTS` |
| 1229–1317 | Échelle du temps `TS`, dimensions de l'arbre `HGT` / `RS`, `ERAS`, relevé de relief `RELIEF` |
| 1318–1411 | Caméra : `MIND` / `MAXD`, vue d'accueil `HOME`, sphère de poussière `SPH_R` |
| 1412–1732 | Cycle jour/nuit (`CIEL`, `MOMENTS`, `sunUpdate`) + décor WebGL `GL3` (terrain réel du Yunnan, ciel). `hgt()` interpole le relevé en bicubique, `GL3.solXZ()` donne la hauteur du sol sous un point |
| 1733–2140 | `draw()` : rendu de l'arbre (points, fils ondulants, étiquettes sur cartouche), survol des terroirs (`TERR`) |
| 2141–2312 | Pages (`PAGES`), fiche (`openFiche`), `setLang()`, routage par hash |
| 2313–2434 | Histoire animée (`STORY`, `storyStart`, `storyGo`…), mode épuré, `resterAuDessus()` qui garde la caméra au-dessus du relief, boucle d'animation `loop()` |

Les numéros de ligne sont indicatifs : ils bougent à chaque ajout de variété.

## Ajouter ou modifier une variété

1. **Fiche** : ajouter une entrée dans `NODES`, avec ces champs :
   - `id`, `n` (nom), `g` (groupe), `y` (année), `yl` (libellé de date), `pl` (lieu) ;
   - `th` (angle en degrés) et `r` (rayon) : la position dans l'arbre ;
   - `imp` (importance, de 1 à 3), `p` (parents : `[['id','type','note']]`), `d` (texte) ;
   - `yun` (texte « Au Yunnan », facultatif), `s` (sources), `test:1` si la variété est en essai.
2. **Traductions** : ajouter `NODES_L.en[id]` et `NODES_L.zh[id]`.
3. **Planche botanique** : ajouter `BOT.T[id]` (sinon les valeurs par défaut de l'Arabica s'appliquent). Les champs :
   - `fr` : couleurs des fruits ;
   - `fe` : allongement du fruit ; `fs` : taille du fruit ;
   - `wr` : largeur de feuille ;
   - `tip` : jeunes pousses, `'b'` (bronze) ou `'g'` (vertes) ;
   - `hab` : port, parmi `tall`, `dwarf`, `wild`, `shrub`, `tree`, `seed` ;
   - `rust` : nombre de taches de rouille ;
   - `nc` : nombre de fruits par grappe ;
   - `inter` : entre-nœuds (moins de 1 pour les variétés naines).
4. **Arrivée au Yunnan** (facultatif) : `YLINKS` + `YL_L`.
5. **Sources** : chaque clé citée dans `s:[…]` doit exister dans `SRC`, sinon la ligne
   est rendue vide et personne ne le voit. La construction ne le vérifie pas.
6. **Planche illustrée** : ajouter `ILL[id]` pour garder le tableau complet.

Les événements, étapes de l'histoire et terroirs suivent la même logique : français dans les données, EN / ZH dans les tables `_L`, alignés par index. **Ajouter un événement décale les index** : vérifier `EV_ILL` et les `ev:` dans `STORY`,
et garder `EVENTS` trié par année — la chronologie s'affiche dans l'ordre du tableau.
`REGIONS_L` porte trois éléments par terroir : nom, texte, second paragraphe (`d2`).

## Points à savoir

- **Performances** : le décor tourne en WebGL natif, sans bibliothèque. Si WebGL est indisponible, un décor de collines en 2D prend le relais. Le rendu se fait à 0,7× la résolution pour rester fluide sur mobile.
- **Son** : il démarre au premier geste de l'utilisateur, à cause de la règle des navigateurs. Le bouton à gauche du Menu le coupe ou le remet.
- **Police light** : Helvetica Neue Light ne s'affiche que sur macOS et iOS. Ailleurs, le texte retombe sur Arial, en poids normal.
- **Données à confirmer sur place** :
  - noms chinois de certains lieux et lots : Huixun Geisha, Wangjin Yunka, Tiantian, Songfeng, Nongxianshan ;
  - date de création de De-Re 132 (non trouvée) ;
  - chiffre de 80 % des surfaces avancé par l'institut de Dehong (c'est sa propre communication).
- **Sources** : listées dans la page Sources (`#sources`) et dans chaque fiche. Données vérifiées jusqu'en novembre 2026.
