import type { ParsedQuestion } from '@/lib/import/parse-book'

export type Question = ParsedQuestion & { id: string }

export type ChapterSummary = {
  chapterNumber: number
  chapter: string
  total: number
  available: number
}

/** Only publish questions whose complete answer key maps to real, unique options. */
export function isStudentReady(q: ParsedQuestion) {
  if (q.verificationStatus !== 'verified') return false
  if (!q.questionText?.trim() || !Array.isArray(q.options) || q.options.length < 2) return false
  if (!Array.isArray(q.correctAnswer) || q.correctAnswer.length === 0) return false
  const labels = q.options.map((option) => option.label?.trim().toUpperCase())
  if (labels.some((label) => !label) || new Set(labels).size !== labels.length) return false
  if (q.options.some((option) => !option.text?.trim())) return false
  const answerLabels = q.correctAnswer.map((label) => label.trim().toUpperCase())
  if (answerLabels.some((label) => !label) || new Set(answerLabels).size !== answerLabels.length) return false
  if (!answerLabels.every((label) => labels.includes(label))) return false
  if (q.questionType === 'single_best_answer' && answerLabels.length !== 1) return false
  if (q.questionType === 'multiple_select' && answerLabels.length < 2) return false
  return true
}

export function isAnswerCorrect(q: Pick<Question, 'correctAnswer'>, selected: string[]) {
  if (!Array.isArray(selected) || !Array.isArray(q.correctAnswer) || selected.length === 0) return false
  const normalizedSelected = selected.map((label) => String(label).trim().toUpperCase())
  const normalizedCorrect = q.correctAnswer.map((label) => String(label).trim().toUpperCase())
  if (normalizedSelected.some((label) => !label) || normalizedCorrect.some((label) => !label)) return false
  if (new Set(normalizedSelected).size !== normalizedSelected.length || new Set(normalizedCorrect).size !== normalizedCorrect.length) return false
  return normalizedSelected.length === normalizedCorrect.length &&
    [...normalizedSelected].sort().every((label, index) => label === [...normalizedCorrect].sort()[index])
}

export const QUESTION_TYPE_LABEL: Record<Question['questionType'], string> = {
  single_best_answer: 'Single best answer',
  multiple_select: 'Select all that apply',
  extended_matching: 'Extended matching',
}
