export function reviewDisplaySource({ loading, failed, reviews, samples }) {
  if (loading || failed) return []
  return reviews.length > 0 ? reviews : samples
}
