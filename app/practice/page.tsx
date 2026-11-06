import type { Metadata } from 'next'
import { PracticeSetup } from '@/components/practice/practice-setup'
import { getChapters, getIdsByChapter } from '@/lib/bank'

export const metadata: Metadata = { title: 'تدريب الجراحة' }

export default function PracticePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <PracticeSetup chapters={getChapters()} idsByChapter={getIdsByChapter()} />
    </main>
  )
}
