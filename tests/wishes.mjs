/**
 * L'arbre à souhaits : le décor, l'heure, et ce qui s'allume la nuit.
 *
 *   npm run test:wishes
 *
 * L'expérience vient d'ailleurs. Elle a été écrite dans un environnement qui
 * fournissait une base de données, un service de téléchargement, et où
 * personne n'a jamais pu ouvrir la scène en trois dimensions — son auteur
 * l'a écrite sans pouvoir la voir. On l'a raccordée au site, on lui a donné
 * les montagnes du Yunnan de l'atlas, le cycle du jour et de la nuit, et de
 * quoi réagir au gyroscope.
 *
 * Ce raccord est exactement ce qui se défait sans bruit : une teinte qui
 * repart de son côté, un reste d'adresse vers l'ancien environnement, un
 * relief qui ne se construit plus, des étiquettes qui ne s'allument pas. Rien
 * de tout cela ne lève d'erreur. On vérifie donc, dans cet ordre :
 *
 *   1. le dossier est clos — une page, une bibliothèque, deux images ;
 *   2. plus rien ne pointe vers l'environnement d'origine ;
 *   3. la page s'ouvre sans une erreur, et la scène se construit ;
 *   4. l'heure tourne, et le décor la suit — ciel, brume, thème ;
 *   5. la nuit allume les vœux, et le jour les éteint ;
 *   6. le texte doré tient son contraste sur le papier rouge ;
 *   7. secouer fait tomber les feuilles, laisse les vœux, et tout repousse ;
 *   8. le gyroscope déplace le regard, et pas au-delà de ce qu'on a dit.
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOSSIER = join(RACINE, 'public', 'wishes');
const PORT = 4412;

let ok = 0;
const echecs = [];
const check = (nom, reel, attendu = true) => {
  if (reel === attendu) { ok++; console.log(`  ok    ${nom}`); }
  else { echecs.push(nom); console.log(`  ÉCHEC ${nom}\n        attendu : ${attendu}\n        obtenu  : ${reel}`); }
};
const titre = (t) => console.log(`\n— ${t}`);

/* ------------------------------------------------------------------ *
 * 1. Le dossier
 * ------------------------------------------------------------------ */
titre('Le dossier se redépose seul');
if (!existsSync(DOSSIER)) {
  console.error('public/wishes/ est absent : lancer d’abord « node outils/construire-wishes.mjs »');
  process.exit(1);
}
const deposes = readdirSync(DOSSIER).sort();
check(`le dossier porte ce qu’il faut (${deposes.join(', ')})`,
  deposes.join(','), '.htaccess,assets,index.html,three-r128.min.js');

const page = readFileSync(join(DOSSIER, 'index.html'), 'utf8');
const htaccess = readFileSync(join(DOSSIER, '.htaccess'), 'utf8');
check('la page est revalidée à chaque visite', htaccess.includes('must-revalidate'));
/* La bibliothèque porte son numéro dans son nom : c'est ce qui permet de la
   garder un an sans risquer d'en servir une autre. */
check('la bibliothèque 3D est gardée un an', htaccess.includes('max-age=31536000'));
check('le relevé du relief et les images sont compressés à la volée', htaccess.includes('DEFLATE'));

/* La page portait trois cent cinq kilo-octets d'images en base64, que la
   compression ne pouvait pas réduire. Si elles y reviennent, le premier
   affichage double. */
check('aucune image n’est encodée dans la page', !/data:image\/(png|jpe?g);base64/.test(page));
const kob = Math.round(Buffer.byteLength(page) / 1024);
check(`la page tient en moins de 220 Ko (${kob})`, kob < 220);

/* ------------------------------------------------------------------ *
 * 2. Plus rien de l'environnement d'origine
 * ------------------------------------------------------------------ */
titre('Rien ne pointe plus vers l’endroit où l’expérience est née');
check('aucun appel à « window.claude »', !/window\.claude/.test(page));
check('aucun lien vers claude.ai', !/claude\.ai/.test(page));
check('le lien de partage mène à yunma.fr', /SHARE_URL\s*=\s*"https:\/\/yunma\.fr\/wishes"/.test(page));
/* Hors les deux fontes et le lien de sortie, rien ne doit être chargé
   d'ailleurs : le jour où ce domaine tombe, l'arbre ne s'ouvre plus. */
const dehors = [...page.matchAll(/<(?:script|link|img)\b[^>]*\b(?:src|href)="(https?:\/\/[^"]+)"/g)]
  .map((m) => m[1]).filter((u) => !/^https:\/\/fonts\.(googleapis|gstatic)\.com(\/|$)/.test(u));
check(`rien n’est chargé du dehors, hors les polices (${dehors.length})`, dehors.length, 0);

/* ------------------------------------------------------------------ *
 * Le serveur d'épreuve
 * ------------------------------------------------------------------ */
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.css': 'text/css' };
const serveur = createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = join(DOSSIER, p);
  if (!existsSync(f) || !f.startsWith(DOSSIER)) { r.writeHead(404); return r.end('404'); }
  r.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' });
  r.end(readFileSync(f));
});
await new Promise((r) => serveur.listen(PORT, r));
/* Le rendu logiciel suffit : on mesure des nombres, pas des pixels de scène. */
const nav = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

/** Ouvre l'arbre à une heure donnée, franchit l'accueil, et attend la scène. */
async function ouvrir(heure = 13, vue = { width: 1000, height: 800 }) {
  const ctx = await nav.newContext({ viewport: vue, locale: 'fr-FR' });
  const p = await ctx.newPage();
  const bruit = [];
  p.on('pageerror', (e) => bruit.push('' + e));
  p.on('console', (m) => { if (m.type() === 'error') bruit.push(m.text()); });
  await p.goto(`http://127.0.0.1:${PORT}/?heure=${heure}`, { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  await p.evaluate(() => document.getElementById('enter').click());
  /* La scène est lourde et le rendu est logiciel : on attend que la poignée
     d'épreuve réponde plutôt que de compter les secondes. */
  await p.waitForFunction(() => window.__essai && window.__essai.voeux() > 0, null, { timeout: 60000 });
  await p.waitForTimeout(1200);
  return { ctx, p, bruit };
}

/* ------------------------------------------------------------------ *
 * 3. La scène
 * ------------------------------------------------------------------ */
titre('La scène se construit');
{
  const { ctx, p, bruit } = await ouvrir(13);
  check('le relief du Yunnan est là', await p.evaluate(() => window.__essai.relief()));
  const c = await p.evaluate(() => window.__essai.compte());
  check(`l’arbre porte ses feuilles et ses cerises (${c.feuilles} + ${c.cerises})`,
    c.feuilles > 3000 && c.cerises > 3000);
  check(`cent cinquante-sept places pour les vœux (${c.voeux})`, c.voeux, 157);
  check(`aucune erreur à l’ouverture (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * 4. L'heure, et le décor qui la suit
 * ------------------------------------------------------------------ *
 * Le piège, dans l'atlas, avait été un ciel qui ne suivait plus l'horloge :
 * la page gardait la couleur de l'heure d'arrivée, et personne ne le voyait
 * tant qu'on ne restait pas. On vérifie donc deux choses distinctes : que
 * l'état dépend de l'heure, et qu'il bouge quand l'heure avance.
 */
titre('Le ciel suit l’heure');
{
  const { ctx, p, bruit } = await ouvrir(13);
  const a = await p.evaluate(() => window.__essai.ciel());
  check(`à 13 h il fait jour (nuit ${a.nuit})`, a.nuit, 0);
  check('le thème est celui du jour', a.theme, 0);
  check(`le bas du ciel est le papier du site (${a.bas.join(',')})`, a.bas.join(','), '239,235,226');

  const b = await p.evaluate(() => { window.__essai.heure(22); return window.__essai.ciel(); });
  check(`à 22 h il fait nuit (nuit ${b.nuit})`, b.nuit, 1);
  check(`le bas du ciel est devenu le bleu de minuit (${b.bas.join(',')})`, b.bas.join(','), '10,16,32');

  /* Le thème bascule par un fondu, pas d'un coup : on lui laisse sa seconde. */
  await p.waitForFunction(() => window.__essai.ciel().theme > 0.98, null, { timeout: 15000 });
  const t = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--beige').trim());
  check(`le fond de l’interface a basculé avec lui (${t})`, /^rgb\(\s*1[0-9],\s*2[0-9],\s*3[0-9]\s*\)$/.test(t));

  /* Et l'horloge avance d'elle-même : c'est ce qui manquait à l'atlas. */
  const h0 = await p.evaluate(() => window.__essai.ciel().h);
  await p.waitForTimeout(3000);
  const h1 = await p.evaluate(() => window.__essai.ciel().h);
  check(`l’heure avance toute seule (${h0.toFixed(3)} → ${h1.toFixed(3)})`, h1 > h0);
  check(`aucune erreur pendant la bascule (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * 5. Ce qui s'allume la nuit
 * ------------------------------------------------------------------ */
titre('La nuit allume les vœux');
{
  const { ctx, p, bruit } = await ouvrir(13);
  const jour = await p.evaluate(() => window.__essai.lueur());
  check(`de jour, rien n’émet (${jour.voeu})`, jour.voeu, 0);
  check('de jour, aucun halo n’est dessiné', jour.halos, false);

  await p.evaluate(() => window.__essai.heure(22));
  await p.waitForTimeout(600);
  const nuit = await p.evaluate(() => window.__essai.lueur());
  check(`la nuit, les étiquettes émettent (${nuit.voeu.toFixed(2)})`, nuit.voeu > 0.5);
  check('la nuit, les halos sont dessinés', nuit.halos);
  check(`la nuit, l’or des fils s’allume (${nuit.or.toFixed(3)})`, nuit.or > jour.or + 0.1);
  /* Sans lune, l'arbre disparaîtrait avec les vœux : il resterait des
     lanternes rouges flottant dans le noir, et plus de caféier. */
  check(`une lune prend le relais du soleil (${nuit.lune.toFixed(2)})`, nuit.lune > 0.2);
  check(`le soleil, lui, est couché (${nuit.soleil.toFixed(2)})`, nuit.soleil < 0.01);
  check(`aucune erreur (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * 6. Le texte doré sur le papier rouge
 * ------------------------------------------------------------------ *
 * Le vœu était écrit à l'encre sombre sur le rouge de l'étiquette : 2,8:1,
 * sous le seuil de tout. Il est passé à l'or, qui est aussi ce qui permet aux
 * mots de briller la nuit. On mesure sur la texture elle-même — c'est elle
 * qu'on lit, à l'écran comme sur la carte.
 */
titre('Le vœu se lit sur son étiquette');
{
  const { ctx, p } = await ouvrir(13);
  const m = await p.evaluate(() => window.__essai.contraste());
  check(`l’or sur le papier rouge tient ${m.ratio.toFixed(2)}:1`, m.ratio >= 4.5);
  check(`et l’or est bien le plus clair du dessin (${m.part} % des pixels)`, m.part > 0 && m.part < 40);
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * 7. Secouer l'arbre
 * ------------------------------------------------------------------ */
titre('Secouer fait tomber les feuilles, et pas les vœux');
{
  const { ctx, p, bruit } = await ouvrir(13);
  const avant = await p.evaluate(() => window.__essai.hauteurs());
  check(`au repos, les feuilles sont dans l’arbre (${avant.feuilleY.toFixed(2)})`, avant.feuilleY > 1);
  const voeux = await p.evaluate(() => window.__essai.voeux());

  await p.evaluate(() => window.__essai.secouer());
  /* Le rendu de l'épreuve est lent : on suit l'horloge de la scène, pas
     celle du mur, sans quoi on mesure la chute au ralenti. */
  await p.waitForFunction(() => window.__essai.secousse() >= 2.3, null, { timeout: 120000 });
  const bas = await p.evaluate(() => window.__essai.hauteurs());
  check(`les feuilles sont tombées (${avant.feuilleY.toFixed(2)} → ${bas.feuilleY.toFixed(2)})`,
    bas.feuilleY < avant.feuilleY - 0.8);
  check(`les cerises aussi (${avant.ceriseY.toFixed(2)} → ${bas.ceriseY.toFixed(2)})`,
    bas.ceriseY < avant.ceriseY - 0.8);
  /* Ce qui tombe au-dessus de l'île s'y pose : on voyait les feuilles
     traverser le sol et faire un tapis dans le vide. */
  check(`ce qui part d’au-dessus de l’île s’y pose (${bas.poseY.toFixed(2)})`,
    Math.abs(bas.poseY - 0.22) < 0.02);
  check(`et rien n’est passé au travers (${bas.sous})`, bas.sous, 0);
  check(`les vœux sont restés accrochés (${voeux})`, await p.evaluate(() => window.__essai.voeux()), voeux);

  await p.waitForFunction(() => window.__essai.secousse() >= 4.5, null, { timeout: 120000 });
  await p.waitForTimeout(400);
  const apres = await p.evaluate(() => window.__essai.hauteurs());
  check(`tout a repoussé (${apres.feuilleY.toFixed(2)})`, Math.abs(apres.feuilleY - avant.feuilleY) < 0.02);

  /* Huit mille matrices recomposées à chaque image : si cela devenait cher,
     la secousse ferait saccader la scène au moment précis où on la regarde. */
  const cout = await p.evaluate(() => window.__essai.coutChute());
  check(`une image de chute coûte moins de 4 ms (${cout.median})`, cout.median < 4);
  check(`aucune erreur pendant la secousse (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * 8. Le gyroscope
 * ------------------------------------------------------------------ */
titre('Le gyroscope déplace le regard, sans le perdre');
{
  const { ctx, p, bruit } = await ouvrir(13);
  const zero = await p.evaluate(() => window.__essai.gyro(0, 0));
  check('au repos, le regard ne bouge pas', zero.th === 0 && zero.ph === 0);
  const pen = await p.evaluate(() => window.__essai.gyro(20, 14));
  check(`une inclinaison le déplace (${pen.th.toFixed(3)} / ${pen.ph.toFixed(3)})`,
    pen.th > 0.05 && pen.ph > 0.05);
  /* Un téléphone posé à plat sur une table ne doit pas emporter la caméra
     à l'autre bout du monde. */
  const fort = await p.evaluate(() => window.__essai.gyro(170, 170));
  check(`et il est borné (${fort.th.toFixed(2)} / ${fort.ph.toFixed(2)})`,
    Math.abs(fort.th) <= 0.26 + 1e-9 && Math.abs(fort.ph) <= 0.2 + 1e-9);
  check(`aucune erreur (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * Les trois langues
 * ------------------------------------------------------------------ */
titre('Les trois langues répondent');
for (const [l, mot] of [['fr', 'Entrer'], ['en', 'Enter'], ['zh', '进入']]) {
  const ctx = await nav.newContext({ viewport: { width: 900, height: 760 }, locale: l === 'zh' ? 'zh-CN' : l });
  const p = await ctx.newPage();
  const bruit = [];
  p.on('pageerror', (e) => bruit.push('' + e));
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load' });
  await p.waitForTimeout(900);
  await p.evaluate((x) => { document.querySelector(`#intro .langs button[data-l="${x}"]`).click(); }, l);
  await p.waitForTimeout(300);
  const t = (await p.locator('#enter').textContent())?.trim();
  check(`en ${l}, on entre par « ${t} »`, t, mot);
  check(`en ${l}, aucune erreur (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}

await nav.close();
serveur.close();
console.log(`\n${ok} vérifications passées, ${echecs.length} en échec`);
if (echecs.length) { echecs.forEach((e) => console.log(`  - ${e}`)); process.exit(1); }
