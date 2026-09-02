export type Lang = 'fr' | 'en' | 'zh';
export type L = Record<Lang, string>;

export type Variant = {
  /** ID de variante Shopify (Storefront API, format gid://shopify/ProductVariant/...) */
  shopifyVariantId: string;
  label: L;
  price: number;
  weightGrams: number;
  available: boolean;
};

export type Product = {
  slug: string;
  sku: string;
  category: 'grain' | 'drip' | 'set';
  visual: 'bag-01' | 'bag-03' | 'bag-05' | 'box' | 'bundle';
  /** Handle produit Shopify (utile pour les liens directs et le SAV) */
  shopifyHandle: string;
  shopifyProductId: string;
  variants: Variant[];
  name: L;
  lot: string;
  subtitle: L;
  short: L;
  description: L;
  story: L;
  /** Reprend les mentions portées sur l'étiquette du sachet. */
  specs: {
    origin: L;
    altitude: L;
    variety: L;
    process: L;
    notes: L;
    drying: L;
    harvest: L;
    /** Profil : filtre ou espresso, comme indiqué sur l'étiquette. */
    roast: L;
  };
  brew: L;
  includes?: L[];
  /** Ferme productrice, présentée directement sur la fiche produit. */
  farm: {
    name: string;
    place: L;
    text: L;
    photo: 'recolte-cueilleurs' | 'cretes-brumeuses' | 'cerises-branche' | 'sechage-lits' | 'tabouret-terrasse';
  };
  related: string[];
};

/* Les fermes reviennent sur plusieurs produits : on les décrit une seule fois. */
const torchEstate = {
  name: 'Torch Estate',
  place: { fr: 'Pu’er, Yunnan', en: 'Pu’er, Yunnan', zh: '云南 普洱' },
  text: {
    fr: "Torch Estate cultive ses parcelles dans les collines de Pu’er, autour de 1 450 mètres. C’est de cette même ferme que viennent nos deux lots honey : le Lot.01 en fermentation anaérobie double, le Lot.02 en honey traditionnel. Même terre, même variété, deux traitements — et deux tasses qui n’ont presque rien en commun.",
    en: 'Torch Estate farms its plots in the hills of Pu’er, at around 1,450 metres. Both our honey lots come from this same farm: Lot.01 in double anaerobic fermentation, Lot.02 in traditional honey. Same soil, same variety, two processes — and two cups with almost nothing in common.',
    zh: '火炬庄园（Torch Estate）的地块位于普洱丘陵地带，海拔约 1450 米。我们两支蜜处理批次都来自这座农场：Lot.01 采用双重厌氧发酵，Lot.02 为传统蜜处理。同一片土地、同一个品种、两种处理法——两杯几乎毫无共同之处的咖啡。',
  },
  photo: 'recolte-cueilleurs',
} as const;

const yunLanEstate = {
  name: 'Yun Lan Estate',
  place: { fr: 'Xishuangbanna, Yunnan', en: 'Xishuangbanna, Yunnan', zh: '云南 西双版纳' },
  text: {
    fr: "Yun Lan Estate se trouve à Xishuangbanna, à l’extrême sud du Yunnan, entre 1 600 et 1 800 mètres — les parcelles les plus hautes avec lesquelles nous travaillons. La ferme y cultive du Pacamara, une variété rare, peu productive et difficile à mener, qu’elle traite en lavé traditionnel.",
    en: 'Yun Lan Estate sits in Xishuangbanna, at the far south of Yunnan, between 1,600 and 1,800 metres — the highest plots we work with. The farm grows Pacamara there, a rare variety, low-yielding and demanding, processed with a traditional washed method.',
    zh: '云澜庄园（Yun Lan Estate）位于云南最南端的西双版纳，海拔 1600 至 1800 米，是我们合作地块中最高的一处。农场在此种植瑰夏之外少见的帕卡马拉：产量低、管理难，采用传统水洗处理。',
  },
  photo: 'cretes-brumeuses',
} as const;

const gaoshen = {
  name: 'Ferme de Gaoshen',
  place: { fr: 'Baoshan, Yunnan', en: 'Baoshan, Yunnan', zh: '云南 保山' },
  text: {
    fr: "À Gaoshen, sur les hauteurs de Baoshan, une même exploitation conduit côte à côte deux variétés que tout oppose en tasse. Le Catimor occupe les parcelles basses, plus exposées ; le Bourbon jaune, plus fragile et deux fois moins productif, est réservé aux terrasses hautes. Les deux sont récoltés, lavés et séchés exactement de la même manière — c’est ce qui rend la comparaison possible.",
    en: 'At Gaoshen, above Baoshan, a single estate grows side by side two varieties that oppose each other in the cup. Catimor takes the lower, more exposed plots; Yellow Bourbon, more fragile and half as productive, is kept for the high terraces. Both are picked, washed and dried in exactly the same way — which is what makes the comparison possible.',
    zh: '在保山高处的高神，同一座农场并排种植着两个在杯中截然不同的品种。卡蒂姆种在较低、日照更强的地块；更娇弱、产量只有一半的黄波旁则留给高处的梯田。两者的采摘、水洗与晾晒完全一致——正因如此，比较才有意义。',
  },
  photo: 'sechage-lits',
} as const;

export const products: Product[] = [
  {
    slug: 'torch-estate-lot-01',
    sku: 'YUN-TORCH-01-200',
    category: 'grain',
    visual: 'bag-01',
    shopifyHandle: 'torch-estate-lot-01',
    shopifyProductId: '',
    variants: [
      {
        shopifyVariantId: '',
        label: { fr: '200 g', en: '200 g', zh: '200 克' },
        price: 19,
        weightGrams: 200,
        available: true,
      },
    ],
    lot: 'Lot.01',
    name: { fr: 'Torch Estate, Lot.01', en: 'Torch Estate, Lot.01', zh: 'Torch Estate, Lot.01' },
    subtitle: { fr: 'Pu’er', en: 'Pu’er', zh: '普洱' },
    short: {
      fr: 'Fruits tropicaux, baies, vin rouge.',
      en: 'Tropical fruit, berries, red wine.',
      zh: '热带水果、莓果、红酒。',
    },
    description: {
      fr: "Une double fermentation anaérobie, menée en cuve fermée avant le séchage en honey. Le résultat est franchement aromatique : fruits tropicaux mûrs, baies, une finale qui tire vers le vin rouge. C’est notre lot le plus démonstratif, celui que l’on sert quand quelqu’un doute encore de ce que le Yunnan sait faire.",
      en: 'A double anaerobic fermentation, carried out in sealed tanks before honey drying. The result is frankly aromatic: ripe tropical fruit, berries, a finish leaning towards red wine. It is our most demonstrative lot, the one we serve when someone still doubts what Yunnan can do.',
      zh: '干燥前先在密闭槽中完成双重厌氧发酵，再以蜜处理晾晒。风味非常外放：成熟热带水果、莓果，尾韵偏向红酒。这是我们最具说服力的一支——当有人仍怀疑云南能做出什么时，我们就冲这一支。',
    },
    story: {
      fr: "La fermentation anaérobie double demande une discipline que peu de fermes acceptent : deux cycles en cuve fermée, chacun suivi en température et en pH, sans marge d’erreur. Un degré de trop et le lot part en vinaigre. Torch Estate s’y est mise il y a trois récoltes, en commençant par des micro-lots de quelques sacs.",
      en: 'Double anaerobic fermentation demands a discipline few farms accept: two sealed-tank cycles, each monitored for temperature and pH, with no margin for error. One degree too many and the lot turns to vinegar. Torch Estate took it up three harvests ago, starting with micro-lots of a few bags.',
      zh: '双重厌氧发酵需要极少农场愿意承担的纪律：两轮密闭发酵，全程监控温度与 pH，没有容错空间。高一度，这支批次就会变成醋。火炬庄园从三个产季前开始尝试，最初只做几袋的微批次。',
    },
    specs: {
      origin: { fr: 'Yunnan, Chine — Pu’er', en: 'Yunnan, China — Pu’er', zh: '中国云南 — 普洱' },
      altitude: { fr: '1 450 m', en: '1,450 m', zh: '1450 米' },
      variety: { fr: 'Catimor', en: 'Catimor', zh: '卡蒂姆' },
      process: { fr: 'Honey anaérobie double', en: 'Double anaerobic honey', zh: '双重厌氧蜜处理' },
      notes: {
        fr: 'Fruits tropicaux, baies, vin rouge',
        en: 'Tropical fruit, berries, red wine',
        zh: '热带水果、莓果、红酒',
      },
      drying: { fr: 'Lits africains surélevés', en: 'Raised African beds', zh: '非洲高架床' },
      harvest: { fr: 'À la main, cerises mûres', en: 'Hand-picked, ripe cherries', zh: '手工采摘，成熟果实' },
      roast: { fr: 'Filtre', en: 'Filter', zh: '手冲' },
    },
    brew: {
      fr: 'Filtre : 15 g pour 250 ml, eau à 93 °C, 2 min 45. Versements courts pour ne pas écraser le fruit.',
      en: 'Filter: 15 g per 250 ml, water at 93 °C, 2 min 45. Short pours so the fruit is not flattened.',
      zh: '手冲：15 克 / 250 毫升，93 °C，2 分 45 秒。分段小水流注水，避免压过果香。',
    },
    farm: torchEstate,
    related: ['torch-estate-lot-02', 'yun-lan-estate', 'coffret-decouverte'],
  },
  {
    slug: 'torch-estate-lot-02',
    sku: 'YUN-TORCH-02-200',
    category: 'grain',
    visual: 'bag-03',
    shopifyHandle: 'torch-estate-lot-02',
    shopifyProductId: '',
    variants: [
      {
        shopifyVariantId: '',
        label: { fr: '200 g', en: '200 g', zh: '200 克' },
        price: 18,
        weightGrams: 200,
        available: true,
      },
    ],
    lot: 'Lot.02',
    name: { fr: 'Torch Estate, Lot.02', en: 'Torch Estate, Lot.02', zh: 'Torch Estate, Lot.02' },
    subtitle: { fr: 'Pu’er', en: 'Pu’er', zh: '普洱' },
    short: {
      fr: 'Citron vert, olive, liqueur de cacao.',
      en: 'Lime, olive, cacao liqueur.',
      zh: '青柠、橄榄、可可利口酒。',
    },
    description: {
      fr: "Un honey traditionnel, pensé pour l’espresso. La mucilage laissée sur le grain donne du corps et une douceur de liqueur de cacao, que vient trancher une acidité de citron vert. Cette note d’olive, presque saline, est la signature de la parcelle : on la retrouve d’une récolte à l’autre.",
      en: 'A traditional honey process, built for espresso. The mucilage left on the bean gives body and a cacao-liqueur sweetness, cut through by a lime acidity. That olive note, almost saline, is the plot’s signature: it comes back from one harvest to the next.',
      zh: '传统蜜处理，为意式浓缩而做。保留在豆表的果胶带来厚度与可可利口酒般的甜感，被青柠的酸质切开。那一丝近乎咸感的橄榄气息是这块地的签名，年年如约而至。',
    },
    story: {
      fr: "C’est le lot que nous buvons le plus souvent à l’atelier, en espresso serré le matin. Il tient aussi remarquablement bien au lait : la liqueur de cacao ressort, l’acidité se range. Si vous n’avez qu’une machine et pas envie de réfléchir, prenez celui-là.",
      en: 'This is the lot we drink most at the roastery, as a tight espresso in the morning. It also holds up remarkably well in milk: the cacao liqueur comes forward, the acidity steps back. If you own one machine and would rather not think about it, take this one.',
      zh: '这是我们在工坊里喝得最多的一支，早晨做浓缩。它与牛奶的融合也非常出色：可可利口酒的甜感浮上来，酸质退到后面。如果您只有一台机器、又不想多想，就选它。',
    },
    specs: {
      origin: { fr: 'Yunnan, Chine — Pu’er', en: 'Yunnan, China — Pu’er', zh: '中国云南 — 普洱' },
      altitude: { fr: '1 300 – 1 500 m', en: '1,300 – 1,500 m', zh: '1300 – 1500 米' },
      variety: { fr: 'Catimor', en: 'Catimor', zh: '卡蒂姆' },
      process: { fr: 'Honey traditionnel', en: 'Traditional honey', zh: '传统蜜处理' },
      notes: {
        fr: 'Citron vert, olive, liqueur de cacao',
        en: 'Lime, olive, cacao liqueur',
        zh: '青柠、橄榄、可可利口酒',
      },
      drying: { fr: 'Lits africains surélevés', en: 'Raised African beds', zh: '非洲高架床' },
      harvest: { fr: 'À la main, cerises mûres', en: 'Hand-picked, ripe cherries', zh: '手工采摘，成熟果实' },
      roast: { fr: 'Espresso', en: 'Espresso', zh: '意式浓缩' },
    },
    brew: {
      fr: 'Espresso : 18 g pour 40 g en 26 secondes, eau à 92 °C. En filtre, allonger à 15 g pour 260 ml.',
      en: 'Espresso: 18 g for 40 g in 26 seconds, water at 92 °C. For filter, stretch to 15 g per 260 ml.',
      zh: '意式：18 克粉萃取 40 克液，26 秒，92 °C。手冲则改为 15 克 / 260 毫升。',
    },
    farm: torchEstate,
    related: ['torch-estate-lot-01', 'yun-lan-estate', 'drip-bags-x8'],
  },
  {
    slug: 'yun-lan-estate',
    sku: 'YUN-YUNLAN-200',
    category: 'grain',
    visual: 'bag-05',
    shopifyHandle: 'yun-lan-estate',
    shopifyProductId: '',
    variants: [
      {
        shopifyVariantId: '',
        label: { fr: '200 g', en: '200 g', zh: '200 克' },
        price: 22,
        weightGrams: 200,
        available: true,
      },
    ],
    lot: 'Yun Lan',
    name: { fr: 'Yun Lan Estate', en: 'Yun Lan Estate', zh: 'Yun Lan Estate' },
    subtitle: { fr: 'Xishuangbanna', en: 'Xishuangbanna', zh: '西双版纳' },
    short: {
      fr: 'Pamplemousse, prune rouge, thé noir.',
      en: 'Grapefruit, red plum, black tea.',
      zh: '西柚、红李子、红茶。',
    },
    description: {
      fr: "Du Pacamara cultivé entre 1 600 et 1 800 mètres, traité en lavé traditionnel : rien pour masquer, rien pour ajouter. Ce qui reste, c’est la variété et l’altitude — une acidité de pamplemousse, une chair de prune rouge, et une longueur de thé noir qui tient bien après la tasse.",
      en: 'Pacamara grown between 1,600 and 1,800 metres, traditionally washed: nothing to mask, nothing to add. What remains is the variety and the altitude — a grapefruit acidity, red-plum flesh, and a black-tea length that stays well after the cup.',
      zh: '海拔 1600 至 1800 米的帕卡马拉，采用传统水洗：无所遮掩，也无所添加。留下的只有品种与海拔——西柚般的酸质、红李子的果肉感，以及杯尽之后仍在的红茶尾韵。',
    },
    story: {
      fr: "Le Pacamara est une variété encombrante : de grands arbres, de très gros grains, peu de rendement, et une sensibilité qui décourage la plupart des exploitations. Il en existe encore peu au Yunnan. Ce lot est le plus cher que nous proposons, et c’est aussi le seul dont nous savons, chaque année, qu’il partira avant les autres.",
      en: 'Pacamara is a cumbersome variety: tall trees, very large beans, low yields, and a sensitivity that discourages most estates. Little of it exists in Yunnan yet. This is the most expensive lot we offer, and the only one we know, every year, will sell out before the others.',
      zh: '帕卡马拉是个"麻烦"的品种：树体高大、豆粒极大、产量低，敏感得让多数农场却步。云南目前种植极少。这是我们价格最高的一支，也是唯一一支我们每年都确信会先卖完的。',
    },
    specs: {
      origin: { fr: 'Yunnan, Chine — Xishuangbanna', en: 'Yunnan, China — Xishuangbanna', zh: '中国云南 — 西双版纳' },
      altitude: { fr: '1 600 – 1 800 m', en: '1,600 – 1,800 m', zh: '1600 – 1800 米' },
      variety: { fr: 'Pacamara', en: 'Pacamara', zh: '帕卡马拉' },
      process: { fr: 'Lavé traditionnel', en: 'Traditional washed', zh: '传统水洗' },
      notes: {
        fr: 'Pamplemousse, prune rouge, thé noir',
        en: 'Grapefruit, red plum, black tea',
        zh: '西柚、红李子、红茶',
      },
      drying: { fr: 'Lits africains surélevés', en: 'Raised African beds', zh: '非洲高架床' },
      harvest: { fr: 'À la main, sélection 100 % mûre', en: 'Hand-picked, 100% ripe selection', zh: '手工采摘，全熟果选' },
      roast: { fr: 'Filtre', en: 'Filter', zh: '手冲' },
    },
    brew: {
      fr: 'Filtre : 15 g pour 250 ml, eau à 94 °C. Mouture un cran plus grossière que d’habitude — le Pacamara donne beaucoup, vite.',
      en: 'Filter: 15 g per 250 ml, water at 94 °C. Grind one notch coarser than usual — Pacamara gives a lot, fast.',
      zh: '手冲：15 克 / 250 毫升，94 °C。研磨比平时粗一档——帕卡马拉释放得又快又多。',
    },
    farm: yunLanEstate,
    related: ['torch-estate-lot-01', 'torch-estate-lot-02', 'coffret-decouverte'],
  },
  {
    slug: 'drip-bags-x8',
    sku: 'YUN-DRIP-8',
    category: 'drip',
    visual: 'box',
    shopifyHandle: 'drip-bags-boite-de-8',
    shopifyProductId: '',
    variants: [
      {
        shopifyVariantId: '',
        label: { fr: 'Boîte de 8', en: 'Box of 8', zh: '8 片装' },
        price: 14,
        weightGrams: 80,
        available: true,
      },
    ],
    lot: 'Drip',
    name: { fr: 'Drip Bags — Boîte de 8', en: 'Drip Bags — Box of 8', zh: '挂耳咖啡 — 8 片装' },
    subtitle: { fr: 'Assemblage de saison', en: 'Seasonal blend', zh: '当季拼配' },
    short: {
      fr: 'Un filtre propre, partout, en trois minutes.',
      en: 'A clean filter cup, anywhere, in three minutes.',
      zh: '三分钟，随处冲一杯干净的手冲。',
    },
    description: {
      fr: "Huit sachets filtres individuels de 10 g, moulus et conditionnés sous atmosphère protectrice le jour de la torréfaction. L’assemblage de saison réunit le honey de Torch Estate et le lavé de Gaoshen : du corps, du fruit, et assez de douceur pour se passer de sucre.",
      en: 'Eight individual 10 g filter sachets, ground and packed under protective atmosphere on roasting day. The seasonal blend brings together Torch Estate’s honey lot and Gaoshen’s washed lot: body, fruit, and enough sweetness to do without sugar.',
      zh: '八片独立滤袋，每片 10 克，于烘焙当天研磨并充氮封装。当季拼配融合火炬庄园的蜜处理与高神的水洗批次：有厚度、有果香，甜度足以不必加糖。',
    },
    story: {
      fr: "Pensés pour le bureau, le train et les matins pressés — sans jamais renoncer à la tasse. Posez le sachet sur votre mug, versez en trois fois, retirez : trois minutes, aucun matériel.",
      en: 'Made for the office, the train and rushed mornings — without ever giving up on the cup. Rest the sachet on your mug, pour in three stages, remove: three minutes, no equipment.',
      zh: '为办公室、旅途与匆忙的清晨而做，却不必牺牲杯中的品质。挂在杯口，分三次注水，取下即可：三分钟，无需器具。',
    },
    specs: {
      origin: { fr: 'Yunnan, Chine — Pu’er & Baoshan', en: 'Yunnan, China — Pu’er & Baoshan', zh: '中国云南 — 普洱与保山' },
      altitude: { fr: '1 300 – 1 750 m', en: '1,300 – 1,750 m', zh: '1300 – 1750 米' },
      variety: { fr: 'Catimor', en: 'Catimor', zh: '卡蒂姆' },
      process: { fr: 'Honey & lavé', en: 'Honey & washed', zh: '蜜处理与水洗' },
      notes: { fr: 'Amande, cacao au lait, fruits jaunes', en: 'Almond, milk cocoa, yellow fruit', zh: '杏仁、牛奶可可、黄色水果' },
      drying: { fr: 'Lits africains surélevés', en: 'Raised African beds', zh: '非洲高架床' },
      harvest: { fr: 'À la main, cerises mûres', en: 'Hand-picked, ripe cherries', zh: '手工采摘，成熟果实' },
      roast: { fr: 'Filtre', en: 'Filter', zh: '手冲' },
    },
    brew: {
      fr: 'Posez le sachet sur la tasse, versez 30 ml pour humidifier, attendez 30 secondes, puis complétez à 180 ml en deux versements.',
      en: 'Rest the sachet on the cup, pour 30 ml to bloom, wait 30 seconds, then top up to 180 ml in two pours.',
      zh: '将滤袋挂在杯口，先注入 30 毫升闷蒸 30 秒，再分两次注水至 180 毫升。',
    },
    includes: [
      { fr: '8 sachets filtres de 10 g', en: '8 filter sachets of 10 g', zh: '8 片 10 克滤袋' },
      { fr: 'Assemblage de saison, moulu du jour', en: 'Seasonal blend, ground that day', zh: '当季拼配，当日研磨' },
      { fr: 'Boîte recyclable', en: 'Recyclable box', zh: '可回收包装盒' },
    ],
    farm: torchEstate,
    related: ['drip-bags-a-composer', 'coffret-decouverte', 'torch-estate-lot-02'],
  },
  {
    slug: 'drip-bags-a-composer',
    sku: 'YUN-DRIP-COMPO',
    category: 'drip',
    visual: 'box',
    shopifyHandle: 'drip-bags-a-composer',
    shopifyProductId: '',
    variants: [
      {
        shopifyVariantId: '',
        label: { fr: '8 × Catimor', en: '8 × Catimor', zh: '8 片 卡蒂姆' },
        price: 15,
        weightGrams: 80,
        available: true,
      },
      {
        shopifyVariantId: '',
        label: { fr: '8 × Bourbon jaune', en: '8 × Yellow Bourbon', zh: '8 片 黄波旁' },
        price: 15,
        weightGrams: 80,
        available: true,
      },
      {
        shopifyVariantId: '',
        label: {
          fr: '4 × Catimor + 4 × Bourbon jaune',
          en: '4 × Catimor + 4 × Yellow Bourbon',
          zh: '4 片卡蒂姆 + 4 片黄波旁',
        },
        price: 15,
        weightGrams: 80,
        available: true,
      },
    ],
    lot: 'Drip',
    name: {
      fr: 'Drip Bags — Composez votre boîte',
      en: 'Drip Bags — Build your own box',
      zh: '挂耳咖啡 — 自选组合',
    },
    subtitle: { fr: 'Ferme de Gaoshen, Baoshan', en: 'Gaoshen farm, Baoshan', zh: '保山 高神农场' },
    short: {
      fr: 'Huit sachets, deux variétés, votre choix.',
      en: 'Eight sachets, two varieties, your choice.',
      zh: '八片滤袋，两种品种，由您决定。',
    },
    description: {
      fr: "Une boîte de huit drip bags composée par vous, à partir de deux variétés cultivées sur la même ferme, à Gaoshen : le Catimor, rond et cacaoté, et le Bourbon jaune, plus fin et floral. Prenez-en huit d’une seule, ou quatre de chaque pour les comparer tasse après tasse.",
      en: 'A box of eight drip bags composed by you, from two varieties grown on the same farm in Gaoshen: Catimor, round and cocoa-like, and Yellow Bourbon, finer and floral. Take eight of one, or four of each to compare them cup after cup.',
      zh: '由您自行组合的八片挂耳，两种品种来自高神的同一座农场：卡蒂姆，圆润带可可感；黄波旁，更细腻、更具花香。可以八片同款，也可以各四片，一杯一杯地比较。',
    },
    story: {
      fr: "Même terre, même altitude, même traitement, même torréfaction : seule la variété change. C’est la comparaison la plus honnête que l’on puisse proposer, et la plus instructive. La plupart des gens ne s’entendent pas dire « je préfère le Bourbon jaune » avant d’avoir bu les deux à la suite.",
      en: 'Same soil, same altitude, same processing, same roast: only the variety changes. It is the most honest comparison we can offer, and the most instructive. Most people never hear themselves say “I prefer the Yellow Bourbon” until they have drunk both in a row.',
      zh: '同一片土地、同样的海拔、同样的处理与烘焙：只有品种不同。这是我们能提供的最诚实、也最有启发的比较。多数人要连着喝过两杯，才会听见自己说出"我更喜欢黄波旁"。',
    },
    specs: {
      origin: { fr: 'Yunnan, Chine — Gaoshen, Baoshan', en: 'Yunnan, China — Gaoshen, Baoshan', zh: '中国云南 — 保山 高神' },
      altitude: { fr: '1 550 – 1 750 m', en: '1,550 – 1,750 m', zh: '1550 – 1750 米' },
      variety: { fr: 'Catimor ou Bourbon jaune', en: 'Catimor or Yellow Bourbon', zh: '卡蒂姆 或 黄波旁' },
      process: { fr: 'Lavé traditionnel', en: 'Traditional washed', zh: '传统水洗' },
      notes: {
        fr: 'Catimor : cacao, noisette · Bourbon jaune : jasmin, sucre roux',
        en: 'Catimor: cocoa, hazelnut · Yellow Bourbon: jasmine, brown sugar',
        zh: '卡蒂姆：可可、榛果 · 黄波旁：茉莉、红糖',
      },
      drying: { fr: 'Lits africains surélevés, 14 jours', en: 'Raised African beds, 14 days', zh: '非洲高架床，14 天' },
      harvest: { fr: 'À la main, cerises mûres', en: 'Hand-picked, ripe cherries', zh: '手工采摘，成熟果实' },
      roast: { fr: 'Filtre', en: 'Filter', zh: '手冲' },
    },
    brew: {
      fr: 'Posez le sachet sur la tasse, versez 30 ml pour humidifier, attendez 30 secondes, puis complétez à 180 ml en deux versements.',
      en: 'Rest the sachet on the cup, pour 30 ml to bloom, wait 30 seconds, then top up to 180 ml in two pours.',
      zh: '将滤袋挂在杯口，先注入 30 毫升闷蒸 30 秒，再分两次注水至 180 毫升。',
    },
    includes: [
      { fr: '8 sachets filtres de 10 g, moulus du jour', en: '8 filter sachets of 10 g, ground that day', zh: '8 片 10 克滤袋，当日研磨' },
      { fr: 'Une seule ferme, une seule récolte', en: 'One farm, one harvest', zh: '单一农场，单一产季' },
      { fr: 'Boîte recyclable', en: 'Recyclable box', zh: '可回收包装盒' },
    ],
    farm: gaoshen,
    related: ['drip-bags-x8', 'torch-estate-lot-02', 'coffret-decouverte'],
  },
  {
    slug: 'coffret-decouverte',
    sku: 'YUN-SET-DEC',
    category: 'set',
    visual: 'bundle',
    shopifyHandle: 'coffret-decouverte',
    shopifyProductId: '',
    variants: [
      {
        shopifyVariantId: '',
        label: { fr: 'Coffret complet', en: 'Complete set', zh: '完整礼盒' },
        price: 66,
        weightGrams: 680,
        available: true,
      },
    ],
    lot: 'Coffret',
    name: { fr: 'Coffret Découverte', en: 'Discovery Set', zh: '发现礼盒' },
    subtitle: {
      fr: '3 × 200 g + 1 boîte de drip bags',
      en: '3 × 200 g + 1 box of drip bags',
      zh: '3 × 200 克 + 1 盒挂耳',
    },
    short: {
      fr: 'Les trois lots, plus les drip bags.',
      en: 'The three lots, plus the drip bags.',
      zh: '三支批次，外加一盒挂耳。',
    },
    description: {
      fr: "Le meilleur moyen de comprendre notre gamme : les deux honey de Torch Estate — anaérobie double et traditionnel — le lavé de Yun Lan Estate en Pacamara, et une boîte de huit drip bags pour emporter la dégustation avec vous.",
      en: 'The best way to understand our range: both Torch Estate honey lots — double anaerobic and traditional — the washed Pacamara from Yun Lan Estate, and a box of eight drip bags to take the tasting with you.',
      zh: '认识我们这条产品线最好的方式：火炬庄园的两支蜜处理（双重厌氧与传统）、云澜庄园的水洗帕卡马拉，外加八片挂耳，把这场品鉴带在身边。',
    },
    story: {
      fr: "Deux fermes, deux terroirs, trois traitements, une même saison. Dégustez-les côte à côte : c’est là que le travail se lit le plus clairement — ce que change une fermentation, ce que change une variété. Le coffret est accompagné d’une fiche de dégustation.",
      en: 'Two farms, two terroirs, three processes, one same season. Taste them side by side: that is where the work reads most clearly — what a fermentation changes, what a variety changes. The set comes with a tasting sheet.',
      zh: '两座农场、两片风土、三种处理法、同一个产季。并排品尝，工作的差异最清晰——发酵改变了什么，品种又改变了什么。礼盒附赠一张杯测记录卡。',
    },
    specs: {
      origin: { fr: 'Yunnan, Chine — Pu’er & Xishuangbanna', en: 'Yunnan, China — Pu’er & Xishuangbanna', zh: '中国云南 — 普洱与西双版纳' },
      altitude: { fr: '1 300 – 1 800 m', en: '1,300 – 1,800 m', zh: '1300 – 1800 米' },
      variety: { fr: 'Catimor, Pacamara', en: 'Catimor, Pacamara', zh: '卡蒂姆、帕卡马拉' },
      process: { fr: 'Honey anaérobie, honey, lavé', en: 'Anaerobic honey, honey, washed', zh: '厌氧蜜处理、蜜处理、水洗' },
      notes: {
        fr: 'Fruits tropicaux, citron vert, pamplemousse, cacao',
        en: 'Tropical fruit, lime, grapefruit, cocoa',
        zh: '热带水果、青柠、西柚、可可',
      },
      drying: { fr: 'Lits africains surélevés', en: 'Raised African beds', zh: '非洲高架床' },
      harvest: { fr: 'Récolte en cours', en: 'Current harvest', zh: '当季采收' },
      roast: { fr: 'Filtre & espresso', en: 'Filter & espresso', zh: '手冲与意式' },
    },
    brew: {
      fr: 'Commencez par le Lot.02, puis le Lot.01, terminez par le Yun Lan : du plus rond au plus vif.',
      en: 'Start with Lot.02, then Lot.01, finish with the Yun Lan: from the roundest to the brightest.',
      zh: '建议顺序：先 Lot.02，再 Lot.01，最后 Yun Lan——由圆润到明亮。',
    },
    includes: [
      { fr: 'Torch Estate, Lot.01 — 200 g', en: 'Torch Estate, Lot.01 — 200 g', zh: 'Torch Estate, Lot.01 — 200 克' },
      { fr: 'Torch Estate, Lot.02 — 200 g', en: 'Torch Estate, Lot.02 — 200 g', zh: 'Torch Estate, Lot.02 — 200 克' },
      { fr: 'Yun Lan Estate — 200 g', en: 'Yun Lan Estate — 200 g', zh: 'Yun Lan Estate — 200 克' },
      { fr: 'Drip Bags — boîte de 8', en: 'Drip Bags — box of 8', zh: '挂耳咖啡 — 8 片装' },
      { fr: 'Fiche de dégustation', en: 'Tasting sheet', zh: '杯测记录卡' },
    ],
    farm: yunLanEstate,
    related: ['torch-estate-lot-01', 'yun-lan-estate', 'drip-bags-x8'],
  },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const fromPrice = (p: Product) => Math.min(...p.variants.map((v) => v.price));
