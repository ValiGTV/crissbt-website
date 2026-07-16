import { isJsonRequest, json, readBody, requireAdmin, supabaseRequest, validOrigin } from '../_lib/reviews.js'
import { ADMIN_PRICE_COLUMNS, priceError, validatePriceInput } from '../_lib/prices.js'

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return json(res, 405, { error: 'Method not allowed.' })
  if (req.method === 'POST' && (!validOrigin(req) || !isJsonRequest(req))) return priceError(res, validOrigin(req) ? 415 : 403, validOrigin(req) ? 'json_required' : 'origin_forbidden')
  try {
    const user = await requireAdmin(req)
    if (!user) return priceError(res, 401, 'authentication_required')
    if (req.method === 'GET') {
      const prices = await supabaseRequest({ path: `/rest/v1/service_prices?select=${ADMIN_PRICE_COLUMNS}&order=service_group.asc,display_order.asc`, access: 'secret' })
      return json(res, 200, { prices })
    }

    const parsed = validatePriceInput(await readBody(req))
    if (!parsed.value) return priceError(res, 400, parsed.error, parsed.fields)
    const rows = await supabaseRequest({
      path: '/rest/v1/service_prices', method: 'POST', access: 'secret',
      headers: { Prefer: 'return=representation' }, body: { ...parsed.value, updated_by_email: user.email },
    })
    return json(res, 201, { price: rows?.[0] })
  } catch (error) {
    if (error.details?.code === '23505') return priceError(res, 409, 'duplicate_service_key')
    console.error(error)
    return priceError(res, 500, 'price_write_failed')
  }
}
