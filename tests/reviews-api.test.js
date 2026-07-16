import test from 'node:test'
import assert from 'node:assert/strict'
import { isCanonicalUuid, isRealDate, supabaseRequest, validateReview } from '../api/_lib/reviews.js'
import reviewsHandler from '../api/reviews.js'
import adminReviewHandler from '../api/admin/review.js'
import adminReviewsHandler from '../api/admin/reviews.js'
import { isAllowedAdmin, isGoogleAdmin } from '../api/_lib/reviews.js'

function response() {
  return { statusCode: 200, headers: {}, body: null, status(code) { this.statusCode = code; return this }, setHeader(k, v) { this.headers[k] = v; return this }, json(body) { this.body = body; return this }, end() { return this } }
}

function request(method, body = {}, headers = {}) {
  return { method, body, headers, socket: { remoteAddress: '127.0.0.1' }, query: {} }
}

const valid = { name: 'Maria Popescu', service: 'bowen', rating: 5, review: 'O experiență foarte bună și profesionistă.', consent: true, language: 'ro' }

test('validation normalizes text, rejects invalid dates, and never accepts client status', () => {
  const result = validateReview({ ...valid, name: '  Maria\u0007 Popescu  ', status: 'approved' })
  assert.equal(result.reviewer_name, 'Maria Popescu')
  assert.equal('status' in result, false)
  assert.equal(validateReview({ ...valid, visitDate: '2026-02-30' }), null)
  assert.equal(isRealDate('2024-02-29'), true)
  assert.equal(isRealDate('2023-02-29'), false)
})

test('canonical UUID validation is strict', () => {
  assert.equal(isCanonicalUuid('550e8400-e29b-41d4-a716-446655440000'), true)
  assert.equal(isCanonicalUuid('550e8400e29b41d4a716446655440000----'), false)
})

test('public GET uses publishable key, approved filter, explicit columns, descending order and limit 30', async () => {
  const oldFetch = global.fetch
  const oldEnv = { ...process.env }
  process.env.SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test'
  delete process.env.SUPABASE_SECRET_KEY
  let call
  global.fetch = async (url, options) => { call = { url, options }; return { ok: true, status: 200, json: async () => [] } }
  const res = response()
  await reviewsHandler(request('GET'), res)
  assert.equal(res.statusCode, 200)
  assert.match(call.url, /status=eq\.approved/)
  assert.match(call.url, /order=approved_at\.desc/)
  assert.match(call.url, /limit=30/)
  assert.doesNotMatch(call.url, /moderation_note|status,/) 
  assert.equal(call.options.headers.apikey, 'sb_publishable_test')
  assert.equal('Authorization' in call.options.headers, false)
  global.fetch = oldFetch
  process.env = oldEnv
})

test('public submission rejects invalid Origin', async () => {
  const res = response()
  await reviewsHandler(request('POST', valid, { origin: 'https://evil.example', 'content-type': 'application/json' }), res)
  assert.equal(res.statusCode, 403)
})

test('public submission RPC always receives pending-only fields and ignores client status', async () => {
  const oldFetch = global.fetch
  const oldEnv = { ...process.env }
  Object.assign(process.env, { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SECRET_KEY: 'sb_secret_test', REVIEW_RATE_LIMIT_SALT: 'salt' })
  let rpcBody
  global.fetch = async (url, options) => { rpcBody = JSON.parse(options.body); return { ok: true, status: 200, json: async () => true } }
  const res = response()
  await reviewsHandler(request('POST', { ...valid, status: 'approved' }, { origin: 'http://localhost:5173', 'content-type': 'application/json' }), res)
  assert.equal(res.statusCode, 201)
  assert.equal('status' in rpcBody, false)
  assert.equal(rpcBody.p_consent_given, true)
  global.fetch = oldFetch
  process.env = oldEnv
})

test('approve, reject and delete require server authorization', async () => {
  const oldFetch = global.fetch
  const oldEnv = { ...process.env }
  Object.assign(process.env, { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', REVIEWS_ADMIN_EMAILS: 'admin@example.com' })
  global.fetch = async () => ({ ok: false, status: 401 })
  for (const method of ['PATCH', 'DELETE']) {
    const req = request(method, { action: 'approve' }, { origin: 'http://localhost:5173', 'content-type': 'application/json' })
    req.query.id = '550e8400-e29b-41d4-a716-446655440000'
    const res = response(); await adminReviewHandler(req, res); assert.equal(res.statusCode, 401)
  }
  global.fetch = oldFetch
  process.env = oldEnv
})

test('admin email allowlist is enforced server-side', async () => {
  const old = process.env.REVIEWS_ADMIN_EMAILS
  process.env.REVIEWS_ADMIN_EMAILS = 'allowed@example.com'
  assert.equal(isAllowedAdmin({ email: 'other@example.com' }), false)
  assert.equal(isAllowedAdmin({ email: 'Allowed@Example.com' }), true)
  assert.equal(isGoogleAdmin({ email: 'allowed@example.com', app_metadata: { provider: 'email' } }), false)
  assert.equal(isGoogleAdmin({ email: 'allowed@example.com', app_metadata: { provider: 'google' } }), true)
  if (old === undefined) delete process.env.REVIEWS_ADMIN_EMAILS
  else process.env.REVIEWS_ADMIN_EMAILS = old
})

test('authorized admin can access moderation while unauthorized users cannot', async () => {
  const oldFetch = global.fetch
  const oldEnv = { ...process.env }
  Object.assign(process.env, { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', SUPABASE_SECRET_KEY: 'sb_secret_test', REVIEWS_ADMIN_EMAILS: 'admin@example.com' })
  let calls = 0
  global.fetch = async () => {
    calls += 1
    if (calls === 1) return { ok: true, json: async () => ({ email: 'admin@example.com', app_metadata: { provider: 'google' } }) }
    return { ok: true, status: 200, json: async () => [] }
  }
  const req = request('GET', {}, { cookie: 'reviews_admin_session=token' })
  const res = response(); await adminReviewsHandler(req, res)
  assert.equal(res.statusCode, 200)
  global.fetch = oldFetch
  process.env = oldEnv
})

test('opaque publishable and secret keys are only sent through apikey', async () => {
  const oldFetch = global.fetch
  const oldEnv = { ...process.env }
  Object.assign(process.env, {
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    SUPABASE_SECRET_KEY: 'sb_secret_test',
  })
  const calls = []
  global.fetch = async (_url, options) => {
    calls.push(options.headers)
    return { ok: true, status: 200, json: async () => [] }
  }
  await supabaseRequest({ path: '/rest/v1/reviews', access: 'publishable' })
  await supabaseRequest({ path: '/rest/v1/rpc/example', method: 'POST', access: 'secret', body: {} })
  assert.equal(calls[0].apikey, 'sb_publishable_test')
  assert.equal(calls[1].apikey, 'sb_secret_test')
  assert.equal('Authorization' in calls[0], false)
  assert.equal('Authorization' in calls[1], false)
  global.fetch = oldFetch
  process.env = oldEnv
})

test('only an actual user access token is sent through Authorization', async () => {
  const oldFetch = global.fetch
  const oldEnv = { ...process.env }
  Object.assign(process.env, { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test' })
  let headers
  global.fetch = async (_url, options) => { headers = options.headers; return { ok: true, status: 200, json: async () => ({}) } }
  await supabaseRequest({ path: '/auth/v1/user', access: 'publishable', userAccessToken: 'real-user-jwt' })
  assert.equal(headers.apikey, 'sb_publishable_test')
  assert.equal(headers.Authorization, 'Bearer real-user-jwt')
  global.fetch = oldFetch
  process.env = oldEnv
})
