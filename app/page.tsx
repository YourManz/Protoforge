'use client'

import { History, Cpu, AlertCircle, X } from 'lucide-react'
import { PromptForm } from '@/components/PromptForm'
import { ProjectView } from '@/components/ProjectView'
import { HistorySidebar } from '@/components/HistorySidebar'
import { SettingsDrawer } from '@/components/SettingsDrawer'
import { useStore } from '@/store/useStore'

export default function Home() {
  const { currentProject, generationError, setGenerationError, setSidebarOpen, isGenerating } = useStore()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Project history"
            >
              <History className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-blue-400" />
              <span className="font-bold text-white tracking-tight">Protoforge</span>
              <span className="hidden sm:inline text-xs text-slate-600 border border-slate-800 rounded px-1.5 py-0.5">beta</span>
            </div>
          </div>
          <SettingsDrawer />
        </div>
      </header>

      <HistorySidebar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-12">
        {!currentProject && !isGenerating && (
          <div className="space-y-10 text-center mb-12">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
                Build anything with AI
              </h1>
              <p className="text-slate-400 text-lg max-w-xl mx-auto">
                Describe your hardware project and get a complete guide — wiring, parts list, PCB schematic, 3D print files, and step-by-step instructions.
              </p>
            </div>

            <div className="flex justify-center gap-8 text-sm text-slate-500">
              {['Wiring diagrams', 'Sourced BOM', 'PCB schematics', '3D print guides'].map((f) => (
                <div key={f} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}

        {generationError && (
          <div className="mb-6 flex items-start gap-3 bg-red-900/20 border border-red-800/40 rounded-xl p-4 text-sm max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <span className="text-red-300 flex-1">{generationError}</span>
            <button onClick={() => setGenerationError(null)} className="text-red-500 hover:text-red-300 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-slate-500">
            <div className="relative h-12 w-12">
              <div className="absolute inset-0 rounded-full border-2 border-blue-600/30 animate-ping" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Cpu className="h-5 w-5 text-blue-400 animate-pulse" />
              </div>
            </div>
            <p className="text-sm">Generating your project…</p>
            <p className="text-xs text-slate-600">This usually takes 15–30 seconds</p>
          </div>
        )}

        {!isGenerating && currentProject && <ProjectView project={currentProject} />}

        {!isGenerating && !currentProject && (
          <div className="flex justify-center">
            <PromptForm />
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800/50 py-6 text-center text-xs text-slate-600">
        <p>
          Protoforge is free and open source.{' '}
          <a
            href="https://github.com/YourManz/Protoforge"
            target="_blank"
            rel="noreferrer"
            className="text-slate-500 hover:text-slate-300 transition-colors underline"
          >
            View on GitHub
          </a>
        </p>
      </footer>
    </div>
  )
}
