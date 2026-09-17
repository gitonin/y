import type { ImageMetadata } from 'astro';
import type { Lang } from '../i18n/utils';

import torchEstateLot01 from '../assets/produits/torch-estate-lot-01.jpg';
import torchEstateLot02 from '../assets/produits/torch-estate-lot-02.jpg';
import yunLanEstate from '../assets/produits/yun-lan-estate.jpg';
import dripBagsCatimor from '../assets/produits/drip-bags-catimor.jpg';
import dripBagsBourbonJaune from '../assets/produits/drip-bags-bourbon-jaune.jpg';
import coffretDecouverte from '../assets/produits/coffret-decouverte.jpg';

export type Packshot = {
  src: ImageMetadata;
  /** Texte alternatif — description factuelle du visuel, utile au référencement. */
  alt: Record<Lang, string>;
};

/**
 * Photographies de packaging, une par référence.
 * Pour remplacer un visuel : déposez le nouveau fichier dans `src/assets/produits/`
 * sous le même nom — aucune autre modification n'est nécessaire.
 * Une référence absente de cette table garde le visuel dessiné par défaut.
 */
export const packshots = {
  'torch-estate-lot-01': {
    src: torchEstateLot01,
    alt: {
      fr: 'Sachet de café Yunma Torch Estate Lot 01, 200 g de grains du Yunnan, fermentation anaérobie double, sur fond crème',
      en: 'Yunma Torch Estate Lot 01 coffee pouch, 200 g of Yunnan beans, double anaerobic fermentation, on a cream background',
      zh: 'Yunma 火炬庄园 Lot 01 咖啡袋，200 克云南咖啡豆，双重厌氧发酵，米色背景',
    },
  },
  'torch-estate-lot-02': {
    src: torchEstateLot02,
    alt: {
      fr: 'Sachet de café Yunma Torch Estate Lot 02, 200 g de grains du Yunnan, traitement honey, sur fond crème',
      en: 'Yunma Torch Estate Lot 02 coffee pouch, 200 g of Yunnan beans, honey process, on a cream background',
      zh: 'Yunma 火炬庄园 Lot 02 咖啡袋，200 克云南咖啡豆，蜜处理，米色背景',
    },
  },
  'yun-lan-estate': {
    src: yunLanEstate,
    alt: {
      fr: 'Sachet de café Yunma Yun Lan Estate, 200 g de grains de Xishuangbanna, Yunnan, posé sur un lit de café moulu',
      en: 'Yunma Yun Lan Estate coffee pouch, 200 g of beans from Xishuangbanna, Yunnan, resting on a bed of ground coffee',
      zh: 'Yunma 云澜庄园咖啡袋，200 克云南西双版纳咖啡豆，置于咖啡粉之上',
    },
  },
  /* Les deux boîtes de 5 partagent pour l'instant le même visuel d'attente :
     déposer le bon fichier sous chacun de ces deux noms suffira à les
     distinguer, sans rien changer au code. */
  'drip-bags-catimor': {
    src: dripBagsCatimor,
    alt: {
      fr: 'Boîte Yunma de 5 drip bags Catimor, filtres individuels de 10 g, sur fond crème',
      en: 'Yunma box of 5 Catimor drip bags, single-serve 10 g filters, on a cream background',
      zh: 'Yunma 卡蒂姆挂耳咖啡 5 片装，每片 10 克，米色背景',
    },
  },
  'drip-bags-bourbon-jaune': {
    src: dripBagsBourbonJaune,
    alt: {
      fr: 'Boîte Yunma de 5 drip bags Bourbon jaune, filtres individuels de 10 g, sur fond crème',
      en: 'Yunma box of 5 Yellow Bourbon drip bags, single-serve 10 g filters, on a cream background',
      zh: 'Yunma 黄波旁挂耳咖啡 5 片装，每片 10 克，米色背景',
    },
  },
  'coffret-decouverte': {
    src: coffretDecouverte,
    alt: {
      fr: 'Coffret Découverte Yunma : trois sachets de 200 g de cafés du Yunnan et une boîte de drip bags, sur fond crème',
      en: 'Yunma Discovery Set: three 200 g pouches of Yunnan coffee and a box of drip bags, on a cream background',
      zh: 'Yunma 发现礼盒：三袋 200 克云南咖啡与一盒挂耳咖啡，米色背景',
    },
  },
} satisfies Record<string, Packshot>;

/** Visuel photographique d'une référence, s'il en existe un. */
export const getPackshot = (slug: string): Packshot | undefined =>
  (packshots as Record<string, Packshot>)[slug];

/**
 * Couleur de fond de chaque photographie.
 *
 * La fiche produit ouvre sur une bande pleine largeur : elle reprend cette
 * couleur pour que le raccord entre la photographie et la bande ne se voie pas.
 * Les six visuels n'ont pas tout à fait le même beige — d'où un relevé par
 * référence, plutôt qu'une teinte commune qui jurerait avec cinq d'entre eux.
 *
 * Relevé par `node outils/fond-packshots.mjs` ; à relancer après remplacement
 * d'un visuel. Une référence absente retombe sur le beige du site.
 *
 * Le raccord n'est invisible que si le fond de la photographie est uni. Sur un
 * décor travaillé, la bande reste une teinte moyenne et la limite du cadre se
 * devine : c'est alors un visuel au format paysage qu'il faut, plutôt qu'un
 * carré élargi.
 */
const fonds = {
  'torch-estate-lot-01': '#dcd2c5',
  'torch-estate-lot-02': '#cec2b5',
  'yun-lan-estate': '#5e514a',
  'drip-bags-catimor': '#d6d3ca',
  'drip-bags-bourbon-jaune': '#d6d3ca',
  'coffret-decouverte': '#ded6c8',
} satisfies Record<string, string>;

/** Couleur de fond du visuel d'une référence, ou le beige du site à défaut. */
export const fondPackshot = (slug: string): string =>
  (fonds as Record<string, string>)[slug] ?? 'var(--paper)';
