import type { ImageMetadata } from 'astro';
import type { Lang } from '../i18n/utils';

import torchEstateLot01 from '../assets/produits/torch-estate-lot-01.jpg';
import torchEstateLot02 from '../assets/produits/torch-estate-lot-02.jpg';
import yunLanEstate from '../assets/produits/yun-lan-estate.jpg';
import sachetFiltreCatimor from '../assets/produits/sachet-filtre-catimor.jpg';
import sachetFiltreBourbon from '../assets/produits/sachet-filtre-bourbon.jpg';
import offreDecouverte from '../assets/produits/offre-decouverte.jpg';

export type Packshot = {
  src: ImageMetadata;
  /** Texte alternatif — description factuelle du visuel, utile au référencement. */
  alt: Record<Lang, string>;
};

/**
 * Photographies de packaging, une par référence.
 *
 * La clé est celle du produit ; le fichier est nommé juste au-dessus, dans les
 * imports. Pour remplacer un visuel : déposez le nouveau fichier dans
 * `src/assets/produits/` sous le même nom que celui qu'il remplace — aucune
 * autre modification n'est nécessaire. Sous un autre nom, il faut aussi
 * corriger l'import correspondant.
 *
 * Une référence absente de cette table garde le visuel dessiné par défaut.
 */
export const packshots = {
  'torch-estate-lot-01': {
    src: torchEstateLot01,
    alt: {
      fr: 'Sachet de café Yunma Torch Estate Lot 01, 200 g de grains du Yunnan, honey anaérobie double, posé sur une console de bois patinée devant une porte anthracite',
      en: 'Yunma Torch Estate Lot 01 coffee pouch, 200 g of Yunnan beans, double anaerobic honey, on a weathered wooden wall bracket against a charcoal door',
      zh: 'Yunma 火炬庄园 Lot 01 咖啡袋，200 克云南咖啡豆，双重厌氧蜜处理，置于深灰门前的旧木托架上',
    },
  },
  'torch-estate-lot-02': {
    src: torchEstateLot02,
    alt: {
      fr: 'Sachet de café Yunma Torch Estate Lot 02, 200 g de grains du Yunnan, honey traditionnel, posé sur une console de bois patinée devant une porte anthracite',
      en: 'Yunma Torch Estate Lot 02 coffee pouch, 200 g of Yunnan beans, traditional honey, on a weathered wooden wall bracket against a charcoal door',
      zh: 'Yunma 火炬庄园 Lot 02 咖啡袋，200 克云南咖啡豆，传统蜜处理，置于深灰门前的旧木托架上',
    },
  },
  'yun-lan-estate': {
    src: yunLanEstate,
    alt: {
      fr: 'Sachet de café Yunma Yun Lan Estate, 200 g de grains de Xishuangbanna, Yunnan, posé sur une console de bois patinée devant une porte anthracite',
      en: 'Yunma Yun Lan Estate coffee pouch, 200 g of beans from Xishuangbanna, Yunnan, on a weathered wooden wall bracket against a charcoal door',
      zh: 'Yunma 云澜庄园咖啡袋，200 克云南西双版纳咖啡豆，置于深灰门前的旧木托架上',
    },
  },
  'drip-bags-catimor': {
    src: sachetFiltreCatimor,
    alt: {
      fr: 'Étui Yunma de 5 sachets filtres Catimor de Gaosheng, Baoshan, et un sachet individuel noir, sur une console de bois patinée devant une porte anthracite',
      en: 'Yunma pack of 5 Catimor filter sachets from Gaosheng, Baoshan, with one black single-serve sachet, on a weathered wooden wall bracket against a charcoal door',
      zh: 'Yunma 保山高晟卡蒂姆挂耳咖啡 5 片装与一片黑色独立包装，置于深灰门前的旧木托架上',
    },
  },
  'drip-bags-bourbon-jaune': {
    src: sachetFiltreBourbon,
    alt: {
      fr: 'Étui Yunma de 5 sachets filtres Bourbon jaune de Gaosheng, Baoshan, et une tasse blanche garnie de sachets, sur une console de bois patinée devant une porte anthracite',
      en: 'Yunma pack of 5 Yellow Bourbon filter sachets from Gaosheng, Baoshan, with a white mug holding the sachets, on a weathered wooden wall bracket against a charcoal door',
      zh: 'Yunma 保山高晟黄波旁挂耳咖啡 5 片装与盛着挂耳包的白色马克杯，置于深灰门前的旧木托架上',
    },
  },
  'coffret-decouverte': {
    src: offreDecouverte,
    alt: {
      fr: 'Offre Découverte Yunma : les deux étuis de sachets filtres Catimor et Bourbon jaune devant trois sachets de 200 g, sur une console de bois patinée',
      en: 'Yunma Discovery Offer: the two packs of Catimor and Yellow Bourbon filter sachets in front of three 200 g pouches, on a weathered wooden wall bracket',
      zh: 'Yunma 发现装：卡蒂姆与黄波旁挂耳咖啡两盒，身后是三袋 200 克咖啡豆，置于旧木托架上',
    },
  },
} satisfies Record<string, Packshot>;

/** Visuel photographique d'une référence, s'il en existe un. */
export const getPackshot = (slug: string): Packshot | undefined =>
  (packshots as Record<string, Packshot>)[slug];
