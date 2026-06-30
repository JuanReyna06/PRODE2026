// api/sync.js
// Vercel Serverless Function — POST /api/sync
import { createClient } from '@supabase/supabase-js'

const DATA_URL = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json'

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

const ROUND_MAP = {
  'Round of 32': 'R16',
  'Round of 16': 'QF',
  'Quarter-final': 'SF',
  'Semi-final': 'F',
  'Final': 'F',
}

// Dado un partido de openfootball, devuelve result_home, result_away, penalty_winner
function parseScore(match) {
  const score = match.score
  if (!score) return null

  // Usamos et (extra time) si existe, sino ft (full time)
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  try {
    const response = await fetch(DATA_URL)
    if (!response.ok) throw new Error(`openfootball error: ${response.status}`)
    const data = await response.json()

    let groupsUpdated = 0
    let knockoutUpdated = 0

    // ── Grupos ────────────────────────────────────────────────────────────────
    const groupMatches = data.matches.filter(m => m.group && m.score?.ft)

    const { data: sbMatches } = await supabase
      .from('matches')
      .select('id, home_code, away_code, status, result_home, result_away')

    const sbLookup = {}
    for (const m of sbMatches) {
      sbLookup[`${m.home_code}-${m.away_code}`] = m
      sbLookup[`${m.away_code}-${m.home_code}`] = { ...m, _reversed: true }
    }

    for (const remote of groupMatches) {
      const hc = TEAM_MAP[remote.team1]
      const ac = TEAM_MAP[remote.team2]
      const sbMatch = sbLookup[`${hc}-${ac}`]
      if (!sbMatch) continue

      let [sh, sa] = remote.score.ft
      if (sbMatch._reversed) [sh, sa] = [sa, sh]

      if (sbMatch.status === 'finished' && sbMatch.result_home === sh && sbMatch.result_away === sa) continue

      await supabase.from('matches')
        .update({ result_home: sh, result_away: sa, status: 'finished' })
        .eq('id', sbMatch.id)
      groupsUpdated++
    }

    // ── Knockout ──────────────────────────────────────────────────────────────
    const knockoutRemote = data.matches.filter(m => !m.group && m.score?.ft)

    const { data: sbKnockout } = await supabase
      .from('knockout_matches')
      .select('id, home_code, away_code, round, status, result_home, result_away, penalty_winner')

    const sbKoLookup = {}
    for (const m of sbKnockout) {
      if (m.home_code && m.away_code) {
        sbKoLookup[`${m.home_code}-${m.away_code}`] = m
        sbKoLookup[`${m.away_code}-${m.home_code}`] = { ...m, _reversed: true }
      }
    }

    for (const remote of knockoutRemote) {
      const hc = TEAM_MAP[remote.team1]
      const ac = TEAM_MAP[remote.team2]
      if (!hc || !ac) continue

      const sbMatch = sbKoLookup[`${hc}-${ac}`]
      if (!sbMatch) continue

      const parsed = parseScore(remote)
      if (!parsed) continue

      let { result_home, result_away, penaltyWinner } = parsed
      if (sbMatch._reversed) {
        ;[result_home, result_away] = [result_away, result_home]
        if (penaltyWinner) {
          penaltyWinner = penaltyWinner === hc ? ac : hc
        }
      }

      if (
        sbMatch.status === 'finished' &&
        sbMatch.result_home === result_home &&
        sbMatch.result_away === result_away &&
        sbMatch.penalty_winner === penaltyWinner
      ) continue

      await supabase.from('knockout_matches')
        .update({ result_home, result_away, penalty_winner: penaltyWinner, status: 'finished' })
        .eq('id', sbMatch.id)
      knockoutUpdated++
    }

    return res.status(200).json({ ok: true, groupsUpdated, knockoutUpdated })

  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
}