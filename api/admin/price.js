import { isCanonicalUuid, isJsonRequest, json, readBody, requireAdmin, supabaseRequest, validOrigin } from '../_lib/reviews.js'
import { priceError, validatePriceInput } from '../_lib/prices.js'

export default async function handler(req, res) {
  if (!['PATCH', 'DELETE'].includes(req.method)) return json(res, 405, { error: 'Method not allowed.' })
  if (!validOrigin(req)) return priceError(res, 403, 'origin_forbidden')
  if (req.method === 'PATCH' && !isJsonRequest(req)) return priceError(res, 415, 'json_required')
  try {
    const user = await requireAdmin(req)
    if (!user) return priceError(res, 401, 'authentication_required')
    const id = String(req.query?.id || '')
    if (!isCanonicalUuid(id)) return priceError(res, 400, 'invalid_id')

    if (req.method === 'DELETE') {
      await supabaseRequest({ path: `/rest/v1/service_prices?id=eq.${id}`, method: 'DELETE', access: 'secret', headers: { Prefer: 'return=minimal' } })
      return json(res, 200, { success: true })
    }

    const parsed = validatePriceInput(await readBody(req), { partial: true })
    if (!parsed.value) return priceError(res, 400, parsed.error, parsed.fields)
    await supabaseRequest({
      path: `/rest/v1/service_prices?id=eq.${id}`, method: 'PATCH', access: 'secret',
      headers: { Prefer: 'return=minimal' }, body: { ...parsed.value, updated_by_email: user.email },
    })
    return json(res, 200, { success: true })
  } catch (error) {
    if (error.details?.code === '23505') return priceError(res, 409, 'duplicate_service_key')
    console.error(error)
    return priceError(res, 500, 'price_write_failed')
  }
}
