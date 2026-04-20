'use client'

import { useState } from 'react'
import { Download, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { renderSchematicSVG } from '@/lib/svgSchematic'
import { downloadKicadFile } from '@/lib/kicad'
import type { PCBSchematic as PCBSchematicType } from '@/types/project'

export function PCBSchematic({ schematic, projectTitle }: { schematic: PCBSchematicType; projectTitle: string }) {
  const [netlistOpen, setNetlistOpen] = useState(false)
  const svg = renderSchematicSVG(schematic)

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">{schematic.description}</p>

      <div
        className="rounded-lg overflow-hidden border border-slate-700/50 bg-slate-950"
        dangerouslySetInnerHTML={{ __html: svg }}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadKicadFile(schematic, projectTitle)}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Download KiCad (.kicad_sch)
        </Button>
      </div>

      <button
        onClick={() => setNetlistOpen(!netlistOpen)}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        {netlistOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        Net list ({schematic.nets.length} nets, {schematic.components.length} components)
      </button>

      {netlistOpen && (
        <div className="grid sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <p className="text-slate-500 font-medium uppercase tracking-wider text-[10px]">Components</p>
            {schematic.components.map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-slate-800/50 rounded px-3 py-1.5">
                <span className="font-mono text-blue-400">{c.id}</span>
                <span className="text-slate-300">{c.name}</span>
                <span className="text-slate-500">{c.package}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-slate-500 font-medium uppercase tracking-wider text-[10px]">Nets</p>
            {schematic.nets.map((n) => (
              <div key={n.name} className="bg-slate-800/50 rounded px-3 py-1.5">
                <span className="font-mono text-emerald-400">{n.name}</span>
                <span className="text-slate-500 ml-2">{n.pins.map((p) => `${p.componentId}.${p.pin}`).join(' → ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
