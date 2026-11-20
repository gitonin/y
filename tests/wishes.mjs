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
 * quoi réagir au souffle.
 *
 * Ce raccord est exactement ce qui se défait sans bruit : une teinte qui
 * repart de son côté, un reste d'adresse vers l'ancien environnement, un
 * relief qui ne se construit plus, des étiquettes qui ne s'allument pas. Rien
 * de tout cela ne lève d'erreur. On vérifie donc, dans cet ordre :
 *
 *   1. le dossier est clos — une page, une bibliothèque, deux images ;
 *   2. plus rien ne pointe vers l'environnement d'origine ;
 *   3. la page s'ouvre sans une erreur, et la scène se construit ;
 *   4. l'arbre n'a qu'un tronc, et son île tient tout entière à l'écran ;
 *   5. l'heure tourne, et le décor la suit — ciel, brume, thème ;
 *   6. la nuit allume les vœux, et le jour les éteint ;
 *   7. le texte doré tient son contraste sur le papier rouge ;
 *   8. secouer emporte les feuilles au vent, laisse les vœux, et tout
 *      repousse ;
 *   9. la visite guidée tourne toute seule, et le premier geste la stoppe ;
 *  10. toucher un vœu s'en approche, sans ouvrir de fiche par-dessus ;
 *  11. le haut de l'écran ne porte que le son et la langue ;
 *  12. on entre par le vœu de Yunma, dans la langue du visiteur ;
 *  13. la musique de Noël se joue en avance sur elle-même ;
 *  14. les guirlandes s'allument, et le ciel a ses habitants.
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import QRCode from 'qrcode';

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
/* Le garde-fou n'est pas la taille elle-même — deux cent quarante kilo-octets
   de texte se compressent à moins de cent — mais le retour des images
   encodées, qui, elles, ne se compressent pas. C'est la vérification
   au-dessus qui les attrape ; celle-ci dit seulement que la page reste une
   page. */
check(`la page tient en moins de 270 Ko (${kob})`, kob < 270);

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
  check(`assez de places pour les vœux (${c.voeux})`, c.voeux > 100);
  check(`aucune erreur à l’ouverture (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * 4. La charpente, et le cadrage d'accueil
 * ------------------------------------------------------------------ *
 * Le tronc était une souche de rayon 0,30 d'où repartaient quatre tiges de
 * 0,17 — d'où la marche de circonférence qu'on voyait, et le bouquet de
 * perches. Un caféier pousse en monopode : un axe, et des rameaux. On
 * vérifie donc qu'il n'y a qu'un axe, que son rayon décroît sans à-coup, et
 * qu'aucun rameau ne prétend en être un second.
 *
 * Puis le cadrage : l'arbre flotte sur son île, et l'île descend sous lui.
 * Le premier regard doit porter l'ensemble — la cime dans l'écran, le
 * dessous de l'île au-dessus du bouton d'appel, qui mange le bas. C'est ce
 * qui s'était perdu quand l'île est revenue : l'arbre était coupé, et le
 * socle passait derrière « Accrocher un vœu ».
 */
titre('L’arbre n’a qu’un tronc, et son île tient à l’écran');
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

  check(`aucune erreur (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}

/* On regarde le cadrage sur trois écrans : un large, un carré, et un
   téléphone. C'est le téléphone qui décide — c'est là que la barre d'appel
   prend le plus de place, et là que le champ est le plus étroit. */
for (const [nom, vue] of [['large', { width: 1440, height: 820 }],
  ['carré', { width: 900, height: 900 }], ['téléphone', { width: 390, height: 844 }]]) {
  const { ctx, p, bruit } = await ouvrir(13, vue);
  /* On arrive sur le vœu de Yunma : le cadrage d'accueil est celui vers
     lequel la caméra recule ensuite, et c'est lui qu'on mesure. */
  await p.evaluate(() => { window.__essai.maison(); window.__essai.poser(); });
  await p.waitForTimeout(400);
  const c = await p.evaluate(() => window.__essai.cadrage());
  check(`sur ${nom}, la cime est dans l’écran (${c.haut})`, c.haut < 0.98);
  check(`sur ${nom}, l’île passe au-dessus de l’appel (${c.bas} > ${c.barre})`, c.bas > c.barre);
  check(`sur ${nom}, aucune erreur (${bruit.length})`, bruit.length, 0);
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
  /* Le ciel est celui de l'atlas, sans retouche : l'arbre a retrouvé son
     île et ses montagnes de sable, et deux expériences du même site n'ont
     pas à avoir deux midis différents. Le ciel d'hiver refroidi avait été
     fait pour la neige, qui n'est plus là. */
  check(`le ciel de jour est le crème de l’atlas (${a.bas.map(Math.round).join(',')})`,
    a.bas[0] > a.bas[1] && a.bas[1] > a.bas[2] && a.bas[0] > 235);

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
/* ------------------------------------------------------------------ *
 * Les textes tiennent la nuit
 * ------------------------------------------------------------------ *
 * Tout le décor et toute l'interface basculent à la tombée du jour :
 * l'encre devient claire, le crème devient bleu de minuit. Ce qui se défait
 * là-dedans, ce sont les couleurs posées une fois pour toutes. Le champ où
 * l'on écrit son vœu s'éclaircissait au focus — en blanc sur blanc la nuit,
 * sur le seul endroit où le visiteur a quelque chose à écrire. Et la
 * fenêtre de la story, dont le fond est sombre en tout temps, prenait ses
 * textes au thème : ils disparaissaient le soir.
 *
 * On mesure donc, pour de bon, le rapport de contraste de chaque texte sur
 * le fond qui est réellement derrière lui.
 */
titre('Les textes tiennent, de jour comme de nuit');
for (const [heure, moment] of [[13, 'de jour'], [22, 'de nuit']]) {
  const { ctx, p, bruit } = await ouvrir(heure);
  const nuit = (await p.evaluate(() => window.__essai.ciel())).nuit;
  check(`${moment}, le ciel est bien celui-là (nuit ${nuit})`, heure === 13 ? nuit < 0.1 : nuit > 0.9);
  /* On ouvre tout ce qui peut s'ouvrir, d'un coup. */
  await p.evaluate(() => {
    document.getElementById('sheet').classList.add('open');
    document.getElementById('card').classList.add('open');
    document.getElementById('modal').classList.add('open');
    document.getElementById('story').classList.add('open');
    document.getElementById('cmodal').classList.add('open');
    document.getElementById('lmodal').classList.add('open');
    document.getElementById('sNote').textContent = 'Prête.';
    document.getElementById('sShare').textContent = 'Partager';
    document.getElementById('recuDe').classList.add('on');
    document.getElementById('recuDe').textContent = 'Léa vous envoie ce message';
    document.getElementById('toast').classList.add('on');
    document.getElementById('toast').textContent = 'Lien copié';
    /* Les deux lignes de la fiche chinoise ne sont écrites que pour un vœu
       tout fait : on les remplit, sinon elles ne se mesurent pas. */
    document.getElementById('cPy').textContent = 'wànshì rúyì';
    document.getElementById('cTr').textContent = 'Que tout aille bien';
    document.getElementById('rNote').textContent = 'Merci.';
    /* Et les deux états choisis, qui portaient eux aussi un fond clair posé
       en dur : la forme de l'étiquette, et le vœu tout fait. */
    const f = document.querySelector('#shapes button'), v = document.querySelector('#presets button');
    if (f) f.classList.add('on');
    if (v) v.classList.add('on');
  });
  await p.focus('#own');
  await p.waitForTimeout(500);
  const mesure = await p.evaluate(() => {
    const lum = (c) => { const f = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
      return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]; };
    const rgba = (s) => { const m = s.match(/[\d.]+/g); if (!m) return null;
      return [+m[0], +m[1], +m[2], m[3] === undefined ? 1 : +m[3]]; };
    /* Le fond réel : on empile les fonds des parents jusqu'au premier
       opaque, et on les compose. */
    const fond = (el) => { let n = el; const pile = [];
      while (n && n !== document.documentElement) { const c = rgba(getComputedStyle(n).backgroundColor);
        if (c && c[3] > 0) { pile.push(c); if (c[3] >= 0.99) break; } n = n.parentElement; }
      let out = [20, 20, 20];
      for (let i = pile.length - 1; i >= 0; i--) { const c = pile[i], a = c[3];
        out = [0, 1, 2].map((k) => c[k] * a + out[k] * (1 - a)); }
      return out; };
    /* Le texte aussi peut être translucide — « rgba(encre, .6) » se lit
       partout dans cette page. On le compose donc sur son fond avant de
       mesurer : sans cela, un texte à deux dixièmes d'opacité passerait
       pour parfaitement lisible, et l'épreuve se mentirait à elle-même. */
    const ratio = (c, b) => { const a = c[3] === undefined ? 1 : c[3];
      const f = [0, 1, 2].map((k) => c[k] * a + b[k] * (1 - a));
      const l1 = lum(f), l2 = lum(b);
      return +(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05))).toFixed(2); };
    const sel = ['#own', '#name', '#link', '#hint', '#recuDe', '#voeuShareT', '#toast', '#stTitle',
      '#stepN', '#cBy', '#cZh', '#cPy', '#cTr', '#rTxt', '#rNote', '#shareTtl', '#shareTxt', '#sNote',
      '#sShare', '#sClose', '#copy', '#mClose', '#cCard', '#cBack', '#cShare', '#add', '#byStory',
      '#byMail', '#rInsta', '#cJpg', '#cClose', '#leaveStay', '#leaveGo', '#stBack', '#stNext',
      '#hang', '#sheetX', '#ownNote', '#nameNote', '#presets .p', '#presets .t', '#tabs button'];
    /* Le seuil dépend de la taille, comme le dit la règle : un texte de
       vingt-quatre pixels, ou de dix-neuf en gras, se lit à trois contre un
       là où un texte courant en demande quatre et demi. Le grand vœu
       chinois de la fiche fait trente-quatre pixels : lui appliquer le seuil
       des petits textes reviendrait à repeindre la couleur de la marque
       pour un défaut qui n'existe pas. */
    const seuil = (st) => { const t = parseFloat(st.fontSize), g = parseInt(st.fontWeight, 10) || 400;
      return (t >= 24 || (t >= 18.66 && g >= 700)) ? 3 : 4.5; };
    /* Les boutons principaux portent l'orange de la marque, qui vient de la
       charte du site : cette teinte est un mi-ton, et rien ne tient 4,5
       dessus — ni le crème, ni l'encre. La repeindre ici ferait diverger la
       page du site, ce que la construction refuse à juste titre. On les
       mesure donc à part, on dit leur chiffre à chaque passage, et l'on
       s'assure qu'il ne se dégrade pas. Le jour où la charte du site
       changera d'orange, c'est ici qu'on le verra. */
    const accent = rgba(getComputedStyle(document.documentElement).getPropertyValue('--rust').trim());
    const surAccent = (b) => !!accent && Math.abs(b[0] - accent[0]) < 14
      && Math.abs(b[1] - accent[1]) < 14 && Math.abs(b[2] - accent[2]) < 14;
    let pire = { nom: '', r: 99, marge: 99 }, pireAccent = { nom: '', r: 99 };
    for (const q of sel) { const el = document.querySelector(q); if (!el) continue;
      const st = getComputedStyle(el), b = fond(el), r = ratio(rgba(st.color), b);
      if (surAccent(b)) { if (r < pireAccent.r) pireAccent = { nom: q, r }; continue; }
      const sq = seuil(st), marge = r - sq;
      if (marge < pire.marge) pire = { nom: q, r, seuil: sq, marge: +marge.toFixed(2) }; }
    const champ = document.getElementById('own'), note = document.getElementById('sNote');
    return { pire, accent: pireAccent,
      placeholder: ratio(rgba(getComputedStyle(champ, '::placeholder').color), fond(champ)),
      champ: ratio(rgba(getComputedStyle(champ).color), fond(champ)),
      note: ratio(rgba(getComputedStyle(note).color), fond(note)) };
  });
  check(`${moment}, tous les textes tiennent leur seuil (le plus juste : ${mesure.pire.nom} à ${mesure.pire.r} pour ${mesure.pire.seuil})`,
    mesure.pire.marge >= 0);
  /* Et l'orange de la marque, mesuré à part : on ne le repeint pas ici,
     mais on ne le perd pas de vue. */
  check(`${moment}, le crème sur l’orange de la marque tient ${mesure.accent.r} (${mesure.accent.nom})`,
    mesure.accent.r >= 3.5);
  /* Les trois qui avaient lâché, nommément. */
  check(`${moment}, le vœu qu’on écrit se lit dans son champ (${mesure.champ})`, mesure.champ >= 4.5);
  check(`${moment}, et son texte de remplacement aussi (${mesure.placeholder})`, mesure.placeholder >= 4.5);
  check(`${moment}, la fenêtre de la story garde ses textes clairs (${mesure.note})`, mesure.note >= 4.5);
  check(`${moment}, aucune erreur (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}

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

  /* L'arbre reste nu un moment : la repousse ne commence qu'après cinq
     secondes et demie. Sans ce temps-là, on n'avait pas le temps de le
     voir dépouillé. */
  await p.waitForFunction(() => window.__essai.secousse() >= 5.0, null, { timeout: 180000 });
  const nu = await p.evaluate(() => window.__essai.repousse());
  check(`à cinq secondes, l’arbre est encore nu (${nu} %)`, nu < 5);

  /* Puis elle s'étale : si tout revenait d'un coup, l'arbre se rhabillerait
     d'un bloc au lieu de se remplir. */
  await p.waitForFunction(() => window.__essai.secousse() >= 10.6, null, { timeout: 240000 });
  const mi = await p.evaluate(() => window.__essai.repousse());
  check(`à mi-repousse, une partie seulement est revenue (${mi} %)`, mi > 5 && mi < 95);

  await p.waitForFunction(() => window.__essai.secousse() >= 16.0, null, { timeout: 300000 });
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
 * Le vœu qu'on envoie
 * ------------------------------------------------------------------ *
 * Envoyer un vœu supposait que celui qui le reçoit puisse le lire. Tant
 * qu'il n'y a pas de base partagée, un vœu n'existe que dans le navigateur
 * de celui qui l'a écrit : le lien « #w-<identifiant> » menait à l'arbre et
 * l'étiquette n'y était pas, le bouton « Envoyer » était masqué, et le QR
 * code de la carte retombait sur l'adresse nue. Le vœu est donc maintenant
 * dans le lien lui-même.
 *
 * Trois choses à tenir : le lien redonne le vœu, le QR code se relit, et
 * celui qui ouvre le lien tombe dessus.
 */
titre('Le vœu tient dans le lien');
{
  const { ctx, p, bruit } = await ouvrir(11);
  const cas = [
    ['une formule', { s: 'plaque', p: 5, t: '', n: 'Jo' }],
    ['des mots à soi', { s: 'leaf', p: -1, t: 'Que chaque tasse te réchauffe le cœur, et la suivante aussi', n: 'Antonin' }],
    ['du chinois', { s: 'tablet', p: -1, t: '愿你的新年满是咖啡香，愿每一杯都暖到心里，愿你平安喜乐', n: '安东' }],
  ];
  for (const [nom, d] of cas) {
    const r = await p.evaluate((dd) => {
      const url = window.__essai.lien(dd);
      const relu = window.__essai.decoder(url.split('?v=')[1] || '');
      const m = window.__qr(url);
      return { url, taille: url.length, version: m ? (m.length - 17) / 4 : 0,
        relu: relu && { s: relu.s, p: relu.p, t: relu.t, n: relu.n } };
    }, d);
    check(`${nom} : le lien redonne le vœu (${r.taille} signes)`,
      JSON.stringify(r.relu), JSON.stringify(d));
    /* Le QR code de la carte doit porter ce lien-là, et non l'adresse nue :
       c'est tout l'intérêt de la carte. Les six premières versions
       plafonnaient à cent six signes ; un vœu écrit à la main les dépasse. */
    check(`${nom} : le QR code le porte (version ${r.version})`, r.version >= 1 && r.version <= 9);
  }
  /* Un vœu du décor s'envoie comme un autre : ce sont des vœux, et le lien
     les reporte à l'identique. Seul celui de Yunma n'a pas de lien à lui —
     son texte change avec la langue de qui le lit. */
  check('un vœu de décor s’envoie, lui aussi',
    await p.evaluate(() => window.__essai.lien({ s: 'plaque', p: 0, decor: true }).indexOf('?v=') > 0));
  check('le vœu de Yunma, non',
    await p.evaluate(() => window.__essai.lien({ s: 'plaque', yunma: true }).indexOf('?v='), null), -1);
  check(`aucune erreur (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}

titre('Celui qui ouvre le lien tombe sur le vœu');
{
  /* Un autre navigateur, rien en mémoire : c'est bien la situation de celui
     à qui on l'envoie. */
  const envoi = { s: 'heart', p: -1, t: 'Un café, un plaid, et toi', n: 'Antonin' };
  const c1 = await nav.newContext({ viewport: { width: 800, height: 600 }, locale: 'fr-FR' });
  const e1 = await c1.newPage();
  await e1.goto(`http://127.0.0.1:${PORT}/?heure=11`, { waitUntil: 'load' });
  await e1.waitForTimeout(900);
  const lien = await e1.evaluate((w) => window.__essai.lien(w), envoi);
  await c1.close();
  check(`le lien porte le vœu et non l’arbre nu (${lien.length} signes)`, lien.indexOf('?v=') > 0);

  const ctx = await nav.newContext({ viewport: { width: 1000, height: 780 }, locale: 'fr-FR' });
  const p = await ctx.newPage();
  const bruit = [];
  p.on('pageerror', (e) => bruit.push('' + e));
  await p.goto(`http://127.0.0.1:${PORT}/?heure=11&v=` + lien.split('?v=')[1], { waitUntil: 'load' });
  await p.waitForTimeout(1400);
  await p.evaluate(() => document.getElementById('enter').click());
  await p.waitForFunction(() => window.__essai && window.__essai.voeux() > 0, null, { timeout: 60000 });
  /* La caméra y va au bout d'une seconde et deux dixièmes, puis met le
     temps qu'il faut à s'y rendre : on attend la carte, pas une horloge. */
  const vu = await p.waitForFunction(() => document.getElementById('recuDe').classList.contains('on'),
    null, { timeout: 60000 }).then(() => true).catch(() => false);
  /* Plus de cartouche par-dessus la scène : une ligne, et les deux boutons
     de toujours en dessous. Le mot, lui, est écrit sur l'étiquette, que la
     caméra va lire de tout près. */
  check('une ligne dit qui l’envoie', vu);
  check('et elle le nomme',
    ((await p.locator('#recuDe').textContent()) || '').includes(envoi.n));
  check('aucune fiche ne s’ouvre par-dessus',
    await p.evaluate(() => window.__essai.fiche()), false);
  const pres = await p.evaluate(() => window.__essai.visiteEtat());
  check(`et la caméra s’en approche de tout près (rayon ${pres.r})`, pres.r < 3.8);
  /* La carte montre l'arbre lui-même, rendu à l'instant : plus de
     photographie de fond, plus de reconstitution de l'étiquette dessinée à
     la main. C'est le dessin de la story, arrêté, plus un QR code. */
  await p.evaluate(() => { window.__essai.viser(0, true); });
  await p.waitForFunction(() => document.getElementById('card').classList.contains('open'), null, { timeout: 60000 });
  await p.click('#cCard');
  await p.waitForFunction(() => document.getElementById('cmodal').classList.contains('open'), null, { timeout: 60000 });
  await p.waitForTimeout(400);
  const ca = await p.evaluate(() => window.__essai.carte());
  check(`la carte est au format d’une carte (${ca.l} × ${ca.h})`, ca.l === 1050 && ca.h === 1480);
  check(`elle montre la scène et non un fond uni (écart ${ca.ecart})`, ca.ecart > 60);
  check(`trois zones cliquables pour le PDF (${ca.liens})`, ca.liens, 3);

  check(`aucune erreur (${bruit.length})`, bruit.length, 0);
  await ctx.close();

  /* Le vœu voyage maintenant dans la question du lien, « ?v=… », pour qu'un
     réseau social puisse un jour savoir lequel on lui colle — ce qui suit un
     dièse n'arrive jamais au serveur. Les liens d'hier, eux, sont déjà dans
     des messages : ils doivent continuer de mener au vœu. */
  const c3 = await nav.newContext({ viewport: { width: 900, height: 700 }, locale: 'fr-FR' });
  const p3 = await c3.newPage();
  await p3.goto(`http://127.0.0.1:${PORT}/?heure=11#v-` + lien.split('?v=')[1], { waitUntil: 'load' });
  await p3.waitForTimeout(1200);
  await p3.evaluate(() => document.getElementById('enter').click());
  await p3.waitForFunction(() => window.__essai && window.__essai.voeux() > 0, null, { timeout: 60000 });
  const hier = await p3.waitForFunction(() => document.getElementById('recuDe').classList.contains('on'),
    null, { timeout: 60000 }).then(() => true).catch(() => false);
  check('un lien d’hier, en dièse, mène encore au vœu', hier);
  await c3.close();
}

/* ------------------------------------------------------------------ *
 * La visite guidée
 * ------------------------------------------------------------------ *
 * Elle n'a plus de bouton : l'arbre se montre tout seul, et le premier
 * geste du visiteur la lui reprend. Elle revient d'elle-même au bout de
 * dix secondes sans un geste — c'est une veilleuse, pas un film qu'on
 * lance.
 */
titre('La visite guidée se lance seule, rend la main, et revient');
{
  const { ctx, p, bruit } = await ouvrir(11);
  /* Elle démarre d'elle-même après l'ouverture sur le vœu de Yunma. Le
     relais est posé à l'arrivée, et il part sept secondes plus tard — sept
     secondes de l'horloge de la scène, qui est plafonnée à cinquante
     millisecondes par image : sous un rendu logiciel à une image par
     seconde, cela fait près de trois minutes de mur, et l'attente devenait
     un pari sur la charge de la machine. On vérifie donc les deux moitiés :
     que le relais est bien posé tout seul, puis qu'arrivé à terme il lance
     la visite tout seul. Rien ici n'appelle la visite. */
  check('le relais est posé à l’arrivée',
    await p.evaluate(() => window.__essai.accueil().arme));
  await p.evaluate(() => window.__essai.relais(6.9));
  const partie = await p.waitForFunction(() => window.__essai.visiteOn(), null, { timeout: 90000 })
    .then(() => true).catch(() => false);
  check('elle part d’elle-même', partie);
  const a = await p.evaluate(() => window.__essai.visiteEtat());
  /* Le rendu logiciel de l'épreuve tombe à une image par seconde, et
     l'horloge de la scène est plafonnée à cinquante millisecondes par
     image : deux secondes de mur ne font qu'un dixième de seconde de
     scène. On attend donc que la vue ait bougé, pas qu'il se soit écoulé
     un temps. */
  await p.evaluate(() => window.__essai.avancer());
  await p.waitForFunction(() => window.__essai.visiteEtat().vise, null, { timeout: 120000 });
  const c = await p.evaluate(() => window.__essai.visiteEtat());
  check(`elle s’approche d’un vœu (rayon ${c.r})`, c.r < 6);
  /* Le premier geste sur la scène la stoppe. */
  await p.mouse.move(500, 400); await p.mouse.down(); await p.mouse.up();
  await p.waitForTimeout(300);
  check('le premier geste la stoppe', await p.evaluate(() => window.__essai.visiteOn()), false);
  /* Et elle revient quand plus rien ne bouge. */
  await p.evaluate(() => window.__essai.inactif(12));
  const revenue = await p.waitForFunction(() => window.__essai.visiteOn(), null, { timeout: 120000 })
    .then(() => true).catch(() => false);
  check('et elle revient après quelques secondes d’immobilité', revenue);
  check(`aucune erreur (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * L'ouverture
 * ------------------------------------------------------------------ *
 * On n'entre plus par un plan large : on entre par un mot. Le vœu de Yunma
 * est accroché à la place la mieux dégagée de l'arbre, la caméra s'y pose,
 * et recule au bout de sept secondes pour découvrir l'île — sauf si le
 * visiteur a déjà pris la main, ou si un lien reçu réclame la place.
 */
titre('On entre par le vœu de Yunma');
for (const [l, debut] of [['fr', 'Yunma vous souhaite'], ['en', 'Yunma wishes you'], ['zh', '云马祝您']]) {
  const ctx = await nav.newContext({ viewport: { width: 1000, height: 800 }, locale: l === 'zh' ? 'zh-CN' : l });
  const p = await ctx.newPage();
  const bruit = [];
  p.on('pageerror', (e) => bruit.push('' + e));
  await p.goto(`http://127.0.0.1:${PORT}/?heure=13`, { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  await p.evaluate(() => document.getElementById('enter').click());
  await p.waitForFunction(() => window.__essai && window.__essai.voeux() > 0, null, { timeout: 60000 });
  await p.waitForTimeout(1000);
  const y = await p.evaluate(() => window.__essai.yunma());
  check(`en ${l}, le vœu est dans la langue du visiteur (« ${y.texte} »)`, y.texte.startsWith(debut));
  check(`en ${l}, il est le premier de l’arbre et il y est accroché`, y.premier && y.accroche);
  const a = await p.evaluate(() => window.__essai.accueil());
  check(`en ${l}, la caméra s’est posée dessus`, a.fait && a.vise);
  check(`en ${l}, et le relais vers la visite est posé`, a.arme);
  await p.evaluate(() => window.__essai.poser());
  await p.waitForTimeout(500);
  const v = await p.evaluate(() => window.__essai.cible(window.__essai.yunma().place));
  check(`en ${l}, le mot est dans l’écran (${v.x} / ${v.y}, rayon ${v.r})`,
    Math.abs(v.x) < 0.5 && Math.abs(v.y) < 0.9 && v.r < 6);
  /* Le premier geste annule le recul : on ne reprend pas la main à
     quelqu'un qui vient de la prendre. */
  await p.mouse.move(500, 400); await p.mouse.down(); await p.mouse.up();
  await p.waitForTimeout(200);
  check(`en ${l}, le premier geste annule le recul`, (await p.evaluate(() => window.__essai.accueil())).recul, false);
  check(`en ${l}, aucune erreur (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * La musique de Noël
 * ------------------------------------------------------------------ *
 * Rien n'est téléchargé : l'air est joué note à note par les oscillateurs
 * de la page. Ce qui se casse sans bruit, ici, c'est l'horloge : si les
 * notes ne sont plus programmées en avance, la mélodie hoquette à chaque
 * image sautée. On vérifie donc qu'il y a toujours de l'avance, et que
 * l'air avance.
 */
titre('La musique de Noël se joue toute seule');
{
  const { ctx, p, bruit } = await ouvrir(13);
  await p.waitForTimeout(1200);
  const a = await p.evaluate(() => window.__essai.musique());
  /* Elle ne se choisit plus : on entre dans une veillée de Noël, et la
     pilule du son suffit à la faire taire. */
  check(`elle part d’elle-même (air ${a.air}, note ${a.note})`, a.on && a.note > 0);
  check(`quatre airs se relaient (${a.noms.join(', ')})`, a.airs >= 4);
  check(`et les notes sont programmées en avance (${a.avance} s)`, a.avance > 0 && a.avance < 2.4);
  await p.waitForTimeout(1500);
  const b = await p.evaluate(() => window.__essai.musique());
  check(`l’air avance (${a.note} → ${b.note})`, b.note > a.note);
  await p.evaluate(() => window.__essai.musique(false));
  check('et elle s’arrête quand on le demande', (await p.evaluate(() => window.__essai.musique())).on, false);
  check('et rien nulle part ne propose de la choisir',
    await p.evaluate(() => !document.getElementById('mNoel') && !document.getElementById('mFete')
      && !document.getElementById('mCine') && !document.getElementById('menu')));
  check(`aucune erreur (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * Le ciel a des habitants
 * ------------------------------------------------------------------ *
 * Des oiseaux le jour, des étoiles filantes la nuit. Chacun à son heure :
 * une étoile filante en plein midi serait une erreur, et c'est le genre
 * d'erreur qu'on ne voit jamais soi-même, puisqu'elle dure une seconde.
 */
/* ------------------------------------------------------------------ *
 * Le son, et les absences
 * ------------------------------------------------------------------ *
 * Quitter la page suspend l'horloge du son — c'est voulu : un arbre qui
 * chante dans un onglet qu'on a quitté est mal élevé. Le retour, lui, ne
 * l'était pas : « reprendre » était demandé une fois, sans vérifier que
 * cela avait pris. Or cela ne prend pas toujours — une page revenue
 * d'arrière-plan n'a pas toujours le droit de redémarrer son audio sans un
 * geste, et le navigateur ne dit rien, il laisse l'horloge arrêtée. On
 * revenait alors sur un arbre muet, que le bouton du son ne rallumait pas
 * puisqu'il ne fait que baisser un volume.
 *
 * On éprouve donc les deux retours : celui qu'on accorde, et celui qu'on
 * refuse en silence.
 */
titre('Le son revient quand on revient');
{
  const ctx = await nav.newContext({ viewport: { width: 900, height: 760 }, locale: 'fr-FR' });
  const p = await ctx.newPage();
  const bruit = [];
  p.on('pageerror', (e) => bruit.push('' + e));
  p.on('console', (m) => { if (m.type() === 'error') bruit.push(m.text()); });
  /* De quoi refuser la reprise, comme le fait un téléphone au retour
     d'arrière-plan : la page croit demander, et rien ne repart. */
  await p.addInitScript(() => {
    const P = window.AudioContext.prototype, vrai = P.resume;
    P.resume = function () { return window.__refuse ? Promise.resolve() : vrai.apply(this, arguments); };
  });
  /* On simule le départ et le retour : une page d'épreuve n'est jamais
     vraiment cachée, le navigateur sans écran les tient toutes pour
     visibles. */
  const visibilite = (cache) => p.evaluate((h) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (h ? 'hidden' : 'visible') });
    document.dispatchEvent(new Event('visibilitychange'));
  }, cache);
  const etat = () => p.evaluate(() => window.__essai.audio());

  await p.goto(`http://127.0.0.1:${PORT}/?heure=13`, { waitUntil: 'load' });
  await p.waitForTimeout(1400);
  await p.evaluate(() => document.getElementById('enter').click());
  await p.waitForFunction(() => window.__essai && window.__essai.voeux() > 0, null, { timeout: 60000 });
  await p.waitForTimeout(2200);
  check('à l’arrivée, le son tourne', (await etat()).etat, 'running');

  await visibilite(true);
  await p.waitForTimeout(800);
  check('on quitte la page, l’horloge s’arrête', (await etat()).etat, 'suspended');

  await visibilite(false);
  const revenu = await p.waitForFunction(() => window.__essai.audio().etat === 'running', null, { timeout: 20000 })
    .then(() => true).catch(() => false);
  check('on revient, elle repart', revenu);
  const a = await etat();
  await p.waitForTimeout(2500);
  const b = await etat();
  check(`et la mélodie continue d’avancer (${a.horloge} → ${b.horloge})`, b.horloge > a.horloge);
  check('les notes restent programmées en avance', b.avance > 0);

  /* Le retour qu'on refuse en silence. */
  await p.evaluate(() => { window.__refuse = true; });
  await visibilite(true);
  await p.waitForTimeout(800);
  await visibilite(false);
  await p.waitForTimeout(900);
  check('une reprise refusée laisse bien l’horloge arrêtée', (await etat()).etat, 'suspended');
  const arme = await p.waitForFunction(() => window.__essai.audio().arme, null, { timeout: 20000 })
    .then(() => true).catch(() => false);
  check('mais le secours s’arme', arme);
  /* Et le premier geste du visiteur la rallume — un seul suffit. */
  await p.evaluate(() => { window.__refuse = false; });
  await p.evaluate(() => document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  const rallume = await p.waitForFunction(() => window.__essai.audio().etat === 'running', null, { timeout: 20000 })
    .then(() => true).catch(() => false);
  check('et le premier geste la rallume', rallume);
  check('le secours se désarme derrière lui', (await etat()).arme, false);
  check(`aucune erreur (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}

titre('Le ciel a ses habitants, chacun à son heure');
{
  const { ctx, p, bruit } = await ouvrir(13);
  check('une volute passe quand on l’appelle', await p.evaluate(() => window.__essai.volutes()));
  const o = await p.evaluate(() => window.__essai.ciel2());
  /* Assez haut pour passer derrière l'île, pas si haut qu'elle sorte du
     cadre : le ciel qu'on voit à l'écran n'est qu'une bande étroite
     au-dessus de l'horizontale de l'œil. */
  check(`elle passe au-dessus de l’île (${o.y} unités)`, o.y > 3 && o.y < 10);
  /* Et surtout : dans le cadre. Lâchées à un angle tiré au sort et posées
     trop haut, volutes comme étoiles filantes traversaient hors champ —
     un courant d'air que personne ne voit n'en est pas un. */
  const n = await p.evaluate(() => window.__essai.ois());
  check(`et dans le cadre, pas au-dessus (hauteur à l’écran ${n.ndc[1]})`, n.ndc[1] < 1);
  await p.evaluate(() => window.__essai.filante());
  await p.waitForTimeout(400);
  const f = await p.evaluate(() => window.__essai.ciel2());
  check(`une étoile filante en plein jour ne se voit pas (${f.opacite})`, f.opacite, 0);
  check(`aucune erreur (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}
{
  const { ctx, p, bruit } = await ouvrir(22);
  await p.evaluate(() => window.__essai.filante());
  /* Elle s'allume en filant : au début de sa course elle est presque
     transparente, et le rendu logiciel ne donne qu'une image par seconde.
     On attend donc son plein éclat plutôt qu'un délai. */
  const brille = await p.waitForFunction(() => window.__essai.ciel2().opacite > 0.5, null, { timeout: 60000 })
    .then(() => true).catch(() => false);
  const f = await p.evaluate(() => window.__essai.ciel2());
  check(`la nuit, elle brille (${f.opacite})`, brille);
  const n = await p.evaluate(() => window.__essai.fil());
  check(`et elle file dans le cadre (${n.ndc[0]} / ${n.ndc[1]})`, n.ndc[1] < 1 && Math.abs(n.ndc[0]) < 1.4);
  check(`aucune erreur (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * Rien ne se sélectionne
 * ------------------------------------------------------------------ *
 * Sur un téléphone, un appui un peu long sur un titre ou un bouton ouvrait
 * une sélection bleue avec ses poignées, et la loupe du système par-dessus
 * la scène. On vient tourner un arbre, pas copier un mot. Mais la sélection
 * doit rester là où elle sert : les champs de saisie, le lien qu'on copie,
 * et l'image de la carte, qu'un appui long doit pouvoir enregistrer.
 */
titre('Rien ne se sélectionne, sauf ce qui est fait pour');
{
  const { ctx, p, bruit } = await ouvrir(11);
  const sel = await p.evaluate(() => {
    const q = (s) => { const el = document.querySelector(s); const c = el && getComputedStyle(el);
      return c ? (c.webkitUserSelect || c.userSelect) : 'absent'; };
    return { conseil: q('#hint'), bouton: q('#add'), langue: q('#langs button'), titre: q('#cZh'),
      lien: q('#link'), champ: q('#own'), image: q('#cimg') };
  });
  for (const [quoi, cle] of [['le conseil du bas', 'conseil'], ['les boutons', 'bouton'],
    ['le choix de la langue', 'langue'], ['le vœu affiché', 'titre']]) {
    check(`${quoi} ne se sélectionne pas (${sel[cle]})`, sel[cle], 'none');
  }
  check(`le lien se sélectionne, lui (${sel.lien})`, sel.lien, 'text');
  check(`le champ du vœu aussi (${sel.champ})`, sel.champ, 'text');
  /* Enregistrer la carte par un appui long est le seul moyen sur iOS quand
     le téléchargement est refusé : cette image garde son menu. */
  check(`et l’image de la carte reste enregistrable (${sel.image})`, sel.image !== 'none');
  check(`aucune erreur (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * Toucher un vœu
 * ------------------------------------------------------------------ *
 * Toucher une étiquette s'en approche, et rien de plus : le mot est écrit
 * dessus, le redire dans un panneau par-dessus la scène n'ajoute rien et
 * cache l'arbre. La fiche est réservée au vœu qu'on vient d'accrocher et à
 * celui qu'on vous a envoyé — eux ont quelque chose à dire de plus.
 *
 * Et puisqu'on s'approche, il faut arriver sur le mot : on vérifie qu'il
 * est bien dans l'écran, et non derrière l'épaule.
 */
titre('Toucher un vœu s’en approche, sans fiche par-dessus');
{
  const { ctx, p, bruit } = await ouvrir(13);
  const n = await p.evaluate(() => window.__essai.voeux());
  check(`l’arbre porte ses vœux (${n})`, n > 10);

  /* Comme à la touche : on garde l'angle d'où l'on regarde. */
  await p.evaluate(() => { window.__essai.viser(3, false, true); window.__essai.poser(); });
  await p.waitForTimeout(600);
  check('aucune fiche ne s’ouvre', await p.evaluate(() => window.__essai.fiche()), false);
  const v = await p.evaluate(() => window.__essai.cible(3));
  check(`le vœu est dans l’écran (${v.x} / ${v.y})`, Math.abs(v.x) < 0.5 && Math.abs(v.y) < 0.9);
  check(`et l’on s’en est approché (rayon ${v.r})`, v.r < 6);

  /* La visite guidée et le lien reçu, eux, n'ont pas d'angle choisi par
     quelqu'un : ils en cherchent un d'où le mot se voie. On mesure ce que
     coûte cette recherche — elle a lieu au doigt, et un temps mort s'y
     verrait. */
  const a = await p.evaluate(() => [0, 1, 2, 3, 4].map((i) => window.__essai.angle(i)));
  check(`choisir un angle dégagé coûte au plus ${Math.max(...a.map((x) => x.ms))} ms`,
    Math.max(...a.map((x) => x.ms)) < 60);
  check(`et la plupart des vœux se voient de face (${a.filter((x) => x.ecart === 0).length}/5)`,
    a.filter((x) => x.ecart === 0).length >= 3);

  /* La fiche, elle, s'ouvre quand on le demande — et le vœu remonte
     au-dessus d'elle. */
  await p.evaluate(() => { window.__essai.viser(3, true); window.__essai.poser(); });
  await p.waitForTimeout(600);
  check('la fiche s’ouvre pour un vœu qu’on vous envoie', await p.evaluate(() => window.__essai.fiche()));
  const f = await p.evaluate(() => window.__essai.cible(3));
  check(`et le vœu passe au-dessus d’elle (${f.y})`, f.y > 0);
  check(`aucune erreur (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * Un vœu écrit à la main, envoyé pour de bon
 * ------------------------------------------------------------------ *
 * Tout le reste ne vaut rien si ce chemin-là est coupé. On l'emprunte donc
 * en entier, comme un visiteur : écrire le vœu, l'accrocher, l'envoyer par
 * mail et par SMS, télécharger sa carte, et ouvrir le lien reçu dans un
 * autre navigateur pour vérifier que le mot est bien là, accroché et mis
 * en avant.
 *
 * Le QR code de la carte est relu par un encodeur tiers — la bibliothèque
 * « qrcode », qui n'a rien à voir avec le nôtre : si les deux matrices
 * sont identiques, module pour module, c'est que n'importe quel lecteur y
 * trouvera le lien.
 */
titre('Un vœu écrit à la main part vraiment, et arrive');
{
  const { ctx, p, bruit } = await ouvrir(13);
  const MOT = 'Que ta tasse soit pleine et ton hiver doux';
  const QUI = 'Antonin';
  /* On écrit le vœu comme un visiteur : une forme, des mots à soi, un
     prénom, et on l'accroche. */
  await p.click('#add');
  await p.waitForTimeout(400);
  await p.click('#shapes button:nth-child(3)');
  await p.click('#stNext');
  await p.waitForTimeout(200);
  await p.click('#tabs button:nth-child(4)');
  await p.fill('#own', MOT);
  await p.click('#stNext');
  await p.waitForTimeout(200);
  await p.fill('#name', QUI);
  await p.click('#hang');
  /* D'abord l'or : soixante-dix grains partent du vœu, et la caméra y va.
     Le cartouche noir qui surgissait par-dessus la scène montrait le
     panneau, pas l'étiquette. */
  const or = await p.waitForFunction(() => window.__essai.etincelles().vues, null, { timeout: 30000 })
    .then(() => true).catch(() => false);
  const et = await p.evaluate(() => window.__essai.etincelles());
  check(`l’or éclate autour du vœu (${et.grains} grains)`, or);
  check('et aucune fiche ne surgit avec elle', et.ficheAlors, false);
  check('la caméra s’en approche', (await p.evaluate(() => window.__essai.visiteEtat())).vise);
  /* La fiche vient ensuite, quand on a vu. */
  const accroche = await p.waitForFunction(() => document.getElementById('card').classList.contains('open'),
    null, { timeout: 60000 }).then(() => true).catch(() => false);
  check('puis la fiche s’ouvre', accroche);
  const delai = await p.evaluate(() => window.__essai.etincelles().apres);
  check(`elle attend qu’on ait vu (${delai} ms après la gerbe)`, delai > 2000);
  check('elle annonce le vœu avant de le dire',
    ((await p.locator('#cBy').textContent()) || '').trim(), 'Votre vœu');
  check('et « votre vœu » est bien au-dessus du mot',
    await p.evaluate(() => { const c = document.getElementById('card');
      return c.firstElementChild.id === 'cBy'; }));
  check('et l’arbre n’a pas perdu les autres', (await p.evaluate(() => window.__essai.voeux())) > 25);

  /* Envoyer : le lien, le mail et le SMS. */
  await p.click('#cShare');
  await p.waitForFunction(() => document.getElementById('modal').classList.contains('open'), null, { timeout: 30000 });
  const lien = await p.inputValue('#link');
  check(`le lien porte le vœu (${lien.length} signes)`, lien.indexOf('?v=') > 0);
  const mail = decodeURIComponent(await p.getAttribute('#byMail', 'href') || '');
  const sms = decodeURIComponent(await p.getAttribute('#bySms', 'href') || '');
  check('le mail s’ouvre sur un brouillon', mail.startsWith('mailto:?subject='));
  check('il porte le vœu et le lien', mail.includes(MOT) && mail.includes(QUI) && mail.includes(lien));
  check('le SMS aussi', sms.startsWith('sms:') && sms.includes(MOT) && sms.includes(lien));

  /* La carte, et son QR code, relu par un tiers. */
  await p.click('#mClose');
  await p.click('#cCard');
  const carte = await p.waitForFunction(() => document.getElementById('cmodal').classList.contains('open'),
    null, { timeout: 60000 }).then(() => true).catch(() => false);
  check('la carte se dessine', carte);
  const img = await p.getAttribute('#cimg', 'src');
  check(`l’image est là (${Math.round((img || '').length / 1024)} Ko)`, (img || '').startsWith('data:image/jpeg') && img.length > 40000);
  const ca2 = await p.evaluate(() => window.__essai.carte());
  check(`et c’est bien la scène qu’elle montre (écart ${ca2.ecart})`, ca2.ecart > 60);
  /* Le QR code porte le vœu lui-même. Un vœu de décor, lui, n'est à
     personne : le sien retombe sur l'arbre, et c'est voulu. */
  check('son QR code porte le vœu, non l’arbre nu', ca2.qr);
  const nous = await p.evaluate((u) => window.__qr(u), lien);
  /* Même version et même niveau de correction que le nôtre, sinon la
     bibliothèque en choisit une autre et les matrices ne se comparent
     plus : notre codeur passe en L au-delà de la version 6, là où elle
     serait restée plus bas. */
  const version = (nous.length - 17) / 4;
  const eux = QRCode.create(lien, { errorCorrectionLevel: version <= 6 ? 'M' : 'L', version });
  const taille = eux.modules.size, dd = eux.modules.data;
  let memes = nous.length === taille;
  if (memes) {
    for (let y = 0; y < taille && memes; y++) {
      for (let x = 0; x < taille; x++) {
        if (nous[y][x] !== (dd[y * taille + x] ? 1 : 0)) { memes = false; break; }
      }
    }
  }
  check(`le QR code est celui qu’un lecteur attend (version ${version}, ${nous.length} modules)`, memes);

  /* Et le lien, ouvert ailleurs, mène au vœu : accroché, visé, et sa fiche
     ouverte. */
  const ctx2 = await nav.newContext({ viewport: { width: 1000, height: 800 }, locale: 'fr-FR' });
  const p2 = await ctx2.newPage();
  const bruit2 = [];
  p2.on('pageerror', (e) => bruit2.push('' + e));
  await p2.goto(lien.replace('https://yunma.fr/wishes', `http://127.0.0.1:${PORT}/`).replace('https://yunma.fr', `http://127.0.0.1:${PORT}`), { waitUntil: 'load' });
  await p2.waitForTimeout(1200);
  await p2.evaluate(() => document.getElementById('enter').click());
  await p2.waitForFunction(() => window.__essai && window.__essai.voeux() > 0, null, { timeout: 60000 });
  const vu = await p2.waitForFunction(() => document.getElementById('recuDe').classList.contains('on'),
    null, { timeout: 60000 }).then(() => true).catch(() => false);
  check('à l’arrivée, le vœu est là et une ligne dit qui l’envoie', vu);
  check('elle nomme l’expéditeur', ((await p2.locator('#recuDe').textContent()) || '').includes(QUI));
  const arr = await p2.evaluate(() => window.__essai.visiteEtat());
  check(`et la caméra est allée dessus, de tout près (rayon ${arr.r})`, arr.vise && arr.r < 3.8);
  check('c’est le bon mot sur l’étiquette',
    await p2.evaluate((m) => window.__essai.recu() && window.__essai.recu().t === m, MOT));
  check(`aucune erreur à l’arrivée (${bruit2.length})`, bruit2.length, 0);
  await ctx2.close();
  check(`aucune erreur (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * Accrocher un vœu ne vide pas l'arbre
 * ------------------------------------------------------------------ *
 * Les vingt-huit vœux tout faits ne servaient que d'arbre d'attente :
 * dès qu'un vrai vœu arrivait, ils disparaissaient tous. On écrivait son
 * mot, et l'arbre se vidait d'un coup — seul au monde sur un caféier nu.
 * Ils restent maintenant, et le compteur, lui, ne compte que les vrais.
 */
/* ------------------------------------------------------------------ *
 * Suivre Yunma
 * ------------------------------------------------------------------ *
 * Au bas de la fiche, une ligne et une porte : le compte Instagram. On ne
 * demande rien qu'il faille garder — ni adresse, ni champ, ni relais sur le
 * serveur. On demande une fois, au seul moment de la visite où l'on peut
 * demander quelque chose : celui qui vient d'accrocher son vœu a donné.
 */
titre('Suivre Yunma');
{
  const INSTA = 'https://www.instagram.com/yunma.coffee';
  const { ctx, p, bruit } = await ouvrir(13);
  const fiche = async (i) => { await p.evaluate((n) => window.__essai.viser(n, true), i);
    await p.waitForFunction(() => document.getElementById('card').classList.contains('open'),
      null, { timeout: 60000 }); await p.waitForTimeout(300); };
  const etat = () => p.evaluate(() => window.__essai.abo());

  await fiche(2);
  let a = await etat();
  check('la ligne paraît au bas de la fiche', a.vue);
  check('elle annonce janvier 2027 et le Yunnan', /Janvier 2027/.test(a.texte) && /Yunnan/.test(a.texte));
  check('elle offre le compte, et rien d’autre', a.choix);
  check('le compte Instagram est le bon', a.insta, INSTA);
  /* Plus rien ne réclame d'adresse nulle part : ni champ, ni bouton. */
  check('aucun champ ne demande d’adresse',
    await p.evaluate(() => document.querySelectorAll('#card input, input[type=email]').length), 0);

  await p.evaluate(() => window.__essai.aboInsta());
  await p.waitForTimeout(200);
  a = await etat();
  check('suivre clôt la demande', a.etat, 'insta');
  check('et la remercie sans rien lui demander', /Instagram/.test(a.note) && !a.choix);

  await p.click('#cBack');
  await p.waitForTimeout(400);
  await fiche(3);
  check('une fois répondu, on ne redemande plus', (await etat()).vue, false);
  check(`aucune erreur (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * La story
 * ------------------------------------------------------------------ *
 * Sur Instagram, un lien ne se clique pas : ce qui s'y partage est une
 * image ou un film. La page en fabrique donc un, au format vertical, et le
 * remet au système. Deux chemins, selon ce que la machine sait encoder : le
 * film en MP4 — le seul format qu'Instagram accepte — ou, à défaut, une
 * image fixe, qui passe partout.
 *
 * Ce qu'on vérifie ici est ce qui partirait vraiment : le fichier, son
 * format, sa taille, son nom. Ce qu'on ne peut pas vérifier d'ici, c'est
 * qu'Instagram l'accepte — cela se voit sur un téléphone, pas dans un
 * navigateur sans écran.
 */
titre('La story se fabrique dans la page');
{
  const MOT = 'Que ton année sente bon le café';
  const { ctx, p, bruit } = await ouvrir(13);
  await p.evaluate(() => window.__essai.storyDuree(4));
  await p.click('#add');
  await p.waitForTimeout(400);
  await p.click('#shapes button:nth-child(3)');
  await p.click('#stNext');
  await p.waitForTimeout(200);
  await p.click('#tabs button:nth-child(4)');
  await p.fill('#own', MOT);
  await p.click('#stNext');
  await p.waitForTimeout(200);
  await p.fill('#name', 'Antonin');
  await p.click('#hang');
  await p.waitForFunction(() => document.getElementById('card').classList.contains('open'),
    null, { timeout: 90000 });
  await p.waitForTimeout(400);
  const avant = await p.evaluate(() => window.__essai.story().toile);

  await p.click('#cShare');
  await p.waitForFunction(() => document.getElementById('modal').classList.contains('open'), null, { timeout: 30000 });
  check('un vœu accroché se propose en story', (await p.evaluate(() => window.__essai.story().offre)) !== 'none');

  await p.click('#byStory');
  await p.waitForTimeout(900);
  const pendant = await p.evaluate(() => window.__essai.story());
  check('le tournage commence au format d’une story', pendant.w === 720 && pendant.h === 1280);
  check('et la scène est rendue à ce format', pendant.toile[0] === 720 && pendant.toile[1] === 1280);
  check('on le dit pendant qu’il dure', /fabrique/.test(pendant.note));

  const pret = await p.waitForFunction(() => window.__essai.story().fichier, null, { timeout: 120000 })
    .then(() => true).catch(() => false);
  check('le fichier est fabriqué', pret);
  const f = (await p.evaluate(() => window.__essai.story())).fichier || {};
  check(`c’est un film MP4 (${f.ko} Ko)`, f.type === 'video/mp4' && f.ko > 0);
  check('il porte un nom qu’on retrouvera', f.nom, 'voeu-yunma.mp4');
  const apres = await p.evaluate(() => window.__essai.story());
  /* Le film s'ouvrait sur du noir : l'enregistreur partait avant que la
     première image ne soit composée, et filmait une toile encore vide. Or
     c'est cette première image que les réseaux prennent pour vignette — on
     ne savait pas ce qu'on regardait. */
  check(`le film ne s’ouvre pas sur du noir (clarté ${apres.lum})`, apres.lum > 40);
  /* Ni sur un rectangle uni : l'enregistreur créé trop tôt retenait l'image
     d'avant — une toile vide. Une vraie image de l'arbre a du feuillage
     sombre et du ciel clair. */
  check(`ni sur un fond uni (écart ${apres.ecart})`, apres.ecart > 60);
  check('un bouton propose d’en faire quelque chose', apres.actions && !!apres.bouton);
  /* Là où la feuille de partage du système ne prend pas de fichier, on
     enregistre et l'on dit quoi en faire. On ne fait pas semblant. */
  check('faute de feuille de partage, il propose d’enregistrer', apres.mode, 'garder');
  check('la scène est rendue à l’écran', apres.toile[0], avant[0]);

  /* Sans encodeur H.264, le film n'a pas de sens : Instagram ne prend pas le
     WebM. On fabrique alors une image, plus grande, qui passe partout. */
  await p.click('#sClose');
  await p.waitForTimeout(400);
  await p.evaluate(() => { window.__essai.storySansFilm(true); window.__essai.storyDuree(4); });
  await p.click('#cShare');
  await p.waitForFunction(() => document.getElementById('modal').classList.contains('open'), null, { timeout: 30000 });
  await p.click('#byStory');
  const pret2 = await p.waitForFunction(() => window.__essai.story().fichier, null, { timeout: 120000 })
    .then(() => true).catch(() => false);
  check('sans encodeur, une image est fabriquée', pret2);
  const g = (await p.evaluate(() => window.__essai.story()));
  check(`c’est une image (${(g.fichier || {}).ko} Ko)`, (g.fichier || {}).type, 'image/jpeg');
  check('au format d’une story, en pleine taille', g.w === 1080 && g.h === 1920);
  check('et elle porte son nom', (g.fichier || {}).nom, 'voeu-yunma.jpg');

  await p.click('#sClose');
  await p.waitForTimeout(500);
  const fin = await p.evaluate(() => window.__essai.story());
  check('en fermant, la scène retrouve l’écran', fin.toile[0], avant[0]);
  check('et la story ne tourne plus', fin.on, false);
  check(`aucune erreur (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}

/* L'arbre nu, lui, n'a pas de mot à filmer. */
{
  const { ctx, p } = await ouvrir(13);
  await p.click('#share');
  await p.waitForFunction(() => document.getElementById('modal').classList.contains('open'), null, { timeout: 30000 });
  check('le partage de l’arbre nu ne propose pas de story',
    await p.evaluate(() => window.__essai.story().offre), 'none');
  await ctx.close();
}

titre('Accrocher un vœu ne vide pas l’arbre');
{
  const ctx = await nav.newContext({ viewport: { width: 1000, height: 800 }, locale: 'fr-FR' });
  const p = await ctx.newPage();
  const bruit = [];
  p.on('pageerror', (e) => bruit.push('' + e));
  /* Un vœu déjà accroché sur cet appareil, comme après une visite. */
  await p.addInitScript(() => {
    try {
      localStorage.setItem('yw_local', JSON.stringify([{ id: 'essai1', s: 'plaque', t: 'Un vœu à moi', n: 'Antonin', ts: Date.now(), local: true }]));
      localStorage.setItem('yw_mine', JSON.stringify(['essai1']));
    } catch (e) { /* vide */ }
  });
  await p.goto(`http://127.0.0.1:${PORT}/?heure=13`, { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  await p.evaluate(() => document.getElementById('enter').click());
  await p.waitForFunction(() => window.__essai && window.__essai.voeux() > 0, null, { timeout: 60000 });
  await p.waitForTimeout(1000);
  const n = await p.evaluate(() => window.__essai.voeux());
  check(`l’arbre reste plein (${n} étiquettes)`, n > 25);
  check('et plus aucun compteur ne l’annonce',
    await p.evaluate(() => !document.getElementById('count')));
  check(`aucune erreur (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * Envoyer le vœu qu'on regarde
 * ------------------------------------------------------------------ *
 * S'approcher d'un vœu donne envie de l'envoyer, et il n'y a rien d'autre
 * à proposer là. Une pilule discrète au-dessus de l'appel, et non une
 * fiche par-dessus la scène.
 */
titre('Le vœu qu’on regarde porte son bouton d’envoi');
{
  const { ctx, p, bruit } = await ouvrir(13);
  const vu = () => p.evaluate(() => document.getElementById('voeuShare').classList.contains('on'));
  await p.evaluate(() => { window.__essai.viser(3, false, true); });
  await p.waitForTimeout(300);
  check('en s’approchant, la pilule paraît', await vu());
  const mot = await p.evaluate(() => document.getElementById('voeuShareT').textContent);
  check(`elle dit ce qu’elle fait (« ${mot} »)`, /envoyer/i.test(mot));
  await p.evaluate(() => window.__essai.maison());
  await p.waitForTimeout(300);
  check('en reculant, elle s’efface', await vu(), false);
  /* Et elle se tait sur le vœu de Yunma, qui n'a pas de lien à lui : elle
     n'aurait proposé que de partager l'arbre, ce que l'icône à côté de
     l'appel fait déjà. */
  await p.evaluate(() => { window.__essai.viser(window.__essai.yunma().place, false, true); });
  await p.waitForTimeout(300);
  check('sur le vœu de Yunma, elle se tait', await vu(), false);
  /* Pendant la visite guidée, elle se tait : la caméra y passe de mot en
     mot, et un bouton qui clignote à chaque plan transforme la veilleuse
     en vitrine. */
  await p.evaluate(() => { window.__essai.visite(true); window.__essai.viser(3, false, true); });
  await p.waitForTimeout(300);
  check('pendant la visite guidée, elle se tait', await vu(), false);
  check(`aucune erreur (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * Le logo se lit sur ce qu'il y a derrière lui
 * ------------------------------------------------------------------ *
 * C'est un dessin noir sur fond transparent. Le thème l'inversait avec la
 * nuit ; mais il disparaît aussi en plein jour dès qu'on s'approche de
 * l'arbre, où ce sont des feuilles sombres qui passent derrière lui. On
 * mesure donc, deux fois par seconde, huit pixels sur huit à l'endroit même
 * du logo, dans l'image qu'on vient de dessiner.
 */
titre('Le logo s’éclaircit sur un fond sombre');
{
  const { ctx, p, bruit } = await ouvrir(13);
  await p.evaluate(() => { window.__essai.maison(); window.__essai.poser(); });
  await p.waitForTimeout(1500);
  const loin = await p.evaluate(() => window.__essai.logo());
  check(`de loin, le ciel est clair derrière lui (${loin.lum})`, loin.lum > 0.7);
  check(`il reste noir (inversion ${loin.inv})`, loin.inv < 0.1);
  /* Dans la ramure, en plein jour : le fond devient sombre, le logo doit
     s'éclaircir. On maintient la vue, car la visite guidée reprend la main
     dès qu'on ne touche plus à rien. */
  const clair = await p.waitForFunction(() => {
    window.__essai.vue({ tx: 0, ty: 3.2, tz: 0, r: 1.5, ph: 1.5, th: 0.3 });
    window.__essai.inactif(0);
    return window.__essai.logo().inv > 0.8;
  }, null, { timeout: 120000, polling: 500 }).then(() => true).catch(() => false);
  const pres = await p.evaluate(() => window.__essai.logo());
  check(`dans la ramure, le fond s’assombrit (${pres.lum})`, pres.lum < 0.3);
  check(`et le logo passe au blanc (inversion ${pres.inv})`, clair);
  check(`aucune erreur (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}
/* De nuit, c'est le thème qui le fait, et il ne redescend jamais sous lui. */
{
  const { ctx, p } = await ouvrir(22);
  await p.waitForFunction(() => window.__essai.ciel().theme > 0.98, null, { timeout: 30000 }).catch(() => {});
  await p.waitForTimeout(600);
  const nuit = await p.evaluate(() => window.__essai.logo());
  check(`la nuit, il est blanc quoi qu’il arrive (${nuit.css})`, +nuit.css > 0.95);
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * Le haut de l'écran
 * ------------------------------------------------------------------ *
 * Il portait cinq pilules, et le logo s'écrasait entre elles ; puis deux,
 * dont un menu. Le menu n'a plus rien à porter — la visite guidée se lance
 * seule, la musique part seule, les guirlandes n'existent plus —, et il ne
 * reste que le son et la langue, directement accessible.
 */
titre('Le haut de l’écran ne porte que le son et la langue');
{
  const { ctx, p, bruit } = await ouvrir(13, { width: 390, height: 844 });
  const haut = await p.evaluate(() => document.querySelectorAll('#tools > *').length);
  check(`deux pilules en haut (${haut})`, haut, 2);
  check('plus de menu', await p.evaluate(() => !document.getElementById('menu') && !document.getElementById('menuBtn')));
  const logo = await p.evaluate(() => { const i = document.querySelector('#sign img');
    return { l: Math.round(i.getBoundingClientRect().width), h: Math.round(i.getBoundingClientRect().height),
      nl: i.naturalWidth, nh: i.naturalHeight }; });
  /* Un logo déformé est un logo dont les proportions ne sont plus les
     siennes : c'est cela qu'on mesure, et non sa taille. */
  const ecart = Math.abs((logo.l / logo.h) / (logo.nl / logo.nh) - 1);
  check(`le logo garde ses proportions (${(ecart * 100).toFixed(1)} % d’écart)`, ecart < 0.02);

  /* Les trois langues sont là, et celle du visiteur est marquée. */
  check(`les trois langues sont accessibles (${await p.evaluate(() => window.__essai.langues())})`,
    await p.evaluate(() => window.__essai.langues()), 'fr*,en,zh');
  await p.click('#langs button[data-l="en"]');
  await p.waitForTimeout(300);
  check('on en change d’un geste', await p.evaluate(() => window.__essai.langues()), 'fr,en*,zh');
  check('et l’appel suit', ((await p.locator('#add').textContent()) || '').trim(), 'Hang a wish');
  check(`aucune erreur (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * Le conseil du bas
 * ------------------------------------------------------------------ *
 * Il s'effaçait au bout de neuf secondes, juste au moment où l'on
 * commençait à vouloir toucher quelque chose — et plus rien ne disait
 * comment. Il reste maintenant pendant toute l'expérience.
 */
titre('Le conseil du bas reste');
{
  const { ctx, p, bruit } = await ouvrir(13);
  const lire = () => p.evaluate(() => { const h = document.getElementById('hint');
    return { texte: h.textContent.trim(), op: +getComputedStyle(h).opacity }; });
  const a = await lire();
  check(`il dit comment faire (« ${a.texte} »)`, a.texte.length > 20 && a.op > 0.9);
  await p.waitForTimeout(11000);
  const b = await lire();
  check(`et il est toujours là onze secondes plus tard (${b.op})`, b.op > 0.9);
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
