import { useState } from 'react'
import type { KnockoutLeaderboardEntry, KnockoutMatch } from '@/types'
import { useParticipantKnockoutPredictions } from '@/hooks/useProdeData'
import { X, Target, Trophy, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Drawer de detalle ─────────────────────────────────────────────────────────
function KnockoutParticipantDrawer({
  entry,
  matches,
  onClose,
}: {
  entry: KnockoutLeaderboardEntry
  matches: KnockoutMatch[]
  onClose: () => void
}) {
  const { predictions, loading } = useParticipantKnockoutPredictions(entry.participant_id)
  const predMap = Object.fromEntries(predictions.map((p) => [p.match_id, p]))

  const playedMatches = matches.filter(
    (m) => m.status === 'finished' || m.status === 'live'
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <p className="font-display text-xl font-bold text-slate-900 uppercase tracking-wide">
              {entry.name}
            </p>
            <p className="text-sm text-slate-500 mt-0.5">
              {entry.total_points} pts · {entry.goles_exactos} goles · {entry.ganador_correcto} ganador · {entry.clasificado_correcto} clasif.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {loading ? (
            <p className="text-center text-slate-400 py-8">Cargando...</p>
          ) : playedMatches.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">Sin partidos jugados aún</p>
          ) : (
            playedMatches.map((m) => {
              const pred = predMap[m.id]
              const total = pred
                ? (pred.pts_goles ?? 0) + (pred.pts_ganador ?? 0) + (pred.pts_clasificado ?? 0)
                : null
              const homeLabel = m.home_label ?? m.home_code ?? '?'
              const awayLabel = m.away_label ?? m.away_code ?? '?'

              return (
                <div
                  key={m.id}
                  className={cn(
                    'rounded-xl p-3 text-sm',
                    total === 3 && 'bg-emerald-50',
                    total === 2 && 'bg-blue-50',
                    total === 1 && 'bg-amber-50',
                    total === 0 && 'bg-red-50/50',
                    total === null && 'bg-slate-50',
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-slate-700 text-xs">
                      {homeLabel} vs {awayLabel}
                    </span>
                    {total !== null && (
                      <span className="font-black text-slate-900">{total} pts</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>
                      Resultado: <b className="text-slate-800">{m.result_home}-{m.result_away}</b>
                      {m.penalty_winner && <span className="text-slate-400 ml-1">(pen)</span>}
                    </span>
                    {pred ? (
                      <span>
                        Pred: <b className="text-slate-800">{pred.pred_home}-{pred.pred_away}</b>
                      </span>
                    ) : (
                      <span className="text-slate-300">Sin predicción</span>
                    )}
                  </div>

                  {pred && (
                    <div className="flex gap-2 mt-1.5">
                      <span className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full font-medium',
                        pred.pts_goles === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                      )}>
                        Goles {pred.pts_goles === 1 ? '✓' : '✗'}
                      </span>
                      <span className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full font-medium',
                        pred.pts_ganador === 1 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
                      )}>
                        Ganador {pred.pts_ganador === 1 ? '✓' : '✗'}
                      </span>
                      <span className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full font-medium',
                        pred.pts_clasificado === 1 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
                      )}>
                        Clasifica {pred.pts_clasificado === 1 ? '✓' : '✗'}
                      </span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// ── Podio ─────────────────────────────────────────────────────────────────────
function Podium({
  top3,
  onSelect,
}: {
  top3: KnockoutLeaderboardEntry[]
  onSelect: (e: KnockoutLeaderboardEntry) => void
}) {
  const order = [top3[1], top3[0], top3[2]]
  const heights = ['h-20', 'h-28', 'h-14']
  const medals = ['🥈', '🥇', '🥉']
  const colors = [
    'from-slate-200 to-slate-300 border-slate-300',
    'from-yellow-200 to-amber-300 border-amber-300',
    'from-orange-100 to-orange-200 border-orange-300',
  ]

  return (
    <div className="flex items-end justify-center gap-2 px-4 pt-6 pb-2">
      {order.map((entry, i) => {
        if (!entry) return <div key={i} className="flex-1" />
        return (
          <button
            key={entry.participant_id}
            onClick={() => onSelect(entry)}
            className="flex-1 flex flex-col items-center gap-1 group"
          >
            <p className="text-xs font-bold text-slate-700 text-center leading-tight px-1 truncate w-full">
              {entry.name}
            </p>
            <p className="font-display text-2xl font-black text-slate-900 leading-none">
              {entry.total_points}
            </p>
            <p className="text-[10px] text-slate-400 font-medium -mt-1">pts</p>
            <div className={cn(
              'w-full rounded-t-lg border-t-2 border-x-2 bg-gradient-to-b flex items-center justify-center transition-all group-hover:brightness-95',
              heights[i], colors[i]
            )}>
              <span className="text-2xl">{medals[i]}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── Fila ──────────────────────────────────────────────────────────────────────
function Row({
  entry,
  rank,
  onClick,
}: {
  entry: KnockoutLeaderboardEntry
  rank: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
    >
      <span className="w-6 text-center text-xs font-bold text-slate-400">{rank}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-slate-800 truncate">{entry.name}</p>
        <div className="mt-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700"
            style={{ width: `${Math.min((entry.total_points / (entry.partidos_jugados * 3 || 1)) * 100, 100)}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-1 text-xs text-emerald-700 font-medium">
          <Star className="w-3 h-3" />{entry.goles_exactos}
        </div>
        <div className="hidden sm:flex items-center gap-1 text-xs text-blue-700 font-medium">
          <Target className="w-3 h-3" />{entry.clasificado_correcto}
        </div>
        <p className="font-display text-xl font-black text-slate-900 w-10 text-right">
          {entry.total_points}
        </p>
      </div>
    </button>
  )
}

// ── Principal ─────────────────────────────────────────────────────────────────
export function KnockoutLeaderboard({
  entries,
  matches,
}: {
  entries: KnockoutLeaderboardEntry[]
  matches: KnockoutMatch[]
}) {
  const [selected, setSelected] = useState<KnockoutLeaderboardEntry | null>(null)

  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)
  const played = matches.filter((m) => m.status === 'finished' || m.status === 'live').length

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Progreso */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Trophy className="w-3 h-3" /> Fase eliminatoria
            </span>
            <span className="text-xs font-bold text-slate-700">{played}/63 partidos</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all"
              style={{ width: `${(played / 63) * 100}%` }}
            />
          </div>
        </div>

        {top3.length >= 3 && <Podium top3={top3} onSelect={setSelected} />}

        <div className="mx-4 my-3 border-t border-slate-100" />

        <div className="divide-y divide-slate-50 pb-2">
          {rest.map((entry, i) => (
            <Row
              key={entry.participant_id}
              entry={entry}
              rank={i + 4}
              onClick={() => setSelected(entry)}
            />
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 px-4 py-3 border-t border-slate-100 text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-emerald-500" />Goles exactos</span>
          <span className="flex items-center gap-1"><Target className="w-3 h-3 text-blue-500" />Clasificado</span>
          <span>Tocá para ver detalle</span>
        </div>
      </div>

      {selected && (
        <KnockoutParticipantDrawer
          entry={selected}
          matches={matches}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
