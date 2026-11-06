'use client'

import { useProgress } from '@/lib/progress-store'
import Link from 'next/link'
import { ArrowLeft, BookOpen, ChevronLeft } from 'lucide-react'
import { getChapters, getIdsByChapter } from '@/lib/bank'
import { ProgressBar } from '@/components/progress-bar'

export default function SurgeryBankPage() {
  const chapters = getChapters()
  const idsByChapter = getIdsByChapter()
  const progress = useProgress()

  return (
    <main dir="rtl" className="mx-auto w-full min-w-0 max-w-5xl space-y-6 px-4 py-7 md:py-10">
      <div className="flex items-center gap-3">
        <Link href="/semester/7" className="flex size-10 shrink-0 items-center justify-center rounded-lg border hover:bg-muted" aria-label="العودة للوحة الجراحة">
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0">
          <p className="text-sm font-medium text-primary">Al-Azhar · Surgery</p>
          <h1 className="text-2xl font-bold md:text-3xl">بنك أسئلة الجراحة</h1>
          <p className="mt-1 text-sm text-muted-foreground">اختار الموضوع وابدأ حل الأسئلة بترتيبها في البنك.</p>
        </div>
      </div>

      <section className="rounded-xl border bg-card">
        <div className="flex items-center gap-3 border-b p-4">
          <BookOpen className="size-5 text-primary" />
          <div>
            <h2 className="font-semibold">المواضيع</h2>
            <p className="text-xs text-muted-foreground">{chapters.length} موضوع · مرتبة حسب تسلسل البنك</p>
          </div>
        </div>
        <ol className="divide-y">
          {chapters.map((chapter) => {
            const ids = idsByChapter[chapter.chapterNumber] ?? []
            const count = ids.length
            const seen = ids.filter((id) => Boolean(progress.attempts[id])).length
            const mastery = seen ? Math.round((ids.filter((id) => progress.attempts[id]?.lastCorrect).length / seen) * 100) : null
            return (
              <li key={chapter.chapterNumber}>
                <Link
                  href={`/surgery-bank/${chapter.chapterNumber}`}
                  className="flex min-w-0 items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/50"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">{chapter.chapterNumber}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{chapter.chapter}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{count} سؤال · شوهد {seen} · الإتقان {mastery === null ? '—' : `${mastery}%`}</span>
                    <ProgressBar value={count ? seen / count : 0} label={`${seen} من ${count} تمت رؤيتها`} />
                  </span>
                  <ChevronLeft className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            )
          })}
        </ol>
      </section>
    </main>
  )
}
