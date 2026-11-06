/**
 * Deterministic parser for the typeset text of the "Surgery Questions & Clinical
 * Examination Book". It never rewrites source wording: lines are only joined
 * where the PDF wrapped them. Anything it cannot interpret is flagged instead
 * of guessed.
 */

export type ParsedQuestionType = 'single_best_answer' | 'multiple_select' | 'extended_matching'

export type ParsedOption = { label: string; text: string }

export type ParsedQuestion = {
  subject: string
  chapter: string
  chapterNumber: number
  subchapter: string | null
  questionText: string
  questionType: ParsedQuestionType
  options: ParsedOption[]
  correctAnswer: string[]
  explanation: string | null
  sourceFile: string
  sourcePage: number | null
  sourceQuestionNumber: string | null
  imageUrl: string | null
  verificationStatus: 'verified' | 'unverified' | 'needs_review'
  flags: string[]
}

export type EssaySection = {
  chapter: string
  sourcePage: number | null
  items: string[]
}

export type ChecklistSection = {
  title: string
  sourcePage: number | null
  lines: string[]
}

export type ChapterReport = {
  chapterNumber: number
  chapter: string
  originalPage: number | null
  questionCount: number
  verified: number
  flagged: number
}

export type ImportReport = {
  sourceFile: string
  totalLines: number
  pagesProcessed: number
  lastPageSeen: number | null
  totalQuestions: number
  verifiedAnswers: number
  missingOrUncertainAnswers: number
  duplicateGroups: number
  chapters: ChapterReport[]
  pagesNeedingReview: number[]
  warnings: string[]
  essayQuestionCount: number
  checklistCount: number
  generatedAt: string
}

export type ParseResult = {
  questions: ParsedQuestion[]
  essays: EssaySection[]
  checklists: ChecklistSection[]
  report: ImportReport
}

const PAGE_HEADER = /^Surgery Questions & Clinical Exam Book$/
const PAGE_NUMBER = /^Page (\d+)$/
const PART_HEADER = /^Part (\d):/
const CHAPTER_HEADER = /^(\d{1,2})\.\s+([A-Z][A-Z0-9 &,'’\-()/]+?)\s*(?:\[Original Page (\d+)\])?$/
const ORIGINAL_PAGE_ONLY = /^\[Original Page (\d+)\]$/
const QUESTION_START = /^(\d{1,3})\.\s+(.+)$/
const OPTION_START = /^([A-H])[.)]\s*(.*)$/
const ANSWER_LINE = /^(?:The\s+)?ANSWERs?(?:\s+are)?\s*[:;]?\s*\((.+)\)\.?\s*$/i
const ITEMS_GROUP = /^Items (\d+)\s*-\s*(\d+)\s*[;:,.]?\s*(.*)$/
const INFORMATIONAL_FLAGS = new Set(['numbering_irregular'])
const ESSAY_HEADER = /^([A-Z][A-Z0-9 &,'’\-()/]+?)\s*(?:\[Original Page (\d+)\])?$/

function titleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\b(And|Of|The|&)\b/g, (m) => (m === 'The' ? m : m.toLowerCase()))
    .replace(/^the/, 'The')
}

function joinWrapped(previous: string, next: string) {
  if (!previous) return next
  if (previous.endsWith('-') && /^[a-z]/.test(next)) return previous + next
  return `${previous} ${next}`
}

export function normalizeForDuplicate(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

type Draft = {
  number: string
  text: string
  options: ParsedOption[]
  page: number | null
  flags: string[]
}

export function parseBook(raw: string, sourceFile = 'Surgery_Questions_Book_Professional_Typeset.pdf'): ParseResult {
  const lines = raw.split(/\r?\n/).map((l) => l.replace(/\s+$/g, '').replace(/^\s+/g, ''))
  const questions: ParsedQuestion[] = []
  const essays: EssaySection[] = []
  const checklists: ChecklistSection[] = []
  const warnings: string[] = []
  const pagesSeen = new Set<number>()
  const reviewPages = new Set<number>()
  const chapterMeta = new Map<number, { name: string; originalPage: number | null }>()

  let part = 0
  let page: number | null = null
  let chapterNumber = 0
  let chapterName = ''
  let awaitingOriginalPage = false
  let draft: Draft | null = null
  let lastQuestionNumber = 0

  let group: {
    from: number
    to: number
    stem: string
    options: ParsedOption[]
    items: Draft[]
    page: number | null
  } | null = null

  let sharedStem: { from: number; to: number; stem: string } | null = null

  let essay: EssaySection | null = null
  let checklist: ChecklistSection | null = null

  const pushQuestion = (q: Omit<ParsedQuestion, 'subject' | 'chapter' | 'chapterNumber' | 'subchapter' | 'sourceFile' | 'explanation' | 'imageUrl'>) => {
    questions.push({
      subject: 'Surgery',
      chapter: chapterName,
      chapterNumber,
      subchapter: null,
      sourceFile,
      explanation: null,
      imageUrl: null,
      ...q,
    })
  }

  const finalizeDraft = (answerRaw: string | null) => {
    if (!draft) return
    const d = draft
    draft = null
    const flags = [...d.flags]
    const labels = d.options.map((o) => o.label)
    let correct: string[] = []
    if (answerRaw) {
      correct = answerRaw
        .split(/[,&\s]+/)
        .map((s) => s.trim().toUpperCase())
        .filter((s) => /^[A-H]$/.test(s))
      if (correct.length === 0) flags.push('answer_unparseable')
      if (correct.some((c) => !labels.includes(c))) flags.push('answer_not_in_options')
    } else {
      flags.push('missing_answer')
    }
    if (d.options.length < 2) flags.push('incomplete_options')
    const expected = 'ABCDEFGH'.slice(0, d.options.length)
    if (labels.join('') !== expected) flags.push('option_labels_out_of_order')
    if (!d.text.trim()) flags.push('empty_question_text')

    const hasAnswer = correct.length > 0 && !flags.includes('answer_not_in_options')
    const blocking = flags.filter((f) => !INFORMATIONAL_FLAGS.has(f))
    const status: ParsedQuestion['verificationStatus'] = !hasAnswer
      ? 'unverified'
      : blocking.length > 0
        ? 'needs_review'
        : 'verified'
    if (status !== 'verified' && d.page) reviewPages.add(d.page)

    const n = Number(d.number)
    const stem = sharedStem && n >= sharedStem.from && n <= sharedStem.to ? sharedStem.stem.trim() : ''
    if (sharedStem && n >= sharedStem.to) sharedStem = null

    pushQuestion({
      questionText: stem ? `${stem}\n\n${d.text.trim()}` : d.text.trim(),
      questionType: correct.length > 1 ? 'multiple_select' : 'single_best_answer',
      options: d.options,
      correctAnswer: hasAnswer ? correct : [],
      sourcePage: d.page,
      sourceQuestionNumber: d.number,
      verificationStatus: status,
      flags,
    })
  }

  const finalizeGroup = (answerRaw: string) => {
    if (!group) return
    const g = group
    group = null
    lastQuestionNumber = g.to
    const mapping = new Map<string, string[]>()
    for (const m of answerRaw.matchAll(/(\d+)\s*-\s*([A-H](?:\s*,\s*[A-H](?![a-z]))*)/gi)) {
      mapping.set(
        m[1],
        m[2]
          .split(',')
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean),
      )
    }
    const labels = g.options.map((o) => o.label)
    for (const item of g.items) {
      const flags = [...item.flags]
      const answer = mapping.get(item.number) ?? []
      if (answer.length === 0) flags.push('missing_answer')
      else if (answer.some((a) => !labels.includes(a))) flags.push('answer_not_in_options')
      if (!g.stem.trim()) flags.push('missing_shared_stem')
      const ok = answer.length > 0 && answer.every((a) => labels.includes(a))
      if (!ok && item.page) reviewPages.add(item.page)
      const blocking = flags.filter((f) => !INFORMATIONAL_FLAGS.has(f))
      pushQuestion({
        questionText: g.stem.trim() ? `${g.stem.trim()}\n\n${item.text.trim()}` : item.text.trim(),
        questionType: answer.length > 1 ? 'multiple_select' : 'extended_matching',
        options: g.options,
        correctAnswer: ok ? answer : [],
        sourcePage: item.page ?? g.page,
        sourceQuestionNumber: item.number,
        verificationStatus: ok ? (blocking.length ? 'needs_review' : 'verified') : 'unverified',
        flags,
      })
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue
    if (PAGE_HEADER.test(line)) continue
    const pageMatch = line.match(PAGE_NUMBER)
    if (pageMatch) {
      page = Number(pageMatch[1])
      pagesSeen.add(page)
      continue
    }

    const partMatch = line.match(PART_HEADER)
    if (partMatch) {
      if (draft) {
        warnings.push(`Question ${(draft as Draft).number} in "${chapterName}" ended without an answer key.`)
        finalizeDraft(null)
      }
      part = Number(partMatch[1])
      continue
    }

    if (part === 0) continue

    if (part === 1) {
      if (awaitingOriginalPage) {
        const op = line.match(ORIGINAL_PAGE_ONLY)
        awaitingOriginalPage = false
        if (op) {
          chapterMeta.set(chapterNumber, { name: chapterName, originalPage: Number(op[1]) })
          continue
        }
      }

      const chapterMatch = line.match(CHAPTER_HEADER)
      if (chapterMatch && !/[a-z]/.test(chapterMatch[2]) && !draft && !group) {
        chapterNumber = Number(chapterMatch[1])
        chapterName = titleCase(chapterMatch[2].trim())
        lastQuestionNumber = 0
        const op = chapterMatch[3] ? Number(chapterMatch[3]) : null
        chapterMeta.set(chapterNumber, { name: chapterName, originalPage: op })
        awaitingOriginalPage = op === null
        continue
      }

      const answerMatch = line.match(ANSWER_LINE)
      if (answerMatch) {
        if (group) finalizeGroup(answerMatch[1])
        else if (draft) finalizeDraft(answerMatch[1])
        else {
          warnings.push(`Orphan answer line "${line}" on page ${page}.`)
          if (page) reviewPages.add(page)
        }
        continue
      }

      const itemsMatch = line.match(ITEMS_GROUP)
      if (itemsMatch && !draft) {
        group = {
          from: Number(itemsMatch[1]),
          to: Number(itemsMatch[2]),
          stem: itemsMatch[3] ?? '',
          options: [],
          items: [],
          page,
        }
        continue
      }

      if (group) {
        const g = group
        const qm = line.match(QUESTION_START)
        const n = qm ? Number(qm[1]) : NaN
        if (qm && n >= g.from && n <= g.to) {
          g.items.push({ number: qm[1], text: qm[2], options: [], page, flags: [] })
          continue
        }
        const om = line.match(OPTION_START)
        if (om && g.items.length === 0) {
          g.options.push({ label: om[1], text: om[2] })
          continue
        }
        if (om && om[1] === 'A' && g.items.length === 1 && g.options.length === 0) {
          const item = g.items[0]
          sharedStem = { from: g.from, to: g.to, stem: g.stem }
          lastQuestionNumber = Number(item.number)
          draft = { number: item.number, text: item.text, options: [{ label: 'A', text: om[2] }], page: item.page, flags: [] }
          group = null
          continue
        }
        if (g.items.length > 0) {
          const last = g.items[g.items.length - 1]
          last.text = joinWrapped(last.text, line)
        } else if (g.options.length > 0) {
          const last = g.options[g.options.length - 1]
          last.text = joinWrapped(last.text, line)
        } else {
          g.stem = joinWrapped(g.stem, line)
        }
        continue
      }

      const qm = line.match(QUESTION_START)
      const startNumber = qm ? Number(qm[1]) : NaN
      const canStart =
        qm !== null &&
        (!draft || ((draft as Draft).options.length >= 2 && startNumber === lastQuestionNumber + 1))
      if (qm && canStart) {
        if (draft) {
          warnings.push(`Question ${(draft as Draft).number} in "${chapterName}" has no answer key (page ${page}).`)
          finalizeDraft(null)
        }
        const n = startNumber
        const flags: string[] = []
        if (lastQuestionNumber && n !== lastQuestionNumber + 1) {
          flags.push('numbering_irregular')
          warnings.push(`Numbering jumps from ${lastQuestionNumber} to ${n} in "${chapterName}" (page ${page}).`)
        }
        lastQuestionNumber = n
        draft = { number: qm[1], text: qm[2], options: [], page, flags }
        continue
      }

      if (draft) {
        const d: Draft = draft
        const om = line.match(OPTION_START)
        const expectedLabel = String.fromCharCode(65 + d.options.length)
        if (om && om[1] === expectedLabel) {
          d.options.push({ label: om[1], text: om[2] })
          continue
        }
        if (d.options.length > 0) {
          const last = d.options[d.options.length - 1]
          last.text = joinWrapped(last.text, line)
        } else {
          d.text = joinWrapped(d.text, line)
        }
        continue
      }

      warnings.push(`Unrecognised line on page ${page}: "${line.slice(0, 80)}"`)
      if (page) reviewPages.add(page)
      continue
    }

    if (part === 2) {
      const header = line.match(ESSAY_HEADER)
      if (header && !/[a-z]/.test(header[1]) && header[1].length > 3) {
        essay = { chapter: titleCase(header[1].trim()), sourcePage: page, items: [] }
        essays.push(essay)
        continue
      }
      if (ORIGINAL_PAGE_ONLY.test(line)) continue
      if (!essay) {
        warnings.push(`Essay line before any chapter on page ${page}: "${line.slice(0, 80)}"`)
        continue
      }
      if (/^[a-z]/.test(line) && essay.items.length > 0) {
        essay.items[essay.items.length - 1] = joinWrapped(essay.items[essay.items.length - 1], line)
      } else {
        essay.items.push(line)
      }
      continue
    }

    if (part === 3) {
      if (/^\d+\]$/.test(line)) continue
      if (/^Item \/ Clinical Skill/.test(line) || /^mark$/i.test(line)) continue
      const titleMatch = line.match(/^(.+?)\s*\[Original Page (\d+)\]$/)
      if (titleMatch) {
        checklist = { title: titleMatch[1].trim(), sourcePage: page, lines: [] }
        checklists.push(checklist)
        continue
      }
      if (!checklist) continue
      const isContinuation = /^[a-z(]/.test(line) && checklist.lines.length > 0 && !/[.:]$/.test(checklist.lines[checklist.lines.length - 1])
      if (isContinuation) {
        checklist.lines[checklist.lines.length - 1] = joinWrapped(checklist.lines[checklist.lines.length - 1], line)
      } else {
        checklist.lines.push(line)
      }
    }
  }

  if (draft) {
    warnings.push(`Final question ${(draft as Draft).number} ended without an answer key.`)
    finalizeDraft(null)
  }

  const dupMap = new Map<string, number[]>()
  questions.forEach((q, idx) => {
    const key = normalizeForDuplicate(q.questionText + '|' + q.options.map((o) => o.text).join('|'))
    const arr = dupMap.get(key) ?? []
    arr.push(idx)
    dupMap.set(key, arr)
  })
  let duplicateGroups = 0
  for (const idxs of dupMap.values()) {
    if (idxs.length > 1) {
      duplicateGroups++
      for (const idx of idxs) {
        if (!questions[idx].flags.includes('possible_duplicate')) questions[idx].flags.push('possible_duplicate')
      }
    }
  }

  const chapters: ChapterReport[] = [...chapterMeta.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([num, meta]) => {
      const qs = questions.filter((q) => q.chapterNumber === num)
      return {
        chapterNumber: num,
        chapter: meta.name,
        originalPage: meta.originalPage,
        questionCount: qs.length,
        verified: qs.filter((q) => q.verificationStatus === 'verified').length,
        flagged: qs.filter((q) => q.verificationStatus !== 'verified').length,
      }
    })

  const pageList = [...pagesSeen].sort((a, b) => a - b)
  const report: ImportReport = {
    sourceFile,
    totalLines: lines.length,
    pagesProcessed: pageList.length,
    lastPageSeen: pageList.length ? pageList[pageList.length - 1] : null,
    totalQuestions: questions.length,
    verifiedAnswers: questions.filter((q) => q.correctAnswer.length > 0).length,
    missingOrUncertainAnswers: questions.filter((q) => q.correctAnswer.length === 0).length,
    duplicateGroups,
    chapters,
    pagesNeedingReview: [...reviewPages].sort((a, b) => a - b),
    warnings,
    essayQuestionCount: essays.reduce((n, e) => n + e.items.length, 0),
    checklistCount: checklists.length,
    generatedAt: new Date().toISOString(),
  }

  return { questions, essays, checklists, report }
}
