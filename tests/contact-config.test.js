import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { CONTACT_EMAIL, contactMailto } from '../src/contactConfig.js'

test('contact email is centralized and temporary addresses are removed', () => {
  assert.equal(CONTACT_EMAIL, 'pascucri@gmail.com')
  const source = readFileSync('src/App.jsx', 'utf8')
  assert.doesNotMatch(source, /(?:pensiune|masaj|bowen)@cris\.com/)
  assert.equal((source.match(/mailto:\$\{CONTACT_EMAIL\}/g) || []).length, 3)
})

test('contact form mailto targets Cristina and identifies the selected service', () => {
  const mailto = contactMailto({
    name: 'Test Client',
    contact: 'client@example.com',
    service: 'Terapia Bowen',
    message: 'Doresc o programare.',
    labels: { name: 'Nume', contact: 'Contact', service: 'Serviciu', message: 'Mesaj' },
  })
  const url = new URL(mailto)
  assert.equal(url.pathname, CONTACT_EMAIL)
  assert.match(url.searchParams.get('subject'), /Terapia Bowen/)
  assert.match(url.searchParams.get('body'), /Serviciu: Terapia Bowen/)
  assert.match(url.searchParams.get('body'), /client@example\.com/)
})
