export const SITE = {
  name: 'Yunma',
  legalName: 'Yunma',
  domain: 'yunma.fr',
  url: import.meta.env.SITE || 'https://yunma.fr',
  email: 'hello@yunma.fr',
  proEmail: 'hello@yunma.fr',
  pressEmail: 'hello@yunma.fr',
  /* Le contact direct passe par WhatsApp : c'est lui qui remplace le numéro,
     sur le site comme dans les données envoyées aux moteurs. Le numéro n'est
     jamais écrit en toutes lettres — seul le mot « WhatsApp » est cliquable.

     `wa.me` n'accepte qu'un numéro au format international, sans « + » ni
     zéros de tête : 0033 6 42 05 04 58 s'écrit donc 33642050458. Un nom de
     compte à la place du numéro ne fonctionne pas, quoi qu'en laisse penser
     l'adresse — c'était le cas ici, et le lien ne menait nulle part. */
  whatsapp: 'https://wa.me/33642050458',
  address: {
    street: '1 rue Ordener',
    postalCode: '75018',
    city: 'Paris',
    country: 'FR',
  },
  /* Instagram seul : la page LinkedIn a été retirée. En ajouter une autre
     un jour se fait ici, et elle rejoindra d'elle-même le pied de page et les
     données envoyées aux moteurs. */
  social: {
    instagram: 'https://www.instagram.com/yunma.coffee/',
  },
  currency: 'EUR',
  freeShippingFrom: 50,
};

/** Shopify — renseigner les variables d'environnement (voir .env.example). */
export const SHOPIFY = {
  domain: import.meta.env.PUBLIC_SHOPIFY_DOMAIN || '',
  token: import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN || '',
  accountUrl: import.meta.env.PUBLIC_SHOPIFY_ACCOUNT_URL || '',
};

/**
 * Liste d'attente — l'adresse du service qui enregistre les demandes de
 * notification quand un café est épuisé.
 *
 * Tant qu'elle est vide, la fiche n'affiche pas de champ de saisie mais un
 * lien qui ouvre un courriel pré-rempli : un formulaire qui avale les adresses
 * sans les enregistrer nulle part serait pire que pas de formulaire du tout.
 * Le jour où le service existe (un petit script sur l'hébergement), renseigner
 * PUBLIC_LISTE_ATTENTE_URL suffit à faire apparaître le champ — le dessin et
 * les textes sont déjà en place.
 */
export const LISTE_ATTENTE = {
  url: import.meta.env.PUBLIC_LISTE_ATTENTE_URL || '',
};
