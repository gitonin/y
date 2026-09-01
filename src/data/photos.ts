import type { ImageMetadata } from 'astro';
import type { Lang } from '../i18n/utils';

import recolteCueilleurs from '../assets/photos/recolte-cueilleurs.jpg';
import cretesBrumeuses from '../assets/photos/cretes-brumeuses.jpg';
import cerisesBranche from '../assets/photos/cerises-branche.jpg';
import sechageLits from '../assets/photos/sechage-lits.jpg';
import tabouretTerrasse from '../assets/photos/tabouret-terrasse.jpg';

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
} satisfies Record<string, Photo>;

export type PhotoName = keyof typeof photos;
export const photoNames = Object.keys(photos) as [PhotoName, ...PhotoName[]];
