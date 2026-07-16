import test from 'node:test'
import assert from 'node:assert/strict'
import { reviewDisplaySource } from '../src/reviewsLogic.js'

const samples = [{ id: 'sample-1' }, { id: 'sample-2' }, { id: 'sample-3' }]

test('samples appear only after a successful empty response', () => {
  assert.deepEqual(reviewDisplaySource({ loading: false, failed: false, reviews: [], samples }), samples)
  assert.deepEqual(reviewDisplaySource({ loading: true, failed: false, reviews: [], samples }), [])
  assert.deepEqual(reviewDisplaySource({ loading: false, failed: true, reviews: [], samples }), [])
})

test('real reviews replace all samples', () => {
  const real = [{ id: 'real' }]
  assert.deepEqual(reviewDisplaySource({ loading: false, failed: false, reviews: real, samples }), real)
})
