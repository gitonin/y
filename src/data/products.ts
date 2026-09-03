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
    fr: "Torch Estate cultive ses parcelles dans les collines de Pu’er, autour de 1450 mètres. C’est de cette même ferme que viennent nos deux lots honey : le Lot 01 en fermentation anaérobie double, le Lot 02 en honey traditionnel. Même terre, même variété, deux traitements — et deux tasses qui n’ont presque rien en commun.\nFondée en 2014, Torch Coffee s’est installée directement sur les terres de production, en partenariat étroit avec les producteurs locaux. Leur modèle repose sur une logique de co-création plutôt que d’assistance : ils travaillent avec les fermiers pour développer des variétés (notamment le Catimor) et expérimenter des méthodes de traitement à faible consommation d’eau.\nTorch Estate fait partie de ce qu’ils appellent le « Mountain Man Project », un programme visant à convertir des fermes autrefois tournées vers le commerce de masse vers la production de cafés de spécialité, avec un accompagnement technique et une valorisation économique.",
    en: 'Torch Estate farms its plots in the hills of Pu’er, at around 1,450 metres. Both our honey lots come from this same farm: Lot 01 in double anaerobic fermentation, Lot 02 in traditional honey. Same soil, same variety, two processes — and two cups with almost nothing in common.\nFounded in 2014, Torch Coffee settled directly on the growing land, in close partnership with local producers. Their model rests on co-creation rather than aid: they work with farmers to develop varieties (Catimor in particular) and to trial low-water processing methods.\nTorch Estate is part of what they call the “Mountain Man Project”, a programme to convert farms once geared to the commodity trade towards specialty coffee, with technical support and a better return.',
    zh: '火炬庄园（Torch Estate）的地块位于普洱丘陵地带，海拔约 1450 米。我们两支蜜处理批次都来自这座农场：Lot 01 采用双重厌氧发酵，Lot 02 为传统蜜处理。同一片土地、同一个品种、两种处理法——两杯几乎毫无共同之处的咖啡。\n火炬咖啡（Torch Coffee）成立于 2014 年，直接扎根产区，与当地咖农紧密合作。他们的模式不是援助，而是共创：与农户一起选育品种（尤其是卡蒂姆），并试验低耗水的处理方式。\n火炬庄园属于他们所称的「Mountain Man Project」——一个把过去面向大宗贸易的农场转向精品咖啡生产的计划，提供技术支持，也带来更好的收益。',
  },
  photo: 'recolte-cueilleurs',
} as const;

const yunLanEstate = {
  name: 'Yun Lan Estate',
  place: { fr: 'Xishuangbanna, Yunnan', en: 'Xishuangbanna, Yunnan', zh: '云南 西双版纳' },
  text: {
    fr: "Yun Lan Estate se trouve à Xishuangbanna, à l’extrême sud du Yunnan, entre 1600 et 1800 mètres — les parcelles les plus hautes avec lesquelles nous travaillons. La ferme y cultive du Pacamara, une variété rare, peu productive et difficile à mener, qu’elle traite en lavé traditionnel.\nCréée en 1999 par Zhang Hongjun, cette ferme est l’une des plus anciennes fermes de spécialité du Yunnan. Elle cultive plus de 20 variétés (Geisha, Pacamara, Typica pourpre, sélections locales) avec une approche patiente, artisanale et plutôt traditionnelle (lavé, naturel, honey). Ses cafés sont connus pour leur acidité lumineuse et douce, leurs arômes d’agrumes, de baies, de prune et de thé noir, et leur grande finesse.",
    en: 'Yun Lan Estate sits in Xishuangbanna, at the far south of Yunnan, between 1,600 and 1,800 metres — the highest plots we work with. The farm grows Pacamara there, a rare variety, low-yielding and demanding, processed with a traditional washed method.\nFounded in 1999 by Zhang Hongjun, it is one of the oldest specialty farms in Yunnan. It grows more than 20 varieties (Geisha, Pacamara, purple Typica, local selections) with a patient, hands-on and rather traditional approach (washed, natural, honey). Its coffees are known for their bright, gentle acidity, their citrus, berry, plum and black-tea aromas, and their great finesse.',
    zh: '云澜庄园（Yun Lan Estate）位于云南最南端的西双版纳，海拔 1600 至 1800 米，是我们合作地块中最高的一处。农场在此种植帕卡马拉：产量低、管理难，采用传统水洗处理。\n庄园由张宏军于 1999 年创立，是云南最早的精品咖啡农场之一。园内种有 20 多个品种（瑰夏、帕卡马拉、紫叶铁皮卡、本地选育等），处理方式耐心而传统（水洗、日晒、蜜处理）。其咖啡以明亮柔和的酸质，柑橘、莓果、李子与红茶的香气，以及细腻的口感著称。',
  },
  photo: 'cretes-brumeuses',
} as const;

const gaosheng = {
  name: 'Ferme de Gaosheng',
  place: { fr: 'Baoshan, Yunnan', en: 'Baoshan, Yunnan', zh: '云南 保山' },
  text: {
    fr: "La Ferme de Gaosheng Manor, fondée en 1956, est souvent présentée comme la première plantation de café de Chine, dédiée à la production d’Arabica de qualité. La ferme cultive principalement du Catimor (et un peu de Typica /« Blue Mountain ») entre 1500 et 1850 m d’altitude, dans la vallée sèche et chaude de la rivière Nu, près de la frontière avec le Myanmar.",
    en: 'Gaosheng Manor, founded in 1956, is often described as the first coffee plantation in China dedicated to quality Arabica. The farm grows mainly Catimor (and a little Typica, the local “Blue Mountain”) between 1,500 and 1,850 metres, in the hot, dry valley of the Nu river, near the Myanmar border.',
    zh: '高神庄园（Gaosheng Manor）创立于 1956 年，常被视为中国第一座专注优质阿拉比卡的咖啡种植园。农场主要种植卡蒂姆（也有少量铁皮卡，即当地的「蓝山」），海拔 1500 至 1850 米，位于靠近缅甸边境、干热的怒江河谷。',
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
        price: 15,
        weightGrams: 200,
        available: true,
      },
    ],
    lot: 'Lot.01',
    name: { fr: 'Torch Estate, Lot 01', en: 'Torch Estate, Lot 01', zh: 'Torch Estate, Lot 01' },
    subtitle: { fr: 'Café de Pu’er, Yunnan', en: 'Coffee from Pu’er, Yunnan', zh: '云南普洱咖啡' },
    short: {
      fr: 'Café du Yunnan aux notes de fruits tropicaux, baies, vin rouge.',
      en: 'A Yunnan coffee with notes of tropical fruit, berries and red wine.',
      zh: '云南咖啡，带有热带水果、莓果与红酒的风味。',
    },
    description: {
      fr: "Une double fermentation anaérobie, menée en cuve fermée avant le séchage honey. Le résultat est clairement aromatique : fruits tropicaux mûrs, baies, une finale qui pointe vers les notes de vin rouge. C’est notre lot le plus démonstratif, celui que l’on sert quand quelqu’un doute encore de ce que le Yunnan sait faire.",
      en: 'A double anaerobic fermentation, carried out in sealed tanks before honey drying. The result is clearly aromatic: ripe tropical fruit, berries, a finish pointing towards red wine. It is our most demonstrative lot, the one we serve when someone still doubts what Yunnan can do.',
      zh: '干燥前先在密闭槽中完成双重厌氧发酵，再以蜜处理晾晒。风味十分清晰外放：成熟热带水果、莓果，尾韵指向红酒。这是我们最具说服力的一支——当有人仍怀疑云南能做出什么时，我们就冲这一支。',
    },
    story: {
      fr: "La fermentation anaérobie double demande une discipline que peu de fermes acceptent : deux cycles en cuve fermée, chacun suivi en température et en pH, sans marge d’erreur. Torch Estate s’y est mise il y a trois récoltes, en commençant par des micro-lots.",
      en: 'Double anaerobic fermentation demands a discipline few farms accept: two sealed-tank cycles, each monitored for temperature and pH, with no margin for error. Torch Estate took it up three harvests ago, starting with micro-lots.',
      zh: '双重厌氧发酵需要极少农场愿意承担的纪律：两轮密闭发酵，全程监控温度与 pH，没有容错空间。火炬庄园从三个产季前开始尝试，最初只做微批次。',
    },
    specs: {
      origin: { fr: 'Yunnan, Chine — Pu’er', en: 'Yunnan, China — Pu’er', zh: '中国云南 — 普洱' },
      altitude: { fr: '1450 m', en: '1,450 m', zh: '1450 米' },
      variety: { fr: 'Catimor (Arabica)', en: 'Catimor (Arabica)', zh: '卡蒂姆（阿拉比卡）' },
      process: { fr: 'Honey anaérobie double', en: 'Double anaerobic honey', zh: '双重厌氧蜜处理' },
      notes: {
        fr: 'Fruits tropicaux, baies, vin rouge',
        en: 'Tropical fruit, berries, red wine',
        zh: '热带水果、莓果、红酒',
      },
      drying: { fr: 'Lits surélevés', en: 'Raised beds', zh: '高架床' },
      harvest: { fr: 'À la main, cerises mûres', en: 'Hand-picked, ripe cherries', zh: '手工采摘，成熟果实' },
      roast: { fr: 'Filtre et espresso', en: 'Filter and espresso', zh: '手冲与意式浓缩' },
    },
    brew: {
      fr: 'Filtre : 15 g pour 250 ml, eau à 93 °C, 2 min 30. Versements courts pour ne pas écraser le fruit.',
      en: 'Filter: 15 g per 250 ml, water at 93 °C, 2 min 30. Short pours so the fruit is not flattened.',
      zh: '手冲：15 克 / 250 毫升，93 °C，2 分 30 秒。分段小水流注水，避免压过果香。',
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
        price: 15,
        weightGrams: 200,
        available: true,
      },
    ],
    lot: 'Lot.02',
    name: { fr: 'Torch Estate, Lot 02', en: 'Torch Estate, Lot 02', zh: 'Torch Estate, Lot 02' },
    subtitle: { fr: 'Café de Pu’er, Yunnan', en: 'Coffee from Pu’er, Yunnan', zh: '云南普洱咖啡' },
    short: {
      fr: 'Café du Yunnan aux notes de Citron vert, olive, liqueur de cacao.',
      en: 'A Yunnan coffee with notes of lime, olive and cacao liqueur.',
      zh: '云南咖啡，带有青柠、橄榄与可可利口酒的风味。',
    },
    description: {
      fr: "Un honey traditionnel, pensé pour l’espresso. La mucilage laissée sur le grain donne du corps et une douceur de liqueur de cacao, que vient trancher une acidité de citron vert. Cette note d’olive, presque saline, est la signature du lot: on la retrouve souvent d’une récolte à l’autre.",
      en: 'A traditional honey, made for espresso. The mucilage left on the bean gives body and a cacao-liqueur sweetness, cut through by a lime acidity. That almost saline olive note is the signature of the lot: it comes back from one harvest to the next.',
      zh: '传统蜜处理，为意式浓缩而做。果胶留在豆表，带来醇厚与可可利口酒般的甜感，被青柠的酸质划开。近乎咸鲜的橄榄气息是这支批次的标志，常常在一季又一季中重现。',
    },
    story: {
      fr: "C’est le lot que nous buvons le plus souvent chez nous, en espresso serré le matin. Il tient aussi remarquablement bien au lait : la liqueur de cacao ressort, l’acidité se range. Si vous n’avez qu’une machine, ne cherchez plus, prenez celui-là.",
      en: 'It is the lot we drink most often at home, as a tight espresso in the morning. It also holds remarkably well with milk: the cacao liqueur comes forward, the acidity falls into line. If you only have a machine, look no further, take this one.',
      zh: '这是我们自己喝得最多的一支，早晨一杯浓缩。它配奶也表现出色：可可利口酒的甜感浮上来，酸质退到后面。如果你只有一台意式机，别再挑了，就选它。',
    },
    specs: {
      origin: { fr: 'Yunnan, Chine — Pu’er', en: 'Yunnan, China — Pu’er', zh: '中国云南 — 普洱' },
      altitude: { fr: '1300 – 1500 m', en: '1,300 – 1,500 m', zh: '1300 – 1500 米' },
      variety: { fr: 'Catimor (Arabica)', en: 'Catimor (Arabica)', zh: '卡蒂姆（阿拉比卡）' },
      process: { fr: 'Honey traditionnel', en: 'Traditional honey', zh: '传统蜜处理' },
      notes: {
        fr: 'Citron vert, olive, liqueur de cacao',
        en: 'Lime, olive, cacao liqueur',
        zh: '青柠、橄榄、可可利口酒',
      },
      drying: { fr: 'Lits surélevés', en: 'Raised beds', zh: '高架床' },
      harvest: { fr: 'À la main, cerises mûres', en: 'Hand-picked, ripe cherries', zh: '手工采摘，成熟果实' },
      roast: { fr: 'Espresso', en: 'Espresso', zh: '意式浓缩' },
    },
    brew: {
      fr: 'Espresso : 18 g pour 40 ml en 26 secondes, eau à 91 °C. En filtre, allonger à 15 g pour 260 ml.',
      en: 'Espresso: 18 g for 40 ml in 26 seconds, water at 91 °C. For filter, stretch to 15 g per 260 ml.',
      zh: '意式浓缩：18 克萃取 40 毫升，26 秒，水温 91 °C。手冲则调整为 15 克 / 260 毫升。',
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
        price: 17,
        weightGrams: 200,
        available: true,
      },
    ],
    lot: 'Yun Lan',
    name: { fr: 'Yun Lan Estate', en: 'Yun Lan Estate', zh: 'Yun Lan Estate' },
    subtitle: { fr: 'Café de Xishuangbanna, Yunnan', en: 'Coffee from Xishuangbanna, Yunnan', zh: '云南西双版纳咖啡' },
    short: {
      fr: 'Pamplemousse, prune rouge, thé noir.',
      en: 'Grapefruit, red plum, black tea.',
      zh: '西柚、红李子、红茶。',
    },
    description: {
      fr: "Du Pacamara cultivé entre 1600 et 1800 mètres, traité en lavé traditionnel : naturel, rien pour masquer, rien pour ajouter. Ce qui reste, c’est la variété et l’altitude — une acidité de pamplemousse, une chair de prune rouge, et une longueur de thé noir qui tient après la tasse.",
      en: 'Pacamara grown between 1,600 and 1,800 metres, processed with a traditional washed method: natural, nothing to mask, nothing to add. What remains is the variety and the altitude — a grapefruit acidity, red-plum flesh, and a black-tea length that lingers after the cup.',
      zh: '海拔 1600 至 1800 米的帕卡马拉，采用传统水洗：自然、不遮掩、不添加。留下的是品种与海拔本身——西柚般的酸质、红李子的果肉感，以及杯后仍在的红茶尾韵。',
    },
    story: {
      fr: "Le Pacamara est une variété encombrante : de grands arbres, de très gros grains, peu de rendement, et une sensibilité qui décourage la plupart des exploitations. Il en existe peu au Yunnan. Ce lot est le plus cher que nous proposons, et c’est aussi le seul dont nous savons qu’il partira avant les autres.",
      en: 'Pacamara is an unwieldy variety: tall trees, very large beans, low yields, and a fragility that discourages most farms. There is little of it in Yunnan. This lot is the most expensive we offer, and it is also the one we know will sell out before the others.',
      zh: '帕卡马拉是个难伺候的品种：树高、豆粒极大、产量低，脆弱得让多数农场却步。云南种的人不多。这是我们价格最高的一支，也是我们知道一定会先卖完的一支。',
    },
    specs: {
      origin: { fr: 'Yunnan, Chine — Xishuangbanna', en: 'Yunnan, China — Xishuangbanna', zh: '中国云南 — 西双版纳' },
      altitude: { fr: '1600 – 1800 m', en: '1,600 – 1,800 m', zh: '1600 – 1800 米' },
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
      fr: 'Filtre : 15 g pour 250 ml, eau à 93 °C. Mouture un cran plus grossière que d’habitude — le Pacamara donne beaucoup, rapidement.',
      en: 'Filter: 15 g per 250 ml, water at 93 °C. Grind one notch coarser than usual — Pacamara gives a lot, quickly.',
      zh: '手冲：15 克 / 250 毫升，水温 93 °C。研磨比平时粗一档——帕卡马拉释放得又多又快。',
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
        price: 16.5,
        weightGrams: 80,
        available: true,
      },
    ],
    lot: 'Drip',
    name: { fr: 'Drip Bags — Boîte de 8', en: 'Drip Bags — Box of 8', zh: '挂耳咖啡 — 8 片装' },
    subtitle: { fr: 'Catimor et Bourbon', en: 'Catimor and Bourbon', zh: '卡蒂姆与波旁' },
    short: {
      fr: 'Un filtre individuel de café du Yunnan à emporter partout.',
      en: 'A single-serve Yunnan filter coffee to take anywhere.',
      zh: '一片一杯的云南手冲，随身带到任何地方。',
    },
    description: {
      fr: "Huit sachets filtres individuels de 10 g, moulus et conditionnés sous atmosphère protectrice le jour de la torréfaction. L’assemblage de saison réunit quatre Catimor et quatre Bourbon jaune de la ferme Gaosheng : de la légèreté et assez de douceur pour se passer de sucre.",
      en: 'Eight individual 10 g filter sachets, ground and packed under protective atmosphere on roasting day. The seasonal blend brings together four Catimor and four Yellow Bourbon from the Gaosheng farm: lightness, and enough sweetness to do without sugar.',
      zh: '八片独立滤袋，每片 10 克，于烘焙当天研磨并充氮封装。当季拼配为高神农场的四片卡蒂姆与四片黄波旁：轻盈，甜度足以不必加糖。',
    },
    story: {
      fr: "Pensés pour le bureau, les voyages ou les matins pressés — sans jamais renoncer à la tasse. Posez le sachet sur votre mug, versez en trois fois, retirez : trois minutes, savourez.",
      en: 'Made for the office, for travelling or for rushed mornings — without ever giving up on the cup. Rest the sachet on your mug, pour in three stages, remove: three minutes, and enjoy.',
      zh: '为办公室、旅途与匆忙的清晨而做，却不必牺牲杯中的品质。挂在杯口，分三次注水，取下即可：三分钟，好好享受。',
    },
    specs: {
      origin: { fr: 'Yunnan, Chine — Baoshan', en: 'Yunnan, China — Baoshan', zh: '中国云南 — 保山' },
      altitude: { fr: '1300 – 1850 m', en: '1,300 – 1,850 m', zh: '1300 – 1850 米' },
      variety: { fr: 'Catimor et Bourbon Jaune', en: 'Catimor and Yellow Bourbon', zh: '卡蒂姆与黄波旁' },
      process: { fr: 'Honey & lavé', en: 'Honey & washed', zh: '蜜处理与水洗' },
      notes: { fr: 'Amande, cacao au lait, fruits jaunes', en: 'Almond, milk cocoa, yellow fruit', zh: '杏仁、牛奶可可、黄色水果' },
      drying: { fr: 'Lits africains surélevés', en: 'Raised African beds', zh: '非洲高架床' },
      harvest: { fr: 'À la main, cerises mûres', en: 'Hand-picked, ripe cherries', zh: '手工采摘，成熟果实' },
      roast: { fr: 'Filtre', en: 'Filter', zh: '手冲' },
    },
    brew: {
      fr: 'Posez le sachet sur le mug, versez 30 ml à 90 °C pour humidifier, attendez 30 secondes, puis complétez à 120 - 150 ml en deux versements.',
      en: 'Rest the sachet on your mug, pour 30 ml at 90 °C to bloom, wait 30 seconds, then top up to 120–150 ml in two pours.',
      zh: '将滤袋挂在杯口，先以 90 °C 注入 30 毫升闷蒸 30 秒，再分两次注水至 120–150 毫升。',
    },
    includes: [
      { fr: '4x2 sachets filtres de 10 g', en: '4 × 2 filter sachets of 10 g', zh: '4 × 2 片 10 克滤袋' },
      { fr: 'Variétés Catimor et Bourbon Jaune', en: 'Catimor and Yellow Bourbon varieties', zh: '卡蒂姆与黄波旁两个品种' },
      { fr: 'Boîte et sachets recyclables', en: 'Recyclable box and sachets', zh: '外盒与滤袋均可回收' },
    ],
    farm: { ...gaosheng, name: 'Gaosheng Manor' },
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
        price: 18,
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
        price: 16.5,
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
    subtitle: { fr: 'Ferme de Gaosheng, Baoshan', en: 'Gaosheng farm, Baoshan', zh: '保山 高神农场' },
    short: {
      fr: 'Huit sachets, deux variétés au choix.',
      en: 'Eight sachets, two varieties to choose from.',
      zh: '八片挂耳，两个品种任选。',
    },
    description: {
      fr: "Une boîte de huit drip bags composée par vous, à partir de deux variétés cultivées sur la même ferme, à Gaosheng : le Catimor, rond et cacaoté, et le Bourbon jaune, plus fin et floral. Prenez-en huit d’une seule, ou quatre de chaque pour les comparer tasse après tasse.",
      en: 'A box of eight drip bags composed by you, from two varieties grown on the same farm at Gaosheng: Catimor, round and cocoa-like, and Yellow Bourbon, finer and floral. Take eight of one, or four of each to compare them cup after cup.',
      zh: '由你自己搭配的八片挂耳，来自高神同一座农场的两个品种：卡蒂姆圆润带可可感，黄波旁更细腻、更具花香。可以八片同一款，也可以各四片，一杯一杯地对比。',
    },
    story: {
      fr: "Même terre, même altitude, même traitement, même torréfaction : seule la variété change. C’est la comparaison la plus honnête que l’on puisse proposer, et la plus instructive. La plupart des gens ne s’entendent pas dire « je préfère le Bourbon jaune » avant d’avoir bu les deux à la suite.",
      en: 'Same soil, same altitude, same processing, same roast: only the variety changes. It is the most honest comparison we can offer, and the most instructive. Most people never hear themselves say “I prefer the Yellow Bourbon” until they have drunk both in a row.',
      zh: '同一片土地、同样的海拔、同样的处理与烘焙：只有品种不同。这是我们能提供的最诚实、也最有启发的比较。多数人要连着喝过两杯，才会听见自己说出"我更喜欢黄波旁"。',
    },
    specs: {
      origin: { fr: 'Yunnan, Chine — Gaosheng, Baoshan', en: 'Yunnan, China — Gaosheng, Baoshan', zh: '中国云南 — 保山 高神' },
      altitude: { fr: '1300 – 1850 m', en: '1,300 – 1,850 m', zh: '1300 – 1850 米' },
      variety: { fr: 'Catimor et / ou Bourbon jaune', en: 'Catimor and / or Yellow Bourbon', zh: '卡蒂姆与／或黄波旁' },
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
      fr: 'Posez le sachet sur le mug, versez 30 ml à 90 °C pour humidifier, attendez 30 secondes, puis complétez à 120 - 150 ml en deux versements.',
      en: 'Rest the sachet on your mug, pour 30 ml at 90 °C to bloom, wait 30 seconds, then top up to 120–150 ml in two pours.',
      zh: '将滤袋挂在杯口，先以 90 °C 注入 30 毫升闷蒸 30 秒，再分两次注水至 120–150 毫升。',
    },
    includes: [
      { fr: '8 sachets filtres de 10 g', en: '8 filter sachets of 10 g', zh: '8 片 10 克滤袋' },
      { fr: 'Variétés Catimor et / ou Bourbon Jaune', en: 'Catimor and / or Yellow Bourbon varieties', zh: '卡蒂姆与／或黄波旁品种' },
      { fr: 'Boîte et sachets recyclables', en: 'Recyclable box and sachets', zh: '外盒与滤袋均可回收' },
    ],
    farm: gaosheng,
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
        price: 60,
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
      fr: 'Nos trois cafés du Yunnan, avec les drip bags.',
      en: 'Our three Yunnan coffees, with the drip bags.',
      zh: '我们的三支云南咖啡，外加挂耳。',
    },
    description: {
      fr: "Le meilleur moyen de comprendre nos cafés du Yunnan : deux honey de Torch Estate — anaérobie double et traditionnel — le lavé de Yun Lan Estate en Pacamara, et une boîte de huit drip bags de Gaosheng pour emporter un peu de Yunnan partout avec vous.",
      en: 'The best way to understand our Yunnan coffees: two Torch Estate honeys — double anaerobic and traditional — the washed Pacamara from Yun Lan Estate, and a box of eight Gaosheng drip bags to take a little Yunnan everywhere with you.',
      zh: '认识我们云南咖啡最好的方式：火炬庄园的两支蜜处理（双重厌氧与传统）、云澜庄园的水洗帕卡马拉，以及八片高神挂耳，把一点云南带在身边。',
    },
    story: {
      fr: "Une ferme, un terroir, deux variétés. Dégustez-les côte à côte : c’est là que le travail se lit le plus clairement — ce que change une fermentation, ce que change une variété. Le coffret est accompagné d’une fiche de dégustation.",
      en: 'One farm, one terroir, two varieties. Taste them side by side: that is where the work reads most clearly — what a fermentation changes, what a variety changes. The set comes with tasting sheets.',
      zh: '一座农场、一片风土、两个品种。并排品尝，工作的差异最清晰——发酵改变了什么，品种又改变了什么。礼盒附赠杯测记录卡。',
    },
    specs: {
      origin: { fr: 'Yunnan, Chine — Pu’er, Baoshan & Xishuangbanna', en: 'Yunnan, China — Pu’er, Baoshan & Xishuangbanna', zh: '中国云南 — 普洱、保山与西双版纳' },
      altitude: { fr: '1300 –1800 m', en: '1,300 – 1,800 m', zh: '1300 – 1800 米' },
      variety: { fr: 'Catimor, Pacamara et Bourbon jaune', en: 'Catimor, Pacamara and Yellow Bourbon', zh: '卡蒂姆、帕卡马拉与黄波旁' },
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
      { fr: 'Torch Estate, Lot 01 — 200 g', en: 'Torch Estate, Lot 01 — 200 g', zh: 'Torch Estate, Lot 01 — 200 克' },
      { fr: 'Torch Estate, Lot 02 — 200 g', en: 'Torch Estate, Lot 02 — 200 g', zh: 'Torch Estate, Lot 02 — 200 克' },
      { fr: 'Yun Lan Estate — 200 g', en: 'Yun Lan Estate — 200 g', zh: 'Yun Lan Estate — 200 克' },
      { fr: 'Drip Bags — boîte de 8', en: 'Drip Bags — box of 8', zh: '挂耳咖啡 — 8 片装' },
      { fr: 'Fiches de dégustation', en: 'Tasting sheets', zh: '杯测记录卡' },
    ],
    farm: yunLanEstate,
    related: ['torch-estate-lot-01', 'yun-lan-estate', 'drip-bags-x8'],
  },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const fromPrice = (p: Product) => Math.min(...p.variants.map((v) => v.price));
