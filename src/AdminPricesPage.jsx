import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const copy = {
  ro: {
    title: 'Prețuri și abonamente', reviews: 'Recenzii', prices: 'Prețuri și abonamente', bowen: 'Terapia Bowen', massage: 'Servicii de masaj',
    login: 'Continuă cu Google', logout: 'Deconectare', signedIn: 'Conectat prin Google', loading: 'Se procesează…', loadError: 'Prețurile nu au putut fi încărcate.',
    titleRo: 'Titlu în română', titleEn: 'Titlu în engleză', descriptionRo: 'Descriere în română', descriptionEn: 'Descriere în engleză', duration: 'Durată (minute)', sessionPrice: 'Preț ședință (RON)', packageSessions: 'Ședințe în abonament', packagePrice: 'Preț abonament (RON)', audience: 'Public', order: 'Ordine', active: 'Activ',
    save: 'Salvează', cancel: 'Anulează', edit: 'Editează', activate: 'Activează', deactivate: 'Dezactivează', delete: 'Șterge', unsaved: 'Modificări nesalvate', saved: 'Prețul a fost actualizat.', toggled: 'Starea serviciului a fost actualizată.', deleted: 'Serviciul a fost șters.', error: 'Acțiunea nu a putut fi finalizată.',
    deleteTitle: 'Ștergere serviciu', deleteText: 'Sigur dorești să ștergi definitiv acest serviciu? Acțiunea nu poate fi anulată.', deleteConfirm: 'Șterge definitiv',
  },
  en: {
    title: 'Prices and packages', reviews: 'Reviews', prices: 'Prices and packages', bowen: 'Bowen Therapy', massage: 'Massage services',
    login: 'Continue with Google', logout: 'Sign out', signedIn: 'Signed in with Google', loading: 'Working…', loadError: 'Prices could not be loaded.',
    titleRo: 'Romanian title', titleEn: 'English title', descriptionRo: 'Romanian description', descriptionEn: 'English description', duration: 'Duration (minutes)', sessionPrice: 'Session price (RON)', packageSessions: 'Package sessions', packagePrice: 'Package price (RON)', audience: 'Audience', order: 'Display order', active: 'Active',
    save: 'Save', cancel: 'Cancel', edit: 'Edit', activate: 'Activate', deactivate: 'Deactivate', delete: 'Delete', unsaved: 'Unsaved changes', saved: 'The price was updated.', toggled: 'The service status was updated.', deleted: 'The service was deleted.', error: 'The action could not be completed.',
    deleteTitle: 'Delete service', deleteText: 'Are you sure you want to permanently delete this service? This action cannot be undone.', deleteConfirm: 'Delete permanently',
  },
}

function payload(row) {
  return {
    serviceGroup: row.service_group, serviceKey: row.service_key, titleRo: row.title_ro, titleEn: row.title_en,
    descriptionRo: row.description_ro || null, descriptionEn: row.description_en || null,
    durationMinutes: row.duration_minutes ?? null, sessionPriceRon: row.session_price_ron,
    packageSessions: row.package_sessions ?? null, packagePriceRon: row.package_price_ron ?? null,
    audience: row.audience || null, displayOrder: row.display_order, isActive: row.is_active,
  }
}

function Toast({ toast }) {
  return <div className={`admin-toast ${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'} aria-live="polite">{toast.text}</div>
}

function DeleteModal({ labels, busy, onCancel, onConfirm }) {
  const modal = useRef(null)
  const cancel = useRef(null)
  useEffect(() => {
    cancel.current?.focus()
    const keydown = (event) => {
      if (event.key === 'Escape' && !busy) return onCancel()
      if (event.key !== 'Tab') return
      const buttons = [...modal.current.querySelectorAll('button:not([disabled])')]
      if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1)?.focus() }
      else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0]?.focus() }
    }
    document.addEventListener('keydown', keydown)
    return () => document.removeEventListener('keydown', keydown)
  }, [busy, onCancel])
  return <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel() }}><div ref={modal} className="admin-delete-modal glass-card" role="dialog" aria-modal="true" aria-labelledby="price-delete-title" aria-describedby="price-delete-text"><h2 id="price-delete-title">{labels.deleteTitle}</h2><p id="price-delete-text">{labels.deleteText}</p><div className="admin-modal-actions"><button ref={cancel} className="button secondary" type="button" disabled={busy} onClick={onCancel}>{labels.cancel}</button><button className="admin-delete-confirm" type="button" disabled={busy} onClick={onConfirm}>{busy ? labels.loading : labels.deleteConfirm}</button></div></div></div>
}

function PriceCard({ price, labels, busy, onSave, onToggle, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(price)
  const changed = JSON.stringify(payload(draft)) !== JSON.stringify(payload(price))
  const field = (key, value) => setDraft((current) => ({ ...current, [key]: value }))
  const nullableNumber = (value) => value === '' ? null : Number(value)

  return <article className={`glass-card admin-price-card ${price.is_active ? '' : 'inactive'}`}><header><div><h3>{price.title_ro}</h3><small>{price.service_key}</small></div><span className={price.is_active ? 'price-status active' : 'price-status'}>{price.is_active ? labels.active : labels.deactivate}</span></header>{editing ? <form onSubmit={(event) => { event.preventDefault(); onSave(price.id, draft).then((ok) => { if (ok) setEditing(false) }) }}><div className="admin-price-fields"><label>{labels.titleRo}<input value={draft.title_ro} maxLength="120" required onChange={(event) => field('title_ro', event.target.value)} /></label><label>{labels.titleEn}<input value={draft.title_en} maxLength="120" required onChange={(event) => field('title_en', event.target.value)} /></label><label>{labels.descriptionRo}<textarea value={draft.description_ro || ''} maxLength="1000" onChange={(event) => field('description_ro', event.target.value || null)} /></label><label>{labels.descriptionEn}<textarea value={draft.description_en || ''} maxLength="1000" onChange={(event) => field('description_en', event.target.value || null)} /></label><label>{labels.duration}<input type="number" min="1" max="1440" value={draft.duration_minutes ?? ''} onChange={(event) => field('duration_minutes', nullableNumber(event.target.value))} /></label><label>{labels.sessionPrice}<input type="number" min="1" max="1000000" value={draft.session_price_ron} required onChange={(event) => field('session_price_ron', Number(event.target.value))} /></label><label>{labels.packageSessions}<input type="number" min="1" max="1000" value={draft.package_sessions ?? ''} onChange={(event) => field('package_sessions', nullableNumber(event.target.value))} /></label><label>{labels.packagePrice}<input type="number" min="1" max="1000000" value={draft.package_price_ron ?? ''} onChange={(event) => field('package_price_ron', nullableNumber(event.target.value))} /></label><label>{labels.audience}<select value={draft.audience || 'general'} onChange={(event) => field('audience', event.target.value)}><option value="adult">adult</option><option value="child">child</option><option value="general">general</option></select></label><label>{labels.order}<input type="number" min="0" max="10000" value={draft.display_order} required onChange={(event) => field('display_order', Number(event.target.value))} /></label></div>{changed && <p className="admin-unsaved" role="status">{labels.unsaved}</p>}<footer><button className="button primary" type="submit" disabled={busy || !changed}>{busy ? labels.loading : labels.save}</button><button className="button secondary" type="button" disabled={busy} onClick={() => { setDraft(price); setEditing(false) }}>{labels.cancel}</button></footer></form> : <><dl><div><dt>{labels.sessionPrice}</dt><dd>{price.session_price_ron} RON</dd></div>{price.duration_minutes && <div><dt>{labels.duration}</dt><dd>{price.duration_minutes}</dd></div>}{price.package_sessions && <div><dt>{labels.packageSessions}</dt><dd>{price.package_sessions}</dd></div>}{price.package_price_ron && <div><dt>{labels.packagePrice}</dt><dd>{price.package_price_ron} RON</dd></div>}</dl><footer><button className="button primary" type="button" disabled={busy} onClick={() => { setDraft(price); setEditing(true) }}>{labels.edit}</button><button className="button secondary" type="button" disabled={busy} onClick={() => onToggle(price)}>{busy ? labels.loading : price.is_active ? labels.deactivate : labels.activate}</button><button className="admin-delete" type="button" disabled={busy} onClick={(event) => onDelete(price, event.currentTarget)}>{labels.delete}</button></footer></>}</article>
}

export default function AdminPricesPage({ language }) {
  const labels = copy[language]
  const [authenticated, setAuthenticated] = useState(null)
  const [adminUser, setAdminUser] = useState(null)
  const [prices, setPrices] = useState([])
  const [busy, setBusy] = useState(null)
  const [toast, setToast] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/prices')
    if (!response.ok) throw new Error('load')
    const data = await response.json()
    setPrices(data.prices || [])
  }, [])

  useEffect(() => {
    fetch('/api/admin/session').then((response) => response.json()).then(async (session) => {
      if (!session.authorized) { setAuthenticated(false); return }
      setAdminUser(session.user || null)
      await load()
      setAuthenticated(true)
    }).catch(() => { setToast({ type: 'error', text: labels.loadError }); setAuthenticated(false) })
  }, [labels.loadError, load])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const request = async (id, options, successText) => {
    if (busy) return false
    setBusy(id)
    try {
      const response = await fetch(`/api/admin/price?id=${encodeURIComponent(id)}`, options)
      if (!response.ok) throw new Error('write')
      await load()
      setToast({ type: 'success', text: successText })
      return true
    } catch {
      setToast({ type: 'error', text: labels.error })
      return false
    } finally { setBusy(null) }
  }

  const closeDelete = useCallback(() => {
    const trigger = deleteTarget?.trigger
    setDeleteTarget(null)
    window.setTimeout(() => trigger?.focus(), 0)
  }, [deleteTarget])

  const save = (id, row) => request(id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload(row)) }, labels.saved)
  const toggle = (row) => request(row.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !row.is_active }) }, labels.toggled)
  const remove = async () => { if (await request(deleteTarget.price.id, { method: 'DELETE' }, labels.deleted)) closeDelete() }
  const logout = async () => { if (busy) return; setBusy('logout'); try { await fetch('/api/admin/logout', { method: 'POST' }); setAuthenticated(false) } finally { setBusy(null) } }

  if (authenticated !== true) return <main className="page page-reviews"><div className="page-overlay" aria-hidden="true"></div><section className="content-section page-content admin-login-shell"><div className="review-form admin-login"><h1>{labels.title}</h1>{authenticated === null ? <p>{labels.loading}</p> : <a className="button primary" href="/api/admin/oauth/start">{labels.login}</a>}</div></section>{toast && <Toast toast={toast} />}</main>

  return <main className="page page-reviews"><div className="page-overlay" aria-hidden="true"></div><section className="content-section page-content admin-page-content"><div className="section-shell admin-reviews-shell"><header className="admin-heading"><h1>{labels.title}</h1><div className="admin-account-area">{adminUser?.avatarUrl && <img className="admin-avatar" src={adminUser.avatarUrl} alt="" referrerPolicy="no-referrer" />}<div className="admin-identity"><strong>{adminUser?.name}</strong><span>{adminUser?.email}</span><small>{labels.signedIn}</small></div><button className="button secondary" type="button" disabled={Boolean(busy)} onClick={logout}>{busy === 'logout' ? labels.loading : labels.logout}</button></div></header><nav className="admin-section-nav" aria-label={labels.title}><Link to="/admin/reviews">{labels.reviews}</Link><Link className="active" to="/admin/prices" aria-current="page">{labels.prices}</Link></nav>{[['bowen', labels.bowen], ['massage', labels.massage]].map(([group, title]) => <section className="admin-price-group" key={group}><h2>{title}</h2><div className="admin-price-grid">{prices.filter((price) => price.service_group === group).map((price) => <PriceCard key={price.id} price={price} labels={labels} busy={busy === price.id} onSave={save} onToggle={toggle} onDelete={(target, trigger) => setDeleteTarget({ price: target, trigger })} />)}</div></section>)}</div></section>{toast && <Toast toast={toast} />}{deleteTarget && <DeleteModal labels={labels} busy={busy === deleteTarget.price.id} onCancel={closeDelete} onConfirm={remove} />}</main>
}
