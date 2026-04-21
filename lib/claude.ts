import Anthropic from '@anthropic-ai/sdk'
import { v4 as uuidv4 } from 'uuid'
import type { ProtoforgeProject, ClarificationQuestion, BuilderProfile, ProjectSuggestion, ChatMessage, ProjectResource } from '@/types/project'

function getClient(apiKey: string) {
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
}

const SYSTEM_PROMPT = `You are Protoforge, an expert hardware engineer and maker.
When given a description of a DIY hardware project, you generate a comprehensive, structured project guide.

You MUST respond with ONLY valid JSON — no markdown, no explanation, no code fences.
The JSON must exactly match this TypeScript interface:

interface ProtoforgeProject {
  id: string                    // generate a UUID v4
  createdAt: string             // ISO 8601 timestamp
  prompt: string                // the original user prompt
  title: string                 // short, descriptive project title
  description: string           // 2-3 sentence overview
  difficulty: "beginner" | "intermediate" | "advanced"
  estimatedTime: string         // e.g. "4-6 hours" or "2 weekends"
  skillsRequired: string[]      // e.g. ["soldering", "3D printing", "Arduino programming"]

  instructions: Array<{
    number: number
    title: string
    description: string
    tools?: string[]            // tools needed for this step
    subSteps?: string[]         // detailed sub-steps
    warning?: string            // safety warnings if applicable
  }>

  bom: Array<{
    name: string
    qty: number
    specs: string               // key specs (e.g. "10kΩ 1/4W", "5V 2A")
    category: string            // e.g. "Passive", "IC", "Connector", "Mechanical"
    digikeyUrl: string          // https://www.digikey.com/en/products/result?keywords=<encoded-name>
    mouserUrl: string           // https://www.mouser.com/Search/Refine?Keyword=<encoded-name>
    amazonUrl: string           // https://www.amazon.com/s?k=<encoded-name>
  }>

  customParts: {
    pcb: {
      components: Array<{
        id: string              // e.g. "U1", "R1", "C1"
        name: string            // e.g. "ATmega328P", "10kΩ Resistor"
        value: string           // e.g. "328P-AU", "10k"
        package: string         // e.g. "TQFP-32", "0805"
      }>
      nets: Array<{
        name: string            // e.g. "VCC", "GND", "SDA"
        pins: Array<{ componentId: string; pin: string }>
      }>
      description: string
      kicadFile: string         // full KiCad 7 .kicad_sch text content
    } | null                    // null if no custom PCB needed

    printedParts: Array<{
      name: string
      description: string
      dimensions: string        // e.g. "120mm x 80mm x 30mm"
      material: string          // e.g. "PLA", "PETG", "TPU"
      infill: string            // e.g. "20%", "40% for structural"
      printablesQuery: string   // search term for printables.com
      notes?: string
    }>
  }

  flowchart: string             // valid Mermaid flowchart definition (flowchart TD ...)
}

Rules:
- BOM retailer URLs: use URL-encoded search terms (replace spaces with +)
- flowchart: must be syntactically valid Mermaid, use flowchart TD, keep node labels short
- kicadFile: generate valid KiCad 7 .kicad_sch format if a PCB is needed
- If no custom PCB is needed, set customParts.pcb to null
- Include at minimum 5 BOM items for any real project
- Include at minimum 4 instruction steps
- Be specific and practical — this is for real builders`

export async function generateProjectStream(
  prompt: string,
  apiKey: string,
  onChunk: (text: string, accumulated: string) => void
): Promise<ProtoforgeProject> {
  const client = getClient(apiKey)
  let accumulated = ''

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 90_000)

  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Generate a complete Protoforge project guide for: ${prompt}` }],
    } as Anthropic.MessageStreamParams, { signal: controller.signal })

    // Prevent unhandled 'error' events from swallowing API errors in browser environments
    stream.on('error', () => {})

    stream.on('text', (text) => {
      accumulated += text
      onChunk(text, accumulated)
    })

    const msg = await stream.finalMessage()
    if (msg.stop_reason === 'max_tokens') {
      throw new Error('Response was too long and got cut off. Try a simpler prompt.')
    }
  } finally {
    clearTimeout(timeoutId)
  }

  let project: ProtoforgeProject
  try {
    project = JSON.parse(accumulated)
  } catch {
    const match = accumulated.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Claude returned invalid JSON. Try again.')
    project = JSON.parse(match[0])
  }

  project.id = uuidv4()
  project.createdAt = new Date().toISOString()
  project.prompt = prompt

  return project
}

// ── Clarification questions ────────────────────────────────────
const CLARIFY_SYSTEM = `You are a hardware engineering expert helping a maker clarify their project.
Given a project description, identify the key technical decisions that would most impact the build.

Return ONLY valid JSON — an array matching this type:
[{
  "id": "string (short snake_case key)",
  "question": "concise technical question",
  "context": "1-2 sentences: why this decision matters for this specific project",
  "suggestions": [
    { "label": "Option name", "description": "1-sentence description", "pros": "main advantage", "cons": "main tradeoff" },
    { "label": "Option name", "description": "1-sentence description", "pros": "main advantage", "cons": "main tradeoff" },
    { "label": "Option name", "description": "1-sentence description", "pros": "main advantage", "cons": "main tradeoff" }
  ]
}]

Rules:
- 3–4 questions maximum, ordered by impact
- Each question has exactly 3 suggestions tailored to THIS project
- Never ask about things clearly stated in the prompt
- Keep all text concise (under 20 words per field)`

export async function generateClarifications(
  prompt: string,
  apiKey: string,
  onChunk: (text: string) => void
): Promise<ClarificationQuestion[]> {
  const client = getClient(apiKey)
  let accumulated = ''

  const stream = client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: CLARIFY_SYSTEM,
    messages: [{ role: 'user', content: `Project: ${prompt}` }],
  } as Anthropic.MessageStreamParams)

  stream.on('error', () => {})
  stream.on('text', (text) => { accumulated += text; onChunk(text) })
  await stream.finalMessage()

  const match = accumulated.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('Could not parse clarification questions.')
  return JSON.parse(match[0]) as ClarificationQuestion[]
}

// ── Project suggestions ────────────────────────────────────────
const SUGGEST_SYSTEM = `You are a maker mentor. Given a builder's profile, suggest 5 hardware projects perfectly matched to their skills, budget, interests, and available tools.

Return ONLY valid JSON — an array of exactly 5 items:
[{
  "title": "project title",
  "description": "2-sentence overview",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "estimatedBudget": "e.g. $30–$60",
  "estimatedTime": "e.g. 1 weekend",
  "skillsRequired": ["skill1", "skill2"],
  "toolsRequired": ["tool1", "tool2"],
  "whyRecommended": "1 sentence: why this fits their profile specifically",
  "fullPrompt": "A fully detailed generation prompt with all specs, components, goals, and constraints written out so it can be used directly — 3-5 sentences"
}]

The fullPrompt must be rich enough that no clarification is needed — include: communication protocol, microcontroller choice, display type, power source, enclosure material, skill level context, and any constraints from their budget/tools.`

export async function generateSuggestions(
  profile: BuilderProfile,
  apiKey: string,
  onChunk?: (text: string) => void
): Promise<ProjectSuggestion[]> {
  const client = getClient(apiKey)
  const profileText = `
Goal: ${profile.goal === 'learn' ? 'Learning and skill development' : 'Building a functional product'}
Budget: $${profile.budget}
Experience: ${profile.experience}
Available tools: ${profile.tools.join(', ') || 'basic hand tools'}
Interests: ${profile.interests.join(', ') || 'general electronics'}`

  let accumulated = ''

  const stream = client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: SUGGEST_SYSTEM,
    messages: [{ role: 'user', content: `Builder profile:\n${profileText}` }],
  } as Anthropic.MessageStreamParams)

  stream.on('error', () => {})
  stream.on('text', (text) => { accumulated += text; onChunk?.(text) })
  await stream.finalMessage()

  const match = accumulated.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('Could not parse project suggestions.')
  return JSON.parse(match[0]) as ProjectSuggestion[]
}

// ── Chat — Learn mode ──────────────────────────────────────────
const LEARN_SYSTEM = `You are an expert hardware engineer and maker explaining a DIY project to a builder.
Answer questions clearly and concisely. Use markdown for formatting.
Explain concepts in practical terms — focus on WHY, not just WHAT.
When referencing project specifics, be precise about component values and connections.
Keep answers under 400 words unless a detailed explanation is truly needed.`

export async function chatLearn(
  project: ProtoforgeProject,
  messages: ChatMessage[],
  apiKey: string,
  onChunk: (text: string) => void
): Promise<string> {
  const client = getClient(apiKey)
  const projectSummary = `Project: ${project.title}
Description: ${project.description}
Skills: ${project.skillsRequired.join(', ')}
Key components: ${project.bom.slice(0, 5).map(b => b.name).join(', ')}`

  let accumulated = ''
  const stream = client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: `${LEARN_SYSTEM}\n\nProject context:\n${projectSummary}`,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  } as Anthropic.MessageStreamParams)

  stream.on('error', () => {})
  stream.on('text', (text) => { accumulated += text; onChunk(text) })
  await stream.finalMessage()
  return accumulated
}

// ── Chat — Edit mode ───────────────────────────────────────────
const EDIT_SYSTEM = `You are an expert hardware engineer editing a Protoforge project based on user requests.

The user will describe changes they want. You must:
1. Return a JSON object with ONLY the fields that need to change (partial update)
2. Then add an "explanation" field (string) explaining what you changed and why

Response format — valid JSON only:
{
  "explanation": "Brief description of changes made",
  "title": "...",            // only if title changes
  "bom": [...],              // only if BOM changes
  "instructions": [...],     // only if instructions change
  "customParts": {...},      // only if custom parts change
  "flowchart": "..."         // only if flowchart changes
}

Rules:
- Include ONLY fields that change — omit unchanged fields
- explanation is always required
- Keep the same structure/types as the original project
- BOM URLs must follow the same URL-encoded format
- If adding components, include all required BOM fields`

export async function chatEdit(
  project: ProtoforgeProject,
  messages: ChatMessage[],
  apiKey: string,
  onChunk: (text: string) => void
): Promise<{ updatedProject: ProtoforgeProject; explanation: string }> {
  const client = getClient(apiKey)
  let accumulated = ''

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: `${EDIT_SYSTEM}\n\nCurrent project JSON:\n${JSON.stringify(project, null, 2)}`,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  } as Anthropic.MessageStreamParams)

  stream.on('error', () => {})
  stream.on('text', (text) => { accumulated += text; onChunk(text) })
  await stream.finalMessage()

  const match = accumulated.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Could not parse edit response.')
  const patch = JSON.parse(match[0]) as Record<string, unknown>
  const explanation = (patch.explanation as string) ?? 'Project updated.'
  delete patch.explanation

  const updatedProject: ProtoforgeProject = { ...project, ...(patch as Partial<ProtoforgeProject>) }
  return { updatedProject, explanation }
}

// ── Resources ──────────────────────────────────────────────────
const RESOURCES_SYSTEM = `You are a hardware engineering expert curating learning resources for a maker.
Given a project, return 6 high-quality external resources.

Return ONLY valid JSON — an array of exactly 6 items:
[{
  "type": "datasheet" | "tutorial" | "documentation" | "github" | "video" | "forum",
  "title": "resource title",
  "description": "1-sentence description of what this resource provides",
  "url": "https://...",
  "relevance": "1 sentence: why specifically useful for this project"
}]

Rules:
- Mix types: 1-2 datasheets, 1-2 tutorials, 1 github repo, 1 video or forum post
- Use real, stable URLs (Arduino docs, GitHub, Adafruit, SparkFun, Instructables, YouTube)
- Focus on the main IC or microcontroller first, then the project domain
- No paywalled content`

export async function generateResources(
  project: ProtoforgeProject,
  apiKey: string
): Promise<ProjectResource[]> {
  const client = getClient(apiKey)
  const projectSummary = `Title: ${project.title}
Components: ${project.bom.map(b => b.name).join(', ')}
Skills: ${project.skillsRequired.join(', ')}`

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: RESOURCES_SYSTEM,
    messages: [{ role: 'user', content: `Project:\n${projectSummary}` }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('Could not parse resources.')
  return JSON.parse(match[0]) as ProjectResource[]
}
