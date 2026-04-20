'use client'

import { useEffect, useState } from 'react'
import { Clock, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { getAllProjects, deleteProject } from '@/lib/db'
import { useStore } from '@/store/useStore'
import type { ProtoforgeProject } from '@/types/project'

const DIFF_VARIANT = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'destructive',
} as const

export function HistorySidebar() {
  const { sidebarOpen, setSidebarOpen, setCurrentProject } = useStore()
  const [projects, setProjects] = useState<ProtoforgeProject[]>([])

  useEffect(() => {
    if (sidebarOpen) getAllProjects().then(setProjects)
  }, [sidebarOpen])

  async function remove(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    await deleteProject(id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-80 bg-slate-950 border-r border-slate-800 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-medium">
            <Clock className="h-4 w-4 text-slate-400" />
            Project History
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-slate-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <ScrollArea className="h-[calc(100vh-64px)]">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-600 text-sm gap-2">
              <Clock className="h-8 w-8 opacity-30" />
              <p>No saved projects yet</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setCurrentProject(p); setSidebarOpen(false) }}
                  className="w-full text-left rounded-lg border border-slate-800 bg-slate-900 hover:border-blue-700/50 hover:bg-slate-800/60 p-4 transition-colors group relative"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-medium text-white text-sm leading-tight line-clamp-2">{p.title}</h4>
                    <button
                      onClick={(e) => remove(p.id, e)}
                      className="shrink-0 text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={DIFF_VARIANT[p.difficulty]}>{p.difficulty}</Badge>
                    <span className="text-xs text-slate-600">{p.estimatedTime}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </aside>
    </>
  )
}
