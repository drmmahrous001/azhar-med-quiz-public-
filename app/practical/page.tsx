import type { Metadata } from 'next'
import Link from 'next/link'
import { PracticalFlashcards } from '../../components/practical/practical-flashcards'

export const metadata: Metadata = { title: 'العملي · الترم السابع' }

export default function PracticalPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 md:py-12">
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/osce-pro-max" className="group overflow-hidden rounded-2xl border bg-card transition hover:border-primary hover:shadow-md">
          <div className="grid grid-cols-[100px_minmax(0,1fr)] items-center gap-4 p-4 sm:grid-cols-[132px_minmax(0,1fr)]">
            <img src="/osce-pro-max/images/page-002-image-01.jpg" alt="معاينة من العملي برو ماكس" className="h-28 w-full rounded-xl bg-muted object-cover object-center sm:h-32" />
            <div>
              <p className="text-xs font-semibold text-primary">OSCE · Surgery</p>
              <h2 className="mt-1 text-xl font-bold">العملي برو ماكس</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">مراجعة بنظام Anki، صور الملف، وأسئلة حسب محتوى الشابتر.</p>
              <span className="mt-3 inline-flex rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">ابدأ المراجعة ←</span>
            </div>
          </div>
        </Link>
        <a href="#practical-instruments" className="group flex items-center gap-4 rounded-2xl border bg-card p-4 transition hover:border-primary hover:shadow-md sm:p-5">
          <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-muted text-3xl" aria-hidden="true">🩺</div>
          <div>
            <p className="text-xs font-semibold text-primary">Practical · Instruments</p>
            <h2 className="text-xl font-bold">العملي أدوات</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">افتح بنك الأدوات الحالي وراجع الكروت بنفس النظام.</p>
            <span className="mt-3 inline-flex rounded-lg border px-3 py-1.5 text-sm font-semibold">اذهب للأدوات ↓</span>
          </div>
        </a>
      </div>
      <div id="practical-instruments" className="scroll-mt-6">
        <PracticalFlashcards />
      </div>
    </main>
  )
}
