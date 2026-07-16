export const adminLabels = {
  ro: {
    title: 'Moderare recenzii', google: 'Continuă cu Google', unauthorized: 'Acces neautorizat',
    unauthorizedText: 'Acest cont Google nu este autorizat pentru moderarea recenziilor.', logout: 'Deconectare',
    signedIn: 'Conectat prin Google', pending: 'În așteptare', approved: 'Aprobate', rejected: 'Respinse',
    approve: 'Aprobă', reject: 'Respinge', delete: 'Șterge', loading: 'Se procesează…',
    note: 'Notă internă de moderare, opțional', noteHelper: 'Vizibilă doar administratorilor.',
    all: 'Toate serviciile', empty: 'Nu există recenzii în această categorie.',
    deleteTitle: 'Ștergere definitivă', deleteText: 'Sigur dorești să ștergi definitiv această recenzie? Acțiunea nu poate fi anulată.',
    cancel: 'Anulează', deleteConfirm: 'Șterge definitiv', approvedAt: 'Aprobată la', rejectedAt: 'Respinsă la',
    success: { approve: 'Recenzia a fost aprobată și publicată.', reject: 'Recenzia a fost respinsă.', delete: 'Recenzia a fost ștearsă definitiv.' },
    actionError: 'Acțiunea nu a putut fi finalizată. Încearcă din nou.',
  },
  en: {
    title: 'Review moderation', google: 'Continue with Google', unauthorized: 'Unauthorized access',
    unauthorizedText: 'This Google account is not authorized to moderate reviews.', logout: 'Sign out',
    signedIn: 'Signed in with Google', pending: 'Pending', approved: 'Approved', rejected: 'Rejected',
    approve: 'Approve', reject: 'Reject', delete: 'Delete', loading: 'Working…',
    note: 'Internal moderation note, optional', noteHelper: 'Visible only to administrators.',
    all: 'All services', empty: 'There are no reviews in this category.',
    deleteTitle: 'Permanent deletion', deleteText: 'Are you sure you want to permanently delete this review? This action cannot be undone.',
    cancel: 'Cancel', deleteConfirm: 'Delete permanently', approvedAt: 'Approved at', rejectedAt: 'Rejected at',
    success: { approve: 'The review was approved and published.', reject: 'The review was rejected.', delete: 'The review was permanently deleted.' },
    actionError: 'The action could not be completed. Please try again.',
  },
}

export function localizedModerationTimestamp(value, language) {
  if (!value) return null
  return new Intl.DateTimeFormat(language === 'ro' ? 'ro-RO' : 'en-GB', {
    dateStyle: 'medium', timeStyle: 'short',
  }).format(new Date(value))
}

export function canStartModerationAction(activeAction) {
  return activeAction === null
}

export function deletionMethod(confirmed) {
  return confirmed ? 'DELETE' : null
}
