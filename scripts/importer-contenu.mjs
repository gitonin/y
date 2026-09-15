/**
 * Réinjecte dans le site un document de contenu renvoyé corrigé.
 *
 *   node scripts/importer-contenu.mjs chemin/vers/document.docx [--essai]
 *
 * Le document est celui de `npm run export-contenu` : chaque texte y porte un
 * code entre crochets. L'export note au passage d'où vient chaque texte (voir
 * `scripts/lib/tracer.mjs`), si bien que la réinjection ne devine rien : elle
 * écrit à la clé exacte, dans `contenu/textes.json`, `contenu/produits.json`
 * ou `contenu/journal/fr/`.
 *
 * Ce qui ne peut pas être écrit sans risque est signalé, jamais supposé :
 * les coordonnées (qui vivent dans le code), et tout code dont le chemin est
 * inconnu. Les traductions anglaise et chinoise restent à faire après coup.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const RACINE = path.resolve(import.meta.dirname, '..');
const [fichier, ...options] = process.argv.slice(2);
const essai = options.includes('--essai');
const detail = options.includes('--detail');
if (!fichier) {
  console.error('Usage : node scripts/importer-contenu.mjs document.docx [--essai]');
  process.exit(1);
}

process.env.YUNMA_TRACE = '1';
const { doc: plan } = await import('./export-contenu.mjs');
const { chemins } = await import('./export-textes.mjs');
const { articlesJournal } = await import('./export-journal.mjs');

/* ------------------------------------------------------ lecture du document */
/* Word et Pages réappliquent les styles à leur guise : on ne peut pas s'y fier
   pour distinguer un titre d'une ligne de texte. On se sert donc du plan : il
   dit combien de titres et de consignes séparent chaque texte du suivant, et
   ces paragraphes-là viennent toujours après la valeur, juste avant le code
   suivant. Les derniers paragraphes d'un bloc sont donc du décor, même si
   l'auteur a retouché un titre au passage — auquel cas il n'aurait de toute
   façon nulle part où retourner, faute de code. */
const decor = new Set();
const suite = new Map();
let dernierCode = null;
let compteur = 0;
for (const item of plan) {
  if (item.type === 'field') {
    if (dernierCode !== null) suite.set(dernierCode, compteur);
    dernierCode = item.code;
    compteur = 0;
    continue;
  }
  compteur += 1;
  if (item.type === 'chapter' || item.type === 'section') decor.add(item.title);
  if (item.type === 'note') decor.add(item.text);
}
if (dernierCode !== null) suite.set(dernierCode, compteur);
const ecartes = [];

const paragraphes = JSON.parse(
  execFileSync('python3', [path.join(RACINE, 'outils/lire-document.py'), path.resolve(fichier)], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
);

const MARQUE = /\[([A-Za-z0-9._-]+)\]\s*$/;
const recu = new Map();
let code = null;
let lignes = [];
const fermer = () => {
  if (code === null) return;
  let reste = suite.get(code) ?? 0;
  while (reste > 0 && lignes.length) {
    ecartes.push([code, lignes.pop()]);
    reste -= 1;
  }
  while (lignes.length && lignes[lignes.length - 1].trim() === '') lignes.pop();
  recu.set(code, lignes.join('\n'));
};
for (const { texte } of paragraphes) {
  const marque = MARQUE.exec(texte);
  if (marque) {
    fermer();
    code = marque[1];
    lignes = [];
    continue;
  }
  if (code === null) continue;
  if (texte.startsWith('↑ les retours à la ligne')) continue;
  lignes.push(texte);
}
fermer();

/* ------------------------------------------------------ état actuel du site */
const actuel = new Map();
for (const item of plan) if (item.type === 'field') actuel.set(item.code, item.lines.join('\n'));

/* ------------------------------------------------------ fichiers de contenu */
const chemin = (nom) => path.join(RACINE, 'contenu', nom);
const textes = JSON.parse(readFileSync(chemin('textes.json'), 'utf8'));
const catalogue = JSON.parse(readFileSync(chemin('produits.json'), 'utf8'));
const journal = new Map();
for (const a of articlesJournal) {
  const f = chemin(`journal/fr/${a.slug}.md`);
  journal.set(a.slug, { fichier: f, brut: readFileSync(f, 'utf8'), article: a });
}

const poser = (racine, segments, valeur) => {
  let n = racine;
  for (const s of segments.slice(0, -1)) n = n[s];
  n[segments[segments.length - 1]] = valeur;
};

/* Un format et son prix, ou une méthode et ses colonnes, tiennent sur une
   seule ligne dans le document : leur chemin ne désigne qu'un des morceaux, on
   ne peut donc pas l'écrire tel quel. On les redécoupe ici, ou on renonce en le
   disant — jamais on ne laisse la ligne entière filer dans une seule clé. */
const composites = {
  prix: (produit, index, valeur) => {
    const m = /^(.*)\s—\s([\d.,]+)\s*€$/.exec(valeur.trim());
    if (!m) return `format et prix attendus sous la forme « 200 g — 15,00 € »`;
    const prix = Number(m[2].replace(',', '.'));
    if (!Number.isFinite(prix)) return 'prix illisible';
    produit.variants[index].label.fr = m[1].trim();
    produit.variants[index].price = prix;
    return null;
  },
  methode: (index, valeur) => {
    const parts = valeur.split('—').map((x) => x.trim());
    if (parts.length !== 4) return 'méthode attendue sous la forme « nom — ratio — température — durée »';
    const brew = textes.site.fr.savoirFaire.brews[index];
    if (!brew) return 'méthode inconnue';
    [brew.name, brew.ratio, brew.temp, brew.time] = parts;
    return null;
  },
};

const faits = [];
const restes = [];
const absents = [];

for (const [code, avant] of actuel) {
  if (!recu.has(code)) {
    absents.push(code);
    continue;
  }
  const apres = recu.get(code);
  if (apres === avant) continue;

  /* --- articles du journal --- */
  const article = /^article\.([a-z0-9-]+)\.(.+)$/.exec(code);
  if (article) {
    const entree = journal.get(article[1]);
    if (!entree) {
      restes.push([code, 'article inconnu']);
      continue;
    }
    (entree.modifs ??= []).push([article[2], apres]);
    faits.push(code);
    continue;
  }

  /* --- format et prix d'un produit --- */
  const prix = /^produit\.([a-z0-9-]+)\.prix\.(\d+)$/.exec(code);
  if (prix) {
    const produit = catalogue.produits.find((p) => p.slug === prix[1]);
    const souci = produit ? composites.prix(produit, Number(prix[2]) - 1, apres) : 'produit inconnu';
    if (souci) restes.push([code, souci]);
    else faits.push(code);
    continue;
  }

  const methode = /^savoirFaire\.methode\.(\d+)$/.exec(code);
  if (methode) {
    const souci = composites.methode(Number(methode[1]) - 1, apres);
    if (souci) restes.push([code, souci]);
    else faits.push(code);
    continue;
  }

  const chemin = chemins[code];
  if (!chemin) {
    restes.push([code, code.startsWith('site.') ? 'coordonnées — à changer dans src/consts.ts' : 'chemin inconnu']);
    continue;
  }
  const segments = chemin.split('.');
  const racine = segments.shift();

  if (racine === 'textes') {
    poser(textes.site.fr, segments, apres);
  } else if (racine === 'mentions' || racine === 'cgv') {
    const cible = racine === 'mentions' ? textes.mentionsLegales : textes.conditionsGenerales;
    poser(cible, segments, apres);
  } else if (racine === 'produits') {
    const produit = catalogue.produits[Number(segments.shift())];
    if (segments[0] === 'farm') {
      /* La ferme est partagée : on écrit dans sa fiche, pas dans le produit. */
      const ferme = catalogue.fermes[produit.ferme];
      if (segments[1] === 'name') {
        if (produit.fermeNom) produit.fermeNom = apres;
        else ferme.nom = apres;
      } else {
        poser(ferme, segments.slice(1), apres);
      }
    } else {
      poser(produit, segments, apres);
    }
  } else {
    restes.push([code, `racine « ${racine} » non gérée`]);
    continue;
  }
  faits.push(code);
}

/* ------------------------------------------------------ écriture du journal */
const PREFIXES = { intertitre: '## ', puces: '- ', numeros: null, paragraphe: '' };
const CHAMPS = { titre: 'title', description: 'description', date: 'date', auteur: 'author', photo: 'photo' };

for (const entree of journal.values()) {
  if (!entree.modifs) continue;
  const { article } = entree;
  let brut = entree.brut;
  const enTete = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(brut);
  let tete = enTete[1];
  const blocs = article.blocs.map((b) => ({ ...b }));

  for (const [champ, valeur] of entree.modifs) {
    const bloc = /^bloc\.(\d+)$/.exec(champ);
    if (bloc) {
      blocs[Number(bloc[1]) - 1].lignes = valeur.split('\n');
      continue;
    }
    if (champ === 'motsCles') {
      const liste = valeur.split(',').map((x) => x.trim()).filter(Boolean);
      tete = tete.replace(/^tags:.*$/m, `tags: [${liste.map((x) => `'${x.replace(/'/g, "\\'")}'`).join(', ')}]`);
      continue;
    }
    const cle = CHAMPS[champ];
    if (!cle) {
      restes.push([`article.${article.slug}.${champ}`, 'champ d’en-tête inconnu']);
      continue;
    }
    const echappe = /['":#]/.test(valeur) || cle === 'title' || cle === 'description'
      ? `"${valeur.replace(/"/g, '\\"')}"`
      : valeur;
    const motif = new RegExp(`^${cle}:.*$`, 'm');
    tete = motif.test(tete) ? tete.replace(motif, `${cle}: ${echappe}`) : `${tete}\n${cle}: ${echappe}`;
  }

  const corps = blocs
    .map((b) => {
      if (b.genre === 'numeros') return b.lignes.map((l, i) => `${i + 1}. ${l}`).join('\n');
      const prefixe = PREFIXES[b.genre] ?? '';
      return b.lignes.map((l) => `${prefixe}${l}`).join('\n');
    })
    .join('\n\n');

  const nouveau = `---\n${tete}\n---\n\n${corps}\n`;
  if (!essai) writeFileSync(entree.fichier, nouveau, 'utf8');
}

if (!essai) {
  writeFileSync(chemin('textes.json'), `${JSON.stringify(textes, null, 2)}\n`, 'utf8');
  writeFileSync(chemin('produits.json'), `${JSON.stringify(catalogue, null, 2)}\n`, 'utf8');
}

/* ------------------------------------------------------------------ rapport */
console.log(`${faits.length} texte(s) modifié(s)${essai ? ' (essai, rien écrit)' : ''}`);
for (const c of faits) {
  if (!detail) {
    console.log('  ·', c);
    continue;
  }
  console.log(`\n### ${c}\n  − ${JSON.stringify(actuel.get(c))}\n  + ${JSON.stringify(recu.get(c))}`);
}
if (absents.length) console.log(`\n${absents.length} code(s) absent(s) du document : ${absents.slice(0, 10).join(', ')}`);
const titresRetouches = ecartes.filter(([, ligne]) => ligne.trim() !== '' && !decor.has(ligne.trim()));
if (titresRetouches.length) {
  console.log(`\n${titresRetouches.length} titre(s) retouché(s), sans effet sur le site (un titre ne porte pas de code) :`);
  for (const [c, ligne] of titresRetouches) console.log('  ~', `après ${c} :`, JSON.stringify(ligne));
}
if (restes.length) {
  console.log(`\n${restes.length} à traiter à la main :`);
  for (const [c, pourquoi] of restes) console.log('  -', c, '·', pourquoi);
}
console.log('\nPensez ensuite à traduire les textes modifiés en anglais et en chinois.');
