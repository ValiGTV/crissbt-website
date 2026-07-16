import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

function filesUnder(path) {
  return readdirSync(path).flatMap((name) => {
    const file = join(path, name)
    return statSync(file).isDirectory() ? filesUnder(file) : [file]
  })
}

test('configuration uses only the new Supabase key variable names', () => {
  const files = [...filesUnder('api'), '.env.example', 'README.md', ...filesUnder('src')]
  const source = files.map((file) => readFileSync(file, 'utf8')).join('\n')
  assert.doesNotMatch(source, /SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY/)
  assert.doesNotMatch(source, /VITE_SUPABASE_/)
  assert.match(source, /SUPABASE_PUBLISHABLE_KEY/)
  assert.match(source, /SUPABASE_SECRET_KEY/)
})

test('generated frontend bundle contains no Supabase secret configuration', () => {
  const source = filesUnder('dist').map((file) => readFileSync(file, 'utf8')).join('\n')
  assert.doesNotMatch(source, /SUPABASE_SECRET_KEY|sb_secret_|VITE_SUPABASE_/)
})

test('OAuth PKCE exchange explicitly uses publishable access', () => {
  const source = readFileSync('api/admin/oauth/callback.js', 'utf8')
  assert.match(source, /token\?grant_type=pkce[\s\S]*access: 'publishable'/)
})
