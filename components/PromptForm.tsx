'use client'

import { useState, useEffect, useRef } from 'react'
import { Zap, Key, Sparkles, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useStore } from '@/store/useStore'
import { generateClarifications, generateProjectStream } from '@/lib/claude'
import { saveProject } from '@/lib/db'

const STAGE_MARKERS = [
  { marker: '"title"',        label: 'Analyzing project' },
  { marker: '"instructions"', label: 'Planning build steps' },
  { marker: '"bom"',          label: 'Sourcing components' },
  { marker: '"customParts"',  label: 'Designing custom parts' },
  { marker: '"kicadFile"',    label: 'Generating schematic' },
  { marker: '"flowchart"',    label: 'Mapping build flow' },
]

const EXAMPLES = [
  'Arduino-based soil moisture sensor with automatic watering pump',
  'Custom mechanical keyboard with QMK firmware and RGB lighting',
  'Raspberry Pi weather station with e-ink display',
  'Smart home motion sensor with ESP32 and MQTT',
]

export function PromptForm() {
  const {
    apiKey, setCurrentProject, setIsGenerating, isGenerating,
    setGenerationError, setSettingsOpen, setSuggesterOpen,
    appendStreamingText, setStreamingStage, resetStreaming,
    terminalPhase, setTerminalPhase,
    clarifications, setClarifications, clarificationAnswers,
    setPendingPrompt, pendingPrompt, resetClarify,
  } = useStore()

  const [prompt, setPrompt] = useState('')
  const seenStagesRef = useRef(new Set<string>())
  const answersRef = useRef<Record<string, string>>({})

  // Keep answersRef in sync with store
  useEffect(() => {
    answersRef.current = clarificationAnswers
  }, [clarificationAnswers])

  // Phase 2: when terminal transitions to 'generating', kick off the main generation
  useEffect(() => {
    if (terminalPhase !== 'generating') return
    runGeneration()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terminalPhase])

  async function runGeneration() {
    const answers = answersRef.current
    const enrichedPrompt = clarifications.length > 0
      ? `${pendingPrompt}\n\nTechnical decisions already made:\n${
          clarifications.map((q) => `- ${q.question}: ${answers[q.id] ?? 'not specified'}`).join('\n')
        }`
      : pendingPrompt

    seenStagesRef.current = new Set()

    try {
      const project = await generateProjectStream(enrichedPrompt, apiKey, (_chunk, accumulated) => {
        appendStreamingText(_chunk)
        for (const { marker, label } of STAGE_MARKERS) {
          if (!seenStagesRef.current.has(marker) && accumulated.includes(marker)) {
            seenStagesRef.current.add(marker)
            setStreamingStage(label)
          }
        }
      })
      await saveProject(project)
      setCurrentProject(project)
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
      setTerminalPhase('idle')
      resetClarify()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim() || !apiKey || isGenerating) return

    const trimmed = prompt.trim()
    resetStreaming()
    resetClarify()
    setPendingPrompt(trimmed)
    setIsGenerating(true)
    setGenerationError(null)
    setTerminalPhase('clarifying')

    try {
      const questions = await generateClarifications(trimmed, apiKey, (chunk) => {
        appendStreamingText(chunk)
      })
      setClarifications(questions)
      if (questions.length === 0) {
        setTerminalPhase('generating')
      } else {
        resetStreaming()
        setTerminalPhase('asking')
      }
    } catch {
      // If clarification fails, skip it and go straight to generation
      resetStreaming()
      setTerminalPhase('generating')
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {!apiKey && (
        <div className="flex items-center gap-3 bg-amber-900/20 border border-amber-800/40 rounded-xl p-4 text-sm">
          <Key className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="text-amber-300">
            Add your Anthropic API key to start.{' '}
            <button onClick={() => setSettingsOpen(true)} className="underline hover:text-white transition-colors">
              Open settings
            </button>
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your project… e.g. 'A wireless temperature logger for a home brewing setup with an LCD display and SD card storage'"
          className="min-h-[120px] text-base bg-[#0d0d0d] border-white/8 focus-visible:ring-sky-600 resize-none"
          disabled={isGenerating}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e as unknown as React.FormEvent)
          }}
        />

        <div className="flex gap-2">
          <Button
            type="submit"
            size="lg"
            className="flex-1 gap-2 text-base"
            disabled={!prompt.trim() || !apiKey || isGenerating}
          >
            {isGenerating ? (
              <><Sparkles className="h-4 w-4 animate-pulse" /> Generating…</>
            ) : (
              <><Zap className="h-4 w-4" /> Generate Project</>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => setSuggesterOpen(true)}
            disabled={!apiKey || isGenerating}
            className="gap-2"
            title="Get project ideas"
          >
            <Lightbulb className="h-4 w-4" />
            Ideas
          </Button>
        </div>

        <p className="text-center text-xs text-slate-600">⌘ + Enter to submit</p>
      </form>

      <div className="space-y-2">
        <p className="text-xs text-slate-500 text-center">Try an example</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setPrompt(ex)}
              disabled={isGenerating}
              className="text-xs px-3 py-1.5 rounded-full border border-white/8 text-slate-400 hover:border-sky-700/50 hover:text-sky-300 transition-colors disabled:opacity-40"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
