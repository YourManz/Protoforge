'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, AlertTriangle, Wrench } from 'lucide-react'
import type { Step } from '@/types/project'

export function InstructionList({ steps }: { steps: Step[] }) {
  const [open, setOpen] = useState<Set<number>>(new Set([0]))

  function toggle(n: number) {
    setOpen((prev) => {
      const next = new Set(prev)
      next.has(n) ? next.delete(n) : next.add(n)
      return next
    })
  }

  return (
    <div className="space-y-2">
      {steps.map((step) => {
        const isOpen = open.has(step.number - 1)
        return (
          <div
            key={step.number}
            className="rounded-lg border border-slate-700/50 overflow-hidden"
          >
            <button
              onClick={() => toggle(step.number - 1)}
              className="w-full flex items-center gap-4 px-5 py-4 bg-slate-900 hover:bg-slate-800/60 transition-colors text-left"
            >
              <span className="flex-shrink-0 h-7 w-7 rounded-full bg-blue-600/20 border border-blue-600/40 text-blue-400 text-sm font-bold flex items-center justify-center">
                {step.number}
              </span>
              <span className="flex-1 font-medium text-white text-sm">{step.title}</span>
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
              )}
            </button>

            {isOpen && (
              <div className="px-5 pb-5 pt-3 bg-slate-900/50 space-y-4 border-t border-slate-700/50">
                <p className="text-sm text-slate-300 leading-relaxed">{step.description}</p>

                {step.warning && (
                  <div className="flex gap-2.5 bg-amber-900/20 border border-amber-800/30 rounded-lg px-4 py-3">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-300">{step.warning}</p>
                  </div>
                )}

                {step.tools && step.tools.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Wrench className="h-3.5 w-3.5 text-slate-500" />
                    {step.tools.map((t) => (
                      <span key={t} className="text-xs px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {step.subSteps && step.subSteps.length > 0 && (
                  <ol className="space-y-2 ml-2">
                    {step.subSteps.map((s, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="text-slate-600 shrink-0 mt-0.5">{i + 1}.</span>
                        <span className="text-slate-400 leading-relaxed">{s}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
