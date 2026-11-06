import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SolvedSurgeryReview } from '@/components/review/solved-surgery-review'
import { getChapters, studentQuestions } from '@/lib/bank'

export const metadata: Metadata = { title: 'Solved Surgery Review | مراجعة الجراحة المحلولة' }

export default async function SolvedSurgeryChapterPage({
  params,
}: {
  params: Promise<{ chapterNumber: string }>
}) {
  const { chapterNumber: rawNumber } = await params
  const chapterNumber = Number(rawNumber)
  if (!Number.isInteger(chapterNumber) || chapterNumber < 1) notFound()

  const chapter = getChapters().find((item) => item.chapterNumber === chapterNumber)
  if (!chapter) notFound()

  const questions = studentQuestions.filter((question) => question.chapterNumber === chapterNumber)

  return (
    <SolvedSurgeryReview
      questions={questions}
      chapterNumber={chapterNumber}
      chapterTitle={chapter.chapter}
    />
  )
}
