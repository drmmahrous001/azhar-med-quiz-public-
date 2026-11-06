import { ModuleLanding } from '@/components/dashboard/module-landing'
export default async function SemesterModulePage({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params
 return <ModuleLanding module={slug} />
}