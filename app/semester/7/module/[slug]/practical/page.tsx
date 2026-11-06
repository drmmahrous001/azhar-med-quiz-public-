import Link from 'next/link'
export default async function ModulePracticalPage({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params
 const name=slug.split('-').map(s=>s.charAt(0).toUpperCase()+s.slice(1)).join(' ')
 return <main dir="rtl" className="mx-auto max-w-5xl space-y-5 px-4 py-10"><Link href={`/semester/7/module/${slug}`} className="text-sm text-primary">← رجوع للموديول</Link><p className="text-sm font-semibold text-muted-foreground">الفرقة الرابعة · الترم السابع</p><h1 className="text-3xl font-bold">Practical — {name}</h1><section className="rounded-2xl border bg-card p-6"><p className="text-sm leading-7 text-muted-foreground">صفحة العملي مستقلة للموديول ده. المحتوى العملي هيتضاف لما تبعته.</p></section></main>
}