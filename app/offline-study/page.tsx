import type { Metadata } from 'next'
import OfflineStudyClient from './offline-study-client'

export const metadata: Metadata = { title: 'Offline Study' }

export default function OfflineStudyPage() {
  return <OfflineStudyClient />
}
