export const SITE = {
  name: 'Yunma',
  legalName: 'Yunma',
  domain: 'yunma.fr',
  url: import.meta.env.SITE || 'https://yunma.fr',
  email: 'hello@yunma.fr',
  proEmail: 'pro@yunma.fr',
  pressEmail: 'presse@yunma.fr',
  phone: '+33 6 00 00 00 00',
  phoneHref: '+33600000000',
  address: {
    street: '12 rue des Torréfacteurs',
    postalCode: '75011',
    city: 'Paris',
    country: 'FR',
  },
  social: {
    instagram: 'https://www.instagram.com/yunma.coffee/',
    linkedin: 'https://www.linkedin.com/company/yunma/',
  },
  currency: 'EUR',
  freeShippingFrom: 45,
  founded: '2019',
};

/** Shopify — renseigner les variables d'environnement (voir .env.example). */
export const SHOPIFY = {
  domain: import.meta.env.PUBLIC_SHOPIFY_DOMAIN || '',
  token: import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN || '',
  accountUrl: import.meta.env.PUBLIC_SHOPIFY_ACCOUNT_URL || '',
};
