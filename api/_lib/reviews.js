import crypto from 'node:crypto'

export const SERVICE_TYPES = ['bowen', 'facial_massage', 'relaxation_massage', 'therapeutic_massage', 'reflexology']
export const MAX_BODY_BYTES = 16 * 1024
// Deliberately matches unsupported ASCII control characters while preserving tabs and newlines.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

export function env(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing server environment variable: ${name}`)
  return value
}

export function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.json(body)
}

export function isJsonRequest(req) {
  return String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase() === 'application/json'
}

export async function readBody(req) {
  if (req.body && typeof req.body === 'object') {
    return Buffer.byteLength(JSON.stringify(req.body), 'utf8') <= MAX_BODY_BYTES ? req.body : null
  }
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) return null
    chunks.push(chunk)
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') } catch { return null }
}

export function normalizeText(value) {
  return typeof value === 'string' ? value.normalize('NFC').replace(CONTROL_CHARACTERS, '').trim() : ''
}

export function isRealDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export function isCanonicalUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export function validateReview(body) {
  if (!body || typeof body !== 'object') return null
  const reviewer_name = normalizeText(body.name)
  const review_text = normalizeText(body.review)
  const rating = Number(body.rating)
  const visit_date = body.visitDate || null
  if (normalizeText(body.website)) return { spam: true }
  if (reviewer_name.length < 2 || reviewer_name.length > 80 || review_text.length < 20 || review_text.length > 1000) return null
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !SERVICE_TYPES.includes(body.service) || body.consent !== true) return null
  if (visit_date && (!isRealDate(visit_date) || new Date(`${visit_date}T00:00:00Z`) > new Date())) return null
  return { reviewer_name, service_type: body.service, rating, review_text, visit_date, language: body.language === 'en' ? 'en' : 'ro', consent_given: true }
}

export function allowedOrigins() {
  const origins = new Set(['http://localhost:5173', 'https://crissbt.com', 'https://www.crissbt.com'])
  for (const name of ['VERCEL_URL', 'VERCEL_BRANCH_URL', 'VERCEL_PROJECT_PRODUCTION_URL']) {
    if (process.env[name]) origins.add(`https://${process.env[name]}`)
  }
  return origins
}

export function validOrigin(req) {
  const origin = req.headers.origin
  return typeof origin === 'string' && allowedOrigins().has(origin)
}

export async function supabaseRequest({
  path,
  method = 'GET',
  access,
  userAccessToken,
  body,
  headers = {},
}) {
  const keyNames = {
    publishable: 'SUPABASE_PUBLISHABLE_KEY',
    secret: 'SUPABASE_SECRET_KEY',
  }
  const keyName = keyNames[access]
  if (!keyName) throw new Error('Supabase access must be publishable or secret.')
  const requestHeaders = {
    apikey: env(keyName),
    'Content-Type': 'application/json',
    ...headers,
  }
  if (userAccessToken) requestHeaders.Authorization = `Bearer ${userAccessToken}`
  const response = await fetch(`${env('SUPABASE_URL')}${path}`, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`Supabase request failed (${response.status})`)
  if (response.status === 204) return null
  return response.json()
}

export function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
  if (process.env.VERCEL && forwarded) return forwarded
  return String(req.socket?.remoteAddress || forwarded || 'unknown')
}

export function secretHash(value) {
  return crypto.createHash('sha256').update(`${env('REVIEW_RATE_LIMIT_SALT')}:${value}`).digest('hex')
}

export function parseCookies(req) {
  return Object.fromEntries(String(req.headers.cookie || '').split(';').map((item) => item.trim().split('=')).filter(([key, value]) => key && value).map(([key, value]) => [key, decodeURIComponent(value)]))
}

export async function authenticatedUser(req) {
  const token = parseCookies(req).reviews_admin_session
  if (!token) return null
  try {
    return await supabaseRequest({
      path: '/auth/v1/user',
      access: 'publishable',
      userAccessToken: token,
    })
  } catch {
    return null
  }
}

export function isAllowedAdmin(user) {
  const allowed = env('REVIEWS_ADMIN_EMAILS').split(',').map((email) => email.trim().toLowerCase())
  return Boolean(user?.email && allowed.includes(user.email.toLowerCase()))
}

export function isGoogleAdmin(user) {
  const google = user?.app_metadata?.provider === 'google' || user?.app_metadata?.providers?.includes('google')
  return Boolean(google && isAllowedAdmin(user))
}

export async function requireAdmin(req) {
  const user = await authenticatedUser(req)
  return isGoogleAdmin(user) ? user : null
}
