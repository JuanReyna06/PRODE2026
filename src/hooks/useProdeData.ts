import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { LeaderboardEntry, Match } from '@/types'

export function useProdeData() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [hasLive, setHasLive] = useState(false)

  const fetchData = useCallback(async () => {
    const [{ data: boardData }, { data: matchData }] = await Promise.all([
      supabase
        .from('leaderboard')
        .select('*')
        .order('total_points', { ascending: false }),
      supabase
        .from('matches')
        .select(`
          id, group_name, result_home, result_away, status,
          home_team:teams!home_code(name, code),
          away_team:teams!away_code(name, code)
        `)
        .order('id', { ascending: true }),
    ])

    if (boardData) setLeaderboard(boardData)

    if (matchData) {
      const formatted: Match[] = (matchData as any[]).map((m) => ({
        id: m.id,
        group_name: m.group_name,
        home_code: m.home_team.code,
        away_code: m.away_team.code,
        home_name: m.home_team.name,
        away_name: m.away_team.name,
        result_home: m.result_home,
        result_away: m.result_away,
        status: m.status,
      }))
      setMatches(formatted)
      setHasLive(formatted.some((m) => m.status === 'live'))
    }

    setLastUpdate(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    // Refresca cada 3 min si hay partidos en vivo, si no cada 10 min
    const interval = setInterval(fetchData, hasLive ? 3 * 60 * 1000 : 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchData, hasLive])

  return { leaderboard, matches, loading, lastUpdate, hasLive, refetch: fetchData }
}

// Hook separado para las predicciones de un participante puntual
export function useParticipantPredictions(participantId: number | null) {
  const [predictions, setPredictions] = useState<
    Array<{ match_id: number; pred_home: number | null; pred_away: number | null; points: number | null }>
  >([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!participantId) return
    setLoading(true)
    supabase
      .from('prediction_points')
      .select('match_id, pred_home, pred_away, points')
      .eq('participant_id', participantId)
      .then(({ data }) => {
        if (data) setPredictions(data)
        setLoading(false)
      })
  }, [participantId])

  return { predictions, loading }
}
