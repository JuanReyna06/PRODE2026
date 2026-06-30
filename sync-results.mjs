// sync-results.mjs
// Uso: node sync-results.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

try {
  const env = readFileSync('.env', 'utf-8')
  for (const line of env.split('\n')) {
    const [key, ...rest] = line.split('=')
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
  }
} catch {}

const SUPABASE_URL     = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_KEY
const DATA_URL         = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json'

if (!SUPABASE_URL || !SUPABASE_SERVICE) {
  console.error('❌ Faltan SUPABASE_URL y SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
  auth: { persistSession: false }
})

const TEAM_MAP = {
  'Mexico': 'MEX', 'South Africa': 'SUD', 'South Korea': 'COR',
  'Czech Republic': 'CZE', 'Canada': 'CAN', 'Bosnia & Herzegovina': 'BIH',
  'Qatar': 'QAT', 'Switzerland': 'SUI', 'Brazil': 'BRA', 'Morocco': 'MAR',
  'Haiti': 'HAI', 'Scotland': 'SCO', 'USA': 'USA', 'Paraguay': 'PAR',
  'Australia': 'AUS', 'Turkey': 'TUR', 'Germany': 'ALE', 'Curaçao': 'CUR',
  'Ivory Coast': 'CMA', 'Ecuador': 'ECU', 'Netherlands': 'PBA', 'Japan': 'JAP',
  'Sweden': 'SUE', 'Tunisia': 'TUN', 'Belgium': 'BEL', 'Egypt': 'EGI',
  'Iran': 'IRA', 'New Zealand': 'NZE', 'Spain': 'ESP', 'Cape Verde': 'CVE',
  'Saudi Arabia': 'SAU', 'Uruguay': 'URU', 'France': 'FRA', 'Iraq': 'IRK',
  'Senegal': 'SEN', 'Norway': 'NOR', 'Argentina': 'ARG', 'Algeria': 'AGL',
  'Austria': 'AUT', 'Jordan': 'JOR', 'Portugal': 'POR', 'DR Congo': 'CGO',
  'Uzbekistan': 'UZB', 'Colombia': 'COL', 'England': 'ING', 'Croatia': 'CRO',
  'Ghana': 'GHA', 'Panama': 'PAN',
}

function parseScore(match) {
  const score = match.score
  if (!score) return null
  const [rh, ra] = score.et ?? score.ft
  let penaltyWinner = null
  if (score.p) {
    const [ph, pa] = score.p
    const homeCode = TEAM_MAP[match.team1]
    const awayCode = TEAM_MAP[match.team2]
    penaltyWinner = ph > pa ? homeCode : awayCode
  }
  return { result_home: rh, result_away: ra, penaltyWinner }
}

async function sync() {
  console.log('🔄 Iniciando sincronización...')

  const [remoteRes, { data: sbMatches }, { data: sbKnockout }] = await Promise.all([
    fetch(DATA_URL).then(r => r.json()),
    supabase.from('matches').select('id, home_code, away_code, status, result_home, result_away'),
    supabase.from('knockout_matches').select('id, home_code, away_code, round, status, result_home, result_away, penalty_winner'),
  ])

  // ── Grupos ────────────────────────────────────────────────────────────────
  console.log('\n⚽ Fase de grupos:')
  const sbLookup = {}
  for (const m of sbMatches) {
    sbLookup[`${m.home_code}-${m.away_code}`] = m
    sbLookup[`${m.away_code}-${m.home_code}`] = { ...m, _reversed: true }
  }

  let gUpdated = 0, gSkipped = 0
  for (const remote of remoteRes.matches.filter(m => m.group && m.score?.ft)) {
    const hc = TEAM_MAP[remote.team1]
    const ac = TEAM_MAP[remote.team2]
    const sbMatch = sbLookup[`${hc}-${ac}`]
    if (!sbMatch) continue

    let [sh, sa] = remote.score.ft
    if (sbMatch._reversed) [sh, sa] = [sa, sh]

    if (sbMatch.status === 'finished' && sbMatch.result_home === sh && sbMatch.result_away === sa) {
      gSkipped++; continue
    }

    const { error } = await supabase.from('matches')
      .update({ result_home: sh, result_away: sa, status: 'finished' })
      .eq('id', sbMatch.id)

    if (error) console.error(`  ❌ ${remote.team1} vs ${remote.team2}:`, error.message)
    else { console.log(`  ✅ ${remote.team1} ${sh}-${sa} ${remote.team2}`); gUpdated++ }
  }
  console.log(`  Actualizados: ${gUpdated} | Sin cambios: ${gSkipped}`)

  // ── Knockout ──────────────────────────────────────────────────────────────
  console.log('\n🏆 Fase eliminatoria:')
  const sbKoLookup = {}
  for (const m of sbKnockout) {
    if (m.home_code && m.away_code) {
      sbKoLookup[`${m.home_code}-${m.away_code}`] = m
      sbKoLookup[`${m.away_code}-${m.home_code}`] = { ...m, _reversed: true }
    }
  }

  let kUpdated = 0, kSkipped = 0, kNotFound = 0
  for (const remote of remoteRes.matches.filter(m => !m.group && m.score?.ft)) {
    const hc = TEAM_MAP[remote.team1]
    const ac = TEAM_MAP[remote.team2]
    if (!hc || !ac) { kNotFound++; continue }

    const sbMatch = sbKoLookup[`${hc}-${ac}`]
    if (!sbMatch) { kNotFound++; continue }

    const parsed = parseScore(remote)
    if (!parsed) { kSkipped++; continue }

    let { result_home, result_away, penaltyWinner } = parsed
    if (sbMatch._reversed) {
      ;[result_home, result_away] = [result_away, result_home]
      if (penaltyWinner) penaltyWinner = penaltyWinner === hc ? ac : hc
    }

    if (
      sbMatch.status === 'finished' &&
      sbMatch.result_home === result_home &&
      sbMatch.result_away === result_away &&
      sbMatch.penalty_winner === penaltyWinner
    ) { kSkipped++; continue }

    const pen = penaltyWinner ? ` (pen: ${penaltyWinner})` : ''
    const { error } = await supabase.from('knockout_matches')
      .update({ result_home, result_away, penalty_winner: penaltyWinner, status: 'finished' })
      .eq('id', sbMatch.id)

    if (error) console.error(`  ❌ ${remote.team1} vs ${remote.team2}:`, error.message)
    else { console.log(`  ✅ ${remote.team1} ${result_home}-${result_away} ${remote.team2}${pen}`); kUpdated++ }
  }
  console.log(`  Actualizados: ${kUpdated} | Sin cambios: ${kSkipped} | No encontrados: ${kNotFound}`)

  console.log(`\n✅ Sync completo ${new Date().toLocaleString('es-AR')}`)
}

sync().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
