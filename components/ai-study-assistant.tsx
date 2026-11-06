'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Bot, MessageCircle, Send, X, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Message = { role: 'user' | 'assistant'; content: string }

const suggestions = ['اشرح لي مفهومًا طبيًا', 'ساعدني في حل MCQ', 'اعمل لي مقارنة بين موضوعين']

export function AiStudyAssistant() {
  const pathname = usePathname()
  // Keep the AI chat unavailable while a student is taking a practice session or exam.
  const isAssessment = pathname === '/quiz' || pathname.startsWith('/quiz/') || pathname.includes('/session') || pathname.includes('/exam')


  const [open, setOpen] = useState(false)
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    const timeout = window.setTimeout(() => setCompact(true), 2000)
    return () => window.clearTimeout(timeout)
  }, [])
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'أهلًا بك! أنا مساعدك الدراسي الذكي في Azhar Med Quiz. اسألني عن أي موضوع طبي أو MCQ أو اطلب مني تبسيط معلومة.' },
  ])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (isAssessment) return null

  async function send(text: string) {
    const message = text.trim()
    if (!message || loading) return
    const next = [...messages, { role: 'user' as const, content: message }]
    setMessages(next)
    setDraft('')
    setError('')
    setLoading(true)
    try {
      const response = await fetch('/api/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: messages.slice(-8) }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'تعذّر الحصول على رد.')
      setMessages((current) => [...current, { role: 'assistant', content: data.answer }])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ غير متوقع.')
    } finally {
      setLoading(false)
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void send(draft)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50" dir="rtl">
      {open ? (
        <section className="mb-3 flex h-[min(70dvh,560px)] w-[min(92vw,390px)] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl" aria-label="مساعد الدراسة الذكي">
          <header className="flex items-center justify-between border-b bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary-foreground/15"><Bot className="size-5" /></span>
              <div><p className="font-bold">مساعد الدراسة الذكي</p><p className="text-xs opacity-80">Azhar Med Quiz · Gemini</p></div>
            </div>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground" onClick={() => setOpen(false)} aria-label="إغلاق المساعد"><X /></Button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto p-3" aria-live="polite">
            {messages.map((item, index) => (
              <div key={index} className={`max-w-[90%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2.5 text-sm leading-7 ${item.role === 'user' ? 'mr-auto bg-primary text-primary-foreground' : 'ml-auto border bg-card'}`}>
                {item.content}
              </div>
            ))}
            {loading ? <div className="ml-auto flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> جاري التفكير...</div> : null}
            {error ? <p role="alert" className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">{error}</p> : null}
            {messages.length === 1 ? <div className="flex flex-wrap gap-2">{suggestions.map((item) => <button key={item} type="button" onClick={() => void send(item)} className="rounded-full border px-3 py-1.5 text-xs hover:bg-muted">{item}</button>)}</div> : null}
          </div>
          <form onSubmit={submit} className="flex items-end gap-2 border-t p-3">
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="اكتب سؤالك هنا..." rows={2} maxLength={5000} className="max-h-28 min-h-11 flex-1 resize-y rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            <Button type="submit" size="icon" disabled={!draft.trim() || loading} aria-label="إرسال السؤال"><Send className="size-4" /></Button>
          </form>
          <p className="px-3 pb-2 text-center text-[10px] text-muted-foreground">مساعد تعليمي بالذكاء الاصطناعي؛ راجع المصادر الدراسية للمعلومات الطبية المهمة.</p>
        </section>
      ) : null}
      <Button onClick={() => setOpen((value) => !value)} className={`h-14 overflow-hidden rounded-full shadow-xl transition-[width,padding,transform,box-shadow] duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.02] hover:shadow-2xl active:scale-[0.985] ${compact && !open ? "w-14 px-0" : "w-[190px] px-4"}`} aria-label={open ? "إغلاق المساعد" : "افتح مساعد الدراسة الذكي"}>
        {open ? <X className="size-5" /> : <Sparkles className={`size-5 ${compact ? "" : "ml-2"}`} />}
        <span className={`mr-2 overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform,margin] duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${compact && !open ? "mr-0 max-w-0 translate-x-2 opacity-0" : "max-w-[150px] translate-x-0 opacity-100"}`}>{open ? "إغلاق المساعد" : "اسأل المساعد الذكي"}</span>
      </Button>
    </div>
  )
}
