import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { canonicalUrl, localizedUrl, SEO_ROUTES, SOCIAL_IMAGE, structuredData } from '../src/seo.js'

const dist = join(process.cwd(), 'dist')
const template = await readFile(join(dist, 'index.html'), 'utf8')

function escapeAttribute(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
}

function routeHead(pathname, language = 'ro') {
  const seo = SEO_ROUTES[pathname][language]
  const canonical = canonicalUrl(pathname)
  const schema = JSON.stringify(structuredData(pathname, language)).replaceAll('<', '\\u003c')
  return `
    <title>${seo.title}</title>
    <meta name="description" content="${escapeAttribute(seo.description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${canonical}" />
    <link rel="alternate" hreflang="ro" href="${localizedUrl(pathname, 'ro')}" />
    <link rel="alternate" hreflang="en" href="${localizedUrl(pathname, 'en')}" />
    <link rel="alternate" hreflang="x-default" href="${canonical}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Pensiunea Criss" />
    <meta property="og:locale" content="ro_RO" />
    <meta property="og:title" content="${escapeAttribute(seo.title)}" />
    <meta property="og:description" content="${escapeAttribute(seo.description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${SOCIAL_IMAGE}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="675" />
    <meta property="og:image:alt" content="Pensiunea Criss, Slănic Prahova" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttribute(seo.title)}" />
    <meta name="twitter:description" content="${escapeAttribute(seo.description)}" />
    <meta name="twitter:image" content="${SOCIAL_IMAGE}" />
    <script type="application/ld+json" data-seo-schema>${schema}</script>`
}

function replaceSeoHead(html, head) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/\s*<meta (?:name|property)="(?:description|robots|og:[^"]+|twitter:[^"]+)"[^>]*>/g, '')
    .replace(/\s*<link rel="(?:canonical|alternate)"[^>]*>/g, '')
    .replace('</head>', `${head}\n  </head>`)
}

await writeFile(join(dist, 'index.html'), replaceSeoHead(template, routeHead('/')), 'utf8')

for (const pathname of Object.keys(SEO_ROUTES).filter((route) => route !== '/')) {
  const directory = join(dist, pathname.slice(1))
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, 'index.html'), replaceSeoHead(template, routeHead(pathname)), 'utf8')
}

const adminDirectory = join(dist, 'admin', 'reviews')
await mkdir(adminDirectory, { recursive: true })
const adminHead = '<title>Review moderation | Pensiunea Criss</title><meta name="robots" content="noindex, nofollow, noarchive" />'
await writeFile(join(adminDirectory, 'index.html'), replaceSeoHead(template, adminHead), 'utf8')

const pricesAdminDirectory = join(dist, 'admin', 'prices')
await mkdir(pricesAdminDirectory, { recursive: true })
await writeFile(join(pricesAdminDirectory, 'index.html'), replaceSeoHead(template, '<title>Price management | Pensiunea Criss</title><meta name="robots" content="noindex, nofollow, noarchive" />'), 'utf8')
