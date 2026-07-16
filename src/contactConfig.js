export const CONTACT_EMAIL = 'pascucri@gmail.com'

export function contactMailto({ name, contact, service, message, labels }) {
  const subject = `CRISSBT – ${service}`
  const body = [
    `${labels.service}: ${service}`,
    `${labels.name}: ${name || '—'}`,
    `${labels.contact}: ${contact || '—'}`,
    '',
    `${labels.message}:`,
    message || '—',
  ].join('\n')

  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
