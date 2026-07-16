import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  adminLabels,
  canStartModerationAction,
  deletionMethod,
  localizedModerationTimestamp,
} from '../src/adminReviewsLogic.js'

const appSource = readFileSync('src/App.jsx', 'utf8')
const sessionSource = readFileSync('api/admin/session.js', 'utf8')

test('logout and Google identity labels are localized', () => {
  assert.equal(adminLabels.ro.logout, 'Deconectare')
  assert.equal(adminLabels.en.logout, 'Sign out')
  assert.equal(adminLabels.ro.signedIn, 'Conectat prin Google')
  assert.equal(adminLabels.en.signedIn, 'Signed in with Google')
})

test('protected session identity is rendered without exposing tokens', () => {
  assert.match(appSource, /adminUser\?\.avatarUrl/)
  assert.match(appSource, /adminUser\?\.name/)
  assert.match(appSource, /adminUser\?\.email/)
  assert.match(sessionSource, /avatarUrl:/)
  assert.doesNotMatch(sessionSource, /accessToken\s*:/)
  assert.doesNotMatch(sessionSource, /refreshToken\s*:/)
})

test('approve, reject, delete, and error toast copy is present in both languages', () => {
  assert.equal(adminLabels.ro.success.approve, 'Recenzia a fost aprobată și publicată.')
  assert.equal(adminLabels.en.success.reject, 'The review was rejected.')
  assert.equal(adminLabels.ro.success.delete, 'Recenzia a fost ștearsă definitiv.')
  assert.ok(adminLabels.ro.actionError)
  assert.ok(adminLabels.en.actionError)
})

test('deletion requires confirmation and cancellation makes no DELETE request', () => {
  assert.equal(deletionMethod(false), null)
  assert.equal(deletionMethod(true), 'DELETE')
  assert.doesNotMatch(appSource, /window\.confirm/)
})

test('confirmed deletion has one guarded API action path', () => {
  assert.equal((appSource.match(/deletionMethod\(confirmed\)/g) || []).length, 1)
  assert.match(appSource, /onConfirm=\{\(\) => mutate\(deleteTarget\.review\.id, 'delete', '', true\)\}/)
})

test('moderation timestamps use supplied API values and selected locale', () => {
  const value = '2026-07-16T12:34:00.000Z'
  assert.ok(localizedModerationTimestamp(value, 'ro').length > 0)
  assert.ok(localizedModerationTimestamp(value, 'en').length > 0)
  assert.equal(localizedModerationTimestamp(null, 'ro'), null)
  assert.match(appSource, /review\.approved_at/)
  assert.match(appSource, /review\.rejected_at/)
})

test('moderation note is explicitly private and admin-only', () => {
  assert.equal(adminLabels.ro.note, 'Notă internă de moderare, opțional')
  assert.equal(adminLabels.ro.noteHelper, 'Vizibilă doar administratorilor.')
  assert.equal(adminLabels.en.noteHelper, 'Visible only to administrators.')
})

test('active requests prevent duplicate moderation actions', () => {
  assert.equal(canStartModerationAction(null), true)
  assert.equal(canStartModerationAction({ id: 'review', action: 'approve' }), false)
  assert.match(appSource, /disabled=\{busy\}/)
  assert.match(appSource, /if \(!canStartModerationAction\(activeAction\)\) return/)
})
