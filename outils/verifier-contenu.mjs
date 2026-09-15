/**
 * Vérifie les trois fichiers de contenu avant chaque publication.
 *
 *   node outils/verifier-contenu.mjs
 *
 * Il est lancé automatiquement avant `npm run build` : si quelque chose cloche
 * dans `contenu/`, la publication s'arrête et le problème est dit en clair,
 * plutôt que de laisser passer une page vide ou un message illisible.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const LANGUES = ['fr', 'en', 'zh'];
const erreurs = [];
const avertissements = [];
const erreur = (m) => erreurs.push(m);
const avertir = (m) => avertissements.push(m);

/** Lit un JSON en disant où se trouve la faute de frappe, s'il y en a une. */
const lireJson = (chemin) => {
  let brut;
  try {
    brut = readFileSync(chemin, 'utf8');
  } catch {
    erreur(`${chemin} est introuvable.`);
    return null;
  }
  try {
    return JSON.parse(brut);
  } catch (e) {
    const pos = Number(String(e.message).match(/position (\d+)/)?.[1] ?? -1);
    const ligne = pos >= 0 ? brut.slice(0, pos).split('\n').length : null;
    erreur(
      `${chemin} n'est pas un JSON valide${ligne ? ` — regardez la ligne ${ligne}` : ''}. ` +
        'Le plus souvent : une virgule en trop avant une accolade, une virgule manquante entre deux blocs, ' +
        'ou un guillemet droit " oublié en fin de texte.'
    );
    return null;
  }
};

/** Toutes les clés d'un objet, en notation pointée, pour comparer deux langues. */
const chemins = (valeur, prefixe = '') => {
  if (Array.isArray(valeur)) return valeur.flatMap((v, i) => chemins(v, `${prefixe}[${i}]`));
  if (valeur && typeof valeur === 'object')
    return Object.entries(valeur).flatMap(([k, v]) => chemins(v, prefixe ? `${prefixe}.${k}` : k));
  return [prefixe];
};

/* ------------------------------------------------------------------ */
/* Photographies disponibles — lues dans le code, seul endroit où les   */
/* fichiers image sont associés à leur texte alternatif.                */
/* ------------------------------------------------------------------ */
const sourcePhotos = readFileSync('src/data/photos.ts', 'utf8');
const bloc = sourcePhotos.slice(sourcePhotos.indexOf('export const photos'));
const PHOTOS = [...bloc.matchAll(/^ {2}'([a-z0-9-]+)':/gm)].map((m) => m[1]);
if (PHOTOS.length === 0) avertir('Aucune photographie repérée dans src/data/photos.ts — vérification des visuels sautée.');

/* ------------------------------------------------------------------ */
/* 1. Textes du site                                                    */
/* ------------------------------------------------------------------ */
const textes = lireJson('contenu/textes.json');
if (textes) {
  if (!textes.site) erreur('contenu/textes.json : le bloc « site » est absent.');
  else {
    for (const l of LANGUES) if (!textes.site[l]) erreur(`contenu/textes.json : la langue « ${l} » est absente du bloc « site ».`);
    if (textes.site.fr) {
      const reference = new Set(chemins(textes.site.fr));
      for (const l of LANGUES.filter((x) => x !== 'fr' && textes.site[x])) {
        const ici = new Set(chemins(textes.site[l]));
        const manquantes = [...reference].filter((c) => !ici.has(c));
        const enTrop = [...ici].filter((c) => !reference.has(c));
        for (const c of manquantes.slice(0, 12)) erreur(`contenu/textes.json : « ${c} » existe en français mais pas en ${l}.`);
        if (manquantes.length > 12) erreur(`contenu/textes.json : et ${manquantes.length - 12} autres textes manquants en ${l}.`);
        for (const c of enTrop.slice(0, 12)) erreur(`contenu/textes.json : « ${c} » existe en ${l} mais pas en français.`);
        if (enTrop.length > 12) erreur(`contenu/textes.json : et ${enTrop.length - 12} autres textes en trop en ${l}.`);
      }
      for (const l of LANGUES.filter((x) => textes.site[x])) {
        for (const c of chemins(textes.site[l])) {
          const valeur = c.split(/[.[\]]+/).filter(Boolean).reduce((o, k) => o?.[k], textes.site[l]);
          if (typeof valeur === 'string' && valeur.trim() === '') erreur(`contenu/textes.json : « ${c} » est vide en ${l}.`);
        }
      }
    }
  }
  for (const doc of ['mentionsLegales', 'conditionsGenerales']) {
    if (!textes[doc]) { erreur(`contenu/textes.json : le bloc « ${doc} » est absent.`); continue; }
    for (const l of LANGUES) {
      const sections = textes[doc][l];
      if (!Array.isArray(sections)) { erreur(`contenu/textes.json : « ${doc} » n'a pas de version ${l}.`); continue; }
      sections.forEach((s, i) => {
        if (!s.title) erreur(`contenu/textes.json : ${doc} (${l}), section ${i + 1} — il manque le titre.`);
        if (!Array.isArray(s.body) || s.body.length === 0)
          erreur(`contenu/textes.json : ${doc} (${l}), section ${i + 1} — il manque le texte (« body »).`);
      });
    }
  }
}

/* ------------------------------------------------------------------ */
/* 2. Produits                                                          */
/* ------------------------------------------------------------------ */
const CATEGORIES = ['grain', 'drip', 'set'];
const VISUELS = ['bag-01', 'bag-03', 'bag-05', 'box', 'bundle'];
const catalogue = lireJson('contenu/produits.json');
if (catalogue) {
  const { fermes, produits } = catalogue;
  if (!fermes || typeof fermes !== 'object') erreur('contenu/produits.json : le bloc « fermes » est absent.');
  if (!Array.isArray(produits)) erreur('contenu/produits.json : le bloc « produits » est absent ou n\'est pas une liste.');

  for (const [cle, f] of Object.entries(fermes ?? {})) {
    if (!f.nom) erreur(`contenu/produits.json : la ferme « ${cle} » n'a pas de nom.`);
    for (const champ of ['place', 'text']) {
      for (const l of LANGUES) if (!f?.[champ]?.[l]) erreur(`contenu/produits.json : ferme « ${cle} » — « ${champ} » manque en ${l}.`);
    }
    if (PHOTOS.length && !PHOTOS.includes(f.photo))
      erreur(`contenu/produits.json : ferme « ${cle} » — la photographie « ${f.photo} » n'existe pas. Au choix : ${PHOTOS.join(', ')}.`);
  }

  const slugs = new Set();
  for (const p of produits ?? []) {
    const nom = p.slug ?? '(sans slug)';
    if (!p.slug) erreur('contenu/produits.json : un produit n\'a pas de « slug » (son adresse sur le site).');
    else if (slugs.has(p.slug)) erreur(`contenu/produits.json : le slug « ${p.slug} » apparaît deux fois.`);
    else if (!/^[a-z0-9-]+$/.test(p.slug)) erreur(`contenu/produits.json : le slug « ${p.slug} » ne doit contenir que des minuscules, des chiffres et des traits d'union.`);
    slugs.add(p.slug);

    if (!CATEGORIES.includes(p.category)) erreur(`contenu/produits.json : « ${nom} » — « category » doit valoir ${CATEGORIES.join(', ')}.`);
    if (!VISUELS.includes(p.visual)) erreur(`contenu/produits.json : « ${nom} » — « visual » doit valoir ${VISUELS.join(', ')}.`);
    if (!fermes?.[p.ferme]) erreur(`contenu/produits.json : « ${nom} » renvoie à la ferme « ${p.ferme} », qui n'est pas décrite plus haut.`);
    if (PHOTOS.length && !PHOTOS.includes(p.ambiance))
      erreur(`contenu/produits.json : « ${nom} » — la photographie d'ambiance « ${p.ambiance} » n'existe pas.`);

    for (const champ of ['name', 'subtitle', 'short', 'description', 'story', 'brew']) {
      for (const l of LANGUES) if (!p?.[champ]?.[l]) erreur(`contenu/produits.json : « ${nom} » — « ${champ} » manque en ${l}.`);
    }
    for (const champ of ['origin', 'altitude', 'variety', 'process', 'notes', 'drying', 'harvest']) {
      for (const l of LANGUES) if (!p?.specs?.[champ]?.[l]) erreur(`contenu/produits.json : « ${nom} » — la fiche technique « ${champ} » manque en ${l}.`);
    }
    /* Le profil est facultatif — un assortiment n'en a pas — mais s'il est là,
       il doit l'être dans les trois langues. */
    if (p?.specs?.roast) {
      for (const l of LANGUES) if (!p.specs.roast[l]) erreur(`contenu/produits.json : « ${nom} » — le profil manque en ${l}.`);
    }
    if (!Array.isArray(p.variants) || p.variants.length === 0) erreur(`contenu/produits.json : « ${nom} » n'a aucun format en vente.`);
    for (const v of p.variants ?? []) {
      if (typeof v.price !== 'number' || !(v.price > 0)) erreur(`contenu/produits.json : « ${nom} » — un prix est absent ou n'est pas un nombre (sans symbole €, avec un point décimal).`);
      if (typeof v.weightGrams !== 'number') erreur(`contenu/produits.json : « ${nom} » — « weightGrams » doit être un nombre.`);
      if (typeof v.available !== 'boolean') erreur(`contenu/produits.json : « ${nom} » — « available » doit valoir true ou false, sans guillemets.`);
      for (const l of LANGUES) if (!v?.label?.[l]) erreur(`contenu/produits.json : « ${nom} » — le nom d'un format manque en ${l}.`);
    }
  }
  for (const p of produits ?? []) {
    for (const r of p.related ?? []) if (!slugs.has(r)) erreur(`contenu/produits.json : « ${p.slug} » suggère « ${r} », qui n'existe pas.`);
  }
}

/* ------------------------------------------------------------------ */
/* 3. Journal                                                           */
/* ------------------------------------------------------------------ */
const racine = 'contenu/journal';
if (!existsSync(racine)) erreur('Le dossier contenu/journal est introuvable.');
else {
  const articles = {};
  for (const l of LANGUES) {
    const dossier = join(racine, l);
    if (!existsSync(dossier)) { erreur(`Le dossier ${dossier} est introuvable.`); continue; }
    articles[l] = readdirSync(dossier).filter((f) => f.endsWith('.md') && statSync(join(dossier, f)).isFile());
    for (const fichier of articles[l]) {
      const chemin = join(dossier, fichier);
      const brut = readFileSync(chemin, 'utf8');
      const entete = brut.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!entete) { erreur(`${chemin} : l'en-tête entre deux lignes de trois tirets est absent.`); continue; }
      const champ = (nom) => entete[1].match(new RegExp(`^${nom}:\\s*(.+)$`, 'm'))?.[1]?.trim().replace(/^["']|["']$/g, '');
      for (const requis of ['title', 'description', 'date']) {
        if (!champ(requis)) erreur(`${chemin} : « ${requis} » manque dans l'en-tête.`);
      }
      const date = champ('date');
      if (date && Number.isNaN(Date.parse(date))) erreur(`${chemin} : la date « ${date} » n'est pas lisible — attendu AAAA-MM-JJ.`);
      const photo = champ('photo');
      if (photo && PHOTOS.length && !PHOTOS.includes(photo))
        erreur(`${chemin} : la photographie « ${photo} » n'existe pas. Au choix : ${PHOTOS.join(', ')}.`);
      if (brut.replace(entete[0], '').trim().length < 40) erreur(`${chemin} : l'article est vide sous l'en-tête.`);
    }
  }
  /* Un article doit porter le même nom de fichier dans les trois langues :
     c'est ce qui relie les versions entre elles pour Google. */
  for (const l of LANGUES.filter((x) => x !== 'fr' && articles[x])) {
    for (const f of articles.fr ?? []) if (!articles[l].includes(f)) avertir(`contenu/journal : « ${f} » n'existe pas en ${l} — l'article ne sera publié qu'en français.`);
    for (const f of articles[l]) if (!(articles.fr ?? []).includes(f)) avertir(`contenu/journal : « ${f} » existe en ${l} mais pas en français.`);
  }
}

/* ------------------------------------------------------------------ */
for (const a of avertissements) console.log(`  À noter — ${a}`);
if (erreurs.length === 0) {
  console.log(`\n✓ Contenu vérifié : textes, produits et journal sont en ordre.${avertissements.length ? ` ${avertissements.length} point(s) à noter ci-dessus.` : ''}\n`);
  process.exit(0);
}
console.error(`\n✗ ${erreurs.length} problème(s) dans le dossier contenu/ — le site n'a pas été publié :\n`);
for (const e of erreurs) console.error(`  • ${e}`);
console.error('\nCorrigez ces points dans contenu/, puis relancez.\n');
process.exit(1);
