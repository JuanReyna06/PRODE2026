import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

try {
  const env = readFileSync('.env', 'utf-8')
  for (const line of env.split('\n')) {
    const [key, ...rest] = line.split('=')
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
  }
} catch {}

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL     = process.env.VITE_SUPABASE_URL     || process.env.SUPABASE_URL
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_KEY              // service_role key (tiene permisos de escritura)
const DATA_URL         = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json'

if (!SUPABASE_URL || !SUPABASE_SERVICE) {
  console.error('❌ Faltan variables de entorno SUPABASE_URL y SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE)

// ── Mapeo nombre openfootball -> código de tu prode ──────────────────────────
const TEAM_MAP = {
  'Mexico':                'MEX',
  'South Africa':          'SUD',
  'South Korea':           'COR',
  'Czech Republic':        'CZE',
  'Canada':                'CAN',
  'Bosnia & Herzegovina':  'BIH',
  'Qatar':                 'QAT',
  'Switzerland':           'SUI',
  'Brazil':                'BRA',
  'Morocco':               'MAR',
  'Haiti':                 'HAI',
  'Scotland':              'SCO',
  'USA':                   'USA',
  'Paraguay':              'PAR',
  'Australia':             'AUS',
  'Turkey':                'TUR',
  'Germany':               'ALE',
  'Curaçao':               'CUR',
  'Ivory Coast':           'CMA',
  'Ecuador':               'ECU',
  'Netherlands':           'PBA',
  'Japan':                 'JAP',
  'Sweden':                'SUE',
  'Tunisia':               'TUN',
  'Belgium':               'BEL',
  'Egypt':                 'EGI',
  'Iran':                  'IRA',
  'New Zealand':           'NZE',
  'Spain':                 'ESP',
  'Cape Verde':            'CVE',
  'Saudi Arabia':          'SAU',
  'Uruguay':               'URU',
  'France':                'FRA',
  'Iraq':                  'IRK',
  'Senegal':               'SEN',
  'Norway':                'NOR',
  'Argentina':             'ARG',
  'Algeria':               'AGL',
  'Austria':               'AUT',
  'Jordan':                'JOR',
  'Portugal':              'POR',
  'DR Congo':              'CGO',
  'Uzbekistan':            'UZB',
  'Colombia':              'COL',
  'England':               'ING',
  'Croatia':               'CRO',
  'Ghana':                 'GHA',
  'Panama':                'PAN',
}

// ── Fetch datos de openfootball ───────────────────────────────────────────────
async function fetchRemoteMatches() {
  const res = await fetch(DATA_URL)
  if (!res.ok) throw new Error(`openfootball fetch falló: ${res.status}`)
  const data = await res.json()
  // Solo fase de grupos (tienen campo group, no son knockout)
  return data.matches.filter(m => m.group && TEAM_MAP[m.team1] && TEAM_MAP[m.team2])
}

// ── Traer partidos de Supabase ────────────────────────────────────────────────
async function fetchSupabaseMatches() {
  const { data, error } = await supabase
    .from('matches')
    .select('id, home_code, away_code, status, result_home, result_away')
  if (error) throw error
  return data
}

// ── Sync ──────────────────────────────────────────────────────────────────────
async function sync() {
  console.log('🔄 Iniciando sincronización...')
  console.log(`📡 Fuente: ${DATA_URL}`)

  const [remoteMatches, supabaseMatches] = await Promise.all([
    fetchRemoteMatches(),
    fetchSupabaseMatches(),
  ])

  // Construir lookup de supabase: { 'MEX-SUD': {id, ...}, 'SUD-MEX': {id, ...} }
  const sbLookup = {}
  for (const m of supabaseMatches) {
    sbLookup[`${m.home_code}-${m.away_code}`] = m
    sbLookup[`${m.away_code}-${m.home_code}`] = { ...m, _reversed: true }
  }

  let updated = 0
  let skipped = 0
  let notFound = 0

  for (const remote of remoteMatches) {
    const homeCode = TEAM_MAP[remote.team1]
    const awayCode = TEAM_MAP[remote.team2]

    const key = `${homeCode}-${awayCode}`
    const sbMatch = sbLookup[key]

    if (!sbMatch) {
      console.warn(`  ⚠️  No encontrado en Supabase: ${remote.team1} vs ${remote.team2} (${homeCode} vs ${awayCode})`)
      notFound++
      continue
    }

    const hasScore = remote.score?.ft
    if (!hasScore) {
      skipped++
      continue // partido no jugado todavía
    }

    let [scoreHome, scoreAway] = remote.score.ft

    // Si el partido estaba invertido, invertimos el score
    if (sbMatch._reversed) {
      [scoreHome, scoreAway] = [scoreAway, scoreHome]
    }

    const matchId = sbMatch.id

    // Si ya está actualizado con el mismo resultado, no hacemos nada
    if (
      sbMatch.status === 'finished' &&
      sbMatch.result_home === scoreHome &&
      sbMatch.result_away === scoreAway
    ) {
      skipped++
      continue
    }

    const { error } = await supabase
      .from('matches')
      .update({
        result_home: scoreHome,
        result_away: scoreAway,
        status: 'finished',
      })
      .eq('id', matchId)

    if (error) {
      console.error(`  ❌ Error actualizando match ${matchId}:`, error.message)
    } else {
      console.log(`  ✅ ${remote.team1} ${scoreHome}-${scoreAway} ${remote.team2}  (id=${matchId})`)
      updated++
    }
  }

  console.log(`\n📊 Resumen:`)
  console.log(`   Actualizados:   ${updated}`)
  console.log(`   Sin cambios:    ${skipped}`)
  console.log(`   No encontrados: ${notFound}`)
  console.log(`\n✅ Sync completo ${new Date().toLocaleString('es-AR')}`)
}

sync().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
