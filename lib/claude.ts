import { v4 as uuidv4 } from 'uuid'
import type { ProtoforgeProject } from '@/types/project'

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
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 32000,
      stream: true,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Generate a complete Protoforge project guide for: ${prompt}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(
      (err as { error?: { message?: string } }).error?.message ||
        `API error ${response.status}`
    )
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let accumulated = ''
  let stopReason = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data: ')) continue
      const payload = line.slice(6).trim()
      if (payload === '[DONE]') continue
      try {
        const evt = JSON.parse(payload)
        if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
          const text: string = evt.delta.text ?? ''
          accumulated += text
          onChunk(text, accumulated)
        }
        if (evt.type === 'message_delta' && evt.delta?.stop_reason) {
          stopReason = evt.delta.stop_reason
        }
      } catch {
        // malformed SSE line — skip
      }
    }
  }

  let project: ProtoforgeProject
  try {
    project = JSON.parse(accumulated)
  } catch {
    if (stopReason === 'max_tokens') {
      throw new Error('Response was too long and got cut off. Try a simpler prompt.')
    }
    const match = accumulated.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Claude returned invalid JSON. Try again.')
    project = JSON.parse(match[0])
  }

  project.id = uuidv4()
  project.createdAt = new Date().toISOString()
  project.prompt = prompt

  return project
}

export async function generateProject(
  prompt: string,
  apiKey: string
): Promise<ProtoforgeProject> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 32000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Generate a complete Protoforge project guide for: ${prompt}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(
      (err as { error?: { message?: string } }).error?.message ||
        `API error ${response.status}`
    )
  }

  const data = await response.json()
  const text: string = data.content?.[0]?.text ?? ''

  const stopReason: string = data.stop_reason ?? ''

  let project: ProtoforgeProject
  try {
    project = JSON.parse(text)
  } catch {
    if (stopReason === 'max_tokens') {
      throw new Error('Response was too long and got cut off. Try a simpler prompt or reduce the scope of the project.')
    }
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Claude returned invalid JSON. Try again.')
    project = JSON.parse(match[0])
  }

  project.id = uuidv4()
  project.createdAt = new Date().toISOString()
  project.prompt = prompt

  return project
}
