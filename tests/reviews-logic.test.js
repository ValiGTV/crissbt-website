import test from 'node:test'
import assert from 'node:assert/strict'
import { carouselBehavior, reviewDisplaySource, SAFE_CAROUSEL_REVIEW_COUNT } from '../src/reviewsLogic.js'

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

test('zero approved reviews display exactly the configured samples', () => {
  const displayed = reviewDisplaySource({ loading: false, failed: false, reviews: [], samples })
  assert.equal(displayed.length, samples.length)
  assert.deepEqual(displayed, samples)
})

test('one approved review displays once and hides every sample', () => {
  const real = [{ id: 'real-1' }]
  const displayed = reviewDisplaySource({ loading: false, failed: false, reviews: real, samples })
  assert.deepEqual(displayed, real)
  assert.equal(displayed.some((review) => review.id.startsWith('sample-')), false)
})

test('two approved reviews display as two unique cards and hide every sample', () => {
  const real = [{ id: 'real-1' }, { id: 'real-2' }]
  const displayed = reviewDisplaySource({ loading: false, failed: false, reviews: real, samples })
  assert.deepEqual(displayed, real)
  assert.equal(new Set(displayed.map((review) => review.id)).size, 2)
  assert.equal(displayed.some((review) => review.id.startsWith('sample-')), false)
})

test('duplicate approved rows are rendered only once', () => {
  const real = [{ id: 'real-1' }, { id: 'real-1' }, { id: 'real-2' }]
  assert.deepEqual(
    reviewDisplaySource({ loading: false, failed: false, reviews: real, samples }),
    [real[0], real[2]],
  )
})

test('carousel interaction starts only at the safe unique-review threshold', () => {
  assert.equal(SAFE_CAROUSEL_REVIEW_COUNT, 4)
  for (const count of [1, 2, 3]) {
    assert.equal(carouselBehavior(Array.from({ length: count }, (_, id) => ({ id }))).interactive, false)
  }
  assert.equal(carouselBehavior(Array.from({ length: 4 }, (_, id) => ({ id }))).interactive, true)
  assert.equal(carouselBehavior([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 3 }]).interactive, false)
})
