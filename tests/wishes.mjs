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
 *   4. l'arbre n'a qu'un tronc, et il est posé sur le sol ;
 *   5. l'heure tourne, et le décor la suit — ciel, brume, thème ;
 *   6. la nuit allume les vœux, et le jour les éteint ;
 *   7. le texte doré tient son contraste sur le papier rouge ;
 *   8. secouer emporte les feuilles au vent, laisse les vœux, et tout
 *      repousse ;
 *   9. la visite guidée tourne toute seule, et le premier geste la stoppe ;
 *  10. le gyroscope déplace le regard, et pas au-delà de ce qu'on a dit.
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
    c.feuilles > 2000 && c.cerises > 2500);
  check(`cent vingt-huit places pour les vœux (${c.voeux})`, c.voeux, 128);
  const n = await p.evaluate(() => window.__essai.neige());
  check(`mille flocons tombent (${n.flocons})`, n.flocons, 1000);
  check(`aucune erreur à l’ouverture (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * 4. La charpente, et le sol
 * ------------------------------------------------------------------ *
 * Le tronc était une souche de rayon 0,30 d'où repartaient quatre tiges de
 * 0,17 — d'où la marche de circonférence qu'on voyait, et le bouquet de
 * perches. Un caféier pousse en monopode : un axe, et des rameaux. On
 * vérifie donc qu'il n'y a qu'un axe, que son rayon décroît sans à-coup, et
 * qu'aucun rameau ne prétend en être un second.
 */
titre('L’arbre n’a qu’un tronc, et il est posé au sol');
{
  const { ctx, p, bruit } = await ouvrir(11);
  const a = await p.evaluate(() => window.__essai.arbre());
  check(`un seul axe (${a.troncs})`, a.troncs, 1);
  check(`il va du sol à la cime (${a.haut} unités)`, a.haut > 6.5 && a.haut < 8.5);
  check(`son rayon décroît sans marche (le plus grand écart vaut ${a.saut.toFixed(2)} fois l’écart moyen)`,
    a.saut < 1.35);
  check(`et le pied s’évase, lui, de ${((a.patte - 1) * 100).toFixed(0)} %`, a.patte > 1.2);
  check(`le plus gros rameau ne fait que ${(a.part * 100).toFixed(0)} % du tronc`, a.part > 0.2 && a.part < 0.8);
  check(`du pied à la cime : ${a.basTronc} → ${a.hautTronc}`, a.basTronc > a.hautTronc * 4);

  /* L'île qui flottait n'est plus : le sol est à zéro sous l'arbre, et il
     monte en montagnes autour. */
  check('le sol est à zéro sous le tronc', await p.evaluate(() => window.__essai.sol(0, 0)), 0);
  const prof = await p.evaluate(() => window.__essai.profil(4.7, 18, 900).map((x) => x[1]));
  const haut = Math.max(...prof), bas = Math.min(...prof);
  check(`et il monte en montagnes autour (de ${bas} à ${haut})`, haut > 120);
  /* L'œil ne passe pas sous la neige : c'était le prix à payer pour poser
     l'arbre — par en dessous, on voyait l'envers du terrain. */
  await p.evaluate(() => window.__essai.vue({ tx: 0, ty: 3, tz: 0, r: 20, ph: 1.86, th: 0.4 }));
  await p.waitForTimeout(1600);
  const o = await p.evaluate(() => window.__essai.oeil());
  check(`l’œil reste au-dessus du sol (${o.garde} unités de garde)`, o.garde > 1.3);
  check(`aucune erreur (${bruit.length})`, bruit.length, 0);
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
  /* Le ciel de l'atlas est celui d'une journée douce ; celui-ci est un ciel
     d'hiver, refroidi de jour. Une neige blanche sur le crème du site ne
     faisait qu'un seul ton, et il n'y avait plus d'horizon du tout. */
  check(`le ciel de jour est plus froid que le papier du site (${a.bas.map(Math.round).join(',')})`,
    a.bas[2] > a.bas[0] && a.bas[2] > 226);

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
titre('Secouer emporte les feuilles au vent, et pas les vœux');
{
  const { ctx, p, bruit } = await ouvrir(13);
  const avant = await p.evaluate(() => window.__essai.hauteurs());
  check(`au repos, les feuilles sont dans l’arbre (${avant.feuilleY.toFixed(2)})`, avant.feuilleY > 1);
  const voeux = await p.evaluate(() => window.__essai.voeux());

  await p.evaluate(() => window.__essai.secouer());
  /* Le rendu de l'épreuve est lent : on suit l'horloge de la scène, pas
     celle du mur, sans quoi on mesure la chute au ralenti. */
  await p.waitForFunction(() => window.__essai.secousse() >= 2.4, null, { timeout: 120000 });
  const bas = await p.evaluate(() => window.__essai.hauteurs());
  check(`les feuilles sont tombées (${avant.feuilleY.toFixed(2)} → ${bas.feuilleY.toFixed(2)})`,
    bas.feuilleY < avant.feuilleY - 0.8);
  check(`les cerises aussi (${avant.ceriseY.toFixed(2)} → ${bas.ceriseY.toFixed(2)})`,
    bas.ceriseY < avant.ceriseY - 0.8);
  /* Les feuilles ne tombent pas : elles s'envolent. On mesure donc leur
     écart au tronc, et non leur hauteur. */
  const ec = await p.evaluate(() => window.__essai.ecart());
  check(`et le vent les emporte (${ec.moy.toFixed(1)} unités du tronc, au plus loin ${ec.max.toFixed(1)})`,
    ec.moy > 1.5 && ec.max > 6);
  check(`les vœux sont restés accrochés (${voeux})`, await p.evaluate(() => window.__essai.voeux()), voeux);

  /* La repousse est étalée : si tout revenait d'un coup, l'arbre se
     rhabillerait d'un bloc au lieu de se remplir. */
  await p.waitForFunction(() => window.__essai.secousse() >= 7.0, null, { timeout: 180000 });
  const mi = await p.evaluate(() => window.__essai.repousse());
  check(`à mi-repousse, une partie seulement est revenue (${mi} %)`, mi > 5 && mi < 95);

  await p.waitForFunction(() => window.__essai.secousse() >= 9.0, null, { timeout: 180000 });
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
 * La visite guidée
 * ------------------------------------------------------------------ *
 * Un bouton, et l'arbre se montre tout seul. Ce qui compte, et qui se
 * casse sans bruit : qu'elle tourne vraiment, qu'elle approche des vœux, et
 * que le premier geste du visiteur la lui reprenne — on ne lutte pas
 * contre quelqu'un qui veut tourner l'arbre lui-même.
 */
titre('La visite guidée tourne, et rend la main');
{
  const { ctx, p, bruit } = await ouvrir(11);
  check('au repos, elle est arrêtée', await p.evaluate(() => window.__essai.visiteOn()), false);
  await p.evaluate(() => window.__essai.visite(true));
  const a = await p.evaluate(() => window.__essai.visiteEtat());
  /* Le rendu logiciel de l'épreuve tombe à une image par seconde, et
     l'horloge de la scène est plafonnée à cinquante millisecondes par
     image : deux secondes de mur ne font qu'un dixième de seconde de
     scène. On attend donc que la vue ait tourné, pas qu'il se soit écoulé
     un temps. */
  const tourne = await p.waitForFunction((t0) => window.__essai.visiteEtat().th > t0 + 0.12,
    a.th, { timeout: 180000 }).then(() => true).catch(() => false);
  const b = await p.evaluate(() => window.__essai.visiteEtat());
  check(`elle fait tourner la vue (${a.th} → ${b.th})`, tourne);
  /* Elle doit aussi s'approcher d'un vœu : c'est la raison d'être de la
     visite, et c'est l'étape qu'un ordre mal tiré pourrait sauter. */
  await p.evaluate(() => window.__essai.avancer());
  await p.waitForFunction(() => window.__essai.visiteEtat().vise, null, { timeout: 60000 });
  const c = await p.evaluate(() => window.__essai.visiteEtat());
  check(`elle s’approche d’un vœu (rayon ${c.r})`, c.r < 4);
  /* Le premier geste sur la scène la stoppe. */
  await p.mouse.move(500, 400); await p.mouse.down(); await p.mouse.up();
  await p.waitForTimeout(300);
  check('le premier geste la stoppe', await p.evaluate(() => window.__essai.visiteOn()), false);
  check(`aucune erreur (${bruit.length})`, bruit.length, 0);
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
