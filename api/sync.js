// api/sync.js
// Vercel Serverless Function — POST /api/sync
// El frontend lo llama cuando el usuario toca "Actualizar"

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

export default async function handler(req, res) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  try {
    // 1. Traer JSON de openfootball
    const response = await fetch(DATA_URL)
    if (!response.ok) throw new Error(`openfootball error: ${response.status}`)
    const data = await response.json()

    const remoteMatches = data.matches.filter(
      m => m.group && TEAM_MAP[m.team1] && TEAM_MAP[m.team2] && m.score?.ft
    )

    // 2. Traer partidos actuales de Supabase
    const { data: sbMatches, error } = await supabase
      .from('matches')
      .select('id, home_code, away_code, status, result_home, result_away')
    if (error) throw error

    const sbLookup = {}
    for (const m of sbMatches) {
      sbLookup[`${m.home_code}-${m.away_code}`] = m
      sbLookup[`${m.away_code}-${m.home_code}`] = { ...m, _reversed: true }
    }

    // 3. Actualizar los que cambiaron
    let updated = 0
    for (const remote of remoteMatches) {
      const homeCode = TEAM_MAP[remote.team1]
      const awayCode = TEAM_MAP[remote.team2]
      const sbMatch = sbLookup[`${homeCode}-${awayCode}`]
      if (!sbMatch) continue

      let [scoreHome, scoreAway] = remote.score.ft
      if (sbMatch._reversed) [scoreHome, scoreAway] = [scoreAway, scoreHome]

      if (
        sbMatch.status === 'finished' &&
        sbMatch.result_home === scoreHome &&
        sbMatch.result_away === scoreAway
      ) continue

      await supabase
        .from('matches')
        .update({ result_home: scoreHome, result_away: scoreAway, status: 'finished' })
        .eq('id', sbMatch.id)

      updated++
    }

    return res.status(200).json({ ok: true, updated })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
}
