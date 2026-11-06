import type { Metadata } from 'next'
import { PracticeSetup } from '@/components/practice/practice-setup'
import { getChapters, getIdsByChapter } from '@/lib/bank'

export const metadata: Metadata = { title: 'Practice Surgery 1 | تدريب الجراحة' }

export default function PracticeSurgeryOnePage() {
  return (
    <main className="mx-auto w-full min-w-0 max-w-6xl overflow-x-clip px-4 py-8 md:py-12">
      <PracticeSetup chapters={getChapters()} idsByChapter={getIdsByChapter()} />
    </main>
  )
}
