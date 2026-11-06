'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/progress-bar'
import type { Question } from '@/lib/types'

export function SolvedSurgeryReview({
  questions,
  chapterNumber,
  chapterTitle,
}: {
  questions: Question[]
  chapterNumber: number
  chapterTitle: string
}) {
  const [index, setIndex] = useState(0)
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({})
  const [aiErrors, setAiErrors] = useState<Record<string, string>>({})
  const [aiLoading, setAiLoading] = useState(false)
  const question = questions[index]
  const progress = questions.length ? ((index + 1) / questions.length) * 100
    : 0
  const correct = new Set((question?.correctAnswer ?? []).map((answer) => answer.trim().toUpperCase()))

  async function explainCurrentQuestion() {
    if (!question || aiExplanations[question.id] || aiLoading) return
    setAiLoading(true)
    setAiErrors((previous) => ({ ...previous, [question.id]: '' }))
    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter: question.chapter,
          question: question.questionText,
          options: question.options,
          correctAnswers: question.correctAnswer.map((label) => ({
            label,
            text: question.options.find((option) => option.label === label)?.text ?? '',
          })),
          existingExplanation: question.explanation,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'تعذّر إنشاء الشرح.')
      setAiExplanations((previous) => ({ ...previous, [question.id]: data.explanation }))
    } catch (error) {
      setAiErrors((previous) => ({
        ...previous,
        [question.id]: error instanceof Error ? error.message : 'تعذّر إنشاء الشرح، حاول مرة أخرى.',
      }))
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <main dir="rtl" className="mx-auto w-full max-w-5xl space-y-6 px-4 py-7 md:py-10">
      <Link href="/surgery-bank" className="inline-flex items-center gap-2 text-sm text-primary">
        <ArrowRight className="size-4" /> العودة إلى مواضيع الجراحة
      </Link>

      <header className="rounded-2xl border bg-card p-5 md:p-7">
        <p className="text-sm font-semibold text-primary">Al-Azhar Medicine · Surgery</p>
        <h1 className="mt-2 text-2xl font-bold md:text-3xl">مراجعة محلولة — {chapterTitle}</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          السؤال والإجابة الصحيحة ظاهرين مباشرة. وضع قراءة فقط؛ لا يحتاج إلى حل ولا يغيّر تقدمك في التدريب.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><BookOpen className="size-4" /> {questions.length} سؤال</span>
          <span className="inline-flex items-center gap-1"><CheckCircle2 className="size-4 text-green-600" /> الإجابات الصحيحة من مفتاح البنك</span>
        </div>
      </header>

      {questions.length === 0 ? (
        <section className="rounded-xl border border-dashed p-8 text-center">
          <h2 className="font-semibold">لا توجد أسئلة متاحة لهذا الموضوع</h2>
          <p className="mt-2 text-sm text-muted-foreground">لم يتم العثور على أسئلة منشورة بإجابات موثقة.</p>
        </section>
      ) : (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">{chapterTitle}</h2>
              <p className="text-xs text-muted-foreground">الفصل {chapterNumber} · مراجعة بالترتيب الأصلي</p>
            </div>
            <span className="rounded-lg border px-3 py-2 text-sm font-semibold tabular-nums">السؤال {index + 1} / {questions.length}</span>
          </div>
          <ProgressBar value={progress / 100} label={`مراجعة السؤال ${index + 1} من ${questions.length}`} />

          {question ? (
            <article className="space-y-4 rounded-2xl border bg-card p-5 md:p-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-primary">Question {question.sourceQuestionNumber ?? index + 1}</span>
                {question.sourcePage ? <span className="text-xs text-muted-foreground">صفحة المصدر {question.sourcePage}</span> : null}
              </div>
              <h3 className="text-lg font-semibold leading-8">{question.questionText}</h3>
              <div className="grid gap-3">
                {question.options.map((option) => {
                  const isCorrect = correct.has(option.label.trim().toUpperCase())
                  return (
                    <div
                      key={option.label}
                      className={`rounded-xl border p-4 leading-7 ${isCorrect ? 'border-green-600 bg-green-50 text-green-950 dark:bg-green-950/30 dark:text-green-100' : 'border-border bg-background'}`}
                    >
                      <span className="ml-2 font-bold">{option.label}.</span>{option.text}
                      {isCorrect ? <span className="mr-2 inline-flex items-center gap-1 text-sm font-bold text-green-700 dark:text-green-300"><CheckCircle2 className="size-4" /> الإجابة الصحيحة</span> : null}
                    </div>
                  )
                })}
              </div>
              {question.explanation ? (
                <div className="rounded-xl border bg-muted/30 p-4">
                  <h4 className="mb-2 font-bold">توضيح من المصدر</h4>
                  <p className="whitespace-pre-wrap text-sm leading-7">{question.explanation}</p>
                </div>
              ) : null}

              <div className="space-y-3 border-t pt-4">
                {aiExplanations[question.id] ? (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                    <h4 className="mb-2 flex items-center gap-2 font-bold"><Sparkles className="size-4 text-primary" /> الشرح التوضيحي بالذكاء الاصطناعي</h4>
                    <p className="whitespace-pre-wrap text-sm leading-7">{aiExplanations[question.id]}</p>
                  </div>
                ) : (
                  <Button type="button" variant="outline" onClick={explainCurrentQuestion} disabled={aiLoading}>
                    <Sparkles className="ml-2 size-4" />
                    {aiLoading ? 'جاري إعداد الشرح...' : 'شرح توضيحي بالذكاء الاصطناعي'}
                  </Button>
                )}
                {aiErrors[question.id] ? <p role="alert" className="text-sm text-destructive">{aiErrors[question.id]}</p> : null}
                <p className="text-xs text-muted-foreground">شرح تعليمي مولّد بالذكاء الاصطناعي؛ راجع المصادر الدراسية في المعلومات الطبية المهمة.</p>
              </div>

              <div className="flex items-center justify-between gap-3 border-t pt-4">
                <Button variant="outline" onClick={() => setIndex((current) => Math.max(0, current - 1))} disabled={index === 0}>
                  <ChevronRight className="ml-2 size-4" /> السابق
                </Button>
                <Button onClick={() => setIndex((current) => Math.min(questions.length - 1, current + 1))} disabled={index === questions.length - 1}>
                  التالي <ChevronLeft className="mr-2 size-4" />
                </Button>
              </div>
            </article>
          ) : null}
        </section>
      )}
    </main>
  )
}
