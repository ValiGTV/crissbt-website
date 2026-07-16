import { json, supabaseRequest } from './_lib/reviews.js'
import { PUBLIC_PRICE_COLUMNS } from './_lib/prices.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed.' })
  try {
    const prices = await supabaseRequest({
      path: `/rest/v1/service_prices?is_active=eq.true&select=${PUBLIC_PRICE_COLUMNS}&order=service_group.asc,display_order.asc`,
      access: 'publishable',
    })
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    return res.status(200).setHeader('Content-Type', 'application/json; charset=utf-8').json({ prices })
  } catch (error) {
    console.error(error)
    return json(res, 503, { error: 'Pricing is temporarily unavailable.' })
  }
}
