'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight, RotateCcw, Sparkles, Eye, EyeOff } from 'lucide-react'

type PageItem={page:number;chapter:string;image?:string;images?:string[];text:string;ocrNote?:string}
type Data={totalPages:number;pages:PageItem[]}
type ImageIndexItem={file:string;source_page:number;image_index:number}
type Rating='again'|'good'|'easy'

function cleanText(value:string){
 return value.replace(/\\r/g,'').replace(/[ \\t]+\\n/g,'\\n').replace(/\\n{3,}/g,'\\n\\n').trim()
}
function makePrompt(page:PageItem){
 const text=cleanText(page.text||'')
 const lower=text.toLowerCase()
 const heading=text.split('\n').map(s=>s.trim()).find(s=>s.length>2&&s.length<90&&!/^\d+[.)-]?$/.test(s))
 const topic=heading?(' — '+heading):''
 if(/complications?/i.test(lower)) return 'List the important complications of'+topic+'.'
 if(/management|treatment|operative|operation|approach/i.test(lower)) return 'Describe the management, treatment, or operative approaches for'+topic+'.'
 if(/classification|types? of|varieties/i.test(lower)) return 'Classify'+topic+' and briefly explain each type listed in the source.'
 if(/definition|defined as|means that/i.test(lower)) return 'Define'+topic+' and state its key features.'
 if(/causes?|etiology|risk factors/i.test(lower)) return 'What are the causes or risk factors of'+topic+'?'
 if(/clinical features|presentation|signs|symptoms/i.test(lower)) return 'List the clinical features, signs, and symptoms of'+topic+'.'
 if(/diagnosis|investigation|diagnostic/i.test(lower)) return 'How is'+topic+' diagnosed or investigated? List the relevant methods and key findings.'
 if(/indications?|uses?:/i.test(lower)) return 'What are the indications or uses mentioned for'+topic+'?'
 if(/anatomy|nerve|artery|vein|blood supply/i.test(lower)) return 'Review the image, then describe the key anatomical points related to'+topic+'.'
 if(/identify|name the instrument|name this/i.test(lower)) return 'Identify the structure or instrument shown'+topic+' and state its key uses or features.'
 const bullets=text.split('\n').filter(s=>/^\s*(?:[-•*]|\d+[.)-])\s*/.test(s))
 if(bullets.length>=2) return 'Recall the main points about'+topic+' (at least '+Math.min(bullets.length,4)+' points) without looking at the answer.'
 return 'Explain'+topic+' using the points written on this page, then compare your answer with the source.'
}
export function OsceProMax(){
 const [data,setData]=useState<Data|null>(null)
 const [imageIndex,setImageIndex]=useState<ImageIndexItem[]>([])
 const [failedImages,setFailedImages]=useState<Record<string,boolean>>({})
 const [chapter,setChapter]=useState('الكل')
 const [query,setQuery]=useState('')
 const [index,setIndex]=useState(0)
 const [revealed,setRevealed]=useState(false)
 const [ratings,setRatings]=useState<Record<number,Rating>>({})
 const [session,setSession]=useState<number[]>([])
 useEffect(()=>{fetch('/osce-pro-max/osce-pro-max-page-text.json').then(r=>r.json()).then(setData).catch(()=>setData({totalPages:176,pages:[]}));fetch('/osce-pro-max/image-index.json').then(r=>r.json()).then(setImageIndex).catch(()=>setImageIndex([]))},[])
 const pages=data?.pages||[]
 const chapters=useMemo(()=>['الكل',...Array.from(new Set(pages.map(p=>p.chapter).filter(Boolean)))],[pages])
 const filtered=useMemo(()=>pages.filter(p=>(chapter==='الكل'||p.chapter===chapter)&&(!query||String(p.page).includes(query)||p.chapter.toLowerCase().includes(query.toLowerCase())||p.text.toLowerCase().includes(query.toLowerCase()))),[pages,chapter,query])
 const current=filtered[Math.min(index,Math.max(filtered.length-1,0))]
 const indexedImages=imageIndex.filter(item=>item.source_page===current?.page).map(item=>'/osce-pro-max/images/'+item.file)
 const images=(indexedImages.length?indexedImages:current?.images?.length?current.images:current?.image?[current.image]:[]).filter(src=>!failedImages[src])
 const go=(next:number)=>{if(!filtered.length)return;setIndex((next+filtered.length)%filtered.length);setRevealed(false)}
 const rate=(rating:Rating)=>{if(current){setRatings(prev=>({...prev,[current.page]:rating}));setSession(prev=>prev.includes(current.page)?prev:[...prev,current.page])}go(index+1)}
 const answer=cleanText(current?.text||'')
 return <main dir="rtl" className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:py-10">
  <header className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-primary">Azhar Med Quiz · Surgery</p><h1 className="mt-1 text-3xl font-bold">OSCE Pro Max · Anki</h1><p className="mt-2 text-sm text-muted-foreground">Review flashcards: answer before revealing the source, then rate your recall.</p></div><Link href="/practical" className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-muted"><ArrowRight className="size-4"/> Back to Practical</Link></header>
  <div className="grid gap-3 sm:grid-cols-3">
   <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">Cards in chapter</p><p className="mt-1 text-2xl font-bold">{filtered.length}</p></div>
   <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">Reviewed this session</p><p className="mt-1 text-2xl font-bold">{session.length}</p></div>
   <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">Session ratings</p><p className="mt-1 text-2xl font-bold">{Object.keys(ratings).length}</p></div>
  </div>
  <div className="grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
   <aside className="space-y-3"><input value={query} onChange={e=>{setQuery(e.target.value);setIndex(0);setRevealed(false)}} placeholder="Search text or page number..." className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm"/><div className="rounded-xl border bg-card p-2"><p className="px-2 py-2 text-xs font-bold text-muted-foreground">Choose a chapter</p><div className="max-h-[55vh] space-y-1 overflow-y-auto">{chapters.map(c=><button key={c} onClick={()=>{setChapter(c);setIndex(0);setRevealed(false)}} className={'w-full rounded-lg px-3 py-2 text-right text-sm '+(chapter===c?'bg-primary text-primary-foreground':'hover:bg-muted')}>{c}</button>)}</div></div></aside>
   <section className="min-w-0">{!data?<div className="rounded-xl border p-8 text-center">Loading flashcards…</div>:current?<article className="overflow-hidden rounded-2xl border bg-card shadow-sm">
    <div className="flex items-center justify-between border-b px-4 py-3"><b className="text-primary">{current.chapter}</b><span className="text-sm text-muted-foreground">Card {index+1} / {filtered.length} · Source page {current.page}</span></div>
    <div className="space-y-5 p-3 sm:p-6">
     {images.length>0&&<div className="space-y-3">{images.map((src,i)=><a key={src} href={src} target="_blank" rel="noreferrer" className="group relative flex min-h-[220px] items-center justify-center overflow-hidden rounded-2xl border bg-white p-2 sm:p-4"><img src={src} alt={'OSCE visual recall — source page '+current.page+' image '+(i+1)} loading="eager" onError={()=>setFailedImages(prev=>({...prev,[src]:true}))} className="h-auto max-h-[78vh] w-full object-contain transition-transform duration-200 group-hover:scale-[1.015]"/><span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">Click image to zoom</span></a>)}</div>}
     {images.length===0&&<div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">No image available for this page. The source text and page number are still available.</div>}
     <div className="rounded-xl border-2 border-primary/20 bg-background p-5 shadow-sm sm:p-7"><p className="text-xs font-semibold text-primary">Question</p><h2 className="mt-3 text-xl font-bold leading-9 sm:text-2xl">{makePrompt(current)}</h2><p className="mt-2 text-xs text-muted-foreground">Try to answer aloud or write your answer before revealing it.</p></div>
     {revealed?<div className="rounded-xl border p-5"><div className="mb-3 flex items-center justify-between"><h3 className="font-bold">Answer · formatted source text</h3><button onClick={()=>setRevealed(false)} className="rounded-lg border px-3 py-1.5 text-sm"><EyeOff className="ml-1 inline size-4"/> Hide answer</button></div><div className="whitespace-pre-wrap text-[15px] leading-8 tracking-[0.01em]">{answer||'لا يوجد نص OCR لهذه الصفحة؛ اعتمد على الصورة الأصلية.'}</div><p className="mt-4 border-t pt-3 text-xs text-muted-foreground">Text was extracted automatically and may contain OCR errors. Check the original image if anything seems incorrect.</p></div>:<button onClick={()=>setRevealed(true)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground"><Eye className="size-4"/> Reveal answer</button>}
     {revealed&&<div className="grid gap-2 sm:grid-cols-3"><button onClick={()=>rate('again')} className="rounded-xl border px-3 py-3 text-sm font-semibold hover:bg-muted">🔁 مرة تانية</button><button onClick={()=>rate('good')} className="rounded-xl border px-3 py-3 text-sm font-semibold hover:bg-muted">👍 كويس</button><button onClick={()=>rate('easy')} className="rounded-xl border px-3 py-3 text-sm font-semibold hover:bg-muted">✨ سهل</button></div>}
    </div>
    <footer className="flex items-center justify-between border-t p-3"><button onClick={()=>go(index-1)} className="rounded-lg border px-3 py-2 text-sm"><ChevronRight className="inline size-4"/> السابق</button><button onClick={()=>{setIndex(0);setRevealed(false);setSession([]);setRatings({})}} className="rounded-lg border px-3 py-2 text-sm"><RotateCcw className="ml-1 inline size-4"/> Restart session</button><button onClick={()=>go(index+1)} className="rounded-lg border px-3 py-2 text-sm">التالي <ChevronLeft className="inline size-4"/></button></footer>
   </article>:<div className="rounded-xl border p-8 text-center">No matching cards.</div>}</section>
  </div>
  <p className="text-xs text-muted-foreground">قسم مستقل. لم يتم تعديل ملف عملي الأدوات أو بياناته. التقييمات الحالية داخل الجلسة فقط، ولا تُحفظ بعد إغلاق الصفحة.</p>
 </main>
}
