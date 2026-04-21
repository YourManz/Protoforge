'use client'

import { Clock, Wrench, GitBranch, Package, Cpu, Layers, ArrowLeft, MessageCircle, Link2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { BOMTable } from '@/components/BOMTable'
import { FlowChart } from '@/components/FlowChart'
import { PCBSchematic } from '@/components/PCBSchematic'
import { PrintedPartCard } from '@/components/PrintedPartCard'
import { InstructionList } from '@/components/InstructionList'
import { ExportButton } from '@/components/ExportButton'
import { ChatPanel } from '@/components/ChatPanel'
import { ResourcesPanel } from '@/components/ResourcesPanel'
import { useStore } from '@/store/useStore'
import type { ProtoforgeProject } from '@/types/project'

const DIFF_COLOR = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'destructive',
} as const

interface SectionProps {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}

function Section({ icon, title, children }: SectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
        <span className="text-blue-400">{icon}</span>
        <h2 className="text-base font-semibold text-white">{title}</h2>
      </div>
      {children}
    </section>
  )
}

export function ProjectView({ project }: { project: ProtoforgeProject }) {
  const { setCurrentProject, chatOpen, setChatOpen, setResources } = useStore()
  const hasPCB = project.customParts.pcb !== null
  const hasPrinted = project.customParts.printedParts.length > 0

  function handleChatToggle() {
    if (chatOpen) {
      setChatOpen(false)
    } else {
      setResources([])
      setChatOpen(true)
    }
  }

  return (
    <div id="project-export-root" className="space-y-10 pb-16">
      {/* Hero */}
      <div className="space-y-4">
        <button
          onClick={() => setCurrentProject(null)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          New project
        </button>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={DIFF_COLOR[project.difficulty]}>{project.difficulty}</Badge>
            <div className="flex items-center gap-1.5 text-slate-400 text-sm">
              <Clock className="h-3.5 w-3.5" />
              {project.estimatedTime}
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{project.title}</h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-3xl">{project.description}</p>

          {project.skillsRequired?.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Wrench className="h-3.5 w-3.5 text-slate-500" />
              {project.skillsRequired.map((s) => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-full border border-slate-700 text-slate-400">{s}</span>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <ExportButton project={project} />
          </div>
        </div>
      </div>

      {/* Resources */}
      <Section icon={<Link2 className="h-4 w-4" />} title="Resources">
        <ResourcesPanel project={project} />
      </Section>

      {/* Flowchart */}
      <Section icon={<GitBranch className="h-4 w-4" />} title="Build Flowchart">
        <FlowChart definition={project.flowchart} />
      </Section>

      {/* Instructions */}
      <Section icon={<Layers className="h-4 w-4" />} title="Step-by-Step Instructions">
        <InstructionList steps={project.instructions} />
      </Section>

      {/* BOM */}
      <Section icon={<Package className="h-4 w-4" />} title="Bill of Materials">
        <BOMTable items={project.bom} />
      </Section>

      {/* Custom Parts */}
      {(hasPCB || hasPrinted) && (
        <Section icon={<Cpu className="h-4 w-4" />} title="Custom Parts">
          <div className="space-y-8">
            {hasPCB && project.customParts.pcb && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-300">PCB Schematic</h3>
                <PCBSchematic schematic={project.customParts.pcb} projectTitle={project.title} />
              </div>
            )}
            {hasPrinted && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-300">3D Printed Parts</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {project.customParts.printedParts.map((part, i) => (
                    <PrintedPartCard key={i} part={part} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Chat panel */}
      <ChatPanel project={project} />

      {/* Floating chat button */}
      <button
        onClick={handleChatToggle}
        className={`fixed bottom-6 right-6 z-30 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all ${
          chatOpen
            ? 'bg-white/10 border border-white/20 text-white'
            : 'bg-sky-600 hover:bg-sky-500 text-white'
        }`}
      >
        <MessageCircle className="h-4 w-4" />
        <span className="text-sm font-medium">{chatOpen ? 'Close chat' : 'Ask / Edit'}</span>
      </button>
    </div>
  )
}
