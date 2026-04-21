export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export interface Step {
  number: number
  title: string
  description: string
  tools?: string[]
  subSteps?: string[]
  warning?: string
}

export interface BOMItem {
  name: string
  qty: number
  specs: string
  category: string
  digikeyUrl: string
  mouserUrl: string
  amazonUrl: string
}

export interface PCBComponent {
  id: string
  name: string
  value: string
  package: string
}

export interface PCBNet {
  name: string
  pins: Array<{ componentId: string; pin: string }>
}

export interface PCBSchematic {
  components: PCBComponent[]
  nets: PCBNet[]
  description: string
  kicadFile: string
}

export interface PrintedPart {
  name: string
  description: string
  dimensions: string
  material: string
  infill: string
  printablesQuery: string
  notes?: string
}

export interface ProtoforgeProject {
  id: string
  createdAt: string
  prompt: string
  title: string
  description: string
  difficulty: Difficulty
  estimatedTime: string
  skillsRequired: string[]

  instructions: Step[]

  bom: BOMItem[]

  customParts: {
    pcb: PCBSchematic | null
    printedParts: PrintedPart[]
  }

  flowchart: string

  exportedAt?: string
}

// ── Chat ───────────────────────────────────────────────────────
export type ChatMode = 'learn' | 'edit'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  isStreaming?: boolean
  editSummary?: string
}

export interface ProjectResource {
  type: 'datasheet' | 'tutorial' | 'documentation' | 'github' | 'video' | 'forum'
  title: string
  description: string
  url: string
  relevance: string
}

// ── Clarification ──────────────────────────────────────────────
export interface ClarificationSuggestion {
  label: string
  description: string
  pros: string
  cons: string
}

export interface ClarificationQuestion {
  id: string
  question: string
  context: string
  suggestions: ClarificationSuggestion[]
}

// ── Project Suggester ──────────────────────────────────────────
export interface BuilderProfile {
  goal: 'learn' | 'build'
  budget: number
  experience: Difficulty
  tools: string[]
  interests: string[]
}

export interface ProjectSuggestion {
  title: string
  description: string
  difficulty: Difficulty
  estimatedBudget: string
  estimatedTime: string
  skillsRequired: string[]
  toolsRequired: string[]
  whyRecommended: string
  fullPrompt: string
}
