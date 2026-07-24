import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import './App.css'
import { reviewDisplaySource } from './reviewsLogic.js'
import { adminLabels, canStartModerationAction, deletionMethod, localizedModerationTimestamp } from './adminReviewsLogic.js'
import SeoMetadata from './SeoMetadata.jsx'
import { CONTACT_EMAIL, contactMailto } from './contactConfig.js'
import AdminPricesPage from './AdminPricesPage.jsx'
import ReviewCarousel from './ReviewCarousel.jsx'

const DEFAULT_AUDIO_VOLUME = 0.22
const LANGUAGE_STORAGE_KEY = 'pensiunea-cris-language'
const SOUND_STORAGE_KEY = 'pensiunea-cris-sound'

const translations = {
  ro: {
    navAria: 'Navigatie principala',
    brandAria: 'Pensiunea Criss acasa',
    nav: [
      { label: 'Acasă', to: '/' },
      { label: 'Pensiunea Criss', to: '/pensiunea' },
      { label: 'Terapia Bowen & Masaj', to: '/therapy' },
      { label: 'Recenzii', to: '/recenzii' },
      { label: 'Contact', to: '/contact' },
    ],
    language: {
      aria: 'Schimba limba',
      ro: 'Romana',
      en: 'Engleza',
    },
    home: {
      eyebrow: 'Slanic Prahova',
      subtitle: 'Cazare • Terapia Bowen • Masaj • Relaxare in Slanic Prahova',
      primaryButton: 'Vezi pensiunea',
      secondaryButton: 'Programeaza-te',
      soundOn: '🔊 Sunet pornit',
      soundOff: '🔇 Sunet oprit',
      actionsAria: 'Actiuni principale',
      noteAria: 'Atmosfera pensiunii',
      noteLabel: 'Pensiune wellness montană',
      noteTitle: 'Liniste, lemn cald, terapii si seri tihnite.',
      noteText: 'Un refugiu boutique pentru odihna si wellness aproape de natura.',
      cards: [
        {
          title: 'Cazare boutique',
          text: 'Camere calde, atmosfera naturala si detalii rustice premium.',
        },
        {
          title: 'Terapia Bowen',
          text: 'Sesiuni blande pentru relaxare profunda si echilibru corporal.',
        },
        {
          title: 'Masaj & relaxare',
          text: 'Ritualuri linistite pentru detensionare si stare de bine.',
        },
      ],
    },
    pension: {
      eyebrow: 'Cazare rustica eleganta',
      title: 'Pensiunea Criss',
      text: 'O pensiune cu aer cald, materiale naturale si o atmosfera potrivita pentru weekenduri linistite, tratamente wellness si timp petrecut fara graba.',
      cards: [
        {
          title: 'Despre pensiune',
          text: 'Un refugiu cald in Slanic Prahova, gandit pentru odihna, liniste si seri tihnite aproape de natura.',
        },
        {
          title: 'Preturi',
          text: 'Tarife flexibile pentru cazare, sejururi relaxante si pachete combinate cu servicii wellness.',
        },
        {
          title: 'Programari',
          text: 'Rezervarile se pot face telefonic sau prin formular, cu recomandari personalizate pentru fiecare oaspete.',
        },
        {
          title: 'Servicii',
          text: 'Camere primitoare, spatii de relaxare, terasa, mic dejun la cerere si indrumare pentru atractiile locale.',
        },
      ],
      featureLabel: 'Slanic Prahova',
      featureTitle: 'Refugiu intim pentru weekenduri lente',
      featureText: 'Texturi naturale, lumina calda si servicii wellness intr-o atmosfera de pensiune montana premium.',
      metrics: ['Wellness', 'Cazare', 'Relaxare'],
      announcement: {
        lead: 'Pregătim ultimele detalii pentru a vă oferi o experiență de neuitat.',
        opening: 'Deschiderea oficială va avea loc în curând.',
        welcome: 'Vă așteptăm cu drag!',
      },
    },
    therapy: {
      eyebrow: 'Wellness & recuperare blândă',
      title: 'Terapia Bowen & Masaj',
      text: 'Servicii profesionale de Terapie Bowen și masaj, prezentate clar pentru a alege ședința potrivită nevoilor tale.',
      bowen: {
        title: 'Terapia Bowen',
        subtitle: 'Ședințe blânde și personalizate pentru adulți și copii.',
        note: 'Durata și planul ședințelor se stabilesc în funcție de nevoile fiecărei persoane.',
      },
      massage: {
        title: 'Servicii de masaj',
        subtitle: 'Servicii profesionale de masaj și relaxare, oferite într-un cadru calm și confortabil.',
        labels: {
          duration: 'Durată',
          sessionPrice: 'Preț ședință',
          package: 'Abonament',
          packagePrice: 'Preț abonament',
        },
      },
      pricesLoading: 'Se încarcă tarifele…',
      pricesUnavailable: 'Tarifele sunt momentan în curs de actualizare. Pentru informații, vă rugăm să ne contactați.',
      cta: {
        title: 'Programează o ședință',
        text: 'Pentru informații și programări, ne poți contacta telefonic sau prin formularul de contact.',
        call: 'Sună acum',
        contact: 'Contactează-ne',
      },
      certificates: {
        intro: 'Cristina Pascu deține formare și certificări profesionale în Terapia Bowen și servicii de masaj. Documentele sunt prezentate în scop informativ și sunt protejate prin marcaj vizual.',
        bowenTitle: 'Diplome și atestate – Terapia Bowen',
        massageTitle: 'Diplome și atestate – Masaj',
        genericTitle: 'Diplomă și atestat profesional',
        captions: {
          babies: 'Certificat Bowen pentru bebeluși',
          diabetes: 'Specializare Bowen pentru diabet',
          sports: 'Specializare Bowen – accidentări sportive',
          technique: 'Certificat Tehnica Bowen',
          masseur: 'Atestat profesional – Maseur',
          rejuvance: 'Certificat Rejuvance',
        },
        empty: 'Diplomele și atestatele vor fi publicate în curând.',
        loading: 'Se încarcă documentul…',
        preview: 'Previzualizare diplomă',
        close: 'Închide previzualizarea',
        previous: 'Documentul anterior',
        next: 'Documentul următor',
      },
      pricingAria: 'Prețuri Terapia Bowen',
      massageAria: 'Servicii și prețuri masaj',
    },
    reviews: {
      eyebrow: 'Experiențe wellness',
      title: 'Recenzii',
      text: 'Impresii despre Terapia Bowen și serviciile de masaj oferite la Pensiunea Criss.',
      ratingAria: 'Rating 5 din 5',
      all: 'Toate',
      services: { bowen: 'Terapia Bowen', facial_massage: 'Masaj facial', relaxation_massage: 'Masaj de relaxare', therapeutic_massage: 'Masaj terapeutic', reflexology: 'Reflexoterapie' },
      formTitle: 'Lasă o recenzie',
      moderationNotice: 'Recenziile sunt verificate înainte de publicare.',
      fields: { name: 'Nume', service: 'Serviciu', rating: 'Evaluare', review: 'Recenzie', date: 'Data vizitei, opțional', consent: 'Sunt de acord ca recenzia mea să fie publicată după verificare.', submit: 'Trimite recenzia', namePlaceholder: 'Numele tău', reviewPlaceholder: 'Povestește-ne despre experiența ta' },
      success: 'Mulțumim! Recenzia a fost trimisă și va apărea după aprobare.',
      invalid: 'Verifică toate câmpurile și încearcă din nou.',
      submitError: 'Recenzia nu a putut fi trimisă. Încearcă din nou mai târziu.',
      loading: 'Se încarcă recenziile…',
      loadError: 'Recenziile nu pot fi încărcate momentan.',
      empty: 'Nu există încă recenzii aprobate pentru acest serviciu.',
      visitDate: 'Vizită',
      starsLabel: 'stele',
      carouselLabel: 'Carusel cu recenzii aprobate',
      previousReview: 'Recenzia anterioară',
      nextReview: 'Recenzia următoare',
      readMore: 'Citește mai mult',
      closeReview: 'Închide recenzia',
    },
    contact: {
      eyebrow: 'Rezervari si programari',
      title: 'Contact',
      text: 'Scrie-ne pentru cazare, masaj sau terapia Bowen. Raspundem cu disponibilitatea si o recomandare potrivita pentru vizita ta.',
      cards: {
        lodgingEmail: 'Email cazare',
        massageEmail: 'Email masaj',
        bowenEmail: 'Email Terapia Bowen',
        phone: 'Telefon',
        company: 'Companie',
        therapist: {
          name: 'Cristina Pascu',
          subtitle: 'Terapeut Bowen și specialist în masaj de relaxare',
          text: 'Programări pentru Terapia Bowen, masaj de relaxare și servicii wellness.',
        },
      },
      directions: {
        title: 'Cum ajungeți la noi',
        address: ['Pensiunea Criss', 'Strada Ghioceilor nr. 6A', 'Slănic, Prahova, România'],
        details: [
          'Aproape de principalele atracții din Slănic Prahova',
          'Parcare disponibilă pentru oaspeți',
          'Acces facil cu autoturismul',
          'Navigație directă prin Google Maps',
        ],
        openMap: 'Deschide harta',
        startNavigation: 'Pornește navigația',
      },
      form: {
        name: 'Nume',
        namePlaceholder: 'Numele tau',
        contact: 'Email sau telefon',
        contactPlaceholder: 'Cum te putem contacta',
        interest: 'Interes',
        message: 'Mesaj',
        messagePlaceholder: 'Perioada dorita, numar de persoane sau tipul programarii',
        submit: 'Trimite cererea',
        options: {
          lodging: 'Cazare',
          massage: 'Masaj',
          bowen: 'Terapia Bowen',
          package: 'Pachet cazare + wellness',
        },
      },
    },
    footer: {
      location: 'Pensiunea Criss • Slanic Prahova',
      company: 'CRISSBT SRL • 0743486611',
    },
    quickContact: {
      whatsappLabel: 'Scrie-ne pe WhatsApp',
      whatsappMessage:
        'Bună ziua! Doresc mai multe informații despre Pensiunea Criss și serviciile disponibile.',
      callLabel: 'Sună acum',
    },
  },
  en: {
    navAria: 'Main navigation',
    brandAria: 'Pensiunea Criss home',
    nav: [
      { label: 'Home', to: '/' },
      { label: 'Pensiunea Criss', to: '/pensiunea' },
      { label: 'Bowen Therapy & Massage', to: '/therapy' },
      { label: 'Reviews', to: '/recenzii' },
      { label: 'Contact', to: '/contact' },
    ],
    language: {
      aria: 'Change language',
      ro: 'Romanian',
      en: 'English',
    },
    home: {
      eyebrow: 'Slanic Prahova',
      subtitle: 'Accommodation • Bowen Therapy • Massage • Relaxation in Slanic Prahova',
      primaryButton: 'View the guesthouse',
      secondaryButton: 'Book a visit',
      soundOn: '🔊 Sound On',
      soundOff: '🔇 Sound Off',
      actionsAria: 'Primary actions',
      noteAria: 'Guesthouse atmosphere',
      noteLabel: 'Mountain Spa Lodge',
      noteTitle: 'Quiet rooms, warm wood, therapies and slow evenings.',
      noteText: 'A boutique retreat for rest and wellness close to nature.',
      cards: [
        {
          title: 'Boutique lodging',
          text: 'Warm rooms, a natural atmosphere and premium rustic details.',
        },
        {
          title: 'Bowen Therapy',
          text: 'Gentle sessions for deep relaxation and body balance.',
        },
        {
          title: 'Massage & relaxation',
          text: 'Calm rituals for releasing tension and restoring wellbeing.',
        },
      ],
    },
    pension: {
      eyebrow: 'Elegant rustic accommodation',
      title: 'Pensiunea Criss',
      text: 'A welcoming guesthouse with natural materials and an atmosphere made for quiet weekends, wellness treatments and unhurried time.',
      cards: [
        {
          title: 'About the guesthouse',
          text: 'A warm refuge in Slanic Prahova, designed for rest, quiet and peaceful evenings close to nature.',
        },
        {
          title: 'Prices',
          text: 'Flexible rates for accommodation, relaxing stays and packages combined with wellness services.',
        },
        {
          title: 'Bookings',
          text: 'Reservations can be made by phone or form, with personal recommendations for every guest.',
        },
        {
          title: 'Services',
          text: 'Welcoming rooms, relaxation spaces, terrace, breakfast on request and guidance for local attractions.',
        },
      ],
      featureLabel: 'Slanic Prahova',
      featureTitle: 'An intimate retreat for slow weekends',
      featureText: 'Natural textures, warm light and wellness services in a premium mountain lodge atmosphere.',
      metrics: ['Wellness', 'Lodging', 'Relaxation'],
      announcement: {
        lead: 'We are putting the final touches in place to create an unforgettable experience.',
        opening: 'Official opening coming soon.',
        welcome: 'We look forward to welcoming you.',
      },
    },
    therapy: {
      eyebrow: 'Wellness & gentle recovery',
      title: 'Bowen Therapy & Massage',
      text: 'Professional Bowen Therapy and massage services, clearly presented to help you choose the right session for your needs.',
      bowen: {
        title: 'Bowen Therapy',
        subtitle: 'Gentle and personalized sessions for adults and children.',
        note: 'Session duration and treatment plan are established according to each person’s needs.',
      },
      massage: {
        title: 'Massage Services',
        subtitle: 'Professional massage and relaxation services offered in a calm and comfortable environment.',
        labels: {
          duration: 'Duration',
          sessionPrice: 'Single session',
          package: 'Package',
          packagePrice: 'Package price',
        },
      },
      pricesLoading: 'Loading prices…',
      pricesUnavailable: 'Prices are currently being updated. Please contact us for details.',
      cta: {
        title: 'Book a session',
        text: 'For information and appointments, contact us by phone or through the contact form.',
        call: 'Call now',
        contact: 'Contact us',
      },
      certificates: {
        intro: 'Cristina Pascu holds professional training and certifications in Bowen Therapy and massage services. The documents are displayed for informational purposes and protected by a visual watermark.',
        bowenTitle: 'Bowen Therapy Diplomas and Certificates',
        massageTitle: 'Massage Diplomas and Certificates',
        genericTitle: 'Professional diploma and certificate',
        captions: {
          babies: 'Bowen for Babies Certificate',
          diabetes: 'Bowen for Diabetes Specialization',
          sports: 'Bowen Sports Injuries Specialization',
          technique: 'Bowen Technique Certificate',
          masseur: 'Professional Qualification – Masseur',
          rejuvance: 'Rejuvance Certificate',
        },
        empty: 'Diplomas and certificates will be published soon.',
        loading: 'Loading document…',
        preview: 'Diploma preview',
        close: 'Close preview',
        previous: 'Previous document',
        next: 'Next document',
      },
      pricingAria: 'Bowen Therapy pricing',
      massageAria: 'Massage services and pricing',
    },
    reviews: {
      eyebrow: 'Wellness experiences',
      title: 'Reviews',
      text: 'Experiences with Bowen Therapy and massage services offered at Pensiunea Criss.',
      ratingAria: 'Rating 5 out of 5',
      all: 'All',
      services: { bowen: 'Bowen Therapy', facial_massage: 'Facial Massage', relaxation_massage: 'Relaxation Massage', therapeutic_massage: 'Therapeutic Massage', reflexology: 'Reflexology' },
      formTitle: 'Leave a review',
      moderationNotice: 'Reviews are checked before publication.',
      fields: { name: 'Name', service: 'Service', rating: 'Rating', review: 'Review', date: 'Visit date, optional', consent: 'I agree that my review may be published after moderation.', submit: 'Submit review', namePlaceholder: 'Your name', reviewPlaceholder: 'Tell us about your experience' },
      success: 'Thank you! Your review has been submitted and will appear after approval.',
      invalid: 'Please check every field and try again.',
      submitError: 'Your review could not be submitted. Please try again later.',
      loading: 'Loading reviews…',
      loadError: 'Reviews cannot be loaded right now.',
      empty: 'There are no approved reviews for this service yet.',
      visitDate: 'Visit',
      starsLabel: 'stars',
      carouselLabel: 'Approved reviews carousel',
      previousReview: 'Previous review',
      nextReview: 'Next review',
      readMore: 'Read more',
      closeReview: 'Close review',
    },
    contact: {
      eyebrow: 'Reservations and appointments',
      title: 'Contact',
      text: 'Write to us for accommodation, massage or Bowen Therapy. We will reply with availability and a recommendation suited to your visit.',
      cards: {
        lodgingEmail: 'Lodging email',
        massageEmail: 'Massage email',
        bowenEmail: 'Bowen email',
        phone: 'Phone',
        company: 'Company',
        therapist: {
          name: 'Cristina Pascu',
          subtitle: 'Bowen Therapist and Relaxation Massage Specialist',
          text: 'Appointments for Bowen Therapy, relaxation massage and wellness services.',
        },
      },
      directions: {
        title: 'How to reach us',
        address: ['Pensiunea Criss', '6A Ghioceilor Street', 'Slănic, Prahova, Romania'],
        details: [
          'Close to the main attractions in Slănic Prahova',
          'Guest parking available',
          'Easy access by car',
          'Direct navigation through Google Maps',
        ],
        openMap: 'Open map',
        startNavigation: 'Start navigation',
      },
      form: {
        name: 'Name',
        namePlaceholder: 'Your name',
        contact: 'Email or phone',
        contactPlaceholder: 'How we can contact you',
        interest: 'Interest',
        message: 'Message',
        messagePlaceholder: 'Preferred period, number of guests or appointment type',
        submit: 'Send request',
        options: {
          lodging: 'Accommodation',
          massage: 'Massage',
          bowen: 'Bowen Therapy',
          package: 'Lodging + wellness package',
        },
      },
    },
    footer: {
      location: 'Pensiunea Criss • Slanic Prahova',
      company: 'CRISSBT SRL • 0743486611',
    },
    quickContact: {
      whatsappLabel: 'Message us on WhatsApp',
      whatsappMessage:
        'Hello! I would like more information about Pensiunea Criss and the available services.',
      callLabel: 'Call now',
    },
  },
}

function getStoredLanguage() {
  const queryLanguage = new URLSearchParams(window.location.search).get('lang')
  if (queryLanguage === 'en' || queryLanguage === 'ro') return queryLanguage
  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)

  return storedLanguage === 'en' || storedLanguage === 'ro' ? storedLanguage : 'ro'
}

function getStoredSoundPreference() {
  return window.localStorage.getItem(SOUND_STORAGE_KEY) !== 'off'
}

function Navbar({ currentLanguage, onLanguageChange, t }) {
  return (
    <header className="navbar">
      <Link className="brand" to="/" aria-label={t.brandAria}>
        <span className="brand-mark">PC</span>
        <span>Pensiunea Criss</span>
      </Link>
      <nav aria-label={t.navAria}>
        {t.nav.map((item) => (
          <NavLink
            className={({ isActive }) => (isActive ? 'active' : undefined)}
            end={item.to === '/'}
            key={item.to}
            to={item.to}
          >
            {item.label}
          </NavLink>
        ))}
        <div className="language-switcher" aria-label={t.language.aria}>
          <button
            aria-label={t.language.ro}
            aria-pressed={currentLanguage === 'ro'}
            className="language-button language-button-ro"
            type="button"
            onClick={() => onLanguageChange('ro')}
          >
            <span>RO</span>
          </button>
          <button
            aria-label={t.language.en}
            aria-pressed={currentLanguage === 'en'}
            className="language-button language-button-gb"
            type="button"
            onClick={() => onLanguageChange('en')}
          >
            <span>GB</span>
          </button>
        </div>
      </nav>
    </header>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 })
  }, [pathname])

  return null
}

function AdminRedirect() {
  const { search, hash } = useLocation()

  return <Navigate replace to={`/admin/reviews${search}${hash}`} />
}

function SectionHeader({ eyebrow, title, text }) {
  return (
    <div className="section-header">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  )
}

function HomePage({ t }) {
  const audioRef = useRef(null)
  const [soundOn, setSoundOn] = useState(getStoredSoundPreference)
  const initialSoundOnRef = useRef(soundOn)
  const [playbackBlocked, setPlaybackBlocked] = useState(false)

  const startMusic = useCallback(async () => {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    audio.loop = true
    audio.volume = DEFAULT_AUDIO_VOLUME

    try {
      await audio.play()
      setSoundOn(true)
      setPlaybackBlocked(false)
      window.localStorage.setItem(SOUND_STORAGE_KEY, 'on')
    } catch {
      setSoundOn(true)
      setPlaybackBlocked(true)
      window.localStorage.setItem(SOUND_STORAGE_KEY, 'on')
    }
  }, [])

  const stopMusic = useCallback((persistPreference = true) => {
    const audio = audioRef.current

    if (audio) {
      audio.pause()
      audio.currentTime = 0
      audio.volume = DEFAULT_AUDIO_VOLUME
    }

    setPlaybackBlocked(false)

    if (persistPreference) {
      setSoundOn(false)
      window.localStorage.setItem(SOUND_STORAGE_KEY, 'off')
    }
  }, [])

  const handleSoundToggle = () => {
    if (soundOn && !playbackBlocked) {
      stopMusic()
      return
    }

    startMusic()
  }

  useEffect(() => {
    const audio = audioRef.current

    if (audio) {
      audio.loop = true
      audio.volume = DEFAULT_AUDIO_VOLUME
    }

    if (initialSoundOnRef.current) {
      startMusic()
    }

    return () => {
      stopMusic(false)
    }
  }, [startMusic, stopMusic])

  useEffect(() => {
    if (!soundOn || !playbackBlocked) {
      return undefined
    }

    const resumeAfterInteraction = () => {
      startMusic()
    }

    window.addEventListener('pointerdown', resumeAfterInteraction, { once: true })
    window.addEventListener('keydown', resumeAfterInteraction, { once: true })

    return () => {
      window.removeEventListener('pointerdown', resumeAfterInteraction)
      window.removeEventListener('keydown', resumeAfterInteraction)
    }
  }, [playbackBlocked, soundOn, startMusic])

  return (
    <main className="page page-home">
      <video className="background-video" autoPlay muted loop playsInline>
        <source src="/video/rustic_lounge.mp4" type="video/mp4" />
      </video>
      <div className="page-overlay" aria-hidden="true"></div>

      <section className="hero-section page-content">
        <div className="hero-layout">
          <div className="hero-content">
            <p className="eyebrow">{t.home.eyebrow}</p>
            <h1>
              Pensiunea<wbr /> Criss
            </h1>
            <p className="hero-subtitle">{t.home.subtitle}</p>
            <div className="hero-actions" aria-label={t.home.actionsAria}>
              <Link className="button primary" to="/pensiunea">
                {t.home.primaryButton}
              </Link>
              <Link className="button secondary" to="/contact">
                {t.home.secondaryButton}
              </Link>
            </div>
            <button
              className="sound-toggle"
              type="button"
              onClick={handleSoundToggle}
              aria-pressed={soundOn && !playbackBlocked}
            >
              {soundOn && !playbackBlocked ? t.home.soundOff : t.home.soundOn}
            </button>
          </div>

          <aside className="lodge-note" aria-label={t.home.noteAria}>
            <span>{t.home.noteLabel}</span>
            <strong>{t.home.noteTitle}</strong>
            <p>{t.home.noteText}</p>
          </aside>

          <div className="home-card-row">
            {t.home.cards.map((card) => (
              <article className="glass-card" key={card.title}>
                <h2>{card.title}</h2>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <audio ref={audioRef} loop preload="none">
        <source src="/video/magnific-terracota-air.mp3" type="audio/mpeg" />
      </audio>
    </main>
  )
}

function PensionPage({ t }) {
  return (
    <main className="page page-pension">
      <div className="page-overlay" aria-hidden="true"></div>
      <section className="content-section page-content">
        <div className="section-shell lodge-layout">
          <div>
            <SectionHeader
              eyebrow={t.pension.eyebrow}
              title={t.pension.title}
              text={t.pension.text}
            />

            <div className="card-grid">
              {t.pension.cards.map((card) => (
                <article className="glass-card" key={card.title}>
                  <h2>{card.title}</h2>
                  <p>{card.text}</p>
                </article>
              ))}
            </div>
          </div>

          <aside className="feature-panel">
            <span>{t.pension.featureLabel}</span>
            <h2>{t.pension.featureTitle}</h2>
            <p>{t.pension.featureText}</p>
            <div className="feature-metrics">
              {t.pension.metrics.map((metric) => (
                <strong key={metric}>{metric}</strong>
              ))}
            </div>
          </aside>

          <aside className="coming-soon-banner" aria-live="polite">
            <span className="coming-soon-icon" aria-hidden="true">✨</span>
            <p className="coming-soon-lead">{t.pension.announcement.lead}</p>
            <p>{t.pension.announcement.opening}</p>
            <strong>{t.pension.announcement.welcome}</strong>
          </aside>
        </div>
      </section>
    </main>
  )
}

const diplomaCollections = {
  bowen: [
    { image: '/Diplome si Atestate/Bowen/Bowen for Babies.jpeg', thumbnail: '/Diplome si Atestate/Thumbnails/Bowen/Bowen for Babies.jpeg', caption: 'babies', width: 1363, height: 1937 },
    { image: '/Diplome si Atestate/Bowen/Bowen for Diabetes.jpeg', thumbnail: '/Diplome si Atestate/Thumbnails/Bowen/Bowen for Diabetes.jpeg', caption: 'diabetes', width: 1372, height: 1921 },
    { image: '/Diplome si Atestate/Bowen/Bowen for Sportive Injuries.jpeg', thumbnail: '/Diplome si Atestate/Thumbnails/Bowen/Bowen for Sportive Injuries.jpeg', caption: 'sports', width: 1353, height: 1915 },
    { image: '/Diplome si Atestate/Bowen/Bowen Technique.jpeg', thumbnail: '/Diplome si Atestate/Thumbnails/Bowen/Bowen Technique.jpeg', caption: 'technique', width: 1473, height: 1958 },
  ],
  massage: [
    { image: '/Diplome si Atestate/Masaj/Maseur.jpeg', thumbnail: '/Diplome si Atestate/Thumbnails/Masaj/Maseur.jpeg', caption: 'masseur', width: 2036, height: 2048 },
    { image: '/Diplome si Atestate/Masaj/Rejuvance.jpeg', thumbnail: '/Diplome si Atestate/Thumbnails/Masaj/Rejuvance.jpeg', caption: 'rejuvance', width: 1249, height: 1826 },
  ],
}

function DiplomaVisual({ document, alt, loadingLabel, enlarged = false }) {
  const [loaded, setLoaded] = useState(false)
  const preventImageAction = (event) => event.preventDefault()

  return (
    <div className="certificate-visual" style={{ aspectRatio: enlarged ? 'auto' : undefined }}>
      {!loaded && <span className="certificate-image-loading">{loadingLabel}</span>}
      <img
        src={enlarged ? document.image : document.thumbnail}
        alt={alt}
        width={document.width}
        height={document.height}
        loading={enlarged ? 'eager' : 'lazy'}
        decoding="async"
        draggable="false"
        onLoad={() => setLoaded(true)}
        onContextMenu={preventImageAction}
        onDragStart={preventImageAction}
      />
      <div className="certificate-watermark" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => (
          <span key={index}>
            <b>CRISSBT SRL</b>
            <small>Pensiunea Criss • Cristina Pascu</small>
          </span>
        ))}
      </div>
      <span className="certificate-footer-watermark" aria-hidden="true">© CRISSBT SRL</span>
    </div>
  )
}

function DiplomaGallery({ documents, title, t, onPreview }) {
  return (
    <section className="certificate-section">
      <header><h2>{title}</h2></header>
      {documents.length === 0 ? (
        <p className="certificate-empty">{t.empty}</p>
      ) : (
        <div className="certificate-grid">
          {documents.map((document, index) => (
            <button className="certificate-card" type="button" key={document.image} onClick={(event) => onPreview(index, event.currentTarget)} aria-label={`${t.preview}: ${document.title}`}>
              <DiplomaVisual document={document} alt={document.title} loadingLabel={t.loading} />
              <span className="certificate-details">
                <strong>{document.title}</strong>
                {document.institution && <span>{document.institution}</span>}
                {document.year && <time>{document.year}</time>}
                {document.description && <small>{document.description}</small>}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

function TherapyPage({ t, language }) {
  const [preview, setPreview] = useState(null)
  const [servicePrices, setServicePrices] = useState(null)
  const [priceError, setPriceError] = useState(false)
  const lightboxRef = useRef(null)
  const lightboxCloseRef = useRef(null)
  const previewTriggerRef = useRef(null)
  const certificateT = t.therapy.certificates
  const collections = useMemo(() => ({
    bowen: diplomaCollections.bowen.map((document) => ({ ...document, title: certificateT.captions[document.caption] })),
    massage: diplomaCollections.massage.map((document) => ({ ...document, title: certificateT.captions[document.caption] })),
  }), [certificateT])
  const activeDocuments = preview ? collections[preview.collection] : []
  const activeDocument = preview ? activeDocuments[preview.index] : null
  const bowenPrices = servicePrices?.filter((price) => price.service_group === 'bowen') || []
  const massagePrices = servicePrices?.filter((price) => price.service_group === 'massage') || []

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/prices', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('prices')
        return response.json()
      })
      .then((data) => {
        if (!Array.isArray(data.prices) || data.prices.length === 0) throw new Error('empty prices')
        setServicePrices(data.prices)
      })
      .catch((error) => { if (error.name !== 'AbortError') setPriceError(true) })
    return () => controller.abort()
  }, [])

  const movePreview = useCallback((direction) => {
    setPreview((current) => {
      if (!current) return null
      const length = collections[current.collection].length
      return { ...current, index: (current.index + direction + length) % length }
    })
  }, [collections])

  const openPreview = useCallback((collection, index, trigger) => {
    previewTriggerRef.current = trigger
    setPreview({ collection, index })
  }, [])

  const closePreview = useCallback(() => {
    setPreview(null)
    window.setTimeout(() => previewTriggerRef.current?.focus(), 0)
  }, [])

  useEffect(() => {
    if (!preview) return undefined
    lightboxCloseRef.current?.focus()
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closePreview()
      if (event.key === 'ArrowLeft') movePreview(-1)
      if (event.key === 'ArrowRight') movePreview(1)
      if (event.key === 'Tab') {
        const focusable = [...lightboxRef.current.querySelectorAll('button:not([disabled])')]
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [preview, movePreview, closePreview])

  return (
    <main className="page page-therapy">
      <div className="page-overlay" aria-hidden="true"></div>
      <section className="content-section page-content therapy-page-content">
        <div className="section-shell therapy-pricing-shell">
          <SectionHeader
            eyebrow={t.therapy.eyebrow}
            title={t.therapy.title}
            text={t.therapy.text}
          />

          <section className="pricing-group bowen-pricing" aria-label={t.therapy.pricingAria}>
            <header className="pricing-heading">
              <h2>{t.therapy.bowen.title}</h2>
              <p>{t.therapy.bowen.subtitle}</p>
            </header>
            {priceError ? <p className="pricing-api-state error" role="status">{t.therapy.pricesUnavailable}</p> : servicePrices === null ? <PriceSkeleton label={t.therapy.pricesLoading} count={2} /> : <div className="bowen-price-grid">
              {bowenPrices.map((option) => <article className="pricing-card bowen-price-card" key={option.id}><h3>{language === 'ro' ? option.title_ro : option.title_en}</h3><span className="session-count">{language === 'ro' ? '1 ședință' : '1 session'}</span><strong className="primary-price">{option.session_price_ron} RON</strong></article>)}
            </div>}
            <p className="pricing-note">{t.therapy.bowen.note}</p>
          </section>

          <section className="pricing-group massage-pricing" aria-label={t.therapy.massageAria}>
            <header className="pricing-heading">
              <h2>{t.therapy.massage.title}</h2>
              <p>{t.therapy.massage.subtitle}</p>
            </header>
            {priceError ? <p className="pricing-api-state error" role="status">{t.therapy.pricesUnavailable}</p> : servicePrices === null ? <PriceSkeleton label={t.therapy.pricesLoading} count={5} /> : <div className="massage-price-grid">
              {massagePrices.map((service) => (
                <article className="pricing-card massage-price-card" key={service.id}>
                  <h3>{language === 'ro' ? service.title_ro : service.title_en}</h3>
                  <dl>
                    {service.duration_minutes && <div>
                      <dt><span aria-hidden="true">◷</span>{t.therapy.massage.labels.duration}</dt>
                      <dd>{service.duration_minutes} {language === 'ro' ? 'minute' : 'minutes'}</dd>
                    </div>}
                    <div className="single-price-row">
                      <dt><span aria-hidden="true">◆</span>{t.therapy.massage.labels.sessionPrice}</dt>
                      <dd>{service.session_price_ron} RON</dd>
                    </div>
                    {service.package_sessions && <div>
                      <dt><span aria-hidden="true">◇</span>{t.therapy.massage.labels.package}</dt>
                      <dd>{service.package_sessions} {language === 'ro' ? 'ședințe' : 'sessions'}</dd>
                    </div>}
                    {service.package_price_ron && <div className="package-price-row">
                      <dt>{t.therapy.massage.labels.packagePrice}</dt>
                      <dd>{service.package_price_ron} RON</dd>
                    </div>}
                  </dl>
                </article>
              ))}
            </div>}
          </section>

          <section className="appointment-cta">
            <div>
              <h2>{t.therapy.cta.title}</h2>
              <p>{t.therapy.cta.text}</p>
            </div>
            <div className="appointment-actions">
              <a className="button primary" href="tel:+40743486611">
                {t.therapy.cta.call}
              </a>
              <Link className="button secondary" to="/contact">
                {t.therapy.cta.contact}
              </Link>
            </div>
          </section>

          <div className="certificate-showcase">
            <p className="certificate-intro">{certificateT.intro}</p>
            <DiplomaGallery documents={collections.bowen} title={certificateT.bowenTitle} t={certificateT} onPreview={(index, trigger) => openPreview('bowen', index, trigger)} />
            <DiplomaGallery documents={collections.massage} title={certificateT.massageTitle} t={certificateT} onPreview={(index, trigger) => openPreview('massage', index, trigger)} />
          </div>
        </div>
      </section>
      {activeDocument && (
        <div ref={lightboxRef} className="certificate-lightbox" role="dialog" aria-modal="true" aria-label={`${certificateT.preview}: ${activeDocument.title}`} onMouseDown={(event) => { if (event.target === event.currentTarget) closePreview() }}>
          <button ref={lightboxCloseRef} className="lightbox-close" type="button" aria-label={certificateT.close} onClick={closePreview}>×</button>
          {activeDocuments.length > 1 && <button className="lightbox-nav lightbox-previous" type="button" aria-label={certificateT.previous} onClick={() => movePreview(-1)}>‹</button>}
          <div className="lightbox-document">
            <DiplomaVisual key={activeDocument.image} document={activeDocument} alt={activeDocument.title} loadingLabel={certificateT.loading} enlarged />
            <strong>{activeDocument.title}</strong>
          </div>
          {activeDocuments.length > 1 && <button className="lightbox-nav lightbox-next" type="button" aria-label={certificateT.next} onClick={() => movePreview(1)}>›</button>}
        </div>
      )}
    </main>
  )
}

function PriceSkeleton({ label, count }) {
  return <div className="pricing-skeleton" role="status" aria-label={label}>{Array.from({ length: count }, (_, index) => <span className="pricing-skeleton-card" aria-hidden="true" key={index}></span>)}</div>
}

const sampleReviews = [
  { id: 'sample-1', reviewer_name: 'Andreea M.', service_type: 'bowen', rating: 5, review_text: 'Ședința de Terapia Bowen s-a desfășurat într-o atmosferă calmă, iar explicațiile au fost clare și profesioniste.', visit_date: null, language: 'ro', isSample: true },
  { id: 'sample-2', reviewer_name: 'Elena R.', service_type: 'relaxation_massage', rating: 5, review_text: 'Masajul de relaxare a fost plăcut și atent realizat. Atmosfera m-a ajutat să mă deconectez complet.', visit_date: null, language: 'ro', isSample: true },
  { id: 'sample-3', reviewer_name: 'Mihai P.', service_type: 'reflexology', rating: 5, review_text: 'Am apreciat atenția acordată și modul profesionist în care a fost realizată ședința de reflexoterapie.', visit_date: null, language: 'ro', isSample: true },
]

function ReviewsPage({ t, language }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [filter, setFilter] = useState('all')
  const [rating, setRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [formMessage, setFormMessage] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/reviews', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('reviews')
        return response.json()
      })
      .then((data) => setReviews(Array.isArray(data.reviews) ? data.reviews : []))
      .catch((error) => {
        if (error.name !== 'AbortError') setLoadError(true)
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  const visibleSource = reviewDisplaySource({ loading, failed: loadError, reviews, samples: sampleReviews })
  const visibleReviews = filter === 'all'
    ? visibleSource
    : visibleSource.filter((review) => review.service_type === filter)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const payload = {
      name: String(data.get('name') || '').trim(), service: data.get('service'), rating,
      review: String(data.get('review') || '').trim(), visitDate: data.get('visitDate') || null,
      consent: data.get('consent') === 'on', website: data.get('website'), language,
    }
    if (payload.name.length < 2 || payload.name.length > 80 || payload.review.length < 20 || payload.review.length > 1000 || rating < 1 || !payload.service || !payload.consent) {
      setFormMessage({ type: 'error', text: t.reviews.invalid })
      return
    }
    setSubmitting(true)
    setFormMessage(null)
    try {
      const response = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!response.ok) throw new Error('submit')
      form.reset()
      setRating(0)
      setFormMessage({ type: 'success', text: t.reviews.success })
    } catch {
      setFormMessage({ type: 'error', text: t.reviews.submitError })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="page page-reviews">
      <div className="page-overlay" aria-hidden="true"></div>
      <section className="content-section page-content reviews-page-content">
        <div className="section-shell reviews-shell">
          <SectionHeader
            eyebrow={t.reviews.eyebrow}
            title={t.reviews.title}
            text={t.reviews.text}
          />

          <div className="review-filters" aria-label={t.reviews.fields.service}>
            {['all', ...Object.keys(t.reviews.services)].map((service) => (
              <button type="button" className={filter === service ? 'active' : ''} aria-pressed={filter === service} key={service} onClick={() => setFilter(service)}>
                {service === 'all' ? t.reviews.all : t.reviews.services[service]}
              </button>
            ))}
          </div>

          <div className="reviews-public-content">
            {loading && <p className="reviews-state">{t.reviews.loading}</p>}
            {!loading && loadError && <p className="reviews-state error">{t.reviews.loadError}</p>}
            {!loading && visibleReviews.length === 0 && <p className="reviews-state">{t.reviews.empty}</p>}
            {!loading && visibleReviews.length > 0 && <ReviewCarousel key={filter} reviews={visibleReviews} t={t.reviews} language={language} />}
          </div>

          <form className="review-form" onSubmit={handleSubmit}>
            <header><h2>{t.reviews.formTitle}</h2><p>{t.reviews.moderationNotice}</p></header>
            <div className="review-form-grid">
              <label>{t.reviews.fields.name}<input name="name" minLength="2" maxLength="80" required placeholder={t.reviews.fields.namePlaceholder} /></label>
              <label>{t.reviews.fields.service}<select name="service" defaultValue="" required><option value="" disabled>—</option>{Object.entries(t.reviews.services).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
              <fieldset className="star-selector"><legend>{t.reviews.fields.rating}</legend><div>{[1, 2, 3, 4, 5].map((star) => <button type="button" key={star} aria-label={`${star} ${t.reviews.starsLabel}`} aria-pressed={rating === star} onClick={() => setRating(star)}>★</button>)}</div></fieldset>
              <label>{t.reviews.fields.date}<input type="date" name="visitDate" max={new Date().toISOString().slice(0, 10)} /></label>
              <label className="review-text-field">{t.reviews.fields.review}<textarea name="review" minLength="20" maxLength="1000" rows="5" required placeholder={t.reviews.fields.reviewPlaceholder}></textarea></label>
              <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex="-1" autoComplete="off" /></label>
              <label className="consent-field"><input type="checkbox" name="consent" required /> <span>{t.reviews.fields.consent}</span></label>
            </div>
            {formMessage && <p className={`form-status ${formMessage.type}`} role="status">{formMessage.text}</p>}
            <button className="button primary form-button" type="submit" disabled={submitting}>{t.reviews.fields.submit}</button>
          </form>
        </div>
      </section>
    </main>
  )
}

function AdminReviewsPage({ t, language }) {
  const labels = adminLabels[language]
  const [authenticated, setAuthenticated] = useState(() => new URLSearchParams(window.location.search).get('auth') === 'unauthorized' ? 'unauthorized' : null)
  const [adminUser, setAdminUser] = useState(null)
  const [reviews, setReviews] = useState([])
  const [status, setStatus] = useState('pending')
  const [service, setService] = useState('all')
  const [error, setError] = useState('')
  const [activeAction, setActiveAction] = useState(null)
  const [logoutBusy, setLogoutBusy] = useState(false)
  const [toast, setToast] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const loadAdminReviews = useCallback(async () => {
    const response = await fetch('/api/admin/reviews')
    if (response.status === 401) { setAuthenticated(false); return }
    if (!response.ok) throw new Error('load')
    const data = await response.json()
    setReviews(data.reviews || [])
    setAuthenticated(true)
  }, [])

  useEffect(() => {
    if (authenticated === 'unauthorized') return
    fetch('/api/admin/session')
      .then((response) => response.json())
      .then(async (session) => {
        if (session.authenticated && !session.authorized) { setAuthenticated('unauthorized'); return }
        if (!session.authorized) { setAuthenticated(false); return }
        setAdminUser(session.user || null)
        const response = await fetch('/api/admin/reviews')
        if (!response.ok) throw new Error('load')
        const data = await response.json()
        setReviews(data.reviews || [])
        setAuthenticated(true)
      })
      .catch(() => { setError('Unable to load reviews.'); setAuthenticated(false) })
  }, [authenticated])

  const closeDeleteModal = useCallback(() => {
    const trigger = deleteTarget?.trigger
    setDeleteTarget(null)
    window.setTimeout(() => trigger?.focus(), 0)
  }, [deleteTarget])

  const mutate = async (id, action, moderationNote = '', confirmed = false) => {
    if (!canStartModerationAction(activeAction)) return
    const method = action === 'delete' ? deletionMethod(confirmed) : 'PATCH'
    if (!method) return
    setActiveAction({ id, action })
    setError('')
    try {
      const response = await fetch(`/api/admin/review?id=${encodeURIComponent(id)}`, { method, headers: { 'Content-Type': 'application/json' }, body: action === 'delete' ? undefined : JSON.stringify({ action, moderationNote }) })
      if (!response.ok) throw new Error('update')
      await loadAdminReviews()
      setToast({ type: 'success', text: labels.success[action] })
      if (action === 'delete') closeDeleteModal()
    } catch {
      setToast({ type: 'error', text: labels.actionError })
    } finally {
      setActiveAction(null)
    }
  }

  const logout = async () => {
    if (logoutBusy) return
    setLogoutBusy(true)
    try {
      const response = await fetch('/api/admin/logout', { method: 'POST' })
      if (!response.ok) throw new Error('logout')
      window.history.replaceState({}, '', '/admin/reviews')
      setAdminUser(null)
      setAuthenticated(false)
    } catch {
      setToast({ type: 'error', text: labels.actionError })
    } finally {
      setLogoutBusy(false)
    }
  }

  if (authenticated !== true) return (
    <main className="page page-reviews"><div className="page-overlay" aria-hidden="true"></div><section className="content-section page-content admin-login-shell"><div className="review-form admin-login"><h1>{authenticated === 'unauthorized' ? labels.unauthorized : labels.title}</h1>{authenticated === 'unauthorized' ? <><p>{labels.unauthorizedText}</p><button className="button secondary" type="button" disabled={logoutBusy} onClick={logout}>{logoutBusy ? labels.loading : labels.logout}</button></> : <a className="button primary" href="/api/admin/oauth/start">{labels.google}</a>}{error && <p className="form-status error" role="alert">{error}</p>}</div></section>{toast && <AdminToast toast={toast} />}</main>
  )

  const visible = reviews.filter((review) => review.status === status && (service === 'all' || review.service_type === service))
  return (
    <main className="page page-reviews"><div className="page-overlay" aria-hidden="true"></div><section className="content-section page-content admin-page-content"><div className="section-shell admin-reviews-shell">
      <header className="admin-heading"><h1>{labels.title}</h1><div className="admin-account-area">{adminUser?.avatarUrl && <img className="admin-avatar" src={adminUser.avatarUrl} alt="" referrerPolicy="no-referrer" />}<div className="admin-identity"><strong>{adminUser?.name}</strong><span>{adminUser?.email}</span><small>{labels.signedIn}</small></div><button className="button secondary" type="button" disabled={logoutBusy} onClick={logout}>{logoutBusy ? labels.loading : labels.logout}</button></div></header>
      <nav className="admin-section-nav" aria-label={labels.title}><Link className="active" to="/admin/reviews" aria-current="page">{language === 'ro' ? 'Recenzii' : 'Reviews'}</Link><Link to="/admin/prices">{language === 'ro' ? 'Prețuri și abonamente' : 'Prices and packages'}</Link></nav>
      <div className="admin-toolbar"><div className="review-filters">{[['pending', labels.pending], ['approved', labels.approved], ['rejected', labels.rejected]].map(([value, label]) => <button type="button" className={status === value ? 'active' : ''} onClick={() => setStatus(value)} key={value}>{label}</button>)}</div><select value={service} onChange={(event) => setService(event.target.value)}><option value="all">{labels.all}</option>{Object.entries(t.reviews.services).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div>
      {error && <p className="form-status error" role="alert">{error}</p>}
      <div className="admin-review-list">{visible.length === 0 && <p className="reviews-state">{labels.empty}</p>}{visible.map((review) => <AdminReviewCard key={review.id} review={review} labels={labels} language={language} serviceLabel={t.reviews.services[review.service_type]} activeAction={activeAction} onMutate={mutate} onRequestDelete={(trigger) => setDeleteTarget({ review, trigger })} />)}</div>
    </div></section>{toast && <AdminToast toast={toast} />}{deleteTarget && <DeleteReviewModal labels={labels} busy={activeAction?.action === 'delete'} onCancel={closeDeleteModal} onConfirm={() => mutate(deleteTarget.review.id, 'delete', '', true)} />}</main>
  )
}

function AdminToast({ toast }) {
  return <div className={`admin-toast ${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'} aria-live="polite">{toast.text}</div>
}

function DeleteReviewModal({ labels, busy, onCancel, onConfirm }) {
  const dialogRef = useRef(null)
  const cancelRef = useRef(null)
  useEffect(() => {
    cancelRef.current?.focus()
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) { event.preventDefault(); onCancel(); return }
      if (event.key !== 'Tab') return
      const buttons = [...dialogRef.current.querySelectorAll('button:not([disabled])')]
      if (!buttons.length) return
      const first = buttons[0]
      const last = buttons[buttons.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [busy, onCancel])
  return <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel() }}><div className="admin-delete-modal glass-card" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="delete-review-title" aria-describedby="delete-review-description"><h2 id="delete-review-title">{labels.deleteTitle}</h2><p id="delete-review-description">{labels.deleteText}</p><div className="admin-modal-actions"><button ref={cancelRef} className="button secondary" type="button" disabled={busy} onClick={onCancel}>{labels.cancel}</button><button className="admin-delete-confirm" type="button" disabled={busy} onClick={onConfirm}>{busy ? labels.loading : labels.deleteConfirm}</button></div></div></div>
}

function AdminReviewCard({ review, labels, language, serviceLabel, activeAction, onMutate, onRequestDelete }) {
  const [note, setNote] = useState(review.moderation_note || '')
  const busy = activeAction !== null
  const ownAction = activeAction?.id === review.id ? activeAction.action : null
  return <article className="glass-card admin-review-card"><header><div className="stars">{'★'.repeat(review.rating)}<span>{'★'.repeat(5 - review.rating)}</span></div><strong>{serviceLabel}</strong></header><h2>{review.reviewer_name}</h2><p>{review.review_text}</p><dl><div><dt>Submitted</dt><dd>{new Date(review.submitted_at).toLocaleString(language === 'ro' ? 'ro-RO' : 'en-GB')}</dd></div>{review.visit_date && <div><dt>Visit</dt><dd>{review.visit_date}</dd></div>}{review.approved_at && <div><dt>{labels.approvedAt}</dt><dd>{localizedModerationTimestamp(review.approved_at, language)}</dd></div>}{review.rejected_at && <div><dt>{labels.rejectedAt}</dt><dd>{localizedModerationTimestamp(review.rejected_at, language)}</dd></div>}</dl><label>{labels.note}<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength="1000" /><small>{labels.noteHelper}</small></label><footer><button className="button primary" type="button" disabled={busy} onClick={() => onMutate(review.id, 'approve', note)}>{ownAction === 'approve' ? labels.loading : labels.approve}</button><button className="button secondary" type="button" disabled={busy} onClick={() => onMutate(review.id, 'reject', note)}>{ownAction === 'reject' ? labels.loading : labels.reject}</button><button className="admin-delete" type="button" disabled={busy} aria-label={`${labels.delete}: ${review.reviewer_name}`} onClick={(event) => onRequestDelete(event.currentTarget)}>{labels.delete}</button></footer></article>
}

function ContactPage({ t }) {
  const mapUrl =
    'https://www.google.com/maps?q=Strada%20Ghioceilor%20nr.%206A%2C%20Slanic%2C%20Prahova%2C%20Romania'
  const directionsUrl =
    'https://www.google.com/maps/dir/?api=1&destination=Strada%20Ghioceilor%20nr.%206A%2C%20Slanic%2C%20Prahova%2C%20Romania'

  const handleContactSubmit = (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const interest = form.elements.interest
    const service = interest.selectedOptions[0]?.textContent || data.get('interest')
    window.location.href = contactMailto({
      name: data.get('name'),
      contact: data.get('contact'),
      service,
      message: data.get('message'),
      labels: {
        name: t.contact.form.name,
        contact: t.contact.form.contact,
        service: t.contact.form.interest,
        message: t.contact.form.message,
      },
    })
  }

  return (
    <main className="page page-contact">
      <div className="page-overlay" aria-hidden="true"></div>
      <section className="content-section page-content">
        <div className="section-shell">
          <SectionHeader
            eyebrow={t.contact.eyebrow}
            title={t.contact.title}
            text={t.contact.text}
          />

          <div className="contact-layout">
            <div className="contact-info-column">
              <div className="contact-cards">
                <article className="glass-card contact-card">
                  <span>{t.contact.cards.lodgingEmail}</span>
                  <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                </article>
                <article className="glass-card contact-card">
                  <span>{t.contact.cards.massageEmail}</span>
                  <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                </article>
                <article className="glass-card contact-card">
                  <span>{t.contact.cards.bowenEmail}</span>
                  <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                </article>
                <article className="glass-card contact-card">
                  <span>{t.contact.cards.phone}</span>
                  <a href="tel:0743486611">0743486611</a>
                </article>
                <article className="glass-card contact-card">
                  <span>{t.contact.cards.company}</span>
                  <strong>CRISSBT SRL</strong>
                </article>
                <article className="glass-card contact-card therapist-card">
                  <div className="therapist-heading">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M19.5 4.5C12 4.8 7.5 8.3 7.5 14.2c0 2.1 1.4 4.1 3.7 4.1 5.7 0 8.1-7.1 8.3-13.8Z" />
                      <path d="M4.5 20c2.4-5.2 6.1-8.7 11.2-10.7" />
                    </svg>
                    <strong>{t.contact.cards.therapist.name}</strong>
                  </div>
                  <p className="therapist-subtitle">{t.contact.cards.therapist.subtitle}</p>
                  <p>{t.contact.cards.therapist.text}</p>
                </article>
              </div>

              <article className="glass-card directions-card">
                  <div className="directions-heading">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                    <h2>{t.contact.directions.title}</h2>
                  </div>
                  <address>
                    {t.contact.directions.address.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </address>
                  <ul>
                    {t.contact.directions.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                  <div className="directions-actions">
                    <a
                      className="button secondary"
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t.contact.directions.openMap}
                    </a>
                    <a
                      className="button primary"
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t.contact.directions.startNavigation}
                    </a>
                  </div>
              </article>
            </div>

            <form className="contact-form" onSubmit={handleContactSubmit}>
              <label>
                {t.contact.form.name}
                <input type="text" name="name" placeholder={t.contact.form.namePlaceholder} />
              </label>
              <label>
                {t.contact.form.contact}
                <input
                  type="text"
                  name="contact"
                  placeholder={t.contact.form.contactPlaceholder}
                />
              </label>
              <label>
                {t.contact.form.interest}
                <select name="interest" defaultValue="cazare">
                  <option value="cazare">{t.contact.form.options.lodging}</option>
                  <option value="masaj">{t.contact.form.options.massage}</option>
                  <option value="bowen">{t.contact.form.options.bowen}</option>
                  <option value="pachet">{t.contact.form.options.package}</option>
                </select>
              </label>
              <label>
                {t.contact.form.message}
                <textarea
                  name="message"
                  rows="5"
                  placeholder={t.contact.form.messagePlaceholder}
                ></textarea>
              </label>
              <button className="button primary form-button" type="submit">
                {t.contact.form.submit}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}

function Footer({ t }) {
  return (
    <footer className="footer">
      <p>{t.footer.location}</p>
      <p>{t.footer.company}</p>
    </footer>
  )
}

function QuickContact({ t }) {
  const whatsappUrl = `https://wa.me/40743486611?text=${encodeURIComponent(
    t.quickContact.whatsappMessage,
  )}`

  return (
    <div className="quick-contact">
      <a
        className="whatsapp-button"
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t.quickContact.whatsappLabel}
        data-tooltip={t.quickContact.whatsappLabel}
      >
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M16.1 4.1A11.7 11.7 0 0 0 6 21.7L4.4 27.6l6-1.6a11.7 11.7 0 1 0 5.7-21.9Z" />
          <path d="M12.3 10.1c-.3-.7-.7-.7-1-.7h-.8c-.3 0-.8.1-1.2.6-.4.5-1.5 1.5-1.5 3.6 0 2.2 1.6 4.3 1.8 4.6.2.3 3.1 4.7 7.5 6.6 3.7 1.6 4.5 1.3 5.3 1.2.8-.1 2.7-1.1 3-2.1.4-1.1.4-2 .3-2.1-.1-.2-.4-.3-.9-.6l-3-1.4c-.4-.2-.8-.3-1.1.2-.3.4-1.1 1.4-1.4 1.7-.3.3-.5.3-1 .1-.5-.2-2-.7-3.8-2.3-1.4-1.2-2.3-2.8-2.6-3.2-.3-.5 0-.7.2-.9l.7-.8c.2-.3.3-.5.5-.8.2-.3.1-.6 0-.8l-1-2.9Z" />
        </svg>
      </a>

      <a
        className="mobile-call-button"
        href="tel:+40743486611"
        aria-label={t.quickContact.callLabel}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7.1 3.5 9.4 8 7.8 9.6a14.6 14.6 0 0 0 6.6 6.6l1.6-1.6 4.5 2.3v2.6c0 .8-.7 1.5-1.5 1.5A16 16 0 0 1 3 5c0-.8.7-1.5 1.5-1.5h2.6Z" />
        </svg>
        <span>{t.quickContact.callLabel}</span>
      </a>
    </div>
  )
}

function AppRoutes({ currentLanguage, onLanguageChange, t }) {
  return (
    <>
      <SeoMetadata language={currentLanguage} />
      <ScrollToTop />
      <Navbar
        currentLanguage={currentLanguage}
        onLanguageChange={onLanguageChange}
        t={t}
      />
      <Routes>
        <Route path="/" element={<HomePage t={t} />} />
        <Route path="/pensiunea" element={<PensionPage t={t} />} />
        <Route
          path="/therapy"
          element={<TherapyPage t={t} language={currentLanguage} />}
        />
        <Route path="/recenzii" element={<ReviewsPage t={t} language={currentLanguage} />} />
        <Route path="/admin" element={<AdminRedirect />} />
        <Route path="/admin/reviews" element={<AdminReviewsPage t={t} language={currentLanguage} />} />
        <Route path="/admin/prices" element={<AdminPricesPage language={currentLanguage} />} />
        <Route path="/contact" element={<ContactPage t={t} />} />
      </Routes>
      <QuickContact t={t} />
      <Footer t={t} />
    </>
  )
}

function App() {
  const [currentLanguage, setCurrentLanguage] = useState(getStoredLanguage)
  const t = useMemo(() => translations[currentLanguage], [currentLanguage])

  const handleLanguageChange = (language) => {
    setCurrentLanguage(language)
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    const url = new URL(window.location.href)
    url.searchParams.set('lang', language)
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
  }

  useEffect(() => {
    document.documentElement.lang = currentLanguage
  }, [currentLanguage])

  return (
    <BrowserRouter>
      <AppRoutes
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        t={t}
      />
    </BrowserRouter>
  )
}

export default App
