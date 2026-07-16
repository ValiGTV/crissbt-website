import { json, validOrigin } from '../_lib/reviews.js'

export default function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' })
  if (!validOrigin(req)) return json(res, 403, { error: 'Request not allowed.' })
  res.setHeader('Set-Cookie', 'reviews_admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=0')
  return json(res, 200, { success: true })
}
