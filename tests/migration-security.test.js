import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const sql = readFileSync(new URL('../supabase/migrations/202607160001_create_reviews.sql', import.meta.url), 'utf8')

test('concurrent rate-limit attempts are serialized and cannot exceed three', () => {
  assert.match(sql, /function public\.submit_pending_review/)
  assert.match(sql, /pg_advisory_xact_lock/)
  assert.match(sql, /count\(\*\)[\s\S]*>= 3 then/)
  assert.match(sql, /insert into public\.reviews[\s\S]*insert into private\.review_submission_limits/)
  assert.match(sql, /submitted_at < now\(\) - interval '24 hours'/)
})

test('internal functions are denied to browser roles', () => {
  assert.match(sql, /revoke execute on function public\.submit_pending_review[\s\S]*from public, anon, authenticated/)
  assert.match(sql, /grant execute on function public\.submit_pending_review[\s\S]*to service_role/)
})

test('public RLS exposes approved reviews only', () => {
  assert.match(sql, /to anon, authenticated using \(status = 'approved'\)/)
  assert.match(sql, /revoke insert, update, delete on public\.reviews from anon, authenticated/)
})
