/**
 * L'atlas des variétés : se tient-il seul, et porte-t-il la charte ?
 *
 *   npm run test:arabica
 *
 * L'atlas vient d'ailleurs — il a été écrit à part, avec ses propres noms de
 * couleurs et sa propre police. On l'a raccordé au site ; ce raccord est
 * exactement ce qui se défait sans bruit. Une teinte qui repart de son côté,
 * une pilule qui revient, un script posé depuis un CDN : rien de tout cela ne
 * lève d'erreur, et personne ne le voit avant la mise en ligne.
 *
 * On vérifie donc, dans cet ordre :
 *
 *   1. le dossier est clos — une page, un favicon, une règle de cache ;
 *   2. le site l'ignore : aucun lien, aucune entrée au plan du site ;
 *   3. la page s'ouvre sans une erreur de console, en paysage et en portrait ;
 *   4. les teintes rendues sont celles de la charte, mesurées à l'écran ;
 *   5. les boutons sont droits, en capitales filetées, comme partout ;
 *   6. les trois langues et les liens profonds répondent ;
 *   7. rien ne se recouvre sur un téléphone — c'est là que l'atlas péchait.
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ATLAS = join(RACINE, 'public', 'arabica');
const PORT = 4411;

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
const deposes = readdirSync(ATLAS).sort();
check(`trois fichiers, pas un de plus (${deposes.join(', ')})`,
  deposes.join(','), '.htaccess,favicon-96.png,index.html');

const page = readFileSync(join(ATLAS, 'index.html'), 'utf8');
check('aucune empreinte dans un nom de fichier — le dossier se corrige à la main',
  deposes.every((f) => !/\.[A-Za-z0-9_-]{8,}\./.test(f)));
check('la règle de cache interdit de garder une version corrigée',
  readFileSync(join(ATLAS, '.htaccess'), 'utf8').includes('must-revalidate'));
/* Hors la feuille de la police, tout doit être dans le fichier : c'est ce qui
   permet de l'ouvrir hors ligne, et de le déposer sans rien d'autre. */
const dehors = [...page.matchAll(/<(?:script|link|img)\b[^>]*\b(?:src|href)="(https?:\/\/[^"]+)"/g)]
  .map((m) => m[1]).filter((u) => !/^https:\/\/fonts\.(googleapis|gstatic)\.com(\/|$)/.test(u));
check(`rien n'est chargé du dehors, hors la police (${dehors.length})`, dehors.length, 0);
/* L'atlas se partage par un lien, il ne s'indexe pas — comme le jeu et la
   carte. Sans cette balise, le contrôle de référencement du site réclame à
   la page une canonique, des renvois de langue et une entrée au plan. */
check('la page se tient à l’écart des moteurs',
  /<meta name="robots" content="noindex, nofollow">/.test(page));

/* ------------------------------------------------------------------ *
 * 2. Le site ignore l'atlas
 * ------------------------------------------------------------------ */
titre('Le site n’y mène pas');
const DIST = join(RACINE, 'dist');
if (existsSync(DIST)) {
  const pages = [];
  (function parcourir(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) { if (e.name !== 'arabica') parcourir(join(d, e.name)); }
      else if (e.name.endsWith('.html')) pages.push(join(d, e.name));
    }
  })(DIST);
  const liens = pages.filter((p) => /href="(?:\/|https:\/\/yunma\.fr\/)arabica\//.test(readFileSync(p, 'utf8')));
  check(`aucune des ${pages.length} pages du site ne renvoie vers l’atlas`, liens.length, 0);
  const plan = join(DIST, 'sitemap-0.xml');
  check('le plan du site ne le cite pas',
    existsSync(plan) ? readFileSync(plan, 'utf8').includes('/arabica') : false, false);
} else {
  console.log('  (dist/ absent : la construction du site n’a pas été lancée, on passe)');
}

/* ------------------------------------------------------------------ *
 * Le serveur et le navigateur
 * ------------------------------------------------------------------ */
const TYPES = { '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml' };
const serveur = createServer((q, r) => {
  const c = decodeURIComponent(new URL(q.url, 'http://x').pathname);
  for (const f of [join(ATLAS, c), join(ATLAS, c, 'index.html')]) {
    if (existsSync(f) && statSync(f).isFile()) {
      r.writeHead(200, { 'Content-Type': TYPES[extname(f)] ?? 'application/octet-stream' });
      return r.end(readFileSync(f));
    }
  }
  r.writeHead(404).end('');
});
await new Promise((r) => serveur.listen(PORT, '127.0.0.1', r));

const nav = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

/** Une page ouverte, et la liste de ce que la console a eu à dire. */
async function ouvrir(vue, hash = '') {
  const ctx = await nav.newContext({
    viewport: { width: vue.width, height: vue.height },
    deviceScaleFactor: 1, locale: vue.locale ?? 'fr-FR',
    isMobile: !!vue.mobile, hasTouch: !!vue.mobile,
  });
  const p = await ctx.newPage();
  const bruit = [];
  p.on('pageerror', (e) => bruit.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') bruit.push(m.text()); });
  /* L'heure est figée en plein jour : c'est là que la palette doit être
     exactement celle du site. Sans cela, un contrôle de teinte lancé à
     trois heures du matin mesurerait la palette de nuit. */
  await p.goto(`http://127.0.0.1:${PORT}/?heure=13${hash}`, { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  return { ctx, p, bruit };
}

const VUES = [
  { nom: 'paysage', width: 1440, height: 900 },
  { nom: 'portrait', width: 390, height: 844, mobile: true },
];

/* La charte, telle qu'elle est rendue — pas telle qu'elle est écrite. */
const CHARTE = { papier: 'rgb(239, 235, 226)', encre: 'rgb(33, 33, 33)', accent: 'rgb(185, 95, 44)' };

for (const vue of VUES) {
  titre(`L’atlas s’ouvre, en ${vue.nom}`);
  const { ctx, p, bruit } = await ouvrir(vue);
  check(`aucune erreur de console (${bruit.length})`, bruit.length, 0);
  check('le relief est dessiné', await p.locator('#gl').isVisible());
  check('l’arbre est dessiné', await p.locator('#c').isVisible());

  titre(`La charte, mesurée à l’écran, en ${vue.nom}`);
  const styles = await p.evaluate(() => {
    const r = getComputedStyle(document.documentElement);
    const b = document.querySelector('.menubtn');
    const s = getComputedStyle(b);
    return {
      /* Le jour et la nuit ne changent que trois triplets ; c'est eux
         qu'on compare, et à l'heure de plein jour. */
      papier: r.getPropertyValue('--fond').trim(),
      encre: r.getPropertyValue('--encre').trim(),
      accent: r.getPropertyValue('--verm').trim(),
      police: r.getPropertyValue('--font').trim(),
      rayon: s.borderTopLeftRadius,
      casse: s.textTransform,
      filet: s.letterSpacing,
    };
  });
  const hex = (v) => v.toLowerCase();
  check(`le papier est celui du site (${styles.papier})`, styles.papier.replace(/\s/g, ''), '239,235,226');
  check(`l’encre est celle du site (${styles.encre})`, styles.encre.replace(/\s/g, ''), '33,33,33');
  check(`l’accent est celui de la marque (${styles.accent})`, hex(styles.accent), '#b95f2c');
  check('la pile de polices commence par Inter', styles.police.startsWith('"Inter"'));

  titre(`Les boutons, en ${vue.nom}`);
  check(`droits, rayon de 2 px (${styles.rayon})`, styles.rayon, '2px');
  check(`en capitales (${styles.casse})`, styles.casse, 'uppercase');
  check(`filetés (${styles.filet})`, parseFloat(styles.filet) > 1);
  /* Une pilule qui revient ne lève aucune erreur : on compte celles qui
     restent. Seul l'interrupteur du son en garde une, et c'est normal. */
  const pilules = await p.evaluate(() => [...document.querySelectorAll('button')]
    .filter((b) => b.offsetParent && parseFloat(getComputedStyle(b).borderTopLeftRadius) > 8).length);
  check(`aucun bouton en pilule (${pilules})`, pilules, 0);
  /* Un glissement sur la scène sélectionnait le texte de l'interface, et
     l'on se retrouvait avec un voile de sélection par-dessus l'atlas. */
  const selection = await p.evaluate(() => ({
    page: getComputedStyle(document.documentElement).userSelect,
    texte: getComputedStyle(document.querySelector('.pin')).userSelect,
  }));
  check(`rien ne se sélectionne sur la scène (${selection.page})`, selection.page, 'none');
  check(`mais le texte des pages se copie (${selection.texte})`, selection.texte, 'text');

  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * Les langues et les liens profonds
 * ------------------------------------------------------------------ */
titre('Les trois langues');
{
  const { ctx, p } = await ouvrir(VUES[0]);
  for (const [code, attendu] of [['en', 'Menu'], ['zh', '菜单'], ['fr', 'Menu']]) {
    await p.evaluate((c) => { localStorage.setItem('yunma-lang', c); }, code);
    await p.reload({ waitUntil: 'load' });
    await p.waitForTimeout(900);
    const texte = (await p.locator('.menubtn').textContent())?.trim();
    check(`en ${code}, le bouton du menu dit « ${texte} »`, texte, attendu);
  }
  await ctx.close();
}

titre('Les liens profonds');
{
  for (const [hash, marque] of [['#v-gesha', 'Gesha'], ['#yunnan', 'Yunnan'], ['#terroirs', 'Terroirs'], ['#sources', 'Sources']]) {
    const { ctx, p, bruit } = await ouvrir(VUES[0], hash);
    const titreVu = (await p.locator('.pin h1').first().textContent().catch(() => ''))?.trim() ?? '';
    check(`${hash} ouvre « ${titreVu} »`, titreVu.includes(marque));
    check(`${hash} n’émet aucune erreur`, bruit.length, 0);
    await ctx.close();
  }
}

/* ------------------------------------------------------------------ *
 * Rien ne se recouvre — au repos, cartouche ouvert, récit lancé
 * ------------------------------------------------------------------ *
 * Les trois fautes trouvées en vrai étaient toutes de ce genre, et deux
 * d'entre elles ne se voyaient qu'une fois un cartouche ouvert : le dock
 * change de hauteur selon ce qu'il porte, et ce qui flotte au-dessus ne le
 * savait pas. On mesure donc les boîtes dans les trois états.
 */
const PIECES = ['.peek', '.story', '.playbtn', '.yrbox', '.tl', '.hint', '.brand', '.menubtn', '.sndbtn'];
async function boites(p) {
  return p.evaluate((sel) => sel.map((s) => {
    const e = document.querySelector(s); if (!e) return null;
    const r = e.getBoundingClientRect(), v = getComputedStyle(e);
    const vu = v.display !== 'none' && v.visibility !== 'hidden' && parseFloat(v.opacity) > 0.05 && r.width > 0 && r.height > 0;
    return vu ? { s, x: r.x, y: r.y, w: r.width, h: r.height } : null;
  }).filter(Boolean), PIECES);
}
function chevauchements(bs) {
  const out = [];
  for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) {
    const a = bs[i], b = bs[j];
    if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) out.push(`${a.s} / ${b.s}`);
  }
  return out;
}

for (const vue of VUES) {
  titre(`Rien ne se recouvre, en ${vue.nom}`);
  const { ctx, p } = await ouvrir(vue);
  const cas = [
    ['au repos', async () => {}],
    ['un cartouche ouvert', async () => { await p.evaluate(() => select(M['hdt'] ?? Object.values(M)[10])); }],
    ['le récit lancé', async () => { await p.evaluate(() => { deselect(); }); await p.locator('.playbtn').click(); }],
  ];
  for (const [nom, poser] of cas) {
    await poser();
    await p.waitForTimeout(700);
    const croises = chevauchements(await boites(p));
    check(`${nom} — ${croises.length ? croises.join(', ') : 'aucun recouvrement'}`, croises.length, 0);
  }
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * Le jour et la nuit
 * ------------------------------------------------------------------ *
 * Le ciel fait le tour de l'horloge, et l'encre bascule avec lui. Deux
 * choses peuvent se casser sans bruit : la palette de plein jour peut
 * cesser d'être celle du site, et l'interface peut se retrouver en gris
 * sur gris au moment où l'encre s'échange. On mesure donc le contraste à
 * chaque heure de la journée.
 */
titre('Le jour et la nuit');
{
  const ctx = await nav.newContext({ viewport: { width: 1000, height: 700 }, locale: 'fr-FR', timezoneId: 'Europe/Paris' });
  const p = await ctx.newPage();
  const bruit = [];
  p.on('pageerror', (e) => bruit.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') bruit.push(m.text()); });

  /* L'arrivée se fait à l'heure du visiteur, pas à une heure choisie. */
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load' });
  await p.waitForTimeout(900);
  const depart = await p.evaluate(() => ({ atlas: CIEL.heure(), vraie: new Date().getHours() + new Date().getMinutes() / 60 }));
  const ecart = Math.abs(depart.atlas - depart.vraie);
  check(`on arrive à l’heure qu’il est chez soi (${depart.atlas.toFixed(1)} h contre ${depart.vraie.toFixed(1)} h)`, ecart < 0.2 || ecart > 23.8);

  /* Et le temps avance : une journée en deux heures. */
  const avant = await p.evaluate(() => CIEL.heure());
  await p.waitForTimeout(3000);
  const apres = await p.evaluate(() => CIEL.heure());
  const avance = ((apres - avant) + 24) % 24;
  check(`le temps avance (${(avance * 60).toFixed(0)} minutes d’atlas en 3 secondes)`, avance > 0.004 && avance < 0.03);

  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const contraste = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const palette = async (h) => {
    await p.goto(`http://127.0.0.1:${PORT}/?heure=${h}`, { waitUntil: 'load' });
    await p.waitForTimeout(2600);
    return p.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      const t = (n) => cs.getPropertyValue(n).trim().split(',').map(Number);
      return { encre: t('--encre'), pap: t('--pap'), fond: t('--fond'), nuit: SUN.nuit, el: SUN.el };
    });
  };

  const midi = await palette(13);
  check(`en plein jour, le fond est le papier du site (${midi.fond.join(',')})`, midi.fond.join(','), '239,235,226');
  check(`et l’encre celle du site (${midi.encre.join(',')})`, midi.encre.join(','), '33,33,33');
  check('le soleil est haut à treize heures', midi.el > 0.9);
  check('et il ne fait pas nuit', midi.nuit < 0.02);

  const minuit = await palette(0);
  check(`à minuit le fond est presque noir (clarté ${(lum(minuit.fond) * 100).toFixed(0)} %)`, lum(minuit.fond) < 0.03);
  check('l’encre a basculé dans les clairs', lum(minuit.encre) > 0.5);
  check('le soleil est sous l’horizon', minuit.el < 0);
  check('et il fait nuit pleine', minuit.nuit > 0.95);

  /* Le texte doit rester lisible sur son cartouche à toute heure. */
  let pire = 99, pireH = null;
  for (const h of [0, 3, 5.5, 6, 6.5, 8, 11, 13, 16, 18, 18.6, 19, 19.5, 20.5, 22]) {
    const c = await palette(h);
    const k = contraste(c.encre, c.pap);
    if (k < pire) { pire = k; pireH = h; }
  }
  check(`le texte reste lisible sur son cartouche à toute heure (au pire ${pire.toFixed(1)} à ${pireH} h)`, pire >= 7);
  check(`aucune erreur sur toute la journée (${bruit.length})`, bruit.length, 0);

  /* Le ciel se posait depuis le dessin de l'arbre, et le dessin s'arrête
     dès qu'une page est ouverte : on lisait la chronologie sous un ciel
     figé, puis en refermant, le jour sautait à la nuit. On ouvre donc la
     page du Yunnan à six heures et demie et l'on regarde si le fond suit
     l'heure — et s'il va bien vers le jour, et non vers la nuit. */
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load' });
  await p.waitForTimeout(900);
  await p.evaluate(() => { CIEL.poser(6.5); openPage('yunnan'); });
  await p.waitForTimeout(600);
  const t0 = await p.evaluate(() => ({ h: CIEL.heure(), nuit: SUN.nuit,
    fond: getComputedStyle(document.documentElement).getPropertyValue('--fond').trim().split(',').map(Number) }));
  await p.waitForTimeout(20000);
  const t1 = await p.evaluate(() => ({ h: CIEL.heure(), nuit: SUN.nuit,
    fond: getComputedStyle(document.documentElement).getPropertyValue('--fond').trim().split(',').map(Number) }));
  check(`une page ouverte n’arrête pas l’heure (${t0.h.toFixed(2)} h → ${t1.h.toFixed(2)} h)`, t1.h > t0.h);
  /* Juste après le lever, la courbe du ciel est presque plate — le lissage
     annule sa pente au début de chaque palier. L'écart est donc minuscule,
     mais il n'est pas nul : un ciel figé donne exactement zéro. */
  check(`ni le ciel (nuit ${t0.nuit.toFixed(4)} → ${t1.nuit.toFixed(4)})`, t1.nuit < t0.nuit - 0.0008);
  check(`à l’aube le fond va vers le jour, pas vers la nuit (clarté ${(lum(t0.fond) * 100).toFixed(1)} % → ${(lum(t1.fond) * 100).toFixed(1)} %)`,
    lum(t1.fond) > lum(t0.fond) + 0.002);
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * Le son : démarre-t-il, et revient-il après une interruption ?
 * ------------------------------------------------------------------ *
 * « Parfois je n'entendais plus » : un contexte audio suspendu par le
 * système ne se rallume pas tout seul, et rien ne le signale. On suspend
 * donc le contexte comme le ferait un téléphone, et l'on vérifie qu'il
 * repart sans qu'on ait à toucher l'écran.
 */
titre('Le son');
{
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 800 }, locale: 'fr-FR' });
  /* Le contexte audio de l'atlas n'est pas exposé — et deux contextes d'une
     même page ont des états séparés, donc en créer un second ne dit rien.
     On attrape donc celui de l'atlas à sa naissance. */
  await ctx.addInitScript(() => {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    const W = function (...a) { const c = new C(...a); if (!window.__ac) window.__ac = c; return c; };
    W.prototype = C.prototype;
    window.AudioContext = W; window.webkitAudioContext = W;
    /* On compte les oscillateurs créés : c'est la seule façon, du dehors,
       de voir qu'un nouvel accord a bien été posé. */
    window.__osc = 0;
    const co = C.prototype.createOscillator;
    C.prototype.createOscillator = function (...a) { window.__osc++; return co.apply(this, a); };
  });
  const p = await ctx.newPage();
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  check('le son n’est pas coupé au départ', await p.evaluate(() => !document.body.classList.contains('muted')));
  await p.mouse.click(640, 400);                       /* le geste qui autorise le son */
  await p.waitForTimeout(1200);
  const etat = () => p.evaluate(() => (window.__ac ? window.__ac.state : 'sans contexte'));
  check(`le contexte audio tourne dès le premier geste (${await etat()})`, await etat(), 'running');
  /* On le suspend comme le ferait un téléphone qui reçoit un appel. On lit
     l'état au moment même où la promesse se résout : la ronde de réveil
     passe toutes les cinq secondes et peut le relancer aussitôt — attendre
     avant de regarder rendait l'épreuve capricieuse une fois sur douze. */
  const suspendu = await p.evaluate(async () => { await window.__ac.suspend(); return window.__ac.state; });
  check(`suspendu, il est bien suspendu (${suspendu})`, suspendu, 'suspended');
  /* Et il doit repartir seul : la ronde interne passe toutes les cinq secondes. */
  await p.waitForTimeout(6500);
  check(`il repart seul, sans un geste (${await etat()})`, await etat(), 'running');

  /* « La musique s'est arrêtée toute seule alors que je lisais la
     chronologie. » La chaîne d'accords vit sur un setTimeout, et le
     gardien qui la relançait vivait sur un setInterval : quand le système
     coupe les minuteurs, il les coupe tous, et le gardien meurt avec ce
     qu'il gardait. On reproduit exactement cela — on tue tous les
     minuteurs de la page, page ouverte sur la chronologie — et l'on
     vérifie qu'un nouvel accord se pose quand même, par la boucle
     d'animation, sans qu'on touche l'écran. */
  await p.evaluate(() => { openPage('yunnan'); for (let i = 1; i < 60000; i++) { clearTimeout(i); clearInterval(i); } });
  const oscAvant = await p.evaluate(() => window.__osc);
  await p.waitForTimeout(34000);
  const oscApres = await p.evaluate(() => window.__osc);
  check(`minuteurs tués, la nappe repart d’elle-même (${oscApres - oscAvant} oscillateurs)`, oscApres - oscAvant >= 3);
  check(`et le contexte tourne toujours (${await etat()})`, await etat(), 'running');
  await p.evaluate(() => closePage());
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * Les notes des boutons s'entendent vraiment
 * ------------------------------------------------------------------ *
 * Le reproche était : « je n'entends pas certains sons comme menu ». Les
 * appels partaient bien — mesure faite, AUD.fx() était appelé. C'est la
 * nappe qui les couvrait : une note ne dépassait le fond que de 0,8 dB.
 *
 * Mesurer cela demande quelques précautions. La nappe n'est pas stable :
 * son filtre est balayé par un oscillateur lent de quarante secondes, des
 * scintillements tombent au hasard, et la réverbération dure sept secondes
 * et demie — autrement dit, la queue d'une note pollue le « silence » qui
 * suit. Comparer deux fenêtres voisines ne veut donc rien dire.
 *
 * On procède par paires : le hasard est semé à l'identique, la page est
 * neuve à chaque fois, et on mesure toujours la même fenêtre d'horloge
 * audio — une fois sans note, une fois avec. Le filtre passe-haut à
 * 1 800 Hz écarte la nappe, qui est passée à 1 150 Hz.
 */
titre('Les notes des boutons s’entendent');
{
  const semerEtBrancher = () => {
    /* Même suite de « hasard » à chaque page : les scintillements de la
       nappe tombent au même instant dans les deux passes. */
    let g = 123456789;
    Math.random = () => { g = (g * 1103515245 + 12345) & 0x7fffffff; return g / 0x7fffffff; };
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    const W = function (...a) {
      const c = new C(...a);
      if (!window.__ac) {
        window.__ac = c;
        const brut = AudioNode.prototype.connect;
        const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800; hp.Q.value = 0.7;
        const sp = c.createScriptProcessor(512, 1, 1); window.__pic = 0;
        /* On regarde chaque échantillon : une note dure dix millisecondes à
           l'attaque, un relevé à l'image en raterait la moitié. */
        sp.onaudioprocess = (e) => {
          const d = e.inputBuffer.getChannelData(0); let m = 0;
          for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); if (v > m) m = v; }
          if (m > window.__pic) window.__pic = m;
        };
        const muet = c.createGain(); muet.gain.value = 0;
        brut.call(hp, sp); brut.call(sp, muet); brut.call(muet, c.destination);
        AudioNode.prototype.connect = function (d, ...r) {
          if (d === c.destination) { try { brut.call(this, hp); } catch (e) {} }
          return brut.call(this, d, ...r);
        };
      }
      return c;
    };
    W.prototype = C.prototype; window.AudioContext = W; window.webkitAudioContext = W;
  };
  const passe = async (voix) => {
    const ctx = await nav.newContext({ viewport: { width: 1280, height: 800 }, locale: 'fr-FR' });
    await ctx.addInitScript(semerEtBrancher);
    const p = await ctx.newPage();
    await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load' });
    await p.waitForTimeout(400);
    await p.mouse.click(640, 400);                       /* le geste qui autorise le son */
    /* On se cale sur l'horloge audio, pas sur celle de la page : le rendu
       logiciel de l'intégration est lent et la ferait dériver. */
    const attendre = (s) => p.evaluate(async (s) => {
      const ac = window.__ac; const t = ac.currentTime;
      while (ac.currentTime - t < s) await new Promise((r) => setTimeout(r, 20));
    }, s);
    await attendre(2.2);                                  /* le fondu d'ouverture dure 1,8 s */
    await p.evaluate((v) => { window.__pic = 0; if (v) AUD.fx(v); }, voix);
    await attendre(0.7);
    const pic = await p.evaluate(() => window.__pic);
    await ctx.close();
    return pic;
  };
  const nappe = await passe(null);
  check(`la nappe seule reste discrète dans l’aigu (${nappe.toFixed(4)})`, nappe > 0 && nappe < 0.02);
  /* Les voix que l'on entend dans l'aigu. « node », « tap » et « tick »
     jouent sous 1 800 Hz : cette mesure ne les voit pas, et ne prétend
     donc rien à leur sujet. */
  for (const voix of ['next', 'prev', 'menu', 'lang', 'bascule', 'open', 'close', 'step']) {
    const avec = await passe(voix);
    const dB = 20 * Math.log10(avec / nappe);
    check(`« ${voix} » passe au-dessus de la nappe (+${dB.toFixed(1)} dB)`, dB > 6);
  }
}

/* ------------------------------------------------------------------ *
 * Le survol des terroirs
 * ------------------------------------------------------------------ *
 * Les sept terroirs sont posés sur le relevé réel du Yunnan. Une erreur de
 * projection ne lève rien : les repères partent simplement hors de l'écran,
 * ou se posent tous au même endroit. On mesure donc où ils tombent.
 */
/* ------------------------------------------------------------------ *
 * La caméra ne passe pas sous les montagnes
 * ------------------------------------------------------------------ *
 * En descendant le regard au plus bas, l'œil finissait sous le relief :
 * on voyait la montagne par en dessous, une coque creuse éclairée du
 * mauvais côté. Mesuré avant la correction, à quinze mille unités de la
 * cible : 3 600 unités sous le sol au lacet 3,6 et 2 160 au lacet 4,8 —
 * soit quatre cents et deux cent cinquante mètres sous terre. On refait
 * donc le tour complet, à quatre distances, le tangage forcé au minimum,
 * et l'on vérifie que l'œil reste au-dessus partout.
 */
/* ------------------------------------------------------------------ *
 * Les noms de l'arbre
 * ------------------------------------------------------------------ *
 * « Il y a des noms qui manquent. » Mesuré : à la vue d'accueil, vingt-
 * deux noms sur soixante-cinq variétés visibles ; de plus près sur un
 * téléphone, six sur quarante candidats, la moitié droite de l'arbre
 * perdant les siens parce que leur cartouche dépassait du bord. Et dans
 * le récit, deux noms par étape, quelle que soit la longueur de la lignée
 * mise en avant. L'atlas compte désormais ce qu'il pose (S.nlab) et ce
 * qui le demandait (S.nlabVoulus) : c'est ce qui rend la chose mesurable
 * plutôt que subjective.
 */
titre('Les noms de l’arbre');
for (const vue of VUES) {
  const { ctx, p, bruit } = await ouvrir(vue);
  const compter = () => p.evaluate(() => ({ poses: S.nlab, voulus: S.nlabVoulus }));
  const seuil = vue.mobile ? { accueil: 10, pres: 14 } : { accueil: 24, pres: 34 };

  await p.evaluate(() => { S.year = 2026; syncTime(); goHome(); });
  await p.waitForTimeout(2500);
  const accueil = await compter();
  check(`${vue.nom} · l’arbre complet porte ses noms (${accueil.poses} posés sur ${accueil.voulus} demandés)`,
    accueil.poses >= seuil.accueil);
  /* Un nom candidat peut être écarté : sa place est prise. C'est le
     chevauchement qui arbitre, et c'est voulu. Ce qui ne l'est pas, c'est
     d'en perdre la moitié — ce qui arrivait avant que chaque nom ait deux
     places possibles, à droite du point puis à gauche. */
  check(`${vue.nom} · presque aucun ne se perd (${Math.round(accueil.poses / accueil.voulus * 100)} %)`,
    accueil.poses >= accueil.voulus * 0.7);

  await p.evaluate(() => { tgt.dist = 6000; });
  await p.waitForTimeout(2500);
  const pres = await compter();
  check(`${vue.nom} · de plus près, il y en a davantage (${pres.poses})`, pres.poses >= seuil.pres);

  /* Le récit : la lignée mise en avant doit être nommée en entier. On pose
     le millésime de l'étape à la main, comme le fait l'animation une fois
     sa transition finie — sans cela on mesure un arbre à moitié éclos. */
  await p.evaluate(() => { goHome(); storyStart(); storyPause(true); });
  await p.waitForTimeout(1200);
  await p.evaluate(() => { storyGo(11); S.year = STORY[11].y; syncTime(); });
  await p.waitForTimeout(2200);
  const recit = await p.evaluate(() => ({ poses: S.nlab, voulus: S.nlabVoulus, focus: S.focus ? S.focus.size : 0 }));
  check(`${vue.nom} · le récit nomme la lignée mise en avant (${recit.poses} noms pour ${recit.focus} nœuds éclairés)`,
    recit.focus >= 8 && recit.poses >= Math.ceil(recit.focus * 0.75));
  check(`${vue.nom} · aucune erreur pendant le comptage (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * L'atlas ne porte plus d'illustration
 * ------------------------------------------------------------------ */
titre('L’atlas est textuel');
{
  const { ctx, p, bruit } = await ouvrir(VUES[0]);
  const reste = await p.evaluate(() => {
    openFiche(M.gesha);
    return { planches: document.querySelectorAll('.plate, figure').length,
      modules: ['PLATES', 'BOT', 'figBot'].filter((n) => typeof window[n] !== 'undefined') };
  });
  check('aucune planche sur une fiche de variété', reste.planches, 0);
  check(`aucun générateur d’illustration ne subsiste (${reste.modules.join(', ') || 'aucun'})`, reste.modules.length, 0);
  check(`aucune erreur (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}

titre('La caméra ne passe pas sous les montagnes');
{
  const { ctx, p, bruit } = await ouvrir(VUES[0]);
  check('le relief est bien là', await p.evaluate(() => !!(GL3.ok && GL3.solXZ)));
  let pire = Infinity, pireOu = null;
  for (const dist of [6000, 15000, 30000, 42000]) {
    for (let i = 0; i < 8; i++) {
      const yaw = i * Math.PI / 4;
      await p.evaluate(([y, d]) => {
        tgt.yaw = cam.yaw = y; tgt.dist = cam.dist = d;
        tgt.tx = cam.tx = 0; tgt.ty = cam.ty = 0; tgt.tz = cam.tz = 0;
        tgt.pitch = -0.15;                 /* le plus bas que le doigt permette */
      }, [yaw, dist]);
      await p.waitForTimeout(700);
      const garde = await p.evaluate(() => {
        const cp = Math.cos(cam.pitch);
        const ex = cam.tx + cam.dist * cp * Math.sin(cam.yaw);
        const ez = cam.tz + cam.dist * cp * Math.cos(cam.yaw);
        return Math.round(cam.ty + cam.dist * Math.sin(cam.pitch) - GL3.solXZ(ex, ez));
      });
      if (garde < pire) { pire = garde; pireOu = `${dist} / ${yaw.toFixed(2)}`; }
    }
  }
  check(`l’œil reste au-dessus du sol, tout autour (au pire ${pire} unités, à ${pireOu})`, pire > 0);
  check(`aucune erreur pendant le tour (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}

titre('Le survol des terroirs');
{
  const { ctx, p, bruit } = await ouvrir(VUES[0], '#survol');
  /* Le vol est long — d'un bout à l'autre du Yunnan — et le rendu logiciel
     de l'intégration est lent : on lui laisse le temps d'arriver. */
  await p.waitForTimeout(6000);
  check('le cartouche du terroir est ouvert', await p.locator('#terr').isVisible());
  check('la frise du temps s’efface', await p.locator('.dock').isHidden());
  const titre1 = (await p.locator('#ttitle').textContent())?.trim() ?? '';
  check(`on arrive sur « ${titre1} »`, titre1.startsWith('Pu'));
  /* Le terroir visé doit tomber au centre : c'est lui que l'on vient voir. */
  const vise = await p.evaluate(() => {
    const [x, y] = proj(...GL3.sol(REGIONS[TERR.i].lon, REGIONS[TERR.i].lat));
    return { dx: Math.abs(x - innerWidth / 2) / innerWidth, dy: Math.abs(y - innerHeight / 2) / innerHeight };
  });
  check(`le terroir est au centre (${(vise.dx * 100).toFixed(0)} % / ${(vise.dy * 100).toFixed(0)} % de l’écran)`,
    vise.dx < 0.12 && vise.dy < 0.2);
  /* Les sept doivent être distincts : s'ils se superposent, la projection
     géographique est fausse. */
  const ecarts = await p.evaluate(() => {
    const ps = REGIONS.map((r) => proj(...GL3.sol(r.lon, r.lat)));
    let mini = Infinity;
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++)
      mini = Math.min(mini, Math.hypot(ps[i][0] - ps[j][0], ps[i][1] - ps[j][1]));
    return Math.round(mini);
  });
  check(`les sept terroirs sont distincts (${ecarts} px entre les deux plus proches)`, ecarts > 30);
  /* Et leur disposition doit être celle de la carte : Baoshan au nord-ouest
     de Xishuangbanna, qui est à l'extrême sud. */
  const geo = await p.evaluate(() => {
    const g = (id) => { const r = REGIONS.find((x) => x.id === id); const s = GL3.sol(r.lon, r.lat); return { x: s[0], z: s[2] }; };
    return { baoshan: g('baoshan'), xsbn: g('xsbn'), dehong: g('dehong') };
  });
  check('Baoshan est au nord de Xishuangbanna', geo.baoshan.z < geo.xsbn.z);
  check('Dehong est à l’ouest de Baoshan', geo.dehong.x < geo.baoshan.x);

  await p.locator('#tnext').click();
  await p.waitForTimeout(2500);
  const titre2 = (await p.locator('#ttitle').textContent())?.trim() ?? '';
  check(`le suivant mène à « ${titre2} »`, titre2 !== titre1 && titre2.startsWith('Baoshan'));
  const croises = chevauchements(await boites(p));
  check(`rien ne se recouvre pendant le survol — ${croises.length ? croises.join(', ') : 'aucun recouvrement'}`, croises.length, 0);

  await p.locator('#tquit').click();
  await p.waitForTimeout(900);
  check('on en sort', await p.locator('#terr').isHidden());
  check(`aucune erreur pendant le survol (${bruit.length})`, bruit.length, 0);
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * (ancien contrôle, conservé : le détail des pièces en portrait)
 * ------------------------------------------------------------------ */
titre('Rien ne se recouvre, en portrait');
{
  const { ctx, p } = await ouvrir(VUES[1]);
  const boites = await p.evaluate(() => {
    const b = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
    return { repere: b('.hint'), logo: b('.brand'), menu: b('.menubtn'), annee: b('.yrbox'), lecture: b('.playbtn'), socle: b('.dock') };
  });
  const croise = (a, b) => !!a && !!b && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  check('le repère de geste ne passe pas sous le logo', croise(boites.repere, boites.logo), false);
  check('ni sous le bouton du menu', croise(boites.repere, boites.menu), false);
  check('le bouton de l’histoire ne recouvre pas le millésime', croise(boites.lecture, boites.annee), false);
  /* Depuis la refonte du socle : bouton court, calé à droite du millésime. */
  check(`le bouton de l’histoire reste court (${Math.round(boites.lecture.w)} px)`, boites.lecture.w > 60 && boites.lecture.w < 190);
  const droite = boites.socle.x + boites.socle.w - (boites.lecture.x + boites.lecture.w);
  check(`il est calé à droite du socle (${Math.round(droite)} px de marge)`, droite >= -1 && droite < 26);
  check('il est à droite du millésime', boites.lecture.x >= boites.annee.x + boites.annee.w - 1);
  await ctx.close();
}

/* ------------------------------------------------------------------ *
 * On ne reste pas coincé dans le survol
 * ------------------------------------------------------------------ *
 * Le survol des terroirs prend l'écran entier et cache la frise. Deux de
 * ses boutons en sortaient, et la barre d'adresse aussi — mais aucune des
 * autres sorties : ouvrir le menu puis choisir « Raconter l'histoire »
 * laissait le survol allumé sous le récit. On essaie donc chaque chemin.
 */
titre('On ne reste pas coincé dans le survol');
{
  const enSurvol = async (p) => {
    await p.evaluate(() => { location.hash = 'survol'; });
    await p.waitForTimeout(3200);
    return p.evaluate(() => TERR.on && document.body.classList.contains('terring'));
  };
  const etat = (p) => p.evaluate(() => ({
    survol: TERR.on,
    classe: document.body.classList.contains('terring'),
    cartouche: !document.getElementById('terr').hidden && document.getElementById('terr').classList.contains('on'),
  }));
  const parLeMenu = (dest) => async (p) => { await p.click('.menubtn'); await p.waitForTimeout(400); await p.click(`[data-go="${dest}"]`); };
  const sorties = [
    ['le menu mène à l’histoire', parLeMenu('histoire')],
    ['le menu mène aux variétés', parLeMenu('varietes')],
    ['le menu ramène à l’arbre', parLeMenu('arbre')],
    ['le logo ramène à l’arbre', async (p) => p.click('#brand')],
    ['Échap en sort', async (p) => p.keyboard.press('Escape')],
  ];
  for (const [nom, geste] of sorties) {
    const { ctx, p } = await ouvrir(VUES[1]);
    const parti = await enSurvol(p);
    await geste(p);
    await p.waitForTimeout(900);
    const e = await etat(p);
    check(nom, parti && !e.survol && !e.classe && !e.cartouche);
    await ctx.close();
  }
  /* Et le bouton du son, lui, ne doit rien fermer. */
  {
    const { ctx, p } = await ouvrir(VUES[1]);
    await enSurvol(p);
    await p.click('#sndBtn');
    await p.waitForTimeout(500);
    const e = await etat(p);
    check('le bouton du son ne fait pas sortir du survol', e.survol && e.classe && e.cartouche);
    await ctx.close();
  }
  /* Changer de langue pendant le survol doit réécrire le cartouche. */
  {
    const { ctx, p } = await ouvrir(VUES[1]);
    await enSurvol(p);
    await p.click('.menubtn'); await p.waitForTimeout(400);
    await p.click('#langs [data-l="en"]'); await p.waitForTimeout(600);
    await p.click('#menuClose'); await p.waitForTimeout(400);
    /* Les deux boutons du cartouche sont des icônes : c'est leur nom
       accessible qui porte le mot, et c'est donc lui qui doit changer. */
    const q = await p.evaluate(() => ({
      survol: TERR.on,
      quit: document.getElementById('tquit').getAttribute('aria-label'),
      kick: document.getElementById('tkick').textContent.trim(),
    }));
    check(`le survol tient le changement de langue (« ${q.quit} », « ${q.kick} »)`,
      q.survol && q.quit === 'Exit' && /terroir/i.test(q.kick) && !/sur /i.test(q.kick));
    await ctx.close();
  }
}

/* ------------------------------------------------------------------ *
 * Aucune étiquette de bouton ne passe à la ligne
 * ------------------------------------------------------------------ *
 * « Quitter le survol » tombait sur deux lignes dans un bouton haut de
 * trente-quatre pixels, et se faisait rogner. La hauteur ne le dit pas :
 * on compte les lignes réellement rendues, en relevant les rectangles du
 * nœud de texte — un par ligne.
 */
titre('Aucune étiquette de bouton ne passe à la ligne');
{
  const compter = () => {
    const lignes = (el) => {
      let n = 0;
      for (const t of el.childNodes) {
        if (t.nodeType !== 3 || !t.textContent.trim()) continue;
        const r = document.createRange(); r.selectNodeContents(t);
        const rects = [...r.getClientRects()].filter((x) => x.width > 0 && x.height > 0);
        n = Math.max(n, new Set(rects.map((x) => Math.round(x.top))).size);
      }
      return n || 1;
    };
    return [...document.querySelectorAll('.btn,.playbtn,.menubtn,.back,.icb')]
      .filter((e) => e.getClientRects().length)
      .map((e) => ({ id: e.id || String(e.className).split(' ')[0], txt: (e.textContent || '').trim().slice(0, 22), n: lignes(e) }))
      .filter((x) => x.n > 1);
  };
  /* Un écran étroit, les trois langues : c'est là que les mots débordent. */
  for (const langue of ['fr', 'en', 'zh']) {
    const ctx = await nav.newContext({ viewport: { width: 360, height: 820 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await ctx.addInitScript((l) => { try { localStorage.setItem('yunma-lang', l); } catch (e) {} }, langue);
    const p = await ctx.newPage();
    await p.goto(`http://127.0.0.1:${PORT}/?heure=13`, { waitUntil: 'load' });
    await p.waitForTimeout(2500);

    await p.evaluate(() => { location.hash = 'survol'; });
    await p.waitForTimeout(3200);
    const survol = await p.evaluate(compter);
    check(`en ${langue}, rien ne se coupe dans le survol${survol.length ? ' — ' + survol.map((x) => `${x.id} « ${x.txt} » ${x.n} lignes`).join(', ') : ''}`, survol.length, 0);

    await p.evaluate(() => terrStop());
    await p.waitForTimeout(600);
    await p.click('#play');
    await p.waitForTimeout(900);
    const n = await p.evaluate(() => STORY.length);
    const fautifs = [];
    for (let i = 0; i < n; i++) {
      await p.evaluate((i) => { storyGo(i); storyPause(true); }, i);
      await p.waitForTimeout(140);
      for (const x of await p.evaluate(compter)) fautifs.push(`${i + 1}:${x.id} « ${x.txt} »`);
    }
    check(`en ${langue}, rien ne se coupe sur les ${n} étapes du récit${fautifs.length ? ' — ' + fautifs.slice(0, 3).join(', ') : ''}`, fautifs.length, 0);
    await ctx.close();
  }
}

/* ------------------------------------------------------------------ *
 * Un bouton sans mot garde un nom
 * ------------------------------------------------------------------ *
 * Remplacer les étiquettes par des icônes règle le débordement, mais un
 * bouton muet n'est plus annonçable : ni pour un lecteur d'écran, ni au
 * survol de la souris. Chaque bouton sans texte doit donc porter un nom,
 * et ce nom doit suivre la langue.
 */
titre('Un bouton sans mot garde un nom');
{
  for (const langue of ['fr', 'en', 'zh']) {
    const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await ctx.addInitScript((l) => { try { localStorage.setItem('yunma-lang', l); } catch (e) {} }, langue);
    const p = await ctx.newPage();
    await p.goto(`http://127.0.0.1:${PORT}/?heure=13`, { waitUntil: 'load' });
    await p.waitForTimeout(2500);
    /* On ouvre tout ce qui porte des icônes : l'aperçu, le récit, le survol. */
    await p.evaluate(() => select(M.catimor)); await p.waitForTimeout(500);
    const muets = async () => p.evaluate(() => [...document.querySelectorAll('button')]
      /* checkVisibility tient compte de l'opacité et de la visibilité : un
         cartouche fermé reste en page, et ses boutons ne comptent pas. */
      .filter((e) => (e.checkVisibility ? e.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true }) : e.offsetWidth > 0))
      .filter((e) => !(e.textContent || '').trim())
      .filter((e) => !(e.getAttribute('aria-label') || '').trim())
      .map((e) => e.id || String(e.className).split(' ')[0] || 'sans nom'));
    const a1 = await muets();
    /* Le bouton de lecture se cache quand un aperçu est ouvert : on lance
       le récit par la fonction, pas par le clic. */
    await p.evaluate(() => storyStart(0)); await p.waitForTimeout(1200);
    await p.evaluate(() => { storyGo(2); storyPause(true); }); await p.waitForTimeout(300);
    const a2 = await muets();
    await p.evaluate(() => { storyEnd(false); location.hash = 'survol'; }); await p.waitForTimeout(3400);
    const a3 = await muets();
    const tous = [...new Set([...a1, ...a2, ...a3])];
    check(`en ${langue}, aucun bouton muet${tous.length ? ' — ' + tous.join(', ') : ''}`, tous.length, 0);
    await ctx.close();
  }
}

/* ------------------------------------------------------------------ *
 * Le verre dépoli reste lisible
 * ------------------------------------------------------------------ *
 * L'épreuve de contraste plus haut compare deux jetons de couleur, --encre
 * et --pap. Elle ne voit donc rien du paysage : depuis que les cartouches
 * sont translucides, ce n'est plus ce qui est à l'écran. On relève ici les
 * pixels réellement rendus, dans une bande du cartouche où il n'y a pas de
 * texte, et on prend le pire d'entre eux.
 */
titre('Le verre dépoli reste lisible');
{
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  for (const h of [13, 19, 22]) {
    const ctx = await nav.newContext({ viewport: { width: 800, height: 500 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    await p.goto(`http://127.0.0.1:${PORT}/?heure=${h}#survol`, { waitUntil: 'load' });
    await p.waitForTimeout(5200);
    const z = await p.evaluate(() => {
      const r = document.getElementById('terr').getBoundingClientRect();
      const t = document.getElementById('tkick').getBoundingClientRect();
      return { x: Math.round(r.x + 2), y: Math.round(r.y + 2), w: Math.round(r.width - 4),
               h: Math.max(4, Math.round(t.y - r.y - 6)), col: getComputedStyle(document.getElementById('ttext')).color };
    });
    const brut = await sharp(await p.screenshot({ clip: { x: z.x, y: z.y, width: z.w, height: z.h } }))
      .removeAlpha().raw().toBuffer();
    const encre = z.col.match(/\d+/g).map(Number);
    const L1 = lum(encre);
    let pire = Infinity, clair = 0, sombre = 255;
    for (let i = 0; i < brut.length; i += 3) {
      const L2 = lum([brut[i], brut[i + 1], brut[i + 2]]);
      const k = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      if (k < pire) pire = k;
      const g = (brut[i] + brut[i + 1] + brut[i + 2]) / 3;
      if (g > clair) clair = g; if (g < sombre) sombre = g;
    }
    check(`à ${h} h, le texte tient sur le verre (${pire.toFixed(1)}:1 au pire pixel)`, pire >= 7);
    /* Et le verre doit rester du verre. On ne peut pas le prouver en
       cherchant du relief dans le fond : par une nuit claire, le ciel
       derrière le cartouche est uniforme, et un aplat opaque donnerait le
       même relevé qu'une plaque parfaitement transparente. On le prouve en
       bouchant le verre : si la couleur du cartouche change, c'est que le
       paysage y entrait. */
    await p.evaluate(() => {
      const st = document.createElement('style'); st.id = 'bouche';
      st.textContent = '.peek,.story{background:rgb(var(--pap))!important;backdrop-filter:none!important}';
      document.head.appendChild(st);
    });
    await p.waitForTimeout(350);
    const bouche = await sharp(await p.screenshot({ clip: { x: z.x, y: z.y, width: z.w, height: z.h } }))
      .removeAlpha().raw().toBuffer();
    let ecart = 0;
    for (let i = 0; i < brut.length; i++) ecart = Math.max(ecart, Math.abs(brut[i] - bouche[i]));
    check(`à ${h} h, le paysage entre dans le verre (${ecart} niveaux d’écart une fois bouché)`, ecart >= 5);
    await ctx.close();
  }
}

/* ------------------------------------------------------------------ *
 * Chaque texte tient son contraste, à l'écran
 * ------------------------------------------------------------------ *
 * On ne lit pas une feuille de style, on lit un écran. Cette épreuve
 * photographie chaque état, puis, pour chaque élément qui porte du texte,
 * relève la couleur dominante de sa boîte — les lettres y sont toujours
 * minoritaires, c'est donc le fond — et la compare à la couleur du trait.
 * Elle voit ainsi ce qu'aucune lecture du code ne montre : le verre
 * translucide, le paysage derrière, la bascule jour/nuit, et le fill d'un
 * SVG, qui n'est pas son color.
 */
titre('Chaque texte tient son contraste, à l’écran');
{
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const releve = () => [...document.querySelectorAll('body *')]
    .filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
    .filter((e) => e.checkVisibility && e.checkVisibility({ opacityProperty: true, visibilityProperty: true }))
    .filter((e) => {
      const r = e.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return false;
      const x = Math.min(innerWidth - 1, Math.max(1, r.x + r.width / 2));
      const y = Math.min(innerHeight - 1, Math.max(1, r.y + r.height / 2));
      const haut = document.elementFromPoint(x, y);
      return !!haut && (haut === e || e.contains(haut) || haut.contains(e));
    })
    .map((e) => {
      const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
      if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return null;
      return {
        txt: e.textContent.trim().replace(/\s+/g, ' ').slice(0, 26),
        x: Math.max(0, Math.round(r.x)), y: Math.max(0, Math.round(r.y)),
        w: Math.round(Math.min(r.width, innerWidth - r.x)), h: Math.round(Math.min(r.height, innerHeight - r.y)),
        /* Un <text> SVG porte sa couleur dans fill, pas dans color. */
        col: e.ownerSVGElement && cs.fill && cs.fill !== 'none' ? cs.fill : cs.color,
        taille: parseFloat(cs.fontSize), gras: parseInt(cs.fontWeight) >= 600,
      };
    }).filter(Boolean);
  const dominante = (brut) => {
    const m = new Map();
    for (let i = 0; i < brut.length; i += 3) {
      const k = (brut[i] >> 3 << 10) | (brut[i + 1] >> 3 << 5) | (brut[i + 2] >> 3);
      m.set(k, (m.get(k) || 0) + 1);
    }
    let mieux = 0, bk = 0;
    for (const [k, v] of m) if (v > mieux) { mieux = v; bk = k; }
    return [((bk >> 10) & 31) * 8 + 4, ((bk >> 5) & 31) * 8 + 4, (bk & 31) * 8 + 4];
  };
  const etats = {
    'l’arbre': async () => {},
    'un aperçu': async (p) => { await p.evaluate(() => select(M.catimor)); await p.waitForTimeout(700); },
    'le récit': async (p) => { await p.evaluate(() => { storyStart(0); storyGo(5); storyPause(true); }); await p.waitForTimeout(700); },
    'le survol': async (p) => { await p.evaluate(() => { location.hash = 'survol'; }); await p.waitForTimeout(3400); },
    'les terroirs': async (p) => { await p.evaluate(() => openPage('terroirs')); await p.waitForTimeout(900); },
    'une fiche': async (p) => { await p.evaluate(() => openFiche(M.catimor)); await p.waitForTimeout(800); },
  };
  for (const h of [13, 19, 22]) {
    const fautes = [];
    for (const [nom, prep] of Object.entries(etats)) {
      const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
      const p = await ctx.newPage();
      await p.goto(`http://127.0.0.1:${PORT}/?heure=${h}`, { waitUntil: 'load' });
      await p.waitForTimeout(2600);
      try { await prep(p); } catch (e) {}
      const els = await p.evaluate(releve);
      const vue = await p.screenshot();
      for (const e of els) {
        let brut;
        try { brut = await sharp(vue).extract({ left: e.x, top: e.y, width: e.w, height: e.h }).removeAlpha().raw().toBuffer(); } catch (x) { continue; }
        const fond = dominante(brut);
        const v = e.col.match(/[\d.]+/g).map(Number);
        const a = v.length > 3 ? v[3] : 1;
        const trait = [0, 1, 2].map((i) => v[i] * a + fond[i] * (1 - a));
        const L1 = lum(trait), L2 = lum(fond);
        const k = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        const gros = e.taille >= 24 || (e.taille >= 18.66 && e.gras);
        if (k < (gros ? 3 : 4.5)) fautes.push(`${nom} « ${e.txt} » ${e.taille}px ${k.toFixed(1)}:1`);
      }
      await ctx.close();
    }
    check(`à ${h} h, tous les textes tiennent leur seuil${fautes.length ? ' — ' + fautes.slice(0, 3).join(' | ') : ''}`, fautes.length, 0);
  }
}

await nav.close();
serveur.close();

console.log(`\n${ok} vérifications passées, ${echecs.length} en échec`);
if (echecs.length) { for (const e of echecs) console.log(`  — ${e}`); process.exit(1); }
