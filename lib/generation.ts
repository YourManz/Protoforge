import { generateProjectStream } from '@/lib/claude'
import { saveProject } from '@/lib/db'
import { useStore } from '@/store/useStore'

const GEN_STAGES = [
  { marker: '"title"',        label: 'Analyzing project' },
  { marker: '"instructions"', label: 'Planning build steps' },
  { marker: '"bom"',          label: 'Sourcing components' },
  { marker: '"customParts"',  label: 'Custom parts' },
  { marker: '"kicadFile"',    label: 'Generating schematic' },
  { marker: '"flowchart"',    label: 'Mapping build flow' },
]

export async function runGeneration() {
  const { pendingPrompt, clarifications, clarificationAnswers, apiKey } = useStore.getState()

  const enrichedPrompt = clarifications.length > 0
    ? `${pendingPrompt}\n\nTechnical decisions already made:\n${
        clarifications.map((q) => `- ${q.question}: ${clarificationAnswers[q.id] ?? 'not specified'}`).join('\n')
      }`
    : pendingPrompt

  useStore.getState().setTerminalPhase('generating')

  const seenStages = new Set<string>()

  try {
    const project = await generateProjectStream(enrichedPrompt, apiKey, (chunk, accumulated) => {
      useStore.getState().appendStreamingText(chunk)
      for (const { marker, label } of GEN_STAGES) {
        if (!seenStages.has(marker) && accumulated.includes(marker)) {
          seenStages.add(marker)
          useStore.getState().setStreamingStage(label)
        }
      }
    })
    await saveProject(project)
    useStore.getState().setCurrentProject(project)
  } catch (err) {
    useStore.getState().setGenerationError(err instanceof Error ? err.message : 'Generation failed')
  } finally {
    useStore.getState().setIsGenerating(false)
    useStore.getState().setTerminalPhase('idle')
    useStore.getState().resetClarify()
  }
}

export function startGeneration() {
  runGeneration().catch(() => {
    useStore.getState().setIsGenerating(false)
    useStore.getState().setTerminalPhase('idle')
  })
}
