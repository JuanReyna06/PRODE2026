import { useState } from 'react'
import type { LeaderboardEntry, Match } from '@/types'
import { useParticipantPredictions } from '@/hooks/useProdeData'
import { Badge } from '@/components/ui/badge'
import { X, Star, Target, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  matches: Match[]
}

// ── Drawer de detalle de participante ────────────────────────────────────────
function ParticipantDrawer({
  entry,
  matches,
  onClose,
}: {
  entry: LeaderboardEntry
  matches: Match[]
  onClose: () => void
}) {
  const { predictions, loading } = useParticipantPredictions(entry.participant_id)

  const predMap = Object.fromEntries(predictions.map((p) => [p.match_id, p]))

  const matchesByGroup = matches.reduce((acc, m) => {
    if (!acc[m.group_name]) acc[m.group_name] = []
    acc[m.group_name].push(m)
    return acc
  }, {} as Record<string, Match[]>)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <p className="font-display text-xl font-bold text-slate-900 uppercase tracking-wide">
              {entry.name}
            </p>
            <p className="text-sm text-slate-500 mt-0.5">
              {entry.total_points} pts · {entry.exactos} exactos · {entry.ganador_correcto} ganador
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="overflow-y-auto flex-1 p-4 space-y-5">
          {loading ? (
            <p className="text-center text-slate-400 py-8">Cargando predicciones...</p>
          ) : (
            Object.entries(matchesByGroup).map(([group, groupMatches]) => (
              <div key={group}>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  {group}
                </p>
                <div className="space-y-1">
                  {groupMatches.map((m) => {
                    const pred = predMap[m.id]
                    const played = m.status === 'finished' || m.status === 'live'
                    const pts = pred?.points

                    return (
                      <div
                        key={m.id}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
                          pts === 2 && 'bg-emerald-50',
                          pts === 1 && 'bg-blue-50',
                          pts === 0 && played && 'bg-red-50/50',
                          !played && 'bg-slate-50'
                        )}
                      >
                        {/* Equipos */}
                        <span className="flex-1 text-right text-xs font-medium text-slate-600 truncate">
                          {m.home_name}
                        </span>

                        {/* Predicción */}
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-800 min-w-[56px] justify-center">
                          {pred?.pred_home ?? '?'}
                          <span className="text-slate-300">-</span>
                          {pred?.pred_away ?? '?'}
                        </div>

                        <span className="flex-1 text-left text-xs font-medium text-slate-600 truncate">
                          {m.away_name}
                        </span>

                        {/* Resultado real */}
                        {played ? (
                          <div className="flex items-center gap-1 text-xs text-slate-500 min-w-[40px] justify-end">
                            <span className="text-slate-300">·</span>
                            <span>{m.result_home}-{m.result_away}</span>
                          </div>
                        ) : (
                          <div className="min-w-[40px]" />
                        )}

                        {/* Badge puntos */}
                        {played && (
                          <Badge
                            variant={pts === 2 ? 'exact' : pts === 1 ? 'winner' : 'miss'}
                            className="text-[10px] px-1.5 py-0.5 ml-1 flex-shrink-0"
                          >
                            {pts === 2 ? '+2' : pts === 1 ? '+1' : '0'}
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ── Podio ────────────────────────────────────────────────────────────────────
function Podium({
  top3,
  onSelect,
}: {
  top3: LeaderboardEntry[]
  onSelect: (e: LeaderboardEntry) => void
}) {
  const [second, first, third] = [top3[1], top3[0], top3[2]]
  const podiumOrder = [second, first, third]
  const heights = ['h-20', 'h-28', 'h-14']
  const medals = ['🥈', '🥇', '🥉']
  const colors = [
    'from-slate-200 to-slate-300 border-slate-300',
    'from-yellow-200 to-amber-300 border-amber-300',
    'from-orange-100 to-orange-200 border-orange-300',
  ]

  return (
    <div className="flex items-end justify-center gap-2 px-4 pt-6 pb-2">
      {podiumOrder.map((entry, i) => {
        if (!entry) return <div key={i} className="flex-1" />
        return (
          <button
            key={entry.participant_id}
            onClick={() => onSelect(entry)}
            className="flex-1 flex flex-col items-center gap-1 group"
          >
            {/* Nombre */}
            <p className="text-xs font-bold text-slate-700 text-center leading-tight px-1 truncate w-full">
              {entry.name}
            </p>
            {/* Puntos */}
            <p className="font-display text-2xl font-black text-slate-900 leading-none">
              {entry.total_points}
            </p>
            <p className="text-[10px] text-slate-400 font-medium -mt-1">pts</p>
            {/* Podio block */}
            <div
              className={cn(
                'w-full rounded-t-lg border-t-2 border-x-2 bg-gradient-to-b flex items-center justify-center transition-all group-hover:brightness-95',
                heights[i],
                colors[i]
              )}
            >
              <span className="text-2xl">{medals[i]}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── Fila de tabla ─────────────────────────────────────────────────────────────
function LeaderboardRow({
  entry,
  rank,
  onClick,
}: {
  entry: LeaderboardEntry
  rank: number
  onClick: () => void
}) {
  const maxPossible = entry.partidos_jugados * 2 || 1
  const pct = Math.min((entry.total_points / maxPossible) * 100, 100)

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
    >
      {/* Rank */}
      <span className="w-6 text-center text-xs font-bold text-slate-400">{rank}</span>

      {/* Nombre + barra */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-slate-800 truncate">{entry.name}</p>
        <div className="mt-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-1 text-xs text-emerald-700 font-medium">
          <Star className="w-3 h-3" />
          {entry.exactos}
        </div>
        <div className="hidden sm:flex items-center gap-1 text-xs text-blue-700 font-medium">
          <Target className="w-3 h-3" />
          {entry.ganador_correcto}
        </div>
        <p className="font-display text-xl font-black text-slate-900 w-10 text-right">
          {entry.total_points}
        </p>
      </div>
    </button>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export function Leaderboard({ entries, matches }: LeaderboardProps) {
  const [selected, setSelected] = useState<LeaderboardEntry | null>(null)

  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)

  const played = matches.filter((m) => m.status === 'finished' || m.status === 'live').length
  const total = matches.length

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Progreso del torneo */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Progreso de la fase
            </span>
            <span className="text-xs font-bold text-slate-700">{played}/{total} partidos</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-field-600 rounded-full transition-all"
              style={{ width: `${(played / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Podio */}
        {top3.length >= 3 && <Podium top3={top3} onSelect={setSelected} />}

        {/* Divisor */}
        <div className="mx-4 my-3 border-t border-slate-100" />

        {/* Resto de la tabla */}
        <div className="divide-y divide-slate-50 pb-2">
          {rest.map((entry, i) => (
            <LeaderboardRow
              key={entry.participant_id}
              entry={entry}
              rank={i + 4}
              onClick={() => setSelected(entry)}
            />
          ))}
        </div>

        {/* Leyenda */}
        <div className="flex items-center justify-center gap-4 px-4 py-3 border-t border-slate-100 text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-emerald-500" /> Exactos</span>
          <span className="flex items-center gap-1"><Target className="w-3 h-3 text-blue-500" /> Solo ganador</span>
          <span>Tocá un nombre para ver su fixture</span>
        </div>
      </div>

      {/* Drawer */}
      {selected && (
        <ParticipantDrawer
          entry={selected}
          matches={matches}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
