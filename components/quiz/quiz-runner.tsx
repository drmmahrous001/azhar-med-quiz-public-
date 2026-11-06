'use client'

import { useEffect, useRef, useState } from 'react'
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Clock, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/progress-bar'
import { QuestionCard } from '@/components/quiz/question-card'
import { QuizResults } from '@/components/quiz/quiz-results'
import { recordAttempt, recordSession, toggleBookmark, useProgress } from '@/lib/progress-store'
import type { QuizConfig } from '@/lib/quiz-config'
import { isAnswerCorrect, type Question } from '@/lib/types'
import { cn } from '@/lib/utils'

const SECONDS_PER_QUESTION = 72

type QuizRunnerProps = { questions: Question[]; config: QuizConfig; onRestart: () => void }

export function QuizRunner({ questions, config, onRestart }: QuizRunnerProps) {
  const isExam = config.mode === 'exam'
  const isStudy = config.mode === 'study'
  const progress = useProgress()
  const [index, setIndex] = useState(0)
  const [selections, setSelections] = useState<Record<string, string[]>>({})
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [marked, setMarked] = useState<Set<string>>(() => new Set())
  const [startedAt, setStartedAt] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())
  const [finishedAt, setFinishedAt] = useState<number | null>(null)
  const [restored, setRestored] = useState(false)
  const checkpointKey = `azhar-active-quiz-v1:${config.mode}:${questions.map((question) => question.id).join(',')}`

  useEffect(() => {
    try {
      // Study sessions always start clean: never restore stale answers or a finished checkpoint.
      if (isStudy) {
        localStorage.removeItem(checkpointKey)
        setRestored(true)
        return
      }
      const raw = localStorage.getItem(checkpointKey)
      if (raw) {
        const saved = JSON.parse(raw) as {
          index?: number
          selections?: Record<string, string[]>
          revealed?: Record<string, boolean>
          marked?: string[]
          startedAt?: number
          finishedAt?: number | null
        }
        if (Number.isInteger(saved.index)) setIndex(Math.max(0, Math.min(questions.length - 1, saved.index as number)))
        if (saved.selections && typeof saved.selections === 'object') setSelections(saved.selections)
        if (saved.revealed && typeof saved.revealed === 'object') setRevealed(saved.revealed)
        if (Array.isArray(saved.marked)) setMarked(new Set(saved.marked))
        if (typeof saved.startedAt === 'number') setStartedAt(saved.startedAt)
        if (typeof saved.finishedAt === 'number' || saved.finishedAt === null) setFinishedAt(saved.finishedAt)
      }
    } catch {
      // Ignore a damaged checkpoint and start a fresh quiz.
    }
    setRestored(true)
  }, [checkpointKey, questions.length])

  useEffect(() => {
    if (!restored || isStudy) return
    try {
      localStorage.setItem(checkpointKey, JSON.stringify({
        index, selections, revealed, marked: Array.from(marked), startedAt, finishedAt,
      }))
      if (isExam || config.mode === 'practice') {
        const sessionMode = isExam ? 'exam' : 'practice'
        const pointerKey = `azhar-latest-incomplete-${sessionMode}-v1`
        if (finishedAt) {
          const pointerRaw = localStorage.getItem(pointerKey)
          const pointer = pointerRaw ? JSON.parse(pointerRaw) as { checkpointKey?: string } : null
          if (pointer?.checkpointKey === checkpointKey) localStorage.removeItem(pointerKey)
        } else {
          const chapters = config.chapters === 'all' ? 'all' : config.chapters
          const href = `/practice-surgery-1/session?${new URLSearchParams({
            chapters: Array.isArray(chapters) ? chapters.join(',') : chapters,
            count: String(questions.length),
            mode: sessionMode,
            filter: 'all',
            order: 'source',
          }).toString()}`
          localStorage.setItem(pointerKey, JSON.stringify({ checkpointKey, href, updatedAt: Date.now() }))
        }
      }
    } catch {
      // Keep the quiz usable if browser storage is unavailable.
    }
  }, [checkpointKey, config.chapters, finishedAt, index, isExam, marked, questions.length, restored, revealed, selections, startedAt])

  const current = questions[index]
  const selected = selections[current.id] ?? []
  const isRevealed = Boolean(revealed[current.id])
  const isLast = index === questions.length - 1
  const answeredCount = Object.values(selections).filter((s) => s.length > 0).length
  const remainingSec = isExam ? Math.max(0, questions.length * SECONDS_PER_QUESTION - Math.floor((now - startedAt) / 1000)) : null
  const expired = remainingSec === 0

  function choose(label: string) {
    if (isStudy || isRevealed || finishedAt) return
    const multi = current.questionType === 'multiple_select'
    setSelections((prev) => {
      const existing = prev[current.id] ?? []
      const next = multi
        ? existing.includes(label)
          ? existing.filter((l) => l !== label)
          : [...existing, label].sort()
        : [label]
      return { ...prev, [current.id]: next }
    })
    if (!multi && !isExam) {
      const isCorrect = isAnswerCorrect(current, [label])
      setRevealed((prev) => ({ ...prev, [current.id]: true }))
      recordAttempt(current.id, isCorrect)
      if (isCorrect && index < questions.length - 1) {
        window.setTimeout(() => setIndex((i) => Math.min(questions.length - 1, i + 1)), 650)
      }
    }
  }

  function check() {
    if ((!selected.length && !isStudy) || isRevealed) return
    setRevealed((prev) => ({ ...prev, [current.id]: true }))
    if (!isStudy) recordAttempt(current.id, isAnswerCorrect(current, selected))
  }

  function go(delta: number) {
    setIndex((i) => Math.min(questions.length - 1, Math.max(0, i + delta)))
  }

  function finish() {
    if (finishedAt || finishedRef.current) return
    finishedRef.current = true
    const end = Date.now()
    const graded = isExam ? questions : questions.filter((q) => revealed[q.id])
    if (isExam) {
      // Every exam item is assessed at submission; skipped questions enter the mistakes queue.
      for (const q of questions) {
        const selectedAnswer = selections[q.id] ?? []
        recordAttempt(q.id, selectedAnswer.length > 0 && isAnswerCorrect(q, selectedAnswer))
      }
    }
    const answered = isExam
      ? questions.filter((q) => (selections[q.id] ?? []).length > 0).length
      : graded.length
    const correct = isExam
      ? questions.filter((q) => (selections[q.id] ?? []).length > 0 && isAnswerCorrect(q, selections[q.id] ?? [])).length
      : graded.filter((q) => isAnswerCorrect(q, selections[q.id] ?? [])).length
    recordSession({
      mode: config.mode,
      answered,
      total: questions.length,
      correct,
      durationSec: Math.round((end - startedAt) / 1000),
      chapters: config.chapters,
    })
    setFinishedAt(end)
  }

  const finishRef = useRef(finish)
  const finishedRef = useRef(false)
  const keyHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {})
  useEffect(() => {
    finishRef.current = finish
    keyHandlerRef.current = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const key = event.key.toUpperCase()
      if (key.length === 1 && key >= 'A' && key <= 'H') {
        if (current.options.some((o) => o.label === key)) {
          event.preventDefault()
          choose(key)
        }
      } else if (event.key === 'ArrowRight') go(1)
      else if (event.key === 'ArrowLeft') go(-1)
      else if (event.key === 'Enter' && target?.tagName !== 'BUTTON') {
        event.preventDefault()
        if (!isExam && !isRevealed) check()
        else if (!isLast) go(1)
      }
    }
  })

  useEffect(() => {
    if (finishedAt) return
    const onKey = (e: KeyboardEvent) => keyHandlerRef.current(e)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finishedAt])

  useEffect(() => {
    if (!isExam || finishedAt) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [isExam, finishedAt])

  useEffect(() => {
    if (expired) finishRef.current()
  }, [expired])

  if (finishedAt) {
    return (
      <QuizResults
        questions={questions}
        selections={selections}
        graded={isExam ? undefined : revealed}
        config={config}
        durationSec={Math.round((finishedAt - startedAt) / 1000)}
        onRestart={onRestart}
      />
    )
  }

  const bookmarked = progress.bookmarks.includes(current.id)
  const isMarked = marked.has(current.id)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium">
              <span className="capitalize text-muted-foreground">{isStudy ? 'Study mode' : config.mode} · </span>
              Question <span className="tabular-nums">{index + 1}</span> of{' '}
              <span className="tabular-nums">{questions.length}</span>
            </p>
            <div className="flex items-center gap-1">
              {remainingSec !== null ? (
                <span
                  className={cn(
                    'mr-2 flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 font-mono text-sm tabular-nums',
                    remainingSec < 60 && 'bg-destructive/15 text-destructive',
                  )}
                  role="timer"
                  aria-label="Time remaining"
                >
                  <Clock className="size-3.5" aria-hidden="true" />
                  {formatClock(remainingSec)}
                </span>
              ) : null}
              <Button
                variant="ghost"
                size="icon"
                aria-pressed={bookmarked}
                aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark question'}
                onClick={() => toggleBookmark(current.id)}
              >
                {bookmarked ? <BookmarkCheck className="text-primary" /> : <Bookmark />}
              </Button>
              {isExam ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-pressed={isMarked}
                  aria-label={isMarked ? 'Unflag for review' : 'Flag for review'}
                  onClick={() =>
                    setMarked((prev) => {
                      const next = new Set(prev)
                      if (next.has(current.id)) next.delete(current.id)
                      else next.add(current.id)
                      return next
                    })
                  }
                >
                  <Flag className={cn(isMarked && 'fill-warning text-warning')} />
                </Button>
              ) : null}
            </div>
          </div>
          <ProgressBar
            value={(isExam ? answeredCount : Object.keys(revealed).length) / questions.length}
            label="Session progress"
          />
        </div>

        <div className="rounded-xl border bg-card/50 p-5 md:p-7">
          <QuestionCard
            key={current.id}
            question={current}
            number={index + 1}
            selected={selected}
            revealed={isRevealed}
            onChoose={isStudy ? undefined : choose}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="lg" className="h-10" onClick={() => go(-1)} disabled={index === 0}>
            <ChevronLeft data-icon="inline-start" aria-hidden="true" />
            Previous
          </Button>
          <div className="flex items-center gap-2">
            {isStudy && !isRevealed ? (
              <Button size="lg" className="h-10 px-5" onClick={check}>
                Reveal answer &amp; explanation
              </Button>
            ) : !isExam && !isRevealed && current.questionType === 'multiple_select' ? (
              <Button size="lg" className="h-10 px-5" onClick={check} disabled={!selected.length}>
                Check answer
              </Button>
            ) : isLast ? (
              <Button size="lg" className="h-10 px-5" onClick={finish}>
                {isStudy ? 'Back to study library' : isExam ? 'Submit exam' : 'See results'}
              </Button>
            ) : (
              <Button size="lg" className="h-10 px-5" onClick={() => go(1)}>
                Next
                <ChevronRight data-icon="inline-end" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
        <p className="hidden text-xs text-muted-foreground md:block">
          Keyboard: press A–E to choose, Enter to {isExam ? 'continue' : 'check / continue'}, arrow keys to move.
        </p>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Navigator</h2>
          <ol className="grid grid-cols-8 gap-1.5 lg:grid-cols-5">
            {questions.map((q, i) => {
              const s = selections[q.id] ?? []
              const done = isExam ? s.length > 0 : revealed[q.id]
              const right = !isExam && done && isAnswerCorrect(q, s)
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Go to question ${i + 1}${done ? ', answered' : ''}${marked.has(q.id) ? ', flagged' : ''}`}
                    aria-current={i === index ? 'step' : undefined}
                    className={cn(
                      'flex aspect-square w-full items-center justify-center rounded-md border text-xs font-medium tabular-nums transition-colors',
                      !done && 'bg-background text-muted-foreground hover:bg-muted',
                      done && isExam && 'border-primary/40 bg-primary/15 text-foreground',
                      done && !isExam && right && 'border-success/40 bg-success/15 text-success',
                      done && !isExam && !isStudy && !right && 'border-destructive/40 bg-destructive/15 text-destructive',
                      marked.has(q.id) && 'ring-2 ring-warning',
                      i === index && 'outline-2 outline-offset-1 outline-primary',
                    )}
                  >
                    {i + 1}
                  </button>
                </li>
              )
            })}
          </ol>
        </div>
        <Button variant={isExam ? 'default' : 'outline'} onClick={isStudy ? onRestart : finish}>
          {isStudy ? 'Back to study library' : isExam ? `Submit exam (${answeredCount}/${questions.length})` : 'End session'}
        </Button>
      </aside>
    </div>
  )
}

function formatClock(totalSec: number) {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
