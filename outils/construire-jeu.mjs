/**
 * Fabrique le dossier « jeu », autonome.
 *
 * Le jeu ne fait pas partie du site : il n'apparaît dans aucun menu, dans
 * aucun plan du site, et aucune page n'y mène. On y entre par un lien que
 * l'on partage soi-même. Il devait donc pouvoir se corriger seul, sans
 * reconstruire ni redéposer les cent fichiers du site.
 *
 * D'où ce script, et d'où la forme du dossier produit : tout ce dont le jeu
 * a besoin y est, et rien de ce qu'il contient n'est nommé d'après une
 * empreinte. Changer une question, c'est redéposer `jeu/` — pas davantage.
 *
 *   public/jeu/
 *     index.html        oriente vers la langue du téléphone
 *     fr/ en/ zh/       une page par langue, textes compris
 *     jeu.css           la charte du site, puis les styles du jeu
 *     jeu.js            la logique, lecteur de QR compris
 *     questions.php     les questions, dans les trois langues
 *     api.php           le serveur des parties
 *     poincon.svg       le poinçon de la marque
 *     favicon-96.png    l'icône d'onglet
 *     .htaccess         protège la base, interdit le cache
 *
 * Les chemins y sont tous relatifs : le dossier fonctionne à la racine du
 * domaine comme sous `/y/v4/`, sans rien reconstruire.
 *
 * Astro recopie `public/` tel quel dans `dist/` : le dossier du jeu part
 * ainsi avec l'archive du site, tout en restant détachable. Ce script est
 * appelé par `prebuild`, donc à chaque construction — `public/jeu/` est
 * entièrement fabriqué, et n'est pas suivi par git.
 */
import { readFile, writeFile, mkdir, copyFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as esbuild from 'esbuild';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dans = (...p) => path.join(racine, ...p);

const SOURCE = dans('jeu');
const CIBLE = dans('public', 'jeu');
const LANGUES = ['fr', 'en', 'zh'];

const lire = (...p) => readFile(path.join(...p), 'utf8');

/* Le texte d'une langue remplace les {{clés}} du modèle. Une clé oubliée
   laisserait « {{truc}} » en pleine page : on s'arrête plutôt. */
function remplir(modele, valeurs) {
  const manquantes = new Set();
  const sorti = modele.replace(/\{\{(\w+)\}\}/g, (_, cle) => {
    if (!(cle in valeurs)) {
      manquantes.add(cle);
      return '';
    }
    return valeurs[cle];
  });
  if (manquantes.size) {
    throw new Error(`clés absentes du modèle : ${[...manquantes].join(', ')}`);
  }
  return sorti;
}

/* Un texte posé dans du HTML doit être neutralisé : une apostrophe droite ou
   un chevron dans une traduction casserait l'attribut qui le porte. */
const echapper = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

async function construire() {
  await rm(CIBLE, { recursive: true, force: true });
  await mkdir(CIBLE, { recursive: true });

  const textes = JSON.parse(await lire(dans('contenu', 'textes.json')));
  const modele = await lire(SOURCE, 'modele.html');

  /* ---------- une page par langue ---------- */
  for (const langue of LANGUES) {
    const site = textes.site[langue];
    const j = site?.jeu;
    if (!j) throw new Error(`contenu/textes.json : pas de section « jeu » en ${langue}`);

    const valeurs = { langue, htmlLang: site.meta.htmlLang };
    for (const [cle, valeur] of Object.entries(j)) {
      if (typeof valeur === 'string') valeurs[cle] = echapper(valeur);
    }
    /* Les textes partent aussi en bloc : le script en a besoin pour ce qu'il
       fabrique à l'écran (réponses, classement, niveaux). Dans un
       `<script type="application/json">`, seul « </script » doit être cassé. */
    valeurs.textesJson = JSON.stringify(j).replace(/<\//g, '<\\/');

    await mkdir(path.join(CIBLE, langue), { recursive: true });
    await writeFile(path.join(CIBLE, langue, 'index.html'), remplir(modele, valeurs));
  }

  /* ---------- la porte d'entrée ---------- */
  const entree = porte();
  verifierScripts(entree, 'index.html');
  await writeFile(path.join(CIBLE, 'index.html'), entree);

  /* ---------- la feuille de style ---------- */
  const charte = await lire(dans('src', 'styles', 'global.css'));
  const propre = await lire(SOURCE, 'jeu.css');
  await writeFile(
    path.join(CIBLE, 'jeu.css'),
    [
      '/* Fabriqué par outils/construire-jeu.mjs — ne pas modifier ici.',
      '   La charte du site (src/styles/global.css), puis jeu/jeu.css. */',
      '',
      charte,
      propre,
    ].join('\n'),
  );

  /* ---------- le script ---------- */
  await esbuild.build({
    entryPoints: [path.join(SOURCE, 'jeu.ts')],
    outfile: path.join(CIBLE, 'jeu.js'),
    bundle: true,
    format: 'esm',
    target: 'es2020',
    minify: true,
    legalComments: 'none',
    logLevel: 'warning',
  });

  /* ---------- les questions ----------
     En PHP, pas en JSON : elles portent les bonnes réponses, et un `.json`
     déposé à côté du serveur se lit en demandant son adresse. Un `.php` est
     exécuté, jamais montré. `var_export` écrit du PHP littéral — aucune
     chaîne du contenu n'y est interprétée. */
  const questions = JSON.parse(await lire(dans('contenu', 'jeu.json')));
  await writeFile(
    path.join(CIBLE, 'questions.php'),
    `<?php\n/* Fabriqué par outils/construire-jeu.mjs depuis contenu/jeu.json.\n   Ne pas modifier ici. */\nreturn ${versPhp(questions)};\n`,
  );

  /* ---------- ce qui se recopie tel quel ---------- */
  await copyFile(path.join(SOURCE, 'api.php'), path.join(CIBLE, 'api.php'));
  await copyFile(path.join(SOURCE, '.htaccess'), path.join(CIBLE, '.htaccess'));
  await copyFile(dans('public', 'brand', 'yunma-poincon.svg'), path.join(CIBLE, 'poincon.svg'));
  await copyFile(dans('public', 'brand', 'favicon-96.png'), path.join(CIBLE, 'favicon-96.png'));

  return textes;
}

/*
 * Le script de la porte est écrit dans un gabarit, et un gabarit mange les
 * barres inverses : `/\\bzh\\b/` doit s'y écrire en double, sans quoi il
 * sort en `/zh/` — et `/\\/$/` sort en `//$/`, qui ouvre un commentaire.
 * Les deux passent inaperçus à la lecture et cassent le renvoi de langue.
 *
 * On relit donc ce qu'on vient d'écrire, et on refuse de livrer un script
 * qui ne s'analyse pas. `new Function` ne l'exécute pas : il le compile, ce
 * qui suffit à faire remonter l'erreur de syntaxe.
 */
function verifierScripts(html, nom) {
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type="application\/json")[^>]*>([\s\S]*?)<\/script>/g)];
  if (!scripts.length) throw new Error(`${nom} : aucun script à vérifier, le gabarit a changé`);
  for (const [, code] of scripts) {
    try {
      new Function(code);
    } catch (e) {
      throw new Error(`${nom} : script invalide — ${e.message}`);
    }
    /* Une barre inverse avalée ne fait pas d'erreur de syntaxe : elle change
       le sens. On vérifie donc aussi que les gardes sont bien là. */
    for (const attendu of ['/\\/$/', '/\\.html?$/i', '\\bzh\\b', '\\ben\\b']) {
      if (!code.includes(attendu)) {
        throw new Error(`${nom} : « ${attendu} » absent du script — barre inverse mangée par le gabarit`);
      }
    }
  }
}

/* Écrit une valeur JSON en PHP littéral, à la façon de `var_export`. Les
   chaînes passent par des guillemets simples, où seuls la barre oblique
   inverse et le guillemet simple ont un sens : rien d'un énoncé ne peut
   s'échapper vers du code. */
function versPhp(valeur, retrait = 0) {
  const marge = '    '.repeat(retrait);
  const margeFille = '    '.repeat(retrait + 1);
  if (valeur === null) return 'null';
  if (typeof valeur === 'boolean') return valeur ? 'true' : 'false';
  if (typeof valeur === 'number') return String(valeur);
  if (typeof valeur === 'string') return `'${valeur.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  if (Array.isArray(valeur)) {
    if (!valeur.length) return '[]';
    const lignes = valeur.map((v) => `${margeFille}${versPhp(v, retrait + 1)},`);
    return `[\n${lignes.join('\n')}\n${marge}]`;
  }
  const entrees = Object.entries(valeur);
  if (!entrees.length) return '[]';
  const lignes = entrees.map(
    ([cle, v]) => `${margeFille}${versPhp(String(cle))} => ${versPhp(v, retrait + 1)},`,
  );
  return `[\n${lignes.join('\n')}\n${marge}]`;
}

/* La porte d'entrée : c'est l'adresse que l'on partage. Elle oriente vers la
   langue du téléphone, en gardant le code d'invitation s'il y en a un, et
   propose les trois langues en clair pour qui n'a pas de JavaScript. */
function porte() {
  return `<!doctype html>
<!-- Fabriqué par outils/construire-jeu.mjs — ne pas modifier ici. -->
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>Le jeu du cheval des nuages — Yunma</title>
    <link rel="icon" href="favicon-96.png" type="image/png" sizes="96x96" />
    <link rel="stylesheet" href="jeu.css" />
    <script>
      /* La langue du téléphone décide, le français reprend la main. Le code
         d'invitation (?p=ABCD) suit : un lien partagé doit mener dans la
         partie, pas seulement devant le jeu.

         Le renvoi est calculé sur le dossier courant, jamais écrit en
         relatif. « zh/ » tout court se résout contre le dossier parent dès
         que l'adresse perd sa barre finale : depuis « /jeu », il désignerait
         « /zh/ » — l'accueil du site en chinois, pas le jeu. On remet donc la
         barre avant toute chose, puis on nomme le dossier en entier. */
      (function () {
        var chemin = location.pathname;
        if (!/\\/$/.test(chemin) && !/\\.html?$/i.test(chemin)) {
          location.replace(chemin + '/' + location.search + location.hash);
          return;
        }
        var dossier = chemin.replace(/[^/]*$/, '');
        var parlees = (navigator.languages || [navigator.language || 'fr']).join(',').toLowerCase();
        var langue = /\\bzh\\b|zh-/.test(parlees) ? 'zh' : /\\ben\\b|en-/.test(parlees) ? 'en' : 'fr';
        location.replace(dossier + langue + '/' + location.search + location.hash);
      })();
    </script>
  </head>
  <body>
    <main class="wrap jeu">
      <div class="poincon" aria-hidden="true">
        <img src="poincon.svg" alt="" width="285" height="285" />
      </div>
      <h1 class="jeu__titre">Le jeu du cheval des nuages</h1>
      <p class="jeu__intro lead">Choisissez votre langue.</p>
      <p><a class="link" href="fr/">Français<span class="arrow" aria-hidden="true">→</span></a></p>
      <p><a class="link" href="en/">English<span class="arrow" aria-hidden="true">→</span></a></p>
      <p><a class="link" href="zh/">中文<span class="arrow" aria-hidden="true">→</span></a></p>
    </main>
  </body>
</html>
`;
}

const textes = await construire();
const titres = LANGUES.map((l) => textes.site[l].jeu.titre);
console.log(`  jeu   ${LANGUES.length} langues (${titres.join(' / ')}), dossier autonome`);
