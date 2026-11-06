import rawQuestions from '@/data/generated/questions.json'
import rawStudy from '@/data/generated/study.json'
import rawReport from '@/data/generated/import-report.json'
import type { ChecklistSection, EssaySection, ImportReport, ParsedQuestion } from '@/lib/import/parse-book'
import { isStudentReady, type ChapterSummary, type Question } from '@/lib/types'

export const allQuestions: Question[] = (rawQuestions as unknown as ParsedQuestion[]).map((q, i) => ({
  ...q,
  id: `q${String(i + 1).padStart(4, '0')}`,
}))

export const studentQuestions = allQuestions.filter(isStudentReady)

export const study = rawStudy as unknown as { essays: EssaySection[]; checklists: ChecklistSection[] }

export const importReport = rawReport as unknown as ImportReport

export function getChapters(): ChapterSummary[] {
  const map = new Map<number, ChapterSummary>()
  for (const q of allQuestions) {
    let summary = map.get(q.chapterNumber)
    if (!summary) {
      summary = { chapterNumber: q.chapterNumber, chapter: q.chapter, total: 0, available: 0 }
      map.set(q.chapterNumber, summary)
    }
    summary.total++
    if (isStudentReady(q)) summary.available++
  }
  return [...map.values()].sort((a, b) => a.chapterNumber - b.chapterNumber)
}

export function getIdsByChapter() {
  const result: Record<number, string[]> = {}
  for (const q of studentQuestions) {
    ;(result[q.chapterNumber] ??= []).push(q.id)
  }
  return result
}
