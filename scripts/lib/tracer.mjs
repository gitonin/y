/**
 * Retient d'où vient chaque texte exporté.
 *
 * Les documents de relecture portent des codes lisibles — [accueil.heroTitle] —
 * qui ne disent rien du fichier ni de la clé d'où le texte provient. Pour
 * réinjecter une correction sans deviner, on enveloppe les sources dans un
 * mandataire qui note le chemin de la dernière chaîne lue. L'export appelle
 * `field(code, valeur)` juste après avoir lu la valeur : le chemin retenu à cet
 * instant est donc bien le sien.
 *
 * Deux limites, assumées : une valeur composée de plusieurs champs (un format et
 * son prix, par exemple) ne retient que le dernier lu, et une valeur lue puis
 * passée plus tard ne serait pas rattachée. L'import signale ces cas plutôt que
 * de les traiter à l'aveugle.
 */
export function tracer() {
  let dernier = null;

  const envelopper = (valeur, prefixe) => {
    if (!valeur || typeof valeur !== 'object') return valeur;
    return new Proxy(valeur, {
      get(cible, prop, recepteur) {
        if (typeof prop === 'symbol') return Reflect.get(cible, prop, recepteur);
        const brut = cible[prop];
        const chemin = prefixe ? `${prefixe}.${String(prop)}` : String(prop);
        if (typeof brut === 'string') {
          dernier = chemin;
          return brut;
        }
        /* Rendue telle quelle, et non liée à la cible : `forEach` et consorts
           doivent parcourir le mandataire, sans quoi les éléments d'un tableau
           en ressortiraient bruts et leur chemin serait perdu. */
        if (typeof brut === 'function') return brut;
        return envelopper(brut, chemin);
      },
    });
  };

  return {
    suivre: (racine, prefixe) => envelopper(racine, prefixe),
    dernier: () => dernier,
    oublier: () => {
      dernier = null;
    },
  };
}
