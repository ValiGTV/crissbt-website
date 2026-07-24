import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { canonicalUrl, localizedUrl, seoForRoute, SOCIAL_IMAGE, structuredData } from './seo.js'

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value))
}

function upsertLink(selector, attributes) {
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement('link')
    document.head.appendChild(element)
  }
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value))
}

export default function SeoMetadata({ language }) {
  const { pathname } = useLocation()

  useEffect(() => {
    const isAdmin = pathname.startsWith('/admin/')
    const seo = seoForRoute(pathname, language)
    const canonical = canonicalUrl(pathname)
    const locale = language === 'ro' ? 'ro_RO' : 'en_GB'

    document.title = isAdmin ? 'Review moderation | Pensiunea Criss' : seo.title
    upsertMeta('meta[name="description"]', { name: 'description', content: seo.description })
    upsertMeta('meta[name="robots"]', { name: 'robots', content: isAdmin ? 'noindex, nofollow, noarchive' : 'index, follow, max-image-preview:large' })
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: seo.title })
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: seo.description })
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' })
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical })
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: SOCIAL_IMAGE })
    upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt', content: 'Pensiunea Criss, Slănic Prahova' })
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: locale })
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: 'Pensiunea Criss' })
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: seo.title })
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: seo.description })
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: SOCIAL_IMAGE })
    upsertLink('link[rel="canonical"]', { rel: 'canonical', href: canonical })
    upsertLink('link[rel="alternate"][hreflang="ro"]', { rel: 'alternate', hreflang: 'ro', href: localizedUrl(pathname, 'ro') })
    upsertLink('link[rel="alternate"][hreflang="en"]', { rel: 'alternate', hreflang: 'en', href: localizedUrl(pathname, 'en') })
    upsertLink('link[rel="alternate"][hreflang="x-default"]', { rel: 'alternate', hreflang: 'x-default', href: canonical })

    let schema = document.head.querySelector('script[data-seo-schema]')
    if (!schema) {
      schema = document.createElement('script')
      schema.type = 'application/ld+json'
      schema.dataset.seoSchema = 'true'
      document.head.appendChild(schema)
    }
    schema.textContent = JSON.stringify(structuredData(pathname, language))
  }, [language, pathname])

  return null
}
