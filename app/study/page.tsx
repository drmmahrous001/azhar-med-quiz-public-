import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, Play } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { StudyBrowser } from '@/components/study-browser'
import { study } from '@/lib/bank'

export const metadata: Metadata = { title: 'مذاكرة الجراحة' }

export default function StudyPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:py-12">
      <section className="flex flex-col gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><BookOpen className="size-5" /></span>
          <div className="min-w-0"><h2 className="font-bold">Surgery Question Bank</h2><p className="mt-1 text-sm text-muted-foreground">افتح بنك أسئلة الجراحة، اختار الشابتر وابدأ المراجعة بالإجابات.</p></div>
        </div>
        <div className="flex flex-wrap gap-2"><Link href="/quiz?chapters=all&count=20&mode=practice&filter=all&order=shuffle" className={buttonVariants({ size: 'lg' })}><Play data-icon="inline-start" aria-hidden="true" />ابدأ التدريب مباشرة</Link><Link href="/practice-surgery-1" className={buttonVariants({ variant: 'outline', size: 'lg' })}>بناء Session مخصص</Link></div>
      </section>
      <StudyBrowser essays={study.essays} checklists={study.checklists} />
    </main>
  )
}
