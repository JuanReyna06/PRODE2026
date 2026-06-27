import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useEffect } from 'react'
import type { KnockoutMatch } from '@/types'

// ── Banderas via flagcdn ──────────────────────────────────────────────────────
const FLAG_MAP: Record<string, string> = {
  ARG: 'ar', BRA: 'br', FRA: 'fr', ESP: 'es', ALE: 'de', ING: 'gb-eng',
  POR: 'pt', PBA: 'nl', BEL: 'be', URU: 'uy', COL: 'co', MEX: 'mx',
  USA: 'us', CAN: 'ca', AUS: 'au', JAP: 'jp', COR: 'kr', SUI: 'ch',
  CRO: 'hr', SEN: 'sn', MAR: 'ma', NOR: 'no', SUE: 'se', DIN: 'dk',
  POL: 'pl', AUT: 'at', ECU: 'ec', TUR: 'tr', SUD: 'za', GHA: 'gh',
  CMR: 'cm', TUN: 'tn', NZE: 'nz', IRA: 'ir', IRK: 'iq', SAU: 'sa',
  QAT: 'qa', PAR: 'py', BIH: 'ba', CMA: 'ci', SCO: 'gb-sct', HAI: 'ht',
  CVE: 'cv', CGO: 'cd', UZB: 'uz', JOR: 'jo', AGL: 'dz', EGI: 'eg',
  PAN: 'pa', CUR: 'cw', CZE: 'cz', SUE2: 'se',
}

function Flag({ code, size = 24 }: { code: string | null; size?: number }) {
  if (!code || !FLAG_MAP[code]) return (
    <div style={{ width: size, height: size * 0.67 }}
      className="bg-slate-200 rounded-sm flex items-center justify-center">
      <span className="text-[8px] text-slate-400">?</span>
    </div>
  )
  return (
    <img
      src={`https://flagcdn.com/w40/${FLAG_MAP[code]}.png`}
      alt={code}
      style={{ width: size, height: size * 0.67 }}
      className="rounded-sm object-cover"
    />
  )
}

// ── Drawer de predicciones de un partido ─────────────────────────────────────
interface MatchPred {
  participant_name: string
  pred_home: number | null
  pred_away: number | null
  pred_winner: string | null
  pred_qualifier: string | null
  pts_goles: number | null
  pts_ganador: number | null
  pts_clasificado: number | null
}

function KnockoutDrawer({
  match,
  onClose,
}: {
  match: KnockoutMatch
  onClose: () => void
}) {
  const [preds, setPreds] = useState<MatchPred[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('knockout_points')
      .select('participant_id, pred_home, pred_away, pred_winner, pred_qualifier, pts_goles, pts_ganador, pts_clasificado')
      .eq('match_id', match.id)
      .then(async ({ data }) => {
        if (!data || data.length === 0) { setLoading(false); return }
        const ids = data.map((d: any) => d.participant_id)
        const { data: parts } = await supabase.from('participants').select('id, name').in('id', ids)
        const nameMap = Object.fromEntries((parts ?? []).map((p: any) => [p.id, p.name]))
        setPreds(data.map((d: any) => ({
          participant_name: nameMap[d.participant_id] ?? '—',
          pred_home: d.pred_home,
          pred_away: d.pred_away,
          pred_winner: d.pred_winner,
          pred_qualifier: d.pred_qualifier,
          pts_goles: d.pts_goles,
          pts_ganador: d.pts_ganador,
          pts_clasificado: d.pts_clasificado,
        })).sort((a: MatchPred, b: MatchPred) => {
          const ptsA = (a.pts_goles ?? 0) + (a.pts_ganador ?? 0) + (a.pts_clasificado ?? 0)
          const ptsB = (b.pts_goles ?? 0) + (b.pts_ganador ?? 0) + (b.pts_clasificado ?? 0)
          return ptsB - ptsA
        }))
        setLoading(false)
      })
  }, [match.id])

  const played = match.status === 'finished' || match.status === 'live'
  const homeLabel = match.home_label ?? match.home_code ?? '?'
  const awayLabel = match.away_label ?? match.away_code ?? '?'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Flag code={match.home_code} size={28} />
            <div className="text-center">
              {played ? (
                <p className="font-black text-xl text-slate-900">
                  {match.result_home} - {match.result_away}
                  {match.penalty_winner && (
                    <span className="text-xs font-medium text-slate-400 ml-1">(pen)</span>
                  )}
                </p>
              ) : (
                <p className="text-xs font-bold text-slate-400">vs</p>
              )}
            </div>
            <Flag code={match.away_code} size={28} />
          </div>
          <div className="text-center flex-1 px-2">
            <p className="text-xs font-bold text-slate-700">{homeLabel}</p>
            <p className="text-[10px] text-slate-400">vs</p>
            <p className="text-xs font-bold text-slate-700">{awayLabel}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Leyenda de puntos */}
        <div className="flex gap-3 px-4 py-2 bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />Goles</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" />Ganador</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />Clasifica</span>
          <span className="ml-auto font-bold">Máx 3pts</span>
        </div>

        {/* Lista de predicciones */}
        <div className="overflow-y-auto flex-1 p-3 space-y-1.5">
          {loading ? (
            <p className="text-center text-slate-400 py-8 text-sm">Cargando predicciones...</p>
          ) : preds.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">Sin predicciones cargadas aún</p>
          ) : (
            preds.map((p) => {
              const total = (p.pts_goles ?? 0) + (p.pts_ganador ?? 0) + (p.pts_clasificado ?? 0)
              return (
                <div key={p.participant_name} className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2',
                  played && total === 3 && 'bg-emerald-50',
                  played && total === 2 && 'bg-blue-50',
                  played && total === 1 && 'bg-amber-50',
                  played && total === 0 && 'bg-red-50/40',
                  !played && 'bg-slate-50',
                )}>
                  <span className="text-xs font-semibold text-slate-700 w-24 truncate">{p.participant_name}</span>
                  
                  {/* Predicción marcador */}
                  <span className="text-xs font-bold text-slate-800 w-10 text-center">
                    {p.pred_home ?? '?'}-{p.pred_away ?? '?'}
                  </span>

                  {/* Quien pasa */}
                  <div className="flex items-center gap-1 flex-1">
                    <Flag code={p.pred_qualifier} size={14} />
                    <span className="text-[10px] text-slate-500 truncate">{p.pred_qualifier ?? '?'}</span>
                  </div>

                  {/* Puntos desglosados */}
                  {played ? (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                        p.pts_goles === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400')}>
                        {p.pts_goles ?? 0}
                      </span>
                      <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                        p.pts_ganador === 1 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400')}>
                        {p.pts_ganador ?? 0}
                      </span>
                      <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                        p.pts_clasificado === 1 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400')}>
                        {p.pts_clasificado ?? 0}
                      </span>
                      <span className="ml-1 text-sm font-black text-slate-900 w-4 text-right">{total}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-300">pendiente</span>
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

// ── Tarjeta de partido ────────────────────────────────────────────────────────
function MatchCard({
  match,
  onClick,
}: {
  match: KnockoutMatch
  onClick: () => void
}) {
  const played = match.status === 'finished' || match.status === 'live'
  const homeLabel = match.home_label ?? match.home_code ?? '?'
  const awayLabel = match.away_label ?? match.away_code ?? '?'
  const isDefined = match.home_code && match.away_code

  return (
    <button
      onClick={isDefined ? onClick : undefined}
      className={cn(
        'w-full bg-white rounded-xl border shadow-sm p-2.5 text-left transition-all',
        isDefined
          ? 'border-slate-200 hover:border-slate-300 hover:shadow-md active:scale-[0.98] cursor-pointer'
          : 'border-dashed border-slate-200 opacity-60 cursor-default',
        match.status === 'live' && 'border-red-300 ring-1 ring-red-200',
      )}
    >
      {/* Local */}
      <div className="flex items-center gap-2 mb-1.5">
        <Flag code={match.home_code} size={20} />
        <span className={cn(
          'text-xs font-semibold flex-1 truncate',
          played && match.penalty_winner === match.home_code && 'text-emerald-700',
          played && match.result_home !== null && match.result_home > (match.result_away ?? 0) && !match.penalty_winner && 'text-emerald-700',
        )}>
          {homeLabel}
        </span>
        {played && (
          <span className="text-sm font-black text-slate-900">{match.result_home}</span>
        )}
      </div>

      {/* Visitante */}
      <div className="flex items-center gap-2">
        <Flag code={match.away_code} size={20} />
        <span className={cn(
          'text-xs font-semibold flex-1 truncate',
          played && match.penalty_winner === match.away_code && 'text-emerald-700',
          played && match.result_away !== null && match.result_away > (match.result_home ?? 0) && !match.penalty_winner && 'text-emerald-700',
        )}>
          {awayLabel}
        </span>
        {played && (
          <span className="text-sm font-black text-slate-900">{match.result_away}</span>
        )}
      </div>

      {/* Estado */}
      <div className="mt-1.5 flex justify-between items-center">
        {match.penalty_winner && (
          <span className="text-[9px] text-slate-400 font-medium">Def. por penales</span>
        )}
        {match.status === 'live' && (
          <Badge variant="live" className="text-[9px] px-1.5 animate-pulse">En vivo</Badge>
        )}
        {isDefined && !played && (
          <span className="text-[9px] text-slate-300 ml-auto">Tocá para ver predicciones</span>
        )}
      </div>
    </button>
  )
}

// ── Ronda ─────────────────────────────────────────────────────────────────────
function RoundSection({
  title,
  matches,
  onSelect,
}: {
  title: string
  matches: KnockoutMatch[]
  onSelect: (m: KnockoutMatch) => void
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">{title}</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} onClick={() => onSelect(m)} />
        ))}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export function KnockoutBracket({ matches }: { matches: KnockoutMatch[] }) {
  const [selected, setSelected] = useState<KnockoutMatch | null>(null)

  const byRound = {
    R16: matches.filter((m) => m.round === 'R16'),
    QF:  matches.filter((m) => m.round === 'QF'),
    SF:  matches.filter((m) => m.round === 'SF'),
    F:   matches.filter((m) => m.round === 'F'),
  }

  const playedCount = matches.filter((m) => m.status === 'finished').length

  return (
    <>
      <div className="space-y-6">
        {/* Stats rápido */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center justify-between">
          <span className="text-xs text-slate-500">Fase eliminatoria</span>
          <span className="text-xs font-bold text-slate-700">{playedCount} partidos jugados</span>
        </div>
        <div className="mt-4">
          <span>TOY LABURANDO</span>
          
        </div>

        {byRound.R16.length > 0 && (
          <RoundSection title="16avos de final" matches={byRound.R16} onSelect={setSelected} />
        )}
        {byRound.QF.length > 0 && (
          <RoundSection title="Cuartos de final" matches={byRound.QF} onSelect={setSelected} />
        )}
        {byRound.SF.length > 0 && (
          <RoundSection title="Semifinales" matches={byRound.SF} onSelect={setSelected} />
        )}
        {byRound.F.length > 0 && (
          <RoundSection title="Final" matches={byRound.F} onSelect={setSelected} />
        )}
      </div>

      {selected && (
        <KnockoutDrawer match={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}