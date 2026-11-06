'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { QuizSession } from '@/components/quiz/quiz-session'
import type { Question } from '@/lib/types'
import { parseQuizConfig, type QuizConfig } from '@/lib/quiz-config'

type SavedBank = { questions?: Question[] }

export default function OfflineStudyClient() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [chapter, setChapter] = useState<number | 'all'>('all')
  const [config, setConfig] = useState<QuizConfig>({ chapters: 'all', count: 'all', mode: 'study', filter: 'all', order: 'source' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const parsed = parseQuizConfig(Object.fromEntries(new URLSearchParams(window.location.search)))
    setConfig(parsed)
    if (Array.isArray(parsed.chapters) && parsed.chapters.length === 1) setChapter(parsed.chapters[0])
    if (!('indexedDB' in window)) { setError(true); setLoading(false); return }
    const request = indexedDB.open('azhar-med-offline', 1)
    request.onsuccess = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('bank')) {
        db.close(); setError(true); setLoading(false); return
      }
      const read = db.transaction('bank', 'readonly').objectStore('bank').get('study-bank')
      read.onsuccess = () => {
        const saved = read.result as SavedBank | undefined
        if (Array.isArray(saved?.questions) && saved.questions.length) setQuestions(saved.questions)
        else setError(true)
        db.close()
        setLoading(false)
      }
      read.onerror = () => { db.close(); setError(true); setLoading(false) }
    }
    request.onerror = () => { setError(true); setLoading(false) }
  }, [])

  const chapters = useMemo(() => {
    const map = new Map<number, string>()
    questions.forEach((q) => map.set(q.chapterNumber, q.chapter))
    return [...map.entries()].sort((a, b) => a[0] - b[0])
  }, [questions])

  const pool = useMemo(() => {
    const chapterFiltered = chapter === 'all' ? questions : questions.filter((q) => q.chapterNumber === chapter)
    return Array.isArray(config.chapters) ? chapterFiltered.filter((q) => config.chapters.includes(q.chapterNumber)) : chapterFiltered
  }, [questions, chapter, config.chapters])

  if (loading) return <main dir="rtl" className="mx-auto max-w-3xl p-6 text-center">جاري فتح بنك الأسئلة المحفوظ…</main>

  if (error) return (
    <main dir="rtl" className="mx-auto max-w-xl space-y-4 p-6 text-center">
      <h1 className="text-2xl font-bold">بنك الأسئلة مش محفوظ على الجهاز</h1>
      <p>اتصل بالإنترنت، افتح مكتبة المذاكرة، واضغط «تحميل بنك المذاكرة للأوفلاين» أولًا.</p>
      <Link className="inline-block rounded-lg bg-primary px-4 py-2 text-primary-foreground" href="/study">الرجوع لمكتبة المذاكرة</Link>
    </main>
  )

  return (
    <main dir="rtl" className="mx-auto max-w-6xl space-y-5 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm text-primary">يعمل بدون إنترنت</p><h1 className="text-2xl font-bold">المذاكرة أوفلاين</h1><p className="text-sm text-muted-foreground">{questions.length} سؤال محفوظ على الجهاز</p></div>
        <Link className="rounded-lg border px-3 py-2 text-sm" href="/study">مكتبة المذاكرة</Link>
      </div>
      <label className="flex flex-wrap items-center gap-3 text-sm font-medium">
        اختار الفصل
        <select value={chapter} onChange={(e) => setChapter(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="rounded-lg border bg-background px-3 py-2">
          <option value="all">كل الفصول</option>
          {chapters.map(([number, name]) => <option key={number} value={number}>{name}</option>)}
        </select>
      </label>
      {pool.length ? <QuizSession key={String(chapter)} pool={pool} config={config} /> : <p>مفيش أسئلة في الفصل ده.</p>}
    </main>
  )
}
