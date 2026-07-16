import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

function reviewerName(name) {
  const parts = name.trim().split(/\s+/)
  return parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0]
}

function ReviewCard({ review, t, language, accessible, onReadMore }) {
  const isLong = review.review_text.length > 280
  return <article className="glass-card review-card" aria-hidden={!accessible}><div className="stars" aria-label={`${review.rating} ${t.starsLabel}`}>{'★'.repeat(review.rating)}<span>{'★'.repeat(5 - review.rating)}</span></div><strong className="review-service">{t.services[review.service_type]}</strong><div className={`review-card-copy ${isLong ? 'truncated' : ''}`}><p>“{review.review_text}”</p></div>{isLong && <button className="review-read-more" type="button" tabIndex={accessible ? 0 : -1} onClick={(event) => onReadMore(review, event.currentTarget)}>{t.readMore}</button>}<footer><strong>{reviewerName(review.reviewer_name)}</strong>{review.visit_date && <time dateTime={review.visit_date}>{t.visitDate}: {new Intl.DateTimeFormat(language === 'ro' ? 'ro-RO' : 'en-GB').format(new Date(`${review.visit_date}T00:00:00`))}</time>}</footer></article>
}

function ReviewModal({ review, t, onClose }) {
  const modal = useRef(null)
  const close = useRef(null)
  useEffect(() => {
    close.current?.focus()
    const keydown = (event) => {
      if (event.key === 'Escape') return onClose()
      if (event.key !== 'Tab') return
      const focusable = [...modal.current.querySelectorAll('button:not([disabled])')]
      if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1)?.focus() }
      else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0]?.focus() }
    }
    document.addEventListener('keydown', keydown)
    return () => document.removeEventListener('keydown', keydown)
  }, [onClose])
  return <div className="review-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><article ref={modal} className="review-modal glass-card" role="dialog" aria-modal="true" aria-labelledby="review-modal-title"><button ref={close} className="review-modal-close" type="button" aria-label={t.closeReview} onClick={onClose}>×</button><div className="stars" aria-label={`${review.rating} ${t.starsLabel}`}>{'★'.repeat(review.rating)}</div><strong className="review-service">{t.services[review.service_type]}</strong><p id="review-modal-title">“{review.review_text}”</p><footer><strong>{reviewerName(review.reviewer_name)}</strong></footer></article></div>
}

export default function ReviewCarousel({ reviews, t, language }) {
  const viewport = useRef(null)
  const pauseReasons = useRef(new Set())
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, scroll: 0 })
  const wheelTimer = useRef(null)
  const modalTrigger = useRef(null)
  const [activeIndicator, setActiveIndicator] = useState(0)
  const [modalReview, setModalReview] = useState(null)
  const indicatorCount = Math.min(8, reviews.length)
  const repeated = useMemo(() => [0, 1, 2].flatMap((copy) => reviews.map((review) => ({ review, copy }))), [reviews])
  const pause = (reason) => pauseReasons.current.add(reason)
  const resume = (reason) => pauseReasons.current.delete(reason)

  const loopWidth = useCallback(() => {
    const element = viewport.current
    const track = element?.firstElementChild
    if (!element || !track) return 0
    const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0
    return (element.scrollWidth + gap) / 3
  }, [])

  const normalize = useCallback(() => {
    const element = viewport.current
    if (!element || !reviews.length) return
    const setWidth = loopWidth()
    if (element.scrollLeft < setWidth * 0.45) element.scrollLeft += setWidth
    else if (element.scrollLeft > setWidth * 1.55) element.scrollLeft -= setWidth
    const relative = ((element.scrollLeft - setWidth) % setWidth + setWidth) % setWidth
    setActiveIndicator(Math.min(indicatorCount - 1, Math.floor((relative / setWidth) * indicatorCount)))
  }, [indicatorCount, loopWidth, reviews.length])

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (viewport.current) viewport.current.scrollLeft = loopWidth()
    })
    return () => cancelAnimationFrame(frame)
  }, [loopWidth, reviews])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    let frame
    let previous
    const animate = (time) => {
      const element = viewport.current
      if (element && pauseReasons.current.size === 0 && previous) {
        element.scrollLeft += Math.min(0.24, (time - previous) * 0.008)
        normalize()
      }
      previous = time
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [normalize])

  useEffect(() => () => window.clearTimeout(wheelTimer.current), [])

  const move = (direction) => {
    const element = viewport.current
    const card = element?.querySelector('.review-card')
    if (!element || !card) return
    const gap = Number.parseFloat(window.getComputedStyle(element.firstElementChild).columnGap) || 0
    pause('manual')
    element.scrollBy({ left: direction * (card.getBoundingClientRect().width + gap), behavior: 'smooth' })
    window.setTimeout(() => { resume('manual'); normalize() }, 480)
  }

  const openModal = (review, trigger) => { modalTrigger.current = trigger; pause('modal'); setModalReview(review) }
  const closeModal = useCallback(() => { setModalReview(null); resume('modal'); window.setTimeout(() => modalTrigger.current?.focus(), 0) }, [])
  const pointerDown = (event) => {
    if (event.pointerType === 'touch') return
    dragging.current = true
    pause('drag')
    dragStart.current = { x: event.clientX, scroll: viewport.current.scrollLeft }
    viewport.current.setPointerCapture(event.pointerId)
    viewport.current.classList.add('dragging')
  }
  const pointerMove = (event) => { if (dragging.current) viewport.current.scrollLeft = dragStart.current.scroll - (event.clientX - dragStart.current.x) }
  const pointerEnd = () => { dragging.current = false; resume('drag'); viewport.current?.classList.remove('dragging'); normalize() }
  const wheel = () => { pause('wheel'); window.clearTimeout(wheelTimer.current); wheelTimer.current = window.setTimeout(() => { resume('wheel'); normalize() }, 700) }

  return <section className="review-carousel" aria-roledescription="carousel" aria-label={t.carouselLabel} onMouseEnter={() => pause('hover')} onMouseLeave={() => resume('hover')} onFocusCapture={() => pause('focus')} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) resume('focus') }}><div className="review-carousel-frame"><button className="review-carousel-arrow previous" type="button" aria-label={t.previousReview} onClick={() => move(-1)}>‹</button><div ref={viewport} className="review-carousel-viewport" tabIndex="0" onKeyDown={(event) => { if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1) } else if (event.key === 'ArrowRight') { event.preventDefault(); move(1) } }} onScroll={normalize} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onTouchStart={() => pause('touch')} onTouchEnd={() => { resume('touch'); normalize() }} onWheel={wheel}><div className="review-carousel-track">{repeated.map(({ review, copy }) => <ReviewCard key={`${copy}-${review.id}`} review={review} t={t} language={language} accessible={copy === 1} onReadMore={openModal} />)}</div></div><button className="review-carousel-arrow next" type="button" aria-label={t.nextReview} onClick={() => move(1)}>›</button></div>{indicatorCount > 1 && <div className="review-carousel-indicators" aria-hidden="true">{Array.from({ length: indicatorCount }, (_, index) => <span className={index === activeIndicator ? 'active' : ''} key={index}></span>)}</div>}{modalReview && <ReviewModal review={modalReview} t={t} onClose={closeModal} />}</section>
}
