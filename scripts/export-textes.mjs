/**
 * Exporte tous les textes éditoriaux du site dans un document relisible et
 * modifiable (Word + version texte), avec un code stable entre crochets devant
 * chaque texte. C'est ce code qui permet de réinjecter les modifications au bon
 * endroit, quelle que soit la façon dont le document a été retouché.
 *
 *   node scripts/export-textes.mjs
 */
import { build } from 'esbuild';
import { mkdtemp, readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'contenu');

/* ---------------------------------------------------------------- sources */
async function load(file) {
  const dir = await mkdtemp(path.join(tmpdir(), 'yunma-'));
  const outfile = path.join(dir, 'mod.mjs');
  await build({ entryPoints: [path.join(ROOT, file)], bundle: true, format: 'esm', outfile, logLevel: 'silent' });
  return import(outfile);
}

/** consts.ts utilise import.meta.env : on y lit les valeurs littérales. */
async function loadConsts() {
  const src = await readFile(path.join(ROOT, 'src/consts.ts'), 'utf8');
  const pick = (key) => src.match(new RegExp(`${key}:\\s*'([^']*)'`))?.[1] ?? '';
  const num = (key) => src.match(new RegExp(`${key}:\\s*(\\d+)`))?.[1] ?? '';
  return {
    email: pick('email'), proEmail: pick('proEmail'), pressEmail: pick('pressEmail'),
    phone: pick('phone'), street: pick('street'), postalCode: pick('postalCode'),
    city: pick('city'), instagram: pick('instagram'), linkedin: pick('linkedin'),
    freeShippingFrom: num('freeShippingFrom'), founded: pick('founded'),
  };
}

const { default: t } = await load('src/i18n/fr.ts');
const { products } = await load('src/data/products.ts');
const { mentions, cgv } = await load('src/data/legal.ts');
const site = await loadConsts();

/* ---------------------------------------------------------------- libellés */
const EXACT = {
  seoTitle: 'Titre affiché dans Google (≈ 60 signes)',
  seoDescription: 'Description affichée dans Google (≈ 155 signes)',
  label: 'Sur-titre',
  title: 'Titre',
  intro: 'Introduction',
  text: 'Texte',
  quote: 'Citation',
  closing: 'Phrase de fin',
  storyText: 'Le récit',
  mapTitle: 'Sur-titre',
  mapText: 'Phrase',
  brewText: 'Phrase',
  formIntro: 'Précision',
  forWhoText: 'Phrase',
  hoursText: 'Précision',
  formNote: 'Mention sous le formulaire',
  placeholder: 'Avertissement en haut de page',
  tagline: 'Phrase de présentation',
  payment: 'Mention de paiement',
  rights: 'Mention de droits',
};
const SUFFIX = [
  ['SeoTitle', 'Titre affiché dans Google (≈ 60 signes)'],
  ['SeoDescription', 'Description affichée dans Google (≈ 155 signes)'],
  ['Title', 'Titre'],
  ['Text', 'Texte'],
  ['Cta', 'Libellé du lien'],
  ['Label', 'Sur-titre'],
  ['Intro', 'Introduction'],
  ['Sub', 'Sous-titre'],
  ['Alt', 'Description de l’image (pour Google et les lecteurs d’écran)'],
];
const labelFor = (key) => {
  if (EXACT[key]) return EXACT[key];
  for (const [suffix, label] of SUFFIX) if (key.endsWith(suffix)) return label;
  return key;
};

/* ---------------------------------------------------------------- plan */
const doc = [];
const chapter = (title, note) => doc.push({ type: 'chapter', title, note });
const section = (title, note) => doc.push({ type: 'section', title, note });
const note = (text) => doc.push({ type: 'note', text });
const field = (code, value, label, hint) => {
  if (value === undefined || value === null || value === '') return;
  doc.push({ type: 'field', code, label: label ?? labelFor(code.split('.').pop()), hint, lines: String(value).split('\n') });
};
/** Toutes les clés d'un objet, dans l'ordre, en filtrant celles à ignorer. */
const fields = (prefix, obj, only) => {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value !== 'string') continue;
    if (only && !only.includes(key)) continue;
    field(`${prefix}.${key}`, value);
  }
};

/* ------- mode d'emploi ------- */
chapter('Comment utiliser ce document');
note(
  "Ce document contient tous les textes du site en français. Modifiez-les librement, puis renvoyez-moi le fichier : je les réinjecte dans le site et je m'occupe des traductions anglaise et chinoise."
);
note('Trois règles, et c’est tout :');
note('1. Ne touchez pas au code entre crochets, par exemple [accueil.titre]. C’est lui qui me dit où va chaque texte. Si un code disparaît, je ne sais plus où placer le texte.');
note('2. Écrivez sous le code, à la place du texte existant. Vous pouvez tout réécrire, rallonger, raccourcir.');
note('3. Quand un texte est sur plusieurs lignes, les retours à la ligne sont volontaires : ils dessinent la mise en page du titre. Gardez-en le nombre, ou dites-moi si vous voulez en changer.');
note('Pour supprimer un texte, écrivez « SUPPRIMER » à la place. Pour en ajouter un qui n’existe pas encore, écrivez-le en commentaire à la fin, je m’occupe du reste.');
note('Les textes des articles du journal ne sont pas ici : ce sont des documents séparés, un par article. Dites-moi si vous voulez le même système pour eux.');

/* ------- coordonnées ------- */
chapter('Coordonnées et informations pratiques');
note('Ces informations apparaissent à plusieurs endroits du site (pied de page, contact, mentions légales, données envoyées à Google).');
field('site.email', site.email, 'Adresse e-mail générale');
field('site.emailPro', site.proEmail, 'Adresse e-mail professionnels');
field('site.emailPresse', site.pressEmail, 'Adresse e-mail presse');
field('site.telephone', site.phone, 'Téléphone');
field('site.adresse', `${site.street}\n${site.postalCode} ${site.city}`, 'Adresse');
field('site.instagram', site.instagram, 'Lien Instagram');
field('site.linkedin', site.linkedin, 'Lien LinkedIn');
field('site.livraisonOfferteDes', `${site.freeShippingFrom} €`, 'Livraison offerte à partir de');
field('site.premiereRecolte', site.founded, 'Année de la première récolte importée');

/* ------- accueil ------- */
chapter('Page d’accueil');
const homeSections = [
  ['Référencement de la page', ['seoTitle', 'seoDescription']],
  ['Bandeau d’ouverture', ['heroTitle', 'heroSub', 'heroCta']],
  ['Bloc « Notre origine »', ['originLabel', 'originTitle', 'originText', 'originCta']],
  ['Bloc « Nos cafés »', ['coffeesLabel', 'coffeesTitle', 'coffeesText', 'coffeesCta']],
  ['Bloc « Notre approche »', ['approachLabel', 'approachTitle', 'approachText', 'approachCta']],
  ['Bloc « Journal »', ['journalLabel', 'journalTitle']],
  ['Bande « Professionnels »', ['proLabel', 'proTitle', 'proCta']],
  ['Image de fin', ['closingTitle', 'closingCta']],
];
for (const [titre, keys] of homeSections) {
  section(titre);
  for (const key of keys) field(`accueil.${key}`, t.home[key]);
}

/* ------- page cafés ------- */
chapter('Page « Nos cafés »');
section('Référencement de la page');
fields('cafes', t.cafes, ['seoTitle', 'seoDescription']);
section('En-tête');
fields('cafes', t.cafes, ['label', 'title', 'intro']);
section('Filtres');
fields('cafes', t.cafes, ['filterAll', 'filterGrains', 'filterDrip', 'filterSets']);
section('Encadré « Besoin d’un conseil ? »');
fields('cafes', t.cafes, ['helpTitle', 'helpText']);

/* ------- produits ------- */
chapter('Les six produits');
note('Les prix figurent ici pour mémoire : ils doivent rester identiques à ceux saisis dans Shopify, qui fait foi au paiement.');
for (const p of products) {
  section(`${p.name.fr} — ${p.subtitle.fr}`);
  const c = `produit.${p.slug}`;
  field(`${c}.nom`, p.name.fr, 'Nom');
  field(`${c}.sousTitre`, p.subtitle.fr, 'Sous-titre');
  field(`${c}.accroche`, p.short.fr, 'Accroche (une phrase, sous le prix)');
  field(`${c}.description`, p.description.fr, 'Description');
  field(`${c}.histoire`, p.story.fr, 'Histoire du lot');
  field(`${c}.origine`, p.specs.origin.fr, 'Fiche : origine');
  field(`${c}.altitude`, p.specs.altitude.fr, 'Fiche : altitude');
  field(`${c}.variete`, p.specs.variety.fr, 'Fiche : variété');
  field(`${c}.process`, p.specs.process.fr, 'Fiche : process');
  field(`${c}.notes`, p.specs.notes.fr, 'Fiche : notes de dégustation');
  field(`${c}.sechage`, p.specs.drying.fr, 'Fiche : séchage');
  field(`${c}.recolte`, p.specs.harvest.fr, 'Fiche : récolte');
  field(`${c}.profil`, p.specs.roast.fr, 'Fiche : profil (filtre ou espresso)');
  field(`${c}.preparation`, p.brew.fr, 'Conseils de préparation');
  (p.includes ?? []).forEach((item, i) => field(`${c}.contenu.${i + 1}`, item.fr, `Contenu, ligne ${i + 1}`));
  field(`${c}.ferme.nom`, p.farm.name, 'Ferme : nom');
  field(`${c}.ferme.lieu`, p.farm.place.fr, 'Ferme : lieu');
  field(`${c}.ferme.texte`, p.farm.text.fr, 'Ferme : présentation');
  p.variants.forEach((v, i) => field(`${c}.prix.${i + 1}`, `${v.label.fr} — ${v.price.toFixed(2)} €`, 'Format et prix'));
}

/* ------- origine (page fusionnée) ------- */
chapter('Page « Origine » (terroir, histoire et savoir-faire)');
note('Cette page réunit trois anciennes pages. Le sommaire en haut de page permet de sauter d’une partie à l’autre.');
section('Référencement de la page');
fields('origine', t.origine, ['seoTitle', 'seoDescription']);
section('En-tête');
fields('origine', t.origine, ['label', 'title', 'intro']);
t.origine.sections.forEach((s, i) => {
  section(`Bloc ${i + 1} — ${s.title}`);
  field(`origine.bloc.${i + 1}.surTitre`, s.label, 'Sur-titre');
  field(`origine.bloc.${i + 1}.titre`, s.title, 'Titre');
  field(`origine.bloc.${i + 1}.texte`, s.text, 'Texte');
});
section('Citation et terroirs');
field('origine.citation', t.origine.quote, 'Citation');
fields('origine', t.origine, ['mapTitle', 'mapText']);
t.origine.terroirs.forEach((terroir, i) => {
  field(`origine.terroir.${i + 1}.nom`, terroir.name, `Terroir ${i + 1} : nom`);
  field(`origine.terroir.${i + 1}.detail`, terroir.detail, `Terroir ${i + 1} : altitude et variétés`);
  field(`origine.terroir.${i + 1}.texte`, terroir.text, `Terroir ${i + 1} : texte`);
});

section('Sommaire de la page');
Object.entries(t.origine.anchors).forEach(([cle, valeur]) => field(`origine.sommaire.${cle}`, valeur, 'Entrée du sommaire'));

section('Soutien d’ORO Yunnan');
field('origine.oro.surTitre', t.origine.oroLabel, 'Sur-titre');
field('origine.oro.nom', t.origine.oroName, 'Nom');
field('origine.oro.nomComplet', t.origine.oroFull, 'Nom complet');
field('origine.oro.texte', t.origine.oroText, 'Texte');

/* ------- savoir-faire ------- */
chapter('Origine — partie « Savoir-faire »');
section('Référencement de la page');
fields('savoirFaire', t.savoirFaire, ['seoTitle', 'seoDescription']);
section('En-tête');
fields('savoirFaire', t.savoirFaire, ['label', 'title', 'intro']);
t.savoirFaire.steps.forEach((s, i) => {
  section(`Étape ${s.n} — ${s.title}`);
  field(`savoirFaire.etape.${i + 1}.titre`, s.title, 'Titre');
  field(`savoirFaire.etape.${i + 1}.texte`, s.text, 'Texte');
});
section('Tableau de préparation');
fields('savoirFaire', t.savoirFaire, ['brewTitle', 'brewText', 'brewMethod']);
t.savoirFaire.brews.forEach((b, i) => {
  field(`savoirFaire.methode.${i + 1}`, `${b.name} — ${b.ratio} — ${b.temp} — ${b.time}`, 'Méthode, ratio, température, durée');
});

/* ------- notre histoire ------- */
chapter('Origine — partie « Notre histoire »');
section('Référencement de la page');
fields('apropos', t.apropos, ['seoTitle', 'seoDescription']);
section('En-tête et récit');
fields('apropos', t.apropos, ['label', 'title', 'intro', 'storyText']);
section('Mission et approche');
fields('apropos', t.apropos, ['missionTitle', 'missionText', 'approachTitle', 'approachText']);
section('Nos engagements');
field('apropos.engagementsTitre', t.apropos.valuesTitle, 'Sur-titre');
t.apropos.values.forEach((v, i) => {
  field(`apropos.engagement.${i + 1}.titre`, v.title, `Engagement ${i + 1} — titre`);
  field(`apropos.engagement.${i + 1}.texte`, v.text, `Engagement ${i + 1} — texte`);
});
section('Quelques repères');
field('apropos.reperesTitre', t.apropos.figuresTitle, 'Sur-titre');
t.apropos.figures.forEach((f, i) => {
  field(`apropos.repere.${i + 1}.valeur`, f.value, `Repère ${i + 1} — chiffre`);
  field(`apropos.repere.${i + 1}.libelle`, f.label, `Repère ${i + 1} — légende`);
});
section('Image de fin');
fields('apropos', t.apropos, ['closing', 'closingCta']);

/* ------- pro ------- */
chapter('Page « Espace professionnels »');
section('Référencement de la page');
fields('pro', t.pro, ['seoTitle', 'seoDescription']);
section('En-tête');
fields('pro', t.pro, ['label', 'title', 'intro', 'cta']);
section('Nos engagements');
field('pro.engagementsTitre', t.pro.commitmentsTitle, 'Sur-titre');
t.pro.commitments.forEach((c, i) => {
  field(`pro.engagement.${i + 1}.titre`, c.title, `Engagement ${i + 1} — titre`);
  field(`pro.engagement.${i + 1}.texte`, c.text, `Engagement ${i + 1} — texte`);
});
section('L’offre professionnelle');
fields('pro', t.pro, ['offerTitle', 'forWhoText']);
t.pro.offers.forEach((o, i) => {
  field(`pro.offre.${i + 1}.titre`, o.title, `Offre ${i + 1} — titre`);
  field(`pro.offre.${i + 1}.texte`, o.text, `Offre ${i + 1} — texte`);
});
t.pro.forWho.forEach((w, i) => field(`pro.cible.${i + 1}`, w, `Type de client ${i + 1}`));
section('Comment démarrer');
field('pro.demarrerTitre', t.pro.stepsTitle, 'Sur-titre');
t.pro.steps.forEach((s, i) => {
  field(`pro.etape.${i + 1}.titre`, s.title, `Étape ${i + 1} — titre`);
  field(`pro.etape.${i + 1}.texte`, s.text, `Étape ${i + 1} — texte`);
});
section('Bandeau de contact');
fields('pro', t.pro, ['contactTitle', 'contactText', 'formIntro']);

/* ------- journal ------- */
chapter('Page « Journal »');
note('Cette page liste les articles. Le texte des articles eux-mêmes se modifie ailleurs — dites-moi si vous voulez un document par article.');
section('Référencement de la page');
fields('journal', t.journal, ['seoTitle', 'seoDescription']);
section('En-tête');
fields('journal', t.journal, ['label', 'title', 'intro']);

/* ------- faq ------- */
chapter('Page « Questions fréquentes »');
section('Référencement de la page');
fields('faq', t.faq, ['seoTitle', 'seoDescription']);
section('En-tête');
fields('faq', t.faq, ['label', 'title', 'intro']);
t.faq.items.forEach((item, i) => {
  section(`Question ${i + 1}`);
  field(`faq.${i + 1}.question`, item.q, 'Question');
  field(`faq.${i + 1}.reponse`, item.a, 'Réponse');
});

/* ------- contact ------- */
chapter('Page « Contact »');
section('Référencement de la page');
fields('contact', t.contact, ['seoTitle', 'seoDescription']);
section('En-tête');
fields('contact', t.contact, ['label', 'title', 'intro']);
section('Les trois interlocuteurs');
fields('contact', t.contact, ['generalTitle', 'generalText', 'proTitle', 'proText', 'pressTitle', 'pressText']);
section('Atelier');
fields('contact', t.contact, ['hoursTitle', 'hoursText']);

/* ------- pied de page ------- */
chapter('Pied de page et newsletter');
section('Newsletter');
field('newsletter.titre', t.common.newsletterTitle, 'Titre');
field('newsletter.texte', t.common.newsletterText, 'Texte');
field('newsletter.bouton', t.common.newsletterCta, 'Bouton');
field('newsletter.confirmation', t.common.newsletterOk, 'Message de confirmation');
section('Mentions du pied de page');
fields('piedDePage', t.footer, ['tagline', 'rights', 'payment']);

/* ------- juridique ------- */
const legalChapter = (titre, prefix, sections) => {
  chapter(titre);
  note('Document à compléter avec vos informations légales définitives (SIREN, RCS, TVA, hébergeur).');
  sections.forEach((s, i) => {
    section(`${i + 1}. ${s.title}`);
    field(`${prefix}.${i + 1}.titre`, s.title, 'Titre de la partie');
    s.body.forEach((para, j) => field(`${prefix}.${i + 1}.paragraphe.${j + 1}`, para, `Paragraphe ${j + 1}`));
  });
};
legalChapter('Mentions légales', 'mentions', mentions.fr);
legalChapter('Conditions générales de vente', 'cgv', cgv.fr);

/* ------- libellés d'interface ------- */
chapter('Petits libellés d’interface');
note('Ces mots courts apparaissent dans le menu, les boutons et le panier. Ils changent rarement — ne les modifiez que si vous en avez vraiment besoin.');
section('Menu');
fields('menu', t.nav, ['origine', 'cafes', 'savoirFaire', 'journal', 'apropos', 'pro', 'faq', 'contact', 'account', 'cart']);
section('Boutons et mentions de la fiche produit');
field('bouton.ajouterAuPanier', t.common.addToCart, 'Bouton d’achat');
field('produit.fraicheur', t.product.freshness, 'Mention de fraîcheur');
field('produit.expedition', t.product.shipping, 'Mention d’expédition');
field('produit.aProposTitre', t.product.aboutTitle, 'Titre « À propos de ce café »');
field('produit.similairesTitre', t.product.relatedTitle, 'Titre « Vous aimerez aussi »');
field('produit.fermeCta', t.product.farmCta, 'Lien « Découvrir la ferme »');
field('produit.preparationTitre', t.product.brewTitle, 'Titre « Conseils de préparation »');
section('Panier');
fields('panier', t.cart, ['title', 'empty', 'total', 'checkout', 'continue', 'notice']);

/* ---------------------------------------------------------------- sorties */
await mkdir(OUT, { recursive: true });

/* --- version texte --- */
const md = [];
md.push('# Yunma — textes du site (français)', '');
md.push(`_Document généré le ${new Date().toLocaleDateString('fr-FR')} à partir du site. Modifiez les textes sous les codes entre crochets, sans toucher aux codes eux-mêmes._`, '');
for (const item of doc) {
  if (item.type === 'chapter') md.push('', `## ${item.title}`, '');
  else if (item.type === 'section') md.push('', `### ${item.title}`, '');
  else if (item.type === 'note') md.push(`> ${item.text}`, '');
  else {
    md.push(`**${item.label}** \`[${item.code}]\``);
    md.push(...item.lines);
    md.push('');
  }
}
await writeFile(path.join(OUT, 'textes-yunma-fr.md'), md.join('\n'), 'utf8');

/* --- version Word --- */
let docxWritten = false;
try {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = await import('docx');
  const children = [];
  children.push(
    new Paragraph({ text: 'Yunma — textes du site', heading: HeadingLevel.TITLE }),
    new Paragraph({
      spacing: { after: 320 },
      children: [
        new TextRun({
          text: `Français. Document généré le ${new Date().toLocaleDateString('fr-FR')}. Modifiez les textes sous les codes entre crochets, sans toucher aux codes.`,
          italics: true,
          color: '666660',
        }),
      ],
    })
  );
  for (const item of doc) {
    if (item.type === 'chapter') {
      children.push(
        new Paragraph({
          text: item.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 520, after: 200 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'C9C3B4', space: 6 } },
        })
      );
    } else if (item.type === 'section') {
      children.push(new Paragraph({ text: item.title, heading: HeadingLevel.HEADING_2, spacing: { before: 340, after: 140 } }));
    } else if (item.type === 'note') {
      children.push(
        new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: item.text, italics: true, color: '55524A' })] })
      );
    } else {
      children.push(
        new Paragraph({
          spacing: { before: 200, after: 40 },
          children: [
            new TextRun({ text: item.label, bold: true, size: 19, color: '55524A' }),
            new TextRun({ text: `   [${item.code}]`, size: 19, color: 'B95F2C' }),
          ],
        })
      );
      for (const line of item.lines) {
        children.push(new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: line, size: 22 })] }));
      }
      if (item.lines.length > 1) {
        children.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({ text: '↑ les retours à la ligne ci-dessus sont volontaires', size: 15, italics: true, color: '9A958A' })],
          })
        );
      }
    }
  }
  const document = new Document({
    creator: 'Yunma',
    title: 'Yunma — textes du site',
    styles: { default: { document: { run: { font: 'Helvetica', size: 22, color: '212121' } } } },
    sections: [{ properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } }, children }],
  });
  await writeFile(path.join(OUT, 'textes-yunma-fr.docx'), await Packer.toBuffer(document));
  docxWritten = true;
} catch (error) {
  console.warn('Document Word non généré (npm i -D docx pour l’activer) :', error.message);
}

const count = doc.filter((d) => d.type === 'field').length;
console.log(`${count} textes exportés · contenu/textes-yunma-fr.md${docxWritten ? ' + .docx' : ''}`);
