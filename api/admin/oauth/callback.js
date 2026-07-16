import { allowedOrigins, authenticatedUser, isGoogleAdmin, parseCookies, secretHash, supabaseRequest } from '../../_lib/reviews.js'

async function recordFailure(identifier) {
  try {
    return await supabaseRequest({
      path: '/rest/v1/rpc/record_admin_auth_failure', method: 'POST', access: 'secret',
      body: { p_identifier_hash: secretHash(identifier) },
    })
  } catch { return false }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const cookies = parseCookies(req)
  const host = String(req.headers.host || '')
  const candidate = `${host.startsWith('localhost:') ? 'http' : 'https'}://${host}`
  const origin = allowedOrigins().has(candidate) ? candidate : 'https://crissbt.com'
  const deny = async (identifier = req.socket?.remoteAddress || 'unknown') => {
    await recordFailure(identifier)
    return res.redirect(302, `${origin}/admin/reviews?auth=unauthorized`)
  }
  if (!req.query?.code || !cookies.reviews_oauth_verifier) return deny()

  try {
    const session = await supabaseRequest({
      path: '/auth/v1/token?grant_type=pkce', method: 'POST', access: 'publishable',
      body: { auth_code: req.query.code, code_verifier: cookies.reviews_oauth_verifier },
    })
    const probe = { headers: { cookie: `reviews_admin_session=${encodeURIComponent(session.access_token)}` } }
    const user = await authenticatedUser(probe)
    if (!isGoogleAdmin(user)) return deny(user?.email || 'unknown')
    res.setHeader('Set-Cookie', [
      `reviews_admin_session=${encodeURIComponent(session.access_token)}; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=${Math.min(session.expires_in || 3600, 3600)}`,
      'reviews_oauth_verifier=; HttpOnly; Secure; SameSite=Lax; Path=/api/admin/oauth; Max-Age=0',
    ])
    return res.redirect(302, `${origin}/admin/reviews`)
  } catch { return deny() }
}
