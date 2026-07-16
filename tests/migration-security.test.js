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

test('service price migration grants active-only reads and minimum server CRUD', () => {
  const sql = readFileSync('supabase/migrations/202607170001_create_service_prices.sql', 'utf8')
  assert.match(sql, /enable row level security/i)
  assert.match(sql, /using \(is_active = true\)/i)
  assert.match(sql, /grant select on table public\.service_prices to anon, authenticated/i)
  assert.match(sql, /grant select, insert, update, delete on table public\.service_prices to service_role/i)
  assert.doesNotMatch(sql, /grant[^;]*(?:truncate|trigger|references|maintain)/i)
  assert.doesNotMatch(sql, /drop\s+table|truncate\s+table|delete\s+from/i)
})

test('service price migration has server-controlled updated timestamp and exact seed count', () => {
  const sql = readFileSync('supabase/migrations/202607170001_create_service_prices.sql', 'utf8')
  assert.match(sql, /before update on public\.service_prices/i)
  assert.match(sql, /new\.updated_at = now\(\)/i)
  const seedValues = sql.slice(sql.indexOf('\nvalues\n'))
  assert.equal((seedValues.match(/\('(?:bowen|massage)'/g) || []).length, 7)
})
