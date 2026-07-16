import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import pricesHandler from '../api/prices.js'
import adminPricesHandler from '../api/admin/prices.js'
import adminPriceHandler from '../api/admin/price.js'
import { PUBLIC_PRICE_COLUMNS, validatePriceInput } from '../api/_lib/prices.js'

function response() {
  return { statusCode: 200, headers: {}, body: null, status(code) { this.statusCode = code; return this }, setHeader(key, value) { this.headers[key] = value; return this }, json(body) { this.body = body; return this } }
}

function request(method, body = {}, headers = {}) {
  return { method, body, headers, query: {}, socket: { remoteAddress: '127.0.0.1' } }
}

const validPrice = {
  serviceGroup: 'massage', serviceKey: 'test_massage', titleRo: 'Masaj test', titleEn: 'Test massage',
  descriptionRo: null, descriptionEn: null, durationMinutes: 50, sessionPriceRon: 150,
  packageSessions: 10, packagePriceRon: 1200, audience: 'general', displayOrder: 9, isActive: true,
}

function setupEnv() {
  Object.assign(process.env, {
    SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    SUPABASE_SECRET_KEY: 'sb_secret_test', REVIEWS_ADMIN_EMAILS: 'admin@example.com',
  })
}

test('public prices request only active rows, explicit safe columns, and stable order', async () => {
  const oldFetch = global.fetch
  const oldEnv = { ...process.env }
  setupEnv()
  let call
  global.fetch = async (url, options) => { call = { url, options }; return { ok: true, status: 200, json: async () => [{ id: 'active' }] } }
  const res = response()
  await pricesHandler(request('GET'), res)
  assert.equal(res.statusCode, 200)
  assert.match(call.url, /is_active=eq\.true/)
  assert.match(call.url, /order=service_group\.asc,display_order\.asc/)
  assert.match(call.url, new RegExp(`select=${PUBLIC_PRICE_COLUMNS}`))
  assert.doesNotMatch(call.url, /updated_by_email/)
  assert.equal(call.options.headers.apikey, 'sb_publishable_test')
  assert.match(res.headers['Cache-Control'], /s-maxage=300/)
  global.fetch = oldFetch
  process.env = oldEnv
})

test('unauthorized users cannot access admin price APIs', async () => {
  const oldFetch = global.fetch
  const oldEnv = { ...process.env }
  setupEnv()
  global.fetch = async () => ({ ok: false, status: 401, json: async () => ({}) })
  const listRes = response()
  await adminPricesHandler(request('GET'), listRes)
  assert.equal(listRes.statusCode, 401)
  const updateReq = request('PATCH', { sessionPriceRon: 200 }, { origin: 'http://localhost:5173', 'content-type': 'application/json' })
  updateReq.query.id = '550e8400-e29b-41d4-a716-446655440000'
  const updateRes = response()
  await adminPriceHandler(updateReq, updateRes)
  assert.equal(updateRes.statusCode, 401)
  global.fetch = oldFetch
  process.env = oldEnv
})

test('authorized admin update uses authenticated email and ignores request-controlled audit fields', async () => {
  const oldFetch = global.fetch
  const oldEnv = { ...process.env }
  setupEnv()
  const calls = []
  global.fetch = async (url, options) => {
    calls.push({ url, options })
    if (url.endsWith('/auth/v1/user')) return { ok: true, status: 200, json: async () => ({ email: 'admin@example.com', app_metadata: { provider: 'google' } }) }
    return { ok: true, status: 204, json: async () => null }
  }
  const req = request('PATCH', { sessionPriceRon: 175 }, { origin: 'http://localhost:5173', 'content-type': 'application/json', cookie: 'reviews_admin_session=token' })
  req.query.id = '550e8400-e29b-41d4-a716-446655440000'
  const res = response()
  await adminPriceHandler(req, res)
  assert.equal(res.statusCode, 200)
  const update = JSON.parse(calls[1].options.body)
  assert.equal(update.session_price_ron, 175)
  assert.equal(update.updated_by_email, 'admin@example.com')
  const rejected = validatePriceInput({ sessionPriceRon: 175, updatedByEmail: 'attacker@example.com' }, { partial: true })
  assert.equal(rejected.error, 'unsupported_fields')
  global.fetch = oldFetch
  process.env = oldEnv
})

test('invalid prices and incomplete package combinations are rejected', () => {
  assert.equal(validatePriceInput({ ...validPrice, sessionPriceRon: 0 }).error, 'invalid_session_price')
  assert.equal(validatePriceInput({ ...validPrice, packagePriceRon: null }).error, 'incomplete_package')
  assert.equal(validatePriceInput({ packageSessions: 10 }, { partial: true }).error, 'incomplete_package')
})

test('duplicate service keys return a typed conflict error', async () => {
  const oldFetch = global.fetch
  const oldEnv = { ...process.env }
  setupEnv()
  let calls = 0
  global.fetch = async (url) => {
    calls += 1
    if (url.endsWith('/auth/v1/user')) return { ok: true, status: 200, json: async () => ({ email: 'admin@example.com', app_metadata: { provider: 'google' } }) }
    return { ok: false, status: 409, json: async () => ({ code: '23505' }) }
  }
  const res = response()
  await adminPricesHandler(request('POST', validPrice, { origin: 'http://localhost:5173', 'content-type': 'application/json', cookie: 'reviews_admin_session=token' }), res)
  assert.equal(calls, 2)
  assert.equal(res.statusCode, 409)
  assert.equal(res.body.error.code, 'duplicate_service_key')
  global.fetch = oldFetch
  process.env = oldEnv
})

test('public page consumes API prices with loading/error states and no hardcoded price collections', () => {
  const app = readFileSync('src/App.jsx', 'utf8')
  assert.match(app, /fetch\('\/api\/prices'/)
  assert.match(app, /PriceSkeleton/)
  assert.match(app, /pricesUnavailable/)
  assert.doesNotMatch(app, /t\.therapy\.bowen\.options|t\.therapy\.massage\.services/)
})

test('frontend has no Supabase mutation and deletion requires explicit modal confirmation', () => {
  const frontend = `${readFileSync('src/App.jsx', 'utf8')}\n${readFileSync('src/AdminPricesPage.jsx', 'utf8')}`
  assert.doesNotMatch(frontend, /SUPABASE_SECRET_KEY|\.from\(['"]service_prices|supabaseRequest/)
  assert.match(frontend, /DeleteModal/)
  assert.match(frontend, /onConfirm=\{remove\}/)
  assert.doesNotMatch(frontend, /window\.confirm/)
})
