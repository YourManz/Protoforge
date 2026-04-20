'use client'

import { useEffect, useRef, useState } from 'react'

interface FlowChartProps {
  definition: string
}

export function FlowChart({ definition }: FlowChartProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ref.current || !definition) return

    let cancelled = false

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            background: '#0f172a',
            primaryColor: '#1e3a5f',
            primaryTextColor: '#e2e8f0',
            primaryBorderColor: '#3b82f6',
            lineColor: '#64748b',
            secondaryColor: '#1e293b',
            tertiaryColor: '#0f172a',
          },
        })

        const id = `mermaid-${Date.now()}`
        const { svg } = await mermaid.render(id, definition)
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg
          const svgEl = ref.current.querySelector('svg')
          if (svgEl) {
            svgEl.style.width = '100%'
            svgEl.style.maxWidth = '100%'
            svgEl.style.height = 'auto'
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Diagram render failed')
      }
    }

    render()
    return () => { cancelled = true }
  }, [definition])

  if (error) {
    return (
      <div className="text-xs text-slate-500 bg-slate-800/50 rounded-lg p-4 font-mono whitespace-pre-wrap">
        {definition}
      </div>
    )
  }

  return <div ref={ref} className="w-full overflow-x-auto" />
}
