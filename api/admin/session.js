import { authenticatedUser, isGoogleAdmin, json } from '../_lib/reviews.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed.' })
  try {
    const user = await authenticatedUser(req)
    const metadata = user?.user_metadata || {}
    return json(res, 200, {
      authenticated: Boolean(user),
      authorized: isGoogleAdmin(user),
      user: user ? {
        name: metadata.full_name || metadata.name || user.email || '',
        email: user.email || '',
        avatarUrl: metadata.avatar_url || metadata.picture || null,
      } : null,
    })
  } catch { return json(res, 200, { authenticated: false, authorized: false }) }
}
