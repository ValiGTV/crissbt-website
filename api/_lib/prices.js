import { normalizeText } from './reviews.js'

export const PUBLIC_PRICE_COLUMNS = 'id,service_group,service_key,title_ro,title_en,description_ro,description_en,duration_minutes,session_price_ron,package_sessions,package_price_ron,audience,display_order,is_active,updated_at'
export const ADMIN_PRICE_COLUMNS = `${PUBLIC_PRICE_COLUMNS},created_at,updated_by_email`

const INPUT_FIELDS = new Set(['serviceGroup', 'serviceKey', 'titleRo', 'titleEn', 'descriptionRo', 'descriptionEn', 'durationMinutes', 'sessionPriceRon', 'packageSessions', 'packagePriceRon', 'audience', 'displayOrder', 'isActive'])
const GROUPS = ['bowen', 'massage']
const AUDIENCES = ['adult', 'child', 'general']

function integer(value, { min, max, nullable = false }) {
  if ((value === null || value === '') && nullable) return null
  const number = Number(value)
  return Number.isInteger(number) && number >= min && number <= max ? number : undefined
}

function text(value, { min = 0, max, nullable = false }) {
  if ((value === null || value === '') && nullable) return null
  const normalized = normalizeText(value)
  return normalized.length >= min && normalized.length <= max ? normalized : undefined
}

export function validatePriceInput(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'invalid_body' }
  const unsupported = Object.keys(body).filter((key) => !INPUT_FIELDS.has(key))
  if (unsupported.length) return { error: 'unsupported_fields', fields: unsupported }

  const required = ['serviceGroup', 'serviceKey', 'titleRo', 'titleEn', 'sessionPriceRon', 'displayOrder', 'isActive']
  if (!partial && required.some((key) => !(key in body))) return { error: 'missing_fields' }
  if (partial && Object.keys(body).length === 0) return { error: 'missing_fields' }

  const output = {}
  const set = (input, column, parser) => {
    if (!(input in body)) return true
    const value = parser(body[input])
    if (value === undefined) return false
    output[column] = value
    return true
  }

  if (!set('serviceGroup', 'service_group', (value) => GROUPS.includes(value) ? value : undefined)) return { error: 'invalid_service_group' }
  if (!set('serviceKey', 'service_key', (value) => {
    const normalized = text(value, { min: 2, max: 80 })
    return normalized && /^[a-z0-9_]+$/.test(normalized) ? normalized : undefined
  })) return { error: 'invalid_service_key' }
  if (!set('titleRo', 'title_ro', (value) => text(value, { min: 1, max: 120 }))) return { error: 'invalid_title_ro' }
  if (!set('titleEn', 'title_en', (value) => text(value, { min: 1, max: 120 }))) return { error: 'invalid_title_en' }
  if (!set('descriptionRo', 'description_ro', (value) => text(value, { max: 1000, nullable: true }))) return { error: 'invalid_description_ro' }
  if (!set('descriptionEn', 'description_en', (value) => text(value, { max: 1000, nullable: true }))) return { error: 'invalid_description_en' }
  if (!set('durationMinutes', 'duration_minutes', (value) => integer(value, { min: 1, max: 1440, nullable: true }))) return { error: 'invalid_duration' }
  if (!set('sessionPriceRon', 'session_price_ron', (value) => integer(value, { min: 1, max: 1000000 }))) return { error: 'invalid_session_price' }
  if (!set('packageSessions', 'package_sessions', (value) => integer(value, { min: 1, max: 1000, nullable: true }))) return { error: 'invalid_package_sessions' }
  if (!set('packagePriceRon', 'package_price_ron', (value) => integer(value, { min: 1, max: 1000000, nullable: true }))) return { error: 'invalid_package_price' }
  if (!set('audience', 'audience', (value) => value === null || value === '' ? null : AUDIENCES.includes(value) ? value : undefined)) return { error: 'invalid_audience' }
  if (!set('displayOrder', 'display_order', (value) => integer(value, { min: 0, max: 10000 }))) return { error: 'invalid_display_order' }
  if (!set('isActive', 'is_active', (value) => typeof value === 'boolean' ? value : undefined)) return { error: 'invalid_active_state' }

  const hasPackageSessions = 'packageSessions' in body
  const hasPackagePrice = 'packagePriceRon' in body
  if (hasPackageSessions !== hasPackagePrice) return { error: 'incomplete_package' }
  if (hasPackageSessions && ((output.package_sessions === null) !== (output.package_price_ron === null))) return { error: 'incomplete_package' }

  return { value: output }
}

export function priceError(res, status, code, fields) {
  return res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').setHeader('Cache-Control', 'no-store').json({ error: { code, ...(fields ? { fields } : {}) } })
}
