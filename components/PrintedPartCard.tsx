import { ExternalLink, Box } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PrintedPart } from '@/types/project'

const MATERIAL_COLOR: Record<string, 'default' | 'success' | 'warning' | 'secondary'> = {
  PLA: 'secondary',
  PETG: 'success',
  ABS: 'warning',
  TPU: 'default',
}

export function PrintedPartCard({ part }: { part: PrintedPart }) {
  const printablesUrl = `https://www.printables.com/search/models?q=${encodeURIComponent(part.printablesQuery)}`

  return (
    <Card className="group hover:border-blue-700/50 transition-colors">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Box className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <h4 className="font-medium text-white text-sm">{part.name}</h4>
          </div>
          <Badge variant={MATERIAL_COLOR[part.material] ?? 'outline'}>{part.material}</Badge>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">{part.description}</p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-800/50 rounded px-2.5 py-1.5">
            <span className="text-slate-500">Dimensions</span>
            <p className="text-slate-300 font-mono mt-0.5">{part.dimensions}</p>
          </div>
          <div className="bg-slate-800/50 rounded px-2.5 py-1.5">
            <span className="text-slate-500">Infill</span>
            <p className="text-slate-300 font-mono mt-0.5">{part.infill}</p>
          </div>
        </div>

        {part.notes && (
          <p className="text-xs text-slate-500 italic">{part.notes}</p>
        )}

        <a
          href={printablesUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          Search Printables
        </a>
      </CardContent>
    </Card>
  )
}
