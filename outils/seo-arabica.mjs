/**
 * La tête et le texte de l'atlas, pour chacune des trois langues.
 *
 * L'atlas est une application : sans script, la page est vide. Or ni Google
 * ni les robots des moteurs de réponse — GPTBot, ClaudeBot, PerplexityBot —
 * n'exécutent de script. Une page de 480 Ko qui ne dit rien à la lecture ne
 * sera donc jamais citée, et c'est dommage pour un travail qui porte
 * soixante-cinq variétés sourcées, une chronologie et sept terroirs.
 *
 * On écrit donc le texte dans la page. Le même texte que l'atlas affiche,
 * tiré des mêmes tables : il n'y a pas une version pour les robots et une
 * pour les gens. Le script le masque en démarrant, et la page « Lire tout
 * l'atlas » le rouvre.
 *
 * Trois langues, trois adresses — /arabica/, /arabica/en/, /arabica/zh/ —
 * parce qu'un moteur n'indexe qu'une langue par adresse, et parce qu'un
 * lien partagé doit emmener le lecteur dans la langue où on l'a lu.
 */

export const LANGUES = ['fr', 'en', 'zh'];
export const SITE = 'https://yunma.fr';
export const CHEMIN = { fr: '/arabica/', en: '/arabica/en/', zh: '/arabica/zh/' };
const HREFLANG = { fr: 'fr', en: 'en', zh: 'zh-Hans' };
const BALISE = { fr: 'fr', en: 'en', zh: 'zh-CN' };

/** Découpe `const NOM = …` en comptant les accolades, les chaînes exclues. */
export function declaration(src, nom) {
  const i = src.indexOf('const ' + nom + '=');
  if (i < 0) throw new Error(`déclaration absente : ${nom}`);
  let k = src.indexOf('=', i) + 1;
  const ouvre = src[k];
  if (ouvre !== '{' && ouvre !== '[') throw new Error(`${nom} n'est ni un objet ni un tableau`);
  const ferme = ouvre === '{' ? '}' : ']';
  let prof = 0, q = null;
  for (; k < src.length; k++) {
    const c = src[k];
    if (q) { if (c === '\\') { k++; continue; } if (c === q) q = null; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if (c === ouvre) prof++;
    else if (c === ferme) { prof--; if (!prof) return src.slice(i, k + 1); }
  }
  throw new Error(`${nom} : accolade non refermée`);
}

const NOMS = ['GROUPS', 'GROUPS_L', 'SRC', 'NODES', 'NODES_L', 'YLINKS', 'YL_L',
  'EVENTS', 'EVENTS_L', 'REGIONS', 'REGIONS_L', 'LOTS', 'PROC_L', 'UI'];

/** Les tables de l'atlas, lues depuis sa source. */
export function donnees(atlas) {
  const src = NOMS.map((n) => declaration(atlas, n) + ';').join('\n') + `\nreturn {${NOMS.join(',')}};`;
  return new Function('RUST', 'VRGB', src)('#a84f26', [168, 79, 38]);
}

const ech = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Les quelques phrases qui n'existent que dans la version texte : un titre,
   une introduction, les intertitres. Le reste vient des tables de l'atlas. */
const T = {
  fr: {
    titre: 'Atlas des variétés de café — Yunma',
    h1: 'L’atlas des variétés de café',
    desc: 'Les 65 variétés et espèces de caféier, leur parenté, leur date et leur lien avec le Yunnan — avec les sources. Une généalogie du café en trois dimensions, en français, anglais et chinois.',
    chapo: 'Cette page est la version lisible de l’atlas de Yunma : la généalogie des caféiers, du Coffea arabica né d’un croisement naturel en Éthiopie jusqu’aux variétés plantées aujourd’hui au Yunnan. Elle recense {n} variétés, espèces et populations, la chronologie du café au Yunnan et ses sept terroirs. L’atlas interactif se visite en trois dimensions ; ce texte en porte tout le contenu.',
    ouvrir: 'Ouvrir l’atlas en trois dimensions',
    hv: 'Les variétés, par lignée',
    hy: 'Le café au Yunnan, par année',
    ha: 'Les variétés arrivées au Yunnan',
    ht: 'Les sept terroirs',
    hl: 'Les quinze premiers lots du Gems of Yunnan 2026',
    hs: 'Sources',
    date: 'Date', lieu: 'Lieu', lignee: 'Lignée', parents: 'Parents', yun: 'Au Yunnan',
    alt: 'Altitude', note: 'Note', ferme: 'Ferme', region: 'Région', variete: 'Variété', proc: 'Procédé',
    langues: 'Cette page existe aussi en', site: 'Yunma — cafés de spécialité du Yunnan',
  },
  en: {
    titre: 'Coffee variety atlas — Yunma',
    h1: 'The coffee variety atlas',
    desc: 'The 65 coffee varieties and species, their parentage, their date and their link with Yunnan — with sources. A genealogy of coffee in three dimensions, in French, English and Chinese.',
    chapo: 'This page is the readable version of Yunma’s atlas: the genealogy of the coffee tree, from the Coffea arabica born of a natural cross in Ethiopia to the varieties planted in Yunnan today. It lists {n} varieties, species and populations, the timeline of coffee in Yunnan and its seven growing regions. The interactive atlas is explored in three dimensions; this text carries all of its content.',
    ouvrir: 'Open the atlas in three dimensions',
    hv: 'The varieties, by lineage',
    hy: 'Coffee in Yunnan, year by year',
    ha: 'The varieties that reached Yunnan',
    ht: 'The seven growing regions',
    hl: 'The Gems of Yunnan 2026 top fifteen',
    hs: 'Sources',
    date: 'Date', lieu: 'Place', lignee: 'Lineage', parents: 'Parents', yun: 'In Yunnan',
    alt: 'Altitude', note: 'Score', ferme: 'Farm', region: 'Region', variete: 'Variety', proc: 'Process',
    langues: 'This page also exists in', site: 'Yunma — Yunnan specialty coffee',
  },
  zh: {
    titre: '咖啡品种图谱 — Yunma 云马',
    h1: '咖啡品种图谱',
    desc: '65 个咖啡品种与物种，它们的亲缘关系、年代及与云南的关联，并附资料来源。一部三维的咖啡谱系，提供法语、英语和中文三种语言。',
    chapo: '本页是 Yunma 云马图谱的文字版：咖啡树的谱系，从在埃塞俄比亚由自然杂交诞生的阿拉比卡，一直到今天种植在云南的品种。收录 {n} 个品种、物种与地方种群，云南咖啡的年表，以及七个产区。交互式图谱以三维方式浏览；本页文字承载其全部内容。',
    ouvrir: '打开三维图谱',
    hv: '品种，按谱系',
    hy: '云南咖啡年表',
    ha: '传入云南的品种',
    ht: '七个产区',
    hl: 'Gems of Yunnan 2026 前十五名',
    hs: '资料来源',
    date: '年代', lieu: '地点', lignee: '谱系', parents: '亲本', yun: '在云南',
    alt: '海拔', note: '分数', ferme: '庄园', region: '产区', variete: '品种', proc: '处理法',
    langues: '本页还提供', site: 'Yunma 云马 — 云南精品咖啡',
  },
};

/** Un nœud, dans la langue demandée : le français est la source. */
function noeud(D, n, l) {
  const o = l === 'fr' ? {} : (D.NODES_L[l] || {})[n.id] || {};
  const champ = (k) => (k in o ? o[k] : n[k]);
  return { id: n.id, n: champ('n'), alt: champ('alt'), yl: champ('yl'), pl: champ('pl'), d: champ('d'), yun: champ('yun'), g: n.g, y: n.y, p: n.p };
}

/** Le texte complet de l'atlas, en HTML, dans une langue. */
export function lecture(D, l) {
  const t = T[l], U = D.UI[l] || D.UI.fr;
  const N = D.NODES.map((n) => noeud(D, n, l));
  const parId = Object.fromEntries(N.map((n) => [n.id, n]));
  const groupes = l === 'fr' ? Object.fromEntries(Object.entries(D.GROUPS).map(([k, g]) => [k, g.l])) : D.GROUPS_L[l];
  const o = [];
  o.push(`<div id="lecture" class="lecture">`);
  o.push(`<h1>${ech(t.h1)}</h1>`);
  o.push(`<p>${ech(t.chapo.replace('{n}', String(N.length)))}</p>`);
  o.push(`<p><a href="#arbre">${ech(t.ouvrir)} →</a></p>`);

  o.push(`<h2>${ech(t.hv)}</h2>`);
  for (const [cle, nom] of Object.entries(groupes)) {
    const dedans = N.filter((n) => n.g === cle).sort((a, b) => a.y - b.y);
    if (!dedans.length) continue;
    o.push(`<h3>${ech(nom)}</h3>`);
    for (const n of dedans) {
      o.push(`<h4>${ech(n.n)}${n.alt ? ` <em>${ech(n.alt)}</em>` : ''}</h4>`);
      const meta = [`${ech(t.date)} : ${ech(n.yl)}`, `${ech(t.lieu)} : ${ech(n.pl)}`];
      if (n.p && n.p.length) meta.push(`${ech(t.parents)} : ${n.p.map(([id]) => ech(parId[id] ? parId[id].n : id)).join(', ')}`);
      o.push(`<p class="m">${meta.join(' · ')}</p>`);
      if (n.d) o.push(`<p>${ech(n.d)}</p>`);
      if (n.yun) o.push(`<p class="y"><b>${ech(t.yun)}</b> — ${ech(n.yun)}</p>`);
    }
  }

  o.push(`<h2>${ech(t.hy)}</h2>`);
  o.push(`<p>${ech(U.yLead)}</p>`);
  D.EVENTS.forEach((e, i) => {
    const tr = l === 'fr' ? [e.t, e.d] : (D.EVENTS_L[l] || [])[i] || [e.t, e.d];
    o.push(`<h3>${e.y} — ${ech(tr[0])}</h3><p>${ech(tr[1])}</p>`);
  });

  o.push(`<h2>${ech(t.ha)}</h2><ul>`);
  D.YLINKS.forEach(([id, an, note], i) => {
    const tx = l === 'fr' ? note : (D.YL_L[l] || [])[i] || note;
    const n = parId[id];
    o.push(`<li>${an >= 2026 ? ech(U.yAuj) : an} — <b>${ech(n ? n.n : id)}</b> : ${ech(tx)}</li>`);
  });
  o.push(`</ul>`);

  o.push(`<h2>${ech(t.ht)}</h2>`);
  o.push(`<p>${ech(U.tLead)}</p>`);
  for (const r of D.REGIONS) {
    const tr = l === 'fr' ? [r.n, r.d, r.d2] : (D.REGIONS_L[l] || {})[r.id] || [r.n, r.d, r.d2];
    o.push(`<h3>${ech(tr[0])}${l !== 'zh' && r.zh ? ` <em>${ech(r.zh)}</em>` : ''}</h3>`);
    o.push(`<p class="m">${r.lat.toFixed(2)}° N, ${r.lon.toFixed(2)}° E</p>`);
    if (tr[2]) o.push(`<p>${ech(tr[2])}</p>`);
    else if (tr[1]) o.push(`<p>${ech(tr[1])}</p>`);
  }

  /* Un lot : rang, note, producteur, ferme, identifiant de région, nom de
     la région, procédé, variété, altitude basse et haute. Les procédés et
     les noms de variété se traduisent par PROC_L, comme dans l'atlas. */
  const TL = (v) => (l === 'fr' ? v : ((D.PROC_L[l] || {})[v] || v));
  o.push(`<h2>${ech(t.hl)}</h2><ol>`);
  for (const [rang, note, prod, ferme, , region, procede, variete, a0, a1] of D.LOTS) {
    const haut = a1 !== a0 ? `${a0}–${a1}` : `${a0}`;
    o.push(`<li>${ech(TL(ferme))} — ${ech(prod)} · ${ech(TL(region))} · ${ech(TL(variete))} · ${ech(TL(procede))} · ${haut} m · ${note} ${ech(U.pts)} <span class="m">(${t.note} ${rang}/15)</span></li>`);
  }
  o.push(`</ol>`);

  o.push(`<h2>${ech(t.hs)}</h2><ol>`);
  for (const s of Object.values(D.SRC)) o.push(`<li><a href="${ech(s[1])}" rel="noopener nofollow">${ech(s[0])}</a></li>`);
  o.push(`</ol>`);

  const autres = LANGUES.filter((x) => x !== l);
  const nom = { fr: 'Français', en: 'English', zh: '简体中文' };
  o.push(`<p class="m">${ech(t.langues)} ${autres.map((x) => `<a href="${SITE}${CHEMIN[x]}" hreflang="${HREFLANG[x]}">${ech(nom[x])}</a>`).join(' · ')} — <a href="${SITE}/">${ech(t.site)}</a></p>`);
  o.push(`</div>`);
  return o.join('\n');
}

/** La tête de la page, dans une langue. */
export function tete(D, l) {
  const t = T[l], N = D.NODES.length;
  const url = SITE + CHEMIN[l];
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': url + '#atlas',
        name: t.h1,
        url,
        inLanguage: HREFLANG[l],
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        browserRequirements: 'WebGL',
        description: t.desc,
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
        about: [
          { '@type': 'Thing', name: 'Coffea arabica' },
          { '@type': 'Thing', name: 'Yunnan' },
          { '@type': 'Thing', name: l === 'zh' ? '咖啡品种' : l === 'en' ? 'Coffee varieties' : 'Variétés de café' },
        ],
        publisher: { '@type': 'Organization', name: 'Yunma', url: SITE + '/' },
      },
      {
        '@type': 'Dataset',
        '@id': url + '#donnees',
        name: t.h1,
        description: t.desc,
        url,
        inLanguage: HREFLANG[l],
        license: SITE + '/',
        creator: { '@type': 'Organization', name: 'Yunma', url: SITE + '/' },
        keywords: ['Coffea arabica', 'Coffea canephora', 'Yunnan', 'Typica', 'Bourbon', 'Catimor', 'Geisha', 'Hybride de Timor'],
        variableMeasured: [
          { '@type': 'PropertyValue', name: l === 'zh' ? '品种' : l === 'en' ? 'Varieties' : 'Variétés', value: N },
          { '@type': 'PropertyValue', name: l === 'zh' ? '年表条目' : l === 'en' ? 'Timeline entries' : 'Entrées de chronologie', value: D.EVENTS.length },
          { '@type': 'PropertyValue', name: l === 'zh' ? '产区' : l === 'en' ? 'Growing regions' : 'Terroirs', value: D.REGIONS.length },
          { '@type': 'PropertyValue', name: l === 'zh' ? '参考资料' : l === 'en' ? 'References' : 'Références', value: Object.keys(D.SRC).length },
        ],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Yunma', item: SITE + '/' + (l === 'fr' ? 'fr/' : l + '/') },
          { '@type': 'ListItem', position: 2, name: t.h1, item: url },
        ],
      },
    ],
  };
  const lignes = [
    `<title>${ech(t.titre)}</title>`,
    `<meta name="description" content="${ech(t.desc)}">`,
    `<link rel="canonical" href="${url}">`,
    ...LANGUES.map((x) => `<link rel="alternate" hreflang="${HREFLANG[x]}" href="${SITE}${CHEMIN[x]}">`),
    `<link rel="alternate" hreflang="x-default" href="${SITE}${CHEMIN.fr}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Yunma">`,
    `<meta property="og:locale" content="${l === 'zh' ? 'zh_CN' : l === 'en' ? 'en_GB' : 'fr_FR'}">`,
    `<meta property="og:title" content="${ech(t.titre)}">`,
    `<meta property="og:description" content="${ech(t.desc)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${SITE}/og/arabica-og.png">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${ech(t.titre)}">`,
    `<meta name="twitter:description" content="${ech(t.desc)}">`,
    `<meta name="twitter:image" content="${SITE}/og/arabica-og.png">`,
    `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>`,
  ];
  return lignes.join('\n');
}

export { BALISE, HREFLANG };
