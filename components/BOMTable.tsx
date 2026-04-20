'use client'

import { useState } from 'react'
import { ExternalLink, Image, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { BOMItem } from '@/types/project'

const CATEGORY_COLOR: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'outline'> = {
  IC: 'default', Passive: 'secondary', Connector: 'warning', Mechanical: 'outline', Power: 'success',
}

// Simple SVG illustrations per category
const CATEGORY_ICON: Record<string, React.ReactNode> = {
  IC: (
    <svg viewBox="0 0 60 40" className="w-16 h-10 text-sky-400" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="12" y="5" width="36" height="30" rx="2" />
      {[10,16,22,28].map(y => <line key={`l${y}`} x1="2" y1={y} x2="12" y2={y} />)}
      {[10,16,22,28].map(y => <line key={`r${y}`} x1="48" y1={y} x2="58" y2={y} />)}
      <text x="30" y="23" textAnchor="middle" fontSize="8" fill="currentColor" stroke="none">IC</text>
    </svg>
  ),
  Passive: (
    <svg viewBox="0 0 60 20" className="w-16 h-8 text-amber-400" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="2" y1="10" x2="14" y2="10" />
      <rect x="14" y="4" width="32" height="12" rx="1" />
      <line x1="46" y1="10" x2="58" y2="10" />
    </svg>
  ),
  Connector: (
    <svg viewBox="0 0 40 40" className="w-10 h-10 text-violet-400" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="8" y="4" width="24" height="32" rx="3" />
      {[10,18,26].map(y => <circle key={y} cx="20" cy={y} r="2.5" fill="currentColor" stroke="none" opacity="0.7" />)}
    </svg>
  ),
  Power: (
    <svg viewBox="0 0 40 40" className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="22,4 10,22 18,22 18,36 28,18 20,18" fill="currentColor" opacity="0.3" stroke="currentColor" />
    </svg>
  ),
  Mechanical: (
    <svg viewBox="0 0 40 40" className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="20" cy="20" r="12" />
      <circle cx="20" cy="20" r="4" />
      {[0,60,120,180,240,300].map(a => {
        const r = Math.PI * a / 180
        return <line key={a} x1={20+12*Math.cos(r)} y1={20+12*Math.sin(r)} x2={20+16*Math.cos(r)} y2={20+16*Math.sin(r)} strokeWidth="3" />
      })}
    </svg>
  ),
}

function ImagePopover({ item, onClose }: { item: BOMItem; onClose: () => void }) {
  const googleImageUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(item.name + ' ' + item.specs + ' component')}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#0d0d0d] border border-white/10 rounded-xl p-6 w-80 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-white text-sm">{item.name}</h4>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex justify-center py-4 bg-black rounded-lg border border-white/5">
          {CATEGORY_ICON[item.category] ?? (
            <svg viewBox="0 0 40 40" className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="6" y="6" width="28" height="28" rx="4" />
            </svg>
          )}
        </div>

        <p className="text-xs text-slate-500 text-center">{item.specs}</p>

        <div className="space-y-2">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider">Find product photos</p>
          <div className="grid grid-cols-2 gap-2">
            <a href={item.digikeyUrl} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 bg-sky-900/10 border border-sky-900/30 rounded-lg py-2 transition-colors">
              Digi-Key <ExternalLink className="h-3 w-3" />
            </a>
            <a href={item.mouserUrl} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 bg-purple-900/10 border border-purple-900/30 rounded-lg py-2 transition-colors">
              Mouser <ExternalLink className="h-3 w-3" />
            </a>
            <a href={item.amazonUrl} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 bg-amber-900/10 border border-amber-900/30 rounded-lg py-2 transition-colors">
              Amazon <ExternalLink className="h-3 w-3" />
            </a>
            <a href={googleImageUrl} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-white/5 border border-white/8 rounded-lg py-2 transition-colors">
              Images <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export function BOMTable({ items }: { items: BOMItem[] }) {
  const [activeItem, setActiveItem] = useState<BOMItem | null>(null)

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">{items.length} item{items.length !== 1 ? 's' : ''} — click <Image className="inline h-3 w-3" /> for retailer links and photos</p>
      <div className="overflow-x-auto rounded-lg border border-white/8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 bg-[#0d0d0d]">
              <th className="w-8 px-3 py-3" />
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Component</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Specs</th>
              <th className="text-center px-4 py-3 text-slate-400 font-medium">Qty</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium hidden sm:table-cell">Category</th>
              <th className="text-center px-4 py-3 text-slate-400 font-medium">Buy</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                <td className="px-3 py-3">
                  <button
                    onClick={() => setActiveItem(item)}
                    className="text-slate-700 hover:text-slate-300 transition-colors"
                    title="View part"
                  >
                    <Image className="h-3.5 w-3.5" />
                  </button>
                </td>
                <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">{item.specs}</td>
                <td className="px-4 py-3 text-center text-slate-300">{item.qty}</td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <Badge variant={CATEGORY_COLOR[item.category] ?? 'outline'}>{item.category}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <a href={item.digikeyUrl} target="_blank" rel="noreferrer"
                      className="text-xs text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-0.5">
                      DK <ExternalLink className="h-3 w-3" />
                    </a>
                    <a href={item.mouserUrl} target="_blank" rel="noreferrer"
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-0.5">
                      MR <ExternalLink className="h-3 w-3" />
                    </a>
                    <a href={item.amazonUrl} target="_blank" rel="noreferrer"
                      className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-0.5">
                      AZ <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeItem && <ImagePopover item={activeItem} onClose={() => setActiveItem(null)} />}
    </div>
  )
}
