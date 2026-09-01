import { languages } from './utils';

export const langPaths = () => languages.map((lang) => ({ params: { lang } }));
