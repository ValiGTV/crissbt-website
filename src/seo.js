import { CONTACT_EMAIL } from './contactConfig.js'

export const SITE_URL = 'https://crissbt.com'
export const SOCIAL_IMAGE = `${SITE_URL}/social-preview.jpg`

export const SEO_ROUTES = {
  '/': {
    ro: {
      title: 'Pensiunea Criss | Cazare și wellness în Slănic Prahova',
      description: 'Pensiunea Criss oferă cazare boutique, Terapia Bowen și servicii de masaj într-un cadru relaxant din Slănic Prahova.',
    },
    en: {
      title: 'Pensiunea Criss | Accommodation & Wellness in Slănic Prahova',
      description: 'Discover boutique accommodation, Bowen Therapy and professional massage services at Pensiunea Criss in Slănic Prahova, Romania.',
    },
  },
  '/pensiunea': {
    ro: {
      title: 'Cazare boutique în Slănic Prahova | Pensiunea Criss',
      description: 'Descoperă Pensiunea Criss, un refugiu rustic premium pentru cazare, relaxare și weekenduri liniștite în Slănic Prahova.',
    },
    en: {
      title: 'Boutique Accommodation in Slănic Prahova | Pensiunea Criss',
      description: 'Discover Pensiunea Criss, a premium rustic retreat for accommodation, relaxation and peaceful weekends in Slănic Prahova.',
    },
  },
  '/therapy': {
    ro: {
      title: 'Terapia Bowen și Masaj în Slănic Prahova | Pensiunea Criss',
      description: 'Vezi serviciile, prețurile și abonamentele pentru Terapia Bowen, masaj terapeutic, masaj de relaxare și reflexoterapie.',
    },
    en: {
      title: 'Bowen Therapy & Massage in Slănic Prahova | Pensiunea Criss',
      description: 'Explore services, prices and packages for Bowen Therapy, therapeutic massage, relaxation massage and reflexology.',
    },
  },
  '/recenzii': {
    ro: {
      title: 'Recenzii Terapia Bowen și Masaj | Pensiunea Criss',
      description: 'Citește experiențele clienților și recenziile verificate pentru Terapia Bowen și serviciile de masaj de la Pensiunea Criss.',
    },
    en: {
      title: 'Bowen Therapy & Massage Reviews | Pensiunea Criss',
      description: 'Read verified guest experiences and reviews for Bowen Therapy and professional massage services at Pensiunea Criss.',
    },
  },
  '/contact': {
    ro: {
      title: 'Contact și programări | Pensiunea Criss Slănic Prahova',
      description: 'Contactează Pensiunea Criss pentru cazare, programări la Terapia Bowen sau masaj în Slănic Prahova. Telefon: 0743 486 611.',
    },
    en: {
      title: 'Contact & Appointments | Pensiunea Criss Slănic Prahova',
      description: 'Contact Pensiunea Criss for accommodation, Bowen Therapy or massage appointments in Slănic Prahova. Phone: +40 743 486 611.',
    },
  },
}

export function canonicalUrl(pathname) {
  return `${SITE_URL}${pathname === '/' ? '/' : pathname}`
}

export function localizedUrl(pathname, language) {
  return `${canonicalUrl(pathname)}?lang=${language}`
}

export function seoForRoute(pathname, language = 'ro') {
  const route = SEO_ROUTES[pathname] || SEO_ROUTES['/']
  return route[language] || route.ro
}

export function structuredData(pathname, language) {
  const seo = seoForRoute(pathname, language)
  const url = canonicalUrl(pathname)
  const business = {
    '@type': 'LodgingBusiness',
    '@id': `${SITE_URL}/#business`,
    name: 'Pensiunea Criss',
    legalName: 'CRISSBT SRL',
    url: SITE_URL,
    image: SOCIAL_IMAGE,
    telephone: '+40743486611',
    email: CONTACT_EMAIL,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Strada Ghioceilor nr. 6A',
      addressLocality: 'Slănic',
      addressRegion: 'Prahova',
      addressCountry: 'RO',
    },
    areaServed: { '@type': 'City', name: 'Slănic Prahova' },
    sameAs: [],
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      business,
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: 'Pensiunea Criss',
        inLanguage: ['ro-RO', 'en-GB'],
        publisher: { '@id': `${SITE_URL}/#business` },
      },
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: seo.title,
        description: seo.description,
        inLanguage: language === 'ro' ? 'ro-RO' : 'en-GB',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#business` },
      },
    ],
  }
}
