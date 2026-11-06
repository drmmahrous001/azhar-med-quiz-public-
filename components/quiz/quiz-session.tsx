'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { QuizRunner } from '@/components/quiz/quiz-runner'
import { readProgress } from '@/lib/progress-store'
import type { QuizConfig } from '@/lib/quiz-config'
import type { Question } from '@/lib/types'

function buildSelection(pool: Question[], config: QuizConfig) {
  const progress = readProgress()
  const bookmarks = new Set(progress.bookmarks)
  const requestedIds = config.questionIds?.length ? new Set(config.questionIds) : null
  const filtered = pool.filter((q) => {
    if (requestedIds && !requestedIds.has(q.id)) return false
    const attempt = progress.attempts[q.id]
    if (config.filter === 'unseen') return !attempt
    if (config.filter === 'incorrect') return attempt ? !attempt.lastCorrect : false
    if (config.filter === 'bookmarked') return bookmarks.has(q.id)
    return true
  })
  const ordered = [...filtered]
  if (config.order === 'shuffle') {
    for (let i = ordered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[ordered[i], ordered[j]] = [ordered[j], ordered[i]]
    }
  }
  return config.count === 'all' ? ordered : ordered.slice(0, config.count)
}


function selectionStorageKey(pool: Question[], config: QuizConfig) {
  const chapters = config.chapters === 'all' ? 'all' : config.chapters.join(',')
  const ids = pool.map((question) => question.id).join(',')
  const requested = config.questionIds?.join(',') ?? 'pool'
  // Keep independently configured sessions from reusing a stale question selection.
  return `azhar-quiz-selection-v1:${config.mode}:${chapters}:${requested}:${config.filter}:${config.count}:${config.order}:${ids}`
}

export function QuizSession({ pool, config }: { pool: Question[]; config: QuizConfig }) {
  const [round, setRound] = useState(0)
  const [availablePool, setAvailablePool] = useState(pool)
  const [offlineChecked, setOfflineChecked] = useState(false)
  const [questions, setQuestions] = useState(() => buildSelection(pool, config))
  const [selectionReady, setSelectionReady] = useState(false)
  const selectionKey = selectionStorageKey(pool, config)

  useEffect(() => {
    if (!offlineChecked) return
    try {
      const raw = localStorage.getItem(selectionKey)
      const savedIds = raw ? JSON.parse(raw) as string[] : null
      if (Array.isArray(savedIds) && savedIds.length) {
        const byId = new Map(availablePool.map((question) => [question.id, question]))
        const restoredQuestions = savedIds.map((id) => byId.get(id)).filter((question): question is Question => Boolean(question))
        if (restoredQuestions.length === savedIds.length) setQuestions(restoredQuestions)
        else localStorage.removeItem(selectionKey)
      }
      const current = localStorage.getItem(selectionKey)
      if (!current) localStorage.setItem(selectionKey, JSON.stringify(questions.map((question) => question.id)))
    } catch {
      // Continue with a fresh selection if browser storage is unavailable.
    }
    setSelectionReady(true)
  }, [offlineChecked, availablePool, selectionKey])

  useEffect(() => {
    if (pool.length) { setOfflineChecked(true); return }
    if (!('indexedDB' in window)) { setOfflineChecked(true); return }
    const request = indexedDB.open('azhar-med-offline', 1)
    request.onsuccess = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('bank')) { db.close(); setOfflineChecked(true); return }
      const read = db.transaction('bank', 'readonly').objectStore('bank').get('study-bank')
      read.onsuccess = () => {
        const cached = read.result?.questions
        if (Array.isArray(cached) && cached.length) {
          setAvailablePool(cached)
          setQuestions(buildSelection(cached, config))
        }
        db.close()
        setOfflineChecked(true)
      }
      read.onerror = () => { db.close(); setOfflineChecked(true) }
    }
    request.onerror = () => setOfflineChecked(true)
  }, [pool, config])

  if (!offlineChecked) return <div className="rounded-xl border p-6 text-center text-sm text-muted-foreground">جاري تحميل بنك الأسئلة المحفوظ…</div>

  if (questions.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-dashed p-10 text-center">
        <h1 className="text-lg font-semibold">No questions match this session</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {config.filter === 'incorrect'
            ? 'You have no outstanding mistakes in these chapters.'
            : config.filter === 'bookmarked'
              ? 'You have not bookmarked any questions in these chapters yet.'
              : config.filter === 'unseen'
                ? 'You have already seen every question in these chapters.'
                : 'There are no published questions for the selected chapters.'}
        </p>
        <Link href="/practice-surgery-1" className={buttonVariants()}>
          Choose another session
        </Link>
      </div>
    )
  }

  return (
    <QuizRunner
      key={round}
      questions={questions}
      config={config}
      onRestart={() => {
        const nextConfig = { ...config, questionIds: undefined, filter: 'all' as const, count: questions.length === availablePool.length ? 'all' as const : questions.length }
        const nextQuestions = buildSelection(availablePool, nextConfig)
        localStorage.setItem(selectionStorageKey(availablePool, nextConfig), JSON.stringify(nextQuestions.map((question) => question.id)))
        setQuestions(nextQuestions)
        setRound((r) => r + 1)
      }}
    />
  )
}
