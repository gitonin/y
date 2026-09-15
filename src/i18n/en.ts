/**
 * Textes du site en anglais — lus depuis `contenu/textes.json`.
 * TypeScript vérifie au build qu'il ne manque aucune clé par rapport au
 * français : une traduction oubliée arrête la publication.
 */
import type { Dict } from './fr';
import textes from '../../contenu/textes.json';

const en = textes.site.en;

export default en satisfies Dict;
