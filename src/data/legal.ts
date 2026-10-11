import type { Lang } from '../i18n/utils';
import textes from '../../contenu/textes.json';

/**
 * Un bloc de texte légal : un paragraphe, ou un encadré.
 *
 * L'encadré sert aux formulaires types — celui de rétractation, que la loi
 * demande de mettre à disposition. Ce sont des lignes à recopier, non une
 * prose à lire : les enchaîner en paragraphes les rendrait illisibles.
 */
export type LegalBloc = string | { encadre: string[] };
export type LegalSection = { title: string; body: LegalBloc[] };
export type LegalDoc = Record<Lang, LegalSection[]>;

/**
 * Textes légaux — ils vivent dans `contenu/textes.json`.
 *
 * Les mentions légales sont traduites : ce sont quelques lignes d'identité,
 * et un client étranger doit pouvoir lire qui vend.
 *
 * Les conditions générales de vente et d'utilisation, elles, n'existent qu'en
 * français et sont servies telles quelles dans les trois langues. C'est un
 * choix assumé : un contrat traduit fait naître deux versions possiblement
 * divergentes, et il faudrait alors désigner celle qui fait foi. La page les
 * marque `lang="fr"` pour que lecteurs d'écran et moteurs sachent à quoi s'en
 * tenir.
 */
export const mentions: LegalDoc = textes.mentionsLegales;
export const cgv: LegalSection[] = textes.conditionsGenerales;
export const cgu: LegalSection[] = textes.conditionsUtilisation;
