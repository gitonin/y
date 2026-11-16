/**
 * Fabrique le dossier « wishes », autonome.
 *
 * Même principe que l'atlas des variétés, et pour la même raison : l'arbre à
 * souhaits n'appartient pas au site. Aucun menu n'y mène, il ne figure pas au
 * plan du site, et l'on y entre par un lien que l'on partage. Il doit donc se
 * corriger seul — redéposer `wishes/`, sans reconstruire les cent fichiers du
 * site.
 *
 *   public/wishes/
 *     index.html          toute l'expérience : styles, données, scène et son
 *     three-r128.min.js   la bibliothèque 3D, servie par le site
 *     .htaccess           cache court sur la page, long sur la bibliothèque
 *
 * Il n'y a rien à compiler : cette construction recopie, et vérifie. Ce
 * qu'elle vérifie est ce qui se défait tout seul avec le temps — la charte,
 * qui doit rester celle du site, et l'autonomie de la page, qui se perd au
 * premier script venu d'ailleurs.
 */
import { readFile, writeFile, mkdir, copyFile, rm, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dans = (...p) => path.join(racine, ...p);
const SOURCE = dans('wishes');
const CIBLE = dans('public', 'wishes');

/**
 * La charte vit dans `src/styles/global.css`. L'arbre à souhaits a ses
 * propres noms — il a été écrit à part —, d'où la correspondance explicite :
 * deux jeux de couleurs, c'est deux occasions de divergence.
 */
const TEINTES = {
  '--beige': '--paper',
  '--paper': '--white',
  '--ink': '--ink',
  '--rust': '--accent',
  '--green': '--olive',
};

function teintes(css, noms) {
  const o = {};
  for (const n of noms) {
    const m = new RegExp(`${n}\\s*:\\s*(#[0-9a-fA-F]{3,8})`).exec(css);
    if (m) o[n] = m[1].toLowerCase();
  }
  return o;
}

async function verifierCharte(page) {
  const site = teintes(await readFile(dans('src', 'styles', 'global.css'), 'utf8'), Object.values(TEINTES));
  const ici = teintes(page, Object.keys(TEINTES));
  const ecarts = [];
  for (const [a, b] of Object.entries(TEINTES)) {
    if (!site[b]) { ecarts.push(`${b} introuvable dans la charte du site`); continue; }
    if (!ici[a]) { ecarts.push(`${a} introuvable dans l’arbre à souhaits`); continue; }
    if (site[b] !== ici[a]) ecarts.push(`${a} vaut ${ici[a]}, la charte dit ${site[b]} (${b})`);
  }
  if (ecarts.length) throw new Error('charte :\n  - ' + ecarts.join('\n  - '));
}

/**
 * Autonome veut dire : rien n'est demandé à un tiers, sauf les deux fontes
 * de Google — elles sont déclarées ici, et nulle part ailleurs. Un script ou
 * une image venus d'un autre domaine, et l'arbre cesse de s'ouvrir le jour
 * où ce domaine tombe.
 */
const TOLERE = [
  /^https:\/\/fonts\.googleapis\.com\//, /^https:\/\/fonts\.gstatic\.com\//,
  /^https:\/\/yunma\.fr(\/|$)/,   /* le lien de sortie vers le site : une destination, pas une dépendance */
];
function verifierAutonomie(page) {
  const dehors = [];
  for (const m of page.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)) {
    const u = m[1];
    if (!/^https?:\/\//.test(u)) continue;
    if (TOLERE.some((r) => r.test(u))) continue;
    dehors.push(u);
  }
  /* Les adresses citées dans le texte ou dans le QR code ne sont pas des
     dépendances : on ne regarde que ce que le navigateur va chercher. */
  if (dehors.length) throw new Error('la page dépend de :\n  - ' + [...new Set(dehors)].join('\n  - '));
}

/** Ce qui doit être là pour que l'expérience tienne debout. */
function verifierContenu(page) {
  const manques = [];
  const attendu = [
    ['const RELIEF=', 'le relevé du relief'],
    ['var CIEL=', 'le cycle du jour et de la nuit'],
    ['function secouer()', 'la secousse'],
    ['function gyroBasculer()', 'le gyroscope'],
    ['emissiveMap:t', 'les étiquettes qui s’allument la nuit'],
    ['three-r128.min.js', 'la bibliothèque 3D, servie par le site'],
    ['assets/logo-yunma-transparent.png', 'le logo, sorti du base64'],
  ];
  for (const [quoi, nom] of attendu) if (!page.includes(quoi)) manques.push(nom);
  /* Rien ne doit plus pointer vers l'environnement où l'expérience est née. */
  if (/window\.claude/.test(page)) manques.push('un reste de « window.claude »');
  if (/claude\.ai/.test(page)) manques.push('un lien vers claude.ai');
  if (manques.length) throw new Error('il manque :\n  - ' + manques.join('\n  - '));
}

await rm(CIBLE, { recursive: true, force: true });
await mkdir(CIBLE, { recursive: true });

let page = await readFile(path.join(SOURCE, 'index.html'), 'utf8');
/* La bibliothèque porte son numéro de version dans son nom : c'est ce qui
   permet de la garder un an en cache sans risquer d'en servir une autre. */
page = page.replace('src="three.min.js"', 'src="three-r128.min.js"');
await verifierCharte(page);
verifierAutonomie(page);
verifierContenu(page);

await writeFile(path.join(CIBLE, 'index.html'), page);
await copyFile(path.join(SOURCE, 'three.min.js'), path.join(CIBLE, 'three-r128.min.js'));
await copyFile(path.join(SOURCE, '.htaccess'), path.join(CIBLE, '.htaccess'));
await mkdir(path.join(CIBLE, 'assets'), { recursive: true });
for (const f of ['logo-yunma-transparent.png', 'carte-photo-1050x1480.jpg']) {
  await copyFile(path.join(SOURCE, 'assets', f), path.join(CIBLE, 'assets', f));
}

const ko = async (f) => Math.round((await stat(path.join(CIBLE, f))).size / 1024);
const zko = Math.round(gzipSync(Buffer.from(page)).length / 1024);
console.log(`  arbre à souhaits ${await ko('index.html')} Ko (${zko} Ko compressés) `
  + `+ 3D ${await ko('three-r128.min.js')} Ko + images ${await ko('assets/logo-yunma-transparent.png')
  + await ko('assets/carte-photo-1050x1480.jpg')} Ko, /wishes/, charte vérifiée`);
