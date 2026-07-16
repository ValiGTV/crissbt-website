import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const carousel = readFileSync('src/ReviewCarousel.jsx', 'utf8')
const app = readFileSync('src/App.jsx', 'utf8')
const css = readFileSync('src/App.css', 'utf8')

test('public approved reviews render through the custom carousel after filtering', () => {
  assert.match(app, /<ReviewCarousel key=\{filter\} reviews=\{visibleReviews\}/)
  assert.match(app, /visibleSource\.filter\(\(review\) => review\.service_type === filter\)/)
  assert.doesNotMatch(app, /<div className="reviews-grid">/)
})

test('carousel autoplay is slow, continuous, looping, and reduced-motion aware', () => {
  assert.match(carousel, /requestAnimationFrame\(animate\)/)
  assert.match(carousel, /\(time - previous\) \* 0\.008/)
  assert.match(carousel, /scrollLeft \+= setWidth/)
  assert.match(carousel, /scrollLeft -= setWidth/)
  assert.match(carousel, /prefers-reduced-motion: reduce/)
})

test('autoplay pauses independently for hover, focus, drag, touch, wheel, and modal', () => {
  for (const reason of ['hover', 'focus', 'drag', 'touch', 'wheel', 'modal']) {
    assert.match(carousel, new RegExp(`pause\\('${reason}'\\)`))
    assert.match(carousel, new RegExp(`resume\\('${reason}'\\)`))
  }
})

test('keyboard, mouse drag, trackpad, and touch navigation are wired', () => {
  assert.match(carousel, /event\.key === 'ArrowLeft'/)
  assert.match(carousel, /event\.key === 'ArrowRight'/)
  assert.match(carousel, /onPointerDown=\{pointerDown\}/)
  assert.match(carousel, /onPointerMove=\{pointerMove\}/)
  assert.match(carousel, /onTouchStart=/)
  assert.match(carousel, /onWheel=\{wheel\}/)
})

test('long reviews are clamped and open an accessible dismissible modal', () => {
  assert.match(carousel, /review\.review_text\.length > 280/)
  assert.match(css, /-webkit-line-clamp: 6/)
  assert.match(carousel, /role="dialog" aria-modal="true"/)
  assert.match(carousel, /event\.key === 'Escape'/)
  assert.match(carousel, /modalTrigger\.current\?\.focus\(\)/)
  assert.match(app, /readMore: 'Citește mai mult'/)
  assert.match(app, /readMore: 'Read more'/)
})

test('responsive carousel exposes four, three, two, and one-card layouts', () => {
  assert.match(css, /@media \(min-width: 1320px\)[\s\S]*?\/ 4\)/)
  assert.match(css, /\/ 3\)/)
  assert.match(css, /@media \(max-width: 1100px\)[\s\S]*?\/ 2\)/)
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*?width: calc\(100vw - 134px\)/)
  assert.match(css, /align-items: flex-start/)
})
