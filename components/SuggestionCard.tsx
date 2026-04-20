import { Clock, DollarSign, Wrench, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ProjectSuggestion } from '@/types/project'

const DIFF_VARIANT = {
  beginner: 'success', intermediate: 'warning', advanced: 'destructive',
} as const

interface Props {
  suggestion: ProjectSuggestion
  onGenerate: (prompt: string) => void
}

export function SuggestionCard({ suggestion, onGenerate }: Props) {
  return (
    <Card className="group hover:border-sky-700/40 transition-all duration-200">
      <CardContent className="p-5 space-y-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-white text-sm leading-tight">{suggestion.title}</h3>
            <Badge variant={DIFF_VARIANT[suggestion.difficulty]} className="shrink-0">{suggestion.difficulty}</Badge>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{suggestion.description}</p>
          <p className="text-xs text-sky-600 italic">{suggestion.whyRecommended}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <DollarSign className="h-3 w-3 text-emerald-600" />
            {suggestion.estimatedBudget}
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className="h-3 w-3 text-amber-600" />
            {suggestion.estimatedTime}
          </div>
        </div>

        {suggestion.toolsRequired?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {suggestion.toolsRequired.map((t) => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/8 text-slate-500">{t}</span>
            ))}
          </div>
        )}

        <Button
          onClick={() => onGenerate(suggestion.fullPrompt)}
          size="sm"
          className="w-full gap-2 group-hover:bg-sky-600 transition-colors"
        >
          <Zap className="h-3.5 w-3.5" />
          Generate this project
        </Button>
      </CardContent>
    </Card>
  )
}
