export type QuizFilter = 'all' | 'unseen' | 'incorrect' | 'bookmarked'

export type QuizConfig = {
  chapters: number[] | 'all'
  count: number | 'all'
  mode: 'practice' | 'exam' | 'study'
  filter: QuizFilter
  order: 'shuffle' | 'source'
  questionIds?: string[]
}

type Params = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export function parseQuizConfig(params: Params): QuizConfig {
  const chaptersRaw = first(params.chapters)
  const chapterList = (chaptersRaw ?? '')
    .split(',')
    .map((v) => Number.parseInt(v, 10))
    .filter((n) => Number.isInteger(n) && n > 0)
  const countRaw = first(params.count)
  const countNum = Number.parseInt(countRaw ?? '', 10)
  const filter = first(params.filter)
  const modeRaw = first(params.mode)
  const idsRaw = first(params.ids)
  return {
    chapters: chapterList.length ? chapterList : 'all',
    count: countRaw === 'all' ? 'all' : Number.isInteger(countNum) && countNum > 0 ? Math.min(countNum, 500) : 20,
    mode: modeRaw === 'exam' || modeRaw === 'study' ? modeRaw : 'practice',
    filter: filter === 'unseen' || filter === 'incorrect' || filter === 'bookmarked' ? filter : 'all',
    order: first(params.order) === 'source' ? 'source' : 'shuffle',
    questionIds: idsRaw ? idsRaw.split(',').filter(Boolean) : undefined,
  }
}

export function quizHref(config: Partial<QuizConfig>) {
  const params = new URLSearchParams()
  params.set('chapters', !config.chapters || config.chapters === 'all' ? 'all' : config.chapters.join(','))
  params.set('count', String(config.count ?? 20))
  params.set('mode', config.mode ?? 'practice')
  params.set('filter', config.filter ?? 'all')
  params.set('order', config.order ?? 'shuffle')
  if (config.questionIds?.length) params.set('ids', config.questionIds.join(','))
  return `/quiz?${params.toString()}`
}
