export const SITE = {
  name: 'Yunma',
  legalName: 'Yunma',
  domain: 'yunma.fr',
  url: import.meta.env.SITE || 'https://yunma.fr',
  email: 'hello@yunma.fr',
  proEmail: 'hello@yunma.fr',
  pressEmail: 'hello@yunma.fr',
  /* Le contact direct passe par WhatsApp : c'est lui qui remplace le numéro,
     sur le site comme dans les données envoyées aux moteurs. */
  whatsapp: 'https://wa.me/yunma.coffee',
  address: {
    street: '1 rue Ordener',
    postalCode: '75018',
    city: 'Paris',
    country: 'FR',
  },
  social: {
    instagram: 'https://www.instagram.com/yunma.coffee/',
    linkedin: 'https://www.linkedin.com/company/yunma/',
  },
  currency: 'EUR',
  freeShippingFrom: 50,
  founded: '2019',
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
