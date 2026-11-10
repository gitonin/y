/**
 * Fabrique le dossier « arabica », autonome.
 *
 * Même principe que le jeu et la carte, et pour la même raison : l'atlas des
 * variétés n'appartient pas au site. Aucun menu n'y mène, il ne figure pas au
 * plan du site, et l'on y entre par un lien que l'on partage. Il doit donc se
 * corriger seul — redéposer `arabica/`, sans reconstruire les cent fichiers
 * du site.
 *
 *   public/arabica/
 *     index.html        l'atlas entier : styles, données, rendu 3D, planches
 *     favicon-96.png
 *     .htaccess         interdit de garder en cache une version corrigée
 *
 * L'atlas tient en un seul fichier, sans dépendance : il n'y a rien à
 * compiler. Cette construction ne fait donc que recopier — et vérifier. Ce
 * qu'elle vérifie est ce qui se défait tout seul avec le temps : la charte,
 * qui doit rester celle du site, et l'autonomie du fichier, qui se perd au
 * premier script venu d'ailleurs.
 */
import { readFile, writeFile, mkdir, copyFile, rm } from 'node:fs/promises';
import { LANGUES, CHEMIN, BALISE, donnees, lecture, tete } from './seo-arabica.mjs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dans = (...p) => path.join(racine, ...p);

const SOURCE = dans('arabica');
const CIBLE = dans('public', 'arabica');

/**
 * La charte vit dans `src/styles/global.css`, et nulle part ailleurs.
 *
 * L'atlas, lui, a ses propres noms de variables — il a été écrit à part. Deux
 * jeux de couleurs, donc deux occasions de divergence : on rapproche les
 * deux, et l'on s'arrête si une teinte s'écarte. La correspondance est
 * explicite, faute de quoi on ne saurait pas laquelle comparer à laquelle.
 */
const TEINTES = {
  '--fond': '--paper',
  '--pap': '--white',
  '--encre': '--ink',
  '--verm': '--accent',
  '--olive': '--olive',
};

/**
 * Une teinte de l'atlas, en hexadécimal.
 *
 * Trois d'entre elles sont écrites en triplets — `--encre:33,33,33` — parce
 * que le jour et la nuit ne changent qu'eux, et que tout le reste de la
 * feuille en découle. On les ramène en hexadécimal pour les comparer à
 * celles du site.
 */
function teinte(css, nom) {
  const hex = css.match(new RegExp(`${nom}\\s*:\\s*(#[0-9a-fA-F]{6})\\s*[;}]`));
  if (hex) return hex[1].toLowerCase();
  const trio = css.match(new RegExp(`${nom}\\s*:\\s*(\\d{1,3})\\s*,\\s*(\\d{1,3})\\s*,\\s*(\\d{1,3})\\s*[;}]`));
  if (!trio) return undefined;
  return '#' + trio.slice(1, 4).map((v) => Number(v).toString(16).padStart(2, '0')).join('');
}

function verifierCharte(atlas, global) {
  for (const [ici, laBas] of Object.entries(TEINTES)) {
    const a = teinte(atlas, ici);
    const g = teinte(global, laBas);
    if (!a || !g) throw new Error(`charte : « ${ici} » (${a}) ou « ${laBas} » (${g}) introuvable`);
    if (a !== g) throw new Error(`charte : l'atlas pose ${ici} à ${a}, le site pose ${laBas} à ${g}`);
  }
  /* La police du site est nommée en toutes lettres dans la pile de l'atlas :
     sans cela, l'atlas reviendrait silencieusement à Helvetica et seul un œil
     exercé verrait la différence. */
  if (!/--font\s*:\s*"Inter"/.test(atlas)) throw new Error('charte : la pile de polices de l\'atlas ne commence pas par Inter');
  if (!atlas.includes('fonts.googleapis.com/css2?family=Inter')) throw new Error('charte : la feuille Inter n\'est pas demandée');
  /* Le site est droit : rayon de 2 px sur les boutons, rien sur les images.
     Une pastille ronde reste ronde — c'est un repère, pas un cartouche. */
  const pilules = (atlas.match(/border-radius:999px/g) ?? []).length;
  if (pilules > 1) throw new Error(`charte : ${pilules} éléments en pilule, seul l'interrupteur en garde une`);
}

/**
 * L'atlas doit rester un fichier que l'on peut ouvrir seul, hors ligne.
 *
 * Une seule exception, assumée : la feuille de la police, qui vient du même
 * endroit que pour le reste du site — et sans laquelle l'atlas s'affiche très
 * bien, dans la police de secours. Tout le reste doit être dedans.
 */
function verifierAutonomie(atlas) {
  const dehors = [...atlas.matchAll(/<(?:script|link|img)\b[^>]*\b(?:src|href)="(https?:\/\/[^"]+)"/g)]
    .map((m) => m[1])
    .filter((u) => !/^https:\/\/fonts\.(googleapis|gstatic)\.com(\/|$)/.test(u));
  if (dehors.length) throw new Error(`autonomie : l'atlas charge ${dehors.length} ressource(s) du dehors — ${dehors[0]}`);
}

/** Ce qui doit exister pour que la page serve à quelque chose. */
function verifierContenu(atlas) {
  for (const marque of ['id="gl"', 'id="c"', 'const NODES', 'const REGIONS', 'const EVENTS', 'PAGES']) {
    if (!atlas.includes(marque)) throw new Error(`contenu : « ${marque} » a disparu de l'atlas`);
  }
  for (const langue of ['fr', 'en', 'zh']) {
    if (!new RegExp(`\\b${langue}\\s*:\\s*\\{`).test(atlas)) throw new Error(`langues : le tableau « ${langue} » est introuvable`);
  }
  /* L'atlas est entièrement textuel : une planche dessinée d'après une
     description affirme plus qu'on ne sait, et c'était la seule chose de
     la page qui ne citait aucune source. Le jour où une vraie illustration
     arrivera, elle viendra d'un fichier, pas d'un générateur de SVG. */
  for (const trace of ['class="plate', 'const PLATES', 'const BOT=', 'figBot']) {
    if (atlas.includes(trace)) throw new Error(`illustrations : « ${trace} » est revenu dans l'atlas, qui doit rester textuel`);
  }
  verifierTables(atlas);
}

/* Plusieurs tables de traduction sont alignées par INDICE sur les données
   françaises : EVENTS_L sur EVENTS, YL_L sur YLINKS, STORY_L sur STORY.
   Y ajouter une entrée d'un côté sans l'autre ne lève rien à l'exécution —
   la page affiche « undefined » en anglais et en chinois, et seul un
   lecteur anglophone s'en aperçoit. On compte donc, à la construction.
   Et comme la frise s'affiche dans l'ordre du tableau, on vérifie aussi
   que les événements sont triés par année. */
function verifierTables(atlas) {
  const bloc = (debut, fin) => {
    const i = atlas.indexOf(debut);
    if (i < 0) throw new Error(`contenu : « ${debut} » a disparu de l'atlas`);
    const j = atlas.indexOf(fin, i);
    return atlas.slice(i, j);
  };
  const compte = (texte, motif) => (texte.match(motif) ?? []).length;

  /* Compte les éléments de premier niveau d'une liste, qu'ils soient des
     chaînes (YL_L) ou des sous-listes (EVENTS_L). */
  const elements = (corps) => {
    let n = 0, prof = 0, chaine = false, vide = true;
    for (let k = 0; k < corps.length; k++) {
      const c = corps[k];
      if (chaine) { if (c === '\\') k++; else if (c === "'") chaine = false; continue; }
      if (c === "'") { chaine = true; vide = false; }
      else if (c === '[') { prof++; vide = false; }
      else if (c === ']') prof--;
      else if (c === ',' && !prof) { n++; vide = true; }
      else if (!/\s/.test(c)) vide = false;
    }
    return vide ? n : n + 1;
  };

  const evenements = bloc('const EVENTS=[', '\n];');
  const nbEv = compte(evenements, /\{y:-?\d+,t:'/g);
  const annees = [...evenements.matchAll(/\{y:(-?\d+),t:'/g)].map((m) => Number(m[1]));
  for (let i = 1; i < annees.length; i++) {
    if (annees[i] < annees[i - 1]) throw new Error(`EVENTS : ${annees[i]} arrive après ${annees[i - 1]} — la chronologie s'affiche dans l'ordre du tableau`);
  }
  const liens = bloc('const YLINKS=[', '];');
  const nbYl = compte(liens, /\['[a-z0-9_]+',\s*-?\d+,/g);

  for (const [nom, attendu, debut] of [['EVENTS_L', nbEv, 'const EVENTS_L={'], ['YL_L', nbYl, 'const YL_L={']]) {
    const table = bloc(debut, '\n};').replace(debut, '');
    for (const langue of ['en', 'zh']) {
      const i = table.indexOf(` ${langue}:[`);
      if (i < 0) throw new Error(`${nom} : la langue « ${langue} » est introuvable`);
      let p = table.indexOf('[', i), prof = 0, fin = -1;
      for (let k = p; k < table.length; k++) {
        if (table[k] === '[') prof++;
        else if (table[k] === ']') { prof--; if (!prof) { fin = k; break; } }
      }
      const n = elements(table.slice(p + 1, fin));
      if (n !== attendu) throw new Error(`${nom}.${langue} : ${n} entrées pour ${attendu} attendues — la table est alignée par indice, « undefined » s'afficherait`);
    }
  }
}

async function construire() {
  await rm(CIBLE, { recursive: true, force: true });
  await mkdir(CIBLE, { recursive: true });

  const atlas = await readFile(path.join(SOURCE, 'index.html'), 'utf8');
  const global = await readFile(dans('src', 'styles', 'global.css'), 'utf8');

  verifierCharte(atlas, global);
  verifierAutonomie(atlas);
  verifierContenu(atlas);

  /* Trois pages, une par langue, à trois adresses. La version texte et la
     tête changent ; le reste du fichier est le même, à l'octet près. */
  const D = donnees(atlas);
  const tailles = [];
  for (const l of LANGUES) {
    const dossier = l === 'fr' ? CIBLE : path.join(CIBLE, l);
    if (l !== 'fr') await mkdir(dossier, { recursive: true });
    const page = atlas
      .replace('<html lang="fr">', `<html lang="${BALISE[l]}">`)
      .replace('<!--TETE-->', tete(D, l))
      .replace('<!--LECTURE-->', lecture(D, l))
      .replace("setLang(LANG_URL,true)", `setLang('${l}',true)`)
      .replace("const racine=LANG_URL==='fr'?'./':'../'", `const racine='${l === 'fr' ? './' : '../'}'`);
    if (page.includes('<!--TETE-->') || page.includes('<!--LECTURE-->') || page.includes('LANG_URL')) {
      throw new Error(`langue ${l} : un marqueur n'a pas été remplacé`);
    }
    if (l !== 'fr') {
      /* Les ressources sont à la racine du dossier, pas dans la langue. */
      await writeFile(path.join(dossier, 'index.html'), page.replace('href="favicon-96.png"', 'href="../favicon-96.png"'));
    } else {
      await writeFile(path.join(dossier, 'index.html'), page);
    }
    tailles.push(`${l} ${Math.round(page.length / 1024)} Ko`);
  }
  await copyFile(path.join(SOURCE, '.htaccess'), path.join(CIBLE, '.htaccess'));
  await copyFile(dans('public', 'brand', 'favicon-96.png'), path.join(CIBLE, 'favicon-96.png'));

  const varietes = (atlas.match(/\{id:'/g) ?? []).length;
  console.log(`  atlas ${tailles.join(' · ')}, ${varietes} entrées, ${LANGUES.map((l) => CHEMIN[l]).join(' ')}, charte vérifiée`);
}

construire().catch((e) => {
  console.error(`\n✗ ${e.message}\n`);
  process.exit(1);
});
