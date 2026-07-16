import crypto from 'node:crypto'
import { allowedOrigins, env } from '../../_lib/reviews.js'

function siteOrigin(req) {
  const requested = req.headers.origin
  if (requested && allowedOrigins().has(requested)) return requested
  const host = String(req.headers.host || '')
  const candidate = `${host.startsWith('localhost:') ? 'http' : 'https'}://${host}`
  return allowedOrigins().has(candidate) ? candidate : 'https://crissbt.com'
}

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const verifier = crypto.randomBytes(48).toString('base64url')
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url')
  const origin = siteOrigin(req)
  const secure = origin.startsWith('https:') ? '; Secure' : ''
  const cookie = `HttpOnly${secure}; SameSite=Lax; Path=/api/admin/oauth; Max-Age=600`
  res.setHeader('Set-Cookie', `reviews_oauth_verifier=${verifier}; ${cookie}`)
  const callback = `${origin}/api/admin/oauth/callback`
  const url = new URL(`${env('SUPABASE_URL')}/auth/v1/authorize`)
  url.searchParams.set('provider', 'google')
  url.searchParams.set('redirect_to', callback)
  url.searchParams.set('code_challenge', challenge)
  url.searchParams.set('code_challenge_method', 's256')
  return res.redirect(302, url.toString())
}
