'use client'

import { useMemo } from 'react'

function seededRng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 0x100000000
  }
}

type TraceData = {
  d: string
  animClass: string
  delay: string
  baseColor: string
  pulseColor: string
}

export function CircuitBackground() {
  const { traces, nodes } = useMemo(() => {
    const rng = seededRng(42)
    const W = 1400, H = 900, STEP = 80

    const allNodes: { x: number; y: number }[] = []
    for (let y = STEP; y < H; y += STEP) {
      for (let x = STEP; x < W; x += STEP) {
        if (rng() > 0.45) allNodes.push({ x, y })
      }
    }

    const palette = [
      { base: '#082f49', pulse: '#38bdf8' },
      { base: '#052e16', pulse: '#34d399' },
      { base: '#2e1065', pulse: '#a78bfa' },
    ]

    const traces: TraceData[] = []
    for (let i = 0; i < 42; i++) {
      const a = allNodes[Math.floor(rng() * allNodes.length)]
      const b = allNodes[Math.floor(rng() * allNodes.length)]
      if (!a || !b || a === b) continue

      const corner = rng() > 0.5 ? { x: b.x, y: a.y } : { x: a.x, y: b.y }
      const dist =
        Math.abs(corner.x - a.x) + Math.abs(corner.y - a.y) +
        Math.abs(b.x - corner.x) + Math.abs(b.y - corner.y)
      if (dist < STEP * 1.5) continue

      const c = palette[Math.floor(rng() * palette.length)]
      traces.push({
        d: `M ${a.x} ${a.y} L ${corner.x} ${corner.y} L ${b.x} ${b.y}`,
        animClass: `circuit-pulse-${i % 5}`,
        delay: `${(rng() * 6).toFixed(2)}s`,
        baseColor: c.base,
        pulseColor: c.pulse,
      })
    }

    return { traces, nodes: allNodes }
  }, [])

  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-25 pointer-events-none"
      viewBox="0 0 1400 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <filter id="cf-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {traces.map((t, i) => (
        <path
          key={`b${i}`}
          d={t.d}
          fill="none"
          stroke={t.baseColor}
          strokeWidth="1"
          opacity="0.8"
        />
      ))}

      {traces.map((t, i) => (
        <path
          key={`p${i}`}
          d={t.d}
          fill="none"
          stroke={t.pulseColor}
          strokeWidth="2"
          strokeDasharray="16 1400"
          filter="url(#cf-glow)"
          style={{ animationDelay: t.delay }}
          className={t.animClass}
        />
      ))}

      {nodes.map((n, i) => (
        <circle
          key={`n${i}`}
          cx={n.x}
          cy={n.y}
          r="2.5"
          fill="#0f172a"
          stroke="#1e3a5f"
          strokeWidth="1"
          opacity="0.5"
        />
      ))}
    </svg>
  )
}
