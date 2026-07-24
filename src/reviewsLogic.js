export const SAFE_CAROUSEL_REVIEW_COUNT = 4

export function uniqueReviews(reviews) {
  const seen = new Set()
  return reviews.filter((review) => {
    const key = review.id ?? `${review.reviewer_name}\u0000${review.review_text}\u0000${review.visit_date ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function carouselBehavior(reviews) {
  const unique = uniqueReviews(reviews)
  return { reviews: unique, interactive: unique.length >= SAFE_CAROUSEL_REVIEW_COUNT }
}

export function reviewDisplaySource({ loading, failed, reviews, samples }) {
  if (loading || failed) return []
  return reviews.length > 0 ? uniqueReviews(reviews) : samples
}
