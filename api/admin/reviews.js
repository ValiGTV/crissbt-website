import { json, requireAdmin, supabaseRequest } from '../_lib/reviews.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed.' })
  try {
    if (!(await requireAdmin(req))) return json(res, 401, { error: 'Authentication required.' })
    const columns = 'id,reviewer_name,service_type,rating,review_text,visit_date,language,status,consent_given,submitted_at,approved_at,rejected_at,moderation_note'
    const reviews = await supabaseRequest({
      path: `/rest/v1/reviews?select=${columns}&order=submitted_at.desc&limit=300`,
      access: 'secret',
    })
    return json(res, 200, { reviews })
  } catch (error) {
    console.error(error)
    return json(res, 500, { error: 'Unable to load reviews.' })
  }
}
