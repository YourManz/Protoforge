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
