'use client'

import { createLocalStore } from '@/lib/local-store'

export type Attempt = { seen: number; correct: number; lastCorrect: boolean; lastAt: number }

export type SessionRecord = {
  id: string
  at: number
  mode: 'practice' | 'exam' | 'study'
  answered: number
  total: number
  correct: number
  durationSec: number
  chapters: number[] | 'all'
}

export type ProgressState = {
  attempts: Record<string, Attempt>
  bookmarks: string[]
  sessions: SessionRecord[]
}

const EMPTY_PROGRESS: ProgressState = { attempts: {}, bookmarks: [], sessions: [] }
const store = createLocalStore<ProgressState>('azhar-surgery-progress-v1', EMPTY_PROGRESS)

function sanitizeProgress(value: unknown): ProgressState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return EMPTY_PROGRESS
  const raw = value as Partial<ProgressState>
  const attempts: Record<string, Attempt> = {}
  if (raw.attempts && typeof raw.attempts === 'object' && !Array.isArray(raw.attempts)) {
    for (const [id, candidate] of Object.entries(raw.attempts)) {
      if (!id || !candidate || typeof candidate !== 'object') continue
      const item = candidate as Attempt
      const seen = Number(item.seen)
      const correct = Number(item.correct)
      const lastAt = Number(item.lastAt)
      if (!Number.isInteger(seen) || seen < 1 || !Number.isInteger(correct) || correct < 0 || correct > seen || typeof item.lastCorrect !== 'boolean' || !Number.isFinite(lastAt)) continue
      attempts[id] = { seen, correct, lastCorrect: item.lastCorrect, lastAt }
    }
  }
  const bookmarks = Array.isArray(raw.bookmarks)
    ? [...new Set(raw.bookmarks.filter((id): id is string => typeof id === 'string' && id.length > 0))]
    : []
  const sessions = Array.isArray(raw.sessions) ? raw.sessions.filter((item): item is SessionRecord => {
    if (!item || typeof item !== 'object') return false
    const s = item as SessionRecord
    return typeof s.id === 'string' && Number.isFinite(s.at) &&
      (s.mode === 'practice' || s.mode === 'exam' || s.mode === 'study') &&
      Number.isInteger(s.answered) && s.answered >= 0 && Number.isInteger(s.total) && s.total >= s.answered &&
      Number.isInteger(s.correct) && s.correct >= 0 && s.correct <= s.answered &&
      Number.isFinite(s.durationSec) && s.durationSec >= 0 &&
      (s.chapters === 'all' || (Array.isArray(s.chapters) && s.chapters.every((n) => Number.isInteger(n) && n > 0)))
  }).slice(0, 50) : []
  return { attempts, bookmarks, sessions }
}

export function useProgress() {
  return sanitizeProgress(store.useStore())
}

export function readProgress() {
  return sanitizeProgress(store.read())
}

export function resetProgress() {
  store.reset()
}

export function recordAttempt(id: string, correct: boolean) {
  if (!id) return
  store.update((raw) => {
    const prev = sanitizeProgress(raw)
    const existing = prev.attempts[id]
    return {
      ...prev,
      attempts: {
        ...prev.attempts,
        [id]: {
          seen: (existing?.seen ?? 0) + 1,
          correct: (existing?.correct ?? 0) + (correct ? 1 : 0),
          lastCorrect: correct,
          lastAt: Date.now(),
        },
      },
    }
  })
}

export function toggleBookmark(id: string) {
  if (!id) return
  store.update((raw) => {
    const prev = sanitizeProgress(raw)
    return {
      ...prev,
      bookmarks: prev.bookmarks.includes(id) ? prev.bookmarks.filter((b) => b !== id) : [...prev.bookmarks, id],
    }
  })
}

export function recordSession(session: Omit<SessionRecord, 'id' | 'at'>) {
  store.update((raw) => {
    const prev = sanitizeProgress(raw)
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
    return { ...prev, sessions: [{ ...session, id, at: Date.now() }, ...prev.sessions].slice(0, 50) }
  })
}
