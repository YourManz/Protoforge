'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { startGeneration } from '@/lib/generation'
import { CircuitBackground } from '@/components/CircuitBackground'

const GEN_STAGES = [
  { marker: '"title"',        label: 'Analyzing project' },
  { marker: '"instructions"', label: 'Planning build steps' },
  { marker: '"bom"',          label: 'Sourcing components' },
  { marker: '"customParts"',  label: 'Custom parts' },
  { marker: '"kicadFile"',    label: 'Generating schematic' },
  { marker: '"flowchart"',    label: 'Mapping build flow' },
]

function colorizeLine(line: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let i = 0
  while (i < line.length) {
    const keyMatch = line.slice(i).match(/^("[\w\s-]+")\s*:/)
    if (keyMatch) {
      parts.push(<span key={i} className="text-sky-400">{keyMatch[1]}</span>)
      parts.push(<span key={`${i}c`} className="text-slate-500">:</span>)
      i += keyMatch[0].length; continue
    }
    const strMatch = line.slice(i).match(/^"((?:[^"\\]|\\.)*)"/)
    if (strMatch) {
      parts.push(<span key={i} className="text-emerald-400">"{strMatch[1]}"</span>)
      i += strMatch[0].length; continue
    }
    const numMatch = line.slice(i).match(/^-?\d+(\.\d+)?/)
    if (numMatch) {
      parts.push(<span key={i} className="text-amber-400">{numMatch[0]}</span>)
      i += numMatch[0].length; continue
    }
    const boolMatch = line.slice(i).match(/^(true|false|null)/)
    if (boolMatch) {
      parts.push(<span key={i} className="text-violet-400">{boolMatch[0]}</span>)
      i += boolMatch[0].length; continue
    }
    const ch = line[i]
    if ('{}[]'.includes(ch)) parts.push(<span key={i} className="text-slate-500">{ch}</span>)
    else if (ch === ',') parts.push(<span key={i} className="text-slate-600">{ch}</span>)
    else parts.push(<span key={i} className="text-slate-400">{ch}</span>)
    i++
  }
  return <>{parts}</>
}

function ClarifyPanel() {
  const {
    clarifications, clarificationAnswers, currentClarifyIdx,
    answerClarification, setCurrentClarifyIdx,
  } = useStore()
  const [customInput, setCustomInput] = useState('')
  const [selected, setSelected] = useState<number | null>(null)

  const q = clarifications[currentClarifyIdx]
  if (!q) return null

  const isLast = currentClarifyIdx === clarifications.length - 1

  function choose(answer: string) {
    answerClarification(q.id, answer)
    if (isLast) {
      startGeneration()
    } else {
      setSelected(null)
      setCustomInput('')
      setCurrentClarifyIdx(currentClarifyIdx + 1)
    }
  }

  return (
    <div className="border-t border-white/8 bg-[#0a0a0a] p-5 space-y-4">
      <div className="flex items-center gap-1.5">
        {clarifications.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i < currentClarifyIdx ? 'w-4 bg-emerald-500' :
              i === currentClarifyIdx ? 'w-4 bg-sky-400' :
              'w-1.5 bg-slate-700'
            }`}
          />
        ))}
        <span className="ml-2 text-[10px] text-slate-600 font-mono">
          {currentClarifyIdx + 1}/{clarifications.length}
        </span>
      </div>

      <div className="space-y-1">
        <p className="text-sm text-white font-medium">{q.question}</p>
        <p className="text-xs text-slate-500 leading-relaxed">{q.context}</p>
      </div>

      <div className="grid gap-2">
        {q.suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => { setSelected(i); choose(s.label) }}
            className={`text-left rounded-lg border px-4 py-3 transition-all duration-150 group ${
              selected === i
                ? 'border-sky-500 bg-sky-900/20 text-white'
                : 'border-white/8 bg-[#111] hover:border-sky-700/50 hover:bg-[#151515] text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs text-sky-600">[{i + 1}]</span>
              <span className="font-medium text-sm">{s.label}</span>
            </div>
            <p className="text-xs text-slate-500 mb-1.5 pl-5">{s.description}</p>
            <div className="flex gap-3 pl-5 text-[10px] font-mono">
              <span className="text-emerald-600">✓ {s.pros}</span>
              <span className="text-red-700">✗ {s.cons}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-2 items-center">
        <span className="text-slate-600 font-mono text-xs shrink-0">$</span>
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && customInput.trim() && choose(customInput.trim())}
          placeholder="or type a custom answer…"
          className="flex-1 bg-transparent border-b border-white/8 focus:border-sky-600 outline-none text-xs text-slate-300 placeholder:text-slate-700 py-1 transition-colors font-mono"
        />
        {customInput.trim() && (
          <button
            onClick={() => choose(customInput.trim())}
            className="text-sky-500 hover:text-sky-300 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export function TerminalOverlay() {
  const { streamingText, streamingStage, terminalPhase } = useStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [streamingText])

  const lines = streamingText.split('\n')
  const visibleLines = lines.slice(-42)
  const totalLines = lines.length
  const completedStages = GEN_STAGES.filter((s) => streamingText.includes(s.marker))
  const activeStage = GEN_STAGES[completedStages.length]

  const titles: Record<string, string> = {
    clarifying: 'protoforge — analyzing requirements',
    asking:     'protoforge — clarifying your project',
    generating: 'protoforge — generating project',
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
      <CircuitBackground />
      <div className="relative w-full max-w-4xl flex gap-4" style={{ height: terminalPhase === 'asking' ? 'auto' : '600px', maxHeight: '90vh' }}>

        {terminalPhase === 'generating' && (
          <div className="w-52 shrink-0 flex flex-col gap-1 pt-10">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-3 font-mono">Progress</p>
            {GEN_STAGES.map((stage) => {
              const done = completedStages.some((s) => s.marker === stage.marker)
              const active = activeStage?.marker === stage.marker
              return (
                <div key={stage.marker} className={`flex items-center gap-2.5 text-xs font-mono py-1 transition-all duration-300 ${done ? 'text-emerald-400' : active ? 'text-white' : 'text-slate-700'}`}>
                  <span className={`shrink-0 w-4 text-center ${active ? 'animate-pulse' : ''}`}>
                    {done ? '✓' : active ? '›' : '○'}
                  </span>
                  <span className={done ? 'line-through decoration-emerald-800' : ''}>{stage.label}</span>
                </div>
              )
            })}
            <div className="mt-auto pt-4 border-t border-white/5">
              <p className="text-[10px] text-slate-700 font-mono">{totalLines} lines</p>
              {streamingStage && <p className="text-[10px] text-sky-700 font-mono mt-1 truncate">{streamingStage}</p>}
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col border border-white/8 rounded-xl overflow-hidden bg-[#080808]">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0d0d0d] shrink-0">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/70" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <div className="h-3 w-3 rounded-full bg-green-500/70" />
            </div>
            <span className="flex-1 text-center text-xs text-slate-600 font-mono">
              {titles[terminalPhase] ?? 'protoforge'}
            </span>
            <div className="w-12" />
          </div>

          <div ref={scrollRef} className={`overflow-y-auto p-4 font-mono text-xs leading-5 ${terminalPhase === 'asking' ? 'h-32' : 'flex-1'}`}>
            {streamingText === '' ? (
              <span className="text-slate-700">
                {terminalPhase === 'clarifying' ? 'Analyzing your project...' : 'Connecting to Claude...'}
                <span className="inline-block w-2 h-3.5 bg-sky-400 ml-0.5 animate-pulse align-middle" />
              </span>
            ) : (
              visibleLines.map((line, i) => {
                const isLast = i === visibleLines.length - 1
                const age = visibleLines.length - 1 - i
                const opacity = age === 0 ? 'opacity-100' : age < 5 ? 'opacity-80' : age < 15 ? 'opacity-50' : 'opacity-25'
                return (
                  <div key={i} className={`whitespace-pre-wrap break-all ${opacity} transition-opacity duration-500`}>
                    {line === '' ? '\u00a0' : colorizeLine(line)}
                    {isLast && <span className="inline-block w-2 h-3.5 bg-sky-400 ml-0.5 animate-pulse align-middle" />}
                  </div>
                )
              })
            )}
          </div>

          {terminalPhase === 'asking' && <ClarifyPanel />}
        </div>
      </div>
    </div>
  )
}
