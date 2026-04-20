import type { PCBSchematic } from '@/types/project'

export function downloadKicadFile(schematic: PCBSchematic, projectTitle: string) {
  const content = schematic.kicadFile || generateFallbackKicad(schematic)
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${projectTitle.replace(/\s+/g, '_')}.kicad_sch`
  a.click()
  URL.revokeObjectURL(url)
}

function generateFallbackKicad(schematic: PCBSchematic): string {
  const timestamp = Math.floor(Date.now() / 1000)

  const symbols = schematic.components
    .map(
      (c, i) => `
  (symbol (lib_id "Device:${sanitizeId(c.name)}") (at ${20 + (i % 4) * 50} ${20 + Math.floor(i / 4) * 50} 0) (unit 1)
    (in_bom yes) (on_board yes) (dnp no)
    (uuid "${generateUUID()}")
    (property "Reference" "${c.id}" (at ${20 + (i % 4) * 50} ${15 + Math.floor(i / 4) * 50} 0) (effects (font (size 1.27 1.27))))
    (property "Value" "${c.value}" (at ${20 + (i % 4) * 50} ${25 + Math.floor(i / 4) * 50} 0) (effects (font (size 1.27 1.27))))
    (property "Footprint" "${c.package}" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
  )`
    )
    .join('\n')

  return `(kicad_sch
  (version 20230121)
  (generator "Protoforge")
  (paper "A4")
  (title_block
    (title "${schematic.description}")
    (date "${new Date().toISOString().split('T')[0]}")
    (source "protoforge")
  )
  (lib_symbols)
${symbols}
  (sheet_instances
    (path "/" (page "1"))
  )
)`
}

function sanitizeId(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 32)
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}
