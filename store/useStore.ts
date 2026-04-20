import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProtoforgeProject, ClarificationQuestion, ProjectSuggestion } from '@/types/project'

export type TerminalPhase = 'idle' | 'clarifying' | 'asking' | 'generating'

interface ProtoforgeState {
  apiKey: string
  setApiKey: (key: string) => void

  currentProject: ProtoforgeProject | null
  setCurrentProject: (project: ProtoforgeProject | null) => void

  isGenerating: boolean
  setIsGenerating: (v: boolean) => void

  generationError: string | null
  setGenerationError: (err: string | null) => void

  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void

  settingsOpen: boolean
  setSettingsOpen: (v: boolean) => void

  // Terminal streaming
  streamingText: string
  streamingStage: string
  appendStreamingText: (chunk: string) => void
  setStreamingStage: (stage: string) => void
  resetStreaming: () => void

  // Clarification flow
  terminalPhase: TerminalPhase
  setTerminalPhase: (phase: TerminalPhase) => void
  clarifications: ClarificationQuestion[]
  setClarifications: (qs: ClarificationQuestion[]) => void
  clarificationAnswers: Record<string, string>
  answerClarification: (id: string, answer: string) => void
  currentClarifyIdx: number
  setCurrentClarifyIdx: (i: number) => void
  pendingPrompt: string
  setPendingPrompt: (p: string) => void
  resetClarify: () => void

  // Project suggester
  suggesterOpen: boolean
  setSuggesterOpen: (v: boolean) => void
  suggestions: ProjectSuggestion[]
  setSuggestions: (s: ProjectSuggestion[]) => void
  suggestionsLoading: boolean
  setSuggestionsLoading: (v: boolean) => void
  suggestionsError: string | null
  setSuggestionsError: (e: string | null) => void
}

export const useStore = create<ProtoforgeState>()(
  persist(
    (set) => ({
      apiKey: '',
      setApiKey: (key) => set({ apiKey: key }),

      currentProject: null,
      setCurrentProject: (project) => set({ currentProject: project }),

      isGenerating: false,
      setIsGenerating: (v) => set({ isGenerating: v }),

      generationError: null,
      setGenerationError: (err) => set({ generationError: err }),

      sidebarOpen: false,
      setSidebarOpen: (v) => set({ sidebarOpen: v }),

      settingsOpen: false,
      setSettingsOpen: (v) => set({ settingsOpen: v }),

      streamingText: '',
      streamingStage: '',
      appendStreamingText: (chunk) =>
        set((s) => ({ streamingText: s.streamingText + chunk })),
      setStreamingStage: (stage) => set({ streamingStage: stage }),
      resetStreaming: () => set({ streamingText: '', streamingStage: '' }),

      terminalPhase: 'idle',
      setTerminalPhase: (phase) => set({ terminalPhase: phase }),
      clarifications: [],
      setClarifications: (qs) => set({ clarifications: qs }),
      clarificationAnswers: {},
      answerClarification: (id, answer) =>
        set((s) => ({ clarificationAnswers: { ...s.clarificationAnswers, [id]: answer } })),
      currentClarifyIdx: 0,
      setCurrentClarifyIdx: (i) => set({ currentClarifyIdx: i }),
      pendingPrompt: '',
      setPendingPrompt: (p) => set({ pendingPrompt: p }),
      resetClarify: () =>
        set({ clarifications: [], clarificationAnswers: {}, currentClarifyIdx: 0, pendingPrompt: '' }),

      suggesterOpen: false,
      setSuggesterOpen: (v) => set({ suggesterOpen: v }),
      suggestions: [],
      setSuggestions: (s) => set({ suggestions: s }),
      suggestionsLoading: false,
      setSuggestionsLoading: (v) => set({ suggestionsLoading: v }),
      suggestionsError: null,
      setSuggestionsError: (e) => set({ suggestionsError: e }),
    }),
    {
      name: 'protoforge-store',
      partialize: (state) => ({ apiKey: state.apiKey }),
    }
  )
)
