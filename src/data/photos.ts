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
import cerisesBranche02 from '../assets/photos/cerises-branche-02.jpg';
import fermiersCafe from '../assets/photos/fermiers-cafe.jpg';
import mainPlante from '../assets/photos/main-plante.jpg';
import panneauPlantation from '../assets/photos/panneau-plantation.jpg';
import fondateursMerDeNuages from '../assets/photos/fondateurs-mer-de-nuages.jpg';
import sachetFiltreInfusion from '../assets/photos/sachet-filtre-infusion.jpg';
import histoireYunnan01 from '../assets/photos/histoire-du-cafe-du-yunnan-01.jpg';
import histoireYunnan02 from '../assets/photos/histoire-du-cafe-du-yunnan-02.jpg';
import histoireYunnan03 from '../assets/photos/histoire-du-cafe-du-yunnan-03.jpg';
import terroirs01 from '../assets/photos/trois-terroirs-du-cafe-du-yunnan-01.jpg';
import terroirs02 from '../assets/photos/trois-terroirs-du-cafe-du-yunnan-02.jpg';
import terroirs03 from '../assets/photos/trois-terroirs-du-cafe-du-yunnan-03.jpg';
import varietes01 from '../assets/photos/catimor-bourbon-jaune-pacamara-01.jpg';
import varietes02 from '../assets/photos/catimor-bourbon-jaune-pacamara-02.jpg';
import varietes03 from '../assets/photos/catimor-bourbon-jaune-pacamara-03.jpg';

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
  'fondateurs-mer-de-nuages': {
    src: fondateursMerDeNuages,
    /* Photographie verticale, affichée dans une bande 16/9 sur grand écran :
       le cadrage est calé sur les deux visages, qui se tiennent entre le tiers
       et la moitié de la hauteur. Descendre ce réglage couperait les têtes. */
    alt: {
      fr: 'Jixuan et Antoine, fondateurs de Yunma, au lever du jour sur une crête du Yunnan au-dessus d’une mer de nuages, un café à la main',
      en: 'Jixuan and Antoine, founders of Yunma, at daybreak on a Yunnan ridge above a sea of clouds, coffee in hand',
      zh: '云马创始人 Jixuan 与 Antoine 清晨站在云南山脊上，脚下是云海，手中各捧一杯咖啡',
    },
    position: 'center 40%',
  },
  'recolte-cueilleurs': {
    src: recolteCueilleurs,
    alt: {
      fr: 'Vue aérienne d’une vallée du Yunnan : la ferme et ses hangars au premier plan, les parcelles de caféiers et les montagnes au fond',
      en: 'Aerial view of a Yunnan valley: the farm and its sheds in the foreground, coffee plots and mountains beyond',
      zh: '云南山谷航拍：前景是农场与厂房，远处是咖啡地块与群山',
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
      fr: 'Les mains d’un producteur trient les cerises de café dans le bac de lavage, après le dépulpage',
      en: 'A producer’s hands sorting coffee cherries in the washing tank, after pulping',
      zh: '咖农的双手在脱皮后的水洗池中挑拣咖啡果',
    },
    position: '55% 40%',
  },
  'tabouret-terrasse': {
    src: tabouretTerrasse,
    alt: {
      fr: 'Vue aérienne d’une rivière turquoise serpentant entre les collines boisées et les parcelles cultivées du Yunnan',
      en: 'Aerial view of a turquoise river winding between the wooded hills and cultivated plots of Yunnan',
      zh: '航拍云南：碧绿的河流蜿蜒穿过林木山丘与农田之间',
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
  /* Le geste, pas le terroir : cette photographie sert l'article de méthode,
     là où les autres racontent la provenance. */
  'sachet-filtre-infusion': {
    src: sachetFiltreInfusion,
    alt: {
      fr: 'Un sachet filtre Yunma posé sur une tasse blanche, à côté d’une bouilloire à col de cygne, dans une cuisine sombre éclairée par la fenêtre',
      en: 'A Yunma filter sachet resting on a white mug beside a gooseneck kettle, in a dark kitchen lit by the window',
      zh: '云马挂耳咖啡架在白色马克杯上，旁边是细口手冲壶，昏暗的厨房里只有窗光',
    },
    position: '50% 60%',
  },
  /* ---------- Journal ----------
     Une photographie par emplacement d'article : l'en-tête en -01, puis les
     coupures dans l'ordre. Les visuels posés ici sont provisoires — déposer un
     fichier sous le même nom dans `src/assets/photos/` suffit à le remplacer,
     sans toucher à une ligne de code. */
  'histoire-du-cafe-du-yunnan-01': {
    src: histoireYunnan01,
    alt: {
      fr: 'Vallées et crêtes du Yunnan dans la brume, au-dessus des parcelles de caféiers',
      en: 'Misty valleys and ridges of Yunnan above plots of coffee trees',
      zh: '云雾中的云南山谷与山脊，下方是咖啡地块',
    },
    position: '50% 55%',
  },
  'histoire-du-cafe-du-yunnan-02': {
    src: histoireYunnan02,
    alt: {
      fr: 'Panneau à l’entrée d’une plantation de café du Yunnan',
      en: 'Sign at the entrance to a Yunnan coffee plantation',
      zh: '云南一处咖啡种植园入口的牌子',
    },
    position: '50% 50%',
  },
  'histoire-du-cafe-du-yunnan-03': {
    src: histoireYunnan03,
    alt: {
      fr: 'Producteurs de café du Yunnan au travail dans les rangs de caféiers',
      en: 'Yunnan coffee farmers at work between the rows of coffee trees',
      zh: '云南咖农在咖啡树行间劳作',
    },
    position: '50% 50%',
  },
  'trois-terroirs-du-cafe-du-yunnan-01': {
    src: terroirs01,
    alt: {
      fr: 'Vue d’une vallée caféière du Yunnan : la ferme au premier plan, les parcelles et les montagnes au fond',
      en: 'View of a Yunnan coffee valley: the farm in the foreground, plots and mountains beyond',
      zh: '云南咖啡山谷全景：前景是农场，远处是地块与群山',
    },
    position: '62% 70%',
  },
  'trois-terroirs-du-cafe-du-yunnan-02': {
    src: terroirs02,
    alt: {
      fr: 'La ferme de Gaosheng, à Baoshan, dans les hauteurs de l’ouest du Yunnan',
      en: 'Gaosheng farm in Baoshan, in the highlands of western Yunnan',
      zh: '云南西部高地保山的高晟庄园',
    },
    position: '50% 50%',
  },
  'trois-terroirs-du-cafe-du-yunnan-03': {
    src: terroirs03,
    alt: {
      fr: 'La ferme Torch Estate, à Pu’er, cœur de la production caféière chinoise',
      en: 'Torch Estate farm in Pu’er, the heart of Chinese coffee production',
      zh: '普洱火炬庄园，中国咖啡生产的核心地带',
    },
    position: '50% 50%',
  },
  'catimor-bourbon-jaune-pacamara-01': {
    src: varietes01,
    alt: {
      fr: 'Branche chargée de cerises de café rouges et jaunes à maturité',
      en: 'Branch laden with ripe red and yellow coffee cherries',
      zh: '缀满成熟红黄咖啡果的枝条',
    },
    position: '50% 50%',
  },
  'catimor-bourbon-jaune-pacamara-02': {
    src: varietes02,
    alt: {
      fr: 'Un jeune plant de caféier tenu dans une main, avant la mise en terre',
      en: 'A young coffee seedling held in a hand, before planting',
      zh: '手中捧着的咖啡幼苗，准备移栽',
    },
    position: '50% 50%',
  },
  'catimor-bourbon-jaune-pacamara-03': {
    src: varietes03,
    alt: {
      fr: 'Cerises de café à différents stades de maturité sur la branche',
      en: 'Coffee cherries at different stages of ripeness on the branch',
      zh: '枝头处于不同成熟阶段的咖啡果',
    },
    position: '50% 50%',
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
  'cerises-branche-02': {
    src: cerisesBranche02,
    alt: {
      fr: 'Branche de caféier chargée de cerises rouges, orange et vertes, les montagnes du Yunnan en arrière-plan',
      en: 'A coffee branch laden with red, orange and green cherries, the Yunnan mountains behind',
      zh: '咖啡枝上挂满红、橙、绿的咖啡果，背景是云南群山',
    },
    position: '65% 55%',
  },
  'fermiers-cafe': {
    src: fermiersCafe,
    alt: {
      fr: 'Deux hommes près de sacs de café vert empilés, devant la machine de décorticage',
      en: 'Two men beside stacked sacks of green coffee, in front of the hulling machine',
      zh: '两位工人站在成堆的生豆麻袋旁，身后是脱壳机',
    },
    position: '50% 45%',
  },
  'main-plante': {
    src: mainPlante,
    alt: {
      fr: 'Deux mains tenant deux jeunes plants de caféier dans leurs godets de terre',
      en: 'Two hands holding two young coffee seedlings in their soil pots',
      zh: '双手捧着两株育苗盆中的咖啡幼苗',
    },
    position: '50% 55%',
  },
  'panneau-plantation': {
    src: panneauPlantation,
    alt: {
      fr: 'Panneau de bois « 加工种植区 — Coffee plantation » planté au milieu des rangs de caféiers',
      en: 'A wooden sign reading “加工种植区 — Coffee plantation” standing among the rows of coffee trees',
      zh: '咖啡林间立着写有「加工种植区 — Coffee plantation」的木牌',
    },
    position: '50% 60%',
  },
} satisfies Record<string, Photo>;

export type PhotoName = keyof typeof photos;
export const photoNames = Object.keys(photos) as [PhotoName, ...PhotoName[]];
