'use client'

import { useEffect, useState } from 'react'
import { Check, CircleCheck, CircleX, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isAnswerCorrect, QUESTION_TYPE_LABEL, type Question } from '@/lib/types'
import { cn } from '@/lib/utils'

type QuestionCardProps = {
  question: Question
  number: number
  selected: string[]
  revealed: boolean
  onChoose?: (label: string) => void
}

export function QuestionCard({ question, number, selected, revealed, onChoose }: QuestionCardProps) {
  const multi = question.questionType === 'multiple_select'
  const correct = isAnswerCorrect(question, selected)
  const [aiExplanation, setAiExplanation] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [autoExplained, setAutoExplained] = useState(false)

  async function explainWithAI() {
    setAiLoading(true)
    setAiError(null)
    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter: question.chapter,
          question: question.questionText,
          options: question.options,
          correctAnswers: question.correctAnswer.map((label) => ({
            label, text: question.options.find((option) => option.label === label)?.text ?? '',
          })),
          existingExplanation: question.explanation,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not generate explanation.')
      setAiExplanation(data.explanation)
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Could not generate explanation.')
    } finally {
      setAiLoading(false)
    }
  }

  useEffect(() => {
    if (revealed && selected.length > 0 && !correct && !autoExplained && !aiExplanation && !aiLoading) {
      setAutoExplained(true)
      void explainWithAI()
    }
  }, [revealed, selected, correct, autoExplained, aiExplanation, aiLoading])

  return (
    <article className="flex min-w-0 w-full flex-col gap-4 sm:gap-5" aria-labelledby={`${question.id}-stem`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="font-medium text-primary">
          Ch. {question.chapterNumber} · {question.chapter}
        </span>
        <span aria-hidden="true">·</span>
        <span>
          Book Q{question.sourceQuestionNumber}, p. {question.sourcePage}
        </span>
        {question.questionType !== 'single_best_answer' ? (
          <span className="rounded-full bg-accent px-2 py-0.5 font-medium text-accent-foreground">
            {QUESTION_TYPE_LABEL[question.questionType]}
          </span>
        ) : null}
      </div>

      <h2 id={`${question.id}-stem`} className="min-w-0 whitespace-pre-line break-words text-pretty text-base leading-relaxed font-medium sm:text-lg [overflow-wrap:anywhere]">
        <span className="sr-only">Question {number}: </span>
        {question.questionText}
      </h2>

      <div
        role={multi ? 'group' : 'radiogroup'}
        aria-label="Answer options"
        className="flex flex-col gap-2"
      >
        {question.options.map((option) => {
          const isSelected = selected.includes(option.label)
          const isKey = question.correctAnswer.includes(option.label)
          const state = revealed ? (isKey ? 'correct' : isSelected ? 'wrong' : 'idle') : isSelected ? 'selected' : 'idle'
          return (
            <button
              key={option.label}
              type="button"
              role={multi ? 'checkbox' : 'radio'}
              aria-checked={isSelected}
              disabled={revealed || !onChoose}
              onClick={() => onChoose?.(option.label)}
              className={cn(
                'group flex w-full min-w-0 items-start gap-2.5 rounded-lg border bg-card px-3 py-3 text-left transition-colors disabled:cursor-default sm:gap-3 sm:px-4',
                state === 'idle' && !revealed && 'hover:border-primary/50 hover:bg-muted/50',
                state === 'idle' && revealed && 'opacity-60',
                state === 'selected' && 'border-primary bg-accent',
                state === 'correct' && 'border-success bg-success/10',
                state === 'wrong' && 'border-destructive bg-destructive/10',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center border text-sm font-semibold',
                  multi ? 'rounded-md' : 'rounded-full',
                  state === 'selected' && 'border-primary bg-primary text-primary-foreground',
                  state === 'correct' && 'border-success bg-success text-success-foreground',
                  state === 'wrong' && 'border-destructive bg-destructive text-white',
                  state === 'idle' && 'bg-background text-muted-foreground',
                )}
              >
                {state === 'correct' ? (
                  <Check className="size-4" />
                ) : state === 'wrong' ? (
                  <X className="size-4" />
                ) : (
                  option.label
                )}
              </span>
              <span className="min-w-0 flex-1 whitespace-pre-wrap break-words pt-0.5 leading-relaxed [overflow-wrap:anywhere]">
                <span className="sr-only">{option.label}. </span>
                {option.text}
                {revealed && isKey ? <span className="sr-only"> (correct answer)</span> : null}
                {revealed && isSelected && !isKey ? <span className="sr-only"> (your answer, incorrect)</span> : null}
              </span>
            </button>
          )
        })}
      </div>

      {revealed ? (
        <div
          role="status"
          className={cn(
            'flex flex-col gap-2 rounded-lg border p-4',
            selected.length === 0
              ? 'border-border bg-muted/40'
              : correct
                ? 'border-success/40 bg-success/10'
                : 'border-destructive/40 bg-destructive/10',
          )}
        >
          <p className="flex items-center gap-2 font-semibold">
            {selected.length === 0 ? (
              'Not answered'
            ) : correct ? (
              <>
                <CircleCheck className="size-4 text-success" aria-hidden="true" /> Correct
              </>
            ) : (
              <>
                <CircleX className="size-4 text-destructive" aria-hidden="true" /> Incorrect
              </>
            )}
          </p>
          <p className="text-sm leading-relaxed">
            <span className="text-muted-foreground">Answer key: </span>
            <span className="font-medium">
              {question.correctAnswer
                .map((label) => `${label}. ${question.options.find((o) => o.label === label)?.text ?? ''}`)
                .join('; ')}
            </span>
          </p>

          <div className="flex flex-col items-start gap-3 border-t pt-3">
            {!aiExplanation ? (
              <Button type="button" variant="outline" size="sm" onClick={explainWithAI} disabled={aiLoading}>
                <Sparkles className="size-4" />
                {aiLoading ? 'Generating explanation…' : 'Explain with AI'}
              </Button>
            ) : (
              <div className="w-full rounded-md bg-background/70 p-3">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><Sparkles className="size-4 text-primary" /> AI explanation</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{aiExplanation}</p>
              </div>
            )}
            {aiError ? <p role="alert" className="text-sm text-destructive">{aiError}</p> : null}
            <p className="text-xs text-muted-foreground">AI-generated study aid; verify important medical details with your course sources.</p>
          </div>
        </div>
      ) : null}
    </article>
  )
}
