# Le jeu du cheval des nuages

Un quiz à deux ou quatre joueurs, chacun sur son téléphone, tous dans la même
partie. Dix questions sur le café et le Yunnan, un buzzer, un podium.

Le jeu **ne fait pas partie du site**. Il n'apparaît dans aucun menu, dans
aucun plan du site, et aucune page n'y mène : on y entre par un lien que l'on
partage soi-même.

    https://yunma.fr/jeu/

Cette adresse oriente vers la langue du téléphone. Les trois sont accessibles
directement : `/jeu/fr/`, `/jeu/en/`, `/jeu/zh/`.

## Le modifier sans toucher au site

C'est la raison d'être de ce dossier. Tout ce dont le jeu a besoin est réuni
sous `/jeu/`, et aucun de ses fichiers ne porte d'empreinte dans son nom.
Changer une question, un texte, une couleur, et redéposer **le seul dossier
`jeu/`** sur le serveur : le reste du site n'est pas concerné.

| Pour changer… | On modifie… |
| --- | --- |
| les questions, les réponses, les explications | `contenu/jeu.json` |
| les textes de l'interface (boutons, titres, niveaux) | `contenu/textes.json`, section `jeu` |
| la mise en page, les écrans | `jeu/modele.html` |
| les styles propres au jeu | `jeu/jeu.css` |
| le déroulé d'une partie côté téléphone | `jeu/jeu.ts` |
| les règles du serveur (durées, nombre de joueurs) | `jeu/api.php` |

Puis :

    npm run construire-jeu     # fabrique public/jeu/
    npm run test:jeu           # joue une partie entière, pour de vrai

Et l'on dépose `public/jeu/` dans `/jeu/` sur le serveur. `npm run build`
appelle le même outil : le dossier part aussi avec l'archive du site complet.

## Ce que le serveur fait

`api.php` est le seul endroit qui se souvienne — le site, lui, n'est que des
fichiers. Les téléphones lui demandent une fois par seconde où en est la
partie. Il tient ses parties dans un fichier SQLite posé à côté de lui, créé
tout seul au premier lancement, effacé partie par partie au bout de deux
heures. Aucun compte, aucune donnée personnelle : un prénom, et c'est tout.

Si l'hébergement s'accommode mal de SQLite, les quatre constantes `MYSQL` en
tête de `api.php` suffisent à basculer sur une base MySQL.

## Deux choses qui ne doivent pas changer

**Les bonnes réponses restent au serveur.** Elles sont livrées en
`questions.php`, et non en `.json` : un fichier `.json` déposé à côté du
serveur est servi tel quel, et il suffisait d'en demander l'adresse pour lire
les quarante-deux réponses au milieu d'une partie. Un `.php` est exécuté,
jamais montré. Ne pas revenir au JSON.

**Le `.htaccess` du dossier compte.** Il interdit l'accès à la base des
parties et aux questions, et empêche la mise en cache de la feuille et du
script — qui gardent leur nom d'une version à l'autre. Sans lui, une
correction du jeu mettrait des jours à paraître sur les téléphones qui y ont
déjà joué. Il commence par un point : beaucoup de clients FTP le cachent.

## Ce qui est fabriqué, ce qui est écrit

Les sources sont ici, dans `jeu/`. `public/jeu/` est fabriqué de bout en bout
par `outils/construire-jeu.mjs` et n'est pas suivi par git : on ne le modifie
jamais à la main, la prochaine construction effacerait tout.
