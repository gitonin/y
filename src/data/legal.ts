import type { Lang } from '../i18n/utils';
import textes from '../../contenu/textes.json';

export type LegalSection = { title: string; body: string[] };
export type LegalDoc = Record<Lang, LegalSection[]>;

/**
 * Mentions légales et conditions générales — le texte vit dans
 * `contenu/textes.json`, sous « mentionsLegales » et « conditionsGenerales ».
 *
 * Ce sont les textes définitifs de la marque, et non plus des modèles : les pages ne
 * portent donc plus d'avertissement. Toute modification passe par le document
 * de contenu, comme le reste du site.
 */
export const mentions: LegalDoc = textes.mentionsLegales;
export const cgv: LegalDoc = textes.conditionsGenerales;
