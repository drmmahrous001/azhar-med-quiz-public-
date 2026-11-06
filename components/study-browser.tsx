'use client'

import { useMemo, useState } from 'react'
import { BookOpen, CheckSquare, Search } from 'lucide-react'

import type { EssaySection, ChecklistSection } from '@/lib/import/parse-book'
type EssayGroup = EssaySection
type Checklist = ChecklistSection

export function StudyBrowser({ essays, checklists }: { essays: EssayGroup[]; checklists: Checklist[] }) {
  const [tab, setTab] = useState<'essays' | 'checklists'>('essays')
  const [query, setQuery] = useState('')
  const [chapter, setChapter] = useState('all')
  const [expanded, setExpanded] = useState<number | string | null>(0)
  const filteredEssays = useMemo(() => essays.map((group, index) => ({ ...group, index })).filter(group => (chapter === 'all' || group.chapter === chapter) && (!query || group.chapter.toLowerCase().includes(query.toLowerCase()) || group.items.some(item => item.toLowerCase().includes(query.toLowerCase())))), [essays, chapter, query])
  const filteredChecklists = useMemo(() => checklists.filter(group => !query || group.title.toLowerCase().includes(query.toLowerCase()) || group.lines.some(line => line.toLowerCase().includes(query.toLowerCase()))), [checklists, query])
  const total = essays.reduce((sum, group) => sum + group.items.length, 0)

  return <section className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm font-medium text-primary">Azhar Med Quiz</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Study materials</h1><p className="mt-2 text-muted-foreground">Browse surgery essay questions and practical checklists from your study book.</p></div>
      <div className="rounded-xl border bg-card px-4 py-3 text-sm"><span className="font-semibold">{total}</span><span className="ml-2 text-muted-foreground">essay prompts</span><span className="mx-2 text-muted-foreground">·</span><span className="font-semibold">{checklists.length}</span><span className="ml-2 text-muted-foreground">checklists</span></div>
    </div>
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search study materials…" className="h-11 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"/></div>
      <div className="flex rounded-lg border bg-muted/40 p-1"><button onClick={()=>setTab('essays')} className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${tab==='essays'?'bg-background shadow-sm font-medium':'text-muted-foreground'}`}><BookOpen className="h-4 w-4"/>Essay questions</button><button onClick={()=>setTab('checklists')} className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${tab==='checklists'?'bg-background shadow-sm font-medium':'text-muted-foreground'}`}><CheckSquare className="h-4 w-4"/>Checklists</button></div>
    </div>
    {tab==='essays' ? <>
      <select value={chapter} onChange={e=>{setChapter(e.target.value);setExpanded(null)}} className="h-10 max-w-full rounded-lg border bg-background px-3 text-sm"><option value="all">All chapters ({essays.length})</option>{essays.map(g=><option key={g.chapter} value={g.chapter}>{g.chapter}</option>)}</select>
      <div className="space-y-3">{filteredEssays.map(group=><article key={group.chapter} className="overflow-hidden rounded-xl border bg-card"><button onClick={()=>setExpanded(expanded===group.index?null:group.index)} className="flex w-full items-center justify-between gap-4 p-4 text-left"><span><span className="block font-semibold">{group.chapter}</span><span className="mt-1 block text-xs text-muted-foreground">{group.items.length} prompts · {group.sourcePage ? `Source page ${group.sourcePage}` : 'Source page unavailable'}</span></span><span className="text-muted-foreground">{expanded===group.index?'−':'+'}</span></button>{expanded===group.index&&<ol className="space-y-2 border-t px-5 py-4">{group.items.map((item,i)=><li key={i} className="flex gap-3 text-sm leading-6"><span className="min-w-5 text-muted-foreground">{i+1}.</span><span>{item}</span></li>)}</ol>}</article>)}{filteredEssays.length===0&&<p className="rounded-xl border p-6 text-center text-sm text-muted-foreground">No matching study materials.</p>}</div>
    </> : <div className="space-y-3">{filteredChecklists.map((group,i)=><article key={group.title} className="overflow-hidden rounded-xl border bg-card"><button onClick={()=>setExpanded(expanded===`c${i}`?null:`c${i}`)} className="flex w-full items-center justify-between gap-4 p-4 text-left"><span><span className="block font-semibold">{group.title}</span><span className="mt-1 block text-xs text-muted-foreground">{group.lines.length} items · Source page {group.sourcePage}</span></span><span className="text-muted-foreground">{expanded===`c${i}`?'−':'+'}</span></button>{expanded===`c${i}`&&<ul className="space-y-2 border-t px-5 py-4">{group.lines.map((line,j)=><li key={j} className="flex gap-3 text-sm leading-6"><span className="text-muted-foreground">□</span><span>{line}</span></li>)}</ul>}</article>)}{filteredChecklists.length===0&&<p className="rounded-xl border p-6 text-center text-sm text-muted-foreground">No matching checklists.</p>}</div>}
  </section>
}
