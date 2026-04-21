'use client'

import { ExternalLink, FileText, BookOpen, Code, Video, MessageSquare, Loader2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { generateResources } from '@/lib/claude'
import type { ProtoforgeProject, ProjectResource } from '@/types/project'

const TYPE_ICON: Record<ProjectResource['type'], React.ReactNode> = {
  datasheet:     <FileText className="h-3.5 w-3.5 text-amber-400" />,
  tutorial:      <BookOpen className="h-3.5 w-3.5 text-sky-400" />,
  documentation: <FileText className="h-3.5 w-3.5 text-slate-400" />,
  github:        <Code className="h-3.5 w-3.5 text-emerald-400" />,
  video:         <Video className="h-3.5 w-3.5 text-red-400" />,
  forum:         <MessageSquare className="h-3.5 w-3.5 text-violet-400" />,
}

interface Props {
  project: ProtoforgeProject
}

export function ResourcesPanel({ project }: Props) {
  const { resources, setResources, resourcesLoading, setResourcesLoading, apiKey } = useStore()

  async function handleLoad() {
    setResourcesLoading(true)
    try {
      const result = await generateResources(project, apiKey)
      setResources(result)
    } catch {
      // silently fail — user can retry
    } finally {
      setResourcesLoading(false)
    }
  }

  if (resources.length === 0) {
    return (
      <div className="flex justify-center pt-2">
        <button
          onClick={handleLoad}
          disabled={resourcesLoading}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 border border-white/8 hover:border-white/20 rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
        >
          {resourcesLoading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Finding resources…</>
          ) : (
            <><ExternalLink className="h-4 w-4" /> Load resources</>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {resources.map((r, i) => (
        <a
          key={i}
          href={r.url}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col gap-1.5 p-3 rounded-xl border border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all group"
        >
          <div className="flex items-center gap-2">
            {TYPE_ICON[r.type]}
            <span className="text-xs font-medium text-slate-200 group-hover:text-white transition-colors line-clamp-1">{r.title}</span>
            <ExternalLink className="h-3 w-3 text-slate-600 group-hover:text-slate-400 ml-auto shrink-0" />
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{r.description}</p>
          <p className="text-[10px] text-sky-700 leading-relaxed line-clamp-1">{r.relevance}</p>
        </a>
      ))}
    </div>
  )
}
