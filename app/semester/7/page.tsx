import { Dashboard } from '@/components/dashboard/dashboard'
import { getChapters, getIdsByChapter, studentQuestions, study } from '@/lib/bank'

export default function SemesterSevenPage() {
  const essayCount = study.essays.reduce((sum, section) => sum + section.items.length, 0)
  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-8 md:py-12">
      <div dir="rtl"><p className="text-sm font-semibold text-primary">الفرقة الرابعة · الترم السابع</p><h1 className="mt-2 text-3xl font-bold">موديول الجراحة</h1><p className="mt-2 text-sm text-muted-foreground">بنك أسئلة الجراحة والمراجعة العملية.</p></div>
      <Dashboard chapters={getChapters()} idsByChapter={getIdsByChapter()} totalAvailable={studentQuestions.length} essayCount={essayCount} checklistCount={study.checklists.length}/>
    </main>
  )
}
