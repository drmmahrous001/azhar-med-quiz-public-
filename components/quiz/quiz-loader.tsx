'use client'

import dynamic from 'next/dynamic'
import type { QuizConfig } from '@/lib/quiz-config'
import type { Question } from '@/lib/types'

// Selection depends on browser-stored progress and random shuffling, so render client-only.
const QuizSession = dynamic(() => import('./quiz-session').then((m) => m.QuizSession), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading questions">
      <div className="h-6 w-48 animate-pulse rounded bg-muted" />
      <div className="h-64 animate-pulse rounded-xl bg-muted" />
    </div>
  ),
})

export function QuizLoader({ pool, config }: { pool: Question[]; config: QuizConfig }) {
  return <QuizSession pool={pool} config={config} />
}
