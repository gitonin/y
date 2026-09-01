import type { Lang } from '../i18n/utils';

export type LegalSection = { title: string; body: string[] };
export type LegalDoc = Record<Lang, LegalSection[]>;

/** Modèles à compléter avec vos informations légales définitives (SIREN, RCS, hébergeur…). */
export const mentions: LegalDoc = {
  fr: [
    {
      title: 'Éditeur du site',
      body: [
        'Yunma — SAS au capital de 10 000 €, immatriculée au RCS de Paris sous le numéro 000 000 000.',
        'Siège social : 12 rue des Torréfacteurs, 75011 Paris, France.',
        'Numéro de TVA intracommunautaire : FR00 000000000. Directeur de la publication : la direction de Yunma.',
        'Contact : hello@yunma.fr — +33 6 00 00 00 00.',
      ],
    },
    {
      title: 'Hébergement',
      body: [
        'Le site est hébergé sur une plateforme d’hébergement statique. Les paiements, les commandes et les expéditions sont opérés par Shopify International Limited, Victoria Buildings, 1-2 Haddington Road, Dublin 4, D04 XN32, Irlande.',
      ],
    },
    {
      title: 'Propriété intellectuelle',
      body: [
        'L’ensemble des contenus du site (textes, photographies, illustrations, identité visuelle, marque Yunma) est protégé par le droit d’auteur et le droit des marques. Toute reproduction, même partielle, est interdite sans autorisation écrite préalable.',
      ],
    },
    {
      title: 'Données personnelles',
      body: [
        'Les données collectées via les formulaires (nom, e-mail, message) servent uniquement à traiter votre demande. Les données de commande sont traitées par Shopify en qualité de sous-traitant.',
        'Conformément au RGPD, vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation et de portabilité de vos données : écrivez à hello@yunma.fr.',
        'Une réclamation peut être adressée à la CNIL (www.cnil.fr).',
      ],
    },
    {
      title: 'Cookies',
      body: [
        'Le site ne dépose aucun cookie publicitaire. Seuls des cookies strictement nécessaires au fonctionnement du panier et du paiement (Shopify) sont utilisés.',
      ],
    },
  ],
  en: [
    {
      title: 'Site publisher',
      body: [
        'Yunma — SAS with capital of €10,000, registered with the Paris Trade Register under number 000 000 000.',
        'Registered office: 12 rue des Torréfacteurs, 75011 Paris, France.',
        'EU VAT number: FR00 000000000. Publication director: Yunma management.',
        'Contact: hello@yunma.fr — +33 6 00 00 00 00.',
      ],
    },
    {
      title: 'Hosting',
      body: [
        'The site is hosted on a static hosting platform. Payments, orders and shipping are operated by Shopify International Limited, Victoria Buildings, 1-2 Haddington Road, Dublin 4, D04 XN32, Ireland.',
      ],
    },
    {
      title: 'Intellectual property',
      body: [
        'All site content (texts, photographs, illustrations, visual identity, the Yunma trademark) is protected by copyright and trademark law. Any reproduction, even partial, is prohibited without prior written permission.',
      ],
    },
    {
      title: 'Personal data',
      body: [
        'Data collected through the forms (name, email, message) is used solely to handle your request. Order data is processed by Shopify as a processor.',
        'Under the GDPR you have the right to access, rectify, erase, restrict and port your data: write to hello@yunma.fr.',
        'A complaint may be filed with the French data protection authority (www.cnil.fr).',
      ],
    },
    {
      title: 'Cookies',
      body: [
        'The site sets no advertising cookies. Only cookies strictly necessary for the cart and checkout (Shopify) are used.',
      ],
    },
  ],
  zh: [
    {
      title: '网站出版方',
      body: [
        'Yunma——注册资本 10,000 欧元的简易股份公司，巴黎商业登记号 000 000 000。',
        '注册地址：12 rue des Torréfacteurs, 75011 Paris, France。',
        '欧盟增值税号：FR00 000000000。出版负责人：云马管理层。',
        '联系方式：hello@yunma.fr — +33 6 00 00 00 00。',
      ],
    },
    {
      title: '托管',
      body: [
        '本网站托管于静态托管平台。支付、订单与配送由 Shopify International Limited（Victoria Buildings, 1-2 Haddington Road, Dublin 4, D04 XN32, Ireland）负责。',
      ],
    },
    {
      title: '知识产权',
      body: [
        '网站全部内容（文字、图片、插画、视觉识别、Yunma 商标）受著作权与商标法保护。未经事先书面许可，禁止任何形式的复制，包括部分复制。',
      ],
    },
    {
      title: '个人数据',
      body: [
        '通过表单收集的数据（姓名、邮箱、留言）仅用于处理您的请求。订单数据由 Shopify 作为受托方处理。',
        '根据 GDPR，您享有访问、更正、删除、限制处理与数据可携权：请来信 hello@yunma.fr。',
        '您也可向法国数据保护机构 CNIL（www.cnil.fr）投诉。',
      ],
    },
    {
      title: 'Cookie',
      body: ['本网站不投放广告 Cookie，仅使用购物车与支付（Shopify）所必需的 Cookie。'],
    },
  ],
};

export const cgv: LegalDoc = {
  fr: [
    {
      title: 'Objet et champ d’application',
      body: [
        'Les présentes conditions générales régissent les ventes de cafés et accessoires réalisées par Yunma auprès des consommateurs, via la boutique en ligne. Toute commande implique leur acceptation sans réserve.',
      ],
    },
    {
      title: 'Produits',
      body: [
        'Les cafés sont vendus en grains, en sachets de 200 g, en drip bags ou en coffrets. Les photographies et illustrations sont les plus fidèles possible mais ne constituent pas un engagement contractuel sur l’aspect exact du produit.',
        'Les lots étant issus de récoltes saisonnières, une référence peut être remplacée par un lot équivalent, avec information préalable.',
      ],
    },
    {
      title: 'Prix et paiement',
      body: [
        'Les prix sont indiqués en euros, toutes taxes comprises, hors frais de livraison. Les frais de port sont calculés au moment du paiement.',
        'Le paiement s’effectue en ligne via Shopify Payments (cartes bancaires, Apple Pay, Google Pay, PayPal, Shop Pay). La commande est validée après autorisation du paiement.',
      ],
    },
    {
      title: 'Livraison',
      body: [
        'Les commandes sont préparées sous 48 heures ouvrées après la torréfaction la plus proche. Délais indicatifs : 2 à 3 jours ouvrés en France, 3 à 6 jours ouvrés dans l’Union européenne.',
        'La livraison est offerte à partir de 45 € d’achat en France métropolitaine. Les risques sont transférés à la remise du colis.',
      ],
    },
    {
      title: 'Droit de rétractation',
      body: [
        'Conformément aux articles L221-18 et suivants du Code de la consommation, vous disposez de 14 jours à compter de la réception pour exercer votre droit de rétractation sur un produit non ouvert, en écrivant à hello@yunma.fr.',
        'Les denrées alimentaires descellées après la livraison ne peuvent être reprises pour des raisons d’hygiène (article L221-28).',
      ],
    },
    {
      title: 'Garanties et réclamations',
      body: [
        'Les garanties légales de conformité et des vices cachés s’appliquent. En cas de colis endommagé ou de produit non conforme, écrivez à hello@yunma.fr sous 14 jours avec une photographie.',
      ],
    },
    {
      title: 'Droit applicable et litiges',
      body: [
        'Les présentes conditions sont soumises au droit français. En cas de litige, une solution amiable sera recherchée avant toute action judiciaire. La plateforme européenne de règlement en ligne des litiges est accessible sur ec.europa.eu/consumers/odr.',
      ],
    },
  ],
  en: [
    {
      title: 'Purpose and scope',
      body: [
        'These terms govern the sale of coffee and accessories by Yunma to consumers through the online shop. Placing an order implies unreserved acceptance of these terms.',
      ],
    },
    {
      title: 'Products',
      body: [
        'Coffees are sold as whole beans in 200 g bags, as drip bags or as sets. Photographs and illustrations are as faithful as possible but do not constitute a contractual commitment on the exact appearance of the product.',
        'As lots come from seasonal harvests, a reference may be replaced by an equivalent lot, with prior notice.',
      ],
    },
    {
      title: 'Prices and payment',
      body: [
        'Prices are shown in euros, all taxes included, excluding delivery costs. Shipping is calculated at checkout.',
        'Payment is made online through Shopify Payments (cards, Apple Pay, Google Pay, PayPal, Shop Pay). The order is confirmed once payment is authorised.',
      ],
    },
    {
      title: 'Delivery',
      body: [
        'Orders are prepared within 48 business hours of the closest roast. Indicative times: 2 to 3 business days in France, 3 to 6 business days within the European Union.',
        'Delivery is free from €45 within mainland France. Risk transfers on handover of the parcel.',
      ],
    },
    {
      title: 'Right of withdrawal',
      body: [
        'Under articles L221-18 et seq. of the French Consumer Code, you have 14 days from receipt to exercise your right of withdrawal on an unopened product, by writing to hello@yunma.fr.',
        'Food products unsealed after delivery cannot be returned for hygiene reasons (article L221-28).',
      ],
    },
    {
      title: 'Warranties and claims',
      body: [
        'Statutory warranties of conformity and against hidden defects apply. For a damaged parcel or a non-conforming product, write to hello@yunma.fr within 14 days with a photograph.',
      ],
    },
    {
      title: 'Governing law and disputes',
      body: [
        'These terms are governed by French law. In the event of a dispute, an amicable solution will be sought before any legal action. The European online dispute resolution platform is available at ec.europa.eu/consumers/odr.',
      ],
    },
  ],
  zh: [
    {
      title: '目的与适用范围',
      body: ['本条款适用于云马通过在线商店向消费者销售咖啡及相关产品的行为。下单即表示无保留地接受本条款。'],
    },
    {
      title: '产品',
      body: [
        '咖啡以 200 克咖啡豆、挂耳咖啡或礼盒形式销售。图片与插画力求真实，但不构成对产品外观的合同承诺。',
        '由于批次来自季节性采收，某一款可能以同等品质的批次替代，我们会提前告知。',
      ],
    },
    {
      title: '价格与支付',
      body: [
        '价格以欧元标示，含税，不含运费。运费在结算时计算。',
        '支付通过 Shopify Payments 在线完成（银行卡、Apple Pay、Google Pay、PayPal、Shop Pay）。支付授权后订单方才生效。',
      ],
    },
    {
      title: '配送',
      body: [
        '订单在最近一次烘焙后的 48 个工作小时内备货。参考时效：法国境内 2 至 3 个工作日，欧盟 3 至 6 个工作日。',
        '法国本土满 45 欧元免运费。风险自包裹交付时转移。',
      ],
    },
    {
      title: '撤回权',
      body: [
        '根据法国消费法典 L221-18 及以下条款，未开封商品自收货起 14 天内可行使撤回权，请来信 hello@yunma.fr。',
        '出于卫生原因，交付后已拆封的食品不予退回（L221-28 条）。',
      ],
    },
    {
      title: '保证与投诉',
      body: ['法定的符合性保证与隐蔽瑕疵保证均适用。若包裹损坏或商品不符，请在 14 天内附照片来信 hello@yunma.fr。'],
    },
    {
      title: '适用法律与争议',
      body: [
        '本条款适用法国法律。发生争议时，将优先寻求友好解决。欧盟在线争议解决平台：ec.europa.eu/consumers/odr。',
      ],
    },
  ],
};
