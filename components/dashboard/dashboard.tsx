'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Bookmark, BookOpen, CircleX, Play, Target, Zap, Stethoscope } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { ProgressBar } from '@/components/progress-bar'
import { useProgress } from '@/lib/progress-store'
import { quizHref } from '@/lib/quiz-config'
import type { ChapterSummary } from '@/lib/types'
import { cn } from '@/lib/utils'

type DashboardProps = {
  chapters: ChapterSummary[]
  idsByChapter: Record<number, string[]>
  totalAvailable: number
  essayCount: number
  checklistCount: number
}

export function Dashboard({ chapters, idsByChapter, totalAvailable, essayCount, checklistCount }: DashboardProps) {
  const progress = useProgress()
  const reviewAllHref = '/surgery-bank'

  const stats = useMemo(() => {
    const valid = new Set(Object.values(idsByChapter).flat())
    let seen = 0
    let totalAttempts = 0
    let totalCorrect = 0
    let mistakes = 0
    for (const [id, attempt] of Object.entries(progress.attempts)) {
      if (!valid.has(id)) continue
      seen++
      totalAttempts += attempt.seen
      totalCorrect += attempt.correct
      if (!attempt.lastCorrect) mistakes++
    }
    const perChapter = chapters.map((chapter) => {
      const ids = idsByChapter[chapter.chapterNumber] ?? []
      let chapterSeen = 0
      let lastCorrect = 0
      for (const id of ids) {
        const attempt = progress.attempts[id]
        if (attempt) {
          chapterSeen++
          if (attempt.lastCorrect) lastCorrect++
        }
      }
      return { ...chapter, seen: chapterSeen, accuracy: chapterSeen ? Math.round((lastCorrect / chapterSeen) * 100) : null }
    })
    return {
      seen,
      accuracy: totalAttempts ? Math.round((totalCorrect / totalAttempts) * 100) : null,
      mistakes,
      bookmarks: progress.bookmarks.filter((id) => valid.has(id)).length,
      perChapter,
    }
  }, [chapters, idsByChapter, progress])

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex max-w-2xl flex-col gap-3">
          <p className="text-sm font-medium text-primary">Al-Azhar · Surgery Questions & Clinical Exam Book</p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Practice surgery MCQs, chapter by chapter.
          </h1>
          <p className="text-pretty leading-relaxed text-muted-foreground">
            {totalAvailable} questions across {chapters.length} chapters, with answers taken directly from the book&apos;s
            answer key. Your progress is saved in this browser.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={quizHref({ count: 20 })} className={cn(buttonVariants({ size: 'lg' }), 'h-10 px-4')}>
            <Zap data-icon="inline-start" aria-hidden="true" />
            Quick 20
          </Link>
          <Link href="/practice-surgery-1" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-10 px-4')}>
            <Play data-icon="inline-start" aria-hidden="true" />
            Custom session
          </Link>
        </div>
      </section>

      <Link href={reviewAllHref} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 transition hover:bg-primary/10 sm:gap-4">
        <span className="flex min-w-0 items-center gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><BookOpen className="size-5" /></span><span className="min-w-0"><span className="block font-bold">مراجعة بنك الجراحة</span><span className="mt-1 block text-sm text-muted-foreground">افتح المواضيع مباشرة، اختار الشابتر وابدأ تجاوب على أسئلته</span></span></span><span className="shrink-0 text-sm font-semibold text-primary">اختار موضوع ←</span>
      </Link>

      <Link href="/practical" className="flex items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4 transition hover:bg-primary/10">
        <span className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Stethoscope className="size-5" /></span><span><span className="block font-bold">Practical Surgery</span><span className="mt-1 block text-sm text-muted-foreground">كروت عملي بنظام Anki مع إظهار الإجابة وتقييم الحفظ</span></span></span><span className="text-sm font-semibold text-primary">ابدأ المراجعة ←</span>
      </Link>


      <section aria-label="Your statistics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<Target className="size-4" aria-hidden="true" />}
          label="Questions seen"
          value={`${stats.seen}`}
          hint={`of ${totalAvailable}`}
        />
        <StatCard
          icon={<Target className="size-4" aria-hidden="true" />}
          label="Accuracy"
          value={stats.accuracy === null ? '—' : `${stats.accuracy}%`}
          hint="all attempts"
        />
        <StatCard
          icon={<CircleX className="size-4" aria-hidden="true" />}
          label="To review"
          value={`${stats.mistakes}`}
          hint="last answer wrong"
          href={stats.mistakes ? quizHref({ filter: 'incorrect', count: 'all' }) : undefined}
          cta="Review mistakes"
        />
        <StatCard
          icon={<Bookmark className="size-4" aria-hidden="true" />}
          label="Bookmarked"
          value={`${stats.bookmarks}`}
          hint="saved questions"
          href={stats.bookmarks ? quizHref({ filter: 'bookmarked', count: 'all', order: 'source' }) : undefined}
          cta="Practice bookmarks"
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="chapters-heading" className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 id="chapters-heading" className="text-lg font-semibold">
              Chapters
            </h2>
            <span className="text-sm text-muted-foreground">Mastery = last answer correct</span>
          </div>
          <ul className="flex flex-col divide-y rounded-xl border bg-card">
            {stats.perChapter.map((chapter) => (
              <li key={chapter.chapterNumber}>
                <Link
                  href={quizHref({ chapters: [chapter.chapterNumber], count: 'all', mode: 'practice', filter: 'all', order: 'source' })}
                  className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60"
                >
                  <span className="w-6 shrink-0 font-mono text-sm text-muted-foreground tabular-nums">
                    {chapter.chapterNumber}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="truncate text-sm font-medium">{chapter.chapter}</span>
                    <ProgressBar
                      value={chapter.available ? chapter.seen / chapter.available : 0}
                      label={`${chapter.seen} of ${chapter.available} seen`}
                    />
                  </span>
                  <span className="flex w-20 shrink-0 flex-col items-end text-right">
                    <span className="text-sm font-medium tabular-nums">
                      {chapter.accuracy === null ? '—' : `${chapter.accuracy}%`}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {chapter.seen}/{chapter.available}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <aside className="flex flex-col gap-6">
          <section aria-labelledby="recent-heading" className="flex flex-col gap-3">
            <h2 id="recent-heading" className="text-lg font-semibold">
              Recent sessions
            </h2>
            {progress.sessions.length === 0 ? (
              <p className="rounded-xl border border-dashed p-4 text-sm leading-relaxed text-muted-foreground">
                No sessions yet. Start a quick 20-question set to see your results here.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {progress.sessions.slice(0, 6).map((session) => {
                  const scoreDenominator = session.mode === 'exam' ? session.total : session.answered
                  const score = scoreDenominator ? Math.round((session.correct / scoreDenominator) * 100) : 0
                  return (
                    <li key={session.id} className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5">
                      <span
                        className={cn(
                          'flex size-10 shrink-0 items-center justify-center rounded-md text-sm font-semibold tabular-nums',
                          score >= 70
                            ? 'bg-success/15 text-success'
                            : score >= 50
                              ? 'bg-warning/15 text-warning'
                              : 'bg-destructive/15 text-destructive',
                        )}
                      >
                        {score}%
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="text-sm font-medium capitalize">
                          {session.mode} · {session.correct}/{scoreDenominator}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {session.mode === 'exam' ? `إجابات: ${session.answered}/${session.total} · ` : ''}{new Date(session.at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Study materials</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {essayCount} essay prompts and {checklistCount} clinical examination checklists from Parts 2 and 3 of the
              book.
            </p>
            <Link href="/study" className={cn(buttonVariants({ variant: 'secondary' }), 'self-start')}>
              Open study section
            </Link>
          </section>
        </aside>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  hint,
  href,
  cta,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint: string
  href?: string
  cta?: string
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-4">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </span>
      {href && cta ? (
        <Link href={href} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          {cta}
        </Link>
      ) : null}
    </div>
  )
}
