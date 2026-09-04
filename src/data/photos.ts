import type { ImageMetadata } from 'astro';
import type { Lang } from '../i18n/utils';

import recolteCueilleurs from '../assets/photos/recolte-cueilleurs.jpg';
import cretesBrumeuses from '../assets/photos/cretes-brumeuses.jpg';
import cerisesBranche from '../assets/photos/cerises-branche.jpg';
import sechageLits from '../assets/photos/sechage-lits.jpg';
import tabouretTerrasse from '../assets/photos/tabouret-terrasse.jpg';
import fermeTorchEstate from '../assets/photos/ferme-torch-estate.jpg';
import fermeYunLanEstate from '../assets/photos/ferme-yun-lan-estate.jpg';
import fermeGaosheng from '../assets/photos/ferme-gaosheng.jpg';
import producteurTorchEstate from '../assets/photos/producteur-torch-estate.jpg';
import producteurYunLanEstate from '../assets/photos/producteur-yun-lan-estate.jpg';
import producteurGaosheng from '../assets/photos/producteur-gaosheng.jpg';

export type Photo = {
  src: ImageMetadata;
  /** Texte alternatif — description factuelle, utile au référencement. */
  alt: Record<Lang, string>;
  /** Cadrage par défaut, réglé pour les formats larges (object-position). */
  position: string;
};

/**
 * Photographies de la marque.
 * Pour remplacer une image : déposez le nouveau fichier dans `src/assets/photos/`
 * et changez l'import ci-dessous — aucune autre modification n'est nécessaire.
 */
export const photos = {
  'recolte-cueilleurs': {
    src: recolteCueilleurs,
    alt: {
      fr: 'Cueilleurs récoltant les cerises de café à flanc de montagne, au lever du jour, dans la brume du Yunnan',
      en: 'Pickers harvesting coffee cherries on a mountainside at sunrise, in the mist of Yunnan',
      zh: '清晨薄雾中，采摘工在云南山坡上采收咖啡果',
    },
    position: '62% 70%',
  },
  'cretes-brumeuses': {
    src: cretesBrumeuses,
    alt: {
      fr: 'Vallées et crêtes du Yunnan noyées de brume au-dessus d’une parcelle de caféiers',
      en: 'Misty valleys and ridges of Yunnan above a plot of coffee trees',
      zh: '云雾笼罩的云南山谷与山脊，下方是一片咖啡地块',
    },
    position: '50% 68%',
  },
  'cerises-branche': {
    src: cerisesBranche,
    alt: {
      fr: 'Branche de caféier chargée de cerises rouges et jaunes, éclairée par le soleil rasant',
      en: 'Coffee branch laden with red and yellow cherries, lit by low sunlight',
      zh: '斜阳下挂满红黄咖啡果的枝条',
    },
    position: '68% 62%',
  },
  'sechage-lits': {
    src: sechageLits,
    alt: {
      fr: 'Producteur retournant les cerises de café sur des lits de séchage surélevés en bambou',
      en: 'Producer turning coffee cherries on raised bamboo drying beds',
      zh: '咖农在竹制高架晾晒床上翻动咖啡果',
    },
    position: '72% 66%',
  },
  'tabouret-terrasse': {
    src: tabouretTerrasse,
    alt: {
      fr: 'Tabouret de bois et de paille tressée sur une terrasse de pierre, face aux montagnes brumeuses',
      en: 'Woven wooden stool on a stone terrace, facing the misty mountains',
      zh: '石砌露台上的木制藤编凳，面朝云雾中的群山',
    },
    position: '58% 74%',
  },

  /* Les fermes partenaires, et les gestes de ceux qui y travaillent. */
  'ferme-torch-estate': {
    src: fermeTorchEstate,
    alt: {
      fr: 'Deux producteurs de Torch Estate au milieu des caféiers en fleur, à Pu’er',
      en: 'Two Torch Estate producers among the flowering coffee trees in Pu’er',
      zh: '火炬庄园的两位咖农站在普洱开花的咖啡树间',
    },
    position: '50% 50%',
  },
  'ferme-yun-lan-estate': {
    src: fermeYunLanEstate,
    alt: {
      fr: 'Producteur de Yun Lan Estate inspectant le feuillage d’un caféier, à Xishuangbanna',
      en: 'Yun Lan Estate producer inspecting the foliage of a coffee tree in Xishuangbanna',
      zh: '云澜庄园的咖农在西双版纳查看咖啡树的叶片',
    },
    position: '55% 50%',
  },
  'ferme-gaosheng': {
    src: fermeGaosheng,
    alt: {
      fr: 'Cueilleuse détachant les cerises mûres d’une branche à Gaosheng Manor, montagnes de Baoshan en arrière-plan',
      en: 'Picker taking ripe cherries off a branch at Gaosheng Manor, the Baoshan mountains behind',
      zh: '高晟庄园的采摘工从枝头摘下成熟咖啡果，身后是保山群山',
    },
    position: '55% 45%',
  },
  'producteur-torch-estate': {
    src: producteurTorchEstate,
    alt: {
      fr: 'Portrait des deux producteurs de Torch Estate devant leurs caféiers, à Pu’er',
      en: 'Portrait of the two Torch Estate producers in front of their coffee trees in Pu’er',
      zh: '火炬庄园两位咖农在自家咖啡树前的合影',
    },
    /* Les visages sont hauts dans le cadre : le bandeau doit garder leur tête. */
    position: '50% 32%',
  },
  'producteur-yun-lan-estate': {
    src: producteurYunLanEstate,
    alt: {
      fr: 'Cueilleur au travail entre les rangs de caféiers de Yun Lan Estate, à Xishuangbanna',
      en: 'Picker at work between the rows of coffee trees at Yun Lan Estate, Xishuangbanna',
      zh: '采摘工在西双版纳云澜庄园的咖啡树行间劳作',
    },
    position: '50% 55%',
  },
  'producteur-gaosheng': {
    src: producteurGaosheng,
    alt: {
      fr: 'Mains d’un producteur triant les cerises de café au dépulpeur, à Gaosheng Manor',
      en: 'A producer’s hands sorting coffee cherries at the pulper, Gaosheng Manor',
      zh: '高晟庄园，咖农的双手在脱皮机旁挑选咖啡果',
    },
    position: '55% 55%',
  },
} satisfies Record<string, Photo>;

export type PhotoName = keyof typeof photos;
export const photoNames = Object.keys(photos) as [PhotoName, ...PhotoName[]];
