'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { QuestionCard } from '@/components/quiz/question-card'
import { quizHref, type QuizConfig } from '@/lib/quiz-config'
import { isAnswerCorrect, type Question } from '@/lib/types'
import { cn } from '@/lib/utils'

type QuizResultsProps = {
  questions: Question[]
  selections: Record<string, string[]>
  graded?: Record<string, boolean>
  config: QuizConfig
  durationSec: number
  onRestart: () => void
}

export function QuizResults({ questions, selections, graded, config, durationSec, onRestart }: QuizResultsProps) {
  const [view, setView] = useState<'incorrect' | 'all'>('incorrect')

  const result = useMemo(() => {
    const scored = graded ? questions.filter((q) => graded[q.id]) : questions
    const rows = scored.map((q) => ({ q, correct: isAnswerCorrect(q, selections[q.id] ?? []) }))
    const byChapter = new Map<number, { chapter: string; total: number; correct: number }>()
    for (const row of rows) {
      const entry = byChapter.get(row.q.chapterNumber) ?? { chapter: row.q.chapter, total: 0, correct: 0 }
      entry.total++
      if (row.correct) entry.correct++
      byChapter.set(row.q.chapterNumber, entry)
    }
    const correct = rows.filter((r) => r.correct).length
    return {
      rows,
      correct,
      total: rows.length,
      pct: rows.length ? Math.round((correct / rows.length) * 100) : 0,
      byChapter: [...byChapter.entries()].sort((a, b) => a[0] - b[0]),
    }
  }, [questions, selections, graded])

  const visible = view === 'all' ? result.rows : result.rows.filter((r) => !r.correct)
  // Include both answered-wrong and never-answered questions in the retry session.
  const retryQuestions = questions.filter((q) => {
    const wasAnswered = graded ? Boolean(graded[q.id]) : true
    return !wasAnswered || !isAnswerCorrect(q, selections[q.id] ?? [])
  })
  const retryHref = quizHref({
    chapters: config.chapters,
    count: 'all',
    filter: 'all',
    mode: 'practice',
    order: 'source',
    questionIds: retryQuestions.map((q) => q.id),
  }).replace('/quiz', '/practice-surgery-1/session')
  const tone = result.pct >= 70 ? 'text-success' : result.pct >= 50 ? 'text-warning' : 'text-destructive'

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-6 rounded-xl border bg-card p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium capitalize text-muted-foreground">{config.mode} complete</p>
          <h1 className="flex items-baseline gap-3">
            <span className={cn('text-5xl font-semibold tabular-nums', tone)}>{result.pct}%</span>
            <span className="text-lg text-muted-foreground tabular-nums">
              {result.correct} / {result.total} correct
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {Math.floor(durationSec / 60)}m {durationSec % 60}s
            {graded && result.total < questions.length
              ? ` · ${questions.length - result.total} question(s) skipped`
              : null}
            {!graded ? ` · unanswered questions count as incorrect` : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onRestart}>
            <RotateCcw data-icon="inline-start" aria-hidden="true" />
            New set, same chapters
          </Button>
          {retryQuestions.length > 0 ? (
            <Link href={retryHref} className={buttonVariants()}>
              Retry mistakes &amp; skipped ({retryQuestions.length})
            </Link>
          ) : null}
          <Link href="/" className={buttonVariants({ variant: 'ghost' })}>
            Dashboard
          </Link>
        </div>
      </section>

      {result.byChapter.length > 1 ? (
        <section aria-labelledby="by-chapter" className="flex flex-col gap-3">
          <h2 id="by-chapter" className="text-lg font-semibold">
            By chapter
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {result.byChapter.map(([number, entry]) => (
              <li key={number} className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2">
                <span className="truncate text-sm">
                  <span className="mr-1.5 font-mono text-muted-foreground">{number}</span>
                  {entry.chapter}
                </span>
                <span className="text-sm font-medium tabular-nums">
                  {entry.correct}/{entry.total}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="review-heading" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="review-heading" className="text-lg font-semibold">
            Review
          </h2>
          <div className="flex gap-1 rounded-lg bg-muted p-1" role="group" aria-label="Review filter">
            {(['incorrect', 'all'] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={view === value}
                onClick={() => setView(value)}
                className={cn(
                  'rounded-md px-3 py-1 text-sm capitalize transition-colors',
                  view === value ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground',
                )}
              >
                {value === 'incorrect' ? `Incorrect (${result.total - result.correct})` : `All (${result.total})`}
              </button>
            ))}
          </div>
        </div>
        {visible.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nothing to review here — every scored answer was correct.
          </p>
        ) : (
          <ol className="flex flex-col gap-4">
            {visible.map(({ q }) => (
              <li key={q.id} className="rounded-xl border bg-card/50 p-5 md:p-6">
                <QuestionCard
                  question={q}
                  number={questions.indexOf(q) + 1}
                  selected={selections[q.id] ?? []}
                  revealed
                />
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
