import Link from 'next/link'
import { BookOpen, ClipboardList, Stethoscope, Layers, ArrowRight, Zap, Play, Activity } from 'lucide-react'

const sections = [
  { title: 'MCQ Bank', subtitle: 'بنك الأسئلة والامتحانات', icon: ClipboardList, href: 'mcq' },
  { title: 'Practical', subtitle: 'المراجعة العملية', icon: Stethoscope, href: 'practical' },
  { title: 'Study & Revision', subtitle: 'المذاكرة والمراجعة', icon: BookOpen, href: 'study' },
  { title: 'Module Content', subtitle: 'محاضرات ومحتوى الموديول', icon: Layers, href: 'content' },
  { title: 'Written Questions', subtitle: 'أسئلة المقالي والإجابات النصية', icon: BookOpen, href: 'study' },
]

export function ModuleLanding({ module }: { module: string }) {
  const titles: Record<string, string> = {
    surgery1: 'Surgery 1',
    endocrine: 'Endocrine',
    pediatrics: 'Pediatrics',
    infection: 'Infection',
  }
  const title = titles[module] ?? module.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
  const isEndocrine = module === 'endocrine'
  const mcqHref = module === 'surgery1' ? '/surgery-bank' : isEndocrine ? `/semester/7/module/${module}/mcq` : null

  return (
    <main dir="rtl" className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:py-12">
      <Link href="/semester/7" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
        <ArrowRight className="size-4" /> رجوع لموديولات الترم السابع
      </Link>

      <section className="flex flex-col gap-6 rounded-3xl border bg-card p-6 md:flex-row md:items-end md:justify-between md:p-9">
        <div className="max-w-2xl space-y-3">
          <p className="text-sm font-semibold text-primary">Al-Azhar Medicine · Semester 7</p>
          <h1 className="text-3xl font-bold md:text-4xl">موديول {title}</h1>
          <p className="text-sm leading-7 text-muted-foreground">
            {isEndocrine
              ? 'ذاكر الاندو بنفس نظام بنك الجراحة: اختار امتحان، حل سؤال بسؤال، تابع إجاباتك وارجع للأسئلة اللي محتاجة مراجعة.'
              : 'الصفحة الرئيسية للموديول: بنك الأسئلة، العملي، المذاكرة، والمحتوى.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {mcqHref ? <Link href={mcqHref} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"><Zap className="size-4" /> ابدأ حل الأسئلة</Link> : <span aria-disabled="true" className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold text-muted-foreground">بنك MCQ غير منشور بعد</span>}
          <Link href={`/semester/7/module/${module}/study`} className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold hover:bg-muted">
            <BookOpen className="size-4" /> المذاكرة
          </Link>
        </div>
      </section>

      {isEndocrine && (
        <Link href={`/semester/7/module/${module}/review`} className="flex items-center justify-between gap-4 rounded-xl border border-green-600/30 bg-green-500/5 p-4 transition hover:bg-green-500/10">
          <span className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-green-600 text-white"><BookOpen className="size-5" /></span>
            <span>
              <span className="block font-bold">بنك المراجعة المحلولة</span>
              <span className="mt-1 block text-sm text-muted-foreground">افتح الأسئلة وشاهد الإجابات الصحيحة مباشرة — قراءة فقط دون تعديل البنك</span>
            </span>
          </span>
          <span className="text-sm font-semibold text-green-700">ابدأ المراجعة ←</span>
        </Link>
      )}

      {isEndocrine && (
        <Link href={`/semester/7/module/${module}/mcq`} className="flex items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4 transition hover:bg-primary/10">
          <span className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Activity className="size-5" /></span>
            <span>
              <span className="block font-bold">بنك أسئلة Endocrine</span>
              <span className="mt-1 block text-sm text-muted-foreground">Formative · Congenital · DM Pharma · Surgery · End Module · End Semester</span>
            </span>
          </span>
          <span className="text-sm font-semibold text-primary">اختار امتحان ←</span>
        </Link>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-bold">أقسام الموديول</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map(({ title, subtitle, icon: Icon, href }) => {
            const target = href === 'mcq' ? mcqHref : `/semester/7/module/${module}/${href}`
            const content = <><div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></div><div><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{subtitle}</p><span className="mt-3 inline-block text-xs text-primary">{href === 'mcq' ? target ? 'اختبر نفسك ←' : 'غير متاح حاليًا' : href === 'study' ? 'ذاكر الموديول ←' : href === 'practical' ? 'راجع العملي ←' : 'افتح المحتوى ←'}</span></div></>
            return target ? <Link key={title} href={target} className="flex min-h-44 flex-col justify-between rounded-2xl border bg-card p-5 transition hover:border-primary/50 hover:bg-primary/5">{content}</Link> : <div key={title} aria-disabled="true" className="flex min-h-44 flex-col justify-between rounded-2xl border bg-muted/30 p-5 opacity-70">{content}</div>
          })}
        </div>
      </section>
    </main>
  )
}
