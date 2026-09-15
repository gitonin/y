/**
 * Textes du site en français.
 *
 * Ils ne vivent plus ici mais dans `contenu/textes.json`, à la racine du
 * projet : ce fichier-là se modifie et se téléverse sans toucher au code.
 * Ce module ne fait que le lire, et c'est lui qui fixe la forme attendue
 * des deux autres langues (voir `Dict` plus bas).
 */
import textes from '../../contenu/textes.json';

const fr = textes.site.fr;

export default fr;
export type Dict = typeof fr;
