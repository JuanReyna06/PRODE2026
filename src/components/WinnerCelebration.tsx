import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

// Confetti particle
interface Particle {
  id: number
  x: number
  delay: number
  duration: number
  color: string
  size: number
  shape: 'rect' | 'circle'
}

const COLORS = [
  '#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4',
  '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
]

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 6 + Math.random() * 8,
    shape: Math.random() > 0.5 ? 'rect' : 'circle',
  }))
}

const PARTICLES = generateParticles(80)

// Podio de ganadores — editá estos datos cuando cambien
const WINNERS = [
  { place: 1, emoji: '🥇', name: 'Anto y Valen', pts: 56, color: 'from-yellow-400 to-amber-500' },
  { place: 2, emoji: '🥈', name: 'India y Ema',  pts: 55, color: 'from-slate-300 to-slate-400' },
  { place: 3, emoji: '🥉', name: 'Pablito',       pts: 54, color: 'from-orange-300 to-orange-400' },
]

export function WinnerCelebration() {
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    // Mostrar después de 600ms para que la app cargue primero
    const t = setTimeout(() => setVisible(true), 600)
    return () => clearTimeout(t)
  }, [])

  function close() {
    setClosing(true)
    setTimeout(() => setVisible(false), 300)
  }

  if (!visible) return null

  return (
    <>
      {/* Confetti */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute top-0 animate-confetti"
            style={{
              left: `${p.x}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          >
            <div
              style={{
                width: p.size,
                height: p.shape === 'rect' ? p.size * 0.5 : p.size,
                backgroundColor: p.color,
                borderRadius: p.shape === 'circle' ? '50%' : '2px',
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Modal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
          closing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />

        {/* Card */}
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
          {/* Header degradado */}
          <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 px-6 pt-8 pb-6 text-center">
            <button
              onClick={close}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-5xl mb-2 animate-bounce">🏆</div>
            <h2 className="font-display text-2xl font-black text-white uppercase tracking-widest">
              ¡Terminó la fase de grupos!
            </h2>
            <p className="text-blue-200 text-sm mt-1">Prode Mundial 2026</p>
          </div>

          {/* Podio */}
          <div className="px-5 py-5 space-y-3">
            {WINNERS.map((w) => (
              <div
                key={w.place}
                className={`flex items-center gap-3 rounded-2xl bg-gradient-to-r ${w.color} p-3 shadow-sm`}
              >
                <span className="text-3xl">{w.emoji}</span>
                <div className="flex-1">
                  <p className="font-black text-white text-base leading-none">{w.name}</p>
                  <p className="text-white/80 text-xs mt-0.5">Puesto {w.place}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-black text-white leading-none">{w.pts}</p>
                  <p className="text-white/70 text-[10px]">pts</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 pb-5">
            <p className="text-center text-xs text-slate-400 mb-3">
              ¡Ahora viene la fase eliminatoria! 🔥
            </p>
            <button
              onClick={close}
              className="w-full bg-gradient-to-r from-slate-900 to-blue-900 text-white font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity"
            >
              Ver tabla completa
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
