import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { parseBook } from '../lib/import/parse-book.ts'

const raw = readFileSync('data/source/surgery-book.txt', 'utf8')
const result = parseBook(raw)

mkdirSync('data/generated', { recursive: true })
writeFileSync('data/generated/questions.json', JSON.stringify(result.questions, null, 2))
writeFileSync('data/generated/study.json', JSON.stringify({ essays: result.essays, checklists: result.checklists }, null, 2))
writeFileSync('data/generated/import-report.json', JSON.stringify(result.report, null, 2))

const r = result.report
console.log(
  JSON.stringify(
    {
      totalQuestions: r.totalQuestions,
      verifiedAnswers: r.verifiedAnswers,
      missing: r.missingOrUncertainAnswers,
      duplicateGroups: r.duplicateGroups,
      pages: r.pagesProcessed,
      lastPage: r.lastPageSeen,
      essays: r.essayQuestionCount,
      checklists: r.checklistCount,
      reviewPages: r.pagesNeedingReview,
      chapters: r.chapters.map((c) => `${c.chapterNumber} ${c.chapter}: ${c.questionCount} (${c.flagged} flagged)`),
      statusCounts: result.questions.reduce<Record<string, number>>((acc, q) => {
        acc[q.verificationStatus] = (acc[q.verificationStatus] ?? 0) + 1
        return acc
      }, {}),
      flagCounts: result.questions.reduce<Record<string, number>>((acc, q) => {
        for (const f of q.flags) acc[f] = (acc[f] ?? 0) + 1
        return acc
      }, {}),
      warnings: r.warnings.slice(0, 40),
      warningCount: r.warnings.length,
    },
    null,
    1,
  ),
)
