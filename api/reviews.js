import { clientIp, isJsonRequest, json, readBody, secretHash, supabaseRequest, validOrigin, validateReview } from './_lib/reviews.js'

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const select = 'id,reviewer_name,service_type,rating,review_text,visit_date,language,approved_at'
      const reviews = await supabaseRequest({
        path: `/rest/v1/reviews?status=eq.approved&select=${select}&order=approved_at.desc&limit=30`,
        access: 'publishable',
      })
      return json(res, 200, { reviews })
    }

    if (req.method === 'POST') {
      if (!validOrigin(req)) return json(res, 403, { error: 'Request not allowed.' })
      if (!isJsonRequest(req)) return json(res, 415, { error: 'Unsupported request.' })
      const review = validateReview(await readBody(req))
      if (review?.spam) return json(res, 200, { success: true })
      if (!review) return json(res, 400, { error: 'Invalid review submission.' })

      const accepted = await supabaseRequest({
        path: '/rest/v1/rpc/submit_pending_review',
        method: 'POST',
        access: 'secret',
        body: {
          p_ip_hash: secretHash(clientIp(req)), p_reviewer_name: review.reviewer_name,
          p_service_type: review.service_type, p_rating: review.rating,
          p_review_text: review.review_text, p_visit_date: review.visit_date,
          p_language: review.language, p_consent_given: review.consent_given,
        },
      })
      if (!accepted) return json(res, 429, { error: 'Too many submissions. Please try again later.' })
      return json(res, 201, { success: true })
    }

    res.setHeader('Allow', 'GET, POST')
    return json(res, 405, { error: 'Method not allowed.' })
  } catch (error) {
    console.error(error)
    return json(res, 500, { error: 'The review service is temporarily unavailable.' })
  }
}
