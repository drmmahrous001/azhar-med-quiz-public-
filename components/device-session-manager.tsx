'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Copy, RefreshCw, ShieldCheck, Smartphone, X } from 'lucide-react'
import {
  createRemoteSession,
  generateRecoveryCode,
  saveRemoteSession,
  transferRemoteSession,
  type DeviceSessionPayload,
} from '@/lib/device-session'

const CODE_KEY = 'azhar-device-recovery-code-v1'
const VERSION_KEY = 'azhar-device-session-version-v1'
const ACTIVE_KEY = 'azhar-device-session-active-v1'
const SNAPSHOT_PREFIX = 'azhar-'

function readSnapshot(): DeviceSessionPayload {
  const localStorageData: Record<string, string> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith(SNAPSHOT_PREFIX)) continue
    if ([CODE_KEY, VERSION_KEY, ACTIVE_KEY, 'azhar-theme'].includes(key)) continue
    const value = localStorage.getItem(key)
    if (value !== null) localStorageData[key] = value
  }
  return { localStorage: localStorageData, route: window.location.pathname + window.location.search, savedAt: Date.now() }
}

function applySnapshot(payload: DeviceSessionPayload) {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i)
    if (key?.startsWith(SNAPSHOT_PREFIX) && ![CODE_KEY, VERSION_KEY, ACTIVE_KEY, 'azhar-theme'].includes(key)) localStorage.removeItem(key)
  }
  for (const [key, value] of Object.entries(payload.localStorage || {})) {
    if (key.startsWith(SNAPSHOT_PREFIX) && ![CODE_KEY, VERSION_KEY, ACTIVE_KEY].includes(key)) {
      localStorage.setItem(key, value)
    }
  }
}

export function DeviceSessionManager() {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [recoveryInput, setRecoveryInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [active, setActive] = useState(false)
  const savingRef = useRef(false)

  const initialize = useCallback(async () => {
    const existing = localStorage.getItem(CODE_KEY)
    if (existing) {
      setCode(existing)
      setActive(localStorage.getItem(ACTIVE_KEY) !== 'false')
      return
    }
    const fresh = generateRecoveryCode()
    const result = await createRemoteSession(fresh, readSnapshot())
    if (!result.ok) throw new Error('تعذر إنشاء جلسة الجهاز.')
    localStorage.setItem(CODE_KEY, fresh)
    localStorage.setItem(VERSION_KEY, String(result.version))
    localStorage.setItem(ACTIVE_KEY, 'true')
    setCode(fresh)
    setActive(true)
  }, [])

  const save = useCallback(async () => {
    if (savingRef.current) return
    savingRef.current = true
    try {
    const currentCode = localStorage.getItem(CODE_KEY)
    if (!currentCode || localStorage.getItem(ACTIVE_KEY) === 'false') return
    const version = Number(localStorage.getItem(VERSION_KEY) || '1')
    const result = await saveRemoteSession(currentCode, readSnapshot(), version)
    if (!result.ok) {
      localStorage.setItem(ACTIVE_KEY, 'false')
      setActive(false)
      setMessage('الجلسة انتقلت لجهاز آخر. هذا الجهاز لم يعد المالك النشط.')
      return
    }
    localStorage.setItem(VERSION_KEY, String(result.version))
    } finally {
      savingRef.current = false
    }
  }, [])

  useEffect(() => {
    let mounted = true
    void initialize().catch((error) => {
      if (mounted) setMessage(error instanceof Error ? error.message : 'حدث خطأ في تهيئة الجلسة.')
    })
    const interval = window.setInterval(() => { void save().catch(() => {}) }, 5000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void save().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      mounted = false
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [initialize, save])

  async function transfer() {
    const oldCode = recoveryInput.trim()
    if (oldCode.length < 40) {
      setMessage('راجع الكود؛ شكله غير مكتمل.')
      return
    }
    setBusy(true)
    setMessage('')
    try {
      const newCode = generateRecoveryCode()
      const result = await transferRemoteSession(oldCode, newCode)
      if (!result.ok || !result.payload) {
        setMessage('الكود غير صحيح أو تم نقل الجلسة بالفعل.')
        return
      }
      applySnapshot(result.payload)
      localStorage.setItem(CODE_KEY, newCode)
      localStorage.setItem(VERSION_KEY, String(result.version))
      localStorage.setItem(ACTIVE_KEY, 'true')
      setCode(newCode)
      setActive(true)
      setRecoveryInput('')
      setMessage('تم نقل الجلسة لهذا الجهاز. سيتم فتح آخر صفحة كنت تستخدمها.')
      const targetRoute = result.payload.route || (window.location.pathname + window.location.search)
      window.setTimeout(() => { window.location.href = targetRoute }, 900)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر نقل الجلسة.')
    } finally {
      setBusy(false)
    }
  }

  async function copyCode() {
    if (!code) return
    await navigator.clipboard.writeText(code)
    setMessage('تم نسخ كود الجلسة.')
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-semibold hover:bg-muted sm:text-sm">
        <Smartphone className="size-4" /> استرجاع جلسة
      </button>
      {open && createPortal(<div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/65 px-3 py-4 sm:items-center sm:px-6 sm:py-8" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
        <section dir="rtl" role="dialog" aria-modal="true" aria-labelledby="device-session-title" className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-xl space-y-4 overflow-y-auto overscroll-contain rounded-2xl border border-border bg-background p-4 shadow-2xl sm:max-h-[min(90dvh,48rem)] sm:space-y-5 sm:p-6 md:max-w-2xl">
          <div className="flex items-center justify-between gap-3">
            <div><h2 id="device-session-title" className="text-lg font-bold">نقل واسترجاع الجلسة</h2><p className="mt-1 text-sm text-muted-foreground">انقل تقدمك بين أجهزتك باستخدام كود الاسترجاع.</p></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="إغلاق" className="rounded-lg p-2 hover:bg-muted"><X className="size-5" /></button>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4 text-primary" /> كود هذا الجهاز</div>
            {code ? <><code dir="ltr" className="block break-all rounded-lg bg-muted p-3 text-center text-sm">{code}</code><button type="button" onClick={() => void copyCode()} className="mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-muted"><Copy className="size-4" /> نسخ الكود</button></> : <p className="text-sm text-muted-foreground">جاري إنشاء كود الجهاز…</p>}
            <p className="mt-3 text-xs text-muted-foreground">{active ? 'الجهاز الحالي هو المالك النشط، ويتم حفظ التقدم تلقائيًا.' : 'هذه الجلسة انتقلت إلى جهاز آخر؛ استخدم كود الجهاز النشط للعودة.'}</p>
          </div>
          <div className="space-y-3">
            <label htmlFor="recovery-code" className="block text-sm font-semibold">استرجاع جلسة من جهاز آخر</label>
            <textarea id="recovery-code" dir="ltr" value={recoveryInput} onChange={(event) => setRecoveryInput(event.target.value)} rows={3} placeholder="الصق كود الجهاز الآخر هنا" className="w-full resize-y rounded-xl border bg-background p-3 text-sm outline-none focus:border-primary" />
            <button type="button" disabled={busy || recoveryInput.trim().length < 40} onClick={() => void transfer()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">
              {busy ? <RefreshCw className="size-4 animate-spin" /> : <Smartphone className="size-4" />} نقل الجلسة إلى هذا الجهاز
            </button>
          </div>
          {message && <p role="status" className="rounded-lg bg-muted p-3 text-sm leading-6">{message}</p>}
          <p className="text-xs leading-5 text-muted-foreground">النقل يوقف ملكية الجهاز السابق. احتفظ بالكود الجديد؛ ويمكنك استخدامه للعودة من الجهاز القديم.</p>
        </section>
      </div>, document.body)}
    </>
  )
}
