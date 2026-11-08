# Les illustrations de l'atlas — inventaire et sujets

Ce document sert à refaire les illustrations. Pour chacune : ce qu'elle
montre, où elle paraît, et un texte prêt à coller dans un générateur
d'images — en français puis en anglais, les modèles répondant mieux à
l'anglais.

---

## Ce qu'il faut savoir avant de commencer

**Une seule planche est visible aujourd'hui.** L'atlas sait en dessiner
douze, mais le code n'en affiche qu'une : *Paysage du Yunnan*, en tête de la
page « Le Yunnan » et en tête de la page « Terroirs ». Les onze autres sont
fabriquées et jamais montrées. Deux tables les désignent — `ILL`, qui
associe une planche à chacune des 47 variétés, et `EV_ILL`, qui en associe
une à chaque étape de la chronologie — mais ni l'une ni l'autre n'est lue au
moment du rendu. C'est à décider : soit on les branche, et les onze planches
servent enfin, soit on les retire, et l'atlas perd environ 250 lignes.

**Les planches botaniques, elles, sont partout et sont les plus réussies.**
Chaque fiche de variété en porte une — 47 fiches, 47 planches. Elles ne sont
pas dessinées à la main : le code les compose à partir des caractères de la
variété (couleur des fruits, port, largeur de feuille, taches de rouille,
entre-nœuds). On ne peut donc pas les remplacer par des images toutes
faites sans en produire 47, et sans perdre ce qui fait leur intérêt :
elles disent quelque chose de vrai sur chaque variété. **Mon avis : les
garder.** Si elles doivent évoluer, c'est en retouchant le dessin
paramétré, pas en les remplaçant.

**Format attendu pour les remplaçantes.** Les planches actuelles font
320 × 200 (8:5 paysage), encre sur papier crème, avec un double filet et une
légende dessinés *dans* l'image.

> Pour les nouvelles, demandez l'illustration **seule** : pas de cadre, pas
> de numéro « PL. », pas de légende, pas le moindre texte. Le cadre et la
> légende seront reposés par le code, dans la police du site — c'est ce qui
> garde l'ensemble cohérent et traduisible en trois langues.

- **Proportion** 8:5 paysage, livrée en 1600 × 1000 au moins
- **Fond** crème `#efebe2` (le papier du site), uni
- **Encre** anthracite `#212121`
- **Accent** terre de Sienne `#b95f2c`, par petites touches seulement
- **Vert** olive `#565a41` si une feuille doit être verte
- Pas d'ombre portée, pas de dégradé appuyé, pas de blanc pur
- Lisible à 330 px de large : c'est la taille réelle sur un téléphone

---

## 1 · Paysage du Yunnan `montagnes`

**La seule visible**, et deux fois : en tête de « Le Yunnan » et en tête de
« Terroirs ». C'est donc celle à refaire en premier.

*Aujourd'hui* : des crêtes au trait, un soleil cerclé, deux barres
horizontales censées figurer des nuages — elles se lisent comme des
rectangles égarés —, des hachures verticales pour les versants et un
premier plan de courbes serrées.

**Sujet** — Les moyennes montagnes du sud-ouest du Yunnan, entre 1 000 et
2 000 m : des croupes successives qui s'éloignent dans la brume, le fond des
vallées noyé, des terrasses de caféiers sur les versants proches. Le
sentiment à rendre : l'étagement, et la brume qui mange les plans
lointains.

> Illustration éditoriale moderne : des crêtes de montagne qui s'étagent
> dans la brume, sud-ouest du Yunnan, cinq ou six plans successifs de plus
> en plus pâles, les versants proches portant de fines lignes de terrasses
> de caféiers, un fond de vallée noyé de brume. Trait fin et sûr, aplats
> sobres, grande respiration. Encre anthracite sur papier crème, une seule
> touche de terre de Sienne. Format paysage 8:5, aucun texte.

> *EN* — Modern editorial illustration: layered mountain ridges fading into
> mist, south-west Yunnan, five or six receding planes each paler than the
> last, the nearest slopes carrying fine contour lines of coffee terraces, a
> valley floor drowned in haze. Confident thin linework, restrained flat
> shapes, generous negative space. Charcoal ink on cream paper, a single
> burnt-sienna accent. 8:5 landscape, no text, no frame, no caption.

---

## 2 · Rameau fructifère `rameau`

*Aujourd'hui* : une branche oblique, feuilles opposées hachurées, grappes de
cerises. C'est l'une des trois meilleures.

**Sujet** — Un rameau de caféier en fruits : feuilles opposées, brillantes,
à nervation marquée ; cerises en glomérules serrés à l'aisselle des
feuilles, à tous les stades de maturité, du vert au rouge sombre.

> Illustration botanique moderne : un rameau de caféier arabica chargé de
> cerises, feuilles opposées à nervure centrale nette, grappes serrées de
> fruits à l'aisselle des feuilles, du vert au rouge profond. Trait fin,
> aplats sobres, composition en diagonale, beaucoup de vide autour. Encre
> anthracite sur papier crème, vert olive pour le feuillage, terre de
> Sienne pour les fruits mûrs. Format paysage 8:5, aucun texte.

> *EN* — Modern botanical illustration: an arabica coffee branch heavy with
> cherries, opposite glossy leaves with a clear midrib, tight clusters of
> fruit in the leaf axils ranging from green to deep red. Fine linework,
> restrained flat colour, diagonal composition, plenty of empty space around it.
> Charcoal ink on cream paper, olive green foliage, burnt-sienna ripe fruit.
> 8:5 landscape, no text, no frame, no caption.

---

## 3 · Coupe de la cerise `cerise`

*Aujourd'hui* : un disque moucheté, deux demi-grains côte à côte, quatre
étiquettes au bout de lignes de rappel. Le grain ressemble à un comprimé.

**Sujet** — Une cerise de café coupée en deux dans le sens de la largeur,
quatre couches lisibles de l'extérieur vers le centre : la peau, la pulpe,
la parche, et les deux grains plats face à face. Un dessin qui doit
s'expliquer sans légende.

> Coupe anatomique moderne d'une cerise de café, vue de face, quatre couches
> nettement distinctes : peau rouge mince, pulpe claire, parche beige
> parcheminée, deux grains plats accolés au centre avec leur sillon.
> Illustration éditoriale précise, trait fin, aplats doux, pas de brillance.
> Papier crème, encre anthracite, terre de Sienne pour la peau. Format
> paysage 8:5, le fruit à gauche, du vide à droite, aucun texte.

> *EN* — Modern anatomical cross-section of a coffee cherry, seen face on,
> four clearly separated layers: thin red skin, pale pulp, parchment, two
> flat beans facing each other with their centre crease. Precise editorial
> illustration, fine linework, soft flat colour, no gloss. Cream paper,
> charcoal ink, burnt-sienna skin. 8:5 landscape, fruit on the left, open
> space on the right, no text, no frame, no caption.

---

## 4 · Feuille et nervation `feuille`

*Aujourd'hui* : une grande feuille hachurée, et une petite en comparaison.
Correcte.

**Sujet** — Une feuille de caféier vue de dessus, allongée, à bord
légèrement ondulé, nervure centrale franche et nervures secondaires en
arêtes régulières ; à côté, beaucoup plus petite, une feuille d'arabica pour
l'échelle — la grande étant celle d'une autre espèce.

> Illustration botanique moderne : une grande feuille de caféier vue de
> dessus, limbe allongé à bord ondulé, nervure centrale marquée et nervures
> secondaires régulières, posée en diagonale ; à côté, une feuille beaucoup
> plus petite de la même famille, pour l'échelle. Trait fin, deux valeurs de
> vert olive, fond crème uni. Format paysage 8:5, aucun texte.

> *EN* — Modern botanical illustration: one large coffee leaf seen from
> above, elongated blade with a wavy edge, strong midrib and regular
> secondary veins, set on a diagonal; beside it a much smaller leaf of the
> same family, for scale. Fine linework, two values of olive green, flat
> cream background. 8:5 landscape, no text, no frame, no caption.

---

## 5 · Floraison `fleur`

*Aujourd'hui* : un glomérule sur une branche, et une fleur à cinq pétales
dessinée à plat, très géométrique — elle fait schéma plus que fleur.

**Sujet** — La floraison du caféier : des bouquets blancs serrés le long de
la branche, à l'aisselle des feuilles, et une fleur isolée en gros plan,
cinq pétales, étamines apparentes, parfum de jasmin sous-entendu.

> Illustration botanique moderne : à gauche une branche de caféier en pleine
> floraison, bouquets de fleurs blanches serrés à l'aisselle des feuilles ; à
> droite une seule fleur en gros plan, cinq pétales ouverts, étamines fines
> et style saillant, légèrement de trois quarts et non à plat. Trait fin,
> blanc cassé sur papier crème, feuillage vert olive. Format paysage 8:5,
> aucun texte.

> *EN* — Modern botanical illustration: on the left a coffee branch in full
> bloom, tight clusters of white flowers in the leaf axils; on the right a
> single flower in close-up, five open petals, fine stamens and a protruding
> style, seen slightly three-quarter rather than flat. Fine linework, off-
> white on cream paper, olive-green foliage. 8:5 landscape, no text, no
> frame, no caption.

---

## 6 · Morphologie des grains `grains`

*Aujourd'hui* : quatre ovales mouchetés, légendés face plane, face bombée,
Maragogipe, caracoli. C'est la plus faible avec le paysage : rien ne
distingue vraiment les quatre formes.

**Sujet** — Quatre grains de café verts, posés côte à côte, dont les
différences doivent sauter aux yeux : la face plane avec son sillon en S,
la face bombée, un Maragogipe nettement plus gros que les autres, et un
caracoli rond — un seul grain au lieu de deux.

> Illustration éditoriale moderne : quatre grains de café verts alignés sur
> un fond crème, vus du dessus, chacun nettement différent — un grain de
> face montrant son sillon central en S, le même de dos, un grain
> exceptionnellement grand, et un grain rond et plein. Volumes doux, trait
> fin, ombre portée nulle, échelle visiblement respectée entre les quatre.
> Papier crème, encre anthracite, verts et beiges sourds. Format paysage
> 8:5, aucun texte.

> *EN* — Modern editorial illustration: four green coffee beans in a row on
> a cream background, seen from above, each clearly different — one flat
> face showing its S-shaped centre crease, the same bean from the rounded
> back, one noticeably oversized bean, and one small round pea-shaped bean.
> Soft volume, fine linework, no drop shadow, the scale between the four
> obviously respected. Cream paper, charcoal ink, muted greens and beiges.
> 8:5 landscape, no text, no frame, no caption.

---

## 7 · Port de l'arbre `port`

*Aujourd'hui* : deux arbres schématiques côte à côte, haut et nain, avec une
échelle de hauteur. Lisible, mais très abstrait.

**Sujet** — Deux caféiers côte à côte, le même âge, à la même échelle : l'un
haut et élancé, étages de branches bien séparés ; l'autre nain, compact,
entre-nœuds courts, feuillage dense. Une silhouette humaine pour l'échelle.

> Illustration éditoriale moderne : deux caféiers côte à côte sur fond
> crème, à la même échelle, l'un haut et élancé aux étages de branches
> espacés, l'autre compact et trapu au feuillage dense ; une silhouette
> humaine simple à droite pour donner l'échelle, et une ligne de sol
> discrète. Trait fin, deux valeurs de vert olive, pas de décor. Format
> paysage 8:5, aucun texte.

> *EN* — Modern editorial illustration: two coffee trees side by side on a
> cream background, at the same scale, one tall and open with widely spaced
> tiers of branches, the other compact and squat with dense foliage; a
> simple human silhouette at the right for scale, and a discreet ground
> line. Fine linework, two values of olive green, no scenery. 8:5 landscape,
> no text, no frame, no caption.

---

## 8 · Croisement `croisement`

*Aujourd'hui* : deux rameaux en haut, une croix entre eux, une flèche, un
rameau en bas. Clair, mais c'est un organigramme.

**Sujet** — Comment naît une variété : deux parents en haut, leur descendance
en bas, et entre les trois une géométrie qui dit l'hérédité sans passer par
le symbole mathématique. La descendance doit tenir visiblement des deux.

> Illustration éditoriale moderne sur l'hérédité d'une plante : deux rameaux
> de caféier en haut, distincts l'un de l'autre par la forme de la feuille et
> la couleur du fruit ; en bas un troisième rameau qui tient visiblement des
> deux. Entre eux, des lignes fines qui descendent et se rejoignent, sans
> flèche ni symbole. Composition claire, grande respiration, trait fin.
> Papier crème, encre anthracite, vert olive, une touche de terre de Sienne.
> Format paysage 8:5, aucun texte.

> *EN* — Modern editorial illustration about plant inheritance: two coffee
> branches at the top, clearly different in leaf shape and fruit colour; a
> third branch below that visibly takes after both. Between them, fine lines
> descending and meeting, with no arrow and no symbol. Clear composition,
> generous space, fine linework. Cream paper, charcoal ink, olive green, a
> touch of burnt sienna. 8:5 landscape, no text, no frame, no caption.

---

## 9 · La rouille du caféier `rouille`

*Aujourd'hui* : une feuille tachée, et un cercle de loupe montrant les
spores. L'une des trois meilleures.

**Sujet** — Une feuille de caféier atteinte de rouille orangée : des taches
pulvérulentes orangées au revers, des plages nécrosées, le bord qui se
recroqueville ; et, détaché, un fort grossissement des urédospores.

> Illustration scientifique moderne : une feuille de caféier atteinte de
> rouille orangée, vue de trois quarts, semée de taches pulvérulentes
> orangées de tailles inégales, quelques plages brunies, le bord qui
> commence à se recroqueviller ; dans un cercle détaché, un fort
> grossissement des spores, formes ovales hérissées. Trait fin, aplats
> sobres. Papier crème, encre anthracite, vert olive et orangé soutenu.
> Format paysage 8:5, aucun texte.

> *EN* — Modern scientific illustration: a coffee leaf infected with orange
> leaf rust, seen three-quarter, scattered with powdery orange lesions of
> uneven size, a few browned patches, the edge beginning to curl; in a
> detached circle, a high magnification of the spores, spiky oval shapes.
> Fine linework, restrained flat colour. Cream paper, charcoal ink, olive
> green and strong orange. 8:5 landscape, no text, no frame, no caption.

---

## 10 · Forêt originelle `foret`

*Aujourd'hui* : des arbres faits d'empilements de cercles, un caféier au
pied. Naïf.

**Sujet** — La forêt d'altitude du sud-ouest éthiopien, d'où vient
l'arabica : de grands arbres en canopée, une lumière tamisée qui descend par
trouées, et au ras du sol des caféiers sauvages, grêles, poussant à
l'ombre. Le sujet est le sous-bois, pas les grands arbres.

> Illustration éditoriale moderne : un sous-bois de forêt d'altitude
> éthiopienne, hauts troncs qui montent hors du cadre, canopée seulement
> suggérée en haut, lumière tamisée tombant par trouées, et au premier plan
> de jeunes caféiers sauvages, grêles, poussant à l'ombre. Profondeur par
> superposition de plans de plus en plus pâles. Trait fin, aplats sobres.
> Papier crème, encre anthracite, deux verts olive. Format paysage 8:5,
> aucun texte.

> *EN* — Modern editorial illustration: the understory of an Ethiopian
> highland forest, tall trunks rising out of frame, the canopy only hinted
> at along the top, filtered light falling through gaps, and in the
> foreground slender wild coffee shrubs growing in the shade. Depth built
> from overlapping planes, each paler than the last. Fine linework,
> restrained flat colour. Cream paper, charcoal ink, two olive greens. 8:5
> landscape, no text, no frame, no caption.

---

## 11 · Routes de diffusion `route`

*Aujourd'hui* : une rose des vents, une ligne pointillée entre trois points,
des vaguelettes. On dirait un pictogramme de carte au trésor.

**Sujet** — Le voyage d'une variété d'un bout du monde à l'autre : un fond
de carte très dépouillé, des côtes à peine suggérées, et une trajectoire qui
relie trois points — départ, escale, arrivée. Ce qui compte est le geste du
trajet, pas la géographie.

> Illustration éditoriale moderne : une trajectoire fine et courbe
> traversant un fond de carte très dépouillé, côtes seulement suggérées par
> un liseré, trois petits repères circulaires sur le parcours — départ,
> escale, arrivée. Pas de rose des vents, pas de vaguelettes, pas de
> frontières. Beaucoup de vide, trait fin, une seule couleur d'accent pour
> la trajectoire. Papier crème, encre anthracite, terre de Sienne. Format
> paysage 8:5, aucun texte.

> *EN* — Modern editorial illustration: a fine curved route crossing a very
> spare map ground, coastlines only hinted at with a thin outline, three
> small circular markers along the way — origin, stopover, arrival. No
> compass rose, no wave marks, no borders. Plenty of empty space, fine
> linework, a single accent colour for the route. Cream paper, charcoal ink,
> burnt sienna. 8:5 landscape, no text, no frame, no caption.

---

## 12 · Multiplication `plantule`

*Aujourd'hui* : deux jeunes pousses, l'une par graine, l'autre par bouture,
et un sol pointillé. Schématique mais honnête.

**Sujet** — Les deux façons de faire un caféier : à gauche une plantule née
d'une graine, ses deux cotylédons encore en place, une racine pivotante ; à
droite une bouture, tige coupée net, racines en couronne — un clone de son
pied-mère.

> Illustration botanique moderne : à gauche une plantule de caféier née
> d'une graine, deux cotylédons arrondis encore en place, première paire de
> vraies feuilles, longue racine pivotante ; à droite une bouture, tige
> coupée net en bas, couronne de racines fines, feuilles déjà adultes. Coupe
> du sol discrète les séparant du vide. Trait fin, vert olive et beiges.
> Papier crème. Format paysage 8:5, aucun texte.

> *EN* — Modern botanical illustration: on the left a coffee seedling grown
> from seed, two rounded cotyledons still in place, the first pair of true
> leaves, a long taproot; on the right a cutting, stem cleanly severed at
> the base, a crown of fine roots, already adult leaves. A discreet soil
> line separating them from the empty space. Fine linework, olive green and
> beiges. Cream paper. 8:5 landscape, no text, no frame, no caption.

---

## Et les planches botaniques des fiches ?

Elles ne figurent pas dans cette liste parce qu'elles ne se remplacent pas
par une image : il y en a 47, une par variété, et chacune est composée à
partir des caractères de sa variété. Le même code produit un Catimor trapu
aux fruits rouges et un Maragogipe élancé aux grands grains — c'est ce qui
les rend justes.

Si vous voulez les faire évoluer, les leviers sont dans `BOT.T` :
couleur des fruits (`fr`), allongement et taille du fruit (`fe`, `fs`),
largeur de feuille (`wr`), jeunes pousses bronze ou vertes (`tip`), port
(`hab`), taches de rouille (`rust`), fruits par grappe (`nc`),
entre-nœuds (`inter`). Dites-moi ce que vous voulez voir changer — la
chaleur du papier, l'épaisseur du trait, le cadre — et je le règle là.
