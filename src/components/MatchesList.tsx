import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import type { Match } from '@/types'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useEffect } from 'react'

interface MatchPrediction {
  participant_name: string
  pred_home: number | null
  pred_away: number | null
  points: number | null
}

function MatchRow({ match }: { match: Match }) {
  const [expanded, setExpanded] = useState(false)
  const [predictions, setPredictions] = useState<MatchPrediction[]>([])
  const [loadingPreds, setLoadingPreds] = useState(false)

  const played = match.status === 'finished' || match.status === 'live'

  useEffect(() => {
    if (!expanded || predictions.length > 0) return
    setLoadingPreds(true)
    supabase
      .from('prediction_points')
      .select('participant_id, pred_home, pred_away, points')
      .eq('match_id', match.id)
      .then(async ({ data }) => {
        if (!data) { setLoadingPreds(false); return }
        // Traemos nombres de participantes
        const ids = data.map((d) => d.participant_id)
        const { data: parts } = await supabase
          .from('participants')
          .select('id, name')
          .in('id', ids)
        const nameMap = Object.fromEntries((parts ?? []).map((p: any) => [p.id, p.name]))
        setPredictions(
          data.map((d) => ({
            participant_name: nameMap[d.participant_id] ?? '—',
            pred_home: d.pred_home,
            pred_away: d.pred_away,
            points: d.points,
          })).sort((a, b) => (b.points ?? -1) - (a.points ?? -1))
        )
        setLoadingPreds(false)
      })
  }, [expanded, match.id, predictions.length])

  return (
    <div className={cn('border-b border-slate-100 last:border-0', expanded && 'bg-slate-50/50')}>
      {/* Fila principal del partido */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-3 sm:px-4 hover:bg-slate-50 transition-colors text-left"
      >
        {/* Local */}
        <span className="flex-1 text-right text-sm font-semibold text-slate-700 leading-tight">
          <span className="hidden sm:inline">{match.home_name}</span>
          <span className="sm:hidden">{match.home_code}</span>
        </span>

        {/* Marcador / vs */}
        <div className="flex flex-col items-center min-w-[72px]">
          {played ? (
            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-md text-base font-black',
              match.status === 'live'
                ? 'bg-red-600 text-white'
                : 'bg-slate-800 text-white'
            )}>
              <span>{match.result_home}</span>
              <span className="text-slate-400 text-xs">-</span>
              <span>{match.result_away}</span>
            </div>
          ) : (
            <span className="text-xs font-bold text-slate-400 border border-slate-200 px-3 py-1 rounded-md bg-white">
              vs
            </span>
          )}
          {match.status === 'live' && (
            <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider mt-0.5 animate-pulse-slow">
              En vivo
            </span>
          )}
        </div>

        {/* Visitante */}
        <span className="flex-1 text-left text-sm font-semibold text-slate-700 leading-tight">
          <span className="hidden sm:inline">{match.away_name}</span>
          <span className="sm:hidden">{match.away_code}</span>
        </span>

        {/* Chevron */}
        <ChevronDown
          className={cn(
            'w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200',
            expanded && 'rotate-180'
          )}
        />
      </button>

      {/* Predicciones expandidas */}
      {expanded && (
        <div className="px-3 sm:px-4 pb-3 pt-1">
          {loadingPreds ? (
            <p className="text-xs text-slate-400 text-center py-2">Cargando...</p>
          ) : (
            <div className="space-y-1">
              {/* Header */}
              <div className="flex items-center gap-2 px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="flex-1">Participante</span>
                <span className="w-14 text-center">Pred.</span>
                {played && <span className="w-10 text-right">Pts</span>}
              </div>
              {predictions.map((p) => (
                <div
                  key={p.participant_name}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm',
                    p.points === 2 && 'bg-emerald-50',
                    p.points === 1 && 'bg-blue-50',
                    p.points === 0 && played && 'bg-red-50/60',
                    p.points === null && 'bg-white'
                  )}
                >
                  <span className="flex-1 font-medium text-slate-700 text-xs truncate">
                    {p.participant_name}
                  </span>
                  <span className="w-14 text-center font-bold text-xs text-slate-800">
                    {p.pred_home ?? '?'} - {p.pred_away ?? '?'}
                  </span>
                  {played && (
                    <div className="w-10 flex justify-end">
                      <Badge
                        variant={p.points === 2 ? 'exact' : p.points === 1 ? 'winner' : 'miss'}
                        className="text-[10px] px-1.5"
                      >
                        {p.points === 2 ? '+2' : p.points === 1 ? '+1' : '0'}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function MatchesList({ matches }: { matches: Match[] }) {
  const matchesByGroup = matches.reduce((acc, m) => {
    if (!acc[m.group_name]) acc[m.group_name] = []
    acc[m.group_name].push(m)
    return acc
  }, {} as Record<string, Match[]>)

  const finished = matches.filter(m => m.status === 'finished').length

  return (
    <div className="space-y-4">
      {/* Resumen rápido */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>{finished} partidos finalizados</span>
        <span className="text-slate-300">Tocá un partido para ver predicciones</span>
      </div>

      {Object.entries(matchesByGroup).map(([groupName, groupMatches]) => {
        const groupFinished = groupMatches.filter(m => m.status === 'finished' || m.status === 'live').length
        return (
          <div key={groupName} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
              <h3 className="font-display text-sm font-black uppercase tracking-widest text-slate-800">
                {groupName}
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">{groupFinished}/6</span>
            </div>
            {groupMatches.map((match) => (
              <MatchRow key={match.id} match={match} />
            ))}
          </div>
        )
      })}
    </div>
  )
}
