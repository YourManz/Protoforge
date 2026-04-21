'use client'

import { useState } from 'react'
import { Zap, Key, Sparkles, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useStore } from '@/store/useStore'
import { generateClarifications } from '@/lib/claude'
import { startGeneration } from '@/lib/generation'

const EXAMPLES = [
  'Arduino-based soil moisture sensor with automatic watering pump',
  'Custom mechanical keyboard with QMK firmware and RGB lighting',
  'Raspberry Pi weather station with e-ink display',
  'Smart home motion sensor with ESP32 and MQTT',
]

export function PromptForm() {
  const {
    apiKey, setIsGenerating, isGenerating,
    setGenerationError, setSettingsOpen, setSuggesterOpen,
    appendStreamingText, resetStreaming,
    setTerminalPhase, setClarifications,
    setPendingPrompt, resetClarify,
  } = useStore()

  const [prompt, setPrompt] = useState('')

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
        resetStreaming()
        startGeneration()
      } else {
        resetStreaming()
        setTerminalPhase('asking')
      }
    } catch {
      resetStreaming()
      startGeneration()
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
