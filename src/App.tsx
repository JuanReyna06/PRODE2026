import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, CalendarDays, RefreshCw } from 'lucide-react'
import { useProdeData } from '@/hooks/useProdeData'
import { Leaderboard } from '@/components/Leaderboard'
import { MatchesList } from '@/components/MatchesList'
import { formatLastUpdate } from '@/lib/utils'
import { useState } from 'react'
export default function App() {
  const { leaderboard, matches, loading, lastUpdate, hasLive, refetch } = useProdeData()
  const [syncing, setSyncing] = useState(false)

  async function handleRefresh() {
    setSyncing(true)
  try {
    await fetch('/api/sync', { method: 'POST' })
  } catch {}
  await refetch()
  setSyncing(false)
  } 

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-slate-50">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin" />
        </div>
        <p className="font-display text-lg font-bold text-slate-600 uppercase tracking-wide">
          Cargando Prode...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚽</span>
            <div>
              <h1 className="font-display text-lg font-black uppercase tracking-wider leading-none">
                Prode Mundial 2026
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {lastUpdate && `Actualizado ${formatLastUpdate(lastUpdate)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasLive && (
              <div className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                En Vivo
              </div>
            )}
              <button
                onClick={handleRefresh}
                disabled={syncing}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
                title={syncing ? 'Sincronizando...' : 'Actualizar resultados'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        <Tabs defaultValue="posiciones">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="posiciones" className="font-semibold text-sm">
              <Trophy className="w-4 h-4 mr-1.5" />
              Posiciones
            </TabsTrigger>
            <TabsTrigger value="partidos" className="font-semibold text-sm">
              <CalendarDays className="w-4 h-4 mr-1.5" />
              Partidos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posiciones">
            <Leaderboard entries={leaderboard} matches={matches} />
          </TabsContent>

          <TabsContent value="partidos">
            <MatchesList matches={matches} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
