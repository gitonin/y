import type { Lang } from '../i18n/utils';
import textes from '../../contenu/textes.json';

export type LegalSection = { title: string; body: string[] };
export type LegalDoc = Record<Lang, LegalSection[]>;

/**
 * Mentions légales et conditions générales — le texte vit dans
 * `contenu/textes.json`, sous « mentionsLegales » et « conditionsGenerales ».
 * Modèles à compléter avec vos informations définitives (SIREN, RCS, hébergeur…).
 */
export const mentions: LegalDoc = textes.mentionsLegales;
export const cgv: LegalDoc = textes.conditionsGenerales;
