import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { SEO_ROUTES, canonicalUrl, structuredData } from '../src/seo.js'

test('public routes have unique localized titles and descriptions', () => {
  for (const language of ['ro', 'en']) {
    const pages = Object.values(SEO_ROUTES).map((route) => route[language])
    assert.equal(new Set(pages.map((page) => page.title)).size, pages.length)
    assert.equal(new Set(pages.map((page) => page.description)).size, pages.length)
    pages.forEach((page) => {
      assert.ok(page.title.length > 20)
      assert.ok(page.description.length > 80)
    })
  }
})

test('canonicals use the production HTTPS origin', () => {
  for (const pathname of Object.keys(SEO_ROUTES)) {
    assert.match(canonicalUrl(pathname), /^https:\/\/crissbt\.com\//)
  }
})

test('structured data identifies the business and real contact details', () => {
  const schema = structuredData('/contact', 'ro')
  const business = schema['@graph'][0]
  assert.equal(business['@type'], 'LodgingBusiness')
  assert.equal(business.telephone, '+40743486611')
  assert.equal(business.address.addressLocality, 'Slănic')
})

test('robots, sitemap, manifest and social assets are present', () => {
  const robots = readFileSync('public/robots.txt', 'utf8')
  const sitemap = readFileSync('public/sitemap.xml', 'utf8')
  assert.match(robots, /Sitemap: https:\/\/crissbt\.com\/sitemap\.xml/)
  assert.match(robots, /Disallow: \/admin\//)
  for (const pathname of Object.keys(SEO_ROUTES)) {
    assert.match(sitemap, new RegExp(`<loc>${canonicalUrl(pathname).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc>`))
  }
  for (const asset of ['public/site.webmanifest', 'public/social-preview.jpg', 'public/apple-touch-icon.png', 'public/icon-192.png', 'public/icon-512.png']) {
    assert.equal(existsSync(asset), true, asset)
  }
})
