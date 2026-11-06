import type { Metadata } from 'next'
import { QuizLoader } from '@/components/quiz/quiz-loader'
import { studentQuestions } from '@/lib/bank'
import { parseQuizConfig } from '@/lib/quiz-config'

export const metadata: Metadata = { title: 'Quiz' }

export default async function QuizPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const config = parseQuizConfig(await searchParams)
  const chapterSet = config.chapters === 'all' ? null : new Set(config.chapters)
  const pool = chapterSet ? studentQuestions.filter((q) => chapterSet.has(q.chapterNumber)) : studentQuestions

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
      <QuizLoader key={JSON.stringify(config)} pool={pool} config={config} />
    </main>
  )
}
