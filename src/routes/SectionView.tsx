import { useParams } from 'react-router-dom'
import { WorkspaceView } from '@/components/workspace/WorkspaceView'
import { StudyView } from '@/components/study/StudyView'
import { MediaView } from '@/components/media/MediaView'
import { CsvView } from '@/components/csv/CsvView'
import { SettingsView } from '@/components/settings/SettingsView'
import type { AppSection } from '@/types'

const VIEW_MAP: Record<AppSection, React.ComponentType> = {
  workspace: WorkspaceView,
  study: StudyView,
  media: MediaView,
  csv: CsvView,
  settings: SettingsView,
}

export function SectionView() {
  const { section } = useParams<{ section?: string }>()
  const key = (section ?? 'workspace') as AppSection
  const View = VIEW_MAP[key] ?? WorkspaceView
  return <View />
}
