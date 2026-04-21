'use client'

import { useState } from 'react'
import { X, Loader2, Lightbulb, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SuggestionCard } from '@/components/SuggestionCard'
import { useStore } from '@/store/useStore'
import { generateSuggestions } from '@/lib/claude'
import { startGeneration } from '@/lib/generation'
import type { BuilderProfile, ProjectSuggestion } from '@/types/project'

const TOOLS = [
  { id: 'screwdriver',    label: 'Screwdriver & drill' },
  { id: 'soldering',      label: 'Soldering iron' },
  { id: 'multimeter',     label: 'Multimeter' },
  { id: '3d_printer',     label: '3D printer' },
  { id: 'laser_cutter',   label: 'Laser cutter' },
  { id: 'cnc',            label: 'CNC machine' },
  { id: 'oscilloscope',   label: 'Oscilloscope' },
  { id: 'heat_gun',       label: 'Heat gun' },
  { id: 'breadboard',     label: 'Breadboard & prototyping' },
  { id: 'woodworking',    label: 'Woodworking tools' },
  { id: 'power_tools',    label: 'Power tools' },
  { id: 'sewing',         label: 'Sewing machine' },
]

const INTERESTS = [
  'IoT & Smart home', 'Robotics', 'Audio & music', 'Gaming & controllers',
  'Environmental sensing', 'Garden & agriculture', 'Photography & video',
  'Wearables', 'LED & displays', 'Security & access', 'Energy & solar',
  'Retro computing', 'Automotive', '3D printing', 'CNC & machining',
  'Amateur radio', 'Home automation', 'Biohacking',
]

function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
        active
          ? 'border-sky-500 bg-sky-900/30 text-sky-300'
          : 'border-white/8 bg-transparent text-slate-500 hover:border-white/20 hover:text-slate-300'
      }`}
    >
      {children}
    </button>
  )
}

type Step = 'form' | 'results'

export function ProjectSuggester() {
  const { suggesterOpen, setSuggesterOpen, apiKey, suggestions, setSuggestions, suggestionsLoading, setSuggestionsLoading, suggestionsError, setSuggestionsError } = useStore()
  const { setIsGenerating, setGenerationError, resetStreaming, setPendingPrompt, setClarifications, resetClarify } = useStore()

  const [step, setStep] = useState<Step>('form')
  const [goal, setGoal] = useState<'learn' | 'build'>('build')
  const [budget, setBudget] = useState(100)
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [tools, setTools] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])

  function toggle<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]
  }

  async function handleSubmit() {
    if (!apiKey) return
    setSuggestionsLoading(true)
    setSuggestionsError(null)
    setStep('results')

    const profile: BuilderProfile = {
      goal,
      budget,
      experience,
      tools: tools.map((id) => TOOLS.find((t) => t.id === id)?.label ?? id),
      interests,
    }

    let accumulated = ''
    try {
      const results = await generateSuggestions(profile, apiKey, (chunk) => {
        accumulated += chunk
        const matches = accumulated.match(/\{[\s\S]*?"fullPrompt"[\s\S]*?\}/g) ?? []
        if (matches.length > 0) {
          try {
            const partial = matches.map(m => JSON.parse(m) as ProjectSuggestion)
            setSuggestions(partial)
            setSuggestionsLoading(partial.length < 5)
          } catch { /* incomplete JSON — wait for more */ }
        }
      })
      setSuggestions(results)
    } catch (err) {
      setSuggestionsError(err instanceof Error ? err.message : 'Failed to generate suggestions')
    } finally {
      setSuggestionsLoading(false)
    }
  }

  function handleGenerate(fullPrompt: string) {
    setSuggesterOpen(false)
    resetStreaming()
    resetClarify()
    setPendingPrompt(fullPrompt)
    setClarifications([])
    setIsGenerating(true)
    setGenerationError(null)
    startGeneration()
  }

  if (!suggesterOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <span className="font-semibold text-white">Project Ideas</span>
            {step === 'results' && (
              <button onClick={() => setStep('form')} className="text-xs text-slate-500 hover:text-slate-300 transition-colors ml-2">
                ← back
              </button>
            )}
          </div>
          <button onClick={() => setSuggesterOpen(false)} className="text-slate-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 'form' && (
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-7">
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300">What&apos;s your goal?</label>
                <div className="flex gap-2">
                  <ToggleBtn active={goal === 'learn'} onClick={() => setGoal('learn')}>📚 Learn & experiment</ToggleBtn>
                  <ToggleBtn active={goal === 'build'} onClick={() => setGoal('build')}>🔧 Build something real</ToggleBtn>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300">Experience level</label>
                <div className="flex gap-2">
                  {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
                    <ToggleBtn key={lvl} active={experience === lvl} onClick={() => setExperience(lvl)}>
                      {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                    </ToggleBtn>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300">
                  Budget: <span className="text-sky-400 font-mono">${budget}</span>
                </label>
                <input
                  type="range"
                  min={10} max={500} step={10}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-sky-500"
                />
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>$10</span><span>$100</span><span>$250</span><span>$500</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300">Tools you have access to</label>
                <div className="flex flex-wrap gap-2">
                  {TOOLS.map((t) => (
                    <ToggleBtn key={t.id} active={tools.includes(t.id)} onClick={() => setTools(toggle(tools, t.id))}>
                      {t.label}
                    </ToggleBtn>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300">Areas of interest</label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((interest) => (
                    <ToggleBtn key={interest} active={interests.includes(interest)} onClick={() => setInterests(toggle(interests, interest))}>
                      {interest}
                    </ToggleBtn>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        )}

        {step === 'results' && (
          <ScrollArea className="flex-1">
            <div className="p-6">
              {suggestionsLoading && (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-600">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm">Finding projects matched to your profile…</p>
                </div>
              )}
              {suggestionsError && (
                <div className="text-center py-10 text-red-400 text-sm">{suggestionsError}</div>
              )}
              {!suggestionsLoading && suggestions.length > 0 && (
                <div className="grid gap-4">
                  {suggestions.map((s, i) => (
                    <SuggestionCard key={i} suggestion={s} onGenerate={handleGenerate} />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <div className="px-6 py-4 border-t border-white/8 shrink-0">
          {step === 'form' ? (
            <Button onClick={handleSubmit} disabled={!apiKey} className="w-full gap-2">
              <ChevronRight className="h-4 w-4" />
              Find matching projects
            </Button>
          ) : (
            <Button variant="outline" onClick={() => { setStep('form'); setSuggestions([]) }} className="w-full">
              Adjust filters
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
