/**
 * Seeds the database with an admin account and - unless SEED_DEMO=false - a
 * small, realistic demo team so every screen has something to show.
 *
 * Safe to re-run: users are upserted by e-mail and demo leads are only created
 * when the lead table is empty.
 */

import { randomBytes, scrypt as scryptCb } from 'node:crypto'
import { promisify } from 'node:util'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const scrypt = promisify(scryptCb)

async function hashPassword(password) {
  const salt = randomBytes(16)
  const key = await scrypt(password, salt, 64)
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`
}

const day = 86_400_000
const now = Date.now()
const daysAgo = (n) => new Date(now - n * day)
const daysAhead = (n, hour) => {
  const date = new Date(now + n * day)
  if (hour !== undefined) date.setHours(hour, 0, 0, 0)
  else date.setHours(23, 59, 0, 0)
  return date
}

/** Mirrors src/lib/normalize.ts - kept small so the seed has no app imports. */
function keys({ company, website, phone, email }) {
  const companyKey = company
    ? company
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/\b(gmbh|ug|ag|kg|ohg|gbr|e\.?\s?k\.?|ltd|inc)\b/g, '')
        .replace(/[^a-z0-9]/g, '') || null
    : null
  const domainKey = website
    ? website
        .trim()
        .toLowerCase()
        .replace(/^[a-z]+:\/\//, '')
        .split('/')[0]
        .replace(/^www\./, '') || null
    : null
  const digits = phone ? phone.replace(/\D/g, '') : ''
  return {
    companyKey,
    domainKey,
    phoneKey: digits.length >= 6 ? digits.slice(-9) : null,
    emailKey: email ? email.trim().toLowerCase() : null,
  }
}

const BOARD = [
  'NEU',
  'RECHERCHE',
  'KONTAKTIERT',
  'ANTWORT',
  'INTERESSIERT',
  'TERMIN',
  'ANGEBOT',
  'GEWONNEN',
]

/** Derives the funnel timestamps a lead in `stage` would plausibly have. */
function progress(stage, createdDaysAgo, actorId) {
  const index = BOARD.indexOf(stage)
  const lost = stage === 'VERLOREN'
  const reached = (target) => index >= BOARD.indexOf(target)
  const at = (offset) => daysAgo(Math.max(0, createdDaysAgo - offset))

  return {
    maxStage: lost ? 'KONTAKTIERT' : stage,
    firstContactAt: lost || reached('KONTAKTIERT') ? at(1) : null,
    firstReplyAt: reached('ANTWORT') ? at(2) : null,
    firstAppointmentAt: reached('TERMIN') ? at(4) : null,
    firstOfferAt: reached('ANGEBOT') ? at(6) : null,
    appointmentSetById: reached('TERMIN') ? actorId : null,
    closedById: stage === 'GEWONNEN' ? actorId : null,
    wonAt: stage === 'GEWONNEN' ? at(8) : null,
    lostAt: lost ? at(3) : null,
    lastContactAt: lost || reached('KONTAKTIERT') ? at(1) : null,
  }
}

const TEMPLATES = [
  {
    title: 'Erstanruf - Gatekeeper',
    category: 'PHONE',
    body: `Guten Tag, mein Name ist {{mein_name}} von {{meine_firma}}.

Ich habe mir die Website von {{firma}} angeschaut und dabei etwas gesehen, das für {{ansprechpartner}} interessant sein dürfte.

Können Sie mich kurz durchstellen?

--- Wenn "worum geht es?" ---
Es geht um die Online-Sichtbarkeit von {{firma}}. Mir ist aufgefallen, dass {{potenzial}}. Das kostet aktuell Anfragen - und genau darüber würde ich zwei Minuten sprechen.

--- Wenn "schicken Sie eine E-Mail" ---
Mache ich gerne. Damit die Mail nicht untergeht: an welche Adresse schaut {{ansprechpartner}} täglich?`,
  },
  {
    title: 'Erstanruf - Entscheider',
    category: 'PHONE',
    body: `Guten Tag {{ansprechpartner}}, {{mein_name}} von {{meine_firma}}. Haben Sie 60 Sekunden?

Ich rufe an, weil mir bei {{firma}} aufgefallen ist, dass {{potenzial}}.

Bei vergleichbaren Betrieben führt genau das dazu, dass Interessenten abspringen, bevor sie anfragen.

Ich habe dazu eine kurze Analyse gemacht. Soll ich Ihnen die zusenden, oder schauen wir gemeinsam 15 Minuten drüber?

--- Einwand "kein Interesse" ---
Verstehe ich. Nur zur Einordnung: Interesse an mehr Anfragen oder an dem Thema selbst?

--- Einwand "haben schon eine Agentur" ---
Gut - dann ist die Basis da. Umso schneller lässt sich das Konkrete umsetzen. Wer betreut das aktuell?`,
  },
  {
    title: 'WhatsApp - nach nicht erreicht',
    category: 'WHATSAPP',
    body: `Hallo {{ansprechpartner}}, ich habe gerade versucht Sie zu erreichen - {{mein_name}} von {{meine_firma}}.

Kurz zum Grund: mir ist bei {{firma}} aufgefallen, dass {{potenzial}}.

Ich habe Ihnen dazu zwei konkrete Punkte notiert. Passt es Ihnen morgen zwischen 10 und 12 Uhr für 10 Minuten?`,
  },
  {
    title: 'Instagram-DM - Erstkontakt',
    category: 'INSTAGRAM',
    body: `Hi {{firma}} 👋

Ihr Auftritt hier ist stark - beim Klick auf die Website bricht es dann aber ab: {{potenzial}}.

Wir bauen genau das für Betriebe wie euch. Wenn du magst, schicke ich dir eine kurze Analyse mit drei Punkten, die ich sofort ändern würde. Kostenlos, kein Haken.

Soll ich?`,
  },
  {
    title: 'LinkedIn - Kontaktanfrage mit Notiz',
    category: 'LINKEDIN',
    body: `Hallo {{ansprechpartner}},

ich arbeite mit {{branche}}-Betrieben an ihrer Online-Sichtbarkeit. Bei {{firma}} ist mir {{potenzial}} aufgefallen.

Ich vernetze mich gern - und wenn es passt, schicke ich Ihnen eine kurze Einschätzung dazu.

Beste Grüße
{{mein_name}}`,
  },
  {
    title: 'E-Mail - Website-Analyse anbieten',
    category: 'EMAIL',
    body: `Betreff: Kurz zur Website von {{firma}}

Hallo {{ansprechpartner}},

ich habe mir {{website}} angesehen. Drei Dinge sind mir aufgefallen:

1. {{punkt_1}}
2. {{punkt_2}}
3. {{punkt_3}}

Punkt 1 lässt sich in wenigen Tagen lösen und wirkt sich direkt auf Anfragen aus.

Ich habe die Details in einer kurzen Analyse zusammengefasst. Soll ich sie Ihnen schicken?

Beste Grüße
{{mein_name}}
{{meine_firma}}`,
  },
  {
    title: 'Follow-up - Angebot nachfassen',
    category: 'FOLLOWUP',
    body: `Hallo {{ansprechpartner}},

ich wollte kurz nachfassen zu meinem Angebot vom {{datum}}.

Damit es nicht am Umfang hängt: wir können auch mit dem kleinsten Schritt anfangen und den Rest später entscheiden.

Was wäre aktuell Ihr größter Vorbehalt?

Beste Grüße
{{mein_name}}`,
  },
  {
    title: 'Follow-up - letzter Versuch',
    category: 'FOLLOWUP',
    body: `Hallo {{ansprechpartner}},

ich habe mich mehrfach gemeldet und will nicht nerven.

Soll ich das Thema für dieses Jahr schließen, oder melde ich mich in {{monate}} Monaten noch einmal?

Beide Antworten sind für mich völlig in Ordnung.

Beste Grüße
{{mein_name}}`,
  },
]

const DEMO_LEADS = [
  {
    company: 'Bäckerei Sonnenschein GmbH',
    industry: 'Bäckerei',
    location: 'Köln',
    website: 'baeckerei-sonnenschein.de',
    phone: '0221 4455661',
    email: 'info@baeckerei-sonnenschein.de',
    instagram: '@baeckerei_sonnenschein',
    companySize: '21-50',
    source: 'GOOGLE_MAPS',
    stage: 'INTERESSIERT',
    priority: 'HOT',
    potentials: ['OUTDATED_WEBSITE', 'BAD_MOBILE', 'NO_TRACKING'],
    agent: 0,
    createdDaysAgo: 12,
    notes: 'Vier Filialen, Inhaberin sehr aufgeschlossen. Will vor allem mehr Bewerbungen.',
    contact: {
      name: 'Maria Wegener',
      position: 'Inhaberin',
      phone: '0171 3344551',
      channel: 'PHONE',
    },
    task: { title: 'Websiteanalyse vorstellen', inDays: 1, hour: 10 },
  },
  {
    company: 'Autohaus Berger & Sohn',
    industry: 'Automotive',
    location: 'Leverkusen',
    website: 'autohaus-berger.de',
    phone: '0214 7788990',
    email: 'kontakt@autohaus-berger.de',
    companySize: '21-50',
    source: 'EIGENRECHERCHE',
    stage: 'TERMIN',
    priority: 'HOT',
    potentials: ['NO_GOOGLE_ADS', 'WEAK_CONVERSION'],
    agent: 0,
    createdDaysAgo: 20,
    dealValue: 4800,
    contact: {
      name: 'Stefan Berger',
      position: 'Geschäftsführer',
      phone: '0175 9988771',
      channel: 'PHONE',
    },
    appointment: {
      inDays: 2,
      hour: 14,
      kind: 'ONSITE',
      participants: 'Stefan Berger, Marketingleitung',
    },
    task: { title: 'Termin bestätigen und Agenda senden', inDays: 1, hour: 9 },
  },
  {
    company: 'Physio Aktiv Zentrum',
    industry: 'Gesundheit',
    location: 'Bonn',
    website: 'physio-aktiv-bonn.de',
    phone: '0228 3344556',
    email: 'praxis@physio-aktiv-bonn.de',
    companySize: '6-20',
    source: 'EMPFEHLUNG',
    stage: 'ANGEBOT',
    priority: 'HOT',
    potentials: ['WEAK_CONVERSION', 'NO_META_ADS'],
    agent: 1,
    createdDaysAgo: 26,
    dealValue: 2400,
    contact: {
      name: 'Dr. Anke Ritter',
      position: 'Praxisinhaberin',
      email: 'ritter@physio-aktiv-bonn.de',
      channel: 'EMAIL',
    },
    task: { title: 'Angebot nachfassen', inDays: -2, hour: 11 },
  },
  {
    company: 'Möbel Lindner e.K.',
    industry: 'Einzelhandel',
    location: 'Düsseldorf',
    website: 'moebel-lindner.de',
    phone: '0211 6677880',
    email: 'service@moebel-lindner.de',
    companySize: '21-50',
    source: 'GOOGLE_MAPS',
    stage: 'GEWONNEN',
    priority: 'WARM',
    potentials: ['NO_SHOP', 'BAD_PRODUCT_PRESENTATION'],
    agent: 0,
    createdDaysAgo: 45,
    dealValue: 9600,
    contact: {
      name: 'Petra Lindner',
      position: 'Inhaberin',
      phone: '0170 1122334',
      channel: 'WHATSAPP',
    },
  },
  {
    company: 'Elektro Hansen GmbH',
    industry: 'Handwerk',
    location: 'Neuss',
    website: 'elektro-hansen.de',
    phone: '02131 445566',
    email: 'buero@elektro-hansen.de',
    companySize: '6-20',
    source: 'TELEFONAKQUISE',
    stage: 'ANTWORT',
    priority: 'WARM',
    potentials: ['OUTDATED_WEBSITE', 'WEAK_SOCIAL'],
    agent: 1,
    createdDaysAgo: 8,
    contact: {
      name: 'Tim Hansen',
      position: 'Betriebsleiter',
      phone: '0160 5544332',
      channel: 'WHATSAPP',
    },
    task: { title: 'Erneut anrufen', inDays: 0, hour: 15 },
  },
  {
    company: 'Restaurant Bella Vista',
    industry: 'Gastronomie',
    location: 'Köln',
    website: 'bellavista-koeln.de',
    phone: '0221 998877',
    instagram: '@bellavista_koeln',
    companySize: '6-20',
    source: 'INSTAGRAM',
    stage: 'KONTAKTIERT',
    priority: 'WARM',
    potentials: ['BAD_MOBILE', 'NO_TRACKING'],
    agent: 1,
    createdDaysAgo: 5,
    task: { title: 'WhatsApp senden', inDays: 0, hour: 11 },
  },
  {
    company: 'Steuerberatung Krämer & Partner',
    industry: 'Beratung',
    location: 'Köln',
    website: 'kraemer-steuern.de',
    phone: '0221 112233',
    email: 'info@kraemer-steuern.de',
    linkedin: 'kraemer-partner',
    companySize: '21-50',
    source: 'LINKEDIN',
    stage: 'RECHERCHE',
    priority: 'COLD',
    potentials: ['WEAK_SOCIAL'],
    agent: 0,
    createdDaysAgo: 3,
  },
  {
    company: 'Fitnessstudio Pulse',
    industry: 'Sport',
    location: 'Bergisch Gladbach',
    website: 'pulse-fitness.de',
    phone: '02202 556677',
    instagram: '@pulse_fitness',
    companySize: '6-20',
    source: 'INSTAGRAM',
    stage: 'NEU',
    priority: 'WARM',
    potentials: ['NO_META_ADS', 'WEAK_CONVERSION'],
    agent: 1,
    createdDaysAgo: 1,
  },
  {
    company: 'Garten Grünwald',
    industry: 'Handwerk',
    location: 'Hürth',
    phone: '02233 887766',
    email: 'kontakt@garten-gruenwald.de',
    companySize: '1-5',
    source: 'GOOGLE_MAPS',
    stage: 'NEU',
    priority: 'COLD',
    potentials: ['NO_WEBSITE'],
    agent: 0,
    createdDaysAgo: 1,
  },
  {
    company: 'Zahnarztpraxis Dr. Feld',
    industry: 'Gesundheit',
    location: 'Köln',
    website: 'zahnarzt-feld.de',
    phone: '0221 334455',
    email: 'praxis@zahnarzt-feld.de',
    companySize: '6-20',
    source: 'EIGENRECHERCHE',
    stage: 'VERLOREN',
    priority: 'COLD',
    potentials: ['OUTDATED_WEBSITE'],
    agent: 1,
    createdDaysAgo: 30,
    lostReason: 'Arbeitet langfristig mit einer Agentur',
  },
  {
    company: 'Hofladen Wiesengut',
    industry: 'Lebensmittel',
    location: 'Pulheim',
    website: 'hofladen-wiesengut.de',
    phone: '02238 445599',
    instagram: '@hofladen_wiesengut',
    companySize: '1-5',
    source: 'INSTAGRAM',
    stage: 'INTERESSIERT',
    priority: 'WARM',
    potentials: ['NO_SHOP', 'BAD_PRODUCT_PRESENTATION'],
    agent: 1,
    createdDaysAgo: 15,
    dealValue: 3200,
    contact: {
      name: 'Jonas Wiese',
      position: 'Inhaber',
      phone: '0151 2233445',
      channel: 'WHATSAPP',
    },
    task: { title: 'Shop-Konzept schicken', inDays: 3, hour: 9 },
  },
  {
    company: 'Immobilien Rheinblick',
    industry: 'Immobilien',
    location: 'Köln',
    website: 'rheinblick-immo.de',
    phone: '0221 776655',
    email: 'info@rheinblick-immo.de',
    linkedin: 'rheinblick-immobilien',
    companySize: '6-20',
    source: 'LINKEDIN',
    stage: 'TERMIN',
    priority: 'HOT',
    potentials: ['WEAK_CONVERSION', 'NO_GOOGLE_ADS', 'FEHLT'],
    agent: 0,
    createdDaysAgo: 18,
    dealValue: 6500,
    contact: {
      name: 'Claudia Sommer',
      position: 'Vertriebsleitung',
      email: 'sommer@rheinblick-immo.de',
      channel: 'EMAIL',
    },
    appointment: { inDays: 0, hour: 16, kind: 'VIDEO', participants: 'Claudia Sommer' },
  },
  {
    company: 'Friseur Schnittstelle',
    industry: 'Dienstleistung',
    location: 'Köln',
    instagram: '@schnittstelle_koeln',
    phone: '0221 223344',
    companySize: '1-5',
    source: 'INSTAGRAM',
    stage: 'KONTAKTIERT',
    priority: 'COLD',
    potentials: ['NO_WEBSITE', 'WEAK_SOCIAL'],
    agent: 1,
    createdDaysAgo: 9,
    task: { title: 'Instagram-DM nachfassen', inDays: -1, hour: 12 },
  },
  {
    company: 'Bau Technik Rhein GmbH',
    industry: 'Bau',
    location: 'Dormagen',
    website: 'bautechnik-rhein.de',
    phone: '02133 998877',
    email: 'zentrale@bautechnik-rhein.de',
    companySize: '51-200',
    source: 'EIGENRECHERCHE',
    stage: 'ANGEBOT',
    priority: 'HOT',
    potentials: ['OUTDATED_WEBSITE', 'NO_TRACKING', 'WEAK_CONVERSION'],
    agent: 0,
    createdDaysAgo: 33,
    dealValue: 12500,
    contact: {
      name: 'Michael Reuter',
      position: 'Geschäftsführer',
      phone: '0172 8877665',
      channel: 'PHONE',
    },
    task: { title: 'Angebot nachfassen', inDays: 0, hour: 14 },
  },
  {
    company: 'Optik Weitblick',
    industry: 'Einzelhandel',
    location: 'Wesseling',
    website: 'optik-weitblick.de',
    phone: '02236 445566',
    email: 'info@optik-weitblick.de',
    companySize: '1-5',
    source: 'GOOGLE_MAPS',
    stage: 'GEWONNEN',
    priority: 'WARM',
    potentials: ['BAD_MOBILE', 'NO_TRACKING'],
    agent: 1,
    createdDaysAgo: 60,
    dealValue: 3900,
  },
  {
    company: 'Tischlerei Holzwerk',
    industry: 'Handwerk',
    location: 'Bonn',
    phone: '0228 998811',
    email: 'anfrage@holzwerk-bonn.de',
    companySize: '6-20',
    source: 'EMPFEHLUNG',
    stage: 'RECHERCHE',
    priority: 'WARM',
    potentials: ['NO_WEBSITE', 'BAD_PRODUCT_PRESENTATION'],
    agent: 0,
    createdDaysAgo: 4,
    task: { title: 'Ansprechpartner recherchieren', inDays: 1, hour: 8 },
  },
  {
    company: 'Reinigung Blitzblank',
    industry: 'Dienstleistung',
    location: 'Köln',
    website: 'blitzblank-koeln.de',
    phone: '0221 556644',
    companySize: '21-50',
    source: 'TELEFONAKQUISE',
    stage: 'ANTWORT',
    priority: 'WARM',
    potentials: ['WEAK_CONVERSION', 'NO_GOOGLE_ADS'],
    agent: 1,
    createdDaysAgo: 7,
    task: { title: 'Rückruf wie vereinbart', inDays: 0, hour: 9 },
  },
  {
    company: 'Weinhandlung Rebgut',
    industry: 'Lebensmittel',
    location: 'Köln',
    website: 'rebgut-wein.de',
    phone: '0221 445533',
    email: 'shop@rebgut-wein.de',
    instagram: '@rebgut',
    companySize: '1-5',
    source: 'EIGENRECHERCHE',
    stage: 'INTERESSIERT',
    priority: 'WARM',
    potentials: ['BAD_SHOP', 'WEAK_CONVERSION'],
    agent: 0,
    createdDaysAgo: 14,
    dealValue: 2800,
    contact: {
      name: 'Sven Reber',
      position: 'Inhaber',
      email: 'reber@rebgut-wein.de',
      channel: 'EMAIL',
    },
    task: { title: 'Shop-Audit versenden', inDays: 2, hour: 10 },
  },
  {
    company: 'Kita Regenbogen gGmbH',
    industry: 'Bildung',
    location: 'Köln',
    website: 'kita-regenbogen-koeln.de',
    email: 'leitung@kita-regenbogen-koeln.de',
    companySize: '21-50',
    source: 'SONSTIGE',
    stage: 'VERLOREN',
    priority: 'COLD',
    potentials: ['OUTDATED_WEBSITE'],
    agent: 0,
    createdDaysAgo: 22,
    lostReason: 'Kein Budget in diesem Jahr',
  },
  {
    company: 'Sanitär Wasserwerk',
    industry: 'Handwerk',
    location: 'Frechen',
    phone: '02234 667788',
    email: 'info@wasserwerk-sanitaer.de',
    companySize: '6-20',
    source: 'GOOGLE_MAPS',
    stage: 'NEU',
    priority: 'WARM',
    potentials: ['NO_WEBSITE', 'NO_GOOGLE_ADS'],
    agent: 1,
    createdDaysAgo: 0,
  },
]

const ACTIVITY_SCRIPTS = {
  RECHERCHE: [{ type: 'NOTE', note: 'Website und Google-Profil geprüft.', offset: 1 }],
  KONTAKTIERT: [
    { type: 'CALL', note: 'Angerufen, nicht erreicht.', outcome: 'NOT_REACHED', offset: 1 },
    { type: 'WHATSAPP', note: 'WhatsApp mit kurzer Vorstellung gesendet.', offset: 2 },
  ],
  ANTWORT: [
    { type: 'CALL', note: 'Angerufen, nicht erreicht.', outcome: 'NOT_REACHED', offset: 1 },
    { type: 'WHATSAPP', note: 'WhatsApp gesendet.', offset: 2 },
    { type: 'WHATSAPP', note: 'Kunde hat geantwortet, will Infos.', outcome: 'REPLIED', offset: 3 },
  ],
  INTERESSIERT: [
    { type: 'CALL', note: 'Erstgespräch geführt, Bedarf erkannt.', outcome: 'REACHED', offset: 2 },
    { type: 'EMAIL', note: 'Kurzanalyse per E-Mail geschickt.', offset: 3 },
    { type: 'CALL', note: 'Nachgefasst - Interesse bestätigt.', outcome: 'REACHED', offset: 5 },
  ],
  TERMIN: [
    { type: 'CALL', note: 'Erstgespräch geführt.', outcome: 'REACHED', offset: 2 },
    { type: 'EMAIL', note: 'Analyse verschickt.', offset: 3 },
    { type: 'MEETING', note: 'Termin vereinbart.', offset: 5 },
  ],
  ANGEBOT: [
    { type: 'CALL', note: 'Erstgespräch geführt.', outcome: 'REACHED', offset: 2 },
    { type: 'MEETING', note: 'Termin durchgeführt, Anforderungen aufgenommen.', offset: 5 },
    { type: 'OFFER', note: 'Angebot versendet.', offset: 7 },
  ],
  GEWONNEN: [
    { type: 'CALL', note: 'Erstgespräch geführt.', outcome: 'REACHED', offset: 2 },
    { type: 'MEETING', note: 'Termin durchgeführt.', offset: 5 },
    { type: 'OFFER', note: 'Angebot versendet.', offset: 7 },
    { type: 'NOTE', note: 'Auftrag erteilt. Start nächste Woche.', offset: 9 },
  ],
  VERLOREN: [
    { type: 'CALL', note: 'Angerufen, kurz gesprochen.', outcome: 'REACHED', offset: 1 },
    { type: 'NOTE', note: 'Kein Interesse - Grund dokumentiert.', offset: 2 },
  ],
}

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com').toLowerCase()
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'admin1234'

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN', active: true },
    create: {
      name: process.env.SEED_ADMIN_NAME ?? 'Admin',
      email: adminEmail,
      role: 'ADMIN',
      passwordHash: await hashPassword(adminPassword),
    },
  })
  console.log(`✓ Admin: ${admin.email}`)

  if (process.env.SEED_DEMO === 'false') {
    console.log('· Demodaten übersprungen (SEED_DEMO=false)')
    return
  }

  const agents = []
  for (const person of [
    { name: 'Lena Bauer', email: 'lena@example.com' },
    { name: 'Kevin Roth', email: 'kevin@example.com' },
  ]) {
    agents.push(
      await prisma.user.upsert({
        where: { email: person.email },
        update: {},
        create: {
          ...person,
          role: 'AGENT',
          passwordHash: await hashPassword('demo1234'),
        },
      }),
    )
  }
  console.log(`✓ ${agents.length} Demo-Mitarbeiter (Passwort: demo1234)`)

  if ((await prisma.template.count()) === 0) {
    await prisma.template.createMany({ data: TEMPLATES })
    console.log(`✓ ${TEMPLATES.length} Vorlagen`)
  }

  if ((await prisma.lead.count()) > 0) {
    console.log('· Leads vorhanden - Demo-Leads werden nicht erneut angelegt')
    return
  }

  for (const entry of DEMO_LEADS) {
    const owner = agents[entry.agent] ?? agents[0]
    const createdAt = daysAgo(entry.createdDaysAgo)
    const potentials = (entry.potentials ?? []).filter((key) => key !== 'FEHLT')

    const lead = await prisma.lead.create({
      data: {
        company: entry.company,
        industry: entry.industry ?? null,
        location: entry.location ?? null,
        website: entry.website ?? null,
        instagram: entry.instagram ?? null,
        linkedin: entry.linkedin ?? null,
        phone: entry.phone ?? null,
        email: entry.email ?? null,
        companySize: entry.companySize ?? null,
        source: entry.source,
        stage: entry.stage,
        priority: entry.priority,
        potentials: JSON.stringify(potentials),
        notes: entry.notes ?? null,
        dealValue: entry.dealValue ?? null,
        lostReason: entry.lostReason ?? null,
        ownerId: owner.id,
        foundById: owner.id,
        createdAt,
        ...progress(entry.stage, entry.createdDaysAgo, owner.id),
        ...keys(entry),
      },
    })

    await prisma.activity.create({
      data: { leadId: lead.id, userId: owner.id, type: 'SYSTEM', note: 'Lead angelegt', createdAt },
    })

    for (const step of ACTIVITY_SCRIPTS[entry.stage] ?? []) {
      await prisma.activity.create({
        data: {
          leadId: lead.id,
          userId: owner.id,
          type: step.type,
          note: step.note,
          outcome: step.outcome ?? null,
          createdAt: daysAgo(Math.max(0, entry.createdDaysAgo - step.offset)),
        },
      })
    }

    if (entry.contact) {
      await prisma.contact.create({
        data: {
          leadId: lead.id,
          name: entry.contact.name,
          position: entry.contact.position ?? null,
          phone: entry.contact.phone ?? null,
          email: entry.contact.email ?? null,
          preferredChannel: entry.contact.channel ?? null,
          isPrimary: true,
        },
      })
    }

    if (entry.task) {
      await prisma.task.create({
        data: {
          leadId: lead.id,
          userId: owner.id,
          createdById: owner.id,
          title: entry.task.title,
          dueAt: daysAhead(entry.task.inDays, entry.task.hour),
          hasTime: entry.task.hour !== undefined,
        },
      })
    }

    if (entry.appointment) {
      await prisma.appointment.create({
        data: {
          leadId: lead.id,
          userId: owner.id,
          startsAt: daysAhead(entry.appointment.inDays, entry.appointment.hour),
          durationMin: entry.appointment.kind === 'ONSITE' ? 60 : 30,
          kind: entry.appointment.kind,
          participants: entry.appointment.participants ?? null,
          result: 'OPEN',
        },
      })
    }
  }

  console.log(`✓ ${DEMO_LEADS.length} Demo-Leads mit Historie, Follow-ups und Terminen`)
  console.log('\nAnmeldung:')
  console.log(`  Admin       ${adminEmail} / ${adminPassword}`)
  console.log('  Mitarbeiter lena@example.com / demo1234')
  console.log('  Mitarbeiter kevin@example.com / demo1234')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
