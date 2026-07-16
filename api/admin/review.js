import { isCanonicalUuid, isJsonRequest, json, readBody, requireAdmin, supabaseRequest, validOrigin } from '../_lib/reviews.js'

export default async function handler(req, res) {
  if (!['PATCH', 'DELETE'].includes(req.method)) return json(res, 405, { error: 'Method not allowed.' })
  if (!validOrigin(req)) return json(res, 403, { error: 'Request not allowed.' })
  if (req.method === 'PATCH' && !isJsonRequest(req)) return json(res, 415, { error: 'Unsupported request.' })
  try {
    if (!(await requireAdmin(req))) return json(res, 401, { error: 'Authentication required.' })
    const id = String(req.query?.id || '')
    if (!isCanonicalUuid(id)) return json(res, 400, { error: 'Invalid review.' })

    if (req.method === 'DELETE') {
      await supabaseRequest({ path: `/rest/v1/reviews?id=eq.${id}`, method: 'DELETE', access: 'secret', headers: { Prefer: 'return=minimal' } })
      return json(res, 200, { success: true })
    }

    const body = await readBody(req)
    if (!body) return json(res, 400, { error: 'Invalid request.' })
    const note = typeof body.moderationNote === 'string' ? body.moderationNote.normalize('NFC').trim().slice(0, 1000) || null : null
    let update
    if (body?.action === 'approve') {
      update = { status: 'approved', approved_at: new Date().toISOString(), rejected_at: null, moderation_note: note }
    } else if (body?.action === 'reject') {
      update = { status: 'rejected', rejected_at: new Date().toISOString(), approved_at: null, moderation_note: note }
    } else {
      return json(res, 400, { error: 'Invalid moderation action.' })
    }
    await supabaseRequest({
      path: `/rest/v1/reviews?id=eq.${id}`, method: 'PATCH', access: 'secret',
      headers: { Prefer: 'return=minimal' }, body: update,
    })
    return json(res, 200, { success: true })
  } catch (error) {
    console.error(error)
    return json(res, 500, { error: 'Unable to update review.' })
  }
}
