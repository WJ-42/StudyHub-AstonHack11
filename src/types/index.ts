export type AppSection = 'workspace' | 'study' | 'media' | 'csv' | 'settings'

export const SECTIONS: { id: AppSection; label: string }[] = [
  { id: 'workspace', label: 'Workspace' },
  { id: 'study', label: 'Study Modes' },
  { id: 'media', label: 'Media Player Hub' },
  { id: 'csv', label: 'CSV Visualizer' },
  { id: 'settings', label: 'Settings' },
]
