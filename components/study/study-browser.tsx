"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import type { Question } from "@/lib/types"

type EssayGroup = {
  chapter: string
  sourcePage?: number
  items: string[]
}

type Checklist = {
  title: string
  sourcePage?: number
  lines: string[]
}

type StudyBrowserProps = {
  essays: EssayGroup[]
  checklists: Checklist[]
  questions?: Question[]
}

export function StudyBrowser({ essays = [], checklists = [], questions = [] }: StudyBrowserProps) {
  const [tab, setTab] = useState<"mcqs" | "essays" | "checklists">("mcqs")
  const [query, setQuery] = useState("")
  const [chapter, setChapter] = useState("all")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [offlineStatus, setOfflineStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  async function saveOfflineBank() {
    setOfflineStatus("saving")
    try {
      const payload = { version: 1, savedAt: new Date().toISOString(), questions, essays, checklists }
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("azhar-med-offline", 1)
        request.onupgradeneeded = () => request.result.createObjectStore("bank")
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction("bank", "readwrite")
        transaction.objectStore("bank").put(payload, "study-bank")
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
      })
      db.close()
      setOfflineStatus("saved")
    } catch {
      setOfflineStatus("error")
    }
  }

  const chapters = useMemo(() => essays.map((item) => item.chapter), [essays])
  const mcqChapters = useMemo(() => {
    const map = new Map<number, { chapterNumber: number; chapter: string; count: number }>()
    questions.forEach((q) => {
      const item = map.get(q.chapterNumber) ?? { chapterNumber: q.chapterNumber, chapter: q.chapter, count: 0 }
      item.count += 1
      map.set(q.chapterNumber, item)
    })
    return [...map.values()].sort((a, b) => a.chapterNumber - b.chapterNumber)
  }, [questions])

  const filteredEssays = useMemo(() => essays.filter((group) => {
    const matchesChapter = chapter === "all" || group.chapter === chapter
    const term = query.trim().toLowerCase()
    const matchesQuery = !term || group.chapter.toLowerCase().includes(term) ||
      group.items.some((item) => item.toLowerCase().includes(term))
    return matchesChapter && matchesQuery
  }), [essays, chapter, query])

  const filteredChecklists = useMemo(() => {
    const term = query.trim().toLowerCase()
    return checklists.filter((item) =>
      !term || item.title.toLowerCase().includes(term) ||
      item.lines.some((line) => line.toLowerCase().includes(term))
    )
  }, [checklists, query])

  return (
    <section dir="rtl" className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">مكتبة المذاكرة</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">مواد المذاكرة</h1>
        <p className="mt-2 text-muted-foreground">ابدأ بأسئلة الاختيار من متعدد المعتمدة، ثم راجع الأسئلة المقالية وقوائم المراجعة.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
        <button onClick={saveOfflineBank} disabled={offlineStatus === "saving"} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">{offlineStatus === "saving" ? "جاري الحفظ…" : offlineStatus === "saved" ? "تم حفظ بنك المذاكرة على الجهاز ✓" : "تحميل بنك المذاكرة للأوفلاين"}</button>
        <span className="text-xs text-muted-foreground">{offlineStatus === "error" ? "تعذر الحفظ. جرّب متصفحًا يدعم التخزين المحلي." : "يحفظ الأسئلة والمقالات وقوائم المراجعة على هذا الجهاز."}</span>{offlineStatus === "saved" && <Link href="/offline-study" className="rounded-lg border px-3 py-2 text-sm font-semibold">افتح المذاكرة أوفلاين ←</Link>}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ابحث عن موضوع أو سؤال…"
          aria-label="البحث في مواد المذاكرة"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {tab === "essays" && (
          <select
            value={chapter}
            onChange={(event) => setChapter(event.target.value)}
            aria-label="تصفية حسب الفصل"
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="all">كل الفصول</option>
            {chapters.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        )}
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1">
        <button onClick={() => setTab("mcqs")} className={`rounded-md px-4 py-2 text-sm font-medium ${tab === "mcqs" ? "bg-background shadow" : "text-muted-foreground"}`}>اختيار من متعدد <span className="mr-1 opacity-70">({questions.length})</span></button>
        <button onClick={() => setTab("essays")} className={`rounded-md px-4 py-2 text-sm font-medium ${tab === "essays" ? "bg-background shadow" : "text-muted-foreground"}`}>
          أسئلة مقالية <span className="mr-1 opacity-70">({essays.reduce((sum, group) => sum + group.items.length, 0)})</span>
        </button>
        <button onClick={() => setTab("checklists")} className={`rounded-md px-4 py-2 text-sm font-medium ${tab === "checklists" ? "bg-background shadow" : "text-muted-foreground"}`}>
          قوائم مراجعة <span className="mr-1 opacity-70">({checklists.length})</span>
        </button>
      </div>

      {tab === "mcqs" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {mcqChapters.map((item) => (
            <article key={item.chapterNumber} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
              <div><p className="font-semibold">{item.chapter}</p><p className="mt-1 text-sm text-muted-foreground">{item.count} سؤال معتمد</p></div>
              <Link href={`/quiz?chapters=${item.chapterNumber}&count=all&mode=study&filter=all&order=source`} className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">ابدأ المذاكرة</Link>
            </article>
          ))}
          {mcqChapters.length === 0 && <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">لا توجد أسئلة اختيار من متعدد معتمدة حاليًا.</p>}
        </div>
      ) : tab === "essays" ? (
        <div className="space-y-3">
          {filteredEssays.map((group) => {
            const isOpen = expanded === group.chapter
            return (
              <article key={group.chapter} className="overflow-hidden rounded-xl border bg-card">
                <button onClick={() => setExpanded(isOpen ? null : group.chapter)} className="flex w-full items-center justify-between gap-4 p-4 text-right" aria-expanded={isOpen}>
                  <span>
                    <span className="block font-semibold">{group.chapter}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{group.items.length} سؤال{group.sourcePage ? ` · صفحة PDF ${group.sourcePage}` : ""}</span>
                  </span>
                  <span className="text-xl text-muted-foreground">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && <ol className="space-y-3 border-t px-5 py-4">{group.items.map((item, index) => <li key={index} className="flex gap-3 text-sm leading-6"><span className="shrink-0 text-muted-foreground">{index + 1}.</span><span>{item}</span></li>)}</ol>}
              </article>
            )
          })}
          {filteredEssays.length === 0 && <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">لم يتم العثور على أسئلة مطابقة.</p>}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredChecklists.map((item) => {
            const isOpen = expanded === item.title
            return (
              <article key={item.title} className="rounded-xl border bg-card">
                <button onClick={() => setExpanded(isOpen ? null : item.title)} className="flex w-full items-center justify-between gap-3 p-4 text-right" aria-expanded={isOpen}>
                  <span>
                    <span className="block font-semibold">{item.title}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{item.lines.length} عنصر{item.sourcePage ? ` · صفحة PDF ${item.sourcePage}` : ""}</span>
                  </span>
                  <span className="text-xl text-muted-foreground">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && <ul className="space-y-2 border-t px-4 py-4">{item.lines.map((line, index) => <li key={index} className="flex gap-2 text-sm leading-6"><span className="text-primary">□</span><span>{line.replace(/^[•○]\s*/, "")}</span></li>)}</ul>}
              </article>
            )
          })}
          {filteredChecklists.length === 0 && <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">لم يتم العثور على قوائم مراجعة مطابقة.</p>}
        </div>
      )}
    </section>
  )
}
