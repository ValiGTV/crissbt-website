import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const app = readFileSync('src/App.jsx', 'utf8')
const css = readFileSync('src/App.css', 'utf8')

test('Bowen information appears after the page introduction and before Bowen prices', () => {
  const therapyPage = app.indexOf('function TherapyPage')
  const introduction = app.indexOf('<SectionHeader', therapyPage)
  const information = app.indexOf('<BowenInformation content={t.therapy.aboutBowen} />', introduction)
  const prices = app.indexOf('<section className="pricing-group bowen-pricing"', information)

  assert.ok(therapyPage < introduction)
  assert.ok(introduction < information)
  assert.ok(information < prices)
})

test('Romanian and English Bowen information content is available', () => {
  for (const text of [
    'TERAPIE MANUALĂ BLÂNDĂ',
    'Despre terapia Bowen',
    'Cum se desfășoară',
    'Pentru ce este aleasă',
    'Mișcări blânde, fără forță',
    'Rolul pauzelor',
    'Adaptată fiecărei persoane',
    'Între ședințe',
    'GENTLE MANUAL TECHNIQUE',
    'About Bowen therapy',
    'What a session involves',
    'Why people choose it',
    'Gentle, non-forceful movements',
    'The role of pauses',
    'Adapted to each person',
    'Between sessions',
  ]) assert.match(app, new RegExp(text))
})

test('exactly six informational cards are configured in each language', () => {
  const sections = [...app.matchAll(/aboutBowen: \{[\s\S]*?cards: \[([\s\S]*?)\],\n\s+highlight:/g)]
  assert.equal(sections.length, 2)
  for (const section of sections) assert.equal((section[1].match(/title: '/g) || []).length, 6)
})

test('the former complementary-approach card is removed', () => {
  assert.doesNotMatch(app, /O abordare complementară/)
  assert.doesNotMatch(app, /A complementary approach/)
})

test('medical disclaimers remain explicit', () => {
  assert.match(app, /nu înlocuiește consultația medicală, diagnosticul sau tratamentul recomandat de medic/)
  assert.match(app, /does not replace medical consultation, diagnosis, or treatment/)
})

test('Bowen information makes no prohibited cure or guarantee claim', () => {
  const start = app.indexOf("aboutBowen: {")
  const end = app.indexOf("massage: {", start)
  const content = app.slice(start, end)
  for (const prohibited of [
    /vindecă/i,
    /tratează cauza/i,
    /garantează/i,
    /stimulează autovindecarea/i,
    /vindecă afecțiuni/i,
    /cures? diseases?/i,
    /heals? diagnosed conditions?/i,
    /treats? the root cause/i,
    /guarantees? pain relief/i,
    /guarantees? improvement/i,
    /stimulates? self-healing/i,
  ]) assert.doesNotMatch(content, prohibited)
})

test('CTA links to Contact and safely preselects Bowen interest', () => {
  assert.match(app, /to="\/contact\?interest=bowen"/)
  assert.match(app, /\['cazare', 'masaj', 'bowen', 'pachet'\]\.includes\(requestedInterest\)/)
  assert.match(app, /<select name="interest" defaultValue=\{defaultInterest\}>/)
})

test('responsive Bowen information layouts are present', () => {
  assert.match(css, /\.bowen-information-grid[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/)
  assert.match(css, /@media \(max-width: 1100px\)[\s\S]*?\.bowen-information-grid[\s\S]*?repeat\(2, minmax\(0, 1fr\)\)/)
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*?\.bowen-information-grid[\s\S]*?grid-template-columns: 1fr/)
})
