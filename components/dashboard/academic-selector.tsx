'use client'
import Link from 'next/link'
import { useState } from 'react'
import { GraduationCap, BookOpen, ArrowLeft } from 'lucide-react'

const years=[{name:'الأولى',terms:[1,2]},{name:'الثانية',terms:[3,4]},{name:'الثالثة',terms:[5,6]},{name:'الرابعة',terms:[7,8]},{name:'الخامسة',terms:[9,10]}]
const modules=['Surgery 1','Endocrine','Pediatrics','Infection']
export function AcademicSelector({mode}:{mode:'practice'|'study'}) {
 const [year,setYear]=useState<number|null>(null)
 const [term,setTerm]=useState<number|null>(null)
 const [module,setModule]=useState<string|null>(null)
 const action=mode==='practice'?'اختبر نفسك':'المذاكرة'
 const slug=(s:string)=>s.toLowerCase().replace(/\s+/g,'-')
 return <main dir="rtl" className="mx-auto max-w-5xl space-y-7 px-4 py-8 md:py-12">
  <section className="rounded-3xl border bg-card p-6 md:p-8"><div className="flex items-center gap-3 text-primary"><GraduationCap/><span className="font-semibold">منصة أسئلة كلية الطب</span></div><h1 className="mt-3 text-3xl font-bold">{action}</h1><p className="mt-2 text-muted-foreground">اختار الفرقة ثم الترم ثم الموديول للبدء.</p></section>
  <section className="space-y-3"><h2 className="text-xl font-bold">١. اختار الفرقة</h2><div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{years.map((y,i)=><button key={i} onClick={()=>{setYear(i+1);setTerm(null);setModule(null)}} className={'rounded-xl border p-4 font-semibold '+(year===i+1?'border-primary bg-primary/10 text-primary':'bg-card')}>الفرقة {y.name}</button>)}</div></section>
  {year&&<section className="space-y-3"><h2 className="text-xl font-bold">٢. اختار الترم</h2><div className="grid grid-cols-2 gap-3">{years[year-1].terms.map(t=><button key={t} onClick={()=>{setTerm(t);setModule(null)}} className={'rounded-xl border p-4 font-semibold '+(term===t?'border-primary bg-primary/10 text-primary':'bg-card')}>الترم {t}</button>)}</div></section>}
  {term&&<section className="space-y-3"><h2 className="text-xl font-bold">٣. اختار الموديول</h2><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{(term===7?modules:[]).map(m=><Link key={m} href={m==='Surgery 1'?'/semester/7':`/semester/7/module/${slug(m)}`} className="rounded-xl border bg-card p-4 text-center font-semibold transition hover:border-primary hover:bg-primary/10">{m}</Link>)}</div>{term!==7&&<p className="text-sm text-muted-foreground">لسه محتوى الترم ده ما اتضافش.</p>}</section>}

 </main>
}