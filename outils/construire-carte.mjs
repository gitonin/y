/**
 * Fabrique le dossier « carte », autonome.
 *
 * Même principe que le jeu, et pour la même raison : la carte n'appartient
 * pas au site. Aucun menu n'y mène, elle ne figure pas au plan du site, et on
 * y entre par un lien que l'on partage. Elle doit donc se corriger seule —
 * redéposer `carte/`, sans reconstruire les cent fichiers du site.
 *
 *   public/carte/
 *     index.html        oriente vers la langue du navigateur
 *     fr/ en/ zh/       une page par langue, relief et textes compris
 *     carte.css         la charte du site, puis les styles de la carte
 *     carte.js          Three.js et la fabrication du relief
 *     favicon-96.png
 *     .htaccess         interdit de garder en cache une version corrigée
 *
 * Le relief lui-même vient de `carte/relief.json`, relevé une fois par
 * `outils/relever-relief.mjs` et versionné : cette construction ne demande
 * rien au réseau. Les fiches des fermes viennent de `contenu/produits.json`,
 * qui reste la seule source — on ne recopie pas un nom de ferme ici.
 *
 * Aucun fichier produit ne porte d'empreinte dans son nom : c'est ce qui rend
 * le dossier redéposable seul.
 */
import { readFile, writeFile, mkdir, copyFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as esbuild from 'esbuild';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dans = (...p) => path.join(racine, ...p);

const SOURCE = dans('carte');
const CIBLE = dans('public', 'carte');
const LANGUES = ['fr', 'en', 'zh'];

const lire = (...p) => readFile(path.join(...p), 'utf8');

const echapper = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function remplir(modele, valeurs) {
  const manquantes = new Set();
  const sorti = modele.replace(/\{\{(\w+)\}\}/g, (_, cle) => {
    if (!(cle in valeurs)) { manquantes.add(cle); return ''; }
    return valeurs[cle];
  });
  if (manquantes.size) throw new Error(`clés absentes du modèle : ${[...manquantes].join(', ')}`);
  return sorti;
}

/* Dans un `<script type="application/json">`, seul « </script » doit être
   cassé : le reste est du texte. */
const enJson = (v) => JSON.stringify(v).replace(/<\//g, '<\\/');

/* Ce dont la page a besoin pour dessiner. Un champ manquant ne se voit pas :
   il sort en « undefined », l'arithmétique donne NaN, et l'on obtient un
   relief vide sans la moindre erreur. On le dit ici, une bonne fois. */
function verifierRelief(r) {
  for (const cle of ['zone', 'mailles', 'pas', 'altitudeMin', 'altitudeMax', 'niveaux', 'fermes']) {
    if (r[cle] === undefined) throw new Error(`carte/relief.json : « ${cle} » manque — relancer outils/relever-relief.mjs`);
  }
  for (const cle of ['mailles', 'pas', 'altitudeMin', 'altitudeMax']) {
    if (!Number.isFinite(r[cle])) throw new Error(`carte/relief.json : « ${cle} » n'est pas un nombre`);
  }
  if (r.altitudeMax <= r.altitudeMin) throw new Error('carte/relief.json : altitudes incohérentes');
}

/* Les teintes du relief vivent dans carte.css (pour la légende) et dans
   carte.ts (pour le nuanceur). Deux endroits, donc deux occasions de
   divergence : on vérifie. */
function verifierTeintes(css, ts) {
  const nom = { surface: 'SURFACE', ombre: 'OMBRE', trait: 'TRAIT' };
  const teintes = {};
  for (const [cle, constante] of Object.entries(nom)) {
    const deCss = css.match(new RegExp(`--relief-${cle}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1]?.toLowerCase();
    const deTs = ts.match(new RegExp(`const ${constante} = '(#[0-9a-f]{6})'`, 'i'))?.[1]?.toLowerCase();
    if (!deCss || !deTs) throw new Error(`teinte « ${cle} » introuvable (css ${deCss}, ts ${deTs})`);
    if (deCss !== deTs) throw new Error(`la teinte « ${cle} » diffère : css ${deCss}, ts ${deTs}`);
    teintes[cle] = deCss;
  }
  verifierCafe(css, ts, teintes.surface);
  return teintes;
}

/* La bande du café n'est pas une couleur mais un facteur appliqué à la
   surface éclairée. La légende, elle, doit en montrer le résultat : on refait
   ici le calcul du nuanceur — surface vers le linéaire, multiplication,
   retour en sRGB — et l'on s'arrête si la pastille ment. */
function verifierCafe(css, ts, surface) {
  const deCss = css.match(/--relief-cafe:\s*(#[0-9a-f]{6})/i)?.[1]?.toLowerCase();
  const facteurs = ts
    .match(/const CAFE: \[number, number, number\] = \[([^\]]+)\]/)?.[1]
    ?.split(',')
    .map((n) => Number(n.trim()));
  if (!deCss || facteurs?.length !== 3 || facteurs.some((f) => !Number.isFinite(f))) {
    throw new Error(`voile du café introuvable (css ${deCss}, ts ${facteurs})`);
  }
  const lineaire = (c) => (c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92);
  const srgb = (x) => (x > 0.0031308 ? 1.055 * x ** (1 / 2.4) - 0.055 : 12.92 * x);
  const canal = (i) => Math.round(255 * srgb(lineaire(parseInt(surface.slice(1 + i * 2, 3 + i * 2), 16) / 255) * facteurs[i]));
  const attendu = [0, 1, 2].map(canal);
  const obtenu = [0, 1, 2].map((i) => parseInt(deCss.slice(1 + i * 2, 3 + i * 2), 16));
  const ecart = Math.max(...attendu.map((a, i) => Math.abs(a - obtenu[i])));
  if (ecart > 2) {
    const hex = '#' + attendu.map((c) => c.toString(16).padStart(2, '0')).join('');
    throw new Error(`--relief-cafe vaut ${deCss}, le nuanceur donne ${hex}`);
  }
}

async function construire() {
  await rm(CIBLE, { recursive: true, force: true });
  await mkdir(CIBLE, { recursive: true });

  const textes = JSON.parse(await lire(dans('contenu', 'textes.json')));
  const produits = JSON.parse(await lire(dans('contenu', 'produits.json')));
  const relief = JSON.parse(await lire(SOURCE, 'relief.json'));
  const modele = await lire(SOURCE, 'modele.html');
  const propre = await lire(SOURCE, 'carte.css');
  const source = await lire(SOURCE, 'carte.ts');

  const teintes = verifierTeintes(propre, source);

  /* Chaque ferme relevée doit exister dans le contenu, sinon la carte
     désignerait un point sans rien à en dire. */
  for (const f of relief.fermes) {
    if (!produits.fermes[f.cle]) {
      throw new Error(`carte/relief.json désigne la ferme « ${f.cle} », absente de contenu/produits.json`);
    }
  }

  /* ---------- une page par langue ---------- */
  for (const langue of LANGUES) {
    const site = textes.site[langue];
    const c = site?.carte;
    if (!c) throw new Error(`contenu/textes.json : pas de section « carte » en ${langue}`);

    /* Les fiches : nom et lieu depuis les fermes, altitude et liste des cafés
       depuis les produits. Rien n'est écrit en double. */
    const fiches = {};
    for (const { cle, altitudeAnnoncee } of relief.fermes) {
      const ferme = produits.fermes[cle];
      const cafes = produits.produits
        .filter((p) => p.ferme === cle)
        .map((p) => p.name?.[langue] ?? p.name?.fr ?? p.slug);
      fiches[cle] = {
        nom: ferme.nom,
        lieu: ferme.place[langue] ?? ferme.place.fr,
        altitude: `${altitudeAnnoncee[0]} – ${altitudeAnnoncee[1]} m`,
        /* La première phrase de la fiche de la ferme : de quoi situer sans
           recopier les trois paragraphes du site. */
        texte: (ferme.text[langue] ?? ferme.text.fr).split(/(?<=\.)\s/)[0],
        cafes,
      };
    }

    const textes1 = { ...c };
    const valeurs = { langue, htmlLang: site.meta.htmlLang };
    for (const [cle, valeur] of Object.entries(textes1)) {
      if (typeof valeur === 'string') valeurs[cle] = echapper(valeur);
    }
    /* Le relevé passe en entier, moins sa notice : une liste de champs tenue
       à la main s'oublie. Elle s'était déjà oubliée une fois — le format du
       relevé a changé, la liste non, et la page recevait une altitude
       indéfinie, donc un relief tout entier en NaN. */
    const { _lisezmoi, source: _source, ...pourLaPage } = relief;
    verifierRelief(pourLaPage);
    valeurs.reliefJson = enJson(pourLaPage);
    valeurs.fermesJson = enJson(fiches);
    valeurs.textesJson = enJson(textes1);

    await mkdir(path.join(CIBLE, langue), { recursive: true });
    await writeFile(path.join(CIBLE, langue, 'index.html'), remplir(modele, valeurs));
  }

  /* ---------- la porte d'entrée ---------- */
  const entree = porte(textes.site.fr.carte.titre);
  verifierScripts(entree, 'index.html');
  await writeFile(path.join(CIBLE, 'index.html'), entree);

  /* ---------- la feuille de style ---------- */
  const charte = await lire(dans('src', 'styles', 'global.css'));
  await writeFile(
    path.join(CIBLE, 'carte.css'),
    [
      '/* Fabriqué par outils/construire-carte.mjs — ne pas modifier ici.',
      '   La charte du site (src/styles/global.css), puis carte/carte.css. */',
      '',
      charte,
      propre,
    ].join('\n'),
  );

  /* ---------- le script ---------- */
  const paquet = await esbuild.build({
    entryPoints: [path.join(SOURCE, 'carte.ts')],
    outfile: path.join(CIBLE, 'carte.js'),
    bundle: true,
    format: 'esm',
    target: 'es2020',
    minify: true,
    legalComments: 'none',
    logLevel: 'warning',
    metafile: true,
  });

  await copyFile(dans('public', 'brand', 'favicon-96.png'), path.join(CIBLE, 'favicon-96.png'));
  await copyFile(path.join(SOURCE, '.htaccess'), path.join(CIBLE, '.htaccess'));

  return { relief, teintes, paquet };
}

/*
 * Le script de la porte vit dans un gabarit, et un gabarit mange les barres
 * inverses. On relit donc ce qu'on vient d'écrire — même garde-fou que pour
 * le jeu, où la faute était passée inaperçue.
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
    for (const attendu of ['/\\/$/', '/\\.html?$/i', '\\bzh\\b', '\\ben\\b']) {
      if (!code.includes(attendu)) {
        throw new Error(`${nom} : « ${attendu} » absent du script — barre inverse mangée par le gabarit`);
      }
    }
  }
}

/* La porte d'entreé : l'adresse que l'on partage. Le renvoi nomme le dossier
   en entier, après avoir remis la barre finale — écrit en relatif, « zh/ » se
   résoudrait contre le dossier parent dès que l'adresse la perd, et mènerait
   à l'accueil du site plutôt qu'à la carte. */
function porte(titre) {
  return `<!doctype html>
<!-- Fabriqué par outils/construire-carte.mjs — ne pas modifier ici. -->
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>${echapper(titre)} — Yunma</title>
    <link rel="icon" href="favicon-96.png" type="image/png" sizes="96x96" />
    <script>
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
    <style>
      /* La porte ne dure que le temps d'un renvoi : ses quelques règles sont
         ici plutôt que dans une feuille à part. Une feuille externe était
         demandée par le navigateur avant même que le script ne s'exécute —
         son préchargeur n'attend pas — et sur une adresse sans barre finale
         elle tombait à côté : un 404 à chaque entrée. */
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #efebe2;
        color: #212121;
        font-family: 'Helvetica Neue', Helvetica, Arial, 'Liberation Sans', sans-serif;
        text-align: center;
      }
      h1 {
        font-size: 1.35rem;
        font-weight: 600;
        letter-spacing: -0.014em;
      }
      a {
        color: #994d22;
        text-decoration: none;
        border-bottom: 1px solid currentColor;
        padding-bottom: 2px;
      }
      p {
        margin: 1rem 0;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>${echapper(titre)}</h1>
      <p><a href="fr/">Français<span class="arrow" aria-hidden="true">→</span></a></p>
      <p><a href="en/">English<span class="arrow" aria-hidden="true">→</span></a></p>
      <p><a href="zh/">中文<span class="arrow" aria-hidden="true">→</span></a></p>
    </main>
  </body>
</html>
`;
}

const { relief, teintes, paquet } = await construire();
const ko = (n) => `${Math.round(n / 1024)} Ko`;
const sortie = Object.entries(paquet.metafile.outputs).find(([f]) => f.endsWith('carte.js'));
console.log(
  `  carte ${LANGUES.length} langues, relief ${relief.mailles}×${relief.mailles} ` +
    `(${Math.round(relief.altitudeMin)}–${Math.round(relief.altitudeMax)} m, pas ${relief.pas.toFixed(1)} m), ` +
    `${Object.keys(teintes).length} teintes, script ${ko(sortie?.[1].bytes ?? 0)}`,
);
