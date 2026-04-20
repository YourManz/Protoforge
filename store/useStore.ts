import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProtoforgeProject } from '@/types/project'

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

  streamingText: string
  streamingStage: string
  appendStreamingText: (chunk: string) => void
  setStreamingStage: (stage: string) => void
  resetStreaming: () => void
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
    }),
    {
      name: 'protoforge-store',
      partialize: (state) => ({ apiKey: state.apiKey }),
    }
  )
)
