'use client'

import { useState } from 'react'
import { Zap, Key, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useStore } from '@/store/useStore'
import { generateProjectStream } from '@/lib/claude'
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
    setGenerationError, setSettingsOpen,
    appendStreamingText, setStreamingStage, resetStreaming,
  } = useStore()
  const [prompt, setPrompt] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim() || !apiKey || isGenerating) return

    resetStreaming()
    setIsGenerating(true)
    setGenerationError(null)

    const seenStages = new Set<string>()

    try {
      const project = await generateProjectStream(prompt.trim(), apiKey, (_chunk, accumulated) => {
        appendStreamingText(_chunk)
        for (const { marker, label } of STAGE_MARKERS) {
          if (!seenStages.has(marker) && accumulated.includes(marker)) {
            seenStages.add(marker)
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
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {!apiKey && (
        <div className="flex items-center gap-3 bg-amber-900/20 border border-amber-800/40 rounded-xl p-4 text-sm">
          <Key className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="text-amber-300">
            Add your Anthropic API key to start generating projects.{' '}
            <button onClick={() => setSettingsOpen(true)} className="underline hover:text-white transition-colors">
              Open settings
            </button>
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your project… e.g. 'A wireless temperature logger for a home brewing setup with an LCD display and SD card storage'"
            className="min-h-[120px] text-base bg-slate-900 border-slate-700 focus-visible:ring-blue-500 resize-none pr-4"
            disabled={isGenerating}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e as unknown as React.FormEvent)
            }}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full gap-2 text-base"
          disabled={!prompt.trim() || !apiKey || isGenerating}
        >
          {isGenerating ? (
            <>
              <Sparkles className="h-4 w-4 animate-pulse" />
              Generating project…
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Generate Project
            </>
          )}
        </Button>

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
              className="text-xs px-3 py-1.5 rounded-full border border-slate-700 text-slate-400 hover:border-blue-600 hover:text-blue-300 transition-colors disabled:opacity-40"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
