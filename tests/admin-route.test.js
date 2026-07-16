import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const appSource = readFileSync('src/App.jsx', 'utf8')

test('/admin redirects client-side to /admin/reviews while preserving language query state', () => {
  assert.match(appSource, /<Route path="\/admin" element=\{<AdminRedirect \/>\} \/>/)
  assert.match(appSource, /const \{ search, hash \} = useLocation\(\)/)
  assert.match(appSource, /<Navigate replace to=\{`\/admin\/reviews\$\{search\}\$\{hash\}`\} \/>/)
})
