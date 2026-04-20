'use client'

import { useEffect, useRef } from 'react'
import { useStore } from '@/store/useStore'

const STAGES = [
  { marker: '"title"',        label: 'Analyzing project' },
  { marker: '"instructions"', label: 'Planning build steps' },
  { marker: '"bom"',          label: 'Sourcing components' },
  { marker: '"customParts"',  label: 'Designing custom parts' },
  { marker: '"kicadFile"',    label: 'Generating schematic' },
  { marker: '"flowchart"',    label: 'Mapping build flow' },
]

function colorizeLine(line: string): React.ReactNode {
  // JSON key: "word":
  // JSON string value: "..."
  // numbers, booleans, null
  // brackets, punctuation

  const parts: React.ReactNode[] = []
  let i = 0

  while (i < line.length) {
    // JSON key pattern: "text":
    const keyMatch = line.slice(i).match(/^("[\w\s-]+")\s*:/)
    if (keyMatch) {
      parts.push(<span key={i} className="text-sky-400">{keyMatch[1]}</span>)
      parts.push(<span key={`${i}c`} className="text-slate-500">:</span>)
      i += keyMatch[0].length
      continue
    }

    // string value
    const strMatch = line.slice(i).match(/^"((?:[^"\\]|\\.)*)"/)
    if (strMatch) {
      parts.push(<span key={i} className="text-emerald-400">"{strMatch[1]}"</span>)
      i += strMatch[0].length
      continue
    }

    // number
    const numMatch = line.slice(i).match(/^-?\d+(\.\d+)?/)
    if (numMatch) {
      parts.push(<span key={i} className="text-amber-400">{numMatch[0]}</span>)
      i += numMatch[0].length
      continue
    }

    // boolean / null
    const boolMatch = line.slice(i).match(/^(true|false|null)/)
    if (boolMatch) {
      parts.push(<span key={i} className="text-violet-400">{boolMatch[0]}</span>)
      i += boolMatch[0].length
      continue
    }

    // brackets
    const ch = line[i]
    if ('{}[]'.includes(ch)) {
      parts.push(<span key={i} className="text-slate-500">{ch}</span>)
    } else if (','.includes(ch)) {
      parts.push(<span key={i} className="text-slate-600">{ch}</span>)
    } else {
      parts.push(<span key={i} className="text-slate-400">{ch}</span>)
    }
    i++
  }

  return <>{parts}</>
}

export function TerminalOverlay() {
  const { streamingText, streamingStage } = useStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Keep scrolled to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [streamingText])

  const lines = streamingText.split('\n')
  const visibleLines = lines.slice(-42)
  const totalLines = lines.length

  const completedStages = STAGES.filter((s) => streamingText.includes(s.marker))
  const currentStageIdx = completedStages.length
  const activeStage = STAGES[currentStageIdx]

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl flex gap-4 h-[600px]">

        {/* Stage sidebar */}
        <div className="w-52 shrink-0 flex flex-col gap-1 pt-10">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-3 font-mono">Progress</p>
          {STAGES.map((stage, i) => {
            const done = completedStages.some((s) => s.marker === stage.marker)
            const active = activeStage?.marker === stage.marker
            return (
              <div
                key={stage.marker}
                className={`flex items-center gap-2.5 text-xs font-mono py-1 transition-all duration-300 ${
                  done
                    ? 'text-emerald-400'
                    : active
                    ? 'text-white'
                    : 'text-slate-700'
                }`}
              >
                <span className={`shrink-0 w-4 text-center ${active ? 'animate-pulse' : ''}`}>
                  {done ? '✓' : active ? '›' : '○'}
                </span>
                <span className={done ? 'line-through decoration-emerald-800' : ''}>
                  {stage.label}
                </span>
              </div>
            )
          })}

          <div className="mt-auto pt-4 border-t border-white/5">
            <p className="text-[10px] text-slate-700 font-mono">{totalLines} lines</p>
            {streamingStage && (
              <p className="text-[10px] text-sky-700 font-mono mt-1 truncate">{streamingStage}</p>
            )}
          </div>
        </div>

        {/* Terminal window */}
        <div className="flex-1 flex flex-col border border-white/8 rounded-xl overflow-hidden bg-[#080808]">
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0d0d0d] shrink-0">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/70" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <div className="h-3 w-3 rounded-full bg-green-500/70" />
            </div>
            <span className="flex-1 text-center text-xs text-slate-600 font-mono">
              protoforge — generating project
            </span>
            <div className="w-12" />
          </div>

          {/* Text area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-5"
          >
            {streamingText === '' ? (
              <span className="text-slate-700">Connecting to Claude...</span>
            ) : (
              visibleLines.map((line, i) => {
                const isLast = i === visibleLines.length - 1
                const age = visibleLines.length - 1 - i
                const opacity =
                  age === 0 ? 'opacity-100' :
                  age < 5  ? 'opacity-80' :
                  age < 15 ? 'opacity-50' :
                             'opacity-25'
                return (
                  <div key={i} className={`whitespace-pre-wrap break-all ${opacity} transition-opacity duration-500`}>
                    {line === '' ? '\u00a0' : colorizeLine(line)}
                    {isLast && (
                      <span className="inline-block w-2 h-3.5 bg-sky-400 ml-0.5 animate-pulse align-middle" />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
