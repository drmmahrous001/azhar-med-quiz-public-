'use client'

import Link from 'next/link'
import { BookOpen, GraduationCap, Layers3, Stethoscope, ArrowLeft, LockKeyhole } from 'lucide-react'

const years = [
  { year: 1, terms: [1, 2] },
  { year: 2, terms: [3, 4] },
  { year: 3, terms: [5, 6] },
  { year: 4, terms: [7, 8] },
  { year: 5, terms: [9, 10] },
]

export function AcademicHome() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:py-12" dir="rtl">
      <section className="relative overflow-hidden rounded-3xl border bg-card p-6 md:p-10">
        <div className="absolute -left-10 -top-12 size-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-semibold text-primary"><GraduationCap className="size-4"/> منصة أسئلة كلية الطب</span>
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">ذاكر، اختبر نفسك، وتابع تقدمك</h1>
            <p className="text-sm leading-7 text-muted-foreground md:text-base">بنك أسئلة منظم حسب السنة الدراسية والترم، وكل المحتوى في مكان واحد.</p>
          </div>
          <div className="grid size-20 shrink-0 place-items-center self-start rounded-2xl bg-primary text-primary-foreground md:size-28"><BookOpen className="size-10 md:size-14"/></div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div><h2 className="text-xl font-bold">اختار السنة الدراسية</h2><p className="mt-1 text-sm text-muted-foreground">كل سنة مقسمة إلى ترمين</p></div>
          <span className="hidden rounded-full bg-muted px-3 py-1 text-xs sm:inline-flex">5 سنوات · 10 ترمات</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {years.map(({year, terms}) => (
            <article key={year} className="rounded-2xl border bg-card p-4 md:p-5">
              <div className="mb-4 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><Layers3 className="size-5"/></span><div><h3 className="font-bold">الفرقة {['الأولى','الثانية','الثالثة','الرابعة','الخامسة'][year-1]}</h3><p className="text-xs text-muted-foreground">السنة الدراسية {year}</p></div></div>
              <div className="grid grid-cols-2 gap-2">
                {terms.map(term => term === 7 ? (
                  <div key={term} className="col-span-2 rounded-xl border border-primary/40 bg-primary/5 p-3">
                    <div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold text-primary">الترم {term}</span><span className="text-xs text-muted-foreground">الفرقة الرابعة</span></div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[{name:"Surgery 1",slug:"surgery1"},{name:"Endocrine",slug:"endocrine"},{name:"Pediatrics",slug:"pediatrics"},{name:"Infection",slug:"infection"}].map((module) => <Link key={module.slug} href={module.slug==="surgery1"?"/semester/7":`/semester/7/module/${module.slug}`} className="flex min-h-16 items-center justify-center rounded-lg border bg-background px-2 text-center text-sm font-semibold transition hover:border-primary hover:bg-primary/10">{module.name}</Link>)}
                    </div>
                  </div>
                ) : (
                  <div key={term} className="flex min-h-24 flex-col justify-between rounded-xl border border-dashed bg-muted/20 p-3">
                    <span className="text-xs font-semibold">الترم {term}</span><span className="text-sm font-medium text-muted-foreground">المحتوى قريبًا</span><span className="flex items-center gap-1 text-xs text-muted-foreground"><LockKeyhole className="size-3"/> لم تتم إضافة الأسئلة</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <Link href="/practical" className="flex items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-4 transition hover:bg-primary/10 md:p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground"><Stethoscope className="size-5" /></div>
            <div>
              <p className="font-bold">عملي الجراحة — الترم السابع</p>
              <p className="mt-1 text-sm text-muted-foreground">الأدوات والحالات وكروت المراجعة</p>
            </div>
          </div>
          <ArrowLeft className="size-5 text-primary" />
        </Link>
        <Link href="/osce-pro-max" className="flex items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-4 transition hover:bg-primary/10 md:p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground"><BookOpen className="size-5" /></div>
            <div>
              <p className="font-bold">Surgery OSCE Pro Max</p>
              <p className="mt-1 text-sm text-muted-foreground">ملف مراجعة العملي كاملًا</p>
            </div>
          </div>
          <ArrowLeft className="size-5 text-primary" />
        </Link>
      </section>
    </main>
  )
}
