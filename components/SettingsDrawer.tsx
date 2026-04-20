'use client'

import { useState } from 'react'
import { Settings, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStore } from '@/store/useStore'

export function SettingsDrawer() {
  const { apiKey, setApiKey, settingsOpen, setSettingsOpen } = useStore()
  const [draft, setDraft] = useState(apiKey)
  const [visible, setVisible] = useState(false)

  function save() {
    setApiKey(draft.trim())
    setSettingsOpen(false)
  }

  return (
    <>
      <button
        onClick={() => { setDraft(apiKey); setSettingsOpen(true) }}
        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        aria-label="Settings"
      >
        <Settings className="h-5 w-5" />
      </button>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>API Settings</DialogTitle>
            <DialogDescription>
              Your API key is stored locally in your browser and never sent to any server other than Anthropic.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Anthropic API Key</label>
              <div className="relative">
                <Input
                  type={visible ? 'text' : 'password'}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="sk-ant-..."
                  className="pr-10"
                  onKeyDown={(e) => e.key === 'Enter' && save()}
                />
                <button
                  type="button"
                  onClick={() => setVisible(!visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Get your key at{' '}
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  console.anthropic.com <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>

            {apiKey && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-900/20 border border-emerald-800/30 rounded-md px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                API key saved
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button onClick={save} className="flex-1" disabled={!draft.trim()}>
                Save Key
              </Button>
              {apiKey && (
                <Button variant="outline" onClick={() => { setDraft(''); setApiKey(''); }}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
