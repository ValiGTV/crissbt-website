import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const app = readFileSync('src/App.jsx', 'utf8')
const css = readFileSync('src/App.css', 'utf8')

const originalHashes = {
  'public/Diplome si Atestate/Bowen/Bowen for Babies.jpeg': '2B63ADA2968E0C7AC4C74C50FE0F4B9D34AF4465A6E9208D42F36D06B9D43DAC',
  'public/Diplome si Atestate/Bowen/Bowen for Diabetes.jpeg': 'FA9AAADE274D151ED02D8E55F20E4E0062349C00847984CE55B2F3C3EF1C00B4',
  'public/Diplome si Atestate/Bowen/Bowen for Sportive Injuries.jpeg': '183FEB824DB421B4217FA6339CF05E74FBC2F300D8F995C2DCE3FE635088C1CB',
  'public/Diplome si Atestate/Bowen/Bowen Technique.jpeg': '0149122E7ECBC58CE07A048879A6FAE5E5784CD3B3ACC221F1CC50225C0E4EE6',
  'public/Diplome si Atestate/Masaj/Maseur.jpeg': '6D07CD9AF5DC3CC1DABF1F74E9732ACAB908EC410271F5326EB9D3C792886F8B',
  'public/Diplome si Atestate/Masaj/Rejuvance.jpeg': '08C963520B6B9FA985783D227ECFDF41CAFDB172C16257179AF74DA35BA8E10A',
}

test('certificate gallery uses compact, contained lazy thumbnails', () => {
  assert.match(css, /repeat\(auto-fit, minmax\(150px, 180px\)\)/)
  assert.match(css, /object-fit: contain/)
  assert.match(app, /loading=\{enlarged \? 'eager' : 'lazy'\}/)
  assert.match(app, /document\.thumbnail/)
})

test('certificate captions are meaningful and never numbered generically', () => {
  assert.match(app, /Certificat Bowen pentru bebeluși/)
  assert.match(app, /Professional Qualification – Masseur/)
  assert.doesNotMatch(app, /genericTitle\} \$\{index \+ 1\}/)
})

test('certificate buttons and lightbox support keyboard access and focus restoration', () => {
  assert.match(app, /<button className="certificate-card"/)
  assert.match(app, /event\.key === 'Escape'/)
  assert.match(app, /event\.key === 'Tab'/)
  assert.match(app, /previewTriggerRef\.current\?\.focus\(\)/)
  assert.match(app, /role="dialog" aria-modal="true"/)
})

test('watermarks remain above thumbnail and enlarged certificate images', () => {
  assert.match(app, /CRISSBT SRL/)
  assert.match(app, /certificate-footer-watermark/)
  assert.match(css, /\.certificate-watermark[\s\S]*?z-index: 2/)
  assert.match(css, /\.lightbox-document \.certificate-watermark/)
})

test('gallery has desktop, tablet, mobile, and narrow responsive layouts', () => {
  assert.match(css, /repeat\(3, minmax\(150px, 180px\)\)/)
  assert.match(css, /repeat\(2, minmax\(0, 180px\)\)/)
  assert.match(css, /@media \(max-width: 380px\)/)
  assert.match(css, /transform: scale\(1\.78\)/)
})

test('original diploma files remain byte-for-byte unchanged', () => {
  for (const [path, expected] of Object.entries(originalHashes)) {
    const actual = createHash('sha256').update(readFileSync(path)).digest('hex').toUpperCase()
    assert.equal(actual, expected, path)
  }
})

test('appointment CTA appears once between pricing and certificates', () => {
  const ctaMatches = app.match(/<section className="appointment-cta">/g) || []
  const pricingEnd = app.indexOf('<section className="pricing-group massage-pricing"')
  const cta = app.indexOf('<section className="appointment-cta">', pricingEnd)
  const certificates = app.indexOf('<div className="certificate-showcase">', pricingEnd)

  assert.equal(ctaMatches.length, 1)
  assert.ok(pricingEnd < cta)
  assert.ok(cta < certificates)
  assert.match(app.slice(cta, certificates), /href="tel:\+40743486611"/)
  assert.match(app.slice(cta, certificates), /to="\/contact"/)
})
