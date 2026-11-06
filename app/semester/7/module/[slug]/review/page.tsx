'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/progress-bar'

type Question = {
  id: string
  number?: number
  stem: string
  options: string[]
  correctAnswer: string | null
  sourcePage?: number
}
type Exam = { examId: string; title: string; questions: Question[] }
type ExamSource = { label: string; file: string }

const exams: ExamSource[] = [
  { label: 'Archive End Module 57 — Group A', file: '/data/endocrine/exams/end-module-57-group-a.json' },
  { label: 'Archive End Module 58 — Group A', file: '/data/endocrine/exams/end-module-58-group-a.json' },
  { label: 'Archive End Module 58 — Group B', file: '/data/endocrine/exams/end-module-58-group-b.json' },
  { label: 'End Semester 58', file: '/data/endocrine/exams/end-semester-58.json' },
  { label: 'Archive End Module 59 — Group A', file: '/data/endocrine/exams/archive-end-module-59-group-a.json' },
  { label: 'Archive End Module 59 — Group B', file: '/data/endocrine/exams/archive-end-module-59-group-b.json' },
  { label: 'End Semester 59', file: '/data/endocrine/exams/archive-end-semester-59.json' },
  { label: 'Endocrine Formatives', file: '/data/endocrine/exams/endocrine-formatives.json' },
  { label: 'Congenital Hypothyroidism MCQs', file: '/data/endocrine/exams/congenital-hypothyroidism.json' },
  { label: 'DM Pharma MCQs', file: '/data/endocrine/exams/dm-pharma.json' },
  { label: 'End Module Exam — 24 Feb 2022', file: '/data/endocrine/exams/end-module-2022.json' },
  { label: 'Endocrine Review Set 1', file: '/data/endocrine/exams/endocrine-review-set-1.json' },
  { label: 'End Semester 2022 — Part 1', file: '/data/endocrine/exams/end-semester-2022-part1.json' },
  { label: 'End Semester 2022 — Part 2', file: '/data/endocrine/exams/end-semester-2022-part2.json' },
  { label: 'End Semester 2022 — Part 3', file: '/data/endocrine/exams/end-semester-2022-part3.json' },
  { label: 'End Semester 2022 — Part 4', file: '/data/endocrine/exams/end-semester-2022-part4.json' },
  { label: 'End Semester 2022 — Part 5', file: '/data/endocrine/exams/end-semester-2022-part5.json' },
  { label: 'Other Exams — Model 1', file: '/data/endocrine/exams/other-exam-model-1.json' },
  { label: 'Other Exams — Model 2', file: '/data/endocrine/exams/other-exam-model-2.json' },
  { label: 'Other Exams — Model 3', file: '/data/endocrine/exams/other-exam-model-3.json' },
  { label: 'Other Exams — Model 4', file: '/data/endocrine/exams/other-exam-model-4.json' },
  { label: 'Other Exams — Model 5', file: '/data/endocrine/exams/other-exam-model-5.json' },
  { label: 'Other Exams — Model 6', file: '/data/endocrine/exams/other-exam-model-6.json' },
]

export default function EndocrineReviewPage() {
  const { slug } = useParams<{ slug: string }>()
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [loaded, setLoaded] = useState<Record<string, Exam>>({})
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [aiExplanation, setAiExplanation] = useState<Record<string, string>>({})
  const [aiErrors, setAiErrors] = useState<Record<string, string>>({})
  const [aiLoading, setAiLoading] = useState<string | null>(null)

  const activeExam = activeFile ? loaded[activeFile] : null
  const questions = activeExam?.questions ?? []
  const question = questions[index]
  const correctIndex = question?.correctAnswer ? question.correctAnswer.charCodeAt(0) - 65 : -1
  const answeredInSource = questions.filter(item => Boolean(item.correctAnswer)).length
  const progress = questions.length ? ((index + 1) / questions.length) * 100 : 0
  const questionKey = question ? `${activeExam?.examId}:${question.id}` : ''

  async function openExam(file: string) {
    setError('')
    setIndex(0)
    if (loaded[file]) {
      setActiveFile(file)
      return
    }
    setLoading(true)
    try {
      const response = await fetch(file, { cache: 'no-store' })
      if (!response.ok) throw new Error('تعذر تحميل الملف')
      const data = await response.json() as Exam
      setLoaded(previous => ({ ...previous, [file]: data }))
      setActiveFile(file)
    } catch {
      setError('تعذر تحميل هذا الامتحان. حاول مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  async function explainWithAI() {
    if (!question || !activeExam || aiLoading) return
    setAiLoading(questionKey)
    setAiErrors(previous => ({ ...previous, [questionKey]: '' }))
    try {
      const correctOption = question.correctAnswer
        ? question.options[question.correctAnswer.charCodeAt(0) - 65] ?? ''
        : ''
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter: 'Endocrine',
          question: question.stem,
          options: question.options.map((text, i) => ({ label: String.fromCharCode(65 + i), text })),
          correctAnswers: question.correctAnswer ? [{ label: question.correctAnswer, text: correctOption }] : [],
          existingExplanation: '',
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'تعذر إنشاء الشرح')
      setAiExplanation(previous => ({ ...previous, [questionKey]: data.explanation }))
    } catch (err) {
      setAiErrors(previous => ({ ...previous, [questionKey]: err instanceof Error ? err.message : 'تعذر إنشاء الشرح' }))
    } finally {
      setAiLoading(null)
    }
  }

  if (slug !== 'endocrine') {
    return <main dir="rtl" className="mx-auto max-w-3xl space-y-4 px-4 py-10"><h1 className="text-2xl font-bold">المراجعة غير متاحة</h1><Link href={`/semester/7/module/${slug}`} className="text-primary">العودة للموديول</Link></main>
  }

  return (
    <main dir="rtl" className="mx-auto max-w-5xl space-y-6 px-4 py-7 md:py-10">
      <Link href="/semester/7/module/endocrine" className="inline-flex items-center gap-2 text-sm text-primary"><ArrowRight className="size-4" /> العودة لموديول Endocrine</Link>
      <header className="rounded-3xl border bg-card p-6">
        <p className="text-sm font-semibold text-primary">Al-Azhar Medicine · Endocrine</p>
        <h1 className="mt-2 text-2xl font-bold md:text-3xl">بنك المراجعة المحلولة</h1>
        <p className="mt-2 leading-7 text-muted-foreground">نفس أسلوب بنك الجراحة: اختار الامتحان، وراجع سؤالًا بسؤال مع ظهور الإجابة الصحيحة مباشرة، واطلب شرح الذكاء الاصطناعي وقت ما تحتاجه.</p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><CheckCircle2 className="size-4 text-green-600" /> الإجابة الصحيحة مميزة</span><span className="inline-flex items-center gap-1"><Sparkles className="size-4 text-primary" /> شرح بالذكاء الاصطناعي</span><span>وضع مراجعة للقراءة فقط — لا يغيّر البنك</span></div>
      </header>

      {!activeExam ? (
        <section className="rounded-xl border bg-card">
          <div className="flex items-center gap-3 border-b p-4"><BookOpen className="size-5 text-primary" /><div><h2 className="font-semibold">الامتحانات والموضوعات</h2><p className="text-xs text-muted-foreground">{exams.length} ملف · اختر واحدًا لبدء المراجعة</p></div></div>
          <ol className="divide-y">
            {exams.map((item, examIndex) => {
              const data = loaded[item.file]
              const solved = data?.questions.filter(q => Boolean(q.correctAnswer)).length
              return <li key={item.file}><button type="button" onClick={() => void openExam(item.file)} className="flex w-full items-center gap-3 px-4 py-4 text-right transition-colors hover:bg-muted/50"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">{examIndex + 1}</span><span className="min-w-0 flex-1"><span className="block font-medium">{item.label}</span><span className="mt-1 block text-xs text-muted-foreground">{data ? `${data.questions.length} سؤال · ${solved} بإجابة موجودة` : 'افتح الملف لعرض الأسئلة والإجابات'}</span></span><ChevronLeft className="size-4 shrink-0 text-muted-foreground" /></button></li>
            })}
          </ol>
        </section>
      ) : (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><button onClick={() => { setActiveFile(null); setIndex(0) }} className="mb-2 text-sm text-primary">← قائمة الامتحانات</button><h2 className="text-xl font-bold">{activeExam.title}</h2><p className="text-xs text-muted-foreground">{questions.length} سؤال · {answeredInSource} بإجابة محفوظة في المصدر</p></div><span className="rounded-lg border px-3 py-2 text-sm font-semibold tabular-nums">السؤال {index + 1} / {questions.length}</span></div>
          <ProgressBar value={progress / 100} label={`مراجعة السؤال ${index + 1} من ${questions.length}`} />
          {question ? (
            <article className="space-y-4 rounded-2xl border bg-card p-5 md:p-7">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold text-primary">Question {question.number ?? index + 1}</span>{question.sourcePage ? <span className="text-xs text-muted-foreground">صفحة المصدر {question.sourcePage}</span> : null}</div>
              <h3 className="text-lg font-semibold leading-8">{question.stem}</h3>
              <div className="grid gap-3">
                {question.options.map((option, optionIndex) => {
                  const letter = String.fromCharCode(65 + optionIndex)
                  const correct = optionIndex === correctIndex
                  return <div key={letter} className={`rounded-xl border p-4 leading-7 ${correct ? 'border-green-600 bg-green-50 text-green-950' : 'border-border bg-background'}`}><span className="ml-2 font-bold">{letter}.</span>{option}{correct ? <span className="mr-2 inline-flex items-center gap-1 text-sm font-bold text-green-700"><CheckCircle2 className="size-4" /> الإجابة الصحيحة</span> : null}</div>
                })}
              </div>
              {!question.correctAnswer ? <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">الإجابة غير موجودة في الملف الأصلي. يمكنك طلب تحليل الذكاء الاصطناعي، وسيكون اقتراحًا منفصلًا وليس تعديلًا للمصدر.</p> : null}
              <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="flex items-center gap-2 font-bold"><Sparkles className="size-5 text-primary" /> شرح السؤال بالذكاء الاصطناعي</h4><Button onClick={() => void explainWithAI()} disabled={aiLoading === questionKey}>{aiLoading === questionKey ? 'جاري الشرح…' : aiExplanation[questionKey] ? 'إعادة الشرح' : 'اشرح السؤال'}</Button></div>
                {aiExplanation[questionKey] ? <p className="whitespace-pre-wrap text-sm leading-7">{aiExplanation[questionKey]}</p> : <p className="text-sm text-muted-foreground">اضغط لشرح الفكرة وسبب صحة الإجابة، مع توضيح مستقل إذا لم تكن الإجابة موجودة في الملف.</p>}
                {aiErrors[questionKey] ? <p role="alert" className="text-sm text-destructive">{aiErrors[questionKey]}</p> : null}
              </div>
              <div className="flex items-center justify-between gap-3 border-t pt-4"><Button variant="outline" onClick={() => setIndex(i => Math.max(0, i - 1))} disabled={index === 0}><ChevronRight className="ml-2 size-4" /> السابق</Button><Button onClick={() => setIndex(i => Math.min(questions.length - 1, i + 1))} disabled={index >= questions.length - 1}>التالي <ChevronLeft className="mr-2 size-4" /></Button></div>
            </article>
          ) : <p className="rounded-xl border p-5 text-center text-muted-foreground">لا توجد أسئلة في هذا الملف.</p>}
        </section>
      )}
      {loading ? <p className="text-sm text-muted-foreground">جاري تحميل الأسئلة…</p> : null}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    </main>
  )
}
