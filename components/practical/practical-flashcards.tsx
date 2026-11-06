'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, BookOpen, RotateCcw, Sparkles } from 'lucide-react'

type Card = { id: string; category: string; title: string; prompt: string; answer: string; image?: string; imageAlt?: string }
type Rating = 'again' | 'good' | 'easy'
type ReviewState = Record<string, Rating>

const cards: Card[] = [
  { id: 'instrument-tissue-forceps', category: 'Surgical instruments', title: "Tissue forceps", prompt: 'Identify the instrument.', answer: "Identify: Tissue forceps\nUses:\n1. To hold gauze for cleaning the skin.\n2. To clean the operative field from blood.\n3. For dressing of wounds.\n4. As a retractor.", image: '/practical/instruments-01.jpg', imageAlt: 'Tissue forceps' },
  { id: 'instrument-artery-forceps-straight', category: 'Surgical instruments', title: "Artery forceps (straight)", prompt: 'Identify the instrument.', answer: "Identify: Artery forceps (straight)\nUses:\n1. To catch the bleeding point.\n2. To clamp a vessel before dividing it between two forceps.\n3. To catch peritoneum or aponeurosis.\n4. For dressing.", image: '/practical/instruments-02.jpg', imageAlt: 'Straight artery forceps' },
  { id: 'instrument-artery-forceps-curved', category: 'Surgical instruments', title: "Artery forceps (curved)", prompt: 'Identify the instrument.', answer: "Identify: Artery forceps (curved)\nUses:\n1. To catch the bleeding point.\n2. To clamp a vessel before dividing it between two forceps.\n3. To catch peritoneum or aponeurosis.\n4. For dressing.", image: '/practical/instruments-03.jpg', imageAlt: 'Curved artery forceps' },
  { id: 'instrument-needle-holder-straight', category: 'Surgical instruments', title: "Needle holder (straight)", prompt: 'Identify the instrument.', answer: "Identify: Needle holder (straight)\nUses:\n1. To hold curved needles.\n2. Used in superficial sutures.", image: '/practical/instruments-04.jpg', imageAlt: 'Straight needle holder' },
  { id: 'instrument-needle-holder-curved', category: 'Surgical instruments', title: "Needle holder (curved)", prompt: 'Identify the instrument.', answer: "Identify: Needle holder (curved)\nUses:\n1. To hold curved needles.\n2. Used in deep sutures.", image: '/practical/instruments-05.jpg', imageAlt: 'Curved needle holder' },
  { id: 'instrument-bladder-forceps', category: 'Surgical instruments', title: "Bladder forceps", prompt: 'Identify the instrument.', answer: "Identify: Bladder forceps\nUses: To grasp and hold the urinary bladder during surgical procedures.", image: '/practical/instruments-06.jpg', imageAlt: 'Bladder forceps' },
  { id: 'instrument-babcock-forceps', category: 'Surgical instruments', title: "Babcock’s tissue forceps", prompt: 'Identify the instrument.', answer: "Identify: Babcock’s tissue forceps\nUses:\n1. Holding intestine, appendix, and other delicate structures.\n2. Can be used in appendectomy, gastrectomy, and intestinal resection.", image: '/practical/instruments-07.jpg', imageAlt: 'Babcock’s tissue forceps' },
  { id: 'instrument-allis-forceps', category: 'Surgical instruments', title: "Allis forceps", prompt: 'Identify the instrument.', answer: "Identify: Allis forceps\nUses:\n1. Holding delicate structures like intestine and tendon.\n2. Holding the duodenum for duodenal closure during gastrectomy.", image: '/practical/instruments-08.jpg', imageAlt: 'Allis forceps' },
  { id: 'instrument-uretero-lithotomy-forceps-1', category: 'Surgical instruments', title: "Uretero-lithotomy forceps", prompt: 'Identify the instrument.', answer: "Identify: Uretero-lithotomy forceps\nUses:\n1. To remove stones from the ureter.\n2. To remove renal stones.\n3. To remove stones from the urinary bladder.", image: '/practical/instruments-09.jpg', imageAlt: 'Uretero-lithotomy forceps' },
  { id: 'instrument-uretero-lithotomy-forceps-2', category: 'Surgical instruments', title: "Uretero-lithotomy forceps", prompt: 'Identify the instrument.', answer: "Identify: Uretero-lithotomy forceps\nUses: To remove stones from the renal pelvis, calyces, and upper ureter.", image: '/practical/instruments-10.jpg', imageAlt: 'Uretero-lithotomy forceps (variant)' },
  { id: 'instrument-towel-clips', category: 'Surgical instruments', title: "Towel clips", prompt: 'Identify the instrument.', answer: "Identify: Towel clips\nUses:\n1. To hold and fix towels to the skin.\n2. Can be used to hold the tip of the tongue.", image: '/practical/instruments-11.jpg', imageAlt: 'Towel clips' },
  { id: 'instrument-intestinal-holding-forceps', category: 'Surgical instruments', title: "Appendicular or intestinal holding forceps", prompt: 'Identify the instrument.', answer: "Identify: Appendicular or intestinal holding forceps\nUses: Holding the appendix or intestine.", image: '/practical/instruments-12.jpg', imageAlt: 'Appendicular / intestinal holding forceps' },
  { id: 'instrument-toothed-forceps', category: 'Surgical instruments', title: "Toothed forceps", prompt: 'Identify the instrument.', answer: "Identify: Toothed forceps\nUses: Holding tough structures such as skin, subcutaneous tissue, fascia, and muscles.", image: '/practical/instruments-13.jpg', imageAlt: 'Toothed forceps' },
  { id: 'instrument-non-toothed-forceps', category: 'Surgical instruments', title: "Non-toothed forceps", prompt: 'Identify the instrument.', answer: "Identify: Non-toothed forceps\nUses:\n1. Dissection of delicate structures such as blood vessels and intestine.\n2. Dissection of the hernial sac from vessels of the spermatic cord.", image: '/practical/instruments-14.jpg', imageAlt: 'Non-toothed forceps' },
  { id: 'instrument-renal-pedicle-clamp', category: 'Surgical instruments', title: "Nephrectomy (renal pedicle) clamp", prompt: 'Identify the instrument.', answer: "Identify: Nephrectomy (renal pedicle) clamp\nUses: Two or three clamps are applied on the renal pedicle during nephrectomy.", image: '/practical/instruments-15.jpg', imageAlt: 'Nephrectomy (renal pedicle) clamp' },
  { id: 'instrument-non-crushing-intestinal-clamp-1', category: 'Surgical instruments', title: "Non-crushing intestinal clamp", prompt: 'Identify the instrument.', answer: "Identify: Non-crushing intestinal clamp\nUses: Occlusion of viable loops of intestine or colon during resection and anastomosis.", image: '/practical/instruments-16.jpg', imageAlt: 'Non-crushing intestinal clamp' },
  { id: 'instrument-lung-retractor', category: 'Surgical instruments', title: "Stitch scissor", prompt: 'Identify the instrument.', answer: "Identify: Stitch scissor\\nUses: To remove stitches.", image: '/practical/instruments-17.jpg', imageAlt: 'Stitch scissor' },
  { id: 'instrument-morris-retractor', category: 'Surgical instruments', title: "Dissecting scissor", prompt: 'Identify the instrument.', answer: "Identify: Dissecting scissor\\nUses: Dissection of delicate structures such as blood vessels and intestine.", image: '/practical/instruments-18.jpg', imageAlt: 'Dissecting scissor' },
  { id: 'instrument-dissecting-scissors', category: 'Surgical instruments', title: "Self-retaining retractor", prompt: 'Identify the instrument.', answer: "Identify: Self-retaining retractor\\nUses: Retraction of walls during operations, including retraction from within the urinary bladder.", image: '/practical/instruments-19.jpg', imageAlt: 'Self-retaining retractor' },
  { id: 'instrument-self-retaining-retractor', category: 'Surgical instruments', title: "Self-retaining retractor (Finochetto rib spreader)", prompt: 'Identify the instrument.', answer: "Identify: Self-retaining retractor (Finochetto rib spreader)\\nUses: Retraction of the ribs to provide access to the thoracic cavity.", image: '/practical/instruments-20.jpg', imageAlt: 'Self-retaining retractor (Finochetto rib spreader)' },
  { id: 'instrument-finochetto-rib-spreader', category: 'Surgical instruments', title: "Lung retractor", prompt: 'Identify the instrument.', answer: "Identify: Lung retractor\\nUses: Retraction of the lung during thoracic surgery.", image: '/practical/instruments-21.jpg', imageAlt: 'Lung retractor' },
  { id: 'instrument-lung-retractor', category: 'Surgical instruments', title: "Morris retractor", prompt: 'Identify the instrument.', answer: "Identify: Morris retractor\\nUses: Retraction of deep abdominal wound edges.", image: '/practical/instruments-22.jpg', imageAlt: 'Morris retractor' },
  { id: 'instrument-morris-retractor', category: 'Surgical instruments', title: "Deaver’s retractor", prompt: 'Identify the instrument.', answer: "Identify: Deaver’s retractor\\nUses: Retraction of deep tissues and wound edges.", image: '/practical/instruments-23.jpg', imageAlt: 'Deaver’s retractor' },
  { id: 'instrument-deaver-retractor', category: 'Surgical instruments', title: "Langenbeck’s retractor", prompt: 'Identify the instrument.', answer: "Identify: Langenbeck’s retractor\\nUses: Retraction of wound edges during surgery.", image: '/practical/instruments-24.jpg', imageAlt: 'Langenbeck’s retractor' },
  { id: 'instrument-langenbeck-retractor', category: 'Surgical instruments', title: "Fenestrated retractor", prompt: 'Identify the instrument.', answer: "Identify: Fenestrated retractor\nUses: Retraction of wound edges during surgery.", image: '/practical/instruments-25.jpg', imageAlt: 'Fenestrated retractor' },
  { id: 'instrument-bone-chisel', category: 'Surgical instruments', title: "Bone chisel", prompt: 'Identify the instrument.', answer: "Identify: Bone chisel\nUses: Cutting bone; beveled on one side.", image: '/practical/instruments-26.jpg', imageAlt: 'Bone chisel' },
  { id: 'instrument-osteotome', category: 'Surgical instruments', title: "Osteotome", prompt: 'Identify the instrument.', answer: "Identify: Osteotome\nUses: Cutting or shaping bone; beveled on two sides.", image: '/practical/instruments-27.jpg', imageAlt: 'Osteotome' },
  { id: 'instrument-bone-elevator', category: 'Surgical instruments', title: "Bone elevator", prompt: 'Identify the instrument.', answer: "Identify: Bone elevator\nUses: Elevating or separating periosteum from bone; beveled on two sides.", image: '/practical/instruments-28.jpg', imageAlt: 'Bone elevator' }
]

const STORAGE_KEY = 'azhar-practical-progress-v1'

function readProgress(): ReviewState {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as ReviewState }
  catch { return {} }
}

export function PracticalFlashcards() {
  const [category, setCategory] = useState('All')
  const [index, setIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [ratings, setRatings] = useState<ReviewState>({})
  const [ready, setReady] = useState(false)

  useEffect(() => { setRatings(readProgress()); setReady(true) }, [])

  const categories = ['All', ...Array.from(new Set(cards.map((card) => card.category)))]
  const filtered = useMemo(() => category === 'All' ? cards : cards.filter((card) => card.category === category), [category])
  const current = filtered[index]
  const reviewed = Object.keys(ratings).filter((id) => cards.some((card) => card.id === id)).length

  function move(delta: number) {
    setIndex((value) => (value + delta + filtered.length) % filtered.length)
    setShowAnswer(false)
  }

  function chooseCategory(next: string) {
    setCategory(next); setIndex(0); setShowAnswer(false)
  }

  function rate(rating: Rating) {
    if (!current) return
    const next = { ...ratings, [current.id]: rating }
    setRatings(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
    if (rating !== 'again') move(1)
    else setShowAnswer(false)
  }

  function resetProgress() {
    setRatings({})
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    setIndex(0); setShowAnswer(false)
  }

  if (!ready) return <section dir="rtl" className="mx-auto max-w-3xl rounded-xl border p-8 text-center text-sm text-muted-foreground">جاري تحميل تقدم العملي…</section>

  return (
    <section dir="rtl" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm font-semibold text-primary">Azhar Med Quiz · Practical</p><h1 className="mt-1 text-3xl font-bold tracking-tight">العملي والجراحة الإكلينيكية</h1><p className="mt-2 text-sm text-muted-foreground">كروت مراجعة بنظام Anki — حاول تجاوب قبل ما تظهر الإجابة.</p></div>
        <Link href="/" className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-muted"><ArrowRight className="size-4" /> الرئيسية</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">إجمالي الكروت</p><p className="mt-1 text-2xl font-bold tabular-nums">{cards.length}</p></div>
        <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">تمت مراجعتها</p><p className="mt-1 text-2xl font-bold tabular-nums">{reviewed}</p></div>
        <div className="col-span-2 rounded-xl border bg-card p-4 sm:col-span-1"><p className="text-xs text-muted-foreground">المتبقي</p><p className="mt-1 text-2xl font-bold tabular-nums">{Math.max(0, cards.length - reviewed)}</p></div>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="تصنيف الكروت">
        {categories.map((item) => <button key={item} onClick={() => chooseCategory(item)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${category === item ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted'}`}>{item === 'All' ? 'الكل' : item}</button>)}
      </div>

      {current ? <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3 text-sm"><span className="font-semibold text-primary">{current.category}</span><span className="text-muted-foreground tabular-nums">{index + 1} / {filtered.length}</span></div>
        <div className="space-y-5 p-4 sm:p-7">
          {current.image ? <img src={current.image} alt={current.imageAlt || current.title} className="mx-auto max-h-[420px] w-full rounded-xl bg-muted object-contain" /> : <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 p-6 text-center"><BookOpen className="size-10 text-muted-foreground" /><p className="text-sm text-muted-foreground">مكان صورة الحالة أو الأداة</p><p className="text-xs text-muted-foreground">أضف الصورة داخل public/practical واربطها بالكارت.</p></div>}
          <div className="space-y-2 text-center"><p className="text-base leading-8">{current.prompt}</p></div>
          {showAnswer ? <div className="rounded-xl border border-primary/30 bg-primary/5 p-4"><p className="mb-2 text-sm font-bold text-primary">الإجابة النموذجية</p><div className="space-y-2 text-sm leading-7"><p className="font-bold">Identify: {current.title}</p><p>{current.answer.replace(/^Identify:.*\n?/, '')}</p></div></div> : <button onClick={() => setShowAnswer(true)} className="w-full rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground hover:opacity-90">إظهار الإجابة</button>}
          {showAnswer && <div className="space-y-3"><p className="text-center text-sm font-semibold">قيّم إجابتك</p><div className="grid grid-cols-3 gap-2">
            <button onClick={() => rate('again')} className="rounded-xl border border-rose-300 bg-rose-50 px-2 py-3 text-sm font-bold text-rose-800 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">Again<br/><span className="text-xs font-normal">راجع تاني</span></button>
            <button onClick={() => rate('good')} className="rounded-xl border border-amber-300 bg-amber-50 px-2 py-3 text-sm font-bold text-amber-800 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">Good<br/><span className="text-xs font-normal">كويس</span></button>
            <button onClick={() => rate('easy')} className="rounded-xl border border-emerald-300 bg-emerald-50 px-2 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">Easy<br/><span className="text-xs font-normal">سهل</span></button>
          </div></div>}
        </div>
        <div className="flex items-center justify-between border-t p-3"><button onClick={() => move(-1)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-muted"><ArrowRight className="size-4" /> السابق</button><button onClick={() => move(1)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-muted">التالي <ArrowLeft className="size-4" /></button></div>
      </div> : <p className="rounded-xl border p-8 text-center text-muted-foreground">لا توجد كروت في هذا التصنيف.</p>}

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Sparkles className="size-3" /> يتم حفظ تقييمات العملي على هذا الجهاز بشكل مستقل عن الـMCQ.</span><button onClick={resetProgress} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-muted"><RotateCcw className="size-3" /> إعادة ضبط تقدم العملي</button></div>
    </section>
  )
}
