import type { PCBSchematic, PCBComponent, PCBNet } from '@/types/project'

interface Point { x: number; y: number }
interface ComponentLayout extends PCBComponent { pos: Point }

const COMP_W = 120
const COMP_H = 50
const COLS = 4
const GAP_X = 60
const GAP_Y = 60
const PAD = 40

export function renderSchematicSVG(schematic: PCBSchematic): string {
  const comps = schematic.components
  const cols = Math.min(COLS, comps.length)
  const rows = Math.ceil(comps.length / cols)

  const totalW = PAD * 2 + cols * COMP_W + (cols - 1) * GAP_X
  const totalH = PAD * 2 + rows * COMP_H + (rows - 1) * GAP_Y + 60

  const layout: ComponentLayout[] = comps.map((c, i) => ({
    ...c,
    pos: {
      x: PAD + (i % cols) * (COMP_W + GAP_X),
      y: PAD + Math.floor(i / cols) * (COMP_H + GAP_Y),
    },
  }))

  const byId = new Map(layout.map((c) => [c.id, c]))

  const compSVG = layout
    .map(
      (c) => `
  <g transform="translate(${c.pos.x},${c.pos.y})">
    <rect width="${COMP_W}" height="${COMP_H}" rx="4" fill="#111111" stroke="#3b82f6" stroke-width="1.5"/>
    <text x="${COMP_W / 2}" y="18" text-anchor="middle" fill="#94a3b8" font-size="10" font-family="monospace">${esc(c.id)}</text>
    <text x="${COMP_W / 2}" y="32" text-anchor="middle" fill="#f1f5f9" font-size="11" font-family="monospace" font-weight="bold">${esc(truncate(c.name, 14))}</text>
    <text x="${COMP_W / 2}" y="44" text-anchor="middle" fill="#64748b" font-size="9" font-family="monospace">${esc(c.package)}</text>
  </g>`
    )
    .join('')

  const netColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
  const netSVG = schematic.nets
    .map((net, ni) => {
      const color = netColors[ni % netColors.length]
      const pins = net.pins
        .map((p) => byId.get(p.componentId))
        .filter(Boolean) as ComponentLayout[]
      if (pins.length < 2) return ''

      const lines = []
      for (let i = 0; i < pins.length - 1; i++) {
        const a = centerBottom(pins[i])
        const b = centerBottom(pins[i + 1])
        const my = Math.max(a.y, b.y) + 20 + ni * 8
        lines.push(
          `<polyline points="${a.x},${a.y} ${a.x},${my} ${b.x},${my} ${b.x},${b.y}" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="4 2" opacity="0.8"/>`
        )
        lines.push(
          `<text x="${(a.x + b.x) / 2}" y="${my - 3}" text-anchor="middle" fill="${color}" font-size="9" font-family="monospace">${esc(net.name)}</text>`
        )
      }
      return lines.join('\n')
    })
    .join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">
  <rect width="${totalW}" height="${totalH}" fill="#000000" rx="8"/>
  ${netSVG}
  ${compSVG}
  <text x="${totalW / 2}" y="${totalH - 12}" text-anchor="middle" fill="#334155" font-size="10" font-family="monospace">
    ${esc(schematic.description)}
  </text>
</svg>`
}

function centerBottom(c: ComponentLayout): Point {
  return { x: c.pos.x + COMP_W / 2, y: c.pos.y + COMP_H }
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}
