'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProgress } from '@/lib/progress-store'
import { quizHref, type QuizConfig, type QuizFilter } from '@/lib/quiz-config'
import type { ChapterSummary } from '@/lib/types'
import { cn } from '@/lib/utils'

const COUNTS: QuizConfig['count'][] = [10, 20, 40, 'all']
const FILTERS: { value: QuizFilter; label: string; hint: string }[] = [
  { value: 'all', label: 'All questions', hint: 'Everything in the selected chapters' },
  { value: 'unseen', label: 'Unseen', hint: 'Questions you have not answered yet' },
  { value: 'incorrect', label: 'Mistakes', hint: 'Your last answer was wrong' },
  { value: 'bookmarked', label: 'Bookmarked', hint: 'Questions you saved' },
]

export function PracticeSetup({
  chapters,
  idsByChapter,
}: {
  chapters: ChapterSummary[]
  idsByChapter: Record<number, string[]>
}) {
  const router = useRouter()
  const progress = useProgress()
  const [selected, setSelected] = useState<Set<number>>(() => new Set(chapters.map((c) => c.chapterNumber)))
  const [mode, setMode] = useState<QuizConfig['mode']>('practice')
  const [count, setCount] = useState<QuizConfig['count']>(20)
  const [filter, setFilter] = useState<QuizFilter>('all')
  const [order, setOrder] = useState<QuizConfig['order']>('shuffle')
  const [resumeHref, setResumeHref] = useState<string | null>(null)
  const [resumePracticeHref, setResumePracticeHref] = useState<string | null>(null)

  const [resumeMessage, setResumeMessage] = useState('')

  function findIncompleteSession(sessionMode: 'exam' | 'practice') {
    try {
      const pointerKey = `azhar-latest-incomplete-${sessionMode}-v1`
      const pointerRaw = localStorage.getItem(pointerKey)
      if (pointerRaw) {
        const pointer = JSON.parse(pointerRaw) as { checkpointKey?: string; href?: string }
        if (pointer.checkpointKey && pointer.href) {
          const raw = localStorage.getItem(pointer.checkpointKey)
          if (raw) {
            const checkpoint = JSON.parse(raw) as { finishedAt?: number | null; index?: number }
            if (!checkpoint.finishedAt && Number.isInteger(checkpoint.index)) return pointer.href
          }
        }
      }

      // Support sessions started before the pointer was introduced.
      const keys = Object.keys(localStorage).filter((key) => key.startsWith(`azhar-quiz-selection-v1:${sessionMode}:`)).reverse()
      for (const key of keys) {
        const parts = key.split(':')
        const chaptersRaw = parts[2]
        const savedIds = JSON.parse(localStorage.getItem(key) || 'null') as unknown
        if (!Array.isArray(savedIds) || !savedIds.length || savedIds.some((id) => typeof id !== 'string')) continue
        const checkpointKey = `azhar-active-quiz-v1:${sessionMode}:${savedIds.join(',')}`
        const checkpointRaw = localStorage.getItem(checkpointKey)
        if (!checkpointRaw) continue
        const checkpoint = JSON.parse(checkpointRaw) as { finishedAt?: number | null; index?: number }
        if (checkpoint.finishedAt || !Number.isInteger(checkpoint.index)) continue
        const chapterNumbers = chaptersRaw === 'all' ? 'all' : chaptersRaw.split(',').map(Number).filter(Number.isInteger)
        return quizHref({ chapters: chapterNumbers, count: savedIds.length, mode: sessionMode, filter: 'all', order: 'source' }).replace('/quiz', '/practice-surgery-1/session')
      }
    } catch {
      // Ignore unavailable or malformed saved sessions.
    }
    return null
  }

  useEffect(() => {
    setResumeHref(findIncompleteSession('exam'))
    setResumePracticeHref(findIncompleteSession('practice'))
  }, [])

  function resumePreviousSession(sessionMode: 'exam' | 'practice') {
    const href = findIncompleteSession(sessionMode)
    if (href) {
      router.push(href)
      return
    }
    setResumeMessage(sessionMode === 'exam'
      ? 'مش لاقي امتحان غير مكتمل على نفس المتصفح.'
      : 'مش لاقي تدريب غير مكتمل على نفس المتصفح.')
  }

  const matching = useMemo(() => {
    const bookmarks = new Set(progress.bookmarks)
    let total = 0
    for (const chapterNumber of selected) {
      for (const id of idsByChapter[chapterNumber] ?? []) {
        const attempt = progress.attempts[id]
        if (filter === 'unseen' && attempt) continue
        if (filter === 'incorrect' && (!attempt || attempt.lastCorrect)) continue
        if (filter === 'bookmarked' && !bookmarks.has(id)) continue
        total++
      }
    }
    return total
  }, [selected, idsByChapter, progress, filter])

  const allSelected = selected.size === chapters.length
  const sessionSize = count === 'all' ? matching : Math.min(count, matching)

  function toggleChapter(chapterNumber: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(chapterNumber)) next.delete(chapterNumber)
      else next.add(chapterNumber)
      return next
    })
  }

  function start() {
    // Starting a new session replaces the previous unfinished session of the
    // same type. Keep exam and practice checkpoints independent from each other.
    try {
      const sessionMode = mode === 'exam' ? 'exam' : 'practice'
      localStorage.removeItem(`azhar-latest-incomplete-${sessionMode}-v1`)
      const staleKeys = Object.keys(localStorage).filter((key) =>
        key.startsWith(`azhar-active-quiz-v1:${sessionMode}:`) ||
        key.startsWith(`azhar-quiz-selection-v1:${sessionMode}:`)
      )
      staleKeys.forEach((key) => localStorage.removeItem(key))
    } catch {
      // Continue starting the session if browser storage is unavailable.
    }

    const target = quizHref({
      chapters: allSelected ? 'all' : [...selected].sort((a, b) => a - b),
      count,
      mode,
      filter,
      order,
    })
    router.push(target.replace('/quiz', '/practice-surgery-1/session'))
  }

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-8 overflow-x-hidden pb-28">
      <header className="flex min-w-0 flex-col gap-2">
        <h1 className="text-balance text-3xl font-semibold tracking-tight">Build a session</h1>
        <p className="leading-relaxed text-muted-foreground">
          Practice mode reveals the answer key after each question. Exam mode is timed (72 seconds per question) and
          shows results at the end.
        </p>
<div className="flex flex-wrap gap-2">
          <Link href={quizHref({ chapters: allSelected ? 'all' : [...selected].sort((a, b) => a - b), count, mode, filter, order }).replace('/quiz', '/offline-study')} className="inline-flex w-fit max-w-full rounded-lg border px-4 py-2 text-sm font-semibold">ابدأ الاختبار أوفلاين بنفس الإعدادات</Link>
          {resumeHref ? <Link href={resumeHref} className="inline-flex w-fit items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"><RotateCcw className="size-4" /> استكمال الامتحان السابق</Link> : <button type="button" onClick={() => resumePreviousSession('exam')} className="inline-flex w-fit items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold"><RotateCcw className="size-4" /> استكمال الامتحان السابق</button>}
          {resumePracticeHref ? <Link href={resumePracticeHref} className="inline-flex w-fit items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"><RotateCcw className="size-4" /> استكمال التدريب السابق</Link> : <button type="button" onClick={() => resumePreviousSession('practice')} className="inline-flex w-fit items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold"><RotateCcw className="size-4" /> استكمال التدريب السابق</button>}
        </div>
        {resumeMessage ? <p role="status" className="text-sm text-muted-foreground">{resumeMessage}</p> : null}
      </header>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm font-semibold">Mode</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {([{ value: 'practice', title: 'Practice', body: 'Instant feedback with the source answer key.' }, { value: 'exam', title: 'Exam', body: 'Timed, flag for review, scored at the end.' }] as const).map((option) => (
            <label key={option.value} className={cn('flex cursor-pointer flex-col gap-1 rounded-xl border bg-card p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring', mode === option.value ? 'border-primary bg-accent' : 'hover:bg-muted/60')}>
              <input type="radio" name="mode" value={option.value} checked={mode === option.value} onChange={() => setMode(option.value)} className="sr-only" />
              <span className="font-medium">{option.title}</span><span className="text-sm text-muted-foreground">{option.body}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-8 sm:grid-cols-2">
        <fieldset><legend className="mb-3 text-sm font-semibold">Questions</legend><div className="flex flex-wrap gap-2">{COUNTS.map((value) => <Chip key={String(value)} active={count === value} onClick={() => setCount(value)}>{value === 'all' ? 'All' : value}</Chip>)}</div></fieldset>
        <fieldset><legend className="mb-3 text-sm font-semibold">Order</legend><div className="flex flex-wrap gap-2"><Chip active={order === 'shuffle'} onClick={() => setOrder('shuffle')}>Shuffled</Chip><Chip active={order === 'source'} onClick={() => setOrder('source')}>Book order</Chip></div></fieldset>
      </div>

      <fieldset><legend className="mb-3 text-sm font-semibold">Pool</legend><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{FILTERS.map((option) => <button key={option.value} type="button" aria-pressed={filter === option.value} onClick={() => setFilter(option.value)} className={cn('flex min-w-0 flex-col items-start gap-0.5 rounded-lg border bg-card px-3 py-2.5 text-left transition-colors', filter === option.value ? 'border-primary bg-accent' : 'hover:bg-muted/60')}><span className="text-sm font-medium">{option.label}</span><span className="text-xs text-muted-foreground">{option.hint}</span></button>)}</div></fieldset>

      <fieldset className="flex w-full min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <legend className="text-sm font-semibold">Chapters</legend>
          <Button type="button" variant="outline" size="sm" className="shrink-0 whitespace-nowrap" aria-pressed={allSelected} onClick={() => setSelected(allSelected ? new Set() : new Set(chapters.map((c) => c.chapterNumber)))}>
            {allSelected ? 'Unselect all' : 'Select all'}
          </Button>
        </div>
        <div className="grid w-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
          {chapters.map((chapter) => {
            const checked = selected.has(chapter.chapterNumber)
            return <label key={chapter.chapterNumber} className={cn('flex w-full min-w-0 cursor-pointer items-center gap-3 overflow-hidden rounded-lg border bg-card px-3 py-2.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring', checked ? 'border-primary/60' : 'opacity-70 hover:opacity-100')}>
              <input type="checkbox" checked={checked} onChange={() => toggleChapter(chapter.chapterNumber)} className="sr-only" />
              <span aria-hidden="true" className={cn('flex size-5 shrink-0 items-center justify-center rounded border', checked ? 'border-primary bg-primary text-primary-foreground' : 'bg-background')}>{checked ? <Check className="size-3.5" /> : null}</span>
              <span className="min-w-0 flex-1 truncate text-sm"><span className="mr-1.5 font-mono text-muted-foreground">{chapter.chapterNumber}</span>{chapter.chapter}</span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{chapter.available}</span>
            </label>
          })}
        </div>
      </fieldset>

      <div className="sticky bottom-2 z-20 mx-0 flex w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur sm:bottom-4 sm:gap-4 sm:p-4">
        <p className="min-w-0 flex-1 text-xs leading-5 text-muted-foreground sm:text-sm" aria-live="polite"><span className="font-semibold text-foreground tabular-nums">{sessionSize}</span> questions · {matching} match your filters</p>
        <Button size="lg" className="h-10 max-w-[48%] shrink-0 whitespace-nowrap px-3 sm:max-w-none sm:px-5" disabled={sessionSize === 0} onClick={start}><Play data-icon="inline-start" aria-hidden="true" />Start {mode}</Button>
      </div>
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={cn('min-w-12 rounded-full border px-4 py-1.5 text-sm font-medium tabular-nums transition-colors', active ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted')}>{children}</button>
}
