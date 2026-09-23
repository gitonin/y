/**
 * Vérifie que le site construit est irréprochable pour les moteurs.
 *
 * Ce contrôle lit le dossier livré, pas les sources : c'est ce que Google
 * verra, non ce que le code voulait dire.
 *
 *   npm run build
 *   node tests/referencement.mjs
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(RACINE, 'dist');
const DOMAINE = 'https://yunma.fr';

let ok = 0;
const echecs = [];
const check = (nom, reel, attendu) => {
  if (String(reel) === String(attendu)) { ok++; console.log(`  ok    ${nom}`); }
  else { echecs.push(nom); console.log(`  ÉCHEC ${nom}\n        attendu : ${attendu}\n        obtenu  : ${reel}`); }
};
const titre = (t) => console.log(`\n— ${t}`);

/* Toutes les pages HTML livrées, et l'adresse publique de chacune. */
const pages = [];
(function parcourir(d) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) parcourir(p);
    else if (e.endsWith('.html')) {
      const rel = p.slice(DIST.length).replace(/\\/g, '/');
      pages.push({ fichier: p, url: DOMAINE + rel.replace(/index\.html$/, ''), rel, html: readFileSync(p, 'utf8') });
    }
  }
})(DIST);

const balise = (h, re) => (h.match(re) ?? [])[1] ?? '';
const robots = (h) => balise(h, /<meta name="robots" content="([^"]*)"/);
const canonique = (h) => balise(h, /<link rel="canonical" href="([^"]*)"/);
const indexable = (p) => !robots(p.html).includes('noindex');

titre(`Le dossier livré — ${pages.length} pages HTML`);
const ouvertes = pages.filter(indexable);
const fermees = pages.filter((p) => !indexable(p));
console.log(`  ${ouvertes.length} ouvertes à l'indexation, ${fermees.length} tenues à l'écart`);
console.log('  tenues à l’écart :', fermees.map((p) => p.rel.replace('index.html', '')).join('  '));
check('aucune page ne sort sans balise robots', pages.filter((p) => !robots(p.html)).length, 0);

titre('Les pages ouvertes se désignent elles-mêmes');
for (const p of ouvertes) {
  const c = canonique(p.html);
  if (c !== p.url) { echecs.push(`canonique ${p.rel}`); console.log(`  ÉCHEC ${p.rel}\n        attendu : ${p.url}\n        obtenu  : ${c || '(aucune)'}`); }
  else ok++;
}
console.log(`  ${ouvertes.length} canoniques vérifiées, chacune égale à sa propre adresse`);
check('toutes en https sur le bon domaine', ouvertes.filter((p) => !canonique(p.html).startsWith(DOMAINE + '/')).length, 0);
check('toutes terminées par une barre', ouvertes.filter((p) => !canonique(p.html).endsWith('/')).length, 0);

titre('Aucune page écartée ne prétend en désigner une autre');
/* Une canonique posée sur une page en noindex envoie deux signaux contraires,
   et le refus peut se reporter sur la page désignée. */
const contradictoires = fermees.filter((p) => { const c = canonique(p.html); return c && c !== p.url; });
check('aucune canonique contradictoire', contradictoires.map((p) => p.rel).join(', ') || 0, 0);

titre('Les langues se répondent');
const LANGUES = { 'fr-FR': 'fr', en: 'en', 'zh-Hans': 'zh' };
let paires = 0;
for (const p of ouvertes) {
  const alts = Object.fromEntries([...p.html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]));
  const manquantes = Object.keys(LANGUES).filter((l) => !alts[l]);
  if (manquantes.length || !alts['x-default']) {
    echecs.push(`hreflang ${p.rel}`); console.log(`  ÉCHEC ${p.rel} — manque ${[...manquantes, alts['x-default'] ? null : 'x-default'].filter(Boolean).join(', ')}`);
    continue;
  }
  /* Réciprocité : la version anglaise doit renvoyer vers la française. */
  for (const [hl, code] of Object.entries(LANGUES)) {
    const cible = alts[hl].replace(DOMAINE, '');
    const f = join(DIST, cible, 'index.html');
    if (!existsSync(f)) { echecs.push(`hreflang mort ${p.rel} → ${cible}`); console.log(`  ÉCHEC ${p.rel} désigne ${cible}, qui n'existe pas`); continue; }
    const retour = (readFileSync(f, 'utf8').match(/<link rel="alternate" hreflang="[^"]+" href="([^"]+)"/g) ?? []).join(' ');
    if (!retour.includes(p.url)) { echecs.push(`réciprocité ${p.rel} ↔ ${cible}`); console.log(`  ÉCHEC ${cible} ne renvoie pas vers ${p.url}`); }
    else paires++;
  }
  ok++;
}
console.log(`  ${ouvertes.length} pages, ${paires} renvois de langue vérifiés dans les deux sens`);

titre('Le plan du site');
const plan = readFileSync(join(DIST, 'sitemap-0.xml'), 'utf8');
const index = readFileSync(join(DIST, 'sitemap-index.xml'), 'utf8');
const urls = [...plan.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
check('l’index pointe vers le plan', index.includes(`${DOMAINE}/sitemap-0.xml`), true);
check(`le plan recense ${urls.length} adresses`, urls.length > 0, true);
check('aucune adresse en double', new Set(urls).size, urls.length);
const mortes = urls.filter((u) => !existsSync(join(DIST, u.replace(DOMAINE, ''), 'index.html')));
check('toutes mènent à une page existante', mortes.join(', ') || 0, 0);
const interdites = urls.filter((u) => { const p = pages.find((x) => x.url === u); return p && !indexable(p); });
check('aucune page écartée n’y figure', interdites.join(', ') || 0, 0);
const oubliees = ouvertes.filter((p) => !urls.includes(p.url));
check('aucune page ouverte n’y manque', oubliees.map((p) => p.rel).join(', ') || 0, 0);

titre('robots.txt');
const rb = readFileSync(join(DIST, 'robots.txt'), 'utf8');
check('annonce le plan du site', rb.includes(`Sitemap: ${DOMAINE}/sitemap-index.xml`), true);
check('ne bloque rien', /^Disallow:\s*\/\s*$/m.test(rb), false);

titre('Les données structurées');
let blocs = 0;
for (const p of ouvertes) {
  for (const m of p.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); blocs++; }
    catch (e) { echecs.push(`ld+json ${p.rel}`); console.log(`  ÉCHEC ${p.rel} — JSON illisible : ${e.message}`); }
  }
}
check(`${blocs} blocs lisibles sur ${ouvertes.length} pages`, blocs >= ouvertes.length, true);

titre('Les liens internes mènent quelque part');
let liens = 0;
const casses = new Set();
for (const p of pages) {
  for (const m of p.html.matchAll(/href="(\/[^"#?]*?)"/g)) {
    const h = m[1];
    if (h.startsWith('/_astro/') || /\.[a-z0-9]{2,5}$/i.test(h)) continue;
    liens++;
    if (!existsSync(join(DIST, h, 'index.html')) && !existsSync(join(DIST, h))) casses.add(`${p.rel} → ${h}`);
  }
}
check(`${liens} liens suivis, aucun cassé`, [...casses].slice(0, 5).join(' | ') || 0, 0);

titre('Titres et descriptions');
const t = (h) => balise(h, /<title>([^<]*)<\/title>/);
const d = (h) => balise(h, /<meta name="description" content="([^"]*)"/);
check('aucun titre vide', ouvertes.filter((p) => !t(p.html).trim()).length, 0);
check('aucune description vide', ouvertes.filter((p) => !d(p.html).trim()).length, 0);
/* On compare langue par langue. « Contact — Yunma » en français et en anglais
   n'est pas un doublon : les deux pages se désignent mutuellement par
   hreflang, et Google sait qu'il s'agit d'une même page en deux langues. Un
   doublon à l'intérieur d'une même langue, lui, en est un. */
const langueDe = (p) => (p.rel.match(/^\/(fr|en|zh)\//) ?? [])[1] ?? 'racine';
for (const lg of ['fr', 'en', 'zh']) {
  const dans = ouvertes.filter((p) => langueDe(p) === lg);
  const dt = dans.map((p) => t(p.html)).filter((v, i, a) => a.indexOf(v) !== i);
  check(`${lg} — aucun titre en double`, [...new Set(dt)].join(' | ') || 0, 0);
  const dd = dans.map((p) => d(p.html)).filter((v, i, a) => a.indexOf(v) !== i);
  check(`${lg} — aucune description en double`, [...new Set(dd)].join(' | ') || 0, 0);
}

console.log(`\n${ok} vérifications passées, ${echecs.length} en échec`);
if (echecs.length) echecs.forEach((e) => console.log('  ·', e));
process.exit(echecs.length ? 1 : 0);
