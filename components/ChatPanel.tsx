'use client'

import { useState, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { X, Send, Loader2, BookOpen, Wrench, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useStore } from '@/store/useStore'
import { chatLearn, chatEdit } from '@/lib/claude'
import type { ProtoforgeProject, ChatMessage } from '@/types/project'

interface Props {
  project: ProtoforgeProject
}

export function ChatPanel({ project }: Props) {
  const {
    chatOpen, setChatOpen,
    chatMode, setChatMode,
    chatMessages, appendChatMessage, updateLastChatMessage, clearChat,
    chatLoading, setChatLoading,
    apiKey, setCurrentProject,
  } = useStore()

  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  async function handleSend() {
    const text = input.trim()
    if (!text || chatLoading) return
    setInput('')

    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    appendChatMessage(userMsg)

    const assistantMsg: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    }
    appendChatMessage(assistantMsg)
    setChatLoading(true)

    const history = [...chatMessages, userMsg]

    try {
      if (chatMode === 'learn') {
        await chatLearn(project, history, apiKey, (chunk) => {
          updateLastChatMessage(assistantMsg.content + chunk)
          assistantMsg.content += chunk
        })
      } else {
        const { updatedProject, explanation } = await chatEdit(project, history, apiKey, (chunk) => {
          updateLastChatMessage(assistantMsg.content + chunk)
          assistantMsg.content += chunk
        })
        setCurrentProject(updatedProject)
        updateLastChatMessage(explanation)
      }
    } catch (err) {
      updateLastChatMessage(err instanceof Error ? `Error: ${err.message}` : 'Something went wrong.')
    } finally {
      setChatLoading(false)
    }
  }

  if (!chatOpen) return null

  const LEARN_PROMPTS = [
    'How does the wiring work?',
    'What tools do I need?',
    'Explain the main IC',
    'What could go wrong?',
  ]

  const EDIT_PROMPTS = [
    'Add a power LED indicator',
    'Make it battery powered',
    'Add wireless connectivity',
    'Simplify for a beginner',
  ]

  const quickPrompts = chatMode === 'learn' ? LEARN_PROMPTS : EDIT_PROMPTS

  return (
    <div className="fixed right-0 top-0 h-full w-[420px] z-40 flex flex-col bg-[#0a0a0a] border-l border-white/8 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-white/8">
            <button
              onClick={() => setChatMode('learn')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                chatMode === 'learn' ? 'bg-sky-900/40 text-sky-300' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <BookOpen className="h-3 w-3" /> Learn
            </button>
            <button
              onClick={() => setChatMode('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                chatMode === 'edit' ? 'bg-violet-900/40 text-violet-300' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Wrench className="h-3 w-3" /> Edit
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clearChat} className="text-slate-600 hover:text-slate-400 transition-colors" title="Clear chat">
            <Trash2 className="h-4 w-4" />
          </button>
          <button onClick={() => setChatOpen(false)} className="text-slate-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600 text-center">
              {chatMode === 'learn' ? 'Ask anything about this project' : 'Describe changes to make to the project'}
            </p>
            <div className="grid gap-2">
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => setInput(p)}
                  className="text-left text-xs px-3 py-2 rounded-lg border border-white/8 text-slate-400 hover:border-white/20 hover:text-slate-200 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
              msg.role === 'user'
                ? 'bg-sky-900/30 text-sky-100 border border-sky-800/40'
                : 'bg-white/5 text-slate-200 border border-white/8'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-pre:bg-black/40 prose-pre:text-xs">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content || ' '}</ReactMarkdown>
                  {msg.isStreaming && <span className="inline-block w-1.5 h-3.5 bg-sky-400 ml-0.5 animate-pulse align-middle" />}
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/8 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
            }}
            placeholder={chatMode === 'learn' ? 'Ask a question…' : 'Describe a change…'}
            className="flex-1 bg-[#111] border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-sky-700 resize-none min-h-[40px] max-h-[120px]"
            rows={1}
            disabled={chatLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || chatLoading}
            className={`p-2 rounded-lg transition-colors shrink-0 ${
              chatMode === 'learn' ? 'bg-sky-600 hover:bg-sky-500' : 'bg-violet-600 hover:bg-violet-500'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-[10px] text-slate-700 mt-1.5">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
