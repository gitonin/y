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
  specs: {
    origin: L;
    altitude: L;
    variety: L;
    process: L;
    notes: L;
    drying: L;
    harvest: L;
    roast: L;
  };
  brew: L;
  includes?: L[];
  /** Ferme ou famille productrice, présentée directement sur la fiche produit. */
  farm: {
    name: string;
    place: L;
    text: L;
    photo: 'recolte-cueilleurs' | 'cretes-brumeuses' | 'cerises-branche' | 'sechage-lits' | 'tabouret-terrasse';
  };
  related: string[];
};

export const products: Product[] = [
  {
    slug: 'lot-23-01-baoshan',
    sku: 'YUN-23-01-200',
    category: 'grain',
    visual: 'bag-01',
    shopifyHandle: 'selection-lot-23-01-baoshan',
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
    lot: 'N°23-01',
    name: {
      fr: 'Sélection Lot N°23-01',
      en: 'Selection Lot No. 23-01',
      zh: '精选批次 N°23-01',
    },
    subtitle: { fr: 'Baoshan, Yunnan', en: 'Baoshan, Yunnan', zh: '云南 保山' },
    short: {
      fr: 'Thé noir, abricot, chocolat noir.',
      en: 'Black tea, apricot, dark chocolate.',
      zh: '红茶、杏子、黑巧克力。',
    },
    description: {
      fr: "Cultivé dans les montagnes de Baoshan, ce lot lavé révèle une tasse propre et équilibrée, aux notes de thé noir et d'abricot. Une entrée en matière idéale dans les cafés du Yunnan : douce, ronde, sans aspérité.",
      en: 'Grown in the mountains of Baoshan, this washed lot reveals a clean, balanced cup with notes of black tea and apricot. An ideal introduction to Yunnan coffees: soft, round, without rough edges.',
      zh: '生长于保山山区，这支水洗批次呈现干净而平衡的杯感，带有红茶与杏子的香气。作为认识云南咖啡的第一支，它温和、圆润、没有尖锐感。',
    },
    story: {
      fr: "La famille Yang cultive 3,5 hectares à 1 500 mètres, sur un versant orienté à l'est. Les cerises sont dépulpées le soir même de la récolte, fermentées 18 heures en cuve puis lavées à l'eau de source.",
      en: 'The Yang family farms 3.5 hectares at 1,500 metres, on an east-facing slope. Cherries are pulped the very evening of the harvest, fermented for 18 hours in tanks, then washed with spring water.',
      zh: '杨家在海拔 1500 米的东向坡地上耕作 3.5 公顷。咖啡果在采收当晚去果皮，入槽发酵 18 小时后以山泉水洗净。',
    },
    specs: {
      origin: { fr: 'Yunnan, Chine — Baoshan', en: 'Yunnan, China — Baoshan', zh: '中国云南 — 保山' },
      altitude: { fr: '1 500 – 1 800 m', en: '1,500 – 1,800 m', zh: '1500 – 1800 米' },
      variety: { fr: 'Catimor', en: 'Catimor', zh: '卡蒂姆' },
      process: { fr: 'Lavé', en: 'Washed', zh: '水洗' },
      notes: {
        fr: 'Thé noir, abricot, chocolat noir',
        en: 'Black tea, apricot, dark chocolate',
        zh: '红茶、杏子、黑巧克力',
      },
      drying: { fr: 'Lits africains surélevés', en: 'Raised African beds', zh: '非洲高架床' },
      harvest: { fr: 'À la main, cerises mûres', en: 'Hand-picked, ripe cherries', zh: '手工采摘，成熟果实' },
      roast: { fr: 'Claire — filtre & espresso', en: 'Light — filter & espresso', zh: '浅烘 — 手冲与意式' },
    },
    brew: {
      fr: 'Filtre : 15 g pour 250 ml, eau à 93 °C, 2 min 45. Espresso : 18 g pour 40 g en 26 secondes.',
      en: 'Filter: 15 g per 250 ml, water at 93 °C, 2 min 45. Espresso: 18 g for 40 g in 26 seconds.',
      zh: '手冲：15 克 / 250 毫升，93 °C，2 分 45 秒。意式：18 克粉萃取 40 克液，26 秒。',
    },
    farm: {
      name: 'Ferme des Yang',
      place: { fr: 'Baoshan, Yunnan', en: 'Baoshan, Yunnan', zh: '云南 保山' },
      text: {
        fr: "La famille Yang cultive 3,5 hectares à 1 500 mètres, sur un versant orienté à l'est, planté d'arbres d'ombrage. Trois générations y travaillent : les parents à la parcelle, le fils à la station de lavage qu'ils ont construite en 2021. Nous achetons chez eux depuis notre première récolte, à un prix fixé avant la saison.",
        en: 'The Yang family farms 3.5 hectares at 1,500 metres, on an east-facing slope planted with shade trees. Three generations work there: the parents on the plot, the son at the washing station they built in 2021. We have bought from them since our first harvest, at a price agreed before the season.',
        zh: '杨家在海拔 1500 米的东向坡地耕作 3.5 公顷，地块间种有遮荫树。三代人一同劳作：父母在地里，儿子负责他们 2021 年自建的水洗处理站。自第一个产季起我们便向他们采购，价格在开季前就已谈定。',
      },
      photo: 'recolte-cueilleurs',
    },
    related: ['lot-23-03-puer', 'lot-23-05-menglian', 'coffret-decouverte'],
  },
  {
    slug: 'lot-23-03-puer',
    sku: 'YUN-23-03-200',
    category: 'grain',
    visual: 'bag-03',
    shopifyHandle: 'selection-lot-23-03-puer',
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
    lot: 'N°23-03',
    name: { fr: 'Sélection Lot N°23-03', en: 'Selection Lot No. 23-03', zh: '精选批次 N°23-03' },
    subtitle: { fr: "Pu'er, Yunnan", en: "Pu'er, Yunnan", zh: '云南 普洱' },
    short: {
      fr: 'Pêche blanche, miel, jasmin.',
      en: 'White peach, honey, jasmine.',
      zh: '白桃、蜂蜜、茉莉。',
    },
    description: {
      fr: "Un honey délicat, séché lentement à l'ombre. La mucilage laissée sur le grain apporte une texture soyeuse et une douceur miellée, portée par un parfum de fleurs blanches.",
      en: 'A delicate honey process, dried slowly in the shade. The mucilage left on the bean brings a silky texture and honeyed sweetness, carried by a white-flower perfume.',
      zh: '细腻的蜜处理，在阴凉处缓慢干燥。保留在豆表的果胶带来丝滑质地与蜂蜜般的甜感，伴随白花香气。',
    },
    story: {
      fr: "À Pu'er, le café pousse en lisière des jardins de thé. Ce lot provient d'une parcelle de 1,8 hectare travaillée sans intrant de synthèse depuis 2017, où les caféiers sont ombragés par des arbres fruitiers.",
      en: 'In Pu’er, coffee grows on the edge of the tea gardens. This lot comes from a 1.8-hectare plot farmed without synthetic inputs since 2017, where coffee trees are shaded by fruit trees.',
      zh: '在普洱，咖啡生长在茶园边缘。这支批次来自一块 1.8 公顷的地块，自 2017 年起不使用合成投入品，咖啡树由果树遮荫。',
    },
    specs: {
      origin: { fr: "Yunnan, Chine — Pu'er", en: "Yunnan, China — Pu'er", zh: '中国云南 — 普洱' },
      altitude: { fr: '1 400 – 1 650 m', en: '1,400 – 1,650 m', zh: '1400 – 1650 米' },
      variety: { fr: 'Typica, Bourbon', en: 'Typica, Bourbon', zh: '铁皮卡、波旁' },
      process: { fr: 'Honey', en: 'Honey', zh: '蜜处理' },
      notes: { fr: 'Pêche blanche, miel, jasmin', en: 'White peach, honey, jasmine', zh: '白桃、蜂蜜、茉莉' },
      drying: { fr: "Lits africains, 18 jours à l'ombre", en: 'Raised beds, 18 days in the shade', zh: '高架床，阴干 18 天' },
      harvest: { fr: 'À la main, tri le jour même', en: 'Hand-picked, same-day sorting', zh: '手工采摘，当日筛选' },
      roast: { fr: 'Claire — filtre', en: 'Light — filter', zh: '浅烘 — 手冲' },
    },
    brew: {
      fr: 'Filtre : 15 g pour 250 ml, eau à 92 °C, versements courts. Idéal en V60 ou en cafetière à immersion.',
      en: 'Filter: 15 g per 250 ml, water at 92 °C, short pours. Ideal in a V60 or an immersion brewer.',
      zh: '手冲：15 克 / 250 毫升，92 °C，小水流分段注水。适合 V60 或浸泡式冲煮。',
    },
    farm: {
      name: 'Jardin de Manlao',
      place: { fr: "Pu'er, Yunnan", en: "Pu'er, Yunnan", zh: '云南 普洱' },
      text: {
        fr: "Une parcelle de 1,8 hectare en lisière des jardins de thé, conduite sans intrant de synthèse depuis 2017. Les caféiers y poussent sous des arbres fruitiers, ce qui allonge la maturation de deux à trois semaines. La récolte est traitée en honey, séchée à l'ombre, sur des lits que la famille couvre chaque soir.",
        en: 'A 1.8-hectare plot on the edge of the tea gardens, farmed without synthetic inputs since 2017. Coffee trees grow under fruit trees, which stretches ripening by two to three weeks. The harvest is honey processed and shade dried, on beds the family covers every evening.',
        zh: '一块 1.8 公顷的地块，位于茶园边缘，自 2017 年起不使用合成投入品。咖啡树生长在果树之下，使成熟期延长两到三周。采收后采用蜜处理，于阴凉处晾晒，家人每晚为晾床覆盖。',
      },
      photo: 'cretes-brumeuses',
    },
    related: ['lot-23-01-baoshan', 'lot-23-05-menglian', 'drip-bags-x8'],
  },
  {
    slug: 'lot-23-05-menglian',
    sku: 'YUN-23-05-200',
    category: 'grain',
    visual: 'bag-05',
    shopifyHandle: 'selection-lot-23-05-menglian',
    shopifyProductId: '',
    variants: [
      {
        shopifyVariantId: '',
        label: { fr: '200 g', en: '200 g', zh: '200 克' },
        price: 20,
        weightGrams: 200,
        available: true,
      },
    ],
    lot: 'N°23-05',
    name: { fr: 'Sélection Lot N°23-05', en: 'Selection Lot No. 23-05', zh: '精选批次 N°23-05' },
    subtitle: { fr: 'Menglian, Yunnan', en: 'Menglian, Yunnan', zh: '云南 孟连' },
    short: {
      fr: 'Fraise, cacao, épices douces.',
      en: 'Strawberry, cocoa, sweet spices.',
      zh: '草莓、可可、温和香料。',
    },
    description: {
      fr: "Notre lot le plus expressif. Séché en cerise entière pendant 21 jours, il développe des arômes de fruits rouges confits et une finale cacaotée, longue et enveloppante.",
      en: 'Our most expressive lot. Dried as whole cherry for 21 days, it develops candied red-fruit aromas and a long, enveloping cocoa finish.',
      zh: '我们最外放的一支。带果皮整颗日晒 21 天，发展出蜜饯红果的香气与绵长包裹的可可尾韵。',
    },
    story: {
      fr: "Menglian borde la frontière birmane. Les nuits y sont fraîches et les journées sèches en fin d'année : des conditions rares qui permettent un séchage naturel long, sans risque de fermentation excessive.",
      en: 'Menglian sits along the Burmese border. Nights are cool and late-year days are dry: rare conditions that allow a long natural drying without the risk of over-fermentation.',
      zh: '孟连紧邻缅甸边境。夜晚凉爽、年末干燥，这样难得的条件让长时间的日晒成为可能，而不必担心过度发酵。',
    },
    specs: {
      origin: { fr: 'Yunnan, Chine — Menglian', en: 'Yunnan, China — Menglian', zh: '中国云南 — 孟连' },
      altitude: { fr: '1 300 – 1 550 m', en: '1,300 – 1,550 m', zh: '1300 – 1550 米' },
      variety: { fr: 'Catimor, Typica', en: 'Catimor, Typica', zh: '卡蒂姆、铁皮卡' },
      process: { fr: 'Naturel', en: 'Natural', zh: '日晒' },
      notes: { fr: 'Fraise, cacao, épices douces', en: 'Strawberry, cocoa, sweet spices', zh: '草莓、可可、温和香料' },
      drying: { fr: 'Cerise entière, 21 jours', en: 'Whole cherry, 21 days', zh: '整果日晒 21 天' },
      harvest: { fr: 'À la main, sélection 100 % mûre', en: 'Hand-picked, 100% ripe selection', zh: '手工采摘，全熟果选' },
      roast: { fr: 'Claire à moyenne — filtre & espresso', en: 'Light to medium — filter & espresso', zh: '浅中烘 — 手冲与意式' },
    },
    brew: {
      fr: "Filtre : 15 g pour 250 ml, eau à 94 °C. En espresso, allonger légèrement le ratio pour adoucir l'acidité.",
      en: 'Filter: 15 g per 250 ml, water at 94 °C. For espresso, stretch the ratio slightly to soften the acidity.',
      zh: '手冲：15 克 / 250 毫升，94 °C。做意式时可略微拉长粉液比以柔化酸度。',
    },
    farm: {
      name: 'Coopérative de Menglian',
      place: { fr: 'Menglian, Yunnan', en: 'Menglian, Yunnan', zh: '云南 孟连' },
      text: {
        fr: "Sept familles réunies en coopérative, le long de la frontière birmane. Elles mettent en commun l'aire de séchage et le trieur optique, ce qu'aucune ne pourrait financer seule. Ce lot naturel est le fruit de cette mise en commun : vingt et un jours de séchage demandent une surveillance que l'on ne tient pas à une seule paire de bras.",
        en: 'Seven families gathered in a cooperative, along the Burmese border. They share the drying yard and the optical sorter, which none of them could afford alone. This natural lot is the fruit of that pooling: twenty-one days of drying demand a watchfulness one pair of hands cannot keep.',
        zh: '缅甸边境沿线的七个家庭组成合作社，共用晾晒场与光学分选机——这是任何一户都无力独自购置的设备。这支日晒批次正源于这种共享：二十一天的晾晒需要的看护，一双手撑不下来。',
      },
      photo: 'cerises-branche',
    },
    related: ['lot-23-01-baoshan', 'lot-23-03-puer', 'coffret-decouverte'],
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
      fr: "Huit sachets filtres individuels de 10 g, moulus et conditionnés sous atmosphère protectrice le jour de la torréfaction. L'assemblage de saison réunit nos lots de Baoshan et de Pu'er : douceur, fruit, longueur.",
      en: 'Eight individual 10 g filter sachets, ground and packed under protective atmosphere on roasting day. The seasonal blend brings together our Baoshan and Pu’er lots: sweetness, fruit, length.',
      zh: '八片独立滤袋，每片 10 克，于烘焙当天研磨并充氮封装。当季拼配融合保山与普洱批次：甜感、果香、余韵悠长。',
    },
    story: {
      fr: "Pensés pour le bureau, le train et les matins pressés — sans jamais renoncer à la tasse. Posez le sachet sur votre mug, versez en trois fois, retirez : trois minutes, aucun matériel.",
      en: 'Made for the office, the train and rushed mornings — without ever giving up on the cup. Rest the sachet on your mug, pour in three stages, remove: three minutes, no equipment.',
      zh: '为办公室、旅途与匆忙的清晨而做，却不必牺牲杯中的品质。挂在杯口，分三次注水，取下即可：三分钟，无需器具。',
    },
    specs: {
      origin: { fr: "Yunnan, Chine — Baoshan & Pu'er", en: "Yunnan, China — Baoshan & Pu'er", zh: '中国云南 — 保山与普洱' },
      altitude: { fr: '1 400 – 1 800 m', en: '1,400 – 1,800 m', zh: '1400 – 1800 米' },
      variety: { fr: 'Catimor, Typica', en: 'Catimor, Typica', zh: '卡蒂姆、铁皮卡' },
      process: { fr: 'Lavé & honey', en: 'Washed & honey', zh: '水洗与蜜处理' },
      notes: { fr: 'Amande, abricot, cacao au lait', en: 'Almond, apricot, milk cocoa', zh: '杏仁、杏子、牛奶可可' },
      drying: { fr: 'Lits africains surélevés', en: 'Raised African beds', zh: '非洲高架床' },
      harvest: { fr: 'À la main, cerises mûres', en: 'Hand-picked, ripe cherries', zh: '手工采摘，成熟果实' },
      roast: { fr: 'Moyenne — mouture filtre', en: 'Medium — filter grind', zh: '中烘 — 手冲研磨度' },
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
    farm: {
      name: 'Baoshan & Pu’er',
      place: { fr: 'Deux fermes partenaires', en: 'Two partner farms', zh: '两家合作农场' },
      text: {
        fr: "Cet assemblage réunit le lavé de la famille Yang, à Baoshan, et le honey du jardin de Manlao, à Pu'er. Le premier apporte la structure et la propreté, le second la douceur et le parfum. Les proportions sont réajustées à chaque récolte pour que la tasse reste la même d'une boîte à l'autre.",
        en: 'This blend brings together the Yang family washed lot from Baoshan and the Manlao garden honey from Pu’er. The first brings structure and cleanliness, the second sweetness and perfume. Proportions are adjusted at every harvest so the cup stays the same from one box to the next.',
        zh: '这款拼配融合了保山杨家的水洗批次与普洱曼老园的蜜处理批次。前者带来结构与干净度，后者带来甜感与香气。每一季都会重新调整比例，让每一盒的风味保持一致。',
      },
      photo: 'sechage-lits',
    },
    related: ['drip-bags-a-composer', 'coffret-decouverte', 'lot-23-01-baoshan'],
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
        label: { fr: '4 × Catimor + 4 × Bourbon jaune', en: '4 × Catimor + 4 × Yellow Bourbon', zh: '4 片卡蒂姆 + 4 片黄波旁' },
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
      fr: "Une boîte de huit drip bags composée par vous, à partir de deux variétés cultivées sur la même ferme, à Gaoshen : le Catimor, rond et cacaoté, et le Bourbon jaune, plus fin et floral. Prenez-en huit d'une seule, ou quatre de chaque pour les comparer tasse après tasse.",
      en: 'A box of eight drip bags composed by you, from two varieties grown on the same farm in Gaoshen: Catimor, round and cocoa-like, and Yellow Bourbon, finer and floral. Take eight of one, or four of each to compare them cup after cup.',
      zh: '由您自行组合的八片挂耳，两种品种来自高神的同一座农场：卡蒂姆，圆润带可可感；黄波旁，更细腻、更具花香。可以八片同款，也可以各四片，一杯一杯地比较。',
    },
    story: {
      fr: "Même terre, même altitude, même traitement, même torréfaction : seule la variété change. C'est la comparaison la plus honnête que l'on puisse proposer, et la plus instructive. La plupart des gens ne s'entendent pas dire « je préfère le Bourbon jaune » avant d'avoir bu les deux à la suite.",
      en: 'Same soil, same altitude, same processing, same roast: only the variety changes. It is the most honest comparison we can offer, and the most instructive. Most people never hear themselves say “I prefer the Yellow Bourbon” until they have drunk both in a row.',
      zh: '同一片土地、同样的海拔、同样的处理与烘焙：只有品种不同。这是我们能提供的最诚实、也最有启发的比较。多数人要连着喝过两杯，才会听见自己说出"我更喜欢黄波旁"。',
    },
    specs: {
      origin: { fr: 'Yunnan, Chine — Gaoshen, Baoshan', en: 'Yunnan, China — Gaoshen, Baoshan', zh: '中国云南 — 保山 高神' },
      altitude: { fr: '1 550 – 1 750 m', en: '1,550 – 1,750 m', zh: '1550 – 1750 米' },
      variety: { fr: 'Catimor ou Bourbon jaune', en: 'Catimor or Yellow Bourbon', zh: '卡蒂姆 或 黄波旁' },
      process: { fr: 'Lavé', en: 'Washed', zh: '水洗' },
      notes: {
        fr: 'Catimor : cacao, noisette · Bourbon jaune : jasmin, sucre roux',
        en: 'Catimor: cocoa, hazelnut · Yellow Bourbon: jasmine, brown sugar',
        zh: '卡蒂姆：可可、榛果 · 黄波旁：茉莉、红糖',
      },
      drying: { fr: 'Lits africains surélevés, 14 jours', en: 'Raised African beds, 14 days', zh: '非洲高架床，14 天' },
      harvest: { fr: 'À la main, cerises mûres', en: 'Hand-picked, ripe cherries', zh: '手工采摘，成熟果实' },
      roast: { fr: 'Moyenne — mouture filtre', en: 'Medium — filter grind', zh: '中烘 — 手冲研磨度' },
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
    farm: {
      name: 'Ferme de Gaoshen',
      place: { fr: 'Baoshan, Yunnan', en: 'Baoshan, Yunnan', zh: '云南 保山' },
      text: {
        fr: "À Gaoshen, sur les hauteurs de Baoshan, une même exploitation conduit côte à côte deux variétés que tout oppose en tasse. Le Catimor occupe les parcelles basses, plus exposées ; le Bourbon jaune, plus fragile et deux fois moins productif, est réservé aux terrasses hautes. Les deux sont récoltés, lavés et séchés exactement de la même manière — c'est ce qui rend la comparaison possible.",
        en: 'At Gaoshen, above Baoshan, a single estate grows side by side two varieties that oppose each other in the cup. Catimor takes the lower, more exposed plots; Yellow Bourbon, more fragile and half as productive, is kept for the high terraces. Both are picked, washed and dried in exactly the same way — which is what makes the comparison possible.',
        zh: '在保山高处的高神，同一座农场并排种植着两个在杯中截然不同的品种。卡蒂姆种在较低、日照更强的地块；更娇弱、产量只有一半的黄波旁则留给高处的梯田。两者的采摘、水洗与晾晒完全一致——正因如此，比较才有意义。',
      },
      photo: 'sechage-lits',
    },
    related: ['drip-bags-x8', 'lot-23-01-baoshan', 'coffret-decouverte'],
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
        price: 62,
        weightGrams: 680,
        available: true,
      },
    ],
    lot: 'Coffret',
    name: { fr: 'Coffret Découverte', en: 'Discovery Set', zh: '发现礼盒' },
    subtitle: { fr: '3 × 200 g + 1 boîte de drip bags', en: '3 × 200 g + 1 box of drip bags', zh: '3 × 200 克 + 1 盒挂耳' },
    short: {
      fr: 'Les trois terroirs, plus les drip bags.',
      en: 'The three terroirs, plus the drip bags.',
      zh: '三片风土，外加一盒挂耳。',
    },
    description: {
      fr: "Le meilleur moyen de comprendre le Yunnan : trois lots de 200 g — Baoshan lavé, Pu'er honey, Menglian naturel — et une boîte de huit drip bags pour emporter la dégustation avec vous.",
      en: 'The best way to understand Yunnan: three 200 g lots — washed Baoshan, honey Pu’er, natural Menglian — and a box of eight drip bags to take the tasting with you.',
      zh: '认识云南最好的方式：三支 200 克批次——水洗保山、蜜处理普洱、日晒孟连——外加八片挂耳，把这场品鉴带在身边。',
    },
    story: {
      fr: "Trois traitements, trois vallées, une même saison. Dégustez-les côte à côte : c'est là que le terroir se lit le plus clairement. Le coffret est accompagné d'une fiche de dégustation.",
      en: 'Three processes, three valleys, one same season. Taste them side by side: that is where the terroir reads most clearly. The set comes with a tasting sheet.',
      zh: '三种处理法、三条河谷、同一个产季。并排品尝，风土的差异最为清晰。礼盒附赠一张杯测记录卡。',
    },
    specs: {
      origin: { fr: 'Yunnan, Chine — 3 terroirs', en: 'Yunnan, China — 3 terroirs', zh: '中国云南 — 三个产区' },
      altitude: { fr: '1 300 – 1 800 m', en: '1,300 – 1,800 m', zh: '1300 – 1800 米' },
      variety: { fr: 'Catimor, Typica, Bourbon', en: 'Catimor, Typica, Bourbon', zh: '卡蒂姆、铁皮卡、波旁' },
      process: { fr: 'Lavé, honey, naturel', en: 'Washed, honey, natural', zh: '水洗、蜜处理、日晒' },
      notes: { fr: 'Thé noir, pêche, fraise, cacao', en: 'Black tea, peach, strawberry, cocoa', zh: '红茶、桃子、草莓、可可' },
      drying: { fr: 'Lits africains surélevés', en: 'Raised African beds', zh: '非洲高架床' },
      harvest: { fr: 'Récolte 2023 – 2024', en: '2023 – 2024 harvest', zh: '2023 – 2024 产季' },
      roast: { fr: 'Claire à moyenne', en: 'Light to medium', zh: '浅至中烘' },
    },
    brew: {
      fr: 'Commencez par le Baoshan, puis le Pu’er, terminez par le Menglian : du plus délicat au plus expressif.',
      en: 'Start with the Baoshan, then the Pu’er, finish with the Menglian: from the most delicate to the most expressive.',
      zh: '建议顺序：先保山，再普洱，最后孟连——由细腻到浓烈。',
    },
    includes: [
      { fr: 'Sélection Lot N°23-01 — 200 g', en: 'Selection Lot No. 23-01 — 200 g', zh: '精选批次 N°23-01 — 200 克' },
      { fr: 'Sélection Lot N°23-03 — 200 g', en: 'Selection Lot No. 23-03 — 200 g', zh: '精选批次 N°23-03 — 200 克' },
      { fr: 'Sélection Lot N°23-05 — 200 g', en: 'Selection Lot No. 23-05 — 200 g', zh: '精选批次 N°23-05 — 200 克' },
      { fr: 'Drip Bags — boîte de 8', en: 'Drip Bags — box of 8', zh: '挂耳咖啡 — 8 片装' },
      { fr: 'Fiche de dégustation', en: 'Tasting sheet', zh: '杯测记录卡' },
    ],
    farm: {
      name: 'Nos trois fermes',
      place: { fr: 'Baoshan, Pu’er, Menglian', en: 'Baoshan, Pu’er, Menglian', zh: '保山、普洱、孟连' },
      text: {
        fr: "Le coffret rassemble le travail des trois fermes avec lesquelles nous travaillons depuis le début : la famille Yang à Baoshan, le jardin de Manlao à Pu'er, la coopérative de Menglian. Trois altitudes, trois traitements, trois façons de faire — c'est en les goûtant côte à côte qu'on entend ce que chacune apporte.",
        en: 'The set gathers the work of the three farms we have worked with from the start: the Yang family in Baoshan, the Manlao garden in Pu’er, the Menglian cooperative. Three altitudes, three processes, three ways of working — tasting them side by side is how you hear what each one brings.',
        zh: '这只礼盒汇集了我们自始合作的三家农场：保山的杨家、普洱的曼老园、孟连的合作社。三种海拔、三种处理法、三种做法——并排品尝，才听得见各自的声音。',
      },
      photo: 'recolte-cueilleurs',
    },
    related: ['lot-23-01-baoshan', 'lot-23-03-puer', 'drip-bags-x8'],
  },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const fromPrice = (p: Product) => Math.min(...p.variants.map((v) => v.price));
