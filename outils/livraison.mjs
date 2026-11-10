/**
 * Les deux colis à déposer sur le FTP.
 *
 * Le site est un ensemble de fichiers statiques : le déposer entièrement
 * marche toujours, mais c'est trois cents fichiers pour en changer treize.
 * Cet outil construit donc le site tel qu'il est dans le dernier commit,
 * le compare à celui que l'on vient de construire, et n'emballe que la
 * différence. On sait ainsi exactement ce qui part, et pourquoi.
 *
 *   livraison/arabica.zip   le dossier /arabica/ en entier, trois langues
 *   livraison/site.zip      les pages du site qui changent
 *   livraison/A-DEPOSER.md  où va quoi, et dans quel ordre
 *
 * L'atlas part toujours en entier : c'est un dossier autonome, il se
 * redépose d'un bloc, et c'est plus sûr que de suivre cinq fichiers.
 *
 *   node outils/livraison.mjs [référence-git]      (par défaut : HEAD)
 */
import { readFileSync, readdirSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const dans = (...p) => join(racine, ...p);
const REF = process.argv[2] || 'HEAD';

const fichiers = (base, sous = '') => {
  const o = [];
  for (const e of readdirSync(join(base, sous), { withFileTypes: true })) {
    const rel = sous ? `${sous}/${e.name}` : e.name;
    if (e.isDirectory()) o.push(...fichiers(base, rel));
    else o.push(rel);
  }
  return o;
};
const empreinte = (f) => createHash('sha1').update(readFileSync(f)).digest('hex');
const sh = (cmd, args, cwd = racine) => execFileSync(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString();

if (!existsSync(dans('dist'))) throw new Error('dist/ est absent : lancez « npm run build » d’abord.');

/* La référence : le site tel qu'il sort du commit indiqué. On le construit
   dans un dossier du dépôt, et non ailleurs, pour que Node y retrouve les
   dépendances en remontant d'un cran. */
const AVANT = dans('.avant');
console.log(`  référence : construction de ${REF}…`);
rmSync(AVANT, { recursive: true, force: true });
mkdirSync(AVANT, { recursive: true });
execFileSync('sh', ['-c', `git archive ${REF} | tar -x -C ${AVANT}`], { cwd: racine, stdio: 'ignore' });
execFileSync('npm', ['run', 'build'], { cwd: AVANT, stdio: 'ignore' });

const A = join(AVANT, 'dist'), B = dans('dist');
const avant = new Map(fichiers(A).map((f) => [f, empreinte(join(A, f))]));
const apres = new Map(fichiers(B).map((f) => [f, empreinte(join(B, f))]));

const change = [...apres.keys()].filter((f) => avant.get(f) !== apres.get(f)).sort();
const disparus = [...avant.keys()].filter((f) => !apres.has(f)).sort();
const atlas = change.filter((f) => f.startsWith('arabica/'));
const site = change.filter((f) => !f.startsWith('arabica/'));

const LIV = dans('livraison');
rmSync(LIV, { recursive: true, force: true });
mkdirSync(LIV, { recursive: true });

/* L'atlas, en entier. Le chemin est relatif au dossier /arabica/ : on le
   déverse tel quel dans le dossier du même nom, sur le serveur. */
sh('zip', ['-rq', join(LIV, 'arabica.zip'), '.', '-x', '.DS_Store'], join(B, 'arabica'));

/* Le site : seulement ce qui change, chemins relatifs à la racine. */
if (site.length) sh('zip', ['-q', join(LIV, 'site.zip'), ...site], B);

const ko = (f) => Math.round(f.reduce((n, x) => n + readFileSync(join(B, x)).length, 0) / 1024);
const tousAtlas = fichiers(join(B, 'arabica'));
const lignes = [
  '# À déposer sur yunma.fr',
  '',
  `Construit le ${new Date().toISOString().slice(0, 10)}, par comparaison avec \`${REF}\`.`,
  '',
  '## 1. `arabica.zip` → dossier `/arabica/`',
  '',
  `Le dossier entier, ${tousAtlas.length} fichiers, ${ko(tousAtlas.map((f) => 'arabica/' + f))} Ko.`,
  'Décompresser **dans** `/arabica/` à la racine du site, en écrasant. Il est autonome :',
  'rien d’autre n’est nécessaire pour qu’il fonctionne.',
  '',
  ...tousAtlas.map((f) => `- \`/arabica/${f}\``),
  '',
  '## 2. `site.zip` → racine du site',
  '',
  `${site.length} fichiers, ${ko(site)} Ko. Décompresser à la racine, en conservant les dossiers.`,
  '',
  ...site.map((f) => `- \`/${f}\``),
  '',
  ...(disparus.length ? ['## À supprimer en ligne', '', ...disparus.map((f) => `- \`/${f}\``), ''] : []),
  '## Après le dépôt',
  '',
  '- Vérifier `https://yunma.fr/arabica/`, `/arabica/en/` et `/arabica/zh/`.',
  '- Dans la Search Console, demander l’indexation des trois adresses de l’atlas',
  '  et de l’article du journal, puis renvoyer `https://yunma.fr/sitemap-index.xml`.',
  '- `https://yunma.fr/llms.txt` doit mentionner l’atlas : c’est ce que lisent',
  '  les moteurs de réponse.',
  '',
];
writeFileSync(join(LIV, 'A-DEPOSER.md'), lignes.join('\n'));
rmSync(AVANT, { recursive: true, force: true });

console.log(`  arabica.zip  ${tousAtlas.length} fichiers (dossier entier)`);
console.log(`  site.zip     ${site.length} fichiers modifiés ou nouveaux`);
if (atlas.length) console.log(`               (dont ${atlas.length} dans /arabica/, déjà dans l’autre colis)`);
if (disparus.length) console.log(`  à supprimer en ligne : ${disparus.join(', ')}`);
console.log(`  livraison/A-DEPOSER.md écrit`);
