import type { ImageMetadata } from 'astro';
import type { Lang } from '../i18n/utils';

import torchEstateLot01 from '../assets/produits/torch-estate-lot-01.png';
import torchEstateLot02 from '../assets/produits/torch-estate-lot-02.png';
import yunLanEstate from '../assets/produits/yun-lan-estate.png';
import dripBagsX8 from '../assets/produits/drip-bags-x8.png';
import dripBagsAComposer from '../assets/produits/drip-bags-a-composer.png';
import coffretDecouverte from '../assets/produits/coffret-decouverte.png';

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
      fr: 'Sachet de café Yunma Yun Lan Estate, 200 g de grains de Xishuangbanna, Yunnan, sur fond crème',
      en: 'Yunma Yun Lan Estate coffee pouch, 200 g of beans from Xishuangbanna, Yunnan, on a cream background',
      zh: 'Yunma 云澜庄园咖啡袋，200 克云南西双版纳咖啡豆，米色背景',
    },
  },
  'drip-bags-x8': {
    src: dripBagsX8,
    alt: {
      fr: 'Boîte Yunma de 8 drip bags de café du Yunnan, filtres individuels de 10 g, sur fond crème',
      en: 'Yunma box of 8 Yunnan coffee drip bags, single-serve 10 g filters, on a cream background',
      zh: 'Yunma 云南挂耳咖啡 8 片装，每片 10 克，米色背景',
    },
  },
  'drip-bags-a-composer': {
    src: dripBagsAComposer,
    alt: {
      fr: 'Boîte Yunma de drip bags à composer, filtres individuels Catimor et Bourbon jaune au choix, sur fond crème',
      en: 'Yunma build-your-own drip bag box, single-serve Catimor and Yellow Bourbon filters, on a cream background',
      zh: 'Yunma 自选挂耳咖啡盒，可选卡蒂姆与黄波旁单片滤包，米色背景',
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
