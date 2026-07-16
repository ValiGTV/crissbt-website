import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { extname, join } from 'node:path'
import { CONTACT_EMAIL, contactMailto } from '../src/contactConfig.js'

const productionTextExtensions = new Set(['.css', '.html', '.js', '.jsx', '.json', '.md', '.svg', '.txt', '.xml'])

function productionSourceFiles(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(path, entry.name)
    if (entry.isDirectory()) return productionSourceFiles(entryPath)
    return productionTextExtensions.has(extname(entry.name)) ? [entryPath] : []
  })
}

test('all three contact cards use the one centralized email address and mailto target', () => {
  assert.equal(CONTACT_EMAIL, 'pascucri@gmail.com')
  const source = readFileSync('src/App.jsx', 'utf8')
  assert.doesNotMatch(source, /pascucri@gmail\.com/)
  assert.equal((source.match(/mailto:\$\{CONTACT_EMAIL\}/g) || []).length, 3)
  assert.equal((source.match(/>\{CONTACT_EMAIL\}<\/a>/g) || []).length, 3)
  assert.match(source, /lodgingEmail/)
  assert.match(source, /massageEmail/)
  assert.match(source, /bowenEmail/)
})

test('Romanian and English contact requests use the same destination and identify the service', () => {
  const requests = [
    {
      service: 'Terapia Bowen',
      labels: { name: 'Nume', contact: 'Contact', service: 'Serviciu', message: 'Mesaj' },
    },
    {
      service: 'Massage',
      labels: { name: 'Name', contact: 'Contact', service: 'Service', message: 'Message' },
    },
  ]

  for (const request of requests) {
    const url = new URL(contactMailto({
      name: 'Test Client',
      contact: 'client@example.com',
      service: request.service,
      message: 'Appointment request.',
      labels: request.labels,
    }))
    assert.equal(url.pathname, CONTACT_EMAIL)
    assert.match(url.searchParams.get('subject'), new RegExp(request.service))
    assert.match(url.searchParams.get('body'), new RegExp(`${request.labels.service}: ${request.service}`))
    assert.match(url.searchParams.get('body'), /client@example\.com/)
  }
})

test('the contact form builds the mailto from the selected service', () => {
  const source = readFileSync('src/App.jsx', 'utf8')
  assert.match(source, /selectedOptions\[0\]\?\.textContent/)
  assert.match(source, /window\.location\.href = contactMailto\(/)
})

test('no legacy contact email remains in production source', () => {
  const roots = ['api', 'public', 'scripts', 'src']
  const files = roots.flatMap((root) => productionSourceFiles(root)).concat(['index.html', 'vercel.json'])
  const legacyEmail = /(?:@cris\.com|pensiune@|masaj@|bowen@)/i

  for (const file of files) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), legacyEmail, `legacy contact email found in ${file}`)
  }
})
