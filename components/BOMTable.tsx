'use client'

import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { BOMItem } from '@/types/project'

const CATEGORY_COLOR: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'outline'> = {
  IC: 'default',
  Passive: 'secondary',
  Connector: 'warning',
  Mechanical: 'outline',
  Power: 'success',
}

export function BOMTable({ items }: { items: BOMItem[] }) {
  const total = items.length

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">{total} item{total !== 1 ? 's' : ''} — click retailer links to search</p>
      <div className="overflow-x-auto rounded-lg border border-slate-700/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/60">
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Component</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Specs</th>
              <th className="text-center px-4 py-3 text-slate-400 font-medium">Qty</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium hidden sm:table-cell">Category</th>
              <th className="text-center px-4 py-3 text-slate-400 font-medium">Buy</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">{item.specs}</td>
                <td className="px-4 py-3 text-center text-slate-300">{item.qty}</td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <Badge variant={CATEGORY_COLOR[item.category] ?? 'outline'}>
                    {item.category}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <a href={item.digikeyUrl} target="_blank" rel="noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-0.5">
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
    </div>
  )
}
